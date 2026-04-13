import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Plus, Search, UserPlus, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const Route = createFileRoute('/_app/beneficiaries')({
  component: BeneficiariesPage,
})

function BeneficiariesPage() {
  const { user, can } = useAuth()
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    id_number: '',
    phone_number: '',
    email: '',
    gender: '',
    date_of_birth: '',
    address: '',
    notes: '',
    project_id: '',
  })

  const load = async () => {
    if (!user) return
    const [bRes, pRes] = await Promise.all([
      supabase.from('beneficiaries').select('*, project_beneficiaries(project_id, projects(name))').eq('org_id', user.org_id).order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').eq('org_id', user.org_id).eq('status', 'active'),
    ])
    setBeneficiaries(bRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const filtered = beneficiaries.filter(b =>
    b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.id_number?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!form.full_name) { toast.error('Name is required'); return }
    const { data: ben, error } = await supabase.from('beneficiaries').insert({
      org_id: user!.org_id,
      full_name: form.full_name,
      id_number: form.id_number || null,
      phone_number: form.phone_number || null,
      email: form.email || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      address: form.address || null,
      notes: form.notes || null,
      created_by: user!.id,
    }).select().single()

    if (error) { toast.error(error.message); return }

    // Link to project if selected
    if (form.project_id && ben) {
      await supabase.from('project_beneficiaries').insert({
        project_id: form.project_id,
        beneficiary_id: ben.id,
      })
    }

    toast.success('Beneficiary added!')
    setDialogOpen(false)
    setForm({ full_name: '', id_number: '', phone_number: '', email: '', gender: '', date_of_birth: '', address: '', notes: '', project_id: '' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Beneficiaries</h1>
        {(can('create_project') || can('view_own')) && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-1 h-4 w-4" /> Add Beneficiary</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Beneficiary</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Full Name *</label>
                  <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">ID Number</label>
                    <Input value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Gender</label>
                    <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Phone</label>
                    <Input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+27..." />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Email</label>
                    <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Date of Birth</label>
                  <Input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Address</label>
                  <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Link to Project</label>
                  <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Notes</label>
                  <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <p className="text-xs text-muted-foreground">Photo can be added after creation or via WhatsApp.</p>
                <Button className="w-full" onClick={handleCreate}>Add Beneficiary</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No beneficiaries found</TableCell></TableRow>
            ) : filtered.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.full_name}</TableCell>
                <TableCell>{b.id_number || '—'}</TableCell>
                <TableCell>{b.phone_number || '—'}</TableCell>
                <TableCell className="capitalize">{b.gender || '—'}</TableCell>
                <TableCell>
                  {b.project_beneficiaries?.length > 0
                    ? b.project_beneficiaries.map((pb: any) => pb.projects?.name).filter(Boolean).join(', ')
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge className={b.is_active ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
