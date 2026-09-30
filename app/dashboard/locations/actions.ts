'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/permissions'
import { locationSchema, type LocationFormValues } from '@/lib/validations/location'
import type { ActionResult, Location, LocationNode } from '@/types'

export async function getLocations(businessUnitId?: string): Promise<Location[]> {
  const supabase = await createClient()
  let query = supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('level')
    .order('name')

  if (businessUnitId) {
    query = query.eq('business_unit_id', businessUnitId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getLocationsTree(businessUnitId?: string): Promise<LocationNode[]> {
  const locations = await getLocations(businessUnitId)
  return buildTree(locations)
}

function buildTree(locations: Location[], parentId: string | null = null): LocationNode[] {
  return locations
    .filter((loc) => loc.parent_id === parentId)
    .map((loc) => ({
      ...loc,
      business_unit: null,
      children: buildTree(locations, loc.id),
    }))
}

export async function getLocationById(id: string): Promise<Location | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createLocation(
  values: LocationFormValues
): Promise<ActionResult<Location>> {
  await requireRole('super_admin', 'corporate_admin', 'unit_admin')

  const parsed = locationSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('locations') as any)
    .insert({
      name: parsed.data.name,
      business_unit_id: parsed.data.business_unit_id,
      parent_id: parsed.data.parent_id ?? null,
      level: parsed.data.level,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/locations')
  return { success: true, data }
}

export async function updateLocation(
  id: string,
  values: LocationFormValues
): Promise<ActionResult<Location>> {
  await requireRole('super_admin', 'corporate_admin', 'unit_admin')

  const parsed = locationSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('locations') as any)
    .update({
      name: parsed.data.name,
      business_unit_id: parsed.data.business_unit_id,
      parent_id: parsed.data.parent_id ?? null,
      level: parsed.data.level,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/locations')
  return { success: true, data }
}

export async function deleteLocation(id: string): Promise<ActionResult> {
  await requireRole('super_admin', 'corporate_admin', 'unit_admin')

  const supabase = await createClient()
  const { error } = await (supabase
    .from('locations') as any)
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/locations')
  return { success: true, data: undefined }
}
