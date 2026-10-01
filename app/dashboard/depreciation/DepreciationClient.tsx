'use client'

import { useState, useTransition } from 'react'
import {
  TrendingDown,
  Calculator,
  Play,
  Calendar,
  Printer,
  CheckCircle2,
  Filter,
  Search,
  BookOpen,
  FileSpreadsheet,
  Layers,
  Copy,
  Check,
  Download,
  AlertCircle,
  HelpCircle,
  Building2,
  Sparkles,
  ArrowRight,
  ReceiptText,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import {
  runBatchMonthlyDepreciation,
  getMonthlyAccountingJournal,
  getAccountingSpreadsheetData,
  type DepreciationLogItem,
  type AccountingJournalResult,
  type JournalEntryLine,
  type RollForwardCategoryItem,
} from './actions'
import { exportAccountingExcelWorkbook } from '@/lib/utils/accounting-spreadsheet'
import type { BusinessUnit } from '@/types'

function formatRupiah(n?: number | null) {
  if (n == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function DepreciationClient({
  initialLogs,
  metrics,
  businessUnits,
  initialJournal,
}: {
  initialLogs: DepreciationLogItem[]
  metrics: {
    totalAcquisition: number
    totalBookValue: number
    totalAccumulatedDepreciation: number
    totalAssets: number
  }
  businessUnits: BusinessUnit[]
  initialJournal: AccountingJournalResult
}) {
  const currentMonthStr = new Date().toISOString().slice(0, 7) // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState(initialJournal.periodMonth || currentMonthStr)
  const [selectedUnit, setSelectedUnit] = useState('')
  const [activeTab, setActiveTab] = useState<'journal' | 'roll_forward' | 'logs'>('journal')
  const [journalData, setJournalData] = useState<AccountingJournalResult>(initialJournal)
  const [isPending, startTransition] = useTransition()

  // Logs & Batch runner state
  const [search, setSearch] = useState('')
  const [running, setRunning] = useState(false)
  const [batchResult, setBatchResult] = useState<{
    processedCount: number
    totalDepreciated: number
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  const handleDownloadAccountingExcel = async () => {
    try {
      setExportingExcel(true)
      const data = await getAccountingSpreadsheetData(selectedMonth, selectedUnit || undefined)
      exportAccountingExcelWorkbook(data)
    } catch (err: any) {
      alert('Gagal mengekspor buku kerja Excel: ' + (err?.message || err))
    } finally {
      setExportingExcel(false)
    }
  }

  // Handle period or business unit change to re-generate journal & roll-forward
  const handleFilterUpdate = (newMonth: string, newUnit: string) => {
    setSelectedMonth(newMonth)
    setSelectedUnit(newUnit)
    startTransition(async () => {
      const res = await getMonthlyAccountingJournal(newMonth, newUnit || undefined)
      setJournalData(res)
    })
  }

  const handleRunBatch = async () => {
    if (
      !confirm(
        `Jalankan perhitungan dan pembukuan penyusutan otomatis untuk periode ${selectedMonth} ${
          selectedUnit ? `pada unit terpilih` : 'seluruh unit bisnis'
        }?`
      )
    )
      return

    setRunning(true)
    setBatchResult(null)

    const res = await runBatchMonthlyDepreciation(
      selectedMonth,
      selectedUnit || undefined
    )
    setRunning(false)

    if (res.success) {
      setBatchResult(res.data)
      // Refresh journal after running batch
      const updatedJ = await getMonthlyAccountingJournal(selectedMonth, selectedUnit || undefined)
      setJournalData(updatedJ)
    } else {
      alert(res.error)
    }
  }

  // Copy Journal to clipboard in TSV format (ready to paste into Excel)
  const handleCopyForExcel = () => {
    if (!journalData.lines || journalData.lines.length === 0) return

    const header = ['Tanggal', 'No. Bukti Memorial', 'Kode Akun', 'Nama Akun', 'Cost Center / Unit', 'Debit', 'Kredit', 'Keterangan'].join('\t')
    const rows = journalData.lines.map((l) =>
      [
        l.date,
        l.voucherNo,
        l.accountCode,
        l.accountName,
        l.costCenter,
        l.debit,
        l.credit,
        l.memo,
      ].join('\t')
    )

    const fullTsv = [header, ...rows].join('\n')
    navigator.clipboard.writeText(fullTsv).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // Download Journal as CSV (Multi-ERP Compatible)
  const handleDownloadJournalCSV = () => {
    if (!journalData.lines || journalData.lines.length === 0) return

    const headers = ['Tanggal', 'No Bukti', 'Kode Akun', 'Nama Akun', 'Cost Center', 'Debit', 'Kredit', 'Keterangan']
    const csvRows = journalData.lines.map((l) => [
      `"${l.date}"`,
      `"${l.voucherNo}"`,
      `"${l.accountCode}"`,
      `"${l.accountName.replace(/"/g, '""')}"`,
      `"${l.costCenter.replace(/"/g, '""')}"`,
      l.debit,
      l.credit,
      `"${l.memo.replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Jurnal_Penyusutan_${selectedMonth}_${selectedUnit ? 'Unit' : 'All'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download Roll-Forward Schedule as CSV
  const handleDownloadRollForwardCSV = () => {
    if (!journalData.rollForward || journalData.rollForward.length === 0) return

    const headers = [
      'Kelompok Kategori Aset',
      'Jumlah Unit',
      'Harga Perolehan Awal',
      'Penambahan (Capex)',
      'Pelepasan (Disposal)',
      'Harga Perolehan Akhir',
      'Akumulasi Penyusutan Awal',
      'Beban Penyusutan Bulan Ini',
      'Pelepasan Akumulasi',
      'Akumulasi Penyusutan Akhir',
      'Nilai Buku Bersih (NBV)',
    ]

    const csvRows = journalData.rollForward.map((rf) => [
      `"${rf.categoryName.replace(/"/g, '""')}"`,
      rf.assetCount,
      rf.beginningGross,
      rf.additions,
      rf.disposals,
      rf.endingGross,
      rf.beginningAccumDeprec,
      rf.monthlyDeprec,
      rf.disposalAccumDeprec,
      rf.endingAccumDeprec,
      rf.netBookValue,
    ])

    const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Mutasi_Aset_Tetap_RollForward_${selectedMonth}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredLogs = initialLogs.filter((log) => {
    const matchSearch =
      !search ||
      log.asset?.name.toLowerCase().includes(search.toLowerCase()) ||
      log.asset?.asset_code.toLowerCase().includes(search.toLowerCase())
    const matchUnit = !selectedUnit || log.asset?.business_unit?.id === selectedUnit
    return matchSearch && matchUnit
  })

  // Roll-Forward totals calculation
  const rollForwardTotals = journalData.rollForward.reduce(
    (acc, item) => ({
      assetCount: acc.assetCount + item.assetCount,
      beginningGross: acc.beginningGross + item.beginningGross,
      additions: acc.additions + item.additions,
      disposals: acc.disposals + item.disposals,
      endingGross: acc.endingGross + item.endingGross,
      beginningAccumDeprec: acc.beginningAccumDeprec + item.beginningAccumDeprec,
      monthlyDeprec: acc.monthlyDeprec + item.monthlyDeprec,
      endingAccumDeprec: acc.endingAccumDeprec + item.endingAccumDeprec,
      netBookValue: acc.netBookValue + item.netBookValue,
    }),
    {
      assetCount: 0,
      beginningGross: 0,
      additions: 0,
      disposals: 0,
      endingGross: 0,
      beginningAccumDeprec: 0,
      monthlyDeprec: 0,
      endingAccumDeprec: 0,
      netBookValue: 0,
    }
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Modul Akuntansi & Penyusutan Aset</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Double-Entry ERP Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Otomasi penjurnalan debit/kredit, rekonsiliasi mutasi aset tetap, dan sinkronisasi laporan keuangan (SAP, Accurate, Jurnal.id, Excel).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleDownloadAccountingExcel}
            disabled={exportingExcel}
            className="h-10 px-4 min-w-[210px] text-xs flex items-center justify-center gap-2 shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-all"
            title="Unduh Buku Kerja Excel (.xlsx) Lengkap 4-Sheet untuk Tim Akuntansi & Auditor"
          >
            {exportingExcel ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                <span>Menyiapkan Excel...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Unduh Rekap Akuntansi (.xlsx)</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="h-10 px-4 min-w-[210px] btn-secondary text-xs flex items-center justify-center gap-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition-all font-semibold"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Bukti Memorial</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-brand-600 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Harga Perolehan (Capex)
            </p>
            <span className="text-[10px] px-2 py-0.5 bg-brand-50 text-brand-700 font-bold rounded-md">
              Neraca Aktiva Tetap
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(metrics.totalAcquisition)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Dari {metrics.totalAssets} unit aset kapitalisasi
          </span>
        </div>

        <div className="card p-5 border-l-4 border-l-rose-500 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Akumulasi Penyusutan
            </p>
            <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md">
              Kontra Aktiva (Kredit)
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">
            {formatRupiah(metrics.totalAccumulatedDepreciation)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Pengurang nilai aset kumulatif
          </span>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-600 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Nilai Buku Bersih (NBV)
            </p>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md">
              Book Value Terkini
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {formatRupiah(metrics.totalBookValue)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Nilai ekonomis bersih seluruh unit bisnis
          </span>
        </div>
      </div>

      {/* Accounting Period & Unit Filter Bar - Signature Brand Black-to-Silver Gradient */}
      <div className="card py-6 px-7 bg-gradient-to-r from-[#0a0c10] via-[#222834] to-[#64748b] text-white shadow-xl border border-slate-600/60 rounded-2xl relative overflow-hidden">
        {/* Soft specular sheen overlay mirroring the brand logo curves */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/25 flex items-center justify-center text-[#AEEB7B] shadow-inner backdrop-blur-md shrink-0">
              <Calendar className="w-6 h-6 text-[#AEEB7B]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Filter Periode Tutup Buku & Unit Bisnis
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#AEEB7B]/20 text-[#AEEB7B] border border-[#AEEB7B]/40 font-mono font-extrabold tracking-wide">
                  REAL-TIME
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Pilih periode pembukuan untuk mengkalkulasi otomatis seluruh voucher memorial jurnal dan mutasi aset UMKM.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2.5 bg-black/45 hover:bg-black/60 border border-white/25 hover:border-white/40 h-11 px-4 rounded-xl backdrop-blur-md transition-all shadow-inner">
              <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Periode:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => handleFilterUpdate(e.target.value, selectedUnit)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2.5 bg-black/45 hover:bg-black/60 border border-white/25 hover:border-white/40 h-11 px-4 rounded-xl backdrop-blur-md transition-all shadow-inner">
              <Building2 className="w-4 h-4 text-[#AEEB7B] shrink-0" />
              <select
                value={selectedUnit}
                onChange={(e) => handleFilterUpdate(selectedMonth, e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white font-medium">Semua Unit Bisnis (Konsolidasi)</option>
                {businessUnits.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white font-medium">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'journal'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span>Voucher Jurnal Akuntansi</span>
          {journalData.isBalanced && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
              BALANCE
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('roll_forward')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'roll_forward'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tabel Mutasi Aset Tetap (Roll-Forward)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
            {journalData.rollForward.length} Kelompok
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Rincian Per Unit & Eksekusi Batch</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
            {filteredLogs.length} Log
          </span>
        </button>
      </div>

      {/* TAB 1: VOUCHER JURNAL AKUNTANSI (DOUBLE ENTRY) */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {/* Header Action Card */}
          <div className="card p-4 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Bukti Memorial Jurnal Umum: {journalData.voucherNo}
                </h2>
                {journalData.isBalanced ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Balance (Debit = Kredit)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5" /> Tidak Balance
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tanggal Pembukuan: <b>{journalData.date}</b> &bull; Periode Akuntansi: <b>{journalData.periodMonth}</b>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyForExcel}
                className={`btn text-xs flex items-center gap-1.5 py-2 px-3 transition-colors ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300'
                }`}
                title="Salin baris jurnal berformat TSV agar langsung rapi saat di-paste ke Microsoft Excel atau Google Sheets"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Tersalin ke Excel!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" /> Salin untuk Excel
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadAccountingExcel}
                disabled={exportingExcel}
                className="text-xs flex items-center gap-1.5 py-2 px-3 shadow-sm bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-all"
                title="Unduh Workbook Excel (.xlsx) Multi-Sheet"
              >
                {exportingExcel ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                )}
                <span>Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleDownloadJournalCSV}
                className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
                title="Unduh CSV standar yang kompatibel diimpor ke SAP, Accurate, Jurnal.id, Zahir"
              >
                <Download className="w-3.5 h-3.5" /> CSV Jurnal (ERP)
              </button>
            </div>
          </div>

          {/* Table of Double-Entry Journal Lines */}
          <div className="card overflow-hidden bg-white border border-slate-200 shadow-xs rounded-xl">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Baris Jurnal Umum (Format Tradisional Debit & Kredit Selang-Seling)
                </span>
                <span className="text-[11px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                  {journalData.lines.length} Baris Jurnal
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Baris Atas: <b>Debit (Beban)</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  Baris Bawah: <b>Kredit (Akumulasi / Menjorok ke Dalam)</b>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">No. Bukti</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tanggal</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">Kode Akun (CoA)</th>
                    <th className="py-3 px-4 min-w-[280px]">Nama Akun Akuntansi</th>
                    <th className="py-3 px-4 whitespace-nowrap">Cost Center / Unit</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap min-w-[120px]">Debit (Rp)</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap min-w-[120px]">Kredit (Rp)</th>
                    <th className="py-3 px-4 min-w-[200px]">Keterangan Transaksi</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {journalData.lines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">Tidak ada jurnal penyusutan untuk periode ini.</p>
                        <p className="mt-1 text-[11px]">Pastikan ada aset aktif yang memiliki masa manfaat dan nilai perolehan.</p>
                      </td>
                    </tr>
                  ) : (
                    journalData.lines.map((l, index) => {
                      const isCredit = l.credit > 0
                      const isEvenVoucher = Math.floor(index / 2) % 2 === 0
                      // Border separates transaction pairs
                      const isLastOfPair = index % 2 === 1 || index === journalData.lines.length - 1

                      return (
                        <tr
                          key={l.id}
                          className={`${isEvenVoucher ? 'bg-white' : 'bg-slate-50/40'} ${
                            isLastOfPair ? 'border-b-2 border-slate-200/80' : 'border-b border-slate-100'
                          } hover:bg-emerald-50/30 transition-colors`}
                        >
                          {/* Voucher No */}
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                            {l.voucherNo}
                          </td>

                          {/* Date */}
                          <td className="py-2.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                            {l.date}
                          </td>

                          {/* CoA Code: PURE ONE LINE - NEVER WRAPS */}
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-md whitespace-nowrap shadow-2xs ${
                                isCredit
                                  ? 'bg-slate-100 border border-slate-300 text-slate-700'
                                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                              }`}
                            >
                              {l.accountCode}
                            </span>
                          </td>

                          {/* Account Name */}
                          <td className="py-2.5 px-4">
                            {isCredit ? (
                              <div className="pl-6 flex items-center gap-1.5 text-slate-600 font-medium">
                                <span className="text-slate-400 font-mono select-none">↳</span>
                                <span className="font-semibold text-slate-700">{l.accountName}</span>
                              </div>
                            ) : (
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                <span>{l.accountName}</span>
                              </div>
                            )}
                          </td>

                          {/* Cost Center */}
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{l.costCenter}</span>
                            </span>
                          </td>

                          {/* Debit Amount */}
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {l.debit > 0 ? (
                              <span className="text-emerald-700 font-black">{formatRupiah(l.debit)}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Credit Amount */}
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {l.credit > 0 ? (
                              <span className="text-slate-800 font-black">{formatRupiah(l.credit)}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Memo */}
                          <td className="py-2.5 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={l.memo}>
                            {l.memo}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {journalData.lines.length > 0 && (
                  <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                    <tr>
                      <td colSpan={5} className="py-3.5 px-4 text-right uppercase tracking-wider text-slate-700">
                        Total Jurnal Memorial ({journalData.lines.length} Baris):
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700 text-sm font-black whitespace-nowrap">
                        {formatRupiah(journalData.totalDebit)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700 text-sm font-black whitespace-nowrap">
                        {formatRupiah(journalData.totalCredit)}
                      </td>
                      <td className="py-3.5 px-4">
                        {journalData.isBalanced ? (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                            <Check className="w-3.5 h-3.5" /> BALANCED
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 w-fit">
                            <AlertCircle className="w-3.5 h-3.5" /> SELISIH Rp {Math.abs(journalData.totalDebit - journalData.totalCredit).toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Educational Note & Accounting Principle Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4 bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Mekanisme Capex vs Opex (Barang Habis Pakai / BBM Genset)</span>
              </div>
              <p className="text-amber-800/90 leading-relaxed text-[11px]">
                Aset fisik seperti <b>Genset, Kendaraan Operasional, atau Chiller</b> dicatat sebagai <b>Capex (Aktiva Tetap)</b> dan disusutkan melalui jurnal di atas.
                Adapun bahan habis pakai seperti <b>BBM Solar, Oli Mesin, dan Freon AC</b> tidak menambah harga perolehan aset, melainkan dicatat langsung sebagai <b>Beban Operasional (Opex)</b> pada menu <b>Surat Perintah Kerja (Work Orders)</b> dengan tag kode aset terkait.
              </p>
            </div>

            <div className="card p-4 bg-brand-50/70 border border-brand-200 text-brand-950 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-brand-900">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Panduan Integrasi ke Software Akuntansi (ERP)</span>
              </div>
              <p className="text-brand-900/90 leading-relaxed text-[11px]">
                Gunakan tombol <b>&quot;Salin untuk Excel&quot;</b> untuk mem-paste langsung ke template jurnal umum Microsoft Excel atau Google Sheets. Atau klik <b>&quot;Unduh CSV Jurnal&quot;</b> untuk diimpor langsung ke sistem ERP perusahaan (seperti <i>SAP Business One, Accurate Online, Jurnal.id by Mekari, Zahir</i>) tanpa perlu input ulang manual satu per satu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TABEL MUTASI ASET TETAP (ROLL-FORWARD SCHEDULE) */}
      {activeTab === 'roll_forward' && (
        <div className="space-y-4">
          <div className="card p-4 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tabel Mutasi Aset Tetap (Fixed Asset Roll-Forward Schedule)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pergerakan aset per kelompok kategori untuk rekonsiliasi audit, laporan keuangan tahunan, dan lampiran SPT Pajak Penghasilan (Penyusutan Fiskal).
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleDownloadAccountingExcel}
                disabled={exportingExcel}
                className="text-xs flex items-center gap-1.5 py-2 px-3 shadow-sm bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-all"
                title="Unduh Tabel Mutasi dalam Format Excel (.xlsx) Lengkap"
              >
                {exportingExcel ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                )}
                <span>Excel (.xlsx) Mutasi</span>
              </button>

              <button
                onClick={handleDownloadRollForwardCSV}
                className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
              >
                <Download className="w-3.5 h-3.5" /> CSV Mutasi
              </button>
            </div>
          </div>

          <div className="card overflow-hidden bg-white border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 font-bold">
                      Kelompok Aset
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">
                      Unit
                    </th>
                    <th colSpan={4} className="py-1 px-3 border-r border-slate-200 text-center font-bold bg-slate-100 text-slate-800">
                      Harga Perolehan (Gross Value)
                    </th>
                    <th colSpan={3} className="py-1 px-3 border-r border-slate-200 text-center font-bold bg-rose-50 text-rose-800">
                      Akumulasi Penyusutan
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 text-right font-bold bg-emerald-50 text-emerald-900">
                      Nilai Buku (NBV)
                    </th>
                  </tr>
                  <tr className="border-t border-slate-200 font-semibold text-[10px] text-slate-500">
                    <th className="py-2 px-2 text-right">Saldo Awal</th>
                    <th className="py-2 px-2 text-right">Penambahan</th>
                    <th className="py-2 px-2 text-right">Pelepasan</th>
                    <th className="py-2 px-2 text-right border-r border-slate-200 font-bold text-slate-800">Saldo Akhir</th>
                    <th className="py-2 px-2 text-right">Saldo Awal</th>
                    <th className="py-2 px-2 text-right text-rose-600 font-bold">Penyusutan Bln Ini</th>
                    <th className="py-2 px-2 text-right border-r border-slate-200 font-bold text-rose-700">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {journalData.rollForward.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Belum ada data per kelompok aset.
                      </td>
                    </tr>
                  ) : (
                    journalData.rollForward.map((rf, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                          {rf.categoryName}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-100 font-medium">
                          {rf.assetCount}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                          {formatRupiah(rf.beginningGross)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-emerald-600 font-medium">
                          {rf.additions > 0 ? `+${formatRupiah(rf.additions)}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-rose-600 font-medium">
                          {rf.disposals > 0 ? `-${formatRupiah(rf.disposals)}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 border-r border-slate-100">
                          {formatRupiah(rf.endingGross)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                          {formatRupiah(rf.beginningAccumDeprec)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-600">
                          -{formatRupiah(rf.monthlyDeprec)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-700 border-r border-slate-100">
                          {formatRupiah(rf.endingAccumDeprec)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/40">
                          {formatRupiah(rf.netBookValue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {journalData.rollForward.length > 0 && (
                  <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                    <tr>
                      <td className="py-3 px-3 uppercase tracking-wider border-r border-slate-200">
                        Total Seluruh Kelompok
                      </td>
                      <td className="py-3 px-3 text-center border-r border-slate-200">
                        {rollForwardTotals.assetCount}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {formatRupiah(rollForwardTotals.beginningGross)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-600">
                        {rollForwardTotals.additions > 0 ? formatRupiah(rollForwardTotals.additions) : '-'}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-rose-600">
                        {rollForwardTotals.disposals > 0 ? formatRupiah(rollForwardTotals.disposals) : '-'}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-black border-r border-slate-200">
                        {formatRupiah(rollForwardTotals.endingGross)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {formatRupiah(rollForwardTotals.beginningAccumDeprec)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-rose-600 font-black">
                        -{formatRupiah(rollForwardTotals.monthlyDeprec)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-black text-rose-700 border-r border-slate-200">
                        {formatRupiah(rollForwardTotals.endingAccumDeprec)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm font-black text-emerald-800 bg-emerald-100">
                        {formatRupiah(rollForwardTotals.netBookValue)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RINCIAN PER UNIT & EKSEKUSI BATCH LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Batch Calculation Runner Bar */}
          <div className="card p-5 bg-gradient-to-r from-slate-900 to-brand-950 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-brand-400" />
                  <h3 className="text-sm font-bold text-white">
                    Jalankan Pembukuan Penyusutan Otomatis (Batch Engine)
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Sistem akan memposting log penyusutan untuk seluruh aset aktif ke database dan memperbarui nilai buku terkini.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleRunBatch}
                  disabled={running}
                  className="btn-primary text-xs flex items-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-400 shadow-lg shadow-brand-500/30"
                  id="btn-run-depreciation"
                >
                  {running ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menghitung...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Hitung & Bukukan Penyusutan Periode Ini
                    </>
                  )}
                </button>
              </div>
            </div>

            {batchResult && (
              <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Berhasil membukukan penyusutan untuk <b>{batchResult.processedCount} aset</b> dengan total nominal{' '}
                  <b>{formatRupiah(batchResult.totalDepreciated)}</b>.
                </span>
              </div>
            )}
          </div>

          {/* Depreciation Log History Table */}
          <div className="card overflow-hidden bg-white border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Log Riwayat Penyusutan Terposting ({filteredLogs.length} Catatan)
                </h2>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode atau nama aset..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <TrendingDown className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Belum ada riwayat log penyusutan terposting.</p>
                <p className="mt-1">
                  Jalankan batch perhitungan penyusutan di atas untuk memposting log periode pertama.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Kode Aset</th>
                      <th className="py-3 px-4 font-semibold">Nama Aset</th>
                      <th className="py-3 px-4 font-semibold">Unit Bisnis</th>
                      <th className="py-3 px-4 font-semibold">Periode</th>
                      <th className="py-3 px-4 font-semibold">Metode</th>
                      <th className="py-3 px-4 font-semibold">Penyusutan Periode Ini</th>
                      <th className="py-3 px-4 font-semibold">Nilai Buku Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <Link
                            href={`/dashboard/assets/${log.asset_id}`}
                            className="text-brand-600 hover:underline"
                          >
                            {log.asset?.asset_code}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium">{log.asset?.name}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {log.asset?.business_unit?.name}
                        </td>
                        <td className="py-3 px-4 font-semibold">{log.period_month}</td>
                        <td className="py-3 px-4 capitalize text-slate-500">
                          {log.asset?.depreciation_method?.replace('_', ' ') || 'Straight Line'}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600">
                          -{formatRupiah(log.depreciation_amount)}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">
                          {formatRupiah(log.book_value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Sheet (for Official Hardcopy Voucher Memorial) */}
      <div className="hidden print:block space-y-6 text-black">
        <div className="text-center border-b-2 border-black pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">
            BUKTI MEMORIAL PENYUSUTAN ASET TETAP (JOURNAL VOUCHER)
          </h2>
          <p className="text-sm font-semibold mt-1">
            TECHSAS ASSET HUB &bull; No: {journalData.voucherNo} &bull; Periode: {selectedMonth}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 border border-black">
            <p className="font-bold">Total Nilai Perolehan:</p>
            <p className="text-base font-bold mt-1">{formatRupiah(metrics.totalAcquisition)}</p>
          </div>
          <div className="p-3 border border-black">
            <p className="font-bold">Total Beban Penyusutan:</p>
            <p className="text-base font-bold mt-1">{formatRupiah(journalData.totalDebit)}</p>
          </div>
          <div className="p-3 border border-black">
            <p className="font-bold">Nilai Buku Bersih (NBV):</p>
            <p className="text-base font-bold mt-1">{formatRupiah(metrics.totalBookValue)}</p>
          </div>
        </div>

        <table className="w-full text-[10px] border border-black text-left">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold">
              <th className="p-1 border-r border-black">Kode Akun</th>
              <th className="p-1 border-r border-black">Nama Akun</th>
              <th className="p-1 border-r border-black">Cost Center</th>
              <th className="p-1 border-r border-black text-right">Debit (Rp)</th>
              <th className="p-1 border-r border-black text-right">Kredit (Rp)</th>
              <th className="p-1">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {journalData.lines.map((l) => (
              <tr key={l.id} className="border-b border-slate-300">
                <td className="p-1 border-r border-black font-mono font-bold">{l.accountCode}</td>
                <td className="p-1 border-r border-black">{l.accountName}</td>
                <td className="p-1 border-r border-black">{l.costCenter}</td>
                <td className="p-1 border-r border-black text-right">{l.debit > 0 ? formatRupiah(l.debit) : '-'}</td>
                <td className="p-1 border-r border-black text-right">{l.credit > 0 ? formatRupiah(l.credit) : '-'}</td>
                <td className="p-1">{l.memo}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-bold">
              <td colSpan={3} className="p-1 text-right">TOTAL:</td>
              <td className="p-1 text-right">{formatRupiah(journalData.totalDebit)}</td>
              <td className="p-1 text-right">{formatRupiah(journalData.totalCredit)}</td>
              <td className="p-1">STATUS: BALANCED</td>
            </tr>
          </tfoot>
        </table>

        {/* Signature blocks */}
        <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
          <div>
            <p className="font-semibold">Dibuat Oleh:</p>
            <div className="h-16"></div>
            <p className="font-bold underline">Staff Akuntansi Aset</p>
          </div>
          <div>
            <p className="font-semibold">Diperiksa Oleh:</p>
            <div className="h-16"></div>
            <p className="font-bold underline">Accounting Supervisor</p>
          </div>
          <div>
            <p className="font-semibold">Disetujui Oleh:</p>
            <div className="h-16"></div>
            <p className="font-bold underline">Financial Controller (FC)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
