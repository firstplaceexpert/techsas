import { notFound } from 'next/navigation'
import { getOpnameSessionById } from '../actions'
import OpnameSessionClient from './OpnameSessionClient'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const session = await getOpnameSessionById(params.id)
  return {
    title: session
      ? `Audit Opname: ${session.business_unit?.name} - TECHSAS`
      : 'Sesi Opname',
  }
}

export default async function OpnameDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getOpnameSessionById(params.id)
  if (!session) notFound()

  return <OpnameSessionClient initialSession={session} />
}
