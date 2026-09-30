'use client'

import { useState } from 'react'
import {
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingDown,
  Wrench,
  Trash2,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  ClipboardList,
  Truck,
  Star,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'
import type { BusinessUnit, AssetCategory } from '@/types'
import { getAccountingSpreadsheetData } from '@/app/dashboard/depreciation/actions'
import { exportAccountingExcelWorkbook } from '@/lib/utils/accounting-spreadsheet'

function formatRupiah(n?: number | null) {
  if (n == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function exportToCsv(filename: string, rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function ReportsClient({
  data,
  businessUnits,
  categories,
}: {
  data: {
    assets: any[]
    locationHistory: any[]
    maintenance: any[]
    depreciationLogs: any[]
    disposals: any[]
    workOrders?: any[]
    vendors?: any[]
  }
  businessUnits: BusinessUnit[]
  categories: AssetCategory[]
}) {
  const [activeTab, setActiveTab] = useState<
    'inventory' | 'mutation' | 'maintenance' | 'depreciation' | 'disposal' | 'work_orders' | 'vendors'
  >('inventory')

  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [conditionFilter, setConditionFilter] = useState('')

  // 1. Filtered Assets for Inventory Report
  const filteredAssets = data.assets.filter((a) => {
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_code.toLowerCase().includes(search.toLowerCase())
    const matchUnit = !unitFilter || a.business_unit?.id === unitFilter
    const matchCategory = !categoryFilter || a.category?.id === categoryFilter
    const matchCondition = !conditionFilter || a.condition === conditionFilter
    return matchSearch && matchUnit && matchCategory && matchCondition
  })

  const [exportingExcel, setExportingExcel] = useState(false)

  const handleDownloadAccountingExcel = async () => {
    setExportingExcel(true)
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7)
      const excelData = await getAccountingSpreadsheetData(currentPeriod, unitFilter || undefined)
      exportAccountingExcelWorkbook(excelData)
    } catch (err: any) {
      alert('Gagal membuat spreadsheet akuntansi: ' + (err?.message || 'Terjadi kesalahan'))
    } finally {
      setExportingExcel(false)
    }
  }

  // Export CSV Handlers
  const handleExportCsv = () => {
    if (activeTab === 'inventory') {
      const rows = [
        ['Kode Aset', 'Nama Aset', 'Unit Bisnis', 'Kategori', 'Lokasi', 'Kondisi', 'Status', 'Harga Perolehan', 'Nilai Buku'],
        ...filteredAssets.map((a) => [
          a.asset_code,
          a.name,
          a.business_unit?.name || '',
          a.category?.name || '',
          a.current_location?.name || '',
          a.condition,
          a.status,
          a.purchase_price || 0,
          a.current_book_value || 0,
        ]),
      ]
      exportToCsv(`Laporan_Inventaris_Aset_${new Date().toISOString().slice(0, 10)}`, rows)
    } else if (activeTab === 'mutation') {
      const rows = [
        ['Waktu Mutasi', 'Kode Aset', 'Nama Aset', 'Unit Bisnis', 'Lokasi Baru', 'Petugas', 'Catatan Alasan'],
        ...data.locationHistory.map((m) => [
          m.moved_at,
          m.asset?.asset_code || '',
          m.asset?.name || '',
          m.asset?.business_unit?.name || '',
          m.location?.name || '',
          m.mover?.full_name || '',
          m.note || '',
        ]),
      ]
      exportToCsv(`Laporan_Mutasi_Lokasi_${new Date().toISOString().slice(0, 10)}`, rows)
    } else if (activeTab === 'maintenance') {
      const rows = [
        ['Kode Aset', 'Nama Aset', 'Unit Bisnis', 'Tipe Servis', 'Status', 'Tgl Jadwal', 'Tgl Selesai', 'Biaya', 'Teknisi', 'Catatan'],
        ...data.maintenance.map((m) => [
          m.asset?.asset_code || '',
          m.asset?.name || '',
          m.asset?.business_unit?.name || '',
          m.maintenance_type,
          m.status,
          m.scheduled_date || '',
          m.completed_date || '',
          m.cost || 0,
          m.technician?.full_name || '',
          m.notes || '',
        ]),
      ]
      exportToCsv(`Laporan_Pemeliharaan_Biaya_${new Date().toISOString().slice(0, 10)}`, rows)
    } else if (activeTab === 'depreciation') {
      const rows = [
        ['Periode Bulan', 'Kode Aset', 'Nama Aset', 'Unit Bisnis', 'Penyusutan Bulanan', 'Nilai Buku Akhir', 'Tgl Hitung'],
        ...data.depreciationLogs.map((d) => [
          d.period_month,
          d.asset?.asset_code || '',
          d.asset?.name || '',
          d.asset?.business_unit?.name || '',
          d.depreciation_amount,
          d.book_value,
          d.calculated_at,
        ]),
      ]
      exportToCsv(`Laporan_Penyusutan_Nilai_Buku_${new Date().toISOString().slice(0, 10)}`, rows)
    } else if (activeTab === 'disposal') {
      const rows = [
        ['Kode Aset', 'Nama Aset', 'Unit Bisnis', 'Metode Disposal', 'Status Approval', 'Nilai Realisasi', 'Gain/Loss', 'Tgl Pelepasan'],
        ...data.disposals.map((d) => [
          d.asset?.asset_code || '',
          d.asset?.name || '',
          d.asset?.business_unit?.name || '',
          d.disposal_type,
          d.approval_status,
          d.sale_price || 0,
          d.gain_loss_amount || 0,
          d.disposed_at || '',
        ]),
      ]
      exportToCsv(`Laporan_Disposal_Pelepasan_${new Date().toISOString().slice(0, 10)}`, rows)
    } else if (activeTab === 'work_orders') {
      const rows = [
        ['No. WO', 'Judul', 'Kode Aset', 'Nama Aset', 'Unit Bisnis', 'Prioritas', 'Status', 'Tipe', 'Target SLA', 'Biaya Jasa', 'Biaya Parts', 'Total Biaya', 'Vendor / Rekanan', 'Tgl Dibuat'],
        ...(data.workOrders || []).map((w: any) => [
          w.wo_number,
          w.title,
          w.asset?.asset_code || '',
          w.asset?.name || '',
          w.asset?.business_unit?.name || '',
          w.priority,
          w.status,
          w.maintenance_type,
          w.sla_target_hours || 0,
          w.labor_cost || 0,
          w.parts_cost || 0,
          w.total_cost || 0,
          w.vendor?.name || 'Internal',
          w.created_at || '',
        ]),
      ]
      exportToCsv(`Laporan_Work_Orders_${new Date().toISOString().slice(0, 10)}`, rows)
    } else if (activeTab === 'vendors') {
      const rows = [
        ['Nama Vendor', 'Kategori', 'PIC', 'Telepon', 'Email', 'Alamat', 'Rating', 'Status'],
        ...(data.vendors || []).map((v: any) => [
          v.name,
          v.category,
          v.contact_person || '',
          v.phone || '',
          v.email || '',
          v.address || '',
          v.rating || 5,
          v.is_active ? 'Aktif' : 'Nonaktif',
        ]),
      ]
      exportToCsv(`Laporan_Mitra_Vendor_${new Date().toISOString().slice(0, 10)}`, rows)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header (Hidden in print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Pusat Laporan & Analitik Komprehensif</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan inventaris, mutasi perpindahan, biaya pemeliharaan, jadwal penyusutan, dan pelepasan aset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAccountingExcel}
            disabled={exportingExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
            id="btn-export-excel"
            title="Download Workbook Excel 4 Sheet (Ringkasan, Mutasi/Roll-Forward, Jurnal GL, Register Aset)"
          >
            {exportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Rekap Akuntansi (.xlsx)
          </button>
          <button
            onClick={handleExportCsv}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2.5"
            id="btn-export-csv"
          >
            <Download className="w-4 h-4" /> Ekspor Spreadsheet (CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="btn-primary text-xs flex items-center gap-1.5 py-2.5"
            id="btn-print-report"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan Resmi
          </button>
        </div>
      </div>

      {/* Report Tabs (Hidden in print) */}
      <div className="print:hidden flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> 1. Inventaris Aset
        </button>

        <button
          onClick={() => setActiveTab('mutation')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'mutation'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> 2. Mutasi & Perpindahan
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'maintenance'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" /> 3. Pemeliharaan & Biaya
        </button>

        <button
          onClick={() => setActiveTab('depreciation')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'depreciation'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" /> 4. Nilai Buku & Depresiasi
        </button>

        <button
          onClick={() => setActiveTab('disposal')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'disposal'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" /> 5. Disposal & Gain-Loss
        </button>

        <button
          onClick={() => setActiveTab('work_orders')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'work_orders'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" /> 6. Work Orders (WO)
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'vendors'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" /> 7. Kinerja Rekanan (Vendor)
        </button>
      </div>

      {/* Tab 1: Inventaris Aset */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="print:hidden card p-3 bg-slate-50/80 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama aset..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="">Semua Unit Bisnis</option>
              {businessUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="">Semua Kondisi</option>
              <option value="good">Baik</option>
              <option value="fair">Cukup</option>
              <option value="damaged">Rusak</option>
              <option value="under_repair">Dalam Perbaikan</option>
            </select>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Kode Aset</th>
                    <th className="py-3 px-4 font-semibold">Nama Aset</th>
                    <th className="py-3 px-4 font-semibold">Unit Bisnis</th>
                    <th className="py-3 px-4 font-semibold">Kategori</th>
                    <th className="py-3 px-4 font-semibold">Lokasi Ruangan</th>
                    <th className="py-3 px-4 font-semibold">Kondisi</th>
                    <th className="py-3 px-4 font-semibold">Harga Perolehan</th>
                    <th className="py-3 px-4 font-semibold">Nilai Buku</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAssets.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {a.asset_code}
                      </td>
                      <td className="py-2.5 px-4 font-medium">{a.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {a.business_unit?.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{a.category?.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {a.current_location?.name || '—'}
                      </td>
                      <td className="py-2.5 px-4 capitalize font-semibold">
                        {a.condition}
                      </td>
                      <td className="py-2.5 px-4 font-medium">
                        {formatRupiah(a.purchase_price)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {formatRupiah(a.current_book_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Mutasi Lokasi */}
      {activeTab === 'mutation' && (
        <div className="card overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Riwayat Log Perpindahan Lokasi Aset ({data.locationHistory.length} Transaksi)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tanggal & Waktu</th>
                  <th className="py-3 px-4 font-semibold">Kode Aset</th>
                  <th className="py-3 px-4 font-semibold">Nama Aset</th>
                  <th className="py-3 px-4 font-semibold">Unit Bisnis</th>
                  <th className="py-3 px-4 font-semibold">Lokasi Baru</th>
                  <th className="py-3 px-4 font-semibold">Petugas</th>
                  <th className="py-3 px-4 font-semibold">Catatan / Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.locationHistory.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(m.moved_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {m.asset?.asset_code}
                    </td>
                    <td className="py-2.5 px-4 font-medium">{m.asset?.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {m.asset?.business_unit?.name}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-rose-600">
                      {m.location?.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {m.mover?.full_name || 'Sistem'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{m.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Pemeliharaan & Biaya */}
      {activeTab === 'maintenance' && (
        <div className="card overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Riwayat Pemeliharaan & Realisasi Biaya ({data.maintenance.length} Tiket)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Kode Aset</th>
                  <th className="py-3 px-4 font-semibold">Nama Aset</th>
                  <th className="py-3 px-4 font-semibold">Unit Bisnis</th>
                  <th className="py-3 px-4 font-semibold">Tipe Perawatan</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Tgl Selesai</th>
                  <th className="py-3 px-4 font-semibold">Biaya Realisasi</th>
                  <th className="py-3 px-4 font-semibold">Teknisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.maintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {m.asset?.asset_code}
                    </td>
                    <td className="py-2.5 px-4 font-medium">{m.asset?.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {m.asset?.business_unit?.name}
                    </td>
                    <td className="py-2.5 px-4 capitalize font-medium">
                      {m.maintenance_type}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="badge text-[10px]">{m.status}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {m.completed_date || m.scheduled_date || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {formatRupiah(m.cost)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {m.technician?.full_name || 'Internal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Nilai Buku & Depresiasi */}
      {activeTab === 'depreciation' && (
        <div className="card overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Log Depresiasi & Penyusutan Fiskal ({data.depreciationLogs.length} Entri)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Periode Bulan</th>
                  <th className="py-3 px-4 font-semibold">Kode Aset</th>
                  <th className="py-3 px-4 font-semibold">Nama Aset</th>
                  <th className="py-3 px-4 font-semibold">Unit Bisnis</th>
                  <th className="py-3 px-4 font-semibold">Penyusutan</th>
                  <th className="py-3 px-4 font-semibold">Nilai Buku Terkini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.depreciationLogs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {d.period_month}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {d.asset?.asset_code}
                    </td>
                    <td className="py-2.5 px-4 font-medium">{d.asset?.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {d.asset?.business_unit?.name}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-rose-600">
                      -{formatRupiah(d.depreciation_amount)}
                    </td>
                    <td className="py-2.5 px-4 font-extrabold text-slate-900">
                      {formatRupiah(d.book_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Disposal & Realisasi */}
      {activeTab === 'disposal' && (
        <div className="card overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Daftar Pelepasan Aset, Penjualan & Realisasi Gain/Loss ({data.disposals.length} Data)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Kode Aset</th>
                  <th className="py-3 px-4 font-semibold">Nama Aset</th>
                  <th className="py-3 px-4 font-semibold">Unit Bisnis</th>
                  <th className="py-3 px-4 font-semibold">Metode</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Nilai Jual / Realisasi</th>
                  <th className="py-3 px-4 font-semibold">Gain / Loss</th>
                  <th className="py-3 px-4 font-semibold">Tgl Pelepasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.disposals.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {d.asset?.asset_code}
                    </td>
                    <td className="py-2.5 px-4 font-medium">{d.asset?.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {d.asset?.business_unit?.name}
                    </td>
                    <td className="py-2.5 px-4 capitalize font-semibold">
                      {d.disposal_type}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="badge text-[10px]">{d.approval_status}</span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {formatRupiah(d.sale_price)}
                    </td>
                    <td
                      className={`py-2.5 px-4 font-bold ${
                        (d.gain_loss_amount || 0) >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {formatRupiah(d.gain_loss_amount)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {d.disposed_at ? new Date(d.disposed_at).toLocaleDateString('id-ID') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Work Orders Report */}
      {activeTab === 'work_orders' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">No. WO</th>
                  <th className="py-2.5 px-4">Judul Perbaikan</th>
                  <th className="py-2.5 px-4">Aset Terkait</th>
                  <th className="py-2.5 px-4">Prioritas</th>
                  <th className="py-2.5 px-4">Pelaksana / Vendor</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Total Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(!data.workOrders || data.workOrders.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada data Work Order.
                    </td>
                  </tr>
                ) : (
                  data.workOrders.map((w: any) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-brand-700">{w.wo_number}</td>
                      <td className="py-2.5 px-4 font-medium">{w.title}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {w.asset?.asset_code} — {w.asset?.name}
                      </td>
                      <td className="py-2.5 px-4 uppercase font-semibold text-[10px]">
                        {w.priority}
                      </td>
                      <td className="py-2.5 px-4">{w.vendor?.name || 'Internal'}</td>
                      <td className="py-2.5 px-4 capitalize">
                        <span className="badge text-[10px]">{w.status}</span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 text-right font-mono">
                        {formatRupiah(w.total_cost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Vendors Report */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Nama Vendor</th>
                  <th className="py-2.5 px-4">Kategori</th>
                  <th className="py-2.5 px-4">Kontak PIC</th>
                  <th className="py-2.5 px-4">Telepon / HP</th>
                  <th className="py-2.5 px-4">Rating</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(!data.vendors || data.vendors.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada data vendor rekanan.
                    </td>
                  </tr>
                ) : (
                  data.vendors.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{v.name}</td>
                      <td className="py-2.5 px-4 capitalize">{v.category?.replace('_', ' ')}</td>
                      <td className="py-2.5 px-4">{v.contact_person || '-'}</td>
                      <td className="py-2.5 px-4 font-mono">{v.phone || '-'}</td>
                      <td className="py-2.5 px-4 font-medium text-amber-700">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 inline" />
                          <span>{v.rating || 5} / 5</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`badge text-[10px] ${v.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {v.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Sheet Layout */}
      <div className="hidden print:block space-y-6 text-black">
        <div className="text-center border-b-2 border-black pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">
            LAPORAN RESMI MANAJEMEN ASET
          </h2>
          <p className="text-sm font-semibold mt-1">
            TECHSAS ASSET HUB YOGYAKARTA
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <table className="w-full text-[10px] border border-black text-left">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold">
              <th className="p-1 border-r border-black">No</th>
              <th className="p-1 border-r border-black">Kode Aset</th>
              <th className="p-1 border-r border-black">Nama Aset</th>
              <th className="p-1 border-r border-black">Unit Bisnis</th>
              <th className="p-1 border-r border-black">Kategori</th>
              <th className="p-1 border-r border-black">Kondisi</th>
              <th className="p-1">Nilai Buku</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.slice(0, 100).map((a, idx) => (
              <tr key={a.id} className="border-b border-slate-300">
                <td className="p-1 border-r border-black">{idx + 1}</td>
                <td className="p-1 border-r border-black font-mono font-bold">{a.asset_code}</td>
                <td className="p-1 border-r border-black">{a.name}</td>
                <td className="p-1 border-r border-black">{a.business_unit?.name}</td>
                <td className="p-1 border-r border-black">{a.category?.name}</td>
                <td className="p-1 border-r border-black capitalize">{a.condition}</td>
                <td className="p-1 font-bold">{formatRupiah(a.current_book_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-12 flex justify-between text-xs text-center">
          <div>
            <p>Dibuat oleh,</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1">
              ( Staff Asset Management )
            </p>
          </div>
          <div>
            <p>Mengetahui / Menyetujui,</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1">
              ( Corporate Asset Director )
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
