import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/lib/demo/mock-client'

export async function createClient(): Promise<any> {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-techsas.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  const demoSessionCookie = cookieStore.get('techsas_demo_session')?.value
  const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder')

  if (isPlaceholder || demoSessionCookie) {
    let activeEmail = 'admin@techsas.id'
    if (demoSessionCookie) {
      try {
        const parsed = JSON.parse(demoSessionCookie)
        if (parsed.email) activeEmail = parsed.email
      } catch {}
    }
    return createMockSupabaseClient(activeEmail)
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored when called from Server Component
          }
        },
      },
    }
  )
}
