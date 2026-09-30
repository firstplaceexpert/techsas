import { getBusinessUnits } from '@/app/dashboard/business-units/actions'
import {
  getDepreciationLogs,
  getDepreciationMetrics,
  getMonthlyAccountingJournal,
} from './actions'
import DepreciationClient from './DepreciationClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Penyusutan Aset & Jurnal Akuntansi - TECHSAS TECHSAS',
}

export default async function DepreciationPage() {
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [logs, metrics, businessUnits, initialJournal] = await Promise.all([
    getDepreciationLogs(),
    getDepreciationMetrics(),
    getBusinessUnits(),
    getMonthlyAccountingJournal(currentMonthStr),
  ])

  return (
    <DepreciationClient
      initialLogs={logs}
      metrics={metrics}
      businessUnits={businessUnits}
      initialJournal={initialJournal}
    />
  )
}
