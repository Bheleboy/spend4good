import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Shield, FileCheck, Users, Zap, CheckCircle, Building2, Heart, MessageCircle, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS, formatPriceLocalized, type Plan } from '@/lib/pricing'
import { useCountry } from '@/hooks/use-country'

export const Route = createFileRoute('/')({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Spend4Good — South Africa's Nonprofit Compliance and Spend Platform" },
      { name: 'description', content: "Spend4Good is South Africa's only nonprofit spend tracking and compliance platform. Built for DSD, CIPC, POPIA, and WhatsApp field submissions." },
      { property: 'og:title', content: "Spend4Good — South Africa's Nonprofit Compliance and Spend Platform" },
      { property: 'og:description', content: "Built for South African nonprofits. Track spend. Stay compliant. DSD, CIPC, POPIA, and WhatsApp field submissions." },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})

function LandingPage() {
  const { isSA } = useCountry()

  return (
    <div className="min-h-screen bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 md:px-16 lg:px-24">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.95_0_0)]">
            <span className="text-lg font-black text-[oklch(0.03_0_0)]">S4</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Spend4Good</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/onboarding" search={{ type: 'invited' }}>
            <Button variant="ghost" className="text-[oklch(0.5_0_0)] hover:text-[oklch(0.8_0_0)] hover:bg-transparent text-sm">
              I've been invited
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" className="border-[oklch(0.3_0_0)] bg-transparent text-[oklch(0.95_0_0)] hover:bg-[oklch(0.15_0_0)]">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-8 pb-20 pt-20 text-center md:px-16 md:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] px-4 py-1.5 text-xs font-medium tracking-wide uppercase text-[oklch(0.6_0_0)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.6_0.19_163)]" />
          South African nonprofits only — global funders welcome
        </div>
        <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
          Built for South African nonprofits.
          <br />
          <span className="text-[oklch(0.5_0_0)]">Track spend. Stay compliant.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[oklch(0.5_0_0)]">
          Spend4Good is built specifically for DSD reporting, CIPC compliance, and WhatsApp-based field submissions across all nine provinces.
        </p>
      </section>

      {/* Two Paths CTA */}
      <section className="mx-auto max-w-4xl px-8 pb-24 md:px-16">
        <p className="mb-8 text-center text-xs font-medium tracking-widest uppercase text-[oklch(0.4_0_0)]">
          Get started
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Funder */}
          <Link to="/onboarding" search={{ type: 'funder' }} className="group">
            <div className="flex h-full flex-col items-center rounded-2xl border border-[oklch(0.15_0_0)] bg-[oklch(0.06_0_0)] p-10 text-center transition-all hover:border-[oklch(0.3_0_0)] hover:bg-[oklch(0.08_0_0)]">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.95_0_0)]">
                <Building2 className="h-8 w-8 text-[oklch(0.03_0_0)]" />
              </div>
              <h3 className="text-2xl font-bold">I'm a Funder</h3>
              <p className="mt-3 text-sm leading-relaxed text-[oklch(0.45_0_0)]">
                Register your organization, invite nonprofits to your projects, approve expenses, and draw reports on where every cent goes.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[oklch(0.7_0_0)] group-hover:text-[oklch(0.95_0_0)]">
                Get Started <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* Non-Profit */}
          <Link to="/onboarding" search={{ type: 'nonprofit' }} className="group">
            <div className="flex h-full flex-col items-center rounded-2xl border border-[oklch(0.15_0_0)] bg-[oklch(0.06_0_0)] p-10 text-center transition-all hover:border-[oklch(0.3_0_0)] hover:bg-[oklch(0.08_0_0)]">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.95_0_0)]">
                <Heart className="h-8 w-8 text-[oklch(0.03_0_0)]" />
              </div>
              <h3 className="text-2xl font-bold">I'm a Non-Profit</h3>
              <p className="mt-3 text-sm leading-relaxed text-[oklch(0.45_0_0)]">
                Self-register, add your team, create projects, upload receipts and invoices, and report transparently to your funders.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[oklch(0.7_0_0)] group-hover:text-[oklch(0.95_0_0)]">
                Get Started <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link to="/onboarding" search={{ type: 'invited' }}>
            <Button variant="ghost" className="text-[oklch(0.5_0_0)] hover:text-[oklch(0.8_0_0)] hover:bg-transparent text-sm underline underline-offset-4">
              Been invited by a funder? Click here →
            </Button>
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-[oklch(0.2_0_0)] to-transparent" />

      {/* Features */}
      <section className="mx-auto max-w-5xl px-8 py-24 md:px-16">
        <p className="text-center text-xs font-medium tracking-widest uppercase text-[oklch(0.4_0_0)]">
          Built for South Africa
        </p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight md:text-4xl">
          Compliance and spend, done properly
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { icon: FileCheck, title: 'DSD Compliance Reports', desc: 'AI-generated narrative reports ready for Department of Social Development submission. Never miss a filing deadline.' },
            { icon: MessageCircle, title: 'WhatsApp Expense Submissions', desc: 'Field workers submit receipts via WhatsApp from any phone, anywhere in SA. No app download required.' },
            { icon: Building2, title: 'Funder Portfolio Dashboard', desc: 'Corporate CSI desks and foundations see real spend data and compliance status for every NPO they fund.' },
            { icon: CalendarClock, title: 'CIPC & Section 18A Tracking', desc: 'Automated deadline calendar for beneficial ownership filings, Section 18A renewals, POPIA reviews, and more.' },
            { icon: Users, title: 'Invite NPOs Free', desc: 'Funders invite their grantees at no cost to the NPO. Build a trust portfolio with one click.' },
            { icon: Shield, title: 'Bank-Grade Security', desc: 'Row-level security ensures each organisation sees only their own data. POPIA-compliant infrastructure.' },
          ].map((f) => (
            <div key={f.title} className="group rounded-2xl border border-[oklch(0.12_0_0)] bg-[oklch(0.06_0_0)] p-6 transition-colors hover:border-[oklch(0.2_0_0)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.12_0_0)]">
                <f.icon className="h-5 w-5 text-[oklch(0.6_0_0)]" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[oklch(0.45_0_0)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-[oklch(0.2_0_0)] to-transparent" />

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-8 py-24 md:px-16">
        <p className="text-center text-xs font-medium tracking-widest uppercase text-[oklch(0.4_0_0)]">
          Pricing
        </p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight md:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-[oklch(0.45_0_0)]">
          14-day free trial on any plan. Nonprofits invited by a funder pay nothing, ever.
        </p>
        <p className="mt-2 text-center text-xs text-[oklch(0.4_0_0)]">
          {isSA ? 'Prices shown in ZAR' : 'Prices shown in USD'}
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} isSA={isSA} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-8 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Ready to spend transparently?
        </h2>
        <p className="mt-4 text-[oklch(0.5_0_0)]">
          Join organizations already using Spend4Good to build trust with their donors and communities.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/onboarding" search={{ type: 'funder' }}>
            <Button size="lg" className="bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] px-8 text-base font-semibold">
              I'm a Funder <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/onboarding" search={{ type: 'nonprofit' }}>
            <Button variant="outline" size="lg" className="border-[oklch(0.3_0_0)] bg-transparent text-[oklch(0.95_0_0)] hover:bg-[oklch(0.15_0_0)] px-8 text-base">
              I'm a Non-Profit <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[oklch(0.12_0_0)] px-8 py-8 text-center text-xs text-[oklch(0.35_0_0)]">
        <div className="mb-2 flex items-center justify-center gap-4">
          <Link to="/terms" className="hover:text-[oklch(0.8_0_0)]">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-[oklch(0.8_0_0)]">Privacy</Link>
          <span>·</span>
          <Link to="/waitlist" className="hover:text-[oklch(0.8_0_0)]">Waitlist</Link>
        </div>
        © {new Date().getFullYear()} Spend4Good. Built in South Africa. Built for South African nonprofits.
      </footer>
      {/* Zap intentionally imported for future use */}
      <span className="hidden"><Zap className="hidden" /><CheckCircle className="hidden" /></span>
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
      <div className="text-3xl font-bold">
        {formatPriceLocalized(plan, isSA)}
      </div>
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
          Get Started
        </Button>
      </Link>
    </div>
  )
}
