'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/permissions'
import { updateUserRoleSchema, type UpdateUserRoleFormValues } from '@/lib/validations/user'
import type { ActionResult, Profile, ProfileWithUnit } from '@/types'

export async function getUsers(): Promise<ProfileWithUnit[]> {
  await requireRole('super_admin', 'corporate_admin')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      business_unit:business_units(id, name, type)
    `)
    .order('full_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ProfileWithUnit[]
}

export async function getUserById(id: string): Promise<ProfileWithUnit | null> {
  await requireRole('super_admin', 'corporate_admin')

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select(`
      *,
      business_unit:business_units(id, name, type)
    `)
    .eq('id', id)
    .single()

  return data as unknown as ProfileWithUnit | null
}

export async function updateUserRole(
  values: UpdateUserRoleFormValues
): Promise<ActionResult<Profile>> {
  await requireRole('super_admin', 'corporate_admin')

  const parsed = updateUserRoleSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  // Corporate users (super_admin, corporate_admin) should not have a business_unit_id
  const businessUnitId =
    parsed.data.role === 'super_admin' || parsed.data.role === 'corporate_admin'
      ? null
      : (parsed.data.business_unit_id ?? null)

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('profiles') as any)
    .update({
      role: parsed.data.role,
      business_unit_id: businessUnitId,
      ...(parsed.data.full_name ? { full_name: parsed.data.full_name } : {}),
      ...(parsed.data.department !== undefined ? { department: parsed.data.department || null } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone || null } : {}),
    })
    .eq('id', parsed.data.user_id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/settings/users')
  return { success: true, data }
}

export async function deactivateUser(userId: string): Promise<ActionResult> {
  await requireRole('super_admin')

  const supabase = await createClient()
  const { error } = await (supabase
    .from('profiles') as any)
    .update({ is_active: false })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/settings/users')
  return { success: true, data: undefined }
}
