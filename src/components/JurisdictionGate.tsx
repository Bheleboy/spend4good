import { useAuth } from '@/hooks/use-auth'
import { Link } from '@tanstack/react-router'
import { Globe, ArrowRight, CheckCircle } from 'lucide-react'

const ACCESSIBLE = [
  'Spend tracking',
  'Document vault',
  'Expense approval workflow',
  'WhatsApp submissions',
  'Funder reporting',
]

export function NonZaCompliancePlaceholder({ area }: { area: string }) {
  const { user } = useAuth()
  const country = user?.organization?.country ?? ''

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">South African Compliance Pack</h1>
          <p className="text-xs text-muted-foreground">{area}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Spend4Good's compliance features are built specifically for South African regulatory
        requirements — DSD narrative reports, CIPC beneficial ownership filings, Section 18A
        certificate tracking, and POPIA reviews.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-background/40 p-5">
        <p className="text-sm font-semibold text-foreground">What you have access to:</p>
        <ul className="mt-3 space-y-2">
          {ACCESSIBLE.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Compliance deadline tracking and AI report generation is currently available for South
        African registered nonprofits only.
      </p>

      <Link
        to="/waitlist"
        search={{ country: country || undefined }}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Join the waitlist for your country <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export function useIsZa(): { ready: boolean; isZa: boolean } {
  const { user, isLoading } = useAuth()
  const c = (user?.organization?.country ?? '').trim().toLowerCase()
  const isZa = c === 'za' || c === 'south africa' || c === ''
  return { ready: !isLoading, isZa }
}
