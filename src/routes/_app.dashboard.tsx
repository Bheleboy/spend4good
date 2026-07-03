import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { FolderKanban, Clock, DollarSign, Users, Plus, FileText, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

const monthlyData = [
  { month: 'Oct', amount: 45000 },
  { month: 'Nov', amount: 52000 },
  { month: 'Dec', amount: 38000 },
  { month: 'Jan', amount: 61000 },
  { month: 'Feb', amount: 48000 },
  { month: 'Mar', amount: 55000 },
]

function DashboardPage() {
  const { user, can } = useAuth()
  const [metrics, setMetrics] = useState({ projects: 0, pending: 0, docsCount: 0, activeUsers: 0 })
  const [recentDocs, setRecentDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const orgId = user.org_id
      const [projRes, pendRes, docsCountRes, usersRes, docsRes] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'active'),
        supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'pending'),
        supabase.from('compliance_documents').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_active', true),
        supabase.from('compliance_documents').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
      ])
      setMetrics({
        projects: projRes.count || 0,
        pending: pendRes.count || 0,
        docsCount: docsCountRes.count || 0,
        activeUsers: usersRes.count || 0,
      })
      setRecentDocs(docsRes.data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const cards = [
    { label: 'Active Projects', value: metrics.projects, icon: FolderKanban, trend: '+2 this month', up: true },
    { label: 'Pending Approvals', value: metrics.pending, icon: Clock, trend: 'expense reviews', up: false },
    { label: 'Documents in Vault', value: metrics.docsCount, icon: DollarSign, trend: 'compliance docs', up: true },
    { label: 'Active Users', value: metrics.activeUsers, icon: Users, trend: 'All active', up: true },
  ]

  const statusColors: Record<string, string> = {
    current: 'bg-success/15 text-success border border-success/20',
    expiring_soon: 'bg-warning/15 text-warning border border-warning/20',
    expired: 'bg-destructive/15 text-destructive border border-destructive/20',
  }
  const statusLabels: Record<string, string> = {
    current: 'Current',
    expiring_soon: 'Expiring soon',
    expired: 'Expired',
  }


  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting()}, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening with {user?.organization?.name || 'your organization'} today.
          </p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          {can('create_project') && (
            <Link to="/projects">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </Link>
          )}
          {can('add_user') && (
            <Link to="/users">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Users className="h-4 w-4" /> Add User
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.label} className="relative overflow-hidden p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {loading ? (
                    <span className="inline-block h-8 w-20 animate-pulse rounded bg-muted" />
                  ) : c.value}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
              {c.up ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-warning" />
              )}
              <span className={c.up ? 'text-success' : 'text-warning'}>{c.trend}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Monthly Expenses</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Last 6 months overview</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <TrendingUp className="h-3 w-3" /> +12%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`R ${value.toLocaleString()}`, 'Spent']}
              />
              <Area type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={2} fill="url(#colorAmount)" dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--color-card)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Latest document submissions</p>
            </div>
            <Link to="/documents">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                View all
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))
            ) : recentDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              recentDocs.slice(0, 6).map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">{doc.vendor_name}</p>
                  </div>
                  <Badge className={`shrink-0 text-[10px] ${statusColors[doc.status] || ''}`}>
                    {doc.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
