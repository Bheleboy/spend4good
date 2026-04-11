import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Search, CheckCircle, XCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const Route = createFileRoute('/_app/documents')({
  component: DocumentsPage,
})

function DocumentsPage() {
  const { user, can } = useAuth()
  const [docs, setDocs] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadDocs = async () => {
    if (!user) return
    let q = supabase.from('documents')
      .select('*, projects(name), users!documents_uploaded_by_fkey(full_name)')
      .eq('org_id', user.org_id)
      .order('created_at', { ascending: false })
    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    if (projectFilter !== 'all') q = q.eq('project_id', projectFilter)
    const { data } = await q
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    supabase.from('projects').select('id, name').eq('org_id', user.org_id).then(r => setProjects(r.data || []))
  }, [user])

  useEffect(() => { loadDocs() }, [user, statusFilter, projectFilter])

  const filtered = docs.filter(d =>
    (d.vendor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.file_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleApprove = async (docId: string) => {
    const { error } = await supabase.from('documents').update({
      status: 'approved',
      approved_by: user!.id,
      approved_at: new Date().toISOString(),
    }).eq('id', docId)
    if (error) { toast.error(error.message); return }
    toast.success('Document approved')
    setSelectedDoc(null)
    loadDocs()
  }

  const handleReject = async (docId: string) => {
    const { error } = await supabase.from('documents').update({
      status: 'rejected',
    }).eq('id', docId)
    if (error) { toast.error(error.message); return }
    toast.success('Document rejected')
    setSelectedDoc(null)
    setRejectReason('')
    loadDocs()
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-warning-foreground',
    approved: 'bg-success text-success-foreground',
    rejected: 'bg-destructive text-destructive-foreground',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Documents</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by vendor or file..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Uploader</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No documents found</TableCell></TableRow>
            ) : filtered.map(d => (
              <TableRow key={d.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedDoc(d)}>
                <TableCell>{d.transaction_date ? new Date(d.transaction_date).toLocaleDateString() : '—'}</TableCell>
                <TableCell>{d.projects?.name || '—'}</TableCell>
                <TableCell>{d.users?.full_name || '—'}</TableCell>
                <TableCell>{d.file_type || '—'}</TableCell>
                <TableCell>{d.currency} {d.amount?.toLocaleString()}</TableCell>
                <TableCell>{d.vendor_name || '—'}</TableCell>
                <TableCell><Badge className={statusColors[d.status] || ''}>{d.status}</Badge></TableCell>
                <TableCell>
                  {can('approve_doc') && d.status === 'pending' && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-success" onClick={() => handleApprove(d.id)}><CheckCircle className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { setSelectedDoc(d); setRejectReason('') }}><XCircle className="h-4 w-4" /></Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedDoc} onOpenChange={o => { if (!o) setSelectedDoc(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Document Details</DialogTitle></DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Project:</span> <span className="ml-1 font-medium">{selectedDoc.projects?.name}</span></div>
                <div><span className="text-muted-foreground">Uploader:</span> <span className="ml-1 font-medium">{selectedDoc.users?.full_name}</span></div>
                <div><span className="text-muted-foreground">Amount:</span> <span className="ml-1 font-medium">{selectedDoc.currency} {selectedDoc.amount?.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Vendor:</span> <span className="ml-1 font-medium">{selectedDoc.vendor_name}</span></div>
                <div><span className="text-muted-foreground">Date:</span> <span className="ml-1 font-medium">{selectedDoc.transaction_date ? new Date(selectedDoc.transaction_date).toLocaleDateString() : '—'}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={`ml-1 ${statusColors[selectedDoc.status] || ''}`}>{selectedDoc.status}</Badge></div>
              </div>

              <div className="flex h-40 items-center justify-center rounded-md bg-muted">
                <div className="text-center text-muted-foreground">
                  <FileText className="mx-auto h-8 w-8" />
                  <p className="mt-1 text-sm">Receipt Image</p>
                </div>
              </div>

              {can('approve_doc') && selectedDoc.status === 'pending' && (
                <div className="space-y-3 border-t border-border pt-3">
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Rejection reason (optional)"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-success text-success-foreground hover:bg-success/90" onClick={() => handleApprove(selectedDoc.id)}>
                      <CheckCircle className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleReject(selectedDoc.id)}>
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
