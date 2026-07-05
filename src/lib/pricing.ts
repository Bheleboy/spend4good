// Single source of truth for Spend4Good pricing.
// All prices are USD, billed annually.
//
// IMPORTANT: after creating each Product and Price in the Paddle dashboard
// (one Price per PlanId, annual billing), paste the resulting Paddle Price ID
// (format pri_xxxxx) into the matching paddlePriceId field below.

export type PlanId =
  | 'nonprofit_starter'
  | 'funder_starter'
  | 'funder_growth'
  | 'funder_unlimited'

export interface Plan {
  id: PlanId
  name: string
  audience: 'nonprofit' | 'funder'
  priceUSD: number
  billingPeriod: 'year'
  npoLimit: number | null
  projectLimit: number | null
  features: string[]
  highlight?: boolean
  paddlePriceId: string
}

export const PLANS: Plan[] = [
  {
    id: 'nonprofit_starter',
    name: 'Nonprofit Starter',
    audience: 'nonprofit',
    priceUSD: 149,
    billingPeriod: 'year',
    npoLimit: 1,
    projectLimit: 4,
    features: [
      'Up to 4 active projects',
      'Unlimited team members',
      'Document vault',
      'WhatsApp uploads',
      'AI-assisted compliance reporting',
      'Full spend reporting',
    ],
    highlight: true,
    paddlePriceId: 'pro_01kwpp91p472za95c5qnx5encd',
  },
  {
    id: 'funder_starter',
    name: 'Funder Starter',
    audience: 'funder',
    priceUSD: 999,
    billingPeriod: 'year',
    npoLimit: 10,
    projectLimit: 4,
    features: [
      'Up to 10 nonprofits',
      '4 projects per nonprofit',
      'Invite & manage nonprofits free of charge',
      'Portfolio compliance dashboard',
      'WhatsApp reporting',
    ],
    highlight: true,
    paddlePriceId: 'pro_01kwppa1z6q21fjcycvb8v8q5j',
  },
  {
    id: 'funder_growth',
    name: 'Funder Growth',
    audience: 'funder',
    priceUSD: 1999,
    billingPeriod: 'year',
    npoLimit: 30,
    projectLimit: null,
    features: [
      'Up to 30 nonprofits',
      'Configurable project limits',
      'Advanced reporting & exports',
      'Priority support',
    ],
    paddlePriceId: 'pro_01kwppavr6g7hpef9gs93xt5xa',
  },
  {
    id: 'funder_unlimited',
    name: 'Funder Unlimited',
    audience: 'funder',
    priceUSD: 3499,
    billingPeriod: 'year',
    npoLimit: null,
    projectLimit: null,
    features: [
      'Unlimited nonprofits',
      'Unlimited projects',
      'Advanced reporting & exports',
      'Dedicated support',
      'Early access to new jurisdiction compliance packs',
    ],
    paddlePriceId: 'pro_01kwppbnxzsn2avzev27zn30cj',
  },
]

export function formatPrice(usd: number): string {
  return `$${usd.toLocaleString('en-US')}/year`
}

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}

export function plansForAudience(audience: 'nonprofit' | 'funder'): Plan[] {
  return PLANS.filter((p) => p.audience === audience)
}

export const ZAR_PRICES: Record<PlanId, number> = {
  nonprofit_starter: 2490,
  funder_starter: 17900,
  funder_growth: 35900,
  funder_unlimited: 62900,
}

export function formatPriceLocalized(plan: Plan, isSA: boolean): string {
  if (isSA) return `R${ZAR_PRICES[plan.id].toLocaleString('en-ZA')}/year`
  return `$${plan.priceUSD.toLocaleString('en-US')}/year`
}

