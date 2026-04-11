import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, FileText, DollarSign, Activity } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const Route = createFileRoute('/_app/projects/$id')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { id } = Route.useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [pRes, dRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('documents').select('*, users!documents_uploaded_by_fkey(full_name)').eq('project_id', id).order('created_at', { ascending: false }),
      ])
      setProject(pRes.data)
      setDocs(dRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <p className="text-muted-foreground">Loading...</p>
  if (!project) return <p className="text-muted-foreground">Project not found</p>

  const totalSpent = docs.filter(d => d.status === 'approved').reduce((s, d) => s + (d.amount || 0), 0)
  const budget = project.budget_amount || 0
  const remaining = budget - totalSpent
  const pct = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0

  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-warning-foreground',
    approved: 'bg-success text-success-foreground',
    rejected: 'bg-destructive text-destructive-foreground',
  }

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {project.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}
          </div>
          <Badge className={project.status === 'active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>{project.status}</Badge>
        </div>
        <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
          <span>Budget: {project.currency} {budget.toLocaleString()}</span>
          {project.start_date && <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>}
          {project.end_date && <span>End: {new Date(project.end_date).toLocaleDateString()}</span>}
        </div>
      </Card>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents"><FileText className="mr-1 h-4 w-4" />Documents</TabsTrigger>
          <TabsTrigger value="budget"><DollarSign className="mr-1 h-4 w-4" />Budget</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="mr-1 h-4 w-4" />Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Uploader</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No documents</TableCell></TableRow>
                ) : docs.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.file_name}</TableCell>
                    <TableCell>{d.users?.full_name || '—'}</TableCell>
                    <TableCell>{d.currency} {d.amount?.toLocaleString()}</TableCell>
                    <TableCell>{d.vendor_name || '—'}</TableCell>
                    <TableCell><Badge className={statusColors[d.status] || ''}>{d.status}</Badge></TableCell>
                    <TableCell>{d.transaction_date ? new Date(d.transaction_date).toLocaleDateString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-xl font-bold text-foreground">{project.currency} {budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-xl font-bold text-success">{project.currency} {totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-foreground'}`}>{project.currency} {remaining.toLocaleString()}</p>
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Budget utilization</span>
                <span>{pct.toFixed(1)}%</span>
              </div>
              <Progress value={pct} className="h-3" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="p-6">
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {docs.map(d => (
                  <div key={d.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">{d.file_name} uploaded</p>
                      <p className="text-xs text-muted-foreground">{d.users?.full_name} · {d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</p>
                    </div>
                    <Badge className={`ml-auto text-[10px] ${statusColors[d.status] || ''}`}>{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
