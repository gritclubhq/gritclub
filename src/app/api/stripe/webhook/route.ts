import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: any

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { eventId, userId, tier, replayAccess } = session.metadata

    // Create ticket record
    await supabase.from('tickets').insert({
      user_id: userId,
      event_id: eventId,
      amount: session.amount_total,
      status: 'paid',
      replay_access: replayAccess === 'true',
      stripe_session_id: session.id,
    })

    // Update event total_sold
    await supabase.rpc('increment_event_tickets', { event_id: eventId })
  }

  return NextResponse.json({ received: true })
}
