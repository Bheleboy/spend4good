import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type AuthUser, getStoredUser, storeUser, clearUser } from '@/lib/auth'
import { type Permission, hasPermission } from '@/lib/permissions'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => void
  can: (action: Permission) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const login = useCallback((u: AuthUser) => {
    storeUser(u)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    clearUser()
    setUser(null)
  }, [])

  const can = useCallback((action: Permission) => {
    if (!user) return false
    return hasPermission(user.role, action)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
