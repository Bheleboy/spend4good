import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/refund-policy')({
  component: RefundPolicyPage,
  head: () => ({
    meta: [
      { title: 'Refund Policy — Spend4Good' },
      { name: 'description', content: 'Refund policy for Spend4Good annual plans and invited nonprofit accounts.' },
    ],
  }),
})

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-[oklch(0.95_0_0)]">{n}. {title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-[oklch(0.65_0_0)]">{children}</div>
    </section>
  )
}

function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
      <nav className="flex items-center justify-between px-8 py-6 md:px-16">
        <Link to="/" className="flex items-center gap-2 text-[oklch(0.5_0_0)] hover:text-[oklch(0.8_0_0)]">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Spend4Good</span>
        </Link>
      </nav>
      <article className="mx-auto max-w-3xl px-6 pb-24 md:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Refund Policy</h1>
        <p className="mt-2 text-sm text-[oklch(0.5_0_0)]">Last updated: 3 July 2026</p>

        <Section n={1} title="Annual Plans">
          <p>
            Spend4Good offers annual subscription plans billed in full at the time of purchase. If you are not satisfied
            with your subscription, you may request a full refund within 14 days of your initial purchase date by
            contacting us at{' '}
            <a href="mailto:hello@spend4good.com" className="text-[oklch(0.85_0_0)] underline">
              hello@spend4good.com
            </a>
            . No refund is available after the 14-day window has passed.
          </p>
        </Section>
        <Section n={2} title="Invited Nonprofits">
          <p>
            Nonprofits who join Spend4Good via a funder invitation are not charged. No payment is taken and no refund
            policy applies to invited nonprofit accounts.
          </p>
        </Section>
        <Section n={3} title="Renewals">
          <p>
            Annual subscriptions renew automatically on the anniversary of the purchase date. If you wish to cancel and
            avoid renewal, you must cancel before the renewal date via your account settings. Refunds are not available
            for renewal charges after the renewal date has passed.
          </p>
        </Section>
        <Section n={4} title="How to Request a Refund">
          <p>
            Email{' '}
            <a href="mailto:hello@spend4good.com" className="text-[oklch(0.85_0_0)] underline">
              hello@spend4good.com
            </a>{' '}
            with your organisation name and the email address used to sign up. We will process eligible refunds within
            5 business days via the original payment method through Paddle, our payment processor.
          </p>
        </Section>
        <Section n={5} title="Contact">
          <p>
            For any billing questions:{' '}
            <a href="mailto:hello@spend4good.com" className="text-[oklch(0.85_0_0)] underline">
              hello@spend4good.com
            </a>
          </p>
        </Section>
      </article>
    </div>
  )
}
