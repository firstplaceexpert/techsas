import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/permissions'
import { getLocations, createLocation } from '../actions'
import { getBusinessUnits } from '../../business-units/actions'
import LocationForm from '../LocationForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Lokasi' }

export default async function NewLocationPage() {
  await requireRole('super_admin', 'corporate_admin', 'unit_admin')
  const [businessUnits, locations] = await Promise.all([getBusinessUnits(), getLocations()])

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/locations" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Lokasi
        </Link>
        <h1 className="page-title">Tambah Lokasi</h1>
        <p className="page-subtitle">Daftarkan lokasi baru ke dalam hierarki</p>
      </div>
      <div className="card card-body">
        <LocationForm
          businessUnits={businessUnits}
          locations={locations}
          onSubmit={createLocation}
          submitLabel="Simpan Lokasi"
        />
      </div>
    </div>
  )
}
