import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { ExpenseCard, type ExpenseRow } from '@/components/ExpenseCard'
import { Search } from 'lucide-react'

interface ExpenseSearch {
  highlight?: string
}

export const Route = createFileRoute('/_app/expenses')({
  component: ExpensesPage,
  validateSearch: (s: Record<string, unknown>): ExpenseSearch => ({
    highlight: typeof s.highlight === 'string' ? s.highlight : undefined,
  }),
})

function ExpensesPage() {
  const { user } = useAuth()
  const { highlight } = useSearch({ from: '/_app/expenses' })
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user?.org_id) return
    setLoading(true)
    let q = supabase
      .from('expenses')
      .select('*, submitted_by_user:users!expenses_submitted_by_fkey(full_name), approved_by_user:users!expenses_approved_by_fkey(full_name), project:projects(name)')
      .eq('org_id', user.org_id)
      .order('submitted_at', { ascending: false })
    if (status !== 'all') q = q.eq('status', status)
    if (projectFilter !== 'all') q = q.eq('project_id', projectFilter)
    if (dateFrom) q = q.gte('submitted_at', dateFrom)
    if (dateTo) q = q.lte('submitted_at', dateTo + 'T23:59:59')
    const { data } = await q
    setExpenses((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!user?.org_id) return
    supabase.from('projects').select('id, name').eq('org_id', user.org_id).then(({ data }) => setProjects(data ?? []))
  }, [user?.org_id])

  useEffect(() => { load() }, [user?.org_id, status, projectFilter, dateFrom, dateTo])

  useEffect(() => {
    if (!highlight) return
    const el = document.getElementById(`expense-${highlight}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlight, expenses])

  const filtered = useMemo(() => {
    if (!search) return expenses
    const s = search.toLowerCase()
    return expenses.filter((e) =>
      (e.description ?? '').toLowerCase().includes(s) ||
      (e.submitted_by_user?.full_name ?? '').toLowerCase().includes(s),
    )
  }, [expenses, search])

  const emptyText: Record<string, string> = {
    pending: 'No pending expenses. WhatsApp submissions will appear here for review.',
    approved: 'No approved expenses yet.',
    rejected: 'No rejected expenses.',
    all: 'No expenses yet. Field agents can submit via WhatsApp.',
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
        <p className="text-sm text-muted-foreground">Review and approve field expense submissions.</p>
      </div>

      <Card className="p-4 space-y-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search description or agent" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">{emptyText[status]}</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <ExpenseCard key={e.id} expense={e} onChange={load} highlight={e.id === highlight} />
          ))}
        </div>
      )}
    </div>
  )
}
