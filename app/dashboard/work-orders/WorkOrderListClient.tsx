'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  Search,
  Plus,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  Wrench,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Flame,
} from 'lucide-react'
import type {
  PaginatedResult,
  WorkOrderWithRelations,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderMaintenanceType,
  Vendor,
} from '@/types'
import { getWorkOrders, type WorkOrderFilters } from './actions'

interface Props {
  initialData: PaginatedResult<WorkOrderWithRelations>
  vendors: Vendor[]
}

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Menunggu Persetujuan', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  approved: { label: 'Disetujui', color: 'text-charcoal', bg: 'bg-pale-100 border-cloud-200' },
  in_progress: { label: 'Dalam Pengerjaan', color: 'text-charcoal', bg: 'bg-pale-100 border-cloud-200' },
  on_hold: { label: 'Ditunda / On Hold', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  completed: { label: 'Selesai', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  rejected: { label: 'Ditolak', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  cancelled: { label: 'Dibatalkan', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' },
}

const PRIORITY_CONFIG: Record<WorkOrderPriority, { label: string; badge: string; icon?: boolean }> = {
  emergency: { label: 'EMERGENCY', badge: 'bg-red-500 text-white font-bold animate-pulse', icon: true },
  high: { label: 'Tinggi', badge: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' },
  medium: { label: 'Sedang', badge: 'bg-amber-50 text-amber-700 border-amber-200 font-medium' },
  low: { label: 'Rendah', badge: 'bg-slate-50 text-slate-600 border-slate-200' },
}

const TYPE_CONFIG: Record<string, { label: string }> = {
  preventive: { label: 'Preventif (Rutin)' },
  corrective: { label: 'Korektif (Perbaikan)' },
  emergency: { label: 'Darurat (Kerusakan)' },
  inspection: { label: 'Inspeksi Fisik' },
  predictive: { label: 'Prediktif (Sensor/AI)' },
}

function formatRupiah(n?: number | null) {
  if (n == null || n === 0) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function WorkOrderListClient({ initialData, vendors }: Props) {
  const [data, setData] = useState<PaginatedResult<WorkOrderWithRelations>>(initialData)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [isPending, startTransition] = useTransition()

  function refreshList(override: Partial<WorkOrderFilters> = {}) {
    startTransition(async () => {
      const filters: WorkOrderFilters = {
        search: override.search !== undefined ? override.search : search,
        status: override.status !== undefined ? override.status : statusFilter,
        priority: override.priority !== undefined ? override.priority : priorityFilter,
        maintenanceType: override.maintenanceType !== undefined ? override.maintenanceType : typeFilter,
        vendorId: override.vendorId !== undefined ? override.vendorId : vendorFilter,
        page: override.page !== undefined ? override.page : data.meta.page,
        pageSize: 20,
      }
      const res = await getWorkOrders(filters)
      setData(res)
    })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    refreshList({ page: 1 })
  }

  // Summary counters
  const totalCount = data.meta.total
  const inProgressCount = data.data.filter((w) => w.status === 'in_progress').length
  const pendingCount = data.data.filter((w) => w.status === 'pending').length
  const urgentCount = data.data.filter((w) => ['emergency', 'high'].includes(w.priority)).length
  const totalCostSum = data.data.reduce((acc, w) => acc + (w.total_cost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Work Order</p>
            <p className="text-xl font-bold text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-pale-100 flex items-center justify-center text-charcoal">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Sedang Berjalan</p>
            <p className="text-xl font-bold text-charcoal">{inProgressCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Menunggu Approval</p>
            <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Prioritas Tinggi/Darurat</p>
            <p className="text-xl font-bold text-rose-700">{urgentCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Biaya WO</p>
            <p className="text-sm font-bold text-emerald-700 truncate">
              {formatRupiah(totalCostSum)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No. WO, nama masalah, aset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-sm w-full"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              refreshList({ status: e.target.value, page: 1 })
            }}
            className="input text-xs py-2 px-3"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Persetujuan</option>
            <option value="approved">Disetujui</option>
            <option value="in_progress">Dalam Pengerjaan</option>
            <option value="on_hold">Ditunda (On Hold)</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value)
              refreshList({ priority: e.target.value, page: 1 })
            }}
            className="input text-xs py-2 px-3"
          >
            <option value="all">Semua Prioritas</option>
            <option value="emergency">Emergency / Darurat</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              refreshList({ maintenanceType: e.target.value, page: 1 })
            }}
            className="input text-xs py-2 px-3"
          >
            <option value="all">Semua Tipe</option>
            <option value="corrective">Korektif (Perbaikan)</option>
            <option value="preventive">Preventif (Rutin)</option>
            <option value="emergency">Emergency (Darurat)</option>
            <option value="inspection">Inspeksi Fisik</option>
          </select>

          {/* Vendor Filter */}
          <select
            value={vendorFilter}
            onChange={(e) => {
              setVendorFilter(e.target.value)
              refreshList({ vendorId: e.target.value, page: 1 })
            }}
            className="input text-xs py-2 px-3 max-w-[160px]"
          >
            <option value="all">Semua Rekanan</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          {/* Create Button */}
          <Link
            href="/dashboard/work-orders/new"
            className="btn btn-primary text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Buat WO Baru</span>
          </Link>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">No. WO</th>
                <th className="py-3.5 px-4">Aset Terkait</th>
                <th className="py-3.5 px-4">Perbaikan & Tipe</th>
                <th className="py-3.5 px-4 text-center">Prioritas</th>
                <th className="py-3.5 px-4">Pelaksana / Vendor</th>
                <th className="py-3.5 px-4 text-center">Target SLA</th>
                <th className="py-3.5 px-4 text-right">Biaya</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Belum ada Work Order yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                data.data.map((wo) => {
                  const statusInfo = STATUS_CONFIG[wo.status] || STATUS_CONFIG.pending
                  const prioInfo = PRIORITY_CONFIG[wo.priority] || PRIORITY_CONFIG.medium
                  const typeInfo = TYPE_CONFIG[wo.maintenance_type] || { label: wo.maintenance_type }

                  return (
                    <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-semibold text-brand-700">
                        <Link
                          href={`/dashboard/work-orders/${wo.id}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          {wo.wo_number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {wo.asset?.name || 'Aset Tidak Ditemukan'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {wo.asset?.asset_code} • {wo.asset?.business_unit?.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 text-xs line-clamp-1">
                          {wo.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {typeInfo.label}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${prioInfo.badge}`}
                        >
                          {prioInfo.icon && <Flame className="w-3 h-3" />}
                          {prioInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {wo.vendor ? (
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <Truck className="w-3.5 h-3.5 text-blue-500" />
                            <span className="truncate max-w-[130px]">{wo.vendor.name}</span>
                          </div>
                        ) : wo.assigned_user ? (
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[130px]">{wo.assigned_user.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum Ditugaskan</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center text-xs">
                        <div className="font-medium text-slate-700">
                          {wo.sla_target_hours ? `${wo.sla_target_hours} jam` : '-'}
                        </div>
                        {wo.actual_hours && (
                          <div className="text-[10px] text-slate-400">
                            Aktual: {wo.actual_hours} jam
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right text-xs font-medium text-slate-900 font-mono">
                        {formatRupiah(wo.total_cost)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.bg} ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <Link
                          href={`/dashboard/work-orders/${wo.id}`}
                          className="btn btn-ghost text-xs p-1.5 text-brand-600 hover:text-brand-700"
                        >
                          Detail
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            <div>
              Menampilkan {((data.meta.page - 1) * data.meta.pageSize) + 1} -{' '}
              {Math.min(data.meta.page * data.meta.pageSize, data.meta.total)} dari {data.meta.total} Work Order
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={data.meta.page <= 1 || isPending}
                onClick={() => refreshList({ page: data.meta.page - 1 })}
                className="btn btn-ghost p-1.5 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-slate-700">
                Halaman {data.meta.page} dari {data.meta.totalPages}
              </span>
              <button
                disabled={data.meta.page >= data.meta.totalPages || isPending}
                onClick={() => refreshList({ page: data.meta.page + 1 })}
                className="btn btn-ghost p-1.5 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
