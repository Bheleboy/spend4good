import { Fragment, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Download, Printer, ChevronRight, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  projectId: string
}

interface ExpRow {
  id: string
  amount: number
  currency: string
  description: string
  category: string | null
  status: string
  receipt_url: string | null
  submitted_at: string
  submitted_by: string
  approved_by: string | null
  submitted_by_user?: { full_name: string; whatsapp_number: string | null } | null
  approved_by_user?: { full_name: string } | null
}

export function ProjectReport({ projectId }: Props) {
  const today = new Date()
  const monthAgo = new Date(today.getTime() - 30 * 86400000)
  const [from, setFrom] = useState(monthAgo.toISOString().slice(0, 10))
  const [to, setTo] = useState(today.toISOString().slice(0, 10))
  const [project, setProject] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [expenses, setExpenses] = useState<ExpRow[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [logSearch, setLogSearch] = useState('')
  const [sortKey, setSortKey] = useState<'date' | 'amount' | 'agent'>('date')

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from('projects').select('*, organizations(name)').eq('id', projectId).single()
      setProject(p)
      setOrg(p?.organizations)
      const { data } = await supabase
        .from('expenses')
        .select('*, submitted_by_user:users!expenses_submitted_by_fkey(full_name, whatsapp_number), approved_by_user:users!expenses_approved_by_fkey(full_name)')
        .eq('project_id', projectId)
        .gte('submitted_at', from)
        .lte('submitted_at', to + 'T23:59:59')
        .order('submitted_at', { ascending: false })
      setExpenses((data as any) ?? [])
    }
    load()
  }, [projectId, from, to])

  const totals = useMemo(() => {
    const submitted = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const approved = expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0)
    const pending = expenses.filter((e) => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0)
    const budget = Number(project?.budget ?? 0)
    return { submitted, approved, pending, remaining: budget - approved, budget }
  }, [expenses, project])

  const byAgent = useMemo(() => {
    const map = new Map<string, { name: string; wa: string | null; count: number; total: number; approved: number; pending: number; rejected: number; items: ExpRow[] }>()
    for (const e of expenses) {
      const key = e.submitted_by
      const row = map.get(key) ?? { name: e.submitted_by_user?.full_name ?? 'Unknown', wa: e.submitted_by_user?.whatsapp_number ?? null, count: 0, total: 0, approved: 0, pending: 0, rejected: 0, items: [] }
      row.count += 1
      row.total += Number(e.amount)
      if (e.status === 'approved') row.approved += Number(e.amount)
      if (e.status === 'pending') row.pending += Number(e.amount)
      if (e.status === 'rejected') row.rejected += 1
      row.items.push(e)
      map.set(key, row)
    }
    return [...map.entries()].map(([k, v]) => ({ id: k, ...v })).sort((a, b) => b.total - a.total)
  }, [expenses])

  const byCategory = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    for (const e of expenses) {
      const k = e.category ?? 'uncategorised'
      const cur = map.get(k) ?? { count: 0, total: 0 }
      cur.count += 1; cur.total += Number(e.amount)
      map.set(k, cur)
    }
    return [...map.entries()].map(([k, v]) => ({ category: k, ...v })).sort((a, b) => b.total - a.total)
  }, [expenses])

  const timeline = useMemo(() => {
    const map = new Map<string, { date: string; approved: number; pending: number; rejected: number }>()
    for (const e of expenses) {
      const d = e.submitted_at.slice(0, 10)
      const cur = map.get(d) ?? { date: d, approved: 0, pending: 0, rejected: 0 }
      if (e.status === 'approved') cur.approved += Number(e.amount)
      else if (e.status === 'rejected') cur.rejected += Number(e.amount)
      else cur.pending += Number(e.amount)
      map.set(d, cur)
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
  }, [expenses])

  const sortedLog = useMemo(() => {
    const filtered = logSearch
      ? expenses.filter((e) => e.description.toLowerCase().includes(logSearch.toLowerCase()) || (e.submitted_by_user?.full_name ?? '').toLowerCase().includes(logSearch.toLowerCase()))
      : expenses
    const sorted = [...filtered]
    if (sortKey === 'amount') sorted.sort((a, b) => Number(b.amount) - Number(a.amount))
    else if (sortKey === 'agent') sorted.sort((a, b) => (a.submitted_by_user?.full_name ?? '').localeCompare(b.submitted_by_user?.full_name ?? ''))
    else sorted.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
    return sorted
  }, [expenses, logSearch, sortKey])

  const exportCsv = () => {
    const rows = [
      ['Date', 'Agent', 'WhatsApp', 'Description', 'Category', 'Amount', 'Currency', 'Status', 'Approved By'],
      ...expenses.map((e) => [
        new Date(e.submitted_at).toISOString(),
        e.submitted_by_user?.full_name ?? '',
        e.submitted_by_user?.whatsapp_number ?? '',
        e.description.replace(/"/g, '""'),
        e.category ?? '',
        String(e.amount),
        e.currency,
        e.status,
        e.approved_by_user?.full_name ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${project?.name ?? 'project'}-report.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!project) return <p className="text-sm text-muted-foreground">Loading report...</p>

  return (
    <div className="space-y-6 print:space-y-4">
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
            <p className="text-sm text-muted-foreground">{org?.name} · {from} to {to}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> PDF</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Submitted', value: totals.submitted },
          { label: 'Total Approved', value: totals.approved, tone: 'text-success' },
          { label: 'Total Pending', value: totals.pending, tone: 'text-warning' },
          { label: 'Budget Remaining', value: totals.remaining, tone: totals.remaining < 0 ? 'text-destructive' : 'text-foreground' },
        ].map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.tone ?? 'text-foreground'}`}>{project.currency ?? 'ZAR'} {Number(c.value).toLocaleString()}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Breakdown by field agent</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Approved</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Rejected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byAgent.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No submissions</TableCell></TableRow>
            ) : byAgent.map((a) => (
              <Fragment key={a.id}>
                <TableRow key={a.id} className="cursor-pointer" onClick={() => setExpanded((p) => ({ ...p, [a.id]: !p[a.id] }))}>
                  <TableCell>{expanded[a.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.wa ?? '—'}</TableCell>
                  <TableCell className="text-right">{a.count}</TableCell>
                  <TableCell className="text-right font-semibold">{a.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-success">{a.approved.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-warning">{a.pending.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{a.rejected}</TableCell>
                </TableRow>
                {expanded[a.id] && (
                  <TableRow key={a.id + '-x'}>
                    <TableCell colSpan={8} className="bg-muted/30 p-3">
                      <div className="space-y-1">
                        {a.items.map((e) => (
                          <div key={e.id} className="flex justify-between text-xs">
                            <span>{new Date(e.submitted_at).toLocaleDateString()} · {e.description}</span>
                            <span><Badge variant="outline" className="mr-2 text-[10px]">{e.status}</Badge>{e.currency} {Number(e.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Breakdown by category</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
          <TableBody>
            {byCategory.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
            ) : byCategory.map((c) => (
              <TableRow key={c.category}><TableCell className="font-medium">{c.category}</TableCell><TableCell className="text-right">{c.count}</TableCell><TableCell className="text-right">{c.total.toLocaleString()}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Daily submissions</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="approved" stackId="a" fill="var(--color-success)" />
            <Bar dataKey="pending" stackId="a" fill="var(--color-warning)" />
            <Bar dataKey="rejected" stackId="a" fill="var(--color-destructive)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Full expense log</h3>
          <div className="flex gap-2">
            <Input placeholder="Search" value={logSearch} onChange={(e) => setLogSearch(e.target.value)} className="w-48" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => setSortKey('date')}>Date</TableHead>
              <TableHead className="cursor-pointer" onClick={() => setSortKey('agent')}>Agent</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => setSortKey('amount')}>Amount</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLog.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No expenses in this range</TableCell></TableRow>
            ) : sortedLog.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{new Date(e.submitted_at).toLocaleString()}</TableCell>
                <TableCell>{e.submitted_by_user?.full_name ?? '—'}</TableCell>
                <TableCell className="max-w-xs truncate">{e.description}</TableCell>
                <TableCell className="text-right font-medium">{e.currency} {Number(e.amount).toLocaleString()}</TableCell>
                <TableCell>{e.receipt_url ? <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-primary underline">view</a> : '—'}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{e.status}</Badge></TableCell>
                <TableCell>{e.approved_by_user?.full_name ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
