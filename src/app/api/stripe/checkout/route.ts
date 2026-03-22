import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventId, userId, userEmail, amount, eventName, planId } = body

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gritclub.live'

    // ── PLAN / SUBSCRIPTION purchase ─────────────────────────────────────────
    if (planId) {
      const PLANS: Record<string, { name: string; monthly: number; yearly: number; priceIdMonthly?: string; priceIdYearly?: string }> = {
        basic: {
          name: 'GritClub Basic',
          monthly: 1000,  // $10.00 in cents
          yearly:  7000,  // $70.00 in cents
        },
        premium_plus: {
          name: 'GritClub Premium Plus',
          monthly: 1700,  // $17.00 in cents
          yearly:  20400, // $204.00 in cents
        },
      }

      const plan = PLANS[planId]
      if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

      const isYearly = body.billing === 'yearly'
      const unitAmount = isYearly ? plan.yearly : plan.monthly
      const interval = isYearly ? 'year' : 'month'

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: userEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: isYearly
                  ? `Annual plan — save ${planId === 'basic' ? '42%' : '20%'}`
                  : 'Monthly plan — cancel anytime',
              },
              unit_amount: unitAmount,
              recurring: { interval },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId || '',
          planId,
          billing: isYearly ? 'yearly' : 'monthly',
          type: 'plan',
        },
        success_url: `${appUrl}/dashboard?plan_success=${planId}`,
        cancel_url:  `${appUrl}/pricing?cancelled=1`,
      })

      return NextResponse.json({ url: session.url })
    }

    // ── EVENT TICKET purchase ─────────────────────────────────────────────────
    const supabase = createClient()

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Stripe needs CENTS. If price stored as dollars (e.g. 5), multiply by 100.
    // If stored as cents already (e.g. 500), use as-is.
    // We detect: if price < 500, assume dollars; otherwise assume cents.
    const rawPrice = amount ?? event.price ?? 0
    const priceInCents = rawPrice < 500 ? Math.round(rawPrice * 100) : Math.round(rawPrice)

    if (priceInCents < 50) {
      return NextResponse.json({ error: 'Minimum charge is $0.50' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: eventName || event.title || 'GritClub Event',
              description: 'Live event access — GritClub',
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId: eventId || '',
        userId:  userId || '',
        type: 'ticket',
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
