import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import { signInWithPassword, signInWithGoogle } from '@/lib/auth'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export const Route = createFileRoute('/login')({
  component: LoginPage,
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

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle()
    if (error) toast.error(error.message)
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
              Use your email or Google account.
            </p>
          </div>

          <Button
            onClick={handleGoogle}
            variant="outline"
            className="w-full border-[oklch(0.2_0_0)] bg-[oklch(0.08_0_0)] text-[oklch(0.95_0_0)] hover:bg-[oklch(0.12_0_0)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-[oklch(0.4_0_0)]">
            <div className="h-px flex-1 bg-[oklch(0.15_0_0)]" />
            or
            <div className="h-px flex-1 bg-[oklch(0.15_0_0)]" />
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
          </div>
        </div>
      </div>
    </div>
  )
}
