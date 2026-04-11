import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { FolderKanban, Clock, DollarSign, Users, Plus, FileText } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  const [metrics, setMetrics] = useState({ projects: 0, pending: 0, totalSpent: 0, activeUsers: 0 })
  const [recentDocs, setRecentDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const orgId = user.org_id
      const [projRes, pendRes, approvedRes, usersRes, docsRes] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'active'),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'pending'),
        supabase.from('documents').select('amount').eq('org_id', orgId).eq('status', 'approved'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_active', true),
        supabase.from('documents').select('*, projects(name), users!documents_uploaded_by_fkey(full_name)').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
      ])
      const totalSpent = approvedRes.data?.reduce((s: number, d: any) => s + (d.amount || 0), 0) || 0
      setMetrics({
        projects: projRes.count || 0,
        pending: pendRes.count || 0,
        totalSpent,
        activeUsers: usersRes.count || 0,
      })
      setRecentDocs(docsRes.data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const cards = [
    { label: 'Active Projects', value: metrics.projects, icon: FolderKanban, color: 'text-primary' },
    { label: 'Pending Approvals', value: metrics.pending, icon: Clock, color: 'text-warning' },
    { label: 'Approved Expenses', value: `R ${metrics.totalSpent.toLocaleString()}`, icon: DollarSign, color: 'text-success' },
    { label: 'Active Users', value: metrics.activeUsers, icon: Users, color: 'text-primary' },
  ]

  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-warning-foreground',
    approved: 'bg-success text-success-foreground',
    rejected: 'bg-destructive text-destructive-foreground',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex gap-2">
          {can('create_project') && (
            <Link to="/projects">
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Create Project</Button>
            </Link>
          )}
          {can('add_user') && (
            <Link to="/users">
              <Button size="sm" variant="outline"><Users className="mr-1 h-4 w-4" /> Add User</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{loading ? '—' : c.value}</p>
              </div>
              <c.icon className={`h-8 w-8 ${c.color} opacity-80`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-2 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Monthly Expenses</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Recent Activity</h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : recentDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              recentDocs.slice(0, 6).map((doc: any) => (
                <div key={doc.id} className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{doc.file_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{doc.vendor_name}</span>
                      <Badge className={`text-[10px] ${statusColors[doc.status] || ''}`}>{doc.status}</Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
