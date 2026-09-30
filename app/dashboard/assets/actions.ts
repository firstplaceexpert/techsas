'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole, getCurrentUser } from '@/lib/auth/permissions'
import { assetSchema, type AssetFormValues } from '@/lib/validations/asset'
import type {
  ActionResult,
  Asset,
  AssetFilters,
  AssetListItem,
  AssetWithRelations,
  PaginatedResult,
} from '@/types'

export async function getAssets(
  filters: AssetFilters = {}
): Promise<PaginatedResult<AssetListItem>> {
  const supabase = await createClient()
  const { page = 1, pageSize = 20 } = filters

  let query = supabase
    .from('assets')
    .select(
      `
      id, asset_code, name, condition, status, photo_url,
      purchase_price, current_book_value, purchase_date, created_at, account_code_asset,
      category:asset_categories(id, name, account_code_asset),
      business_unit:business_units(id, name, type),
      current_location:locations(id, name, level)
    `,
      { count: 'exact' }
    )
    .neq('status', 'disposed')
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,asset_code.ilike.%${filters.search}%`
    )
  }
  if (filters.businessUnitId) {
    query = query.eq('business_unit_id', filters.businessUnitId)
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.condition) {
    query = query.eq('condition', filters.condition)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const total = count ?? 0
  return {
    data: (data ?? []) as unknown as AssetListItem[],
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

export async function getAssetById(id: string): Promise<AssetWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assets')
    .select(
      `
      *,
      category:asset_categories(*),
      business_unit:business_units(*),
      current_location:locations(*),
      current_pic:profiles(id, full_name, role, department, phone)
    `
    )
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as AssetWithRelations
}

export async function createAsset(
  values: AssetFormValues
): Promise<ActionResult<Asset>> {
  const { profile } = await getCurrentUser()

  if (!['super_admin', 'corporate_admin', 'unit_admin', 'field_officer'].includes(profile.role)) {
    return { success: false, error: 'Anda tidak memiliki izin untuk menambah aset' }
  }

  const parsed = assetSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // Generate semantic asset code (standar EAM ISO 55000)
  let semanticAssetCode: string | undefined
  try {
    const [buRes, catRes, locRes, countRes] = await Promise.all([
      supabase.from('business_units').select('name, type').eq('id', parsed.data.business_unit_id).single(),
      supabase.from('asset_categories').select('name').eq('id', parsed.data.category_id).single(),
      parsed.data.current_location_id
        ? supabase.from('locations').select('name, level').eq('id', parsed.data.current_location_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('assets').select('id', { count: 'exact', head: true }).eq('category_id', parsed.data.category_id)
    ])

    const { generateSemanticAssetCode } = await import('@/lib/utils/asset-code')
    const seq = ((countRes as any)?.count ?? 0) + 1
    semanticAssetCode = generateSemanticAssetCode({
      businessUnitNameOrType: (buRes as any)?.data?.name || (buRes as any)?.data?.type,
      categoryName: (catRes as any)?.data?.name,
      purchaseDate: parsed.data.purchase_date,
      locationName: (locRes as any)?.data?.name,
      locationLevel: (locRes as any)?.data?.level,
      sequenceNumber: seq,
    })
  } catch (err) {
    console.error('Error generating semantic asset code:', err)
  }

  const { data, error } = await (supabase
    .from('assets') as any)
    .insert({
      asset_code: semanticAssetCode,
      name: parsed.data.name,
      description: parsed.data.description || null,
      category_id: parsed.data.category_id,
      account_code_asset: parsed.data.account_code_asset || null,
      account_code_accum: parsed.data.account_code_accum || null,
      account_code_expense: parsed.data.account_code_expense || null,
      business_unit_id: parsed.data.business_unit_id,
      current_location_id: parsed.data.current_location_id ?? null,
      current_pic_id: parsed.data.current_pic_id ?? null,
      photo_url: parsed.data.photo_url || null,
      purchase_date: parsed.data.purchase_date ?? null,
      purchase_price: parsed.data.purchase_price ?? null,
      useful_life_months: parsed.data.useful_life_months ?? null,
      depreciation_method: parsed.data.depreciation_method ?? null,
      current_book_value: parsed.data.purchase_price ?? null,
      condition: parsed.data.condition,
      warranty_until: parsed.data.warranty_until ?? null,
      legal_document_url: parsed.data.legal_document_url || null,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // Record initial location history
  if (parsed.data.current_location_id && data) {
    await (supabase.from('asset_location_history') as any).insert({
      asset_id: data.id,
      location_id: parsed.data.current_location_id,
      moved_by: profile.id,
      note: 'Lokasi awal saat registrasi',
    })
  }

  revalidatePath('/dashboard/assets')
  return { success: true, data }
}

export async function createBulkAssets(
  values: AssetFormValues,
  quantity: number
): Promise<ActionResult<{ count: number; firstCode: string; lastCode: string; batchId: string }>> {
  const { profile } = await getCurrentUser()

  if (!['super_admin', 'corporate_admin', 'unit_admin', 'field_officer'].includes(profile.role)) {
    return { success: false, error: 'Anda tidak memiliki izin untuk menambah aset' }
  }

  const parsed = assetSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const qty = Math.max(1, Math.min(1000, Number(quantity) || 1))
  const supabase = await createClient()

  // Generate batch identifier
  const now = new Date()
  const yymm = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const batchId = `BATCH-${yymm}-${Math.floor(1000 + Math.random() * 9000)}`

  // Fetch unit, category, location info to calculate codes
  const [buRes, catRes, locRes, countRes] = await Promise.all([
    supabase.from('business_units').select('name, type').eq('id', parsed.data.business_unit_id).single(),
    supabase.from('asset_categories').select('name').eq('id', parsed.data.category_id).single(),
    parsed.data.current_location_id
      ? supabase.from('locations').select('name, level').eq('id', parsed.data.current_location_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('assets').select('id', { count: 'exact', head: true }).eq('category_id', parsed.data.category_id)
  ])

  const { generateSemanticAssetCode } = await import('@/lib/utils/asset-code')
  const startSeq = ((countRes as any)?.count ?? 0) + 1

  const itemsToInsert = []
  let firstCode = ''
  let lastCode = ''

  for (let i = 0; i < qty; i++) {
    const seq = startSeq + i
    const assetCode = generateSemanticAssetCode({
      businessUnitNameOrType: (buRes as any)?.data?.name || (buRes as any)?.data?.type,
      categoryName: (catRes as any)?.data?.name,
      purchaseDate: parsed.data.purchase_date,
      locationName: (locRes as any)?.data?.name,
      locationLevel: (locRes as any)?.data?.level,
      sequenceNumber: seq,
    })

    if (i === 0) firstCode = assetCode
    if (i === qty - 1) lastCode = assetCode

    const unitNumber = (i + 1).toString().padStart(4, '0')

    itemsToInsert.push({
      asset_code: assetCode,
      name: qty > 1 ? `${parsed.data.name} #${unitNumber}` : parsed.data.name,
      description: `${parsed.data.description ? parsed.data.description + ' | ' : ''}Pengadaan Massal (${batchId} Unit ${i + 1}/${qty})`,
      category_id: parsed.data.category_id,
      account_code_asset: parsed.data.account_code_asset || null,
      account_code_accum: parsed.data.account_code_accum || null,
      account_code_expense: parsed.data.account_code_expense || null,
      business_unit_id: parsed.data.business_unit_id,
      current_location_id: parsed.data.current_location_id ?? null,
      current_pic_id: parsed.data.current_pic_id ?? null,
      photo_url: parsed.data.photo_url || null,
      purchase_date: parsed.data.purchase_date ?? null,
      purchase_price: parsed.data.purchase_price ?? null,
      useful_life_months: parsed.data.useful_life_months ?? null,
      depreciation_method: parsed.data.depreciation_method ?? null,
      current_book_value: parsed.data.purchase_price ?? null,
      condition: parsed.data.condition,
      warranty_until: parsed.data.warranty_until ?? null,
      legal_document_url: parsed.data.legal_document_url || null,
      created_by: profile.id,
    })
  }

  // Insert in chunks of 100
  const chunkSize = 100
  for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
    const chunk = itemsToInsert.slice(i, i + chunkSize)
    const { error } = await (supabase.from('assets') as any).insert(chunk)
    if (error) {
      console.error('Batch insert chunk error:', error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/dashboard/assets')
  revalidatePath('/dashboard/assets/print-labels')

  return {
    success: true,
    data: {
      count: qty,
      firstCode,
      lastCode,
      batchId,
    },
  }
}

export async function updateAsset(
  id: string,
  values: AssetFormValues
): Promise<ActionResult<Asset>> {
  const { profile } = await getCurrentUser()

  if (!['super_admin', 'corporate_admin', 'unit_admin', 'field_officer'].includes(profile.role)) {
    return { success: false, error: 'Anda tidak memiliki izin untuk mengubah aset' }
  }

  const parsed = assetSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // Check if location changed, if so record history
  const { data: existing } = await (supabase
    .from('assets') as any)
    .select('current_location_id')
    .eq('id', id)
    .single()

  const { data, error } = await (supabase
    .from('assets') as any)
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      category_id: parsed.data.category_id,
      account_code_asset: parsed.data.account_code_asset || null,
      account_code_accum: parsed.data.account_code_accum || null,
      account_code_expense: parsed.data.account_code_expense || null,
      business_unit_id: parsed.data.business_unit_id,
      current_location_id: parsed.data.current_location_id ?? null,
      current_pic_id: parsed.data.current_pic_id ?? null,
      photo_url: parsed.data.photo_url || null,
      purchase_date: parsed.data.purchase_date ?? null,
      purchase_price: parsed.data.purchase_price ?? null,
      useful_life_months: parsed.data.useful_life_months ?? null,
      depreciation_method: parsed.data.depreciation_method ?? null,
      condition: parsed.data.condition,
      warranty_until: parsed.data.warranty_until ?? null,
      legal_document_url: parsed.data.legal_document_url || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // Record location history if location changed
  if (
    parsed.data.current_location_id &&
    existing?.current_location_id !== parsed.data.current_location_id
  ) {
    await (supabase.from('asset_location_history') as any).insert({
      asset_id: id,
      location_id: parsed.data.current_location_id,
      moved_by: profile.id,
      note: 'Pembaruan lokasi via edit aset',
    })
  }

  revalidatePath('/dashboard/assets')
  revalidatePath(`/dashboard/assets/${id}`)
  return { success: true, data }
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  await requireRole('super_admin', 'corporate_admin', 'unit_admin')

  const supabase = await createClient()
  const { error } = await (supabase
    .from('assets') as any)
    .update({ status: 'disposed' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/assets')
  return { success: true, data: undefined }
}

export async function uploadAssetPhoto(
  formData: FormData
): Promise<ActionResult<string>> {
  const { profile } = await getCurrentUser()

  const file = formData.get('file') as File | null
  if (!file) return { success: false, error: 'File tidak ditemukan' }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'File harus berupa gambar' }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'Ukuran file maksimal 5MB' }
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${profile.id}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('asset-photos')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) return { success: false, error: error.message }

  const { data: urlData } = supabase.storage
    .from('asset-photos')
    .getPublicUrl(data.path)

  return { success: true, data: urlData.publicUrl }
}

