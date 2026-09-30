'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  Wrench,
  DollarSign,
  Box,
  Calendar,
  Phone,
  Mail,
  Plus,
  MessageSquare,
  Send,
  ExternalLink,
  ShieldCheck,
  Flame,
  PauseCircle,
  XCircle,
  X,
} from 'lucide-react'
import type {
  WorkOrderWithRelations,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderMaintenanceType,
  Profile,
} from '@/types'
import {
  updateWorkOrderStatus,
  addWorkOrderComment,
  addWorkOrderPart,
} from '../actions'

interface Props {
  initialWorkOrder: WorkOrderWithRelations
  currentUser: Profile | null
}

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Menunggu Persetujuan', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  approved: { label: 'Disetujui', color: 'text-charcoal', bg: 'bg-pale-100 border-cloud-200' },
  in_progress: { label: 'Dalam Pengerjaan', color: 'text-charcoal', bg: 'bg-pale-100 border-cloud-200' },
  on_hold: { label: 'Ditunda (On Hold)', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  completed: { label: 'Selesai', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  rejected: { label: 'Ditolak', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  cancelled: { label: 'Dibatalkan', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' },
}

const PRIORITY_CONFIG: Record<WorkOrderPriority, { label: string; badge: string }> = {
  emergency: { label: 'EMERGENCY', badge: 'bg-red-500 text-white font-bold animate-pulse' },
  high: { label: 'Tinggi', badge: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' },
  medium: { label: 'Sedang', badge: 'bg-amber-50 text-amber-700 border-amber-200 font-medium' },
  low: { label: 'Rendah', badge: 'bg-slate-50 text-slate-600 border-slate-200' },
}

function formatRupiah(n?: number | null) {
  if (n == null || n === 0) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function WorkOrderDetailClient({ initialWorkOrder, currentUser }: Props) {
  const [wo, setWo] = useState<WorkOrderWithRelations>(initialWorkOrder)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusNote, setStatusNote] = useState('')

  // New Comment state
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  // Add Part Modal state
  const [isPartModalOpen, setIsPartModalOpen] = useState(false)
  const [partName, setPartName] = useState('')
  const [partCode, setPartCode] = useState('')
  const [partQuantity, setPartQuantity] = useState(1)
  const [partUnitCost, setPartUnitCost] = useState(0)
  const [partSource, setPartSource] = useState<'inventory' | 'vendor' | 'cannibalized'>('vendor')
  const [partNotes, setPartNotes] = useState('')
  const [partLoading, setPartLoading] = useState(false)

  // SLA Calculation
  const createdAtTime = new Date(wo.created_at).getTime()
  const nowTime = Date.now()
  const hoursPassed = Math.max(0, Math.round((nowTime - createdAtTime) / (1000 * 60 * 60)))
  const slaTarget = wo.sla_target_hours || 48
  const slaPercentage = Math.min(100, Math.round((hoursPassed / slaTarget) * 100))
  const isOverdue = hoursPassed > slaTarget && wo.status !== 'completed' && wo.status !== 'cancelled'

  async function handleStatusChange(newStatus: WorkOrderStatus) {
    if (!confirm(`Konfirmasi perubahan status ke "${STATUS_CONFIG[newStatus]?.label}"?`)) {
      return
    }

    setStatusLoading(true)
    try {
      const res = await updateWorkOrderStatus(wo.id, newStatus, statusNote)
      if (!res.success) {
        alert(res.error || 'Gagal mengubah status')
        return
      }
      setWo({
        ...wo,
        status: newStatus,
        started_at: res.data.started_at || wo.started_at,
        completed_at: res.data.completed_at || wo.completed_at,
        actual_hours: res.data.actual_hours ?? wo.actual_hours,
      })
      setStatusNote('')
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return

    setCommentLoading(true)
    try {
      const res = await addWorkOrderComment(wo.id, commentText.trim())
      if (res.success && res.data) {
        setWo({
          ...wo,
          comments: [
            ...(wo.comments || []),
            {
              ...res.data,
              user: currentUser ? { id: currentUser.id, full_name: currentUser.full_name, role: currentUser.role } : null,
            },
          ],
        })
        setCommentText('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCommentLoading(false)
    }
  }

  async function handleAddPartSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!partName.trim()) return

    setPartLoading(true)
    try {
      const res = await addWorkOrderPart(wo.id, {
        part_name: partName.trim(),
        part_code: partCode.trim() || undefined,
        quantity: Number(partQuantity) || 1,
        unit_cost: Number(partUnitCost) || 0,
        source: partSource,
        notes: partNotes.trim() || undefined,
      })

      if (!res.success) {
        alert(res.error || 'Gagal menambahkan part')
        return
      }

      const newPart = res.data
      const nextParts = [...(wo.parts || []), newPart]
      const nextPartsCost = (wo.parts_cost || 0) + newPart.total_cost
      const nextTotalCost = (wo.labor_cost || 0) + nextPartsCost

      setWo({
        ...wo,
        parts: nextParts,
        parts_cost: nextPartsCost,
        total_cost: nextTotalCost,
      })

      setIsPartModalOpen(false)
      setPartName('')
      setPartCode('')
      setPartQuantity(1)
      setPartUnitCost(0)
      setPartNotes('')
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setPartLoading(false)
    }
  }

  const statusInfo = STATUS_CONFIG[wo.status] || STATUS_CONFIG.pending
  const prioInfo = PRIORITY_CONFIG[wo.priority] || PRIORITY_CONFIG.medium

  return (
    <div className="space-y-6">
      {/* Top Banner with WO ID & Status */}
      <div className="card p-6 border-l-4 border-l-brand-600 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200">
                {wo.wo_number}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${prioInfo.badge}`}>
                {prioInfo.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{wo.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Diterbitkan: {new Date(wo.created_at).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/work-orders"
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </Link>

            {wo.status === 'pending' && (
              <button
                disabled={statusLoading}
                onClick={() => handleStatusChange('approved')}
                className="btn btn-primary text-xs flex items-center gap-1.5 bg-charcoal hover:bg-blue-700 border-blue-600"
              >
                <CheckCircle2 className="w-4 h-4" />
                Setujui Work Order
              </button>
            )}

            {(wo.status === 'approved' || wo.status === 'on_hold') && (
              <button
                disabled={statusLoading}
                onClick={() => handleStatusChange('in_progress')}
                className="btn btn-primary text-xs flex items-center gap-1.5 bg-charcoal hover:bg-indigo-700 border-indigo-600"
              >
                <Wrench className="w-4 h-4" />
                Mulai Pengerjaan
              </button>
            )}

            {wo.status === 'in_progress' && (
              <>
                <button
                  disabled={statusLoading}
                  onClick={() => handleStatusChange('on_hold')}
                  className="btn btn-secondary text-xs flex items-center gap-1.5 text-orange-600 hover:bg-orange-50"
                >
                  <PauseCircle className="w-4 h-4" />
                  Hold / Tunda
                </button>

                <button
                  disabled={statusLoading}
                  onClick={() => handleStatusChange('completed')}
                  className="btn btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Tandai Selesai (Completed)
                </button>
              </>
            )}
          </div>
        </div>

        {/* SLA Progress Bar */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Monitoring Target Waktu (SLA):
            </span>
            <span className="font-mono">
              {wo.status === 'completed' ? (
                <span className="text-emerald-700 font-semibold">
                  Selesai dalam {wo.actual_hours ?? hoursPassed} jam (Target: {slaTarget} jam)
                </span>
              ) : isOverdue ? (
                <span className="text-rose-600 font-bold flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  SLA Terlewati ({hoursPassed} jam / batas {slaTarget} jam)
                </span>
              ) : (
                <span className="text-slate-600">
                  {hoursPassed} jam berlalu dari target {slaTarget} jam ({slaTarget - hoursPassed} jam tersisa)
                </span>
              )}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                wo.status === 'completed'
                  ? 'bg-emerald-500'
                  : isOverdue
                  ? 'bg-rose-500 animate-pulse'
                  : slaPercentage > 80
                  ? 'bg-amber-500'
                  : 'bg-mint-500'
              }`}
              style={{ width: `${wo.status === 'completed' ? 100 : Math.min(100, (hoursPassed / slaTarget) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details, Asset, Vendor, Parts, Comments (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Description Card */}
          <div className="card p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-600" />
              Deskripsi Masalah & Ruang Lingkup
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {wo.description || 'Tidak ada deskripsi rinci.'}
            </p>
            {wo.notes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 mt-2">
                <span className="font-semibold block mb-0.5">Catatan Khusus:</span>
                {wo.notes}
              </div>
            )}
          </div>

          {/* Target Asset Card */}
          <div className="card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Box className="w-4 h-4 text-brand-600" />
                Informasi Aset Terkait
              </h3>
              {wo.asset_id && (
                <Link
                  href={`/dashboard/assets/${wo.asset_id}`}
                  className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-medium"
                >
                  Buka Detail Aset
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {wo.asset ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Nama Aset</span>
                  <span className="font-bold text-slate-900 text-sm">{wo.asset.name}</span>
                  <span className="font-mono text-brand-600 block mt-0.5">{wo.asset.asset_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Unit Bisnis & Lokasi</span>
                  <span className="font-medium text-slate-800">
                    {wo.asset.business_unit?.name || '-'}
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    {wo.asset.current_location?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Kondisi Saat Ini</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {wo.asset.condition?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Nilai Buku Aset</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {formatRupiah(wo.asset.current_book_value ?? wo.asset.purchase_price)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Data aset tidak ditemukan.</p>
            )}
          </div>

          {/* Suku Cadang Digunakan Card */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-600" />
                Suku Cadang & Komponen Pengganti (Parts)
              </h3>
              {wo.status !== 'completed' && wo.status !== 'cancelled' && (
                <button
                  onClick={() => setIsPartModalOpen(true)}
                  className="btn btn-secondary text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Part
                </button>
              )}
            </div>

            {wo.parts && wo.parts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Nama Suku Cadang</th>
                      <th className="py-2.5 px-3">Kode Part</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                      <th className="py-2.5 px-3 text-right">Total Biaya</th>
                      <th className="py-2.5 px-3">Sumber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wo.parts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{p.part_name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.part_code || '-'}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{p.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(p.unit_cost)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatRupiah(p.total_cost)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 capitalize">
                            {p.source}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                Belum ada suku cadang yang dicatat pada Work Order ini.
              </p>
            )}
          </div>

          {/* Timeline & Comments Thread */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              Catatan Lapangan & Diskusi Teknisi
            </h3>

            {/* Comment list */}
            <div className="space-y-3">
              {wo.comments && wo.comments.length > 0 ? (
                wo.comments.map((c) => (
                  <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {c.user?.full_name || 'User'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(c.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{c.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2 text-center">
                  Belum ada catatan lapangan. Tambahkan komentar di bawah.
                </p>
              )}
            </div>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Tulis perkembangan pengerjaan atau temuan lapangan..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="input flex-1 text-xs"
              />
              <button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Cost Summary, Vendor Card, Timestamps (1 Col) */}
        <div className="space-y-6">
          {/* Cost Summary Card */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand-600" />
              Rincian Biaya Pemeliharaan
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Biaya Jasa / Teknisi:</span>
                <span className="font-mono font-medium text-slate-800">
                  {formatRupiah(wo.labor_cost)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Biaya Suku Cadang:</span>
                <span className="font-mono font-medium text-slate-800">
                  {formatRupiah(wo.parts_cost)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-bold text-slate-900">
                <span>Total Biaya:</span>
                <span className="font-mono text-brand-700">
                  {formatRupiah(wo.total_cost)}
                </span>
              </div>
            </div>
          </div>

          {/* Vendor / Technician Card */}
          <div className="card p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-600" />
              Mitra Pelaksana
            </h3>

            {wo.vendor ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2.5">
                <div className="font-bold text-slate-900 text-sm">{wo.vendor.name}</div>
                {wo.vendor.contact_person && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    PIC: {wo.vendor.contact_person}
                  </div>
                )}
                {wo.vendor.phone && (
                  <a
                    href={`tel:${wo.vendor.phone}`}
                    className="flex items-center gap-1.5 text-brand-600 hover:underline font-mono"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {wo.vendor.phone}
                  </a>
                )}
                {wo.vendor.email && (
                  <a
                    href={`mailto:${wo.vendor.email}`}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-brand-600 truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {wo.vendor.email}
                  </a>
                )}
              </div>
            ) : wo.assigned_user ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-1">
                <p className="font-semibold text-slate-900">{wo.assigned_user.full_name}</p>
                <p className="text-slate-400 capitalize">{wo.assigned_user.role?.replace('_', ' ')}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Tim pemeliharaan internal TECHSAS.</p>
            )}
          </div>

          {/* Timeline Milestones */}
          <div className="card p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              Riwayat Waktu (Timeline)
            </h3>

            <div className="space-y-3 text-xs border-l-2 border-brand-200 pl-3 ml-1">
              <div>
                <span className="font-semibold text-slate-800 block">Dibuat</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(wo.created_at).toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <span className="font-semibold text-slate-800 block">Mulai Pengerjaan</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {wo.started_at ? new Date(wo.started_at).toLocaleString('id-ID') : 'Belum dimulai'}
                </span>
              </div>

              <div>
                <span className="font-semibold text-slate-800 block">Selesai Pengerjaan</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {wo.completed_at ? new Date(wo.completed_at).toLocaleString('id-ID') : 'Belum selesai'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Part Modal */}
      {isPartModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-600" />
                Catat Suku Cadang Baru
              </h3>
              <button
                onClick={() => setIsPartModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPartSubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Suku Cadang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Filter Oli / Bearing 6204"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Seri / Part Number (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="P/N-..."
                  value={partCode}
                  onChange={(e) => setPartCode(e.target.value)}
                  className="input w-full font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(Number(e.target.value))}
                    className="input w-full font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={partUnitCost}
                    onChange={(e) => setPartUnitCost(Number(e.target.value))}
                    className="input w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Asal Suku Cadang
                </label>
                <select
                  value={partSource}
                  onChange={(e) => setPartSource(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="vendor">Beli dari Vendor</option>
                  <option value="inventory">Stok Gudang Sendiri</option>
                  <option value="cannibalized">Kanibal Aset Bekas</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Garansi Part
                </label>
                <textarea
                  rows={2}
                  placeholder="Garansi 1 tahun distributor..."
                  value={partNotes}
                  onChange={(e) => setPartNotes(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPartModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={partLoading}
                  className="btn btn-primary text-xs"
                >
                  {partLoading ? 'Menyimpan...' : 'Simpan Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
