import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const supabase = createClient()

  // ── checkout.session.completed ──────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta    = session.metadata || {}

    // ── TICKET purchase ──────────────────────────────────────────────────────
    if (meta.type === 'ticket' && meta.eventId && meta.userId) {
      const amountPaid = session.amount_total || 0

      // Insert ticket
      const { data: ticket } = await supabase.from('tickets').insert({
        user_id:     meta.userId,
        event_id:    meta.eventId,
        amount:      amountPaid,
        status:      'paid',
        ticket_type: 'general',
        stripe_session_id: session.id,
      }).select().single()

      // Update event attendee count
      await supabase.rpc('increment_event_attendees', { eid: meta.eventId }).catch(() => {
        supabase.from('events').select('current_attendees').eq('id', meta.eventId).single().then(({ data }) => {
          supabase.from('events').update({ current_attendees: (data?.current_attendees || 0) + 1 }).eq('id', meta.eventId)
        })
      })

      // Send confirmation email
      if (ticket && session.customer_email) {
        const { data: ev } = await supabase.from('events').select('title, start_time, users(full_name)').eq('id', meta.eventId).single()
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type:    'paid_ticket',
            to:      session.customer_email,
            eventId: meta.eventId,
            ticketId: ticket.id,
            amount:  amountPaid,
          }),
        }).catch(() => {})
      }
    }

    // ── PLAN subscription ─────────────────────────────────────────────────────
    if (meta.type === 'plan' && meta.userId && meta.planId) {
      const isPremiumPlus = meta.planId === 'premium_plus'
      await supabase.from('users').update({
        is_premium:    true,
        premium_tier:  meta.planId,
        premium_since: new Date().toISOString(),
        stripe_customer_id: session.customer as string,
      }).eq('id', meta.userId)
    }
  }

  // ── customer.subscription.deleted (cancellation) ────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    await supabase.from('users').update({
      is_premium:   false,
      premium_tier: null,
    }).eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ received: true })
}
