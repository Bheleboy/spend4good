import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const Route = createFileRoute('/_app/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  const { user, can } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', budget_amount: '', currency: 'ZAR', start_date: '', end_date: '' })

  const loadProjects = async () => {
    if (!user) return
    let q = supabase.from('projects').select('*').eq('org_id', user.org_id).order('created_at', { ascending: false })
    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    const { data } = await q
    setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => { loadProjects() }, [user, statusFilter])

  const filtered = projects.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    const { error } = await supabase.from('projects').insert({
      org_id: user!.org_id,
      name: form.name,
      description: form.description || null,
      budget_amount: parseFloat(form.budget_amount) || 0,
      currency: form.currency,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: 'active',
    })
    if (error) { toast.error(error.message); return }
    toast.success('Project created!')
    setDialogOpen(false)
    setForm({ name: '', description: '', budget_amount: '', currency: 'ZAR', start_date: '', end_date: '' })
    loadProjects()
  }

  const statusColor: Record<string, string> = {
    active: 'bg-success text-success-foreground',
    completed: 'bg-primary text-primary-foreground',
    archived: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        {can('create_project') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> Create Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name *</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Description</label>
                  <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Budget</label>
                    <Input type="number" value={form.budget_amount} onChange={e => setForm(f => ({ ...f, budget_amount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Currency</label>
                    <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['ZAR', 'USD', 'KES', 'EUR'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Date</label>
                    <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Date</label>
                    <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreate}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No projects found</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50">
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.budget_amount?.toLocaleString()}</TableCell>
                <TableCell>{p.currency}</TableCell>
                <TableCell><Badge className={statusColor[p.status] || ''}>{p.status}</Badge></TableCell>
                <TableCell>{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</TableCell>
                <TableCell>
                  <Link to="/projects/$id" params={{ id: p.id }}>
                    <Button size="sm" variant="ghost">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
