import Link from 'next/link'
import { Plus, Box } from 'lucide-react'
import { getAssets } from './actions'
import { getBusinessUnits } from '../business-units/actions'
import { getAssetCategories } from '../asset-categories/actions'
import { getCurrentUser } from '@/lib/auth/permissions'
import AssetFiltersClient from './AssetFiltersClient'
import DeleteAssetButton from './DeleteButton'
import type { Metadata } from 'next'
import type { AssetFilters } from '@/types'

export const metadata: Metadata = { title: 'Daftar Aset' }

const conditionBadge: Record<string, string> = {
  good: 'badge-green',
  fair: 'badge-yellow',
  damaged: 'badge-red',
  under_repair: 'badge-blue',
}
const conditionLabel: Record<string, string> = {
  good: 'Baik', fair: 'Cukup', damaged: 'Rusak', under_repair: 'Dalam Perbaikan',
}
const statusBadge: Record<string, string> = {
  active: 'badge-green', pending: 'badge-yellow', disposed: 'badge-slate',
}
const statusLabel: Record<string, string> = {
  active: 'Aktif', pending: 'Pending', disposed: 'Dilepas',
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: AssetFilters & { page?: string }
}) {
  const { profile } = await getCurrentUser()
  const [businessUnits, categories] = await Promise.all([
    getBusinessUnits(),
    getAssetCategories(),
  ])

  const filters: AssetFilters = {
    search: searchParams.search,
    businessUnitId: searchParams.businessUnitId,
    categoryId: searchParams.categoryId,
    status: searchParams.status,
    condition: searchParams.condition,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 20,
  }

  const { data: assets, meta } = await getAssets(filters)
  const canWrite = ['super_admin', 'corporate_admin', 'unit_admin', 'field_officer'].includes(profile.role)
  const canDelete = ['super_admin', 'corporate_admin', 'unit_admin'].includes(profile.role)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daftar Aset</h1>
          <p className="page-subtitle">{meta.total.toLocaleString('id-ID')} aset ditemukan</p>
        </div>
        {canWrite && (
          <Link href="/dashboard/assets/new" className="btn-primary" id="btn-add-asset">
            <Plus className="w-4 h-4" /> Tambah Aset
          </Link>
        )}
      </div>

      {/* Filters */}
      <AssetFiltersClient
        businessUnits={businessUnits}
        categories={categories}
        currentFilters={filters}
      />

      {assets.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Box className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-slate-600 font-medium">Tidak ada aset ditemukan</h3>
          <p className="text-slate-400 text-sm mt-1">Coba ubah filter atau tambahkan aset baru.</p>
          {canWrite && (
            <Link href="/dashboard/assets/new" className="btn-primary mt-4">
              <Plus className="w-4 h-4" /> Tambah Aset
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Kode / Nama</th>
                  <th>Kategori</th>
                  <th>Unit Bisnis</th>
                  <th>Lokasi</th>
                  <th>Kondisi</th>
                  <th>Status</th>
                  <th>Harga Beli</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {asset.photo_url ? (
                          <img src={asset.photo_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-slate-100" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                            <Box className="w-4 h-4 text-brand-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/dashboard/assets/${asset.id}`} className="font-semibold text-slate-900 hover:text-brand-600 truncate block">
                            {asset.name}
                          </Link>
                          <span className="text-xs text-slate-400 font-mono">{asset.asset_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600">
                      <div>
                        <span className="font-medium text-slate-800">{asset.category?.name ?? '—'}</span>
                        {(asset.account_code_asset || asset.category?.account_code_asset) && (
                          <span className="block font-mono text-[10px] text-brand-600 font-semibold tracking-wide">
                            CoA: {asset.account_code_asset || asset.category?.account_code_asset}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-slate-500 whitespace-nowrap">{asset.business_unit?.name ?? '—'}</td>
                    <td className="text-slate-500 text-xs">{asset.current_location?.name ?? '—'}</td>
                    <td><span className={conditionBadge[asset.condition] ?? 'badge-slate'}>{conditionLabel[asset.condition] ?? asset.condition}</span></td>
                    <td><span className={statusBadge[asset.status] ?? 'badge-slate'}>{statusLabel[asset.status] ?? asset.status}</span></td>
                    <td className="tabular-nums text-slate-700">
                      {asset.purchase_price != null
                        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(asset.purchase_price)
                        : '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/assets/${asset.id}`} className="btn-ghost btn-sm">Detail</Link>
                        {canWrite && <Link href={`/dashboard/assets/${asset.id}/edit`} className="btn-ghost btn-sm" id={`btn-edit-asset-${asset.id}`}>Edit</Link>}
                        {canDelete && <DeleteAssetButton id={asset.id} name={asset.name} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Menampilkan {(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)} dari {meta.total} aset</span>
              <div className="flex gap-2">
                {meta.page > 1 && (
                  <Link href={`/dashboard/assets?page=${meta.page - 1}`} className="btn-secondary btn-sm">← Sebelumnya</Link>
                )}
                {meta.page < meta.totalPages && (
                  <Link href={`/dashboard/assets?page=${meta.page + 1}`} className="btn-secondary btn-sm">Berikutnya →</Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
