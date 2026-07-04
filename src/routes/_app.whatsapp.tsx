import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { MessageCircle, Image as ImageIcon, UserPlus } from 'lucide-react'

export const Route = createFileRoute('/_app/whatsapp')({
  component: WhatsAppLogPage,
})

interface Row {
  id: string
  from_number: string
  body: string | null
  media_url: string | null
  media_count: number
  matched_user_id: string | null
  matched_project_id: string | null
  expense_id: string | null
  received_at: string
  matched_user: { full_name: string } | null
  matched_project: { name: string } | null
  expense: { amount: number; currency: string } | null
}

function WhatsAppLogPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched' | 'media'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user?.org_id) return
    setLoading(true)
    let q = supabase
      .from('whatsapp_messages')
      .select('*, matched_user:users!whatsapp_messages_matched_user_id_fkey(full_name), matched_project:projects(name), expense:expenses(amount, currency)')
      .order('received_at', { ascending: false })
    if (from) q = q.gte('received_at', from)
    if (to) q = q.lte('received_at', to + 'T23:59:59')
    const { data } = await q
    setRows((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.org_id, from, to])

  const filtered = useMemo(() => {
    if (filter === 'matched') return rows.filter((r) => r.matched_user_id)
    if (filter === 'unmatched') return rows.filter((r) => !r.matched_user_id)
    if (filter === 'media') return rows.filter((r) => r.media_count > 0)
    return rows
  }, [rows, filter])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">WhatsApp Log</h1>
        <p className="text-sm text-muted-foreground">Inbound messages from field agents via Twilio.</p>
      </div>

      <Card className="p-4 space-y-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="matched">Matched</TabsTrigger>
            <TabsTrigger value="unmatched">Unmatched</TabsTrigger>
            <TabsTrigger value="media">With Media</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Field Agent</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Media</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Expense</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground p-6">No messages</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.received_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs font-mono">{r.from_number}</TableCell>
                <TableCell>
                  {r.matched_user ? r.matched_user.full_name : (
                    <span className="flex items-center gap-2">
                      <Badge className="bg-destructive/20 text-destructive border border-destructive/30 text-[10px]">Unknown number</Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate({ to: '/users', search: { add: r.from_number } as any })}>
                        <UserPlus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs">{r.body}</TableCell>
                <TableCell>{r.media_url ? <a href={r.media_url} target="_blank" rel="noreferrer"><img src={r.media_url} alt="" className="h-10 w-10 rounded object-cover" /></a> : (r.media_count > 0 ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : '—')}</TableCell>
                <TableCell className="text-xs">{r.matched_project?.name ?? '—'}</TableCell>
                <TableCell className="text-xs">{r.expense ? `${r.expense.currency} ${Number(r.expense.amount).toLocaleString()}` : '—'}</TableCell>
                <TableCell>
                  {r.matched_user_id ? (
                    <Badge className="bg-success/20 text-success border border-success/30 text-[10px]"><MessageCircle className="mr-1 h-3 w-3" />Matched</Badge>
                  ) : (
                    <Badge className="bg-destructive/20 text-destructive border border-destructive/30 text-[10px]">Unmatched</Badge>
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
