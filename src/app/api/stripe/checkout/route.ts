import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, billing, userId, userEmail, eventId, tier, amount, eventName } = body
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gritclub.live'

    // ── PLAN SUBSCRIPTION ────────────────────────────────────────────────────
    if (planId) {
      const PLANS: Record<string, { name: string; monthly: number; yearly: number }> = {
        basic:        { name: 'GritClub Basic',        monthly: 1000,  yearly: 7000  },
        premium_plus: { name: 'GritClub Premium Plus', monthly: 1700,  yearly: 20400 },
      }
      const plan = PLANS[planId]
      if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

      const isYearly = billing === 'yearly'
      const unitAmount = isYearly ? plan.yearly : plan.monthly

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: userEmail,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: isYearly
                ? `Annual plan — billed yearly`
                : 'Monthly plan — cancel anytime',
            },
            unit_amount: unitAmount,
            recurring: { interval: isYearly ? 'year' : 'month' },
          },
          quantity: 1,
        }],
        metadata: {
          userId:  userId || '',
          planId,
          billing: isYearly ? 'yearly' : 'monthly',
          type:    'plan',
        },
        success_url: `${appUrl}/dashboard?plan_success=${planId}`,
        cancel_url:  `${appUrl}/pricing?cancelled=1`,
      })

      return NextResponse.json({ url: session.url })
    }

    // ── EVENT TICKET ─────────────────────────────────────────────────────────
    const supabase = createClient()

    const { data: event } = await supabase
      .from('events').select('*').eq('id', eventId).single()

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const rawPrice = amount ?? event.price ?? 0
    // Detect if stored as dollars (< 500) or cents (>= 500)
    const priceInCents = rawPrice < 500 ? Math.round(rawPrice * 100) : Math.round(rawPrice)

    if (priceInCents < 50) return NextResponse.json({ error: 'Minimum charge is $0.50' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: eventName || event.title || 'GritClub Event',
            description: 'Live event access — GritClub',
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      }],
      metadata: {
        eventId: eventId || '',
        userId:  userId  || '',
        type:    'ticket',
      },
      success_url: `${appUrl}/events/${eventId}?success=1`,
      cancel_url:  `${appUrl}/events/${eventId}?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
