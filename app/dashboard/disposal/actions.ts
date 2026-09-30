'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, requireRole } from '@/lib/auth/permissions'
import type {
  ActionResult,
  DisposalRecord,
  DisposalType,
  ApprovalStatus,
} from '@/types'

export interface DisposalWithRelations extends DisposalRecord {
  asset: {
    id: string
    asset_code: string
    name: string
    photo_url: string | null
    current_book_value: number | null
    purchase_price: number | null
    business_unit: { id: string; name: string } | null
    current_location: { id: string; name: string } | null
    category: { id: string; name: string } | null
  } | null
  requester: { id: string; full_name: string; role: string } | null
  approver: { id: string; full_name: string; role: string } | null
  target_business_unit: { id: string; name: string } | null
}

export async function getDisposalRecords(filters: {
  status?: string
  type?: string
} = {}): Promise<DisposalWithRelations[]> {
  const supabase = await createClient()

  let query = (supabase.from('disposal_records') as any)
    .select(
      `
      *,
      asset:assets(
        id, asset_code, name, photo_url, current_book_value, purchase_price,
        business_unit:business_units(id, name),
        current_location:locations(id, name),
        category:asset_categories(id, name)
      ),
      requester:profiles!disposal_records_requested_by_fkey(id, full_name, role),
      approver:profiles!disposal_records_approved_by_fkey(id, full_name, role),
      target_business_unit:business_units!disposal_records_target_business_unit_id_fkey(id, name)
    `
    )
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('approval_status', filters.status)
  }
  if (filters.type) {
    query = query.eq('disposal_type', filters.type)
  }

  const { data, error } = await query
  if (error) return []
  return (data || []) as DisposalWithRelations[]
}

export async function getDisposalRecordById(id: string): Promise<DisposalWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('disposal_records') as any)
    .select(
      `
      *,
      asset:assets(
        id, asset_code, name, photo_url, current_book_value, purchase_price,
        business_unit:business_units(id, name),
        current_location:locations(id, name),
        category:asset_categories(id, name)
      ),
      requester:profiles!disposal_records_requested_by_fkey(id, full_name, role),
      approver:profiles!disposal_records_approved_by_fkey(id, full_name, role),
      target_business_unit:business_units!disposal_records_target_business_unit_id_fkey(id, name)
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as DisposalWithRelations
}

export async function createDisposalRequest(values: {
  asset_id: string
  disposal_type: DisposalType
  sale_price?: number | null
  buyer_or_recipient?: string | null
  target_business_unit_id?: string | null
  notes?: string | null
}): Promise<ActionResult<DisposalRecord>> {
  const { profile } = await getCurrentUser()
  const supabase = await createClient()

  // 1. Fetch asset book value
  const { data: asset } = await (supabase
    .from('assets') as any)
    .select('current_book_value, purchase_price')
    .eq('id', values.asset_id)
    .single()

  const bookValue = asset?.current_book_value ?? asset?.purchase_price ?? 0
  const salePrice = values.sale_price || 0
  const gainLoss = salePrice - bookValue

  const { data, error } = await (supabase
    .from('disposal_records') as any)
    .insert({
      asset_id: values.asset_id,
      disposal_type: values.disposal_type,
      requested_by: profile.id,
      approval_status: 'pending',
      sale_price: values.sale_price || null,
      buyer_or_recipient: values.buyer_or_recipient || null,
      target_business_unit_id: values.target_business_unit_id || null,
      notes: values.notes || null,
      gain_loss_amount: gainLoss,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // Create notifications for Corporate & Unit Admins
  const { data: approvers } = await (supabase
    .from('profiles') as any)
    .select('id')
    .in('role', ['super_admin', 'corporate_admin'])

  if (approvers && approvers.length > 0) {
    const notifs = approvers.map((a: { id: string }) => ({
      user_id: a.id,
      type: 'disposal_approval',
      title: 'Pengajuan Pelepasan Aset Baru',
      message: `${profile.full_name} mengajukan pelepasan (${values.disposal_type}) aset dengan nilai buku Rp ${bookValue.toLocaleString('id-ID')}`,
      related_asset_id: values.asset_id,
    }))
    await (supabase.from('notifications') as any).insert(notifs)
  }

  revalidatePath('/dashboard/disposal')
  return { success: true, data }
}

export async function approveDisposal(id: string): Promise<ActionResult> {
  const { profile } = await getCurrentUser()
  await requireRole('super_admin', 'corporate_admin', 'unit_admin')

  const supabase = await createClient()

  const { error } = await (supabase
    .from('disposal_records') as any)
    .update({
      approval_status: 'approved',
      approved_by: profile.id,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/disposal')
  revalidatePath(`/dashboard/disposal/${id}`)
  return { success: true, data: undefined }
}

export async function rejectDisposal(id: string, reason?: string): Promise<ActionResult> {
  const { profile } = await getCurrentUser()
  await requireRole('super_admin', 'corporate_admin', 'unit_admin')

  const supabase = await createClient()

  const { data: existing } = await (supabase
    .from('disposal_records') as any)
    .select('notes')
    .eq('id', id)
    .single()

  const updatedNotes = reason
    ? `${existing?.notes || ''}\n[Ditolak oleh ${profile.full_name}]: ${reason}`
    : existing?.notes

  const { error } = await (supabase
    .from('disposal_records') as any)
    .update({
      approval_status: 'rejected',
      approved_by: profile.id,
      notes: updatedNotes,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/disposal')
  revalidatePath(`/dashboard/disposal/${id}`)
  return { success: true, data: undefined }
}

export async function completeDisposalExecution(
  id: string,
  actualSalePrice?: number | null
): Promise<ActionResult> {
  const { profile } = await getCurrentUser()
  await requireRole('super_admin', 'corporate_admin', 'unit_admin')

  const supabase = await createClient()

  // 1. Fetch disposal record and asset
  const { data: record } = await (supabase
    .from('disposal_records') as any)
    .select('asset_id, disposal_type, target_business_unit_id, sale_price')
    .eq('id', id)
    .single()

  if (!record) return { success: false, error: 'Data disposal tidak ditemukan' }

  const { data: asset } = await (supabase
    .from('assets') as any)
    .select('current_book_value, purchase_price')
    .eq('id', record.asset_id)
    .single()

  const bookVal = asset?.current_book_value ?? asset?.purchase_price ?? 0
  const finalPrice = actualSalePrice !== undefined ? actualSalePrice : record.sale_price || 0
  const finalGainLoss = (finalPrice || 0) - bookVal

  // 2. Update disposal record to completed
  await (supabase
    .from('disposal_records') as any)
    .update({
      approval_status: 'approved',
      approved_by: profile.id,
      sale_price: finalPrice,
      gain_loss_amount: finalGainLoss,
      disposed_at: new Date().toISOString(),
    })
    .eq('id', id)

  // 3. Update asset status
  if (record.disposal_type === 'transfer' && record.target_business_unit_id) {
    // If transfer: update business unit and keep active
    await (supabase
      .from('assets') as any)
      .update({
        business_unit_id: record.target_business_unit_id,
        current_location_id: null,
      })
      .eq('id', record.asset_id)
  } else {
    // Other types: mark as disposed
    await (supabase
      .from('assets') as any)
      .update({ status: 'disposed' })
      .eq('id', record.asset_id)
  }

  revalidatePath('/dashboard/disposal')
  revalidatePath(`/dashboard/disposal/${id}`)
  revalidatePath('/dashboard/assets')

  return { success: true, data: undefined }
}
