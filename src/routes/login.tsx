import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import { signInWithPassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { checkout?: string } => ({
    checkout: typeof search.checkout === 'string' ? search.checkout : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Sign In — Spend4Good' },
      { name: 'description', content: 'Sign in to your Spend4Good dashboard.' },
    ],
  }),
})

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const { refresh } = useAuth()
  const navigate = useNavigate()

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error('Enter email and password')
      return
    }
    setLoading(true)
    const { error } = await signInWithPassword(email, password)
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    await refresh()
    toast.success('Signed in')
    navigate({ to: '/dashboard' })
  }

  const handleForgot = async () => {
    if (!email) {
      toast.error('Enter your email above first')
      return
    }
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setResetLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password reset link sent — check your email.')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.03_0_0)] text-[oklch(0.95_0_0)]">
      <nav className="flex items-center justify-between px-8 py-6 md:px-16">
        <Link to="/" className="flex items-center gap-2 text-[oklch(0.5_0_0)] hover:text-[oklch(0.8_0_0)] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[oklch(0.95_0_0)]">
            <span className="text-xs font-black text-[oklch(0.03_0_0)]">S4</span>
          </div>
          <span className="text-sm font-semibold">Spend4Good</span>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-[oklch(0.15_0_0)] bg-[oklch(0.06_0_0)] p-8 md:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Sign in to your dashboard</h1>
            <p className="mt-2 text-sm text-[oklch(0.45_0_0)]">
              Sign in with your work email.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@org.com"
                  className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[oklch(0.7_0_0)]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.35_0_0)]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] pl-10 text-[oklch(0.95_0_0)] placeholder:text-[oklch(0.3_0_0)]"
                />
              </div>
              <button
                type="button"
                onClick={handleForgot}
                disabled={resetLoading}
                className="mt-2 text-xs text-[oklch(0.6_0_0)] hover:text-[oklch(0.9_0_0)] transition-colors disabled:opacity-60"
              >
                {resetLoading ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>
            <Button
              className="w-full bg-[oklch(0.95_0_0)] text-[oklch(0.03_0_0)] hover:bg-[oklch(0.85_0_0)] font-semibold"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="mt-8 border-t border-[oklch(0.12_0_0)] pt-6 text-center">
            <p className="text-xs text-[oklch(0.4_0_0)]">
              Don't have an account?{' '}
              <Link to="/onboarding" search={{ type: 'nonprofit' }} className="text-[oklch(0.8_0_0)] hover:underline">
                Get started
              </Link>
            </p>
            <p className="mt-4 flex items-center justify-center gap-3 text-xs text-[oklch(0.35_0_0)]">
              <Link to="/terms" className="hover:text-[oklch(0.8_0_0)]">Terms</Link>
              <span>·</span>
              <Link to="/privacy" className="hover:text-[oklch(0.8_0_0)]">Privacy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
