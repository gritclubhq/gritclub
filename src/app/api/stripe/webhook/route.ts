import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

// Use service role key here — webhook runs server-side, bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId    = session.metadata?.userId    || session.client_reference_id
    const eventId   = session.metadata?.eventId
    const userEmail = session.customer_email || session.metadata?.userEmail
    const amount    = session.amount_total || 0

    if (!userId || !eventId) {
      return NextResponse.json({ received: true })
    }

    // 1. Create ticket in Supabase
    const { data: ticket } = await supabase
      .from('tickets')
      .upsert({
        user_id:           userId,
        event_id:          eventId,
        amount:            amount,
        status:            'paid',
        ticket_type:       'general',
        stripe_session_id: session.id,
      }, { onConflict: 'user_id,event_id' })
      .select('id')
      .single()

    // 2. Increment event attendee count
    await supabase.rpc('increment_event_attendees', { p_event_id: eventId }).catch(() => {
      // Fallback if RPC doesn't exist
      supabase.from('events').select('current_attendees, total_sold').eq('id', eventId).single()
        .then(({ data: ev }) => {
          if (ev) supabase.from('events').update({
            current_attendees: (ev.current_attendees || 0) + 1,
            total_sold:        (ev.total_sold || 0) + 1,
          }).eq('id', eventId)
        })
    })

    // 3. Send confirmation email
    if (userEmail) {
      try {
        // Fetch event + user details for the email
        const [{ data: ev }, { data: user }] = await Promise.all([
          supabase.from('events').select('title, start_time, users(full_name, email)').eq('id', eventId).single(),
          supabase.from('users').select('full_name').eq('id', userId).single(),
        ])

        const host = (ev as any)?.users || {}
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gritclub.live'

        await fetch(`${appUrl}/api/email`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'paid_ticket',
            to:   userEmail,
            data: {
              eventTitle: ev?.title || 'GritClub Event',
              eventDate:  ev?.start_time ? new Date(ev.start_time).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }) : '',
              eventTime:  ev?.start_time ? new Date(ev.start_time).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }) : '',
              hostName:   host.full_name || host.email?.split('@')[0] || 'GritClub Host',
              userName:   user?.full_name || userEmail.split('@')[0],
              ticketId:   ticket?.id || session.id,
              amount,
              appUrl,
            },
          }),
        })
      } catch (emailErr) {
        // Email failure must never fail the webhook
        console.error('Failed to send paid ticket email:', emailErr)
      }
    }
  }

  return NextResponse.json({ received: true })
}
