import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: 'Terms of Service — Spend4Good' },
      { name: 'description', content: 'Terms of Service for Spend4Good, operated by Private Clients Advisory (Pty) Ltd.' },
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

function TermsPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
      <nav className="flex items-center justify-between px-8 py-6 md:px-16">
        <Link to="/" className="flex items-center gap-2 text-[oklch(0.5_0_0)] hover:text-[oklch(0.8_0_0)]">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Spend4Good</span>
        </Link>
      </nav>
      <article className="mx-auto max-w-3xl px-6 pb-24 md:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-[oklch(0.5_0_0)]">Last updated: 3 July 2026</p>

        <Section n={1} title="About Spend4Good">
          <p>Spend4Good is a nonprofit spend tracking and compliance management platform operated by Private Clients Advisory (Pty) Ltd, registered in South Africa. By using Spend4Good you agree to these terms.</p>
        </Section>
        <Section n={2} title="Accounts and Access">
          <ul className="list-disc space-y-1 pl-5">
            <li>You must provide accurate organisation details during registration.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>Funder accounts may invite nonprofit organisations who access the platform free of charge.</li>
            <li>Invited nonprofits are bound by these terms upon accepting their invitation.</li>
          </ul>
        </Section>
        <Section n={3} title="Subscriptions and Billing">
          <ul className="list-disc space-y-1 pl-5">
            <li>Paid plans are billed annually in USD via Paddle, our authorised payment processor and merchant of record.</li>
            <li>Paddle handles all payment processing, VAT, and tax compliance on our behalf.</li>
            <li>Subscriptions auto-renew annually unless cancelled before the renewal date.</li>
            <li>A 14-day free trial applies to all new paid plan registrations.</li>
            <li>Nonprofits invited by a funder access the platform at no charge for the duration of the funder relationship.</li>
            <li>Refunds are available within 14 days of initial purchase for annual plans.</li>
          </ul>
        </Section>
        <Section n={4} title="Data and Privacy">
          <ul className="list-disc space-y-1 pl-5">
            <li>We collect organisation details, financial records, and compliance documents you upload.</li>
            <li>Your data is stored securely on Supabase infrastructure.</li>
            <li>We do not sell your data to third parties.</li>
            <li>Financial and compliance data is accessible only to your organisation and funders you have explicitly linked to.</li>
            <li>See our <Link to="/privacy" className="text-[oklch(0.85_0_0)] underline">Privacy Policy</Link> for full details.</li>
          </ul>
        </Section>
        <Section n={5} title="WhatsApp Submissions">
          <ul className="list-disc space-y-1 pl-5">
            <li>Field workers may submit expense receipts and documents via WhatsApp to our registered Twilio number.</li>
            <li>By sending messages to this number you consent to those messages being stored and processed as part of your organisation's expense records.</li>
            <li>You are responsible for ensuring your team members are aware of this consent.</li>
          </ul>
        </Section>
        <Section n={6} title="Acceptable Use">
          <ul className="list-disc space-y-1 pl-5">
            <li>You may not use Spend4Good to submit fraudulent expenses or false compliance information.</li>
            <li>You may not attempt to access data belonging to other organisations.</li>
            <li>Accounts found to be in breach may be suspended without notice.</li>
          </ul>
        </Section>
        <Section n={7} title="Intellectual Property">
          <ul className="list-disc space-y-1 pl-5">
            <li>Spend4Good and its AI-generated reports remain the intellectual property of Private Clients Advisory (Pty) Ltd.</li>
            <li>AI-generated compliance report drafts are provided for your use and editing — we do not claim ownership of your submitted content.</li>
          </ul>
        </Section>
        <Section n={8} title="Limitation of Liability">
          <ul className="list-disc space-y-1 pl-5">
            <li>Spend4Good provides compliance report drafts as AI-generated starting points. These are not legal advice and must be reviewed before submission to DSD, CIPC, or any other regulatory body.</li>
            <li>We are not liable for any compliance outcomes resulting from reports generated on this platform.</li>
          </ul>
        </Section>
        <Section n={9} title="Governing Law">
          <p>These terms are governed by the laws of the Republic of South Africa.</p>
        </Section>
        <Section n={10} title="Contact">
          <p>For any questions: <a href="mailto:hello@spend4good.com" className="text-[oklch(0.85_0_0)] underline">hello@spend4good.com</a></p>
        </Section>
      </article>
    </div>
  )
}
