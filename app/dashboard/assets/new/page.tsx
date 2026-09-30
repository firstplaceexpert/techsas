import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/permissions'
import AssetForm from '../AssetForm'
import { createAsset } from '../actions'
import { getAssetCategories } from '../../asset-categories/actions'
import { getBusinessUnits } from '../../business-units/actions'
import { getLocations } from '../../locations/actions'
import { getUsers } from '../../settings/users/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Aset' }

export default async function NewAssetPage() {
  const { profile } = await getCurrentUser()
  const [categories, businessUnits, locations, users] = await Promise.all([
    getAssetCategories(),
    getBusinessUnits(),
    getLocations(),
    getUsers().catch(() => []),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/assets" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Aset
        </Link>
        <h1 className="page-title">Tambah Aset Baru</h1>
        <p className="page-subtitle">Kode aset akan di-generate otomatis setelah disimpan</p>
      </div>
      <div className="card card-body">
        <AssetForm
          categories={categories}
          businessUnits={businessUnits}
          locations={locations}
          users={users}
          submitLabel="Simpan Aset"
          defaultBusinessUnitId={profile.business_unit_id ?? undefined}
        />
      </div>
    </div>
  )
}
