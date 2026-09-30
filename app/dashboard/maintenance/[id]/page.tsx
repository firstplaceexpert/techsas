import { notFound } from 'next/navigation'
import { getMaintenanceById } from '../actions'
import MaintenanceDetailClient from './MaintenanceDetailClient'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const maint = await getMaintenanceById(params.id)
  return {
    title: maint ? `Work Order: ${maint.asset?.name} - TECHSAS` : 'Detail Pemeliharaan',
  }
}

export default async function MaintenanceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const maint = await getMaintenanceById(params.id)
  if (!maint) notFound()

  return <MaintenanceDetailClient maint={maint} />
}
