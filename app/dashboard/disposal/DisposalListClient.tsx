'use client'

import { useState } from 'react'
import {
  Trash2,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Building2,
  Tag,
} from 'lucide-react'
import Link from 'next/link'
import type { DisposalWithRelations } from './actions'

const statusBadges: Record<string, { label: string; class: string }> = {
  pending: { label: 'Menunggu Persetujuan', class: 'badge-yellow' },
  approved: { label: 'Disetujui', class: 'badge-blue' },
  rejected: { label: 'Ditolak', class: 'badge-red' },
}

const typeLabels: Record<string, { label: string }> = {
  sale: { label: 'Penjualan Langsung' },
  auction: { label: 'Lelang Terbuka' },
  donation: { label: 'Hibah / Donasi' },
  transfer: { label: 'Transfer Antar Unit' },
  writeoff: { label: 'Pemusnahan / Write-off' },
}

function formatRupiah(n?: number | null) {
  if (n == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function DisposalListClient({
  initialDisposals,
}: {
  initialDisposals: DisposalWithRelations[]
}) {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedType, setSelectedType] = useState('')

  const filtered = initialDisposals.filter((d) => {
    const matchSearch =
      !search ||
      d.asset?.name.toLowerCase().includes(search.toLowerCase()) ||
      d.asset?.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      d.buyer_or_recipient?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !selectedStatus || d.approval_status === selectedStatus
    const matchType = !selectedType || d.disposal_type === selectedType
    return matchSearch && matchStatus && matchType
  })

  const pendingCount = initialDisposals.filter((d) => d.approval_status === 'pending').length
  const approvedCount = initialDisposals.filter((d) => d.approval_status === 'approved').length
  const totalRealized = initialDisposals
    .filter((d) => d.approval_status === 'approved' && d.disposed_at)
    .reduce((sum, d) => sum + (Number(d.sale_price) || 0), 0)

  const totalGainLoss = initialDisposals
    .filter((d) => d.approval_status === 'approved' && d.disposed_at)
    .reduce((sum, d) => sum + (Number(d.gain_loss_amount) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Pelepasan Aset & Disposal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengajuan pelepasan aset (penjualan, lelang, hibah, transfer, pemusnahan) dengan alur persetujuan berjenjang.
          </p>
        </div>

        <Link
          href="/dashboard/disposal/new"
          className="btn-primary flex items-center gap-2 self-start"
          id="btn-create-disposal"
        >
          <Plus className="w-4 h-4" /> Ajukan Pelepasan Aset
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 border-l-4 border-l-amber-500 bg-white">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Menunggu Approval
          </p>
          <p className="text-xl font-extrabold text-amber-600 mt-0.5">{pendingCount}</p>
          <span className="text-[10px] text-slate-400">Perlu ditinjau</span>
        </div>

        <div className="card p-4 border-l-4 border-l-blue-500 bg-white">
          <p className="text-[11px] text-charcoal uppercase tracking-wider font-semibold">
            Telah Disetujui
          </p>
          <p className="text-xl font-extrabold text-charcoal mt-0.5">{approvedCount}</p>
          <span className="text-[10px] text-slate-400">Siap dieksekusi</span>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-600 bg-white">
          <p className="text-[11px] text-emerald-600 uppercase tracking-wider font-semibold">
            Total Realisasi Penjualan
          </p>
          <p className="text-base font-extrabold text-slate-900 mt-0.5 truncate">
            {formatRupiah(totalRealized)}
          </p>
          <span className="text-[10px] text-slate-400">Hasil lelang / jual</span>
        </div>

        <div className="card p-4 border-l-4 border-l-brand-600 bg-white">
          <p className="text-[11px] text-brand-600 uppercase tracking-wider font-semibold">
            Gain / Loss Pelepasan
          </p>
          <p
            className={`text-base font-extrabold mt-0.5 truncate ${
              totalGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {totalGainLoss >= 0 ? `+${formatRupiah(totalGainLoss)}` : formatRupiah(totalGainLoss)}
          </p>
          <span className="text-[10px] text-slate-400">Selisih vs Nilai Buku</span>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="card p-3.5 bg-slate-50/80 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode aset, nama, atau pembeli/penerima..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="">Semua Status Approval</option>
            <option value="pending">Menunggu Persetujuan</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="">Semua Metode Disposal</option>
            <option value="sale">Penjualan Langsung</option>
            <option value="auction">Lelang</option>
            <option value="donation">Hibah / Donasi</option>
            <option value="transfer">Transfer Antar Unit</option>
            <option value="writeoff">Write-off / Musnah</option>
          </select>
        </div>
      </div>

      {/* Disposals List */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Trash2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Tidak ada data pelepasan aset yang cocok.</p>
            <p className="mt-1">Buat pengajuan baru atau ubah filter pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const statusObj = statusBadges[item.approval_status] || {
                label: item.approval_status,
                class: 'badge-slate',
              }
              const typeObj = typeLabels[item.disposal_type] || {
                label: item.disposal_type,
              }

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge text-xs font-semibold ${statusObj.class}`}>
                        {statusObj.label}
                      </span>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {typeObj.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {item.asset?.asset_code}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 leading-snug">
                      {item.asset?.name}
                    </h3>

                    {item.notes && (
                      <p className="text-xs text-slate-600 line-clamp-1">
                        Alasan: {item.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-0.5">
                      <span>Unit: {item.asset?.business_unit?.name}</span>
                      <span>Diajukan oleh: {item.requester?.full_name || 'Staff'}</span>
                      {item.disposed_at && (
                        <span className="text-emerald-600 font-semibold">
                          Tereksekusi: {new Date(item.disposed_at).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 block">Harga Pelepasan</span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatRupiah(item.sale_price)}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/disposal/${item.id}`}
                      className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3"
                    >
                      Buka Workflow <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
