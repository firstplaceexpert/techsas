'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole, getCurrentUser } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import type {
  ActionResult,
  PaginatedResult,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderMaintenanceType,
  WorkOrderWithRelations,
  WorkOrderPart,
  WorkOrderComment,
} from '@/types'

export interface WorkOrderFilters {
  search?: string
  status?: string
  priority?: string
  maintenanceType?: string
  businessUnitId?: string
  vendorId?: string
  assetId?: string
  page?: number
  pageSize?: number
}

export interface CreateWorkOrderInput {
  asset_id: string
  title: string
  description?: string | null
  priority: WorkOrderPriority
  maintenance_type: WorkOrderMaintenanceType
  assigned_to?: string | null
  vendor_id?: string | null
  sla_target_hours?: number | null
  labor_cost?: number | null
  parts_cost?: number | null
  notes?: string | null
  parts?: Array<{
    part_name: string
    part_code?: string
    quantity: number
    unit_cost: number
    source?: 'inventory' | 'vendor' | 'cannibalized'
    notes?: string
  }>
}

export async function getWorkOrders(
  filters: WorkOrderFilters = {}
): Promise<PaginatedResult<WorkOrderWithRelations>> {
  const supabase = await createClient()
  const { page = 1, pageSize = 20 } = filters

  let query = supabase
    .from('work_orders')
    .select(
      `
      *,
      asset:assets(
        id, name, asset_code, photo_url, condition,
        business_unit:business_units(id, name),
        current_location:locations(id, name)
      ),
      vendor:vendors(id, name, contact_person, phone, category),
      assigned_user:profiles(id, full_name, role),
      parts:work_order_parts(*),
      comments:work_order_comments(*)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  if (filters.maintenanceType && filters.maintenanceType !== 'all') {
    query = query.eq('maintenance_type', filters.maintenanceType)
  }

  if (filters.vendorId && filters.vendorId !== 'all') {
    query = query.eq('vendor_id', filters.vendorId)
  }

  if (filters.assetId) {
    query = query.eq('asset_id', filters.assetId)
  }

  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,wo_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }

  const { data, error, count } = await query

  if (error) {
    console.error('getWorkOrders error:', error)
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
    data: (data || []) as unknown as WorkOrderWithRelations[],
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

export async function getWorkOrderById(id: string): Promise<WorkOrderWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('work_orders')
    .select(
      `
      *,
      asset:assets(
        id, name, asset_code, photo_url, condition, status, purchase_price, current_book_value,
        business_unit:business_units(id, name, type),
        current_location:locations(id, name, level)
      ),
      vendor:vendors(id, name, contact_person, phone, email, category, rating),
      assigned_user:profiles(id, full_name, role),
      parts:work_order_parts(*),
      comments:work_order_comments(
        *,
        user:profiles(id, full_name, role)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as unknown as WorkOrderWithRelations
}

export async function createWorkOrder(
  input: CreateWorkOrderInput
): Promise<ActionResult<WorkOrder>> {
  const user = await getCurrentUser()
  const supabase = await createClient()

  if (!input.title || input.title.trim().length === 0) {
    return { success: false, error: 'Judul Work Order wajib diisi' }
  }

  if (!input.asset_id) {
    return { success: false, error: 'Aset target wajib dipilih' }
  }

  // Generate sequence number
  const { count } = await supabase.from('work_orders').select('*', { count: 'exact', head: true })
  const nextSeq = (count || 0) + 1
  const woNumber = `WO-${String(nextSeq).padStart(5, '0')}`

  const laborCost = input.labor_cost || 0
  let partsCost = input.parts_cost || 0

  if (input.parts && input.parts.length > 0) {
    partsCost = input.parts.reduce((sum, p) => sum + (p.quantity * p.unit_cost), 0)
  }
  const totalCost = laborCost + partsCost

  const { data: woData, error: woError } = await supabase
    .from('work_orders')
    .insert({
      wo_number: woNumber,
      asset_id: input.asset_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      priority: input.priority || 'medium',
      status: 'pending',
      maintenance_type: input.maintenance_type || 'corrective',
      assigned_to: input.assigned_to || null,
      requested_by: user?.id || null,
      vendor_id: input.vendor_id || null,
      sla_target_hours: input.sla_target_hours || 48,
      labor_cost: laborCost,
      parts_cost: partsCost,
      total_cost: totalCost,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single()

  if (woError || !woData) {
    return { success: false, error: woError?.message || 'Gagal membuat Work Order' }
  }

  // Insert parts if any
  if (input.parts && input.parts.length > 0) {
    const partsToInsert = input.parts.map((p) => ({
      work_order_id: woData.id,
      part_name: p.part_name,
      part_code: p.part_code || null,
      quantity: p.quantity,
      unit_cost: p.unit_cost,
      total_cost: p.quantity * p.unit_cost,
      source: p.source || 'inventory',
      notes: p.notes || null,
    }))
    await supabase.from('work_order_parts').insert(partsToInsert)
  }

  // If corrective or emergency maintenance, optionally update asset condition to under_repair
  if (['corrective', 'emergency'].includes(input.maintenance_type)) {
    await supabase
      .from('assets')
      .update({ condition: 'under_repair' })
      .eq('id', input.asset_id)
  }

  // Log Audit Trail
  await logAudit({
    action: 'create',
    tableName: 'work_orders',
    recordId: woData.id,
    newData: woData,
    description: `Membuat Work Order baru [${woNumber}]: ${woData.title}`,
  })

  revalidatePath('/dashboard/work-orders')
  revalidatePath('/dashboard/maintenance')
  revalidatePath(`/dashboard/assets/${input.asset_id}`)

  return { success: true, data: woData as WorkOrder }
}

export async function updateWorkOrderStatus(
  id: string,
  newStatus: WorkOrderStatus,
  notes?: string
): Promise<ActionResult<WorkOrder>> {
  const supabase = await createClient()
  const existing = await getWorkOrderById(id)

  if (!existing) {
    return { success: false, error: 'Work Order tidak ditemukan' }
  }

  const updates: Partial<WorkOrder> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (notes) {
    updates.notes = existing.notes ? `${existing.notes}\n[Update]: ${notes}` : notes
  }

  if (newStatus === 'in_progress' && !existing.started_at) {
    updates.started_at = new Date().toISOString()
  }

  if (newStatus === 'completed') {
    updates.completed_at = new Date().toISOString()
    // Calculate actual hours if started
    if (existing.started_at) {
      const diffMs = Date.now() - new Date(existing.started_at).getTime()
      updates.actual_hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))
    }
    // Update asset condition back to good
    if (existing.asset_id) {
      await supabase
        .from('assets')
        .update({ condition: 'good' })
        .eq('id', existing.asset_id)
    }
  }

  const { data, error } = await supabase
    .from('work_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || 'Gagal mengubah status Work Order' }
  }

  await logAudit({
    action: 'update',
    tableName: 'work_orders',
    recordId: id,
    oldData: { status: existing.status },
    newData: { status: newStatus },
    description: `Mengubah status Work Order ${existing.wo_number} menjadi "${newStatus}"`,
  })

  revalidatePath(`/dashboard/work-orders/${id}`)
  revalidatePath('/dashboard/work-orders')
  revalidatePath('/dashboard/maintenance')

  return { success: true, data: data as WorkOrder }
}

export async function addWorkOrderComment(
  workOrderId: string,
  comment: string
): Promise<ActionResult<WorkOrderComment>> {
  const user = await getCurrentUser()
  const supabase = await createClient()

  if (!comment || comment.trim().length === 0) {
    return { success: false, error: 'Komentar tidak boleh kosong' }
  }

  const { data, error } = await supabase
    .from('work_order_comments')
    .insert({
      work_order_id: workOrderId,
      user_id: user?.id || null,
      comment: comment.trim(),
    })
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || 'Gagal menambahkan komentar' }
  }

  revalidatePath(`/dashboard/work-orders/${workOrderId}`)
  return { success: true, data: data as WorkOrderComment }
}

