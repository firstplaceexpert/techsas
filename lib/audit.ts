import { createClient } from '@/lib/supabase/server'
import type { AuditAction } from '@/types'

export interface LogAuditParams {
  userId?: string | null
  userName?: string | null
  action: AuditAction
  tableName: string
  recordId?: string | null
  oldData?: Record<string, any> | null
  newData?: Record<string, any> | null
  description?: string | null
  ipAddress?: string | null
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const supabase = await createClient()

    let user_id = params.userId
    let user_name = params.userName

    if (!user_id) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        user_id = user.id
        user_name = user.user_metadata?.full_name || user.email || 'User'
      }
    }

    await supabase.from('audit_logs').insert({
      user_id: user_id || null,
      user_name: user_name || 'System',
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId || null,
      old_data: params.oldData || null,
      new_data: params.newData || null,
      description: params.description || null,
      ip_address: params.ipAddress || null,
    })
  } catch (err) {
    // Audit logging should never break the main operation
    console.error('Failed to log audit:', err)
  }
}
