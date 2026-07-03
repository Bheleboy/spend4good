import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, X, Send, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { PLANS, type PlanId } from '@/lib/pricing'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/funder/invite')({
  component: FunderInvitePage,
})

type Row = { name: string; email: string }
type Result = { name: string; email: string; status: 'sent' | 'failed'; message?: string }

function FunderInvitePage() {
  const { user } = useAuth()
  const [orgName, setOrgName] = useState('Your organisation')
  const [planNpoLimit, setPlanNpoLimit] = useState<number | null>(10)
  const [usedCount, setUsedCount] = useState(0)
  const [rows, setRows] = useState<Row[]>([{ name: '', email: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  const isFunderAdmin = user?.role === 'funder_admin'
  const capacityFinite = planNpoLimit !== null
  const remaining = capacityFinite ? Math.max(0, (planNpoLimit as number) - usedCount) : Infinity

  const loadCounts = async (orgId: string) => {
    const { count: invCount } = await supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('funder_org_id', orgId)
      .eq('status', 'pending')
    const { count: linkCount } = await supabase
      .from('funder_nonprofits')
      .select('id', { count: 'exact', head: true })
      .eq('funder_id', orgId)
    setUsedCount((invCount ?? 0) + (linkCount ?? 0))
  }

  useEffect(() => {
    if (!user?.org_id) return
    ;(async () => {
      setLoading(true)
      const { data: org } = await supabase
        .from('organizations')
        .select('name, subscription_plan')
        .eq('id', user.org_id!)
        .maybeSingle()
      if (org?.name) setOrgName(org.name)
      const planRec = PLANS.find((p) => p.id === (org?.subscription_plan as PlanId))
      setPlanNpoLimit(planRec ? planRec.npoLimit : 10)
      await loadCounts(user.org_id!)
      setLoading(false)
    })()
  }, [user?.org_id])

  const canAddRow = useMemo(
    () => !capacityFinite || rows.length < remaining,
    [rows.length, remaining, capacityFinite],
  )

  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  const addRow = () => canAddRow && setRows((r) => [...r, { name: '', email: '' }])
  const removeRow = (i: number) => setRows((r) => (r.length === 1 ? r : r.filter((_, idx) => idx !== i)))

  const submit = async () => {
    if (!user?.org_id) return
    const cleaned = rows
      .map((r) => ({ name: r.name.trim(), email: r.email.trim() }))
      .filter((r) => r.name && /.+@.+\..+/.test(r.email))
    if (cleaned.length === 0) {
      toast.error('Add at least one nonprofit name and email')
      return
    }
    if (capacityFinite && cleaned.length > remaining) {
      toast.error(`You can only invite ${remaining} more nonprofit(s) on your current plan.`)
      return
    }

    setSubmitting(true)
    const out: Result[] = []
    for (const item of cleaned) {
      try {
        const { data, error } = await supabase
          .from('invitations')
          .insert({
            funder_org_id: user.org_id,
            nonprofit_name: item.name,
            nonprofit_email: item.email,
          })
          .select('id,token,nonprofit_name,nonprofit_email')
          .single()
        if (error || !data) throw error ?? new Error('Insert failed')

        const { error: fnError } = await supabase.functions.invoke('send-invite', {
          body: {
            nonprofit_name: data.nonprofit_name,
            nonprofit_email: data.nonprofit_email,
            funder_org_name: orgName,
            invite_token: data.token,
            org_id: user.org_id,
          },
        })
        out.push({
          name: item.name,
          email: item.email,
          status: fnError ? 'failed' : 'sent',
          message: fnError?.message ?? 'Invitation email sent',
        })
      } catch (err) {
        out.push({
          name: item.name,
          email: item.email,
          status: 'failed',
          message: err instanceof Error ? err.message : 'Failed',
        })
      }
    }
    setResults(out)
    setSubmitting(false)
    const sent = out.filter((r) => r.status === 'sent').length
    if (sent > 0) toast.success(`${sent} invite${sent === 1 ? '' : 's'} sent`)
    await loadCounts(user.org_id)
    setRows([{ name: '', email: '' }])
  }

  if (!isFunderAdmin) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold text-foreground">Funder admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only funder administrators can invite nonprofit organisations.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Invite Nonprofits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orgName} — {usedCount} of {capacityFinite ? planNpoLimit : '∞'} nonprofits invited
          {capacityFinite ? ` · ${remaining} remaining on your plan.` : '.'}
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-6">
        {rows.map((row, i) => (
          <div key={i} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              value={row.name}
              onChange={(e) => updateRow(i, { name: e.target.value })}
              placeholder="Nonprofit name"
              maxLength={120}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="email"
              value={row.email}
              onChange={(e) => updateRow(i, { email: e.target.value })}
              placeholder="admin@nonprofit.org"
              maxLength={255}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length === 1}
              className="inline-flex items-center justify-center rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              aria-label="Remove row"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={addRow}
            disabled={!canAddRow}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add another
          </button>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Skip for now
            </Link>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'Sending…' : 'Send invites'}
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Results</h2>
          </div>
          <ul className="divide-y divide-border">
            {results.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">{r.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.email}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    r.status === 'sent'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                  title={r.message}
                >
                  {r.status === 'sent' ? 'Sent' : 'Failed'}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-6 py-3 text-right">
            <Link
              to="/funder/dashboard"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View portfolio <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
