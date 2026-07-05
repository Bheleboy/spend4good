import { supabase } from './supabase'
import type { UserRole } from './permissions'

export interface AuthUser {
  id: string
  email: string | null
  phone_number: string | null
  whatsapp_number?: string | null
  whatsapp_verified?: boolean
  org_id: string | null
  role: UserRole
  full_name: string
  is_active: boolean
  organization?: {
    id: string
    name: string
    slug: string
    subscription_tier: string
    type?: string | null
    subscription_plan?: string | null
    country?: string | null
    is_verified?: boolean
    npo_registration_number?: string | null
    pbo_number?: string | null
  }
}

export async function loadProfile(authUserId: string, fallbackEmail?: string | null): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*, organizations(*)')
    .eq('id', authUserId)
    .maybeSingle()

  if (error || !data) return null

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authUserId)
    .limit(1)
    .maybeSingle()

  return {
    id: data.id,
    email: data.email ?? fallbackEmail ?? null,
    phone_number: data.phone_number ?? null,
    whatsapp_number: data.whatsapp_number ?? null,
    whatsapp_verified: data.whatsapp_verified ?? false,
    org_id: data.org_id,
    role: (roleRow?.role ?? data.role ?? 'agent') as UserRole,
    full_name: data.full_name ?? '',
    is_active: data.is_active ?? true,
    organization: data.organizations
      ? {
          id: data.organizations.id,
          name: data.organizations.name,
          slug: data.organizations.slug,
          subscription_tier: data.organizations.subscription_tier,
          type: (data.organizations as any).type ?? null,
          subscription_plan: (data.organizations as any).subscription_plan ?? null,
          country: (data.organizations as any).country ?? null,
          is_verified: (data.organizations as any).is_verified ?? false,
          npo_registration_number: (data.organizations as any).npo_registration_number ?? null,
          pbo_number: (data.organizations as any).pbo_number ?? null,
        }
      : undefined,
  }
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithPassword(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: { full_name: fullName },
    },
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}
