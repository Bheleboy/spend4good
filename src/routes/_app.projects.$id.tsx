import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Users, DollarSign, MessageCircle, FileBarChart, Trash2 } from 'lucide-react'
import { ExpenseCard, type ExpenseRow } from '@/components/ExpenseCard'
import { ProjectReport } from '@/components/ProjectReport'

export const Route = createFileRoute('/_app/projects/$id')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { id } = Route.useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [orgUsers, setOrgUsers] = useState<any[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [approvedTotal, setApprovedTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expFilter, setExpFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const [addOpen, setAddOpen] = useState(false)
  const [addUserId, setAddUserId] = useState<string>('')
  const [addRole, setAddRole] = useState<'field_agent' | 'project_manager' | 'accountant' | 'viewer'>('field_agent')

  const canManage = user?.role === 'admin' || user?.role === 'director'

  const load = async () => {
    const [p, m, u, e] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_members').select('*, user:users(id, full_name, email, whatsapp_number, phone_number)').eq('project_id', id).order('added_at', { ascending: false }),
      user?.org_id ? supabase.from('users').select('id, full_name, email').eq('org_id', user.org_id).eq('is_active', true) : Promise.resolve({ data: [] } as any),
      supabase.from('expenses').select('*, submitted_by_user:users!expenses_submitted_by_fkey(full_name), approved_by_user:users!expenses_approved_by_fkey(full_name), project:projects(name)').eq('project_id', id).order('submitted_at', { ascending: false }),
    ])
    setProject(p.data)
    setMembers(m.data ?? [])
    setOrgUsers(u.data ?? [])
    const exps = (e.data as any) ?? []
    setExpenses(exps)
    setApprovedTotal(exps.filter((x: any) => x.status === 'approved').reduce((s: number, x: any) => s + Number(x.amount), 0))
    setLoading(false)
  }

  useEffect(() => { load() }, [id, user?.org_id])

  const budget = Number(project?.budget ?? 0)
  const pct = budget > 0 ? Math.min((approvedTotal / budget) * 100, 100) : 0
  const barColor = pct < 70 ? 'bg-success' : pct < 90 ? 'bg-warning' : 'bg-destructive'

  const addMember = async () => {
    if (!addUserId) { toast.error('Pick a user'); return }
    const { error } = await supabase.from('project_members').insert({
      project_id: id, user_id: addUserId, org_id: user!.org_id, role: addRole,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Team member added')
    setAddOpen(false); setAddUserId(''); setAddRole('field_agent')
    load()
  }

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from('project_members').delete().eq('id', memberId)
    if (error) { toast.error(error.message); return }
    load()
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (!project) return <p className="text-sm text-muted-foreground">Project not found</p>

  const filteredExp = expFilter === 'all' ? expenses : expenses.filter((e) => e.status === expFilter)
  const availableUsers = orgUsers.filter((u) => !members.some((m) => m.user_id === u.id))

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview"><DollarSign className="mr-1 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="team"><Users className="mr-1 h-4 w-4" />Team</TabsTrigger>
          <TabsTrigger value="expenses"><MessageCircle className="mr-1 h-4 w-4" />Expenses</TabsTrigger>
          <TabsTrigger value="report"><FileBarChart className="mr-1 h-4 w-4" />Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                {project.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}
              </div>
              <Badge className={project.status === 'active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>{project.status}</Badge>
            </div>
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <div><span className="text-xs uppercase">Budget</span><div className="text-lg font-semibold text-foreground">ZAR {budget.toLocaleString()}</div></div>
              <div><span className="text-xs uppercase">Approved Spend</span><div className="text-lg font-semibold text-success">ZAR {approvedTotal.toLocaleString()}</div></div>
              <div><span className="text-xs uppercase">Remaining</span><div className={`text-lg font-semibold ${budget - approvedTotal < 0 ? 'text-destructive' : 'text-foreground'}`}>ZAR {(budget - approvedTotal).toLocaleString()}</div></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Budget utilisation</span><span>{pct.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="flex gap-6 border-t border-border pt-3 text-xs text-muted-foreground">
              {project.start_date && <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>}
              {project.end_date && <span>End: {new Date(project.end_date).toLocaleDateString()}</span>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{members.length} team member{members.length === 1 ? '' : 's'}</p>
            {canManage && (
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />Add Team Member</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">User</label>
                      <Select value={addUserId} onValueChange={setAddUserId}>
                        <SelectTrigger><SelectValue placeholder="Select active user" /></SelectTrigger>
                        <SelectContent>
                          {availableUsers.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">All active users are already on this project</div>
                          ) : availableUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name} — {u.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Role</label>
                      <Select value={addRole} onValueChange={(v) => setAddRole(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="field_agent">Field agent</SelectItem>
                          <SelectItem value="project_manager">Project manager</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button onClick={addMember}>Add to Project</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone / WhatsApp</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  {canManage && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground p-6">No team members yet. Add field agents so they can submit expenses via WhatsApp.</TableCell></TableRow>
                ) : members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.user?.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.user?.whatsapp_number ?? m.user?.phone_number ?? '—'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{m.role.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(m.added_at).toLocaleDateString()}</TableCell>
                    {canManage && (
                      <TableCell><Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 space-y-3">
          <Tabs value={expFilter} onValueChange={(v) => setExpFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          {filteredExp.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">No expenses to show</Card>
          ) : (
            <div className="space-y-3">
              {filteredExp.map((e) => <ExpenseCard key={e.id} expense={e} onChange={load} showProject={false} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <ProjectReport projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
