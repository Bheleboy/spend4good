import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Shield, BarChart3, FileCheck, Users, Globe, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: 'Spend4Good — Nonprofit Spend Tracking' },
      { name: 'description', content: 'Transparent financial tracking for nonprofits. Track every rand, approve expenses, and build donor trust.' },
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
        <Link to="/login">
          <Button variant="outline" className="border-[oklch(0.3_0_0)] bg-transparent text-[oklch(0.95_0_0)] hover:bg-[oklch(0.15_0_0)]">
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-8 pb-24 pt-20 text-center md:px-16 md:pt-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] px-4 py-1.5 text-xs font-medium tracking-wide uppercase text-[oklch(0.6_0_0)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.6_0.19_163)]" />
          Built for Nonprofits
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
          Track every rand.
          <br />
          <span className="text-[oklch(0.5_0_0)]">Build donor trust.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[oklch(0.5_0_0)]">
          Spend4Good gives nonprofits, community projects, and social enterprises a simple way to track expenses, approve receipts, and report to funders — all in one place.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/login">
            <Button size="lg" className="bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] px-8 text-base font-semibold">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="lg" className="text-[oklch(0.5_0_0)] hover:text-[oklch(0.8_0_0)] hover:bg-transparent text-base">
            See how it works
          </Button>
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
            { icon: FileCheck, title: 'Receipt Tracking', desc: 'Field agents snap receipts via WhatsApp. Documents are logged, categorized, and ready for review.' },
            { icon: Shield, title: 'Approval Workflows', desc: 'Project managers and admins approve or reject expenses with full audit trails and rejection reasons.' },
            { icon: BarChart3, title: 'Budget Visibility', desc: 'Real-time dashboards show spent vs. remaining budgets per project. No surprises.' },
            { icon: Users, title: 'Role-Based Access', desc: 'Admins, project managers, accountants, funders, and field agents — each sees only what they need.' },
            { icon: Globe, title: 'Multi-Currency', desc: 'Track expenses in ZAR, USD, KES, or EUR. Built for organizations operating across borders.' },
            { icon: Zap, title: 'WhatsApp Integration', desc: 'Field agents submit receipts via WhatsApp bot. No app downloads, no training needed.' },
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

      {/* Who it's for */}
      <div className="mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-[oklch(0.2_0_0)] to-transparent" />

      <section className="mx-auto max-w-5xl px-8 py-24 md:px-16">
        <p className="text-center text-xs font-medium tracking-widest uppercase text-[oklch(0.4_0_0)]">
          Who it's for
        </p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight md:text-4xl">
          Built for those who do good
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {[
            { title: 'Nonprofits & NGOs', desc: 'Track project spending, generate donor reports, and maintain financial accountability with minimal overhead.' },
            { title: 'Community Projects', desc: 'From local feeding schemes to youth programs — manage budgets without spreadsheet chaos.' },
            { title: 'Social Enterprises', desc: 'Blend impact and finance tracking. Show funders exactly where every cent goes.' },
            { title: 'Funders & Donors', desc: 'View-only access to funded projects. See real receipts, real expenses, in real time.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[oklch(0.12_0_0)] bg-[oklch(0.06_0_0)] p-8">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[oklch(0.45_0_0)]">{item.desc}</p>
            </div>
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
        <Link to="/login" className="mt-8 inline-block">
          <Button size="lg" className="bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] px-10 text-base font-semibold">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[oklch(0.12_0_0)] px-8 py-8 text-center text-xs text-[oklch(0.35_0_0)]">
        © {new Date().getFullYear()} Spend4Good. Transparent spend tracking for those who do good.
      </footer>
    </div>
  )
}
