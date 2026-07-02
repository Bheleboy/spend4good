import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Building2, Heart, Mail, Phone, User, Lock, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { signUpWithPassword } from '@/lib/auth'
import { plansForAudience, formatPrice, type PlanId } from '@/lib/pricing'
import { toast } from 'sonner'

type OnboardingType = 'funder' | 'nonprofit' | 'invited'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
  validateSearch: (search: Record<string, unknown>): { type: OnboardingType; token?: string } => ({
    type: (search.type as OnboardingType) || 'nonprofit',
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Get Started — Spend4Good' },
      { name: 'description', content: 'Create your Spend4Good account and start tracking spend transparently.' },
    ],
  }),
})

interface InviteInfo {
  id: string
  funder_org_id: string
  nonprofit_name: string
  nonprofit_email: string
  funder_name?: string
  status: string
  expires_at: string
}

function OnboardingPage() {
  const { type, token } = Route.useSearch()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(0)
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [validatingInvite, setValidatingInvite] = useState(false)
  const [form, setForm] = useState({
    orgName: '',
    fullName: '',
    email: '',
    password: '',
    phone: '+27',
    inviteCode: token ?? '',
    country: 'ZA',
  })

  const totalSteps = type === 'invited' ? 2 : 3
  const label = type === 'funder' ? 'Funder' : type === 'nonprofit' ? 'Non-Profit' : 'Invited Non-Profit'
  const Icon = type === 'funder' ? Building2 : Heart

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  // Look up invitation details by token via secure RPC (no blanket table SELECT)
  const validateInvite = async (t: string): Promise<InviteInfo | null> => {
    setValidatingInvite(true)
    setInviteError(null)
    try {
      const { data, error } = await supabase
        .rpc('get_invitation_by_token', { _token: t })
        .maybeSingle()

      if (error || !data) {
        setInviteError('Invitation not found. Check your link or code.')
        return null
      }
      if (data.status === 'accepted') {
        setInviteError('This invitation has already been used. Sign in instead.')
        return null
      }
      if (data.status === 'revoked') {
        setInviteError('This invitation was revoked by the funder.')
        return null
      }
      if (new Date(data.expires_at).getTime() < Date.now()) {
        setInviteError('This invitation has expired. Ask the funder to resend.')
        return null
      }

      const info: InviteInfo = {
        id: data.id,
        funder_org_id: data.funder_org_id,
        nonprofit_name: data.nonprofit_name,
        nonprofit_email: data.nonprofit_email,
        status: data.status,
        expires_at: data.expires_at,
        funder_name: data.funder_name ?? undefined,
      }
      setInvite(info)
      setForm((p) => ({ ...p, email: data.nonprofit_email, orgName: data.nonprofit_name }))
      return info
    } finally {
      setValidatingInvite(false)
    }
  }


  // Auto-validate when arriving with ?token=
  useEffect(() => {
    if (type === 'invited' && token && !invite && !inviteError) {
      validateInvite(token)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, token])

  const canNext = () => {
    if (step === 1) {
      if (type === 'invited') return !!invite
      return form.orgName.length > 1 && form.email.length > 3 && form.phone.length > 7
    }
    if (step === 2) return form.fullName.length > 1 && form.phone.length > 7 && form.email.length > 3 && form.password.length >= 8
    return true
  }

  const planFor = (): PlanId | 'invited_free' => {
    if (type === 'invited') return 'invited_free'
    if (type === 'nonprofit') return 'nonprofit_starter'
    const funderPlans = plansForAudience('funder')
    return (funderPlans[selectedPlan]?.id ?? 'funder_starter') as PlanId
  }

  const handleInviteContinue = async () => {
    if (invite) {
      setStep(2)
      return
    }
    if (!form.inviteCode.trim()) return
    const info = await validateInvite(form.inviteCode.trim())
    if (info) setStep(2)
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      // === Invited flow ===
      if (type === 'invited') {
        if (!invite) {
          toast.error('Invitation not validated')
          setLoading(false)
          return
        }

        const { data: authData, error: authError } = await signUpWithPassword(
          form.email,
          form.password,
          form.fullName,
        )
        if (authError || !authData.user) {
          toast.error(authError?.message || 'Failed to create account')
          setLoading(false)
          return
        }

        const { data: accepted, error: acceptErr } = await supabase.functions.invoke('accept-invite', {
          body: {
            token: invite.id ? form.inviteCode.trim() || token : token,
            auth_user_id: authData.user.id,
            full_name: form.fullName,
            email: form.email,
            phone: form.phone,
            country: form.country,
          },
        })
        if (acceptErr || !(accepted as { ok?: boolean })?.ok) {
          const msg =
            (accepted as { error?: string })?.error ||
            acceptErr?.message ||
            'Could not accept invitation'
          toast.error(msg)
          setLoading(false)
          return
        }

        // Best-effort welcome email
        try {
          await supabase.functions.invoke('send-welcome', {
            body: {
              full_name: form.fullName,
              email: form.email,
              org_name: invite.nonprofit_name,
              account_type: 'nonprofit',
              org_id: (accepted as { org_id?: string }).org_id,
            },
          })
        } catch (e) {
          console.warn('welcome email failed', e)
        }

        toast.success('Welcome to Spend4Good! Please confirm your email, then sign in.')
        navigate({ to: '/login' })
        return
      }

      // === Self-reg (funder / nonprofit) ===
      const role: 'admin' | 'funder_admin' = type === 'funder' ? 'funder_admin' : 'admin'
      const orgType: 'funder' | 'nonprofit' = type === 'funder' ? 'funder' : 'nonprofit'
      const plan = planFor()
      const slug = form.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      const { data: authData, error: authError } = await signUpWithPassword(form.email, form.password, form.fullName)
      if (authError || !authData.user) {
        toast.error(authError?.message || 'Failed to create account')
        setLoading(false)
        return
      }
      const authUserId = authData.user.id

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: form.orgName,
          slug: slug || 'org-' + Date.now(),
          country: form.country,
          onboarding_status: 'pending',
          subscription_tier: plan,
          type: orgType,
          subscription_plan: plan,
        })
        .select()
        .single()

      if (orgError) {
        toast.error('Failed to create organization: ' + orgError.message)
        setLoading(false)
        return
      }

      const { error: userError } = await supabase.from('users').insert({
        id: authUserId,
        phone_number: form.phone,
        whatsapp_number: form.phone,
        org_id: org.id,
        role,
        full_name: form.fullName,
        email: form.email,
        is_active: true,
      })

      if (userError) {
        toast.error('Failed to create profile: ' + userError.message)
        setLoading(false)
        return
      }

      await supabase.from('user_roles').insert({
        user_id: authUserId,
        role,
        org_id: org.id,
      })

      try {
        await supabase.functions.invoke('send-welcome', {
          body: {
            full_name: form.fullName,
            email: form.email,
            org_name: form.orgName,
            account_type: orgType,
            org_id: org.id,
          },
        })
      } catch (e) {
        console.warn('welcome email failed', e)
      }

      toast.success('Account created! Check your email to confirm, then sign in.')
      navigate({ to: '/login' })
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
    setLoading(false)
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

          {/* Step 1 - Org details (funder/nonprofit) */}
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
                    type="email"
                    className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Phone Number (WhatsApp)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                  <Input
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+27821234567"
                    className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                  />
                </div>
                <p className="mt-1 text-xs text-[oklch(0.4_0_0)]">Linked to your WhatsApp for document submissions</p>
              </div>
              {type === 'nonprofit' && (
                <div className="rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] p-4">
                  <p className="text-xs text-[oklch(0.45_0_0)]">
                    <strong className="text-[oklch(0.6_0_0)]">Self-registration</strong> — 14-day free trial on any plan. If you were invited by a funder,{' '}
                    <Link to="/onboarding" search={{ type: 'invited' }} className="underline text-[oklch(0.7_0_0)]">
                      click here instead
                    </Link>{' '}
                    — invited nonprofits pay nothing, ever.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 1 - Invite code */}
          {step === 1 && type === 'invited' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">
                {invite ? "You're invited!" : 'Enter your invite code'}
              </h2>

              {!invite && !validatingInvite && (
                <>
                  <p className="text-sm text-[oklch(0.45_0_0)]">
                    Your funder should have shared an invite link or code. Paste it below.
                  </p>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Invite Code</label>
                    <Input
                      value={form.inviteCode}
                      onChange={(e) => update('inviteCode', e.target.value)}
                      placeholder="Paste your invite token"
                      className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)] text-center tracking-widest"
                    />
                  </div>
                  {inviteError && (
                    <p className="text-sm text-[oklch(0.65_0.2_25)]">{inviteError}</p>
                  )}
                </>
              )}

              {validatingInvite && (
                <div className="flex items-center gap-2 text-sm text-[oklch(0.6_0_0)]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Validating invitation…
                </div>
              )}

              {invite && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] p-5">
                    <p className="text-xs uppercase tracking-wide text-[oklch(0.4_0_0)]">Invited by</p>
                    <p className="mt-1 text-base font-semibold text-[oklch(0.9_0_0)]">
                      {invite.funder_name ?? 'A funder on Spend4Good'}
                    </p>
                    <div className="mt-4 border-t border-[oklch(0.12_0_0)] pt-4">
                      <p className="text-xs uppercase tracking-wide text-[oklch(0.4_0_0)]">Your organisation</p>
                      <p className="mt-1 text-base font-semibold text-[oklch(0.9_0_0)]">{invite.nonprofit_name}</p>
                      <p className="text-xs text-[oklch(0.5_0_0)]">{invite.nonprofit_email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] p-4">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.6_0.19_163)]" />
                    <p className="text-xs text-[oklch(0.45_0_0)]">
                      Fully funded by your funder — no payment required, ever. Continue to set up your account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 - Personal details with email + phone */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Your details</h2>
              <p className="text-xs text-[oklch(0.45_0_0)]">
                Your phone number will be linked to WhatsApp for document submissions.
              </p>
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
              {type === 'invited' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                    <Input
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="you@organization.co.za"
                      type="email"
                      readOnly={!!invite}
                      className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                    />
                  </div>
                  {invite && (
                    <p className="mt-1 text-xs text-[oklch(0.4_0_0)]">
                      Locked to the address your funder invited.
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Phone Number (WhatsApp)</label>
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
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="At least 8 characters"
                    className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                  />
                </div>
              </div>
              <p className="text-xs text-[oklch(0.4_0_0)]">
                You'll confirm your email and verify your WhatsApp number after sign-in.
              </p>

            </div>
          )}

          {/* Step 3 - Plan selection (only for self-reg) */}
          {step === 3 && type !== 'invited' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Choose your plan</h2>
              <p className="text-xs text-[oklch(0.45_0_0)]">14-day free trial on any plan. Cancel anytime.</p>
              <div className="space-y-3">
                {plansForAudience(type === 'funder' ? 'funder' : 'nonprofit').map((plan, i) => (
                  <PlanCard
                    key={plan.id}
                    name={plan.name}
                    price={formatPrice(plan.priceUSD)}
                    desc={
                      plan.audience === 'funder'
                        ? plan.npoLimit === null
                          ? 'Unlimited nonprofits & projects.'
                          : `Up to ${plan.npoLimit} nonprofits, ${plan.projectLimit ?? 'configurable'} projects each.`
                        : `Up to ${plan.projectLimit} projects. Full team access.`
                    }
                    features={plan.features}
                    selected={selectedPlan === i}
                    onSelect={() => setSelectedPlan(i)}
                    highlight={plan.highlight}
                  />
                ))}
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
                onClick={type === 'invited' && step === 1 ? handleInviteContinue : () => setStep((s) => s + 1)}
                disabled={
                  type === 'invited' && step === 1
                    ? validatingInvite || (!invite && form.inviteCode.trim().length < 4)
                    : !canNext()
                }
                className="bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] font-semibold px-6"
              >
                {validatingInvite ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating…</>
                ) : (
                  <>Continue <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canNext() || loading}
                className="bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] font-semibold px-6"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <>Create Account <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function PlanCard({ name, price, desc, features, selected, onSelect, highlight }: {
  name: string; price: string; desc: string; features: string[]; selected?: boolean; onSelect?: () => void; highlight?: boolean
}) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border p-5 transition-colors ${selected ? 'border-[oklch(0.4_0_0)] bg-[oklch(0.1_0_0)]' : 'border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] hover:border-[oklch(0.25_0_0)]'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{name}</h3>
            {highlight && (
              <span className="rounded-full bg-[oklch(0.6_0.19_163)] px-2 py-0.5 text-[10px] font-bold uppercase text-[oklch(0.03_0_0)]">
                Recommended
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[oklch(0.6_0_0)]">{price}</p>
        </div>
        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-[oklch(0.95_0_0)] bg-[oklch(0.95_0_0)]' : 'border-[oklch(0.3_0_0)]'}`}>
          {selected && <CheckCircle className="h-full w-full text-[oklch(0.03_0_0)]" />}
        </div>
      </div>
      <p className="mt-1 text-xs text-[oklch(0.4_0_0)]">{desc}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {features.map((f) => (
          <span key={f} className="rounded-full bg-[oklch(0.12_0_0)] px-2.5 py-0.5 text-xs text-[oklch(0.5_0_0)]">{f}</span>
        ))}
      </div>
    </div>
  )
}
