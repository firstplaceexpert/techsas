import { notFound } from 'next/navigation'
import { getDisposalRecordById } from '../actions'
import { getCurrentUser } from '@/lib/auth/permissions'
import DisposalDetailClient from './DisposalDetailClient'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const record = await getDisposalRecordById(params.id)
  return {
    title: record
      ? `Pelepasan: ${record.asset?.name} - TECHSAS`
      : 'Detail Pelepasan',
  }
}

export default async function DisposalDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [record, { profile }] = await Promise.all([
    getDisposalRecordById(params.id),
    getCurrentUser(),
  ])

  if (!record) notFound()

  return <DisposalDetailClient record={record} userRole={profile.role} />
}
