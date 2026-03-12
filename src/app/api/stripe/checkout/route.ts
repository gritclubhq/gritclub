import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { eventId, tier, userId } = await req.json()
    const supabase = createClient()

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('email, stripe_id')
      .eq('id', userId)
      .single()

    // Calculate price based on tier
    const price = tier === 'vip' ? event.price * 3 : event.price
    const replayAccess = tier === 'vip'

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user?.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${event.title} — ${tier === 'vip' ? 'VIP Access' : 'Basic Access'}`,
              description: tier === 'vip'
                ? 'Lifetime replay + networking lounge + direct Q&A'
                : 'Live stream + 7-day replay',
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        userId,
        tier,
        replayAccess: replayAccess.toString(),
      },
      success_url: `${appUrl}/events/${eventId}?success=1`,
      cancel_url: `${appUrl}/events/${eventId}?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
