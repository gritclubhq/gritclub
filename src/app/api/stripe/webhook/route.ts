import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

// Service role — bypasses RLS, only runs server-side in webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── checkout.session.completed ───────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta    = session.metadata || {}
    const type    = meta.type

    // ── PLAN purchase — only set is_premium after real Stripe payment ────────
    if (type === 'plan' && meta.userId && meta.planId) {
      await supabase.from('users').update({
        is_premium:          true,
        premium_tier:        meta.planId,
        premium_since:       new Date().toISOString(),
        stripe_customer_id:  session.customer as string,
      }).eq('id', meta.userId)

      console.log(`Premium granted to ${meta.userId} — plan: ${meta.planId}`)
    }

    // ── TICKET purchase ──────────────────────────────────────────────────────
    if (type === 'ticket' && meta.eventId && meta.userId) {
      const userId    = meta.userId
      const eventId   = meta.eventId
      const amount    = session.amount_total || 0
      const userEmail = session.customer_email || ''

      // Insert/update ticket
      const { data: ticket } = await supabase
        .from('tickets')
        .upsert({
          user_id:           userId,
          event_id:          eventId,
          amount,
          status:            'paid',
          ticket_type:       'general',
          stripe_session_id: session.id,
        }, { onConflict: 'user_id,event_id' })
        .select('id').single()

      // Increment attendees
      const { data: ev } = await supabase
        .from('events').select('current_attendees, total_sold').eq('id', eventId).single()
      if (ev) {
        await supabase.from('events').update({
          current_attendees: (ev.current_attendees || 0) + 1,
          total_sold:        (ev.total_sold || 0) + 1,
        }).eq('id', eventId)
      }

      // Send confirmation email (non-critical)
      if (userEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gritclub.live'
        const { data: evDetail } = await supabase
          .from('events').select('title, start_time, users(full_name, email)').eq('id', eventId).single()
        const { data: user } = await supabase.from('users').select('full_name').eq('id', userId).single()
        const host = (evDetail as any)?.users || {}

        await fetch(`${appUrl}/api/email`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'paid_ticket',
            to:   userEmail,
            data: {
              eventTitle: evDetail?.title || 'GritClub Event',
              eventDate:  evDetail?.start_time ? new Date(evDetail.start_time).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }) : '',
              hostName:   host.full_name || host.email?.split('@')[0] || 'GritClub Host',
              userName:   user?.full_name || userEmail.split('@')[0],
              ticketId:   ticket?.id || session.id,
              amount,
              appUrl,
            },
          }),
        }).catch(() => {})
      }
    }
  }

  // ── Subscription cancelled — revoke premium ──────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub        = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    await supabase.from('users').update({
      is_premium:   false,
      premium_tier: null,
    }).eq('stripe_customer_id', customerId)
    console.log(`Premium revoked for Stripe customer: ${customerId}`)
  }

  return NextResponse.json({ received: true })
}
