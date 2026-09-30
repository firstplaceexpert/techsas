import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/lib/demo/mock-client'

export function createClient(): any {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-techsas.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder')
  if (isPlaceholder) {
    return createMockSupabaseClient()
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
