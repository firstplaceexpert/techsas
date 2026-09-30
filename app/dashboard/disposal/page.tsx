import { getDisposalRecords } from './actions'
import DisposalListClient from './DisposalListClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pelepasan Aset (Disposal) - TECHSAS TECHSAS',
}

export default async function DisposalPage() {
  const disposals = await getDisposalRecords()
  return <DisposalListClient initialDisposals={disposals} />
}
