'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/permissions'
import type { ActionResult, Notification } from '@/types'

export async function getNotifications(limit = 10): Promise<{
  notifications: Notification[]
  unreadCount: number
}> {
  try {
    const { profile } = await getCurrentUser()
    const supabase = await createClient()

    const { data: notifications } = await (supabase
      .from('notifications') as any)
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { count } = await (supabase
      .from('notifications') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)

    return {
      notifications: (notifications || []) as Notification[],
      unreadCount: count || 0,
    }
  } catch (e) {
    return { notifications: [], unreadCount: 0 }
  }
}

export async function markNotificationAsRead(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('notifications') as any)
    .update({ is_read: true })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

export async function markAllNotificationsAsRead(): Promise<ActionResult> {
  const { profile } = await getCurrentUser()
  const supabase = await createClient()

  const { error } = await (supabase
    .from('notifications') as any)
    .update({ is_read: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}
