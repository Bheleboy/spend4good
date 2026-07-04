import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS, formatPriceLocalized, type Plan } from '@/lib/pricing'
import { useCountry } from '@/hooks/use-country'

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: 'Pricing — Spend4Good' },
      { name: 'description', content: 'Annual plans for funders and nonprofits. Nonprofits invited by a funder pay nothing.' },
      { property: 'og:title', content: 'Pricing — Spend4Good' },
      { property: 'og:description', content: 'Annual plans for funders and nonprofits. Nonprofits invited by a funder pay nothing.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})

function PricingPage() {
  const { isSA } = useCountry()

  return (
    <div className="min-h-screen bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
      <nav className="flex items-center justify-between px-8 py-6 md:px-16 lg:px-24">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.95_0_0)]">
            <span className="text-lg font-black text-[oklch(0.03_0_0)]">S4</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Spend4Good</span>
        </Link>
        <Link to="/">
          <Button variant="outline" className="border-[oklch(0.3_0_0)] bg-transparent text-[oklch(0.95_0_0)] hover:bg-[oklch(0.15_0_0)]">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
      </nav>

      <section className="mx-auto max-w-3xl px-8 pb-8 pt-12 text-center md:px-16">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Transparent pricing</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[oklch(0.5_0_0)]">
          Annual plans for funders and nonprofits. Nonprofits invited by a funder pay nothing.
        </p>
        <p className="mt-2 text-xs text-[oklch(0.4_0_0)]">
          {isSA ? 'Prices shown in ZAR' : 'Prices shown in USD'}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-8 pb-24 md:px-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} isSA={isSA} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-8 pb-24 md:px-16">
        <h2 className="text-center text-2xl font-bold tracking-tight">Frequently asked</h2>
        <div className="mt-8 space-y-6 text-sm">
          <Faq q="Do you offer discounts for nonprofits?">
            Nonprofits invited by a funder on Spend4Good pay nothing for the duration of that funder relationship. Self-registered nonprofits use the Nonprofit Starter plan.
          </Faq>
          <Faq q="How is billing handled?">
            All paid plans are billed annually in USD via Paddle, our authorised payment processor and merchant of record. Paddle handles VAT and tax compliance globally.
          </Faq>
          <Faq q="Can I cancel?">
            Yes. Cancel any time before your annual renewal date and your plan will not renew. Refunds are available within 14 days of initial purchase.
          </Faq>
          <Faq q="Can I change plans later?">
            Yes. You can upgrade or downgrade at renewal, or contact us to prorate a mid-term change.
          </Faq>
        </div>
      </section>

      <footer className="border-t border-[oklch(0.12_0_0)] px-8 py-8 text-center text-xs text-[oklch(0.35_0_0)]">
        <div className="mb-2 flex items-center justify-center gap-4">
          <Link to="/terms" className="hover:text-[oklch(0.8_0_0)]">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-[oklch(0.8_0_0)]">Privacy</Link>
          <span>·</span>
          <Link to="/refund-policy" className="hover:text-[oklch(0.8_0_0)]">Refund Policy</Link>
        </div>
        © {new Date().getFullYear()} Spend4Good.
      </footer>
    </div>
  )
}

function PricingCard({ plan, isSA }: { plan: Plan; isSA: boolean }) {
  const audienceType = plan.audience === 'funder' ? 'funder' : 'nonprofit'
  return (
    <div className={`relative rounded-2xl border p-8 ${plan.highlight ? 'border-[oklch(0.3_0_0)] bg-[oklch(0.08_0_0)] ring-1 ring-[oklch(0.2_0_0)]' : 'border-[oklch(0.15_0_0)] bg-[oklch(0.06_0_0)]'}`}>
      {plan.highlight && (
        <div className="absolute -top-3 left-6 rounded-full bg-[oklch(0.6_0.19_163)] px-3 py-0.5 text-[10px] font-bold uppercase text-[oklch(0.03_0_0)]">
          Popular
        </div>
      )}
      <div className="mb-1 text-xs font-medium uppercase tracking-widest text-[oklch(0.4_0_0)]">{plan.name}</div>
      <div className="text-3xl font-bold">{formatPriceLocalized(plan, isSA)}</div>
      <p className="mt-2 text-sm text-[oklch(0.45_0_0)]">
        {plan.audience === 'funder'
          ? plan.npoLimit === null
            ? 'Unlimited nonprofits & projects.'
            : `Up to ${plan.npoLimit} nonprofits.`
          : 'For self-registered nonprofits.'}
      </p>
      <div className="my-6 h-px bg-[oklch(0.15_0_0)]" />
      <ul className="space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[oklch(0.6_0_0)]">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.6_0.19_163)]" /> {f}
          </li>
        ))}
      </ul>
      <Link to="/onboarding" search={{ type: audienceType }} className="mt-8 block">
        <Button className={`w-full font-semibold ${plan.highlight ? 'bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)]' : 'border border-[oklch(0.25_0_0)] bg-transparent text-[oklch(0.95_0_0)] hover:bg-[oklch(0.12_0_0)]'}`}>
          Get Started <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.06_0_0)] p-5">
      <h3 className="font-semibold text-[oklch(0.9_0_0)]">{q}</h3>
      <p className="mt-2 text-[oklch(0.55_0_0)]">{children}</p>
    </div>
  )
}
