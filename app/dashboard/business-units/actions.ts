'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/permissions'
import { businessUnitSchema, type BusinessUnitFormValues } from '@/lib/validations/business-unit'
import type { ActionResult, BusinessUnit } from '@/types'

const ADMIN_ROLES = ['super_admin', 'corporate_admin'] as const

export async function getBusinessUnits(): Promise<BusinessUnit[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('business_units')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getBusinessUnitById(id: string): Promise<BusinessUnit | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('business_units')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createBusinessUnit(
  values: BusinessUnitFormValues
): Promise<ActionResult<BusinessUnit>> {
  await requireRole(...ADMIN_ROLES)

  const parsed = businessUnitSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('business_units') as any)
    .insert({
      name: parsed.data.name,
      code: parsed.data.code || null,
      type: parsed.data.type,
      logo_url: parsed.data.logo_url || null,
      address: parsed.data.address || null,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/business-units'); revalidatePath('/dashboard')
  return { success: true, data }
}

export async function updateBusinessUnit(
  id: string,
  values: BusinessUnitFormValues
): Promise<ActionResult<BusinessUnit>> {
  await requireRole(...ADMIN_ROLES)

  const parsed = businessUnitSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('business_units') as any)
    .update({
      name: parsed.data.name,
      code: parsed.data.code || null,
      type: parsed.data.type,
      logo_url: parsed.data.logo_url || null,
      address: parsed.data.address || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/business-units'); revalidatePath('/dashboard')
  revalidatePath(`/dashboard/business-units/${id}/edit`)
  return { success: true, data }
}

export async function deleteBusinessUnit(id: string): Promise<ActionResult> {
  await requireRole('super_admin', 'corporate_admin')

  const supabase = await createClient()

  // In demo / Supabase: delete record or mark inactive
  const { error } = await (supabase
    .from('business_units') as any)
    .delete()
    .eq('id', id)

  if (error) {
    const { error: updateError } = await (supabase
      .from('business_units') as any)
      .update({ is_active: false })
      .eq('id', id)
    if (updateError) return { success: false, error: updateError.message }
  }

  revalidatePath('/dashboard/business-units')
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}
