import { getBusinessUnits } from '@/app/dashboard/business-units/actions'
import { getLocations } from '@/app/dashboard/locations/actions'
import NewOpnameClient from './NewOpnameClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mulai Sesi Opname - TECHSAS TECHSAS',
}

export default async function NewOpnamePage() {
  const [businessUnits, locations] = await Promise.all([
    getBusinessUnits(),
    getLocations(),
  ])

  return <NewOpnameClient businessUnits={businessUnits} locations={locations} />
}
