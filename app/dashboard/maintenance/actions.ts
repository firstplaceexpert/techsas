'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/permissions'
import type { ActionResult, AssetMaintenance } from '@/types'

export interface MaintenanceWithRelations extends AssetMaintenance {
  asset: {
    id: string
    asset_code: string
    name: string
    photo_url: string | null
    condition: string
    business_unit: { id: string; name: string } | null
    current_location: { id: string; name: string } | null
  } | null
  technician: {
    id: string
    full_name: string
    role: string
  } | null
}

export async function getMaintenanceList(filters: {
  status?: string
  type?: string
  search?: string
} = {}): Promise<MaintenanceWithRelations[]> {
  const supabase = await createClient()

  let query = (supabase.from('asset_maintenance') as any)
    .select(
      `
      *,
      asset:assets(
        id, asset_code, name, photo_url, condition,
        business_unit:business_units(id, name),
        current_location:locations(id, name)
      ),
      technician:profiles(id, full_name, role)
    `
    )
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.type) {
    query = query.eq('maintenance_type', filters.type)
  }

  const { data, error } = await query

  if (error) return []

  let list = (data || []) as MaintenanceWithRelations[]

  if (filters.search) {
    const s = filters.search.toLowerCase()
    list = list.filter(
      (m) =>
        m.asset?.name.toLowerCase().includes(s) ||
        m.asset?.asset_code.toLowerCase().includes(s) ||
        m.notes?.toLowerCase().includes(s)
    )
  }

  return list
}

export async function getMaintenanceById(id: string): Promise<MaintenanceWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('asset_maintenance') as any)
    .select(
      `
      *,
      asset:assets(
        id, asset_code, name, photo_url, condition,
        business_unit:business_units(id, name),
        current_location:locations(id, name)
      ),
      technician:profiles(id, full_name, role)
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as MaintenanceWithRelations
}

export async function createMaintenance(values: {
  asset_id: string
  maintenance_type: 'preventive' | 'corrective' | 'predictive'
  scheduled_date: string
  technician_id?: string | null
  notes?: string | null
}): Promise<ActionResult<AssetMaintenance>> {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('asset_maintenance') as any)
    .insert({
      asset_id: values.asset_id,
      maintenance_type: values.maintenance_type,
      scheduled_date: values.scheduled_date || new Date().toISOString().split('T')[0],
      technician_id: values.technician_id || null,
      notes: values.notes || null,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // Optionally set asset condition to 'under_repair'
  if (values.maintenance_type === 'corrective') {
    await (supabase
      .from('assets') as any)
      .update({ condition: 'under_repair' })
      .eq('id', values.asset_id)
  }

  revalidatePath('/dashboard/maintenance')
  revalidatePath(`/dashboard/assets/${values.asset_id}`)
  return { success: true, data }
}

export async function completeMaintenance(
  id: string,
  payload: {
    cost?: number | null
    completed_date: string
    notes?: string | null
    next_schedule_date?: string | null
    assetCondition?: string
  }
): Promise<ActionResult> {
  const supabase = await createClient()

  // 1. Fetch current maintenance to get asset_id
  const { data: maint } = await (supabase
    .from('asset_maintenance') as any)
    .select('asset_id, notes')
    .eq('id', id)
    .single()

  if (!maint) return { success: false, error: 'Data pemeliharaan tidak ditemukan' }

  const combinedNotes = payload.notes
    ? `${maint.notes || ''}\n[Penyelesaian]: ${payload.notes}`
    : maint.notes

  const { error } = await (supabase
    .from('asset_maintenance') as any)
    .update({
      status: 'completed',
      completed_date: payload.completed_date || new Date().toISOString().split('T')[0],
      cost: payload.cost || 0,
      notes: combinedNotes,
      next_schedule_date: payload.next_schedule_date || null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  // 2. Restore or update asset condition
  if (payload.assetCondition) {
    await (supabase
      .from('assets') as any)
      .update({ condition: payload.assetCondition })
      .eq('id', maint.asset_id)
  } else {
    await (supabase
      .from('assets') as any)
      .update({ condition: 'good' })
      .eq('id', maint.asset_id)
  }

  revalidatePath('/dashboard/maintenance')
  revalidatePath(`/dashboard/maintenance/${id}`)
  revalidatePath(`/dashboard/assets/${maint.asset_id}`)
  return { success: true, data: undefined }
}

export async function getMaintenanceMetrics() {
  const supabase = await createClient()

  const { data } = await (supabase
    .from('asset_maintenance') as any)
    .select('status, cost, scheduled_date')

  const items = (data || []) as { status: string; cost: number | null; scheduled_date: string | null }[]

  const scheduled = items.filter((i) => i.status === 'scheduled').length
  const inProgress = items.filter((i) => i.status === 'in_progress').length
  const completed = items.filter((i) => i.status === 'completed').length

  const today = new Date().toISOString().split('T')[0]
  const overdue = items.filter((i) => i.status === 'scheduled' && i.scheduled_date && i.scheduled_date < today).length

  const totalCost = items.reduce((sum, i) => sum + (Number(i.cost) || 0), 0)

  return {
    scheduled,
    inProgress,
    completed,
    overdue,
    totalCost,
    total: items.length,
  }
}
