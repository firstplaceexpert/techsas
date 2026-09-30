import { getMaintenanceList, getMaintenanceMetrics } from './actions'
import MaintenanceListClient from './MaintenanceListClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pemeliharaan & Work Order - TECHSAS TECHSAS',
}

export default async function MaintenancePage() {
  const [list, metrics] = await Promise.all([
    getMaintenanceList(),
    getMaintenanceMetrics(),
  ])

  return <MaintenanceListClient initialList={list} metrics={metrics} />
}
