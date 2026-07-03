import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Loader2, Globe, Send } from 'lucide-react'
import { toast } from 'sonner'

export function NonZaCompliancePlaceholder({ area }: { area: string }) {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const country = user?.organization?.country ?? ''

  const requestPack = async () => {
    if (!user?.org_id) return
    setSending(true)
    const { error } = await supabase.from('jurisdiction_requests').insert({
      org_id: user.org_id,
      country: country || 'unspecified',
    })
    setSending(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
    toast.success("Thanks — we've logged your request.")
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">South African Compliance Pack</h1>
          <p className="text-xs text-muted-foreground">{area}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        This compliance calendar covers South African regulatory requirements
        (DSD, CIPC, POPIA, Section 18A). Your spend tracking, document vault,
        and reporting tools work fully regardless of location. Want us to
        prioritise your country{country ? ` (${country})` : ''}? Let us know.
      </p>
      <button
        onClick={requestPack}
        disabled={sending || sent}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sent ? 'Request logged' : sending ? 'Sending…' : 'Request my jurisdiction'}
      </button>
    </div>
  )
}

export function useIsZa(): { ready: boolean; isZa: boolean } {
  const { user, isLoading } = useAuth()
  const c = (user?.organization?.country ?? '').trim().toLowerCase()
  const isZa = c === 'za' || c === 'south africa' || c === ''
  return { ready: !isLoading, isZa }
}
