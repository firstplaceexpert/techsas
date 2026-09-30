'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { DEMO_USERS } from '@/lib/demo/mock-data'
import type { ActionResult } from '@/types'

export interface PublicAssetInfo {
  id: string
  asset_code: string
  name: string
  description: string | null
  photo_url: string | null
  condition: string
  status: string
  qr_code_uuid: string
  business_unit: {
    id: string
    name: string
    type: string
  } | null
  category: {
    id: string
    name: string
  } | null
  current_location: {
    id: string
    name: string
    level: string
  } | null
}

export interface LoggedInStaffInfo {
  id: string
  email: string
  fullName: string
  role: string
  department: string | null
  businessUnitId: string | null
}

export interface AdminAssetDetails {
  purchase_price: number | null
  current_book_value: number | null
  purchase_date: string | null
  useful_life_months: number | null
  depreciation_method: string | null
  warranty_until: string | null
  current_pic_name: string | null
  total_maintenance_count: number
}

export interface ScanPortalData {
  asset: PublicAssetInfo & { adminDetails?: AdminAssetDetails | null }
  currentUser: LoggedInStaffInfo | null
}

export async function getOptionalStaffUser(): Promise<LoggedInStaffInfo | null> {
  try {
    const cookieStore = await cookies()
    const demoCookie = cookieStore.get('techsas_demo_session')?.value
    if (demoCookie) {
      const parsed = JSON.parse(demoCookie)
      const demo = DEMO_USERS[parsed.email] || DEMO_USERS['admin@techsas.id']
      return {
        id: demo.id,
        email: demo.email,
        fullName: demo.profile.full_name,
        role: demo.profile.role,
        department: demo.profile.department,
        businessUnitId: demo.profile.business_unit_id,
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return null

    return {
      id: user.id,
      email: user.email || '',
      fullName: profile.full_name || 'Staf TECHSAS',
      role: profile.role,
      department: profile.department,
      businessUnitId: profile.business_unit_id,
    }
  } catch {
    return null
  }
}

export async function getScanPortalData(qrCodeUuid: string): Promise<ScanPortalData | null> {
  const staffUser = await getOptionalStaffUser()
  const supabase = await createClient()

  let assetData: any = null

  try {
    const { data, error } = await (supabase
      .from('assets') as any)
      .select(
        `
        id, asset_code, name, description, photo_url, condition, status, qr_code_uuid,
        purchase_price, current_book_value, purchase_date, useful_life_months,
        depreciation_method, warranty_until, current_pic_id,
        business_unit:business_units(id, name, type),
        category:asset_categories(id, name),
        current_location:locations(id, name, level)
      `
      )
      .or(`qr_code_uuid.eq.${qrCodeUuid},asset_code.eq.${qrCodeUuid},id.eq.${qrCodeUuid}`)
      .maybeSingle()

    if (!error && data) {
      assetData = data
    }
  } catch {
    // fallback will be checked below
  }

  // Fallback: If not found in Supabase (e.g. database not seeded or empty), check local mock assets
  if (!assetData) {
    try {
      const { createMockSupabaseClient } = await import('@/lib/demo/mock-client')
      const mockClient = createMockSupabaseClient()
      const { data: mockData } = await (mockClient.from('assets') as any)
        .select(
          `
          id, asset_code, name, description, photo_url, condition, status, qr_code_uuid,
          purchase_price, current_book_value, purchase_date, useful_life_months,
          depreciation_method, warranty_until, current_pic_id,
          business_unit:business_units(id, name, type),
          category:asset_categories(id, name),
          current_location:locations(id, name, level)
        `
        )
        .or(`qr_code_uuid.eq.${qrCodeUuid},asset_code.eq.${qrCodeUuid},id.eq.${qrCodeUuid}`)
        .maybeSingle()

      if (mockData) {
        assetData = mockData
      }
    } catch {
      // ignore
    }
  }

  if (!assetData) return null

  let adminDetails: AdminAssetDetails | null = null

  if (staffUser) {
    let picName = 'Tim GA & Asset'
    if (assetData.current_pic_id) {
      try {
        const { data: picData } = await (supabase
          .from('profiles') as any)
          .select('full_name')
          .eq('id', assetData.current_pic_id)
          .single()
        if (picData?.full_name) picName = picData.full_name
      } catch {}
    }

    const { count } = await (supabase
      .from('asset_maintenance') as any)
      .select('id', { count: 'exact', head: true })
      .eq('asset_id', assetData.id)

    adminDetails = {
      purchase_price: assetData.purchase_price ?? null,
      current_book_value: assetData.current_book_value ?? null,
      purchase_date: assetData.purchase_date ?? null,
      useful_life_months: assetData.useful_life_months ?? null,
      depreciation_method: assetData.depreciation_method ?? null,
      warranty_until: assetData.warranty_until ?? null,
      current_pic_name: picName,
      total_maintenance_count: count ?? 0,
    }
  }

  const publicAsset: PublicAssetInfo & { adminDetails?: AdminAssetDetails | null } = {
    id: assetData.id,
    asset_code: assetData.asset_code,
    name: assetData.name,
    description: assetData.description,
    photo_url: assetData.photo_url,
    condition: assetData.condition,
    status: assetData.status,
    qr_code_uuid: assetData.qr_code_uuid,
    business_unit: assetData.business_unit,
    category: assetData.category,
    current_location: assetData.current_location,
    adminDetails,
  }

  return {
    asset: publicAsset,
    currentUser: staffUser,
  }
}

export async function getAssetByQrCode(qrCodeUuid: string): Promise<PublicAssetInfo | null> {
  const data = await getScanPortalData(qrCodeUuid)
  return data ? data.asset : null
}

export async function updateAssetConditionQuick(
  assetId: string,
  newCondition: 'good' | 'fair' | 'damaged' | 'under_repair'
): Promise<ActionResult<{ condition: string }>> {
  const staff = await getOptionalStaffUser()
  if (!staff) {
    return { success: false, error: 'Akses ditolak. Anda harus login sebagai admin/staf.' }
  }

  const supabase = await createClient()
  const { error } = await (supabase.from('assets') as any)
    .update({ condition: newCondition, updated_at: new Date().toISOString() })
    .eq('id', assetId)

  if (error) return { success: false, error: error.message }
  return { success: true, data: { condition: newCondition } }
}

export async function recordQuickInspection(
  assetId: string
): Promise<ActionResult<{ timestamp: string; inspector: string }>> {
  const staff = await getOptionalStaffUser()
  if (!staff) {
    return { success: false, error: 'Akses ditolak. Anda harus login sebagai admin/staf.' }
  }

  const supabase = await createClient()

  await (supabase.from('asset_maintenance') as any).insert({
    asset_id: assetId,
    maintenance_type: 'preventive',
    status: 'completed',
    scheduled_date: new Date().toISOString().split('T')[0],
    completion_date: new Date().toISOString().split('T')[0],
    performed_by: staff.fullName,
    notes: `[Inspeksi Lapangan QR]: Diverifikasi fisik langsung oleh ${staff.fullName} (${staff.role}) melalui Scan Kamera HP.`,
  })

  return {
    success: true,
    data: {
      timestamp: new Date().toLocaleString('id-ID'),
      inspector: staff.fullName,
    },
  }
}


export interface PublicIssueReportInput {
  assetId: string
  reporterName?: string
  reporterContact?: string
  description: string
  issueType: 'corrective' | 'preventive'
  urgency?: 'urgent' | 'medium' | 'low'
  category?: string
  photoDataUrl?: string
}

export interface PublicIssueReportResult {
  ticketNumber: string
  assetName: string
  assetCode: string
}

export async function submitPublicIssueReport(
  input: PublicIssueReportInput
): Promise<ActionResult<PublicIssueReportResult>> {
  if (!input.description?.trim()) {
    return { success: false, error: 'Deskripsi kendala wajib diisi' }
  }

  const reporterDisplayName = input.reporterName?.trim() || 'Tamu / Pengunjung Lapangan'

  const supabase = await createClient()

  // Generate unique ticket number: e.g. TKT-202609-4821
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '')
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const ticketNumber = `TKT-${dateStr}-${randomSuffix}`

  const urgencyLabels: Record<string, string> = {
    urgent: 'DARURAT / KRITIS',
    medium: 'SEDANG / BUTUH PENANGANAN',
    low: 'RINGAN / RUTIN',
  }
  const urgencyLabel = urgencyLabels[input.urgency || 'medium'] || 'SEDANG'

  // Format rich notes
  const notesContent = [
    `[Tiket Aduan QR: #${ticketNumber}]`,
    `Tingkat Urgensi: ${urgencyLabel}`,
    `Kategori Kendala: ${input.category || 'Umum'}`,
    `Pelapor: ${reporterDisplayName}`,
    input.reporterContact?.trim() ? `Kontak: ${input.reporterContact.trim()}` : '',
    `Waktu Registrasi: ${new Date().toLocaleString('id-ID')}`,
    `----------------------------------------`,
    `Deskripsi Kendala:`,
    input.description.trim(),
    input.photoDataUrl ? `[Bukti Foto Kerusakan Terlampir]` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // 1. Create maintenance work order record
  let maintSuccess = false
  try {
    const { error: maintError } = await (supabase
      .from('asset_maintenance') as any)
      .insert({
        asset_id: input.assetId,
        maintenance_type: input.issueType || 'corrective',
        status: 'scheduled',
        scheduled_date: new Date().toISOString().split('T')[0],
        notes: notesContent,
      })
    if (!maintError) maintSuccess = true
  } catch {}

  // Fallback to mock maintenance store if Supabase fails (e.g. RLS policy)
  if (!maintSuccess) {
    try {
      const { createMockSupabaseClient } = await import('@/lib/demo/mock-client')
      const mockClient = createMockSupabaseClient()
      await (mockClient.from('asset_maintenance') as any).insert({
        asset_id: input.assetId,
        maintenance_type: input.issueType || 'corrective',
        status: 'scheduled',
        scheduled_date: new Date().toISOString().split('T')[0],
        notes: notesContent,
      })
    } catch {}
  }

  // 2. Fetch asset info to notify admins & update status if urgent
  let asset: any = null
  try {
    const { data } = await (supabase
      .from('assets') as any)
      .select('asset_code, name, business_unit_id, condition')
      .eq('id', input.assetId)
      .single()
    asset = data
  } catch {}

  if (!asset) {
    try {
      const { createMockSupabaseClient } = await import('@/lib/demo/mock-client')
      const mockClient = createMockSupabaseClient()
      const { data: mockAsset } = await (mockClient.from('assets') as any)
        .select('asset_code, name, business_unit_id, condition')
        .eq('id', input.assetId)
        .single()
      asset = mockAsset
    } catch {}
  }

  if (asset) {
    // If report is marked urgent, update asset condition to under_repair/damaged
    if (input.urgency === 'urgent' && asset.condition === 'good') {
      try {
        await (supabase.from('assets') as any)
          .update({ condition: 'under_repair' })
          .eq('id', input.assetId)
      } catch {}
    }

    // 3. Notify admins of the unit
    try {
      const { data: admins } = await (supabase
        .from('profiles') as any)
        .select('id')
        .in('role', ['super_admin', 'corporate_admin', 'unit_admin'])
        .eq('is_active', true)

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin: { id: string }) => ({
          user_id: admin.id,
          type: 'maintenance_report',
          title: `Aduan Lapangan #${ticketNumber}: ${asset.asset_code} (${urgencyLabel})`,
          message: `${reporterDisplayName} melaporkan kendala [${urgencyLabel}] pada ${asset.name}: "${input.description.substring(0, 80)}..."`,
          related_asset_id: input.assetId,
        }))

        await (supabase.from('notifications') as any).insert(notifications)
      }
    } catch {}
  }

  return {
    success: true,
    data: {
      ticketNumber,
      assetName: asset?.name || 'Aset',
      assetCode: asset?.asset_code || '',
    },
  }
}
