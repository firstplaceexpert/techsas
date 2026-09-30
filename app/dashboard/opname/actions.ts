'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/permissions'
import { lookupAsset } from '@/app/dashboard/scanner/actions'
import type { ActionResult, OpnameSession, OpnameScan } from '@/types'

export interface OpnameSessionDetail extends OpnameSession {
  business_unit: { id: string; name: string; type: string } | null
  location: { id: string; name: string; level: string } | null
  conductor: { id: string; full_name: string; role: string } | null
  scans: (OpnameScan & {
    asset: {
      id: string
      asset_code: string
      name: string
      condition: string
      current_location_id: string | null
      current_location: { id: string; name: string } | null
      business_unit: { id: string; name: string } | null
    }
  })[]
  targetAssets: {
    id: string
    asset_code: string
    name: string
    condition: string
    current_location_id: string | null
    current_location: { id: string; name: string } | null
  }[]
}

export interface OpnameSessionItem extends OpnameSession {
  business_unit: { id: string; name: string; type: string } | null
  location: { id: string; name: string; level: string } | null
  conductor: { id: string; full_name: string; role: string } | null
}

export async function getOpnameSessions(): Promise<OpnameSessionItem[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('opname_sessions') as any)
    .select(
      `
      *,
      business_unit:business_units(id, name, type),
      location:locations(id, name, level),
      conductor:profiles(id, full_name, role)
    `
    )
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []) as OpnameSessionItem[]
}

export async function getOpnameSessionById(id: string): Promise<OpnameSessionDetail | null> {
  const supabase = await createClient()

  // 1. Fetch session info
  const { data: session, error } = await (supabase
    .from('opname_sessions') as any)
    .select(
      `
      *,
      business_unit:business_units(id, name, type),
      location:locations(id, name, level),
      conductor:profiles(id, full_name, role)
    `
    )
    .eq('id', id)
    .single()

  if (error || !session) return null

  // 2. Fetch all scans for this session
  const { data: scans } = await (supabase
    .from('opname_scans') as any)
    .select(
      `
      *,
      asset:assets(
        id, asset_code, name, condition, current_location_id,
        current_location:locations(id, name),
        business_unit:business_units(id, name)
      )
    `
    )
    .eq('session_id', id)
    .order('scanned_at', { ascending: false })

  // 3. Fetch all target assets belonging to this business unit / location
  let targetQuery = (supabase.from('assets') as any)
    .select(
      `
      id, asset_code, name, condition, current_location_id,
      current_location:locations(id, name)
    `
    )
    .eq('business_unit_id', session.business_unit_id)
    .neq('status', 'disposed')

  if (session.location_id) {
    targetQuery = targetQuery.eq('current_location_id', session.location_id)
  }

  const { data: targetAssets } = await targetQuery

  return {
    ...session,
    scans: scans || [],
    targetAssets: targetAssets || [],
  }
}

export async function createOpnameSession(values: {
  business_unit_id: string
  location_id?: string | null
}): Promise<ActionResult<OpnameSession>> {
  const { profile } = await getCurrentUser()
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('opname_sessions') as any)
    .insert({
      business_unit_id: values.business_unit_id,
      location_id: values.location_id || null,
      conducted_by: profile.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/opname')
  return { success: true, data }
}

export async function recordOpnameScan(
  sessionId: string,
  qrOrCode: string
): Promise<
  ActionResult<{
    matched: boolean
    asset: any
    isMisplaced: boolean
    isNewScan: boolean
  }>
> {
  const supabase = await createClient()

  // 1. Fetch session target location & unit
  const { data: session } = await (supabase
    .from('opname_sessions') as any)
    .select('id, business_unit_id, location_id, status')
    .eq('id', sessionId)
    .single()

  if (!session) return { success: false, error: 'Sesi opname tidak ditemukan' }
  if (session.status === 'completed') {
    return { success: false, error: 'Sesi opname ini sudah selesai / ditutup.' }
  }

  // 2. Lookup asset
  const asset = await lookupAsset(qrOrCode)
  if (!asset) {
    return { success: false, error: `Aset dengan kode "${qrOrCode}" tidak terdaftar di sistem.` }
  }

  // Check matching criteria:
  // If session specifies a location: match if asset.current_location_id === session.location_id
  // Otherwise: match if asset.business_unit_id === session.business_unit_id
  const matched = session.location_id
    ? asset.current_location_id === session.location_id
    : asset.business_unit_id === session.business_unit_id

  const isMisplaced = !matched

  // 3. Upsert into opname_scans
  const { data: existingScan } = await (supabase
    .from('opname_scans') as any)
    .select('id')
    .eq('session_id', sessionId)
    .eq('asset_id', asset.id)
    .single()

  let isNewScan = false

  if (!existingScan) {
    await (supabase.from('opname_scans') as any).insert({
      session_id: sessionId,
      asset_id: asset.id,
      matched,
      scanned_at: new Date().toISOString(),
    })
    isNewScan = true
  } else {
    await (supabase.from('opname_scans') as any)
      .update({
        matched,
        scanned_at: new Date().toISOString(),
      })
      .eq('id', existingScan.id)
  }

  revalidatePath(`/dashboard/opname/${sessionId}`)
  return {
    success: true,
    data: {
      matched,
      asset,
      isMisplaced,
      isNewScan,
    },
  }
}

export async function reconcileMisplacedAssets(
  sessionId: string
): Promise<ActionResult<{ reconciledCount: number }>> {
  const { profile } = await getCurrentUser()
  const supabase = await createClient()

  // 1. Get session details
  const { data: session } = await (supabase
    .from('opname_sessions') as any)
    .select('id, business_unit_id, location_id')
    .eq('id', sessionId)
    .single()

  if (!session || !session.location_id) {
    return {
      success: false,
      error: 'Rekonsiliasi otomatis hanya berlaku untuk sesi opname dengan lokasi spesifik.',
    }
  }

  // 2. Find all unmatched scans
  const { data: unmatchedScans } = await (supabase
    .from('opname_scans') as any)
    .select('id, asset_id')
    .eq('session_id', sessionId)
    .eq('matched', false)

  if (!unmatchedScans || unmatchedScans.length === 0) {
    return { success: true, data: { reconciledCount: 0 } }
  }

  let count = 0
  for (const scan of unmatchedScans) {
    // Update asset location
    await (supabase
      .from('assets') as any)
      .update({
        current_location_id: session.location_id,
        business_unit_id: session.business_unit_id,
      })
      .eq('id', scan.asset_id)

    // Log history
    await (supabase.from('asset_location_history') as any).insert({
      asset_id: scan.asset_id,
      location_id: session.location_id,
      moved_by: profile.id,
      note: 'Penyesuaian lokasi otomatis hasil rekonsiliasi Stock Opname',
    })

    // Mark scan matched
    await (supabase
      .from('opname_scans') as any)
      .update({ matched: true })
      .eq('id', scan.id)

    count++
  }

  revalidatePath(`/dashboard/opname/${sessionId}`)
  revalidatePath('/dashboard/assets')
  return { success: true, data: { reconciledCount: count } }
}

export async function completeOpnameSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('opname_sessions') as any)
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/opname')
  revalidatePath(`/dashboard/opname/${sessionId}`)
  return { success: true, data: undefined }
}