export async function addWorkOrderPart(
  workOrderId: string,
  part: {
    part_name: string
    part_code?: string
    quantity: number
    unit_cost: number
    source?: 'inventory' | 'vendor' | 'cannibalized'
    notes?: string
  }
): Promise<ActionResult<WorkOrderPart>> {
  const supabase = await createClient()

  const totalPartCost = part.quantity * part.unit_cost

  const { data, error } = await supabase
    .from('work_order_parts')
    .insert({
      work_order_id: workOrderId,
      part_name: part.part_name,
      part_code: part.part_code || null,
      quantity: part.quantity,
      unit_cost: part.unit_cost,
      total_cost: totalPartCost,
      source: part.source || 'inventory',
      notes: part.notes || null,
    })
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || 'Gagal mencatat spare part' }
  }

  // Update WO costs
  const existing = await getWorkOrderById(workOrderId)
  if (existing) {
    const newPartsCost = (existing.parts_cost || 0) + totalPartCost
    const newTotalCost = (existing.labor_cost || 0) + newPartsCost
    await supabase
      .from('work_orders')
      .update({
        parts_cost: newPartsCost,
        total_cost: newTotalCost,
      })
      .eq('id', workOrderId)
  }

  revalidatePath(`/dashboard/work-orders/${workOrderId}`)
  return { success: true, data: data as WorkOrderPart }
}
