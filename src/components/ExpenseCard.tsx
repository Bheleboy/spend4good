import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, MessageCircle, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export interface ExpenseRow {
  id: string
  project_id: string
  amount: number
  currency: string
  description: string
  category: string | null
  status: string
  receipt_url: string | null
  whatsapp_message_id: string | null
  submitted_at: string
  approved_at: string | null
  rejection_reason: string | null
  submitted_by_user?: { full_name: string } | null
  approved_by_user?: { full_name: string } | null
  project?: { name: string } | null
}

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase()
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border border-warning/30',
  approved: 'bg-success/20 text-success border border-success/30',
  rejected: 'bg-destructive/20 text-destructive border border-destructive/30',
  flagged: 'bg-destructive/20 text-destructive border border-destructive/30',
}

export function ExpenseCard({
  expense,
  onChange,
  highlight,
  showProject = true,
}: {
  expense: ExpenseRow
  onChange?: () => void
  highlight?: boolean
  showProject?: boolean
}) {
  const { user } = useAuth()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const canApprove = user?.role === 'admin' || user?.role === 'project_manager' || user?.role === 'director'
  const isWa = !!expense.whatsapp_message_id

  const approve = async () => {
    setBusy(true)
    const { error } = await supabase
      .from('expenses')
      .update({ status: 'approved', approved_by: user!.id, approved_at: new Date().toISOString() })
      .eq('id', expense.id)
    setBusy(false)
    if (error) { toast.error(error.message); return }
    toast.success('Expense approved')
    onChange?.()
  }

  const reject = async () => {
    setBusy(true)
    const { error } = await supabase
      .from('expenses')
      .update({ status: 'rejected', approved_by: user!.id, approved_at: new Date().toISOString(), rejection_reason: reason || null })
      .eq('id', expense.id)
    setBusy(false)
    if (error) { toast.error(error.message); return }
    toast.success('Expense rejected')
    setRejectOpen(false)
    setReason('')
    onChange?.()
  }

  return (
    <Card
      id={`expense-${expense.id}`}
      className={`p-4 sm:p-5 transition ${highlight ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {initials(expense.submitted_by_user?.full_name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{expense.submitted_by_user?.full_name ?? 'Unknown'}</span>
              {showProject && expense.project?.name && (
                <Badge variant="outline" className="text-xs">{expense.project.name}</Badge>
              )}
              <Badge className={`text-[10px] ${isWa ? 'bg-success/20 text-success border border-success/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                {isWa ? <><MessageCircle className="mr-1 h-3 w-3" />WhatsApp</> : <><FileText className="mr-1 h-3 w-3" />Manual</>}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{expense.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">{timeAgo(expense.submitted_at)}</p>
            {expense.status !== 'pending' && expense.approved_by_user && (
              <p className="mt-1 text-xs text-muted-foreground">
                {expense.status} by {expense.approved_by_user.full_name}{expense.approved_at ? ` · ${timeAgo(expense.approved_at)}` : ''}
              </p>
            )}
            {expense.rejection_reason && (
              <p className="mt-1 text-xs italic text-destructive">Reason: {expense.rejection_reason}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-lg font-bold text-foreground">{expense.currency} {Number(expense.amount).toLocaleString()}</div>
            <Badge className={`text-[10px] ${statusColors[expense.status] ?? ''}`}>{expense.status}</Badge>
          </div>
          {expense.receipt_url && (
            <button onClick={() => setReceiptOpen(true)} className="h-14 w-14 overflow-hidden rounded border border-border hover:opacity-80">
              <img src={expense.receipt_url} alt="receipt" className="h-full w-full object-cover" />
            </button>
          )}
        </div>
      </div>

      {expense.status === 'pending' && canApprove && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <Button size="sm" onClick={approve} disabled={busy} className="bg-success text-success-foreground hover:bg-success/90">
            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} disabled={busy}>
            <XCircle className="mr-1 h-4 w-4" /> Reject
          </Button>
        </div>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject expense</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={busy}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
          {expense.receipt_url && <img src={expense.receipt_url} alt="receipt full" className="max-h-[70vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
