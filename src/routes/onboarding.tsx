import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Building2, Heart, Mail, Phone, User, CheckCircle } from 'lucide-react'

type OnboardingType = 'funder' | 'nonprofit' | 'invited'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
  validateSearch: (search: Record<string, unknown>): { type: OnboardingType } => ({
    type: (search.type as OnboardingType) || 'nonprofit',
  }),
  head: () => ({
    meta: [
      { title: 'Get Started — Spend4Good' },
      { name: 'description', content: 'Create your Spend4Good account and start tracking spend transparently.' },
    ],
  }),
})

function OnboardingPage() {
  const { type } = Route.useSearch()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    orgName: '',
    fullName: '',
    email: '',
    phone: '+27',
    inviteCode: '',
  })

  const totalSteps = type === 'invited' ? 2 : 3
  const label = type === 'funder' ? 'Funder' : type === 'nonprofit' ? 'Non-Profit' : 'Invited Non-Profit'
  const icon = type === 'funder' ? Building2 : Heart
  const Icon = icon

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const canNext = () => {
    if (step === 1) {
      if (type === 'invited') return form.inviteCode.length > 3
      return form.orgName.length > 1
    }
    if (step === 2) return form.fullName.length > 1 && form.phone.length > 7
    return true
  }

  const handleComplete = () => {
    // In production, this would call an API to register
    // For now, redirect to login for OTP verification
    navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-8 py-6 md:px-16">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4 text-[oklch(0.5_0_0)]" />
          <span className="text-sm text-[oklch(0.5_0_0)]">Back</span>
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
          {/* Header */}
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.15_0_0)]">
              <Icon className="h-5 w-5 text-[oklch(0.7_0_0)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{label} Registration</h1>
              <p className="text-xs text-[oklch(0.45_0_0)]">Step {step} of {totalSteps}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="my-6 flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-[oklch(0.95_0_0)]' : 'bg-[oklch(0.15_0_0)]'}`}
              />
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && type !== 'invited' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Tell us about your organization</h2>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Organization Name</label>
                <Input
                  value={form.orgName}
                  onChange={(e) => update('orgName', e.target.value)}
                  placeholder={type === 'funder' ? 'e.g. National Lotteries Commission' : 'e.g. Ubuntu Youth Foundation'}
                  className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                  <Input
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="admin@organization.co.za"
                    className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                  />
                </div>
              </div>
              {type === 'nonprofit' && (
                <div className="rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] p-4">
                  <p className="text-xs text-[oklch(0.45_0_0)]">
                    <strong className="text-[oklch(0.6_0_0)]">Self-registration</strong> — you'll select a plan after setting up your profile. If you were invited by a funder,{' '}
                    <Link to="/onboarding" search={{ type: 'invited' }} className="underline text-[oklch(0.7_0_0)]">
                      click here instead
                    </Link>.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 1 && type === 'invited' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Enter your invite code</h2>
              <p className="text-sm text-[oklch(0.45_0_0)]">
                Your funder should have shared an invite code or link with you. Enter it below to get started — no payment required.
              </p>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Invite Code</label>
                <Input
                  value={form.inviteCode}
                  onChange={(e) => update('inviteCode', e.target.value)}
                  placeholder="e.g. NLC-2026-ABCD"
                  className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)] text-center tracking-widest text-lg"
                />
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] p-4">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.6_0.19_163)]" />
                <p className="text-xs text-[oklch(0.45_0_0)]">
                  Invited nonprofits get full access at no cost. Your funder covers the platform.
                </p>
              </div>
            </div>
          )}

          {/* Step 2 - Contact details */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Your details</h2>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                  <Input
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    placeholder="Your full name"
                    className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                  <Input
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+27821234567"
                    className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                  />
                </div>
              </div>
              <p className="text-xs text-[oklch(0.4_0_0)]">
                We'll send an OTP to verify your phone number on the next step.
              </p>
            </div>
          )}

          {/* Step 3 - Plan selection (only for self-reg) */}
          {step === 3 && type !== 'invited' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Choose your plan</h2>
              <div className="space-y-3">
                {type === 'nonprofit' ? (
                  <>
                    <PlanCard
                      name="Starter"
                      price="R499/mo"
                      features={['Up to 5 projects', '10 team members', 'Basic reports']}
                      selected
                    />
                    <PlanCard
                      name="Growth"
                      price="R999/mo"
                      features={['Up to 20 projects', 'Unlimited team', 'Advanced reports']}
                    />
                  </>
                ) : (
                  <>
                    <PlanCard
                      name="Funder"
                      price="R1,499/mo"
                      features={['Unlimited projects', 'Invite nonprofits', 'Full reports & exports']}
                      selected
                    />
                    <PlanCard
                      name="Enterprise"
                      price="Custom"
                      features={['Custom integrations', 'Dedicated support', 'SLA']}
                    />
                  </>
                )}
              </div>
              <p className="text-xs text-[oklch(0.4_0_0)]">
                You can upgrade or change your plan anytime from settings.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                className="text-[oklch(0.5_0_0)] hover:text-[oklch(0.8_0_0)] hover:bg-transparent"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < totalSteps ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] font-semibold px-6"
              >
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canNext()}
                className="bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] font-semibold px-6"
              >
                Verify Phone & Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function PlanCard({ name, price, features, selected }: { name: string; price: string; features: string[]; selected?: boolean }) {
  return (
    <div className={`cursor-pointer rounded-xl border p-5 transition-colors ${selected ? 'border-[oklch(0.4_0_0)] bg-[oklch(0.1_0_0)]' : 'border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] hover:border-[oklch(0.25_0_0)]'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-[oklch(0.5_0_0)]">{price}</p>
        </div>
        <div className={`h-5 w-5 rounded-full border-2 ${selected ? 'border-[oklch(0.95_0_0)] bg-[oklch(0.95_0_0)]' : 'border-[oklch(0.3_0_0)]'}`}>
          {selected && <CheckCircle className="h-full w-full text-[oklch(0.03_0_0)]" />}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {features.map((f) => (
          <span key={f} className="rounded-full bg-[oklch(0.12_0_0)] px-2.5 py-0.5 text-xs text-[oklch(0.5_0_0)]">{f}</span>
        ))}
      </div>
    </div>
  )
}
