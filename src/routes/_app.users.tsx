import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { roleColors, type UserRole } from '@/lib/permissions'

export const Route = createFileRoute('/_app/users')({
  component: UsersPage,
})

function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ phone_number: '', full_name: '', email: '', role: 'field_agent' })

  const loadUsers = async () => {
    if (!user) return
    const { data } = await supabase.from('users').select('*').eq('org_id', user.org_id).order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [user])

  const handleAddUser = async () => {
    if (!form.phone_number || !form.full_name) { toast.error('Phone and name required'); return }
    const { error } = await supabase.from('users').insert({
      org_id: user!.org_id,
      phone_number: form.phone_number,
      full_name: form.full_name,
      email: form.email || null,
      role: form.role,
      is_active: true,
    })
    if (error) { toast.error(error.message); return }
    toast.success('User added!')
    setDialogOpen(false)
    setForm({ phone_number: '', full_name: '', email: '', role: 'field_agent' })
    loadUsers()
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
                <label className="mb-1 block text-sm font-medium">Phone Number *</label>
                <Input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+27..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Full Name *</label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
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
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No users found</TableCell></TableRow>
            ) : users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell>{u.phone_number}</TableCell>
                <TableCell>
                  {user?.role === 'admin' ? (
                    <Select value={u.role} onValueChange={v => changeRole(u.id, v)}>
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
