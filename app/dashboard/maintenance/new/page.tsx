import { createClient } from '@/lib/supabase/server'
import { getAssets } from '@/app/dashboard/assets/actions'
import NewMaintenanceClient from './NewMaintenanceClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buat Tiket Pemeliharaan - TECHSAS TECHSAS',
}

export default async function NewMaintenancePage({
  searchParams,
}: {
  searchParams: { assetId?: string }
}) {
  const supabase = await createClient()

  const [assetsRes, { data: profiles }] = await Promise.all([
    getAssets({ pageSize: 300 }),
    supabase.from('profiles').select('*').eq('is_active', true),
  ])

  return (
    <NewMaintenanceClient
      assets={assetsRes.data}
      technicians={(profiles || []) as any}
      defaultAssetId={searchParams.assetId}
    />
  )
}
