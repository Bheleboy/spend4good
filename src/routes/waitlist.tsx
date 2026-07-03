import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, Loader2, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { COUNTRIES, countryName } from '@/lib/countries'
import { useCountry } from '@/hooks/use-country'
import { toast } from 'sonner'

export const Route = createFileRoute('/waitlist')({
  component: WaitlistPage,
  validateSearch: (search: Record<string, unknown>): { country?: string } => ({
    country: typeof search.country === 'string' ? search.country : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Join the Waitlist — Spend4Good' },
      { name: 'description', content: "Spend4Good is currently focused on South African nonprofits. Join the waitlist and we'll notify you when we launch in your region." },
    ],
  }),
})

function WaitlistPage() {
  const { country: prefill } = Route.useSearch()
  const { country: detected } = useCountry()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [orgName, setOrgName] = useState('')
  const [country, setCountry] = useState(prefill || detected || 'ZA')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!prefill && detected) setCountry(detected)
  }, [prefill, detected])

  const submit = async () => {
    if (!email || !country) {
      toast.error('Email and country are required.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('waitlist').insert({
      email,
      country,
      org_name: orgName || null,
    })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setDone(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
      <nav className="flex items-center justify-between px-8 py-6 md:px-16">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4 text-[oklch(0.5_0_0)]" />
          <span className="text-sm text-[oklch(0.5_0_0)]">Back to Spend4Good</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[oklch(0.95_0_0)]">
            <span className="text-xs font-black text-[oklch(0.03_0_0)]">S4</span>
          </div>
          <span className="text-sm font-semibold">Spend4Good</span>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg border-[oklch(0.15_0_0)] bg-[oklch(0.06_0_0)] p-8 md:p-10">
          {done ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.6_0.19_163)]/15">
                <CheckCircle className="h-6 w-6 text-[oklch(0.6_0.19_163)]" />
              </div>
              <h1 className="text-2xl font-bold">You're on the list</h1>
              <p className="text-sm text-[oklch(0.6_0_0)]">
                We'll be in touch when {countryName(country)} launches.
              </p>
              <Link to="/">
                <Button className="bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)]">
                  Back to homepage
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Spend4Good is coming to your country</h1>
              <p className="mt-2 text-sm text-[oklch(0.6_0_0)]">
                We're currently focused on South African nonprofits. Join the waitlist and we'll notify you when we launch in your region.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="you@organization.org"
                      className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Organisation name</label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Your organisation (optional)"
                    className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="h-10 w-full rounded-md border border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] px-3 text-sm text-[oklch(0.95_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.3_0_0)]"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={submit}
                  disabled={submitting || !email}
                  className="w-full bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] font-semibold"
                >
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining…</> : 'Join the waitlist'}
                </Button>
                <button
                  onClick={() => navigate({ to: '/' })}
                  className="w-full text-xs text-[oklch(0.5_0_0)] hover:text-[oklch(0.8_0_0)]"
                >
                  Back to homepage
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
