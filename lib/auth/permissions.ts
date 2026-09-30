import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Profile, UserRole } from '@/types/database'
import { DEMO_USERS } from '@/lib/demo/mock-data'

/**
 * Get the currently authenticated user along with their profile.
 * Throws a redirect to /login if not authenticated.
 */
export async function getCurrentUser(): Promise<{
  id: string
  email: string
  profile: Profile
}> {
  const cookieStore = await cookies()
  const demoCookie = cookieStore.get('techsas_demo_session')?.value
  if (demoCookie) {
    try {
      const parsed = JSON.parse(demoCookie)
      const demo = DEMO_USERS[parsed.email] || DEMO_USERS['admin@techsas.id']
      return {
        id: demo.id,
        email: demo.email,
        profile: demo.profile,
      }
    } catch {}
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await (supabase
    .from('profiles') as any)
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  return {
    id: user.id,
    email: user.email!,
    profile: profile as Profile,
  }
}

/**
 * Get just the current user's role.
 * Returns null if not authenticated.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await (supabase
    .from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .single()

  return (data?.role as UserRole) ?? null
}

/**
 * Get just the current user's business_unit_id.
 * Returns null for corporate users or unauthenticated users.
 */
export async function getCurrentUserBusinessUnit(): Promise<string | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await (supabase
    .from('profiles') as any)
    .select('business_unit_id')
    .eq('id', user.id)
    .single()

  return data?.business_unit_id ?? null
}

/**
 * Require the user to have one of the given roles.
 * Redirects to /unauthorized if the check fails.
 */
export async function requireRole(...roles: UserRole[]): Promise<Profile> {
  const { profile } = await getCurrentUser()

  if (!roles.includes(profile.role as UserRole)) {
    redirect('/unauthorized')
  }

  return profile
}

/**
 * Check if the current user is a corporate-level user
 * (super_admin or corporate_admin).
 */
export async function isCorporateUser(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === 'super_admin' || role === 'corporate_admin'
}

/**
 * Check if the current user can manage (write) assets in a given business unit.
 */
export async function canManageBusinessUnit(businessUnitId: string): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await (supabase
    .from('profiles') as any)
    .select('role, business_unit_id')
    .eq('id', user.id)
    .single()

  if (!profile) return false

  if (profile.role === 'super_admin' || profile.role === 'corporate_admin') return true
  if (profile.role === 'viewer') return false

  return profile.business_unit_id === businessUnitId
}
