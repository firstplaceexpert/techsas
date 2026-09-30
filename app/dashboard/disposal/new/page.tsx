import { getAssets } from '@/app/dashboard/assets/actions'
import { getBusinessUnits } from '@/app/dashboard/business-units/actions'
import NewDisposalClient from './NewDisposalClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pengajuan Pelepasan Aset - TECHSAS TECHSAS',
}

export default async function NewDisposalPage() {
  const [assetsRes, businessUnits] = await Promise.all([
    getAssets({ pageSize: 300 }),
    getBusinessUnits(),
  ])

  return (
    <NewDisposalClient
      assets={assetsRes.data}
      businessUnits={businessUnits}
    />
  )
}
