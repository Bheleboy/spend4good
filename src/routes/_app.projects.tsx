import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Camera, Plus, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ProjectWizard } from '@/components/ProjectWizard'

export const Route = createFileRoute('/_app/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  const { user, can } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [wizardOpen, setWizardOpen] = useState(false)

  const loadProjects = async () => {
    if (!user) return
    let q = supabase.from('projects').select('*').eq('org_id', user.org_id).order('created_at', { ascending: false })
    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    const { data } = await q
    const list = data || []
    setProjects(list)
    setLoading(false)

    if (list.length > 0) {
      const { data: pc } = await supabase
        .from('project_photos')
        .select('project_id')
        .in('project_id', list.map((p: any) => p.id))
      const counts: Record<string, number> = {}
      for (const row of (pc ?? []) as any[]) counts[row.project_id] = (counts[row.project_id] ?? 0) + 1
      setPhotoCounts(counts)
    } else {
      setPhotoCounts({})
    }
  }

  useEffect(() => { loadProjects() }, [user, statusFilter])

  const filtered = projects.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))

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
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> New Project
          </Button>
        )}
      </div>

      <ProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={loadProjects} />

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
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Photos</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No projects found</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.currency ?? 'ZAR'} {Number(p.budget_amount ?? p.budget ?? 0).toLocaleString()}</TableCell>
                <TableCell><Badge className={statusColor[p.status] || ''}>{p.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.location_description || p.province || '—'}</TableCell>
                <TableCell>
                  {photoCounts[p.id] ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Camera className="h-3.5 w-3.5" /> {photoCounts[p.id]}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
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
