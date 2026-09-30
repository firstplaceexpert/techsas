'use client'

import { useState, useTransition } from 'react'
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Database,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import type { AuditLogWithUser, PaginatedResult } from '@/types'
import { getAuditLogs, type AuditLogFilters } from './actions'

interface Props {
  initialData: PaginatedResult<AuditLogWithUser>
}

const ACTION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  create: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'CREATE' },
  update: { bg: 'bg-pale-100 text-charcoal border-cloud-200', text: 'text-charcoal', label: 'UPDATE' },
  delete: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'DELETE' },
  approve: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'APPROVE' },
  reject: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700', label: 'REJECT' },
  login: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', label: 'LOGIN' },
  export: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', text: 'text-cyan-700', label: 'EXPORT' },
}

const TABLE_LABELS: Record<string, string> = {
  assets: 'Aset',
  asset_categories: 'Kategori',
  business_units: 'Unit Bisnis',
  locations: 'Lokasi',
  asset_maintenance: 'Maintenance',
  work_orders: 'Work Order',
  work_order_parts: 'Spare Part WO',
  work_order_comments: 'Komentar WO',
  vendors: 'Vendor',
  disposal_requests: 'Disposal',
  stock_opname_schedules: 'Stock Opname',
  profiles: 'User',
}

export default function AuditLogClient({ initialData }: Props) {
  const [data, setData] = useState<PaginatedResult<AuditLogWithUser>>(initialData)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [tableFilter, setTableFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null)
  const [isPending, startTransition] = useTransition()

  function refreshLogs(override: Partial<AuditLogFilters> = {}) {
    startTransition(async () => {
      const filters: AuditLogFilters = {
        search: override.search !== undefined ? override.search : search,
        action: override.action !== undefined ? override.action : actionFilter,
        tableName: override.tableName !== undefined ? override.tableName : tableFilter,
        page: override.page !== undefined ? override.page : data.meta.page,
        pageSize: 25,
      }
      const res = await getAuditLogs(filters)
      setData(res)
    })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    refreshLogs({ page: 1 })
  }

  function handleActionChange(val: string) {
    setActionFilter(val)
    refreshLogs({ action: val, page: 1 })
  }

  function handleTableChange(val: string) {
    setTableFilter(val)
    refreshLogs({ tableName: val, page: 1 })
  }

  function handlePageChange(newPage: number) {
    refreshLogs({ page: newPage })
  }

  function handleExportCsv() {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Table', 'Record ID', 'Description', 'IP Address']
    const rows = data.data.map((l) => [
      new Date(l.created_at).toLocaleString('id-ID'),
      l.user_name || l.user?.full_name || 'System',
      l.user?.role || '-',
      l.action.toUpperCase(),
      TABLE_LABELS[l.table_name] || l.table_name,
      l.record_id || '-',
      l.description || '-',
      l.ip_address || '-',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows]
        .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Summary counts from current page or sample
  const totalCount = data.meta.total
  const createCount = data.data.filter((d) => d.action === 'create').length
  const updateCount = data.data.filter((d) => d.action === 'update').length
  const deleteCount = data.data.filter((d) => d.action === 'delete').length

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Aktivitas</p>
            <p className="text-xl font-bold text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Data Baru Dibuat</p>
            <p className="text-xl font-bold text-emerald-700">{createCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-pale-100 flex items-center justify-center text-charcoal">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Data Diperbarui</p>
            <p className="text-xl font-bold text-charcoal">{updateCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Data Dihapus / Dihentikan</p>
            <p className="text-xl font-bold text-rose-700">{deleteCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari user, deskripsi, ID catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-sm w-full"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => handleActionChange(e.target.value)}
            className="input text-sm py-2 px-3"
          >
            <option value="all">Semua Aksi</option>
            <option value="create">Create (Tambah)</option>
            <option value="update">Update (Ubah)</option>
            <option value="delete">Delete (Hapus)</option>
            <option value="approve">Approve (Setuju)</option>
            <option value="reject">Reject (Tolak)</option>
            <option value="login">Login</option>
            <option value="export">Export</option>
          </select>

          {/* Table Filter */}
          <select
            value={tableFilter}
            onChange={(e) => handleTableChange(e.target.value)}
            className="input text-sm py-2 px-3"
          >
            <option value="all">Semua Modul</option>
            <option value="assets">Aset</option>
            <option value="work_orders">Work Order</option>
            <option value="asset_maintenance">Maintenance</option>
            <option value="vendors">Vendor</option>
            <option value="disposal_requests">Disposal</option>
            <option value="stock_opname_schedules">Stock Opname</option>
            <option value="profiles">User / Akun</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportCsv}
            className="btn btn-secondary text-sm flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Aksi</th>
                <th className="py-3.5 px-4">Modul / Tabel</th>
                <th className="py-3.5 px-4">Deskripsi Aktivitas</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Belum ada rekaman audit log yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                data.data.map((log) => {
                  const colorConfig = ACTION_COLORS[log.action] || {
                    bg: 'bg-slate-50 text-slate-700 border-slate-200',
                    text: 'text-slate-700',
                    label: log.action.toUpperCase(),
                  }
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-xs sm:text-sm">
                          {log.user_name || log.user?.full_name || 'System'}
                        </div>
                        {log.user?.role && (
                          <div className="text-[11px] text-slate-400 capitalize">
                            {log.user.role.replace('_', ' ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colorConfig.bg}`}
                        >
                          {colorConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <Database className="w-3.5 h-3.5 text-slate-400" />
                          {TABLE_LABELS[log.table_name] || log.table_name}
                        </span>
                        {log.record_id && (
                          <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                            {log.record_id}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 max-w-xs">
                        <p className="line-clamp-2">{log.description || '-'}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-400">
                        {log.ip_address || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        {(log.old_data || log.new_data) ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Lihat Data JSON Perubahan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            <div>
              Menampilkan {((data.meta.page - 1) * data.meta.pageSize) + 1} -{' '}
              {Math.min(data.meta.page * data.meta.pageSize, data.meta.total)} dari {data.meta.total} aktivitas
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={data.meta.page <= 1 || isPending}
                onClick={() => handlePageChange(data.meta.page - 1)}
                className="btn btn-ghost p-1.5 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-slate-700">
                Halaman {data.meta.page} dari {data.meta.totalPages}
              </span>
              <button
                disabled={data.meta.page >= data.meta.totalPages || isPending}
                onClick={() => handlePageChange(data.meta.page + 1)}
                className="btn btn-ghost p-1.5 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Diff / Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Detail Perubahan Data (Audit Trail)
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedLog.table_name} • {selectedLog.action.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl">
                <div>
                  <span className="text-slate-400 block mb-0.5">Pengguna</span>
                  <span className="font-medium text-slate-800">
                    {selectedLog.user_name || selectedLog.user?.full_name || 'System'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Waktu</span>
                  <span className="font-medium text-slate-800 font-mono">
                    {new Date(selectedLog.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-0.5">Deskripsi</span>
                  <span className="text-slate-700 font-medium">
                    {selectedLog.description || '-'}
                  </span>
                </div>
              </div>

              {/* Data Diff Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLog.old_data && (
                  <div>
                    <h4 className="font-semibold text-rose-700 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Data Sebelumnya (Old Data)
                    </h4>
                    <pre className="p-3 bg-rose-50/50 border border-rose-100 text-rose-900 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_data && (
                  <div className={selectedLog.old_data ? '' : 'col-span-2'}>
                    <h4 className="font-semibold text-emerald-700 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Data Baru (New Data)
                    </h4>
                    <pre className="p-3 bg-emerald-50/50 border border-emerald-100 text-emerald-900 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setSelectedLog(null)}
                className="btn btn-secondary text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
