import { getBusinessUnits } from '@/app/dashboard/business-units/actions'
import { getLocations } from '@/app/dashboard/locations/actions'
import ScannerClient from './ScannerClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QR Scanner Kamera - TECHSAS TECHSAS',
}

export default async function ScannerPage() {
  const [businessUnits, locations] = await Promise.all([
    getBusinessUnits(),
    getLocations(),
  ])

  return <ScannerClient businessUnits={businessUnits} locations={locations} />
}
