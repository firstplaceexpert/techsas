import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getLocationsTree } from './actions'
import { getBusinessUnits } from '../business-units/actions'
import { getCurrentUser } from '@/lib/auth/permissions'
import LocationTree from './LocationTree'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Lokasi' }

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: { bu?: string }
}) {
  const { profile } = await getCurrentUser()
  const businessUnits = await getBusinessUnits()

  const selectedBuId = searchParams.bu ?? (businessUnits[0]?.id ?? '')
  const tree = selectedBuId ? await getLocationsTree(selectedBuId) : []
  const selectedBu = businessUnits.find((b) => b.id === selectedBuId)

  const canDelete = ['super_admin', 'corporate_admin', 'unit_admin'].includes(profile.role)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lokasi</h1>
          <p className="page-subtitle">Struktur hierarki lokasi per unit bisnis</p>
        </div>
        <Link href="/dashboard/locations/new" className="btn-primary" id="btn-add-location">
          <Plus className="w-4 h-4" /> Tambah Lokasi
        </Link>
      </div>

      {/* Business unit filter tabs */}
      {businessUnits.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {businessUnits.map((bu) => (
            <Link
              key={bu.id}
              href={`/dashboard/locations?bu=${bu.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                bu.id === selectedBuId
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {bu.name}
            </Link>
          ))}
        </div>
      )}

      <div className="card">
        {selectedBu && (
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">{selectedBu.name}</h2>
            <span className="text-sm text-slate-400">{tree.length} lokasi root</span>
          </div>
        )}
        <LocationTree nodes={tree} canDelete={canDelete} />
      </div>
    </div>
  )
}
