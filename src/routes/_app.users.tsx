import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Plus, MessageCircle, Info, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { roleColors, type UserRole } from '@/lib/permissions'

interface UsersSearch { add?: string }

export const Route = createFileRoute('/_app/users')({
  component: UsersPage,
  validateSearch: (s: Record<string, unknown>): UsersSearch => ({
    add: typeof s.add === 'string' ? s.add : undefined,
  }),
})

const TWILIO_DISPLAY = (import.meta.env.VITE_TWILIO_WHATSAPP_FROM as string | undefined) ?? '+1 415 523 8886'

function UsersPage() {
  const { user } = useAuth()
  const { add } = useSearch({ from: '/_app/users' })
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ phone_number: '', whatsapp_number: '', full_name: '', email: '', role: 'field_agent' })
  const [editingWa, setEditingWa] = useState<string | null>(null)
  const [waValue, setWaValue] = useState('')

  const loadUsers = async () => {
    if (!user) return
    const { data } = await supabase.from('users').select('*').eq('org_id', user.org_id).order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [user])

  useEffect(() => {
    if (add) {
      setForm((f) => ({ ...f, whatsapp_number: add, phone_number: add }))
      setDialogOpen(true)
    }
  }, [add])

  const handleAddUser = async () => {
    if (!form.phone_number || !form.full_name) { toast.error('Phone and name required'); return }
    const { error } = await supabase.from('users').insert({
      org_id: user!.org_id,
      phone_number: form.phone_number,
      whatsapp_number: form.whatsapp_number || form.phone_number,
      full_name: form.full_name,
      email: form.email || null,
      role: form.role,
      is_active: true,
    })
    if (error) { toast.error(error.message); return }
    toast.success('User added!')
    setDialogOpen(false)
    setForm({ phone_number: '', whatsapp_number: '', full_name: '', email: '', role: 'field_agent' })
    loadUsers()
  }

  const saveWa = async (userId: string) => {
    const { error } = await supabase.from('users').update({ whatsapp_number: waValue || null }).eq('id', userId)
    if (error) { toast.error(error.message); return }
    setEditingWa(null); setWaValue('')
    toast.success('WhatsApp number saved')
    loadUsers()
  }

  const testNumber = async (u: any) => {
    if (!u.whatsapp_number) { toast.error('No WhatsApp number set'); return }
    const { data } = await supabase.from('users').select('id').eq('whatsapp_number', u.whatsapp_number).maybeSingle()
    if (data) toast.success(`${u.whatsapp_number} is registered and ready for WhatsApp submissions`)
    else toast.error('Not registered')
  }

  const toggleActive = async (userId: string, current: boolean) => {
    const { error } = await supabase.from('users').update({ is_active: !current }).eq('id', userId)
    if (error) { toast.error(error.message); return }
    loadUsers()
  }

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
    if (error) { toast.error(error.message); return }
    toast.success('Role updated')
    loadUsers()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Full Name *</label>
                <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone Number *</label>
                <Input value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+27..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">WhatsApp Number</label>
                <Input value={form.whatsapp_number} onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))} placeholder="Defaults to phone number if empty" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="funder">Funder</SelectItem>
                    <SelectItem value="field_agent">Field Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>After saving, this user's WhatsApp number will be active for expense submissions immediately. They should send a message to <strong className="text-foreground">{TWILIO_DISPLAY}</strong> to test their connection.</span>
              </div>
              <Button className="w-full" onClick={handleAddUser}>Add User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No users found</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell>{u.phone_number ?? '—'}</TableCell>
                <TableCell>
                  {editingWa === u.id ? (
                    <div className="flex gap-1">
                      <Input value={waValue} onChange={(e) => setWaValue(e.target.value)} className="h-7 w-32 text-xs" />
                      <Button size="sm" onClick={() => saveWa(u.id)}>Save</Button>
                    </div>
                  ) : u.whatsapp_number ? (
                    <span className="inline-flex items-center gap-1 text-sm"><MessageCircle className="h-4 w-4 text-success" />{u.whatsapp_number}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-warning/20 text-warning border border-warning/30 text-[10px]">WhatsApp not set</Badge>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingWa(u.id); setWaValue(u.phone_number ?? '') }}>Add</Button>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {user?.role === 'admin' ? (
                    <Select value={u.role} onValueChange={(v) => changeRole(u.id, v)}>
                      <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="funder">Funder</SelectItem>
                        <SelectItem value="field_agent">Field Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={roleColors[u.role as UserRole] || ''}>{u.role?.replace('_', ' ')}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={u.is_active ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user?.role === 'admin' && (
                    <div className="flex items-center gap-2">
                      <Switch checked={u.is_active} onCheckedChange={() => toggleActive(u.id, u.is_active)} />
                      <Button size="sm" variant="ghost" onClick={() => testNumber(u)} title="Test WhatsApp number">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
