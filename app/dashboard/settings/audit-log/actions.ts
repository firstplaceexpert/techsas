'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/permissions'
import type { AuditLogWithUser, PaginatedResult } from '@/types'

export interface AuditLogFilters {
  search?: string
  action?: string
  tableName?: string
  page?: number
  pageSize?: number
}

export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<PaginatedResult<AuditLogWithUser>> {
  await requireRole('super_admin', 'corporate_admin')

  const supabase = await createClient()
  const { page = 1, pageSize = 25 } = filters

  let query = supabase
    .from('audit_logs')
    .select(
      `
      id, user_id, user_name, action, table_name, record_id,
      old_data, new_data, description, ip_address, created_at,
      user:profiles(id, full_name, role)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (filters.action && filters.action !== 'all') {
    query = query.eq('action', filters.action)
  }

  if (filters.tableName && filters.tableName !== 'all') {
    query = query.eq('table_name', filters.tableName)
  }

  if (filters.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%,record_id.ilike.%${filters.search}%`
    )
  }

  const { data, error, count } = await query

  if (error) {
    console.error('getAuditLogs error:', error)
    return {
      data: [],
      meta: { page, pageSize, total: 0, totalPages: 0 },
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)
  return {
    data: (data || []) as unknown as AuditLogWithUser[],
    meta: {
      total,
      page,
      pageSize,
      totalPages,
    },
    total,
    page,
    pageSize,
    totalPages,
  }
}
