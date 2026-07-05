import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Building2, Heart, Mail, Phone, User, Lock, CheckCircle, Loader2, FileText, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { signUpWithPassword } from '@/lib/auth'
import { plansForAudience, formatPriceLocalized, type PlanId } from '@/lib/pricing'
import { useCountry } from '@/hooks/use-country'
import { usePaddle } from '@/hooks/use-paddle'
import { COUNTRIES } from '@/lib/countries'
import { toast } from 'sonner'


type OnboardingType = 'funder' | 'nonprofit' | 'invited'
type StepKind = 'welcome' | 'org' | 'registration' | 'personal' | 'billing' | 'plan'

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
  const { isSA } = useCountry()
  const { openCheckout } = usePaddle()
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
    phone: '',
    inviteCode: token ?? '',
    country: 'ZA',
    // Registration (nonprofit)
    npoNumber: '',
    pboNumber: '',
    // Billing
    billingLegalName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    vatNumber: '',
    signatoryName: '',
    signatoryTitle: '',
    billingEmail: '',
  })

  const steps: StepKind[] =
    type === 'invited'
      ? ['welcome', 'personal']
      : type === 'funder'
        ? ['org', 'personal', 'billing', 'plan']
        : ['org', 'registration', 'personal', 'billing', 'plan']

  const totalSteps = steps.length
  const currentStep: StepKind = steps[step - 1]

  const label = type === 'funder' ? 'Funder' : type === 'nonprofit' ? 'Non-Profit' : 'Invited Non-Profit'
  const Icon = type === 'funder' ? Building2 : Heart

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const validateInvite = async (t: string): Promise<InviteInfo | null> => {
    setValidatingInvite(true)
    setInviteError(null)
    try {
      const { data: raw, error } = await supabase.functions.invoke('lookup-invite', {
        body: { token: t },
      })
      const data = raw as null | { id: string; funder_org_id: string; nonprofit_name: string; nonprofit_email: string; status: string; expires_at: string; funder_name: string | null }

      if (error || !data || (data as any).error) {
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

  useEffect(() => {
    if (type === 'invited' && token && !invite && !inviteError) {
      validateInvite(token)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, token])

  // Pre-fill billing fields from earlier steps when entering billing step
  useEffect(() => {
    if (currentStep === 'billing') {
      setForm((p) => ({
        ...p,
        billingLegalName: p.billingLegalName || p.orgName,
        billingEmail: p.billingEmail || p.email,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  const canNext = (): boolean => {
    switch (currentStep) {
      case 'welcome':
        return !!invite
      case 'org':
        if (type === 'funder') return form.orgName.length > 1 && form.email.length > 3 && !!form.country
        return form.orgName.length > 1 && form.email.length > 3 && !!form.country && form.country === 'ZA'
      case 'registration':
        return form.npoNumber.trim().length > 2 || form.pboNumber.trim().length > 2
      case 'personal':
        if (type === 'funder') return form.fullName.length > 1 && form.email.length > 3 && form.password.length >= 8
        return form.fullName.length > 1 && form.phone.length > 7 && form.email.length > 3 && form.password.length >= 8
      case 'billing':
        return (
          form.addressLine1.trim().length > 1 &&
          form.city.trim().length > 1 &&
          form.postalCode.trim().length > 1 &&
          form.signatoryName.trim().length > 1 &&
          form.signatoryTitle.trim().length > 1 &&
          form.billingEmail.trim().length > 3
        )
      case 'plan':
        return true
    }
    return true
  }

  const planFor = (): PlanId | 'invited_free' => {
    if (type === 'invited') return 'invited_free'
    if (type === 'nonprofit') return 'nonprofit_starter'
    const funderPlans = plansForAudience('funder')
    return (funderPlans[selectedPlan]?.id ?? 'funder_starter') as PlanId
  }

  const handleInviteContinue = () => {
    if (invite) setStep(2)
  }

  const handleComplete = async () => {
    console.log('handleComplete called', { type, step, totalSteps, loading })
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
            token: token,
            auth_user_id: authData.user.id,
            full_name: form.fullName,
            email: form.email,
            phone: form.phone,
            country: form.country ?? 'ZA',
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

        toast.success('Account created! Check your email to confirm, then sign in.')
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

      const orgInsert: Record<string, any> = {
        name: form.orgName,
        slug: slug || 'org-' + Date.now(),
        country: form.country,
        onboarding_status: 'pending',
        subscription_tier: plan,
        type: orgType,
        subscription_plan: plan,
      }
      if (type === 'nonprofit') {
        orgInsert.npo_registration_number = form.npoNumber || null
        orgInsert.pbo_number = form.pboNumber || null
        orgInsert.is_verified = false
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert(orgInsert)
        .select()
        .single()

      if (orgError) {
        toast.error('Failed to create organization: ' + orgError.message)
        setLoading(false)
        return
      }

      const { error: userError } = await supabase.from('users').insert({
        id: authUserId,
        phone_number: type === 'funder' ? null : form.phone,
        whatsapp_number: type === 'funder' ? null : form.phone,
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

      // Billing details (both funder + nonprofit self-reg)
      const { error: billingError } = await supabase.from('billing_details').insert({
        org_id: org.id,
        legal_name: form.billingLegalName || form.orgName,
        address_line1: form.addressLine1,
        address_line2: form.addressLine2 || null,
        city: form.city,
        province: form.province || null,
        postal_code: form.postalCode,
        country: form.country,
        vat_number: form.vatNumber || null,
        signatory_name: form.signatoryName,
        signatory_title: form.signatoryTitle,
        billing_email: form.billingEmail || form.email,
      })
      if (billingError) {
        console.warn('billing_details insert failed', billingError)
      }

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

      // Admin notification for new unverified NPO
      if (type === 'nonprofit') {
        try {
          await supabase.functions.invoke('notify-admin-signup', {
            body: {
              org_name: form.orgName,
              npo_number: form.npoNumber,
              pbo_number: form.pboNumber,
              email: form.email,
              country: form.country,
            },
          })
        } catch (e) {
          console.warn('admin notify failed', e)
        }
      }

      const plans = plansForAudience(type === 'funder' ? 'funder' : 'nonprofit')
      const selectedPlanObj = plans[selectedPlan] ?? plans[0]
      const priceId = isSA ? selectedPlanObj.paddlePriceIdZAR : selectedPlanObj.paddlePriceId

      if (!priceId) {
        toast.success('Account created! Check your email to confirm, then sign in.')
        navigate({ to: '/login' })
        return
      }

      openCheckout({
        priceId,
        email: form.email,
        customData: {
          org_id: org.id,
          plan_id: selectedPlanObj.id,
          user_id: authUserId,
        },
        billingDetails: {
          addressLine1: form.addressLine1,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
        },
      })
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  // ==== Invited flow: full-screen block when token missing OR invalid ====
  if (type === 'invited') {
    const showMissingToken = !token
    const showInvalidToken = !!token && !validatingInvite && !invite && !!inviteError
    if (showMissingToken || showInvalidToken) {
      const heading = showMissingToken ? 'Invalid invite link' : 'This invite link is no longer valid'
      const body = showMissingToken
        ? 'This page requires a valid invite link from a funder. If you received an invite email, please use the link in that email. If you believe this is an error, contact the funder who invited you.'
        : 'This invite may have expired (links are valid for 14 days) or has already been used. Contact the funder who invited you for a new invite link.'
      return (
        <div className="flex min-h-screen flex-col bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
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
            <Card className="w-full max-w-lg border-[oklch(0.15_0_0)] bg-[oklch(0.06_0_0)] p-8 text-center md:p-10">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.15_0_0)]">
                <Heart className="h-5 w-5 text-[oklch(0.7_0_0)]" />
              </div>
              <h1 className="text-2xl font-bold">{heading}</h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[oklch(0.55_0_0)]">
                {body}
              </p>
              <Link
                to="/"
                className="mt-8 inline-flex items-center justify-center rounded-md bg-[oklch(0.95_0_0)] px-5 py-2.5 text-sm font-semibold text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)]"
              >
                Go to homepage
              </Link>
            </Card>
          </div>
        </div>
      )
    }
  }

  const inputCls = 'border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]'
  const labelCls = 'mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]'

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
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
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.15_0_0)]">
              <Icon className="h-5 w-5 text-[oklch(0.7_0_0)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{label} Registration</h1>
              <p className="text-xs text-[oklch(0.45_0_0)]">Step {step} of {totalSteps}</p>
            </div>
          </div>

          <div className="my-6 flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-[oklch(0.95_0_0)]' : 'bg-[oklch(0.15_0_0)]'}`}
              />
            ))}
          </div>

          {/* ORG DETAILS */}
          {currentStep === 'org' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Tell us about your organization</h2>
              <div>
                <label className={labelCls}>Organization Name</label>
                <Input
                  value={form.orgName}
                  onChange={(e) => update('orgName', e.target.value)}
                  placeholder={type === 'funder' ? 'e.g. National Lotteries Commission' : 'e.g. Ubuntu Youth Foundation'}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                  <Input
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="admin@organization.co.za"
                    type="email"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <select
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  className="h-10 w-full rounded-md border border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] px-3 text-sm text-[oklch(0.95_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.3_0_0)]"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              {type === 'nonprofit' && form.country !== 'ZA' && (
                <div className="rounded-xl border border-[oklch(0.2_0.05_60)] bg-[oklch(0.08_0.02_60)] p-4 space-y-3">
                  <p className="text-sm text-[oklch(0.85_0_0)]">
                    Spend4Good's SA Compliance Pack is currently available for South African nonprofits only. International funders can sign up and invite SA-based grantees.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      to="/waitlist"
                      search={{ country: form.country }}
                      className="inline-flex items-center justify-center rounded-md bg-[oklch(0.95_0_0)] px-3 py-2 text-xs font-semibold text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)]"
                    >
                      Join the waitlist for {COUNTRIES.find((c) => c.code === form.country)?.name ?? form.country}
                    </Link>
                    <Link
                      to="/onboarding"
                      search={{ type: 'funder' }}
                      className="inline-flex items-center justify-center rounded-md border border-[oklch(0.25_0_0)] bg-transparent px-3 py-2 text-xs font-medium text-[oklch(0.9_0_0)] hover:bg-[oklch(0.12_0_0)]"
                    >
                      I'm registering as a funder instead
                    </Link>
                  </div>
                </div>
              )}
              {type === 'nonprofit' && form.country === 'ZA' && (
                <div className="rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] p-4">
                  <p className="text-xs text-[oklch(0.45_0_0)]">
                    <strong className="text-[oklch(0.6_0_0)]">Self-registration</strong> — annual plans, billed in USD. Nonprofits invited by a funder receive a private invite email; no self-serve invited signup.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* REGISTRATION NUMBERS (nonprofit only) */}
          {currentStep === 'registration' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 h-5 w-5 text-[oklch(0.6_0_0)]" />
                <div>
                  <h2 className="text-lg font-semibold">Registration numbers</h2>
                  <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
                    At least one registration number is required to use Spend4Good.
                  </p>
                </div>
              </div>
              <div>
                <label className={labelCls}>NPO Registration Number</label>
                <Input
                  value={form.npoNumber}
                  onChange={(e) => update('npoNumber', e.target.value)}
                  placeholder="e.g. 123-456 NPO"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-[oklch(0.4_0_0)]">Issued by the Department of Social Development (DSD)</p>
              </div>
              <div>
                <label className={labelCls}>PBO Number (optional if NPO number provided)</label>
                <Input
                  value={form.pboNumber}
                  onChange={(e) => update('pboNumber', e.target.value)}
                  placeholder="e.g. 930012345"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-[oklch(0.4_0_0)]">Public Benefit Organisation number issued by SARS. Required if you issue Section 18A tax certificates.</p>
              </div>
              {form.npoNumber.trim().length <= 2 && form.pboNumber.trim().length <= 2 && (
                <p className="rounded-md border border-[oklch(0.2_0.05_60)] bg-[oklch(0.08_0.02_60)] px-3 py-2 text-xs text-[oklch(0.85_0_0)]">
                  Please enter at least one registration number to continue.
                </p>
              )}
              <div className="rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] p-4">
                <p className="text-xs text-[oklch(0.45_0_0)]">
                  Our team verifies your registration against the NPO / SARS registries (usually within 1 business day). Your account works while verification is pending.
                </p>
              </div>
            </div>
          )}

          {/* INVITED WELCOME */}
          {currentStep === 'welcome' && (
            <div className="space-y-5">
              {validatingInvite && (
                <div className="flex items-center gap-2 text-sm text-[oklch(0.6_0_0)]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Validating invitation…
                </div>
              )}
              {invite && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">You're invited!</h2>
                  <div className="rounded-xl border border-[oklch(0.2_0_0)] bg-[oklch(0.06_0_0)] p-4 text-sm text-[oklch(0.8_0_0)]">
                    <strong className="text-[oklch(0.95_0_0)]">{invite.funder_name ?? 'A funder on Spend4Good'}</strong> has invited your organisation to Spend4Good.
                  </div>
                  <div className="rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] p-5">
                    <p className="text-xs uppercase tracking-wide text-[oklch(0.4_0_0)]">Your organisation</p>
                    <p className="mt-1 text-base font-semibold text-[oklch(0.9_0_0)]">{invite.nonprofit_name}</p>
                    <p className="text-xs text-[oklch(0.5_0_0)]">{invite.nonprofit_email}</p>
                    <p className="mt-3 text-xs text-[oklch(0.5_0_0)]">
                      You can edit the name or email on the next step if anything is wrong.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-[oklch(0.15_0_0)] bg-[oklch(0.04_0_0)] p-4">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.6_0.19_163)]" />
                    <p className="text-xs text-[oklch(0.45_0_0)]">
                      Your account is fully funded by {invite.funder_name ?? 'your funder'}, no payment required.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PERSONAL */}
          {currentStep === 'personal' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Your details</h2>
              {type !== 'funder' && (
                <p className="text-xs text-[oklch(0.45_0_0)]">
                  Your phone number will be linked to WhatsApp for document submissions.
                </p>
              )}
              <div>
                <label className={labelCls}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                  <Input
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    placeholder="Your full name"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>
              {type === 'invited' && (
                <div>
                  <label className={labelCls}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                    <Input
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="you@organization.co.za"
                      type="email"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[oklch(0.4_0_0)]">Pre-filled from your invitation — edit if needed.</p>
                </div>
              )}
              {type !== 'funder' && (
                <div>
                  <label className={labelCls}>Phone Number (WhatsApp)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                    <Input
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="+27 82 123 4567 (SA) or +1 212 555 1234 (International)"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="At least 8 characters"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>
              <p className="text-xs text-[oklch(0.4_0_0)]">
                {type === 'funder'
                  ? "You'll receive a confirmation email after sign-in."
                  : "You'll confirm your email and verify your WhatsApp number after sign-in."}
              </p>
            </div>
          )}

          {/* BILLING */}
          {currentStep === 'billing' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-[oklch(0.6_0_0)]" />
                <div>
                  <h2 className="text-lg font-semibold">Billing &amp; invoicing details</h2>
                  <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
                    These details appear on your payment confirmation and are used for tax purposes.
                  </p>
                </div>
              </div>
              <div>
                <label className={labelCls}>Legal Organisation Name</label>
                <Input
                  value={form.billingLegalName}
                  onChange={(e) => update('billingLegalName', e.target.value)}
                  placeholder="Legal registered name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Registered Address Line 1</label>
                <Input value={form.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} placeholder="Street address" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Address Line 2 <span className="text-[oklch(0.4_0_0)]">(optional)</span></label>
                <Input value={form.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} placeholder="Suite, unit, etc." className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <Input value={form.city} onChange={(e) => update('city', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Province/State</label>
                  <Input value={form.province} onChange={(e) => update('province', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Postal Code</label>
                  <Input value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Country</label>
                  <select
                    value={form.country}
                    onChange={(e) => update('country', e.target.value)}
                    className="h-10 w-full rounded-md border border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] px-3 text-sm text-[oklch(0.95_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.3_0_0)]"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>VAT Number (if registered)</label>
                <Input value={form.vatNumber} onChange={(e) => update('vatNumber', e.target.value)} placeholder="Optional" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Name of person authorising payment</label>
                <Input value={form.signatoryName} onChange={(e) => update('signatoryName', e.target.value)} placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Title/Role</label>
                <Input value={form.signatoryTitle} onChange={(e) => update('signatoryTitle', e.target.value)} placeholder="e.g. Executive Director, CFO" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Billing contact email</label>
                <Input
                  value={form.billingEmail}
                  onChange={(e) => update('billingEmail', e.target.value)}
                  placeholder="billing@organization.co.za"
                  type="email"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-[oklch(0.4_0_0)]">
                  Invoice and payment confirmations are sent here. Can be different from your login email.
                </p>
              </div>
            </div>
          )}

          {/* PLAN */}
          {currentStep === 'plan' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Choose your plan</h2>
              <p className="text-xs text-[oklch(0.45_0_0)]">Annual plans, billed in USD. Cancel anytime before renewal.</p>
              <div className="space-y-3">
                {plansForAudience(type === 'funder' ? 'funder' : 'nonprofit').map((plan, i) => (
                  <PlanCard
                    key={plan.id}
                    name={plan.name}
                    price={formatPriceLocalized(plan, isSA)}
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
                    ? validatingInvite || !invite
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
