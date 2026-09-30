import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/permissions'
import AssetForm from '../../AssetForm'
import { getAssetById, updateAsset } from '../../actions'
import { getAssetCategories } from '../../../asset-categories/actions'
import { getBusinessUnits } from '../../../business-units/actions'
import { getLocations } from '../../../locations/actions'
import { getUsers } from '../../../settings/users/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Aset' }

export default async function EditAssetPage({ params }: { params: { id: string } }) {
  await requireRole('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
  const [asset, categories, businessUnits, locations] = await Promise.all([
    getAssetById(params.id),
    getAssetCategories(),
    getBusinessUnits(),
    getLocations(),
  ])
  if (!asset) notFound()

  const users = await getUsers().catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/assets/${params.id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Detail Aset
        </Link>
        <h1 className="page-title">Edit Aset</h1>
        <p className="page-subtitle font-mono text-base">{asset.asset_code} — {asset.name}</p>
      </div>
      <div className="card card-body">
        <AssetForm
          initialData={asset}
          assetId={params.id}
          categories={categories}
          businessUnits={businessUnits}
          locations={locations}
          users={users}
          submitLabel="Simpan Perubahan"
        />
      </div>
    </div>
  )
}
