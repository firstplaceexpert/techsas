'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/permissions'
import { assetCategorySchema, type AssetCategoryFormValues } from '@/lib/validations/asset-category'
import type { ActionResult, AssetCategory } from '@/types'

export async function getAssetCategories(): Promise<AssetCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('asset_categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAssetCategoryById(id: string): Promise<AssetCategory | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('asset_categories')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function createAssetCategory(
  values: AssetCategoryFormValues
): Promise<ActionResult<AssetCategory>> {
  await requireRole('super_admin', 'corporate_admin')

  const parsed = assetCategorySchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('asset_categories') as any)
    .insert({
      name: parsed.data.name,
      account_code_asset: parsed.data.account_code_asset || null,
      account_code_accum: parsed.data.account_code_accum || null,
      account_code_expense: parsed.data.account_code_expense || null,
      default_useful_life_months: parsed.data.default_useful_life_months,
      default_depreciation_method: parsed.data.default_depreciation_method,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/asset-categories')
  return { success: true, data }
}

export async function updateAssetCategory(
  id: string,
  values: AssetCategoryFormValues
): Promise<ActionResult<AssetCategory>> {
  await requireRole('super_admin', 'corporate_admin')

  const parsed = assetCategorySchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('asset_categories') as any)
    .update({
      name: parsed.data.name,
      account_code_asset: parsed.data.account_code_asset || null,
      account_code_accum: parsed.data.account_code_accum || null,
      account_code_expense: parsed.data.account_code_expense || null,
      default_useful_life_months: parsed.data.default_useful_life_months,
      default_depreciation_method: parsed.data.default_depreciation_method,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/asset-categories')
  return { success: true, data }
}

export async function deleteAssetCategory(id: string): Promise<ActionResult> {
  await requireRole('super_admin')

  const supabase = await createClient()
  const { error } = await (supabase
    .from('asset_categories') as any)
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/asset-categories')
  return { success: true, data: undefined }
}
