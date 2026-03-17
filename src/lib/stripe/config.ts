import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// Client-side Stripe promise
let stripePromise: ReturnType<typeof loadStripe>
export const getStripe = () => { 
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Platform fee: GritClub takes 20%, host keeps 80%
export const PLATFORM_FEE_PERCENT = 20
export const HOST_PAYOUT_PERCENT = 80