export async function uploadAssetDocument(
  formData: FormData
): Promise<ActionResult<string>> {
  const { profile } = await getCurrentUser()

  const file = formData.get('file') as File | null
  if (!file) return { success: false, error: 'File tidak ditemukan' }

  // Validate file type (PDF, Word, images)
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ]
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Format file tidak didukung (PDF, DOC, DOCX, JPG, PNG)' }
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'Ukuran file maksimal 10MB' }
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'pdf'
  const filename = `${profile.id}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('asset-documents')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) return { success: false, error: error.message }

  const { data: urlData } = supabase.storage
    .from('asset-documents')
    .getPublicUrl(data.path)

  return { success: true, data: urlData.publicUrl }
}

export async function getAssetStats() {
  const supabase = await createClient()

  const { count: totalData } = await (supabase
    .from('assets') as any)
    .select('*', { count: 'exact', head: true })
    .neq('status', 'disposed')

  const { count: activeData } = await (supabase
    .from('assets') as any)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { data: conditionData } = await (supabase
    .from('assets') as any)
    .select('condition')
    .neq('status', 'disposed')

  const conditions = {
    good: 0,
    fair: 0,
    damaged: 0,
    under_repair: 0,
  }
  ;(conditionData as unknown as { condition: string }[])?.forEach((a) => {
    if (a.condition in conditions) {
      conditions[a.condition as keyof typeof conditions]++
    }
  })

  const { data: byUnit } = await (supabase
    .from('assets') as any)
    .select('business_unit_id, business_units(name)')
    .neq('status', 'disposed')

  const unitCounts: Record<string, { name: string; count: number }> = {}
  ;(byUnit as unknown as { business_unit_id: string; business_units: { name: string } | null }[])?.forEach((a) => {
    const id = a.business_unit_id
    if (!unitCounts[id]) {
      unitCounts[id] = { name: a.business_units?.name ?? 'Unknown', count: 0 }
    }
    unitCounts[id].count++
  })

  return {
    total: totalData ?? 0,
    active: activeData ?? 0,
    conditions,
    byUnit: Object.values(unitCounts),
  }
}

export async function getAssetLocationHistory(assetId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('asset_location_history') as any)
    .select(
      `
      id, asset_id, moved_at, note,
      location:locations(id, name, level),
      mover:profiles(id, full_name, role)
    `
    )
    .eq('asset_id', assetId)
    .order('moved_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getAssetMaintenanceHistory(assetId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('asset_maintenance') as any)
    .select(
      `
      id, asset_id, maintenance_type, scheduled_date, completed_date, cost, notes, status, created_at,
      technician:profiles(id, full_name, role)
    `
    )
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getAssetDepreciationLogs(assetId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('asset_depreciation_log') as any)
    .select('*')
    .eq('asset_id', assetId)
    .order('period_month', { ascending: false })

  if (error) return []
  return data || []
}

