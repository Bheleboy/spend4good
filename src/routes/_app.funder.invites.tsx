import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Loader2, Mail, Send, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/funder/invites')({
  component: FunderInvitesPage,
})

type Invitation = {
  id: string
  nonprofit_name: string
  nonprofit_email: string
  token: string
  status: string
  created_at: string
  expires_at: string
  accepted_at: string | null
}

const inviteSchema = z.object({
  nonprofit_name: z.string().trim().min(1, 'Organisation name is required').max(120),
  nonprofit_email: z.string().trim().email('Enter a valid email').max(255),
})

function FunderInvitesPage() {
  const { user } = useAuth()
  const [invites, setInvites] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string>('')

  const isFunderAdmin = user?.role === 'funder_admin'

  const loadInvites = async () => {
    if (!user?.org_id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('invitations')
      .select('id,nonprofit_name,nonprofit_email,token,status,created_at,expires_at,accepted_at')
      .eq('funder_org_id', user.org_id)
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setInvites((data as Invitation[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!user?.org_id) return
    supabase.from('organizations').select('name').eq('id', user.org_id).maybeSingle()
      .then(({ data }) => setOrgName(data?.name ?? 'Your organisation'))
    loadInvites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.org_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.org_id) return

    const parsed = inviteSchema.safeParse({ nonprofit_name: name, nonprofit_email: email })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          funder_org_id: user.org_id,
          nonprofit_name: parsed.data.nonprofit_name,
          nonprofit_email: parsed.data.nonprofit_email,
        })
        .select('id,token,nonprofit_name,nonprofit_email')
        .single()

      if (error || !data) throw error ?? new Error('Failed to create invitation')

      const { error: fnError } = await supabase.functions.invoke('send-invite', {
        body: {
          nonprofit_name: data.nonprofit_name,
          nonprofit_email: data.nonprofit_email,
          funder_org_name: orgName,
          invite_token: data.token,
          org_id: user.org_id,
        },
      })

      if (fnError) {
        toast.warning('Invite saved, but email failed to send. You can share the link manually.')
      } else {
        toast.success(`Invite sent to ${data.nonprofit_email}`)
      }

      setName('')
      setEmail('')
      await loadInvites()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setSubmitting(false)
    }
  }

  const copyLink = async (token: string) => {
    const url = `https://spend4good.com/onboarding?type=invited&token=${encodeURIComponent(token)}`
    await navigator.clipboard.writeText(url)
    setCopied(token)
    toast.success('Invite link copied')
    setTimeout(() => setCopied(null), 1500)
  }

  if (!isFunderAdmin) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold text-foreground">Funder admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only funder administrators can invite nonprofit organisations to Spend4Good.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Invite a Nonprofit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send an invitation email — the nonprofit sets up their own account and is linked to {orgName}.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Organisation name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Foundation"
              maxLength={120}
              disabled={submitting}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Contact email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@acme.org"
              maxLength={255}
              disabled={submitting}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? 'Sending…' : 'Send invite'}
        </button>
      </form>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Sent invitations</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : invites.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Mail className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No invitations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invites.map((inv) => {
              const expired = new Date(inv.expires_at) < new Date() && inv.status === 'pending'
              const statusLabel = inv.status === 'accepted'
                ? 'Accepted'
                : expired
                  ? 'Expired'
                  : 'Pending'
              const statusClass = inv.status === 'accepted'
                ? 'bg-emerald-500/10 text-emerald-400'
                : expired
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-amber-500/10 text-amber-400'
              return (
                <div key={inv.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {inv.nonprofit_name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {inv.nonprofit_email} · sent {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                    {inv.status === 'pending' && !expired && (
                      <button
                        onClick={() => copyLink(inv.token)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {copied === inv.token ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy link
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
