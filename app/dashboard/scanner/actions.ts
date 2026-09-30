'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/permissions'
import type { ActionResult, AssetWithRelations } from '@/types'

/**
 * Lookup asset by either QR UUID or Asset Code (AMB-XXXXX)
 */
export async function lookupAsset(query: string): Promise<AssetWithRelations | null> {
  const supabase = await createClient()
  const trimmed = query.trim()

  // Clean if full URL passed (e.g. https://.../scan/UUID)
  let cleanUuid = trimmed
  if (trimmed.includes('/scan/')) {
    cleanUuid = trimmed.split('/scan/').pop()?.split('?')[0] || trimmed
  }

  // 1. Try match by qr_code_uuid
  let { data: asset } = await (supabase
    .from('assets') as any)
    .select(
      `
      *,
      category:asset_categories(*),
      business_unit:business_units(*),
      current_location:locations(*),
      current_pic:profiles(id, full_name, role, department, phone)
    `
    )
    .eq('qr_code_uuid', cleanUuid)
    .single()

  // 2. If not found, try match by asset_code
  if (!asset) {
    const { data: byCode } = await (supabase
      .from('assets') as any)
      .select(
        `
        *,
        category:asset_categories(*),
        business_unit:business_units(*),
        current_location:locations(*),
        current_pic:profiles(id, full_name, role, department, phone)
      `
      )
      .ilike('asset_code', trimmed)
      .single()

    asset = byCode
  }

  return (asset as unknown as AssetWithRelations) || null
}

/**
 * Move asset to a new location and record history
 */
export async function quickMoveAssetLocation(
  assetId: string,
  targetLocationId: string,
  targetBusinessUnitId?: string,
  note?: string
): Promise<ActionResult> {
  const { profile } = await getCurrentUser()

  if (!['super_admin', 'corporate_admin', 'unit_admin', 'field_officer'].includes(profile.role)) {
    return { success: false, error: 'Anda tidak memiliki izin memindahkan aset' }
  }

  const supabase = await createClient()

  // Fetch current asset location
  const { data: currentAsset } = await (supabase
    .from('assets') as any)
    .select('current_location_id, business_unit_id')
    .eq('id', assetId)
    .single()

  const updatePayload: Record<string, any> = {
    current_location_id: targetLocationId,
  }

  if (targetBusinessUnitId) {
    updatePayload.business_unit_id = targetBusinessUnitId
  }

  const { error: updateError } = await (supabase
    .from('assets') as any)
    .update(updatePayload)
    .eq('id', assetId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Record to asset_location_history
  await (supabase.from('asset_location_history') as any).insert({
    asset_id: assetId,
    location_id: targetLocationId,
    moved_by: profile.id,
    note: note || 'Pemindahan lokasi cepat via QR Scanner',
  })

  revalidatePath('/dashboard/assets')
  revalidatePath(`/dashboard/assets/${assetId}`)
  revalidatePath('/dashboard/scanner')

  return { success: true, data: undefined }
}

/**
 * Quick create maintenance record from scanner
 */
export async function quickCreateMaintenance(
  assetId: string,
  maintenanceType: 'preventive' | 'corrective' | 'predictive',
  notes: string,
  condition?: string
): Promise<ActionResult> {
  const { profile } = await getCurrentUser()
  const supabase = await createClient()

  const { error } = await (supabase
    .from('asset_maintenance') as any)
    .insert({
      asset_id: assetId,
      maintenance_type: maintenanceType,
      status: 'scheduled',
      scheduled_date: new Date().toISOString().split('T')[0],
      notes: `[Dicatat oleh: ${profile.full_name}]\n${notes}`,
    })

  if (error) return { success: false, error: error.message }

  // Update asset condition if provided
  if (condition) {
    await (supabase
      .from('assets') as any)
      .update({ condition })
      .eq('id', assetId)
  }

  revalidatePath('/dashboard/maintenance')
  revalidatePath(`/dashboard/assets/${assetId}`)
  return { success: true, data: undefined }
}
