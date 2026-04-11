import type { UserRole } from './permissions'

export interface AuthUser {
  id: string
  phone_number: string
  org_id: string
  role: UserRole
  full_name: string
  email: string | null
  is_active: boolean
  organization?: {
    id: string
    name: string
    slug: string
    subscription_tier: string
  }
}

const AUTH_KEY = 'spend4good_user'

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function storeUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

export function clearUser(): void {
  localStorage.removeItem(AUTH_KEY)
}

const API_BASE = 'http://localhost:3000/api'

export async function requestOtp(phone: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phone }),
  })
  return res.json()
}

export async function verifyOtp(phone: string, otp: string): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phone, otp }),
  })
  return res.json()
}
