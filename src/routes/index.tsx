import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Shield, BarChart3, FileCheck, Users, Globe, Zap, CheckCircle, Building2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: 'Spend4Good — Transparent Spend Tracking for Nonprofits' },
      { name: 'description', content: 'Spend4Good helps funders and nonprofits track every rand transparently. Approve expenses, manage projects, and build trust.' },
    ],
  }),
})

function LandingPage() {
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
          Transparent Spend Tracking
        </div>
        <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
          Track every rand.
          <br />
          <span className="text-[oklch(0.5_0_0)]">Build donor trust.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[oklch(0.5_0_0)]">
          Spend4Good connects funders and nonprofits on one platform. Funders invite projects, approve expenses, and see exactly where every cent goes. Nonprofits upload receipts, manage budgets, and report transparently.
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

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-8 py-24 md:px-16">
        <p className="text-center text-xs font-medium tracking-widest uppercase text-[oklch(0.4_0_0)]">
          How it works
        </p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight md:text-4xl">
          Two paths, one platform
        </h2>

        <div className="mt-16 grid gap-12 md:grid-cols-2">
          {/* Funder Flow */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-[oklch(0.8_0_0)]">
              <Building2 className="mr-2 inline h-5 w-5" /> Funder Flow
            </h3>
            <div className="space-y-4">
              {[
                { step: '1', text: 'Self-register your organization' },
                { step: '2', text: 'Choose a plan and pay' },
                { step: '3', text: 'Invite nonprofits to your projects' },
                { step: '4', text: 'Approve or reject uploaded documents' },
                { step: '5', text: 'Draw reports and track spend' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[oklch(0.25_0_0)] bg-[oklch(0.1_0_0)] text-sm font-bold">
                    {s.step}
                  </div>
                  <p className="pt-1 text-sm text-[oklch(0.6_0_0)]">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Non-Profit Flow */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-[oklch(0.8_0_0)]">
              <Heart className="mr-2 inline h-5 w-5" /> Non-Profit Flow
            </h3>
            <div className="space-y-4">
              {[
                { step: '1', text: 'Get invited by a funder — or self-register and pay' },
                { step: '2', text: 'Add your team members' },
                { step: '3', text: 'Create or join projects' },
                { step: '4', text: 'Upload receipts, invoices, and allocations' },
                { step: '5', text: 'Funder approves documents and tracks spend' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[oklch(0.25_0_0)] bg-[oklch(0.1_0_0)] text-sm font-bold">
                    {s.step}
                  </div>
                  <p className="pt-1 text-sm text-[oklch(0.6_0_0)]">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-[oklch(0.2_0_0)] to-transparent" />

      {/* Features */}
      <section className="mx-auto max-w-5xl px-8 py-24 md:px-16">
        <p className="text-center text-xs font-medium tracking-widest uppercase text-[oklch(0.4_0_0)]">
          Everything you need
        </p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight md:text-4xl">
          Financial transparency, simplified
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { icon: FileCheck, title: 'Receipt Tracking', desc: 'Upload receipts, invoices, and allocations. Documents are logged, categorized, and ready for approval.' },
            { icon: Shield, title: 'Approval Workflows', desc: 'Funders approve or reject expenses with full audit trails and rejection reasons.' },
            { icon: BarChart3, title: 'Budget Visibility', desc: 'Real-time dashboards show spent vs. remaining budgets per project.' },
            { icon: Users, title: 'Role-Based Access', desc: 'Funders, project managers, accountants, and field agents — each sees only what they need.' },
            { icon: Globe, title: 'Multi-Currency', desc: 'Track expenses in ZAR, USD, KES, or EUR. Built for cross-border operations.' },
            { icon: Zap, title: 'WhatsApp Integration', desc: 'Field agents submit receipts via WhatsApp bot. No app downloads needed.' },
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
      <section className="mx-auto max-w-5xl px-8 py-24 md:px-16">
        <p className="text-center text-xs font-medium tracking-widest uppercase text-[oklch(0.4_0_0)]">
          Pricing
        </p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight md:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[oklch(0.45_0_0)]">
          Invited by a funder? You pay nothing. Self-registering? Choose the plan that fits.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {/* Free / Invited */}
          <div className="rounded-2xl border border-[oklch(0.15_0_0)] bg-[oklch(0.06_0_0)] p-8">
            <div className="mb-1 text-xs font-medium uppercase tracking-widest text-[oklch(0.4_0_0)]">Invited</div>
            <div className="text-4xl font-bold">Free</div>
            <p className="mt-2 text-sm text-[oklch(0.45_0_0)]">For nonprofits invited by a funder. No payment needed.</p>
            <div className="my-6 h-px bg-[oklch(0.15_0_0)]" />
            <ul className="space-y-3">
              {['Upload documents', 'Manage team', 'View project budgets', 'WhatsApp submissions'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[oklch(0.6_0_0)]">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[oklch(0.6_0.19_163)]" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/onboarding" search={{ type: 'invited' }} className="mt-8 block">
              <Button variant="outline" className="w-full border-[oklch(0.25_0_0)] bg-transparent text-[oklch(0.95_0_0)] hover:bg-[oklch(0.12_0_0)]">
                I've been invited
              </Button>
            </Link>
          </div>

          {/* Starter */}
          <div className="rounded-2xl border border-[oklch(0.3_0_0)] bg-[oklch(0.08_0_0)] p-8 ring-1 ring-[oklch(0.2_0_0)]">
            <div className="mb-1 text-xs font-medium uppercase tracking-widest text-[oklch(0.6_0_0)]">Starter</div>
            <div className="text-4xl font-bold">R499<span className="text-lg font-normal text-[oklch(0.4_0_0)]">/mo</span></div>
            <p className="mt-2 text-sm text-[oklch(0.45_0_0)]">For small nonprofits and community projects self-registering.</p>
            <div className="my-6 h-px bg-[oklch(0.15_0_0)]" />
            <ul className="space-y-3">
              {['Up to 5 projects', 'Up to 10 team members', 'Document approvals', 'Basic reports', 'Email support'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[oklch(0.6_0_0)]">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[oklch(0.6_0.19_163)]" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/onboarding" search={{ type: 'nonprofit' }} className="mt-8 block">
              <Button className="w-full bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] font-semibold">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Funder */}
          <div className="rounded-2xl border border-[oklch(0.15_0_0)] bg-[oklch(0.06_0_0)] p-8">
            <div className="mb-1 text-xs font-medium uppercase tracking-widest text-[oklch(0.4_0_0)]">Funder</div>
            <div className="text-4xl font-bold">R1,499<span className="text-lg font-normal text-[oklch(0.4_0_0)]">/mo</span></div>
            <p className="mt-2 text-sm text-[oklch(0.45_0_0)]">For funders managing multiple nonprofits and projects.</p>
            <div className="my-6 h-px bg-[oklch(0.15_0_0)]" />
            <ul className="space-y-3">
              {['Unlimited projects', 'Invite unlimited nonprofits', 'Approval workflows', 'Advanced reports & exports', 'Priority support', 'Add beneficiaries'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[oklch(0.6_0_0)]">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[oklch(0.6_0.19_163)]" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/onboarding" search={{ type: 'funder' }} className="mt-8 block">
              <Button variant="outline" className="w-full border-[oklch(0.25_0_0)] bg-transparent text-[oklch(0.95_0_0)] hover:bg-[oklch(0.12_0_0)]">
                Get Started
              </Button>
            </Link>
          </div>
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
        © {new Date().getFullYear()} Spend4Good. Transparent spend tracking for those who do good.
      </footer>
    </div>
  )
}
