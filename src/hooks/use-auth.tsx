import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { type AuthUser, loadProfile, signOut as supabaseSignOut } from '@/lib/auth'
import { type Permission, hasPermission } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  refresh: () => Promise<void>
  login: (user: AuthUser) => void
  logout: () => Promise<void>
  can: (action: Permission) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const hydrate = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const session = data.session
    if (!session?.user) {
      setUser(null)
      setIsLoading(false)
      return
    }
    const profile = await loadProfile(session.user.id, session.user.email)
    setUser(profile)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    hydrate()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        hydrate()
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [hydrate])

  const login = useCallback((u: AuthUser) => setUser(u), [])

  const logout = useCallback(async () => {
    await supabaseSignOut()
    setUser(null)
  }, [])

  const can = useCallback(
    (action: Permission) => (user ? hasPermission(user.role, action) : false),
    [user],
  )

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, refresh: hydrate, login, logout, can }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
