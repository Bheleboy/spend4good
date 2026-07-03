import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: 'Privacy Policy — Spend4Good' },
      { name: 'description', content: 'How Spend4Good collects, uses, and protects your personal information under POPIA.' },
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

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
      <nav className="flex items-center justify-between px-8 py-6 md:px-16">
        <Link to="/" className="flex items-center gap-2 text-[oklch(0.5_0_0)] hover:text-[oklch(0.8_0_0)]">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Spend4Good</span>
        </Link>
      </nav>
      <article className="mx-auto max-w-3xl px-6 pb-24 md:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[oklch(0.5_0_0)]">Last updated: 3 July 2026</p>

        <Section n={1} title="Who We Are">
          <p>Private Clients Advisory (Pty) Ltd operates Spend4Good (spend4good.com). We are subject to the Protection of Personal Information Act (POPIA) of South Africa.</p>
        </Section>
        <Section n={2} title="What We Collect">
          <ul className="list-disc space-y-1 pl-5">
            <li>Organisation name, registration number, and contact details.</li>
            <li>Individual user names, email addresses, and phone/WhatsApp numbers.</li>
            <li>Financial data: expense amounts, descriptions, receipt images.</li>
            <li>Compliance documents you upload (audit reports, certificates, board resolutions).</li>
            <li>WhatsApp messages sent to our Twilio number for expense submission.</li>
            <li>Usage data and logs for platform improvement.</li>
          </ul>
        </Section>
        <Section n={3} title="How We Use Your Data">
          <ul className="list-disc space-y-1 pl-5">
            <li>To operate the Spend4Good platform and provide services you have requested.</li>
            <li>To send transactional emails (account confirmation, expense notifications, compliance reminders) via Resend.</li>
            <li>To process WhatsApp submissions via Twilio.</li>
            <li>To process payments via Paddle (our merchant of record).</li>
            <li>We do not use your data for advertising.</li>
          </ul>
        </Section>
        <Section n={4} title="Who We Share Data With">
          <ul className="list-disc space-y-1 pl-5">
            <li>Supabase: database and file storage infrastructure.</li>
            <li>Resend: transactional email delivery.</li>
            <li>Twilio: WhatsApp message processing.</li>
            <li>Paddle: payment processing and tax compliance.</li>
            <li>Funders linked to your organisation (limited to spend data and compliance status relevant to their funded projects).</li>
            <li>We do not sell data to any third party.</li>
          </ul>
        </Section>
        <Section n={5} title="Your Rights Under POPIA">
          <ul className="list-disc space-y-1 pl-5">
            <li>Right to access your personal information.</li>
            <li>Right to request correction of inaccurate information.</li>
            <li>Right to request deletion of your data (subject to legal retention requirements).</li>
            <li>To exercise these rights contact: <a href="mailto:hello@spend4good.com" className="text-[oklch(0.85_0_0)] underline">hello@spend4good.com</a>.</li>
          </ul>
        </Section>
        <Section n={6} title="Data Retention">
          <p>Financial and compliance records are retained for 7 years in line with South African accounting and tax requirements. Account data is deleted within 30 days of account closure on request.</p>
        </Section>
        <Section n={7} title="Security">
          <p>All data is encrypted at rest and in transit. Access is controlled via Row Level Security policies ensuring each organisation can only access their own data.</p>
        </Section>
        <Section n={8} title="Cookies">
          <p>We use only essential session cookies required for authentication. No advertising or tracking cookies.</p>
        </Section>
        <Section n={9} title="Changes to This Policy">
          <p>We will notify users of material changes via email to their registered address.</p>
        </Section>
        <Section n={10} title="Contact">
          <p>Privacy Officer: <a href="mailto:hello@spend4good.com" className="text-[oklch(0.85_0_0)] underline">hello@spend4good.com</a></p>
          <p>Private Clients Advisory (Pty) Ltd, Durban, KwaZulu-Natal, South Africa</p>
        </Section>
      </article>
    </div>
  )
}
