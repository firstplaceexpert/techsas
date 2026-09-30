'use server'

import { cookies } from 'next/headers'
import { DEMO_USERS } from '@/lib/demo/mock-data'

const COOKIE_NAME = 'techsas_demo_session'

export async function loginDemo(rawEmail: string, redirectTo = '/dashboard') {
  const normalized = (rawEmail || '').trim().toLowerCase()

  // Match direct email or short username alias
  let matchedUser = DEMO_USERS[normalized]

  if (!matchedUser) {
    if (normalized === 'admin' || normalized.includes('super')) {
      matchedUser = DEMO_USERS['admin@techsas.id']
    } else if (normalized === 'corporate') {
      matchedUser = DEMO_USERS['corporate@techsas.id']
    } else if (normalized.includes('produksi')) {
      matchedUser = DEMO_USERS['admin.produksi@techsas.id']
    } else if (normalized.includes('outlet')) {
      matchedUser = DEMO_USERS['admin.outlet@techsas.id']
    } else if (normalized === 'field' || normalized.includes('teknisi')) {
      matchedUser = DEMO_USERS['field@techsas.id']
    } else {
      // Default to super admin for any custom admin username
      matchedUser = DEMO_USERS['admin@techsas.id']
    }
  }

  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, JSON.stringify({
    email: matchedUser.email,
    id: matchedUser.id,
  }), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })

  return { success: true, redirectTo }
}

export async function logoutDemo() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  return { success: true }
}

export async function getDemoSession() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return DEMO_USERS[parsed.email] || DEMO_USERS['admin@techsas.id']
  } catch {
    return null
  }
}
