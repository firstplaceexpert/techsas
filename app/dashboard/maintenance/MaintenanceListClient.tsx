'use client'

import { useState } from 'react'
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  DollarSign,
  User,
  MapPin,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import type { MaintenanceWithRelations } from './actions'

const statusBadges: Record<string, { label: string; class: string }> = {
  scheduled: { label: 'Terjadwal', class: 'badge-yellow' },
  in_progress: { label: 'Dikerjakan', class: 'badge-blue' },
  completed: { label: 'Selesai', class: 'badge-green' },
  overdue: { label: 'Jatuh Tempo', class: 'badge-red' },
}

const typeLabels: Record<string, { label: string }> = {
  preventive: { label: 'Perawatan Rutin' },
  corrective: { label: 'Perbaikan Kerusakan' },
  predictive: { label: 'Pemeriksaan Berkala' },
}

export default function MaintenanceListClient({
  initialList,
  metrics,
}: {
  initialList: MaintenanceWithRelations[]
  metrics: {
    scheduled: number
    inProgress: number
    completed: number
    overdue: number
    totalCost: number
    total: number
  }
}) {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedType, setSelectedType] = useState('')

  const filteredList = initialList.filter((item) => {
    const matchSearch =
      !search ||
      item.asset?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.asset?.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      item.notes?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !selectedStatus || item.status === selectedStatus
    const matchType = !selectedType || item.maintenance_type === selectedType
    return matchSearch && matchStatus && matchType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Pemeliharaan & Work Order Aset</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen perawatan rutin preventif, tiket kerusakan korektif, dan pencatatan biaya servis.
          </p>
        </div>

        <Link
          href="/dashboard/maintenance/new"
          className="btn-primary flex items-center gap-2 self-start"
          id="btn-create-maintenance"
        >
          <Plus className="w-4 h-4" /> Buat Tiket / Jadwal Servis
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 border-l-4 border-l-amber-500 bg-white">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Terjadwal
          </p>
          <p className="text-xl font-extrabold text-slate-900 mt-0.5">{metrics.scheduled}</p>
          <span className="text-[10px] text-slate-400">Menunggu pengerjaan</span>
        </div>

        <div className="card p-4 border-l-4 border-l-rose-500 bg-white">
          <p className="text-[11px] text-rose-600 uppercase tracking-wider font-semibold">
            Jatuh Tempo (Overdue)
          </p>
          <p className="text-xl font-extrabold text-rose-600 mt-0.5">{metrics.overdue}</p>
          <span className="text-[10px] text-slate-400">Perlu tindakan segera</span>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-500 bg-white">
          <p className="text-[11px] text-emerald-600 uppercase tracking-wider font-semibold">
            Selesai Diperbaiki
          </p>
          <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{metrics.completed}</p>
          <span className="text-[10px] text-slate-400">Riwayat tuntas</span>
        </div>

        <div className="card p-4 border-l-4 border-l-brand-600 bg-white">
          <p className="text-[11px] text-brand-600 uppercase tracking-wider font-semibold">
            Total Biaya Servis
          </p>
          <p className="text-lg font-extrabold text-slate-900 mt-0.5 truncate">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(metrics.totalCost)}
          </p>
          <span className="text-[10px] text-slate-400">Akumulasi biaya pemeliharaan</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3.5 bg-slate-50/80 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama aset, kode AMB, atau keluhan teknis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 flex-1 sm:flex-none"
          >
            <option value="">Semua Status</option>
            <option value="scheduled">Terjadwal</option>
            <option value="in_progress">Dikerjakan</option>
            <option value="completed">Selesai</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 flex-1 sm:flex-none"
          >
            <option value="">Semua Tipe</option>
            <option value="corrective">Perbaikan Kerusakan</option>
            <option value="preventive">Perawatan Rutin</option>
            <option value="predictive">Pemeriksaan Berkala</option>
          </select>
        </div>
      </div>

      {/* Maintenance Cards List */}
      <div className="card overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Tidak ada tiket pemeliharaan yang cocok.</p>
            <p className="mt-1">Buat jadwal baru atau ubah filter pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const statusObj = statusBadges[item.status] || {
                label: item.status,
                class: 'badge-slate',
              }
              const typeObj = typeLabels[item.maintenance_type] || {
                label: item.maintenance_type,
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
                      {item.notes?.includes('[Tiket Aduan QR:') && (
                        <span className="inline-flex items-center text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md">
                          Aduan QR Lapangan
                        </span>
                      )}
                      {item.notes?.includes('DARURAT') && (
                        <span className="inline-flex items-center text-[11px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-md">
                          KRITIS / URGENT
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 leading-snug">
                      {item.asset?.name}
                    </h3>

                    {item.notes && (
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 mt-1">
                        <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed whitespace-pre-line">
                          {item.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {item.asset?.business_unit?.name}
                      </span>
                      {item.asset?.current_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {item.asset.current_location.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Jadwal: {item.scheduled_date || '—'}
                      </span>
                      {item.technician && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-500" />
                          Teknisi: {item.technician.full_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 block">Biaya</span>
                      <span className="text-xs font-bold text-slate-900">
                        {item.cost
                          ? new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              maximumFractionDigits: 0,
                            }).format(item.cost)
                          : 'Rp 0'}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/maintenance/${item.id}`}
                      className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3"
                    >
                      Buka Work Order <ArrowRight className="w-3 h-3" />
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
