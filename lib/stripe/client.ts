import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
  typescript: true,
})

export const STRIPE_PRODUCTS = {
  free: 'joberlify_free',
  pro: 'joberlify_pro',
  global: 'joberlify_global',
  sponsorWatch: 'joberlify_sponsor_watch',
} as const

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  global: process.env.STRIPE_GLOBAL_PRICE_ID!,
  sponsorWatch: process.env.STRIPE_SPONSOR_WATCH_PRICE_ID!,
} as const
