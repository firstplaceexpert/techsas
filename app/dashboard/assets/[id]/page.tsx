import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronLeft,
  Pencil,
  Box,
  MapPin,
  User,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  Printer,
  Wrench,
  TrendingDown,
} from 'lucide-react'
import {
  getAssetById,
  getAssetLocationHistory,
  getAssetMaintenanceHistory,
  getAssetDepreciationLogs,
} from '../actions'
import { getLocations } from '@/app/dashboard/locations/actions'
import { getBusinessUnits } from '@/app/dashboard/business-units/actions'
import { getCurrentUser } from '@/lib/auth/permissions'
import AssetDetailTabs from './AssetDetailTabs'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const asset = await getAssetById(params.id)
  return { title: asset ? `${asset.name} (${asset.asset_code}) - TECHSAS` : 'Detail Aset' }
}

const conditionBadge: Record<string, string> = {
  good: 'badge-green',
  fair: 'badge-yellow',
  damaged: 'badge-red',
  under_repair: 'badge-blue',
}
const conditionLabel: Record<string, string> = {
  good: 'Baik',
  fair: 'Cukup',
  damaged: 'Rusak',
  under_repair: 'Dalam Perbaikan',
}
const statusBadge: Record<string, string> = {
  active: 'badge-green',
  pending: 'badge-yellow',
  disposed: 'badge-slate',
}
const statusLabel: Record<string, string> = {
  active: 'Aktif',
  pending: 'Pending',
  disposed: 'Dilepas',
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-slate-50 last:border-0">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words">{value ?? '—'}</p>
      </div>
    </div>
  )
}

function formatCurrency(n?: number | null) {
  if (n == null) return undefined
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default async function AssetDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [
    asset,
    locationHistory,
    maintenanceHistory,
    depreciationLogs,
    locations,
    businessUnits,
    { profile },
  ] = await Promise.all([
    getAssetById(params.id),
    getAssetLocationHistory(params.id),
    getAssetMaintenanceHistory(params.id),
    getAssetDepreciationLogs(params.id),
    getLocations(),
    getBusinessUnits(),
    getCurrentUser(),
  ])

  if (!asset) notFound()

  const canEdit = [
    'super_admin',
    'corporate_admin',
    'unit_admin',
    'field_officer',
  ].includes(profile.role)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div>
        <Link
          href="/dashboard/assets"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Aset
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="page-title">{asset.name}</h1>
              <span className={statusBadge[asset.status] ?? 'badge-slate'}>
                {statusLabel[asset.status]}
              </span>
              <span className={conditionBadge[asset.condition] ?? 'badge-slate'}>
                {conditionLabel[asset.condition]}
              </span>
            </div>
            <p className="text-slate-400 font-mono text-sm font-semibold">{asset.asset_code}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/assets/print-labels"
              className="btn-secondary text-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Label
            </Link>
            {canEdit && (
              <Link
                href={`/dashboard/assets/${asset.id}/edit`}
                className="btn-primary text-xs"
                id="btn-edit-asset-detail"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Aset
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo */}
          {asset.photo_url && (
            <div className="card overflow-hidden">
              <img
                src={asset.photo_url}
                alt={asset.name}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Primary Info Card */}
          <div className="card card-body space-y-0">
            <InfoRow
              icon={<Tag className="w-4 h-4" />}
              label="Kategori & Bagan Akun (CoA)"
              value={
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{asset.category?.name ?? '—'}</span>
                  {(asset.account_code_asset || asset.category?.account_code_asset) && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-700 font-bold">
                      CoA: {asset.account_code_asset || asset.category?.account_code_asset}
                    </span>
                  )}
                </div>
              }
            />
            <InfoRow
              icon={<Box className="w-4 h-4" />}
              label="Unit Bisnis"
              value={asset.business_unit?.name}
            />
            <InfoRow
              icon={<MapPin className="w-4 h-4" />}
              label="Lokasi Saat Ini"
              value={asset.current_location?.name}
            />
            <InfoRow
              icon={<User className="w-4 h-4" />}
              label="PIC"
              value={asset.current_pic?.full_name}
            />
            {asset.description && (
              <InfoRow
                icon={<FileText className="w-4 h-4" />}
                label="Deskripsi"
                value={asset.description}
              />
            )}
          </div>

          {/* Tabbed Interactive History Modules */}
          <AssetDetailTabs
            asset={asset}
            locationHistory={locationHistory}
            maintenanceHistory={maintenanceHistory}
            depreciationLogs={depreciationLogs}
            locations={locations}
            businessUnits={businessUnits}
            canManage={canEdit}
          />
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Purchase & Financial Info */}
          <div className="card card-body">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Data Finansial & Depresiasi
            </h3>
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Tanggal Perolehan"
              value={
                asset.purchase_date
                  ? new Date(asset.purchase_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : undefined
              }
            />
            <InfoRow
              icon={<DollarSign className="w-4 h-4" />}
              label="Harga Perolehan"
              value={formatCurrency(asset.purchase_price)}
            />
            <InfoRow
              icon={<DollarSign className="w-4 h-4 text-brand-600" />}
              label="Nilai Buku Saat Ini"
              value={formatCurrency(asset.current_book_value)}
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Masa Manfaat"
              value={
                asset.useful_life_months
                  ? `${asset.useful_life_months} bulan (${(
                      asset.useful_life_months / 12
                    ).toFixed(1)} thn)`
                  : undefined
              }
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Garansi Hingga"
              value={
                asset.warranty_until
                  ? new Date(asset.warranty_until).toLocaleDateString('id-ID')
                  : undefined
              }
            />
            <InfoRow
              icon={<FileText className="w-4 h-4 text-brand-600" />}
              label="Akun Akuntansi (CoA)"
              value={
                asset.account_code_asset || asset.category?.account_code_asset ? (
                  <div className="font-mono text-xs space-y-0.5">
                    <span className="font-bold text-slate-800">
                      {asset.account_code_asset || asset.category?.account_code_asset}
                    </span>
                    {(asset.account_code_accum || asset.category?.account_code_accum) && (
                      <span className="text-[10px] text-slate-400 block">
                        Akum: {asset.account_code_accum || asset.category?.account_code_accum}
                        {asset.account_code_expense || asset.category?.account_code_expense
                          ? ` | Beban: ${asset.account_code_expense || asset.category?.account_code_expense}`
                          : ''}
                      </span>
                    )}
                  </div>
                ) : (
                  '—'
                )
              }
            />
          </div>

          {/* Legal doc */}
          {asset.legal_document_url && (
            <div className="card card-body">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Dokumen Legal / Bukti
              </h3>
              <a
                href={asset.legal_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-xs font-semibold"
              >
                <FileText className="w-4 h-4" /> Buka Dokumen Legal (PDF/DOC)
              </a>
            </div>
          )}

          {/* Metadata */}
          <div className="card card-body">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Audit Metadata
            </h3>
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Tanggal Ditambahkan"
              value={new Date(asset.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Terakhir Diperbarui"
              value={new Date(asset.updated_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
