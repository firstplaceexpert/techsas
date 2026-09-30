import { createClient } from '@/lib/supabase/server'
import { getBusinessUnits } from '@/app/dashboard/business-units/actions'
import { getAssetCategories } from '@/app/dashboard/asset-categories/actions'
import PrintLabelsClient from './PrintLabelsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cetak Label QR - TECHSAS TECHSAS',
}

export default async function PrintLabelsPage() {
  const supabase = await createClient()

  // Fetch all non-disposed assets with their qr_code_uuid
  const { data: assetsData } = await (supabase
    .from('assets') as any)
    .select(
      `
      id, asset_code, name, condition, status, photo_url,
      purchase_price, current_book_value, purchase_date, created_at,
      qr_code_uuid,
      category:asset_categories(id, name),
      business_unit:business_units(id, name, type),
      current_location:locations(id, name, level)
    `
    )
    .neq('status', 'disposed')
    .order('created_at', { ascending: false })
    .limit(200)

  const [businessUnits, categories] = await Promise.all([
    getBusinessUnits(),
    getAssetCategories(),
  ])

  return (
    <PrintLabelsClient
      initialAssets={(assetsData || []) as any}
      businessUnits={businessUnits}
      categories={categories}
    />
  )
}
