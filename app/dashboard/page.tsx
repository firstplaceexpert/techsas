import { getBusinessUnits } from './business-units/actions'
import { Suspense } from 'react'
import {
  Box,
  Building2,
  CheckCircle,
  TrendingUp,
  Camera,
  Printer,
  ClipboardCheck,
  Wrench,
  TrendingDown,
  Trash2,
  FileText,
  AlertTriangle,
  Clock,
  ArrowRight,
  DollarSign,
  ArrowUpRight,
  Layers,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAssetStats } from './assets/actions'
import { getCurrentUser } from '@/lib/auth/permissions'
import BusinessUnitGallery from '@/components/dashboard/BusinessUnitGallery'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Overview | TECHSAS',
}

function formatRupiah(n?: number | null) {
  if (n == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

async function StatsSection() {
  const supabase = await createClient()
  const [stats, businessUnits] = await Promise.all([getAssetStats(), getBusinessUnits()])

  // Fetch financial sums
  const { data: assetSums } = await (supabase.from('assets') as any)
    .select('purchase_price, current_book_value')
    .neq('status', 'disposed')

  const totalAcquisition = (assetSums || []).reduce(
    (sum: number, a: any) => sum + (Number(a.purchase_price) || 0),
    0
  )
  const totalBookVal = (assetSums || []).reduce(
    (sum: number, a: any) => sum + (Number(a.current_book_value) || 0),
    0
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Apple Featured Dark Charcoal Card (As shown in Brand Guidelines) */}
      <Link
        href="/dashboard/assets"
        className="card p-5 bg-charcoal text-white rounded-apple-lg border-0 shadow-apple-hover relative overflow-hidden group transition-all duration-200"
      >
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Assets Registered</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-mint-500">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-white tracking-tight">
              {stats.total.toLocaleString('id-ID')}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-mint-500/20 text-mint-400 text-xs font-bold mt-1.5 border border-mint-500/30">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>↑ 12% MoM</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {formatRupiah(totalAcquisition)} nilai perolehan
          </p>
        </div>
        {/* Subtle decorative glowing chart curve */}
        <div className="absolute right-0 bottom-0 w-36 h-24 opacity-25 pointer-events-none">
          <svg viewBox="0 0 100 50" fill="none" className="w-full h-full stroke-mint-500 stroke-2">
            <path d="M0 40 Q25 35, 45 25 T80 15 T100 5" />
          </svg>
        </div>
      </Link>

      {/* Card 2: Current Book Value (Apple White Card with Mint badge) */}
      <Link
        href="/dashboard/depreciation"
        className="card p-5 bg-white rounded-apple-lg border border-cloud-200 shadow-apple hover:shadow-apple-hover hover:border-mint-300 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Nilai Buku (NBV)</span>
          <div className="w-8 h-8 rounded-full bg-pale-100 flex items-center justify-center text-charcoal">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3">
          <p className="text-2xl font-black text-charcoal tracking-tight truncate">
            {formatRupiah(totalBookVal)}
          </p>
          <span className="badge-mint mt-1.5">
            Aktif Terdepresiasi
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          {stats.active.toLocaleString('id-ID')} unit aset aktif operasional
        </p>
      </Link>

      {/* Card 3: Prima / Good Condition */}
      <Link
        href="/dashboard/assets?condition=good"
        className="card p-5 bg-white rounded-apple-lg border border-cloud-200 shadow-apple hover:shadow-apple-hover hover:border-mint-300 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Kondisi Prima (Baik)</span>
          <div className="w-8 h-8 rounded-full bg-pale-100 flex items-center justify-center text-[#2A4416]">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3">
          <p className="text-2xl font-black text-charcoal tracking-tight">
            {stats.conditions.good.toLocaleString('id-ID')}
          </p>
          <span className="badge-mint mt-1.5">
            {stats.total ? Math.round((stats.conditions.good / stats.total) * 100) : 0}% Siap Pakai
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Aset dalam status siap operasional
        </p>
      </Link>

      {/* Card 4: Need Maintenance */}
      <Link
        href="/dashboard/maintenance"
        className="card p-5 bg-white rounded-apple-lg border border-cloud-200 shadow-apple hover:shadow-apple-hover hover:border-mint-300 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Perlu Pemeliharaan</span>
          <div className="w-8 h-8 rounded-full bg-cloud-100 flex items-center justify-center text-charcoal">
            <Wrench className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3">
          <p className="text-2xl font-black text-charcoal tracking-tight">
            {(stats.conditions.damaged + stats.conditions.under_repair).toLocaleString('id-ID')}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-cloud-100 text-slate-700 mt-1.5 border border-cloud-200">
            Jadwal Servis
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Dalam perbaikan atau permohonan teknisi
        </p>
      </Link>
    </div>
  )
}

async function QuickActionDock() {
  const actions = [
    {
      href: '/dashboard/assets',
      title: 'Daftar Aset',
      desc: 'Semua inventaris',
      icon: <Box className="w-5 h-5 text-charcoal" />,
    },
    {
      href: '/dashboard/scanner',
      title: 'QR Scanner',
      desc: 'Pindai kamera',
      icon: <Camera className="w-5 h-5 text-charcoal" />,
    },
    {
      href: '/dashboard/assets/print-labels',
      title: 'Cetak Label',
      desc: 'QR sticker thermal',
      icon: <Printer className="w-5 h-5 text-charcoal" />,
    },
    {
      href: '/dashboard/opname',
      title: 'Stock Opname',
      desc: 'Audit fisik berkala',
      icon: <ClipboardCheck className="w-5 h-5 text-charcoal" />,
    },
    {
      href: '/dashboard/maintenance',
      title: 'Pemeliharaan',
      desc: 'Work order servis',
      icon: <Wrench className="w-5 h-5 text-charcoal" />,
    },
    {
      href: '/dashboard/depreciation',
      title: 'Penyusutan',
      desc: 'Kalkulator buku',
      icon: <TrendingDown className="w-5 h-5 text-charcoal" />,
    },
    {
      href: '/dashboard/reports',
      title: 'Pusat Laporan',
      desc: 'Ekspor data CSV',
      icon: <FileText className="w-5 h-5 text-charcoal" />,
    },
  ]

  return (
    <div className="card p-6 bg-white border border-cloud-200 shadow-apple">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-charcoal tracking-tight uppercase">
            MODUL OPERASIONAL CEPAT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Akses langsung ke seluruh siklus hidup aset TECHSAS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {actions.map((act) => (
          <Link
            key={act.href}
            href={act.href}
            className="p-4 rounded-2xl bg-surface-50 hover:bg-pale-100/60 border border-cloud-200 hover:border-mint-300 flex flex-col items-center text-center transition-all duration-150 hover:shadow-apple active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-cloud-200 group-hover:border-mint-300 flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
              {act.icon}
            </div>
            <span className="text-xs font-bold text-charcoal block leading-tight">
              {act.title}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
              {act.desc}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

async function AttentionAlerts() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const { data: overdueMaint } = await (supabase
    .from('asset_maintenance') as any)
    .select('id, asset:assets(name, asset_code)')
    .eq('status', 'scheduled')
    .lt('scheduled_date', today)
    .limit(5)

  const { data: pendingDisposal } = await (supabase
    .from('disposal_records') as any)
    .select('id, asset:assets(name, asset_code), disposal_type')
    .eq('approval_status', 'pending')
    .limit(5)

  const { data: urgentWorkOrders } = await (supabase
    .from('work_orders') as any)
    .select('id, wo_number, title, priority, status')
    .in('status', ['pending', 'in_progress'])
    .in('priority', ['emergency', 'high'])
    .limit(5)

  const hasAlerts =
    (overdueMaint && overdueMaint.length > 0) ||
    (pendingDisposal && pendingDisposal.length > 0) ||
    (urgentWorkOrders && urgentWorkOrders.length > 0)

  if (!hasAlerts) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {urgentWorkOrders && urgentWorkOrders.length > 0 && (
        <div className="p-4 bg-white border border-cloud-200 rounded-2xl shadow-apple flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-danger-50 text-danger-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-charcoal">
                {urgentWorkOrders.length} Work Order Darurat
              </h4>
              <Link
                href="/dashboard/work-orders?priority=emergency"
                className="text-[11px] text-charcoal font-bold hover:underline"
              >
                Tindak Lanjut →
              </Link>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tiket perbaikan prioritas tinggi memerlukan respon.
            </p>
          </div>
        </div>
      )}

      {overdueMaint && overdueMaint.length > 0 && (
        <div className="p-4 bg-white border border-cloud-200 rounded-2xl shadow-apple flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-charcoal">
                {overdueMaint.length} Pemeliharaan Jatuh Tempo
              </h4>
              <Link
                href="/dashboard/maintenance"
                className="text-[11px] text-charcoal font-bold hover:underline"
              >
                Cek Servis →
              </Link>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Jadwal servis preventif melewati batas waktu.
            </p>
          </div>
        </div>
      )}

      {pendingDisposal && pendingDisposal.length > 0 && (
        <div className="p-4 bg-white border border-cloud-200 rounded-2xl shadow-apple flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-pale-100 text-charcoal flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-charcoal">
                {pendingDisposal.length} Pengajuan Pelepasan
              </h4>
              <Link
                href="/dashboard/disposal"
                className="text-[11px] text-charcoal font-bold hover:underline"
              >
                Tinjau →
              </Link>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Permohonan disposal aset menanti approval.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

async function ByUnitTable() {
  const stats = await getAssetStats()

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
            Distribusi Aset per Unit Bisnis
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sebaran kuota inventaris di seluruh divisi
          </p>
        </div>
        <Link
          href="/dashboard/business-units"
          className="text-xs text-charcoal hover:underline font-bold"
        >
          Lihat Semua →
        </Link>
      </div>
      <div className="table-wrapper rounded-none border-0">
        <table className="table">
          <thead>
            <tr>
              <th>Unit Bisnis</th>
              <th>Jumlah Aset</th>
              <th>Proporsi Inventaris</th>
            </tr>
          </thead>
          <tbody>
            {stats.byUnit.map((u) => {
              const pct = stats.total ? ((u.count / stats.total) * 100).toFixed(0) : '0'
              return (
                <tr key={u.name}>
                  <td className="font-semibold text-charcoal">{u.name}</td>
                  <td className="font-mono font-bold text-charcoal">
                    {u.count.toLocaleString('id-ID')}
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-cloud-100 rounded-full h-2 max-w-36 overflow-hidden">
                        <div
                          className="h-full bg-mint-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 tabular-nums w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function ConditionBreakdown() {
  const stats = await getAssetStats()
  const conditions = [
    { label: 'Kondisi Baik', value: stats.conditions.good, cls: 'badge-mint', barColor: 'bg-mint-500' },
    { label: 'Kondisi Cukup', value: stats.conditions.fair, cls: 'badge-slate', barColor: 'bg-slate-400' },
    { label: 'Kondisi Rusak', value: stats.conditions.damaged, cls: 'badge-red', barColor: 'bg-danger-500' },
    { label: 'Dalam Perbaikan', value: stats.conditions.under_repair, cls: 'badge-yellow', barColor: 'bg-amber-400' },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
          Kondisi Fisik & Status Kesehatan
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Monitoring kesiapan operasional aset
        </p>
      </div>
      <div className="card-body space-y-4">
        {conditions.map((c) => {
          const pct = stats.total ? Math.round((c.value / stats.total) * 100) : 0
          return (
            <div key={c.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={c.cls}>{c.label}</span>
                <span className="font-bold text-charcoal">
                  {c.value.toLocaleString('id-ID')} <span className="text-slate-400 font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="w-full bg-cloud-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${c.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const { profile } = await getCurrentUser()
  const [stats, businessUnits] = await Promise.all([getAssetStats(), getBusinessUnits()])

  const countsByUnit: Record<string, number> = {}
  stats.byUnit.forEach((u) => {
    countsByUnit[u.name] = u.count
  })

  return (
    <div className="space-y-6">
      {/* Apple-style Top Hero / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-apple-lg border border-cloud-200 shadow-apple">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-mint">
              TECHSAS Asset Hub
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Enterprise 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal tracking-tight mt-1.5">
            Selamat Datang, {profile.full_name || 'Admin'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola dan pantau seluruh siklus aset strategis secara cerdas dan efisien.
          </p>
        </div>

        {/* Quick Action Buttons (Apple UI elements from Guidelines) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/assets/new"
            className="btn-primary"
          >
            <span>Tambah Aset</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard/scanner"
            className="btn-secondary"
          >
            <span>Scan QR</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Section */}
      <Suspense
        fallback={
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-cloud-100" />
            ))}
          </div>
        }
      >
        <StatsSection />
      </Suspense>

      {/* Quick Action Dock */}
      <QuickActionDock />

      {/* Business Unit Gallery */}
      <BusinessUnitGallery units={businessUnits} countsByUnit={countsByUnit} />

      {/* Attention Alerts Banner */}
      <AttentionAlerts />

      {/* Main Grid: Distribution & Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="card h-64 animate-pulse bg-cloud-100" />}>
            <ByUnitTable />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<div className="card h-64 animate-pulse bg-cloud-100" />}>
            <ConditionBreakdown />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
