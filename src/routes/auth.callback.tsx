import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
  head: () => ({ meta: [{ title: 'Signing in… — Spend4Good' }] }),
})

function AuthCallback() {
  const navigate = useNavigate()
  const { refresh, user, isLoading } = useAuth()

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (isLoading) return
    if (user) navigate({ to: '/dashboard' })
    else navigate({ to: '/login' })
  }, [user, isLoading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
      <div className="flex items-center gap-3 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Completing sign in…
      </div>
    </div>
  )
}
