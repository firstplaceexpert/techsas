import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/permissions'
import { getLocationById, getLocations } from '../../actions'
import { getBusinessUnits } from '../../../business-units/actions'
import LocationForm from '../../LocationForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Lokasi' }

export default async function EditLocationPage({ params }: { params: { id: string } }) {
  await requireRole('super_admin', 'corporate_admin', 'unit_admin')
  const [location, businessUnits, locations] = await Promise.all([
    getLocationById(params.id),
    getBusinessUnits(),
    getLocations(),
  ])
  if (!location) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/locations" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Lokasi
        </Link>
        <h1 className="page-title">Edit Lokasi</h1>
        <p className="page-subtitle">{location.name}</p>
      </div>
      <div className="card card-body">
        <LocationForm
          initialData={location}
          locationId={params.id}
          businessUnits={businessUnits}
          locations={locations}
          submitLabel="Simpan Perubahan"
        />
      </div>
    </div>
  )
}
