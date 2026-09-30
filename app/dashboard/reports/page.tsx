import { getComprehensiveReportData } from './actions'
import { getBusinessUnits } from '@/app/dashboard/business-units/actions'
import { getAssetCategories } from '@/app/dashboard/asset-categories/actions'
import ReportsClient from './ReportsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laporan & Analitik - TECHSAS TECHSAS',
}

export default async function ReportsPage() {
  const [reportData, businessUnits, categories] = await Promise.all([
    getComprehensiveReportData(),
    getBusinessUnits(),
    getAssetCategories(),
  ])

  return (
    <ReportsClient
      data={reportData}
      businessUnits={businessUnits}
      categories={categories}
    />
  )
}
