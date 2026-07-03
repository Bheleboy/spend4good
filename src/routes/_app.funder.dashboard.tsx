import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2, Users, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { PLANS, type PlanId } from '@/lib/pricing'

export const Route = createFileRoute('/_app/funder/dashboard')({
  component: FunderDashboardPage,
})

type PortfolioRow = {
  name: string
  status: 'Active' | 'Invited' | 'Suspended'
  addedAt: string
  country: string | null
  compliance: string
}

function FunderDashboardPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<PortfolioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [orgName, setOrgName] = useState('Your organisation')
  const [planNpoLimit, setPlanNpoLimit] = useState<number | null>(10)

  const isFunderAdmin = user?.role === 'funder_admin'

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

      const { data: links } = await supabase
        .from('funder_nonprofits')
        .select('status, created_at, organizations:nonprofit_id ( name, country )')
        .eq('funder_id', user.org_id!)

      const { data: invites } = await supabase
        .from('invitations')
        .select('nonprofit_name, status, created_at, expires_at')
        .eq('funder_org_id', user.org_id!)
        .eq('status', 'pending')

      const linkRows: PortfolioRow[] = (links ?? []).map((l: any) => {
        const country: string | null = l.organizations?.country ?? null
        const isZa =
          (country ?? '').trim().toLowerCase() === 'za' ||
          (country ?? '').toLowerCase() === 'south africa'
        return {
          name: l.organizations?.name ?? 'Unknown',
          status: l.status === 'suspended' ? 'Suspended' : 'Active',
          addedAt: l.created_at,
          country,
          compliance: isZa ? 'South African Compliance Pack' : 'Not applicable',
        }
      })

      const inviteRows: PortfolioRow[] = (invites ?? [])
        .filter((i: any) => new Date(i.expires_at) >= new Date())
        .map((i: any) => ({
          name: i.nonprofit_name,
          status: 'Invited',
          addedAt: i.created_at,
          country: null,
          compliance: '—',
        }))

      const combined = [...linkRows, ...inviteRows].sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
      )
      setRows(combined)
      setLoading(false)
    })()
  }, [user?.org_id])

  if (!isFunderAdmin) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold text-foreground">Funder admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is available to funder administrators.
        </p>
      </div>
    )
  }

  const total = rows.length
  const atLimit = planNpoLimit !== null && total >= planNpoLimit

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {orgName} — {total} of {planNpoLimit ?? '∞'} nonprofits
          </p>
        </div>
        <div className="group relative">
          <Link
            to="/funder/invite"
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              atLimit
                ? 'pointer-events-none bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <Plus className="h-4 w-4" /> Invite Nonprofits
          </Link>
          {atLimit && (
            <div className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-muted-foreground opacity-0 shadow group-hover:opacity-100">
              You've reached your plan limit. Upgrade to invite more.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No nonprofits yet — invite your first one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-medium">Nonprofit</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date Added</th>
                <th className="px-6 py-3 font-medium">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-6 py-3 text-foreground">{r.name}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        r.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : r.status === 'Invited'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {new Date(r.addedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{r.compliance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
