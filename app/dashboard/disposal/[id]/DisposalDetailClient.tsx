'use client'

import { useState } from 'react'
import {
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Loader2,
  Printer,
  DollarSign,
  Building2,
  Tag,
  Check,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import Link from 'next/link'
import {
  approveDisposal,
  rejectDisposal,
  completeDisposalExecution,
  type DisposalWithRelations,
} from '../actions'

function formatRupiah(n?: number | null) {
  if (n == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function DisposalDetailClient({
  record,
  userRole,
}: {
  record: DisposalWithRelations
  userRole: string
}) {
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showExecuteModal, setShowExecuteModal] = useState(false)
  const [finalPrice, setFinalPrice] = useState<string>(
    record.sale_price ? String(record.sale_price) : ''
  )

  const canApprove = ['super_admin', 'corporate_admin', 'unit_admin'].includes(userRole)

  const handleApprove = async () => {
    if (!confirm('Setujui permohonan pelepasan aset ini?')) return
    setLoading(true)
    const res = await approveDisposal(record.id)
    setLoading(false)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await rejectDisposal(record.id, rejectReason)
    setLoading(false)
    if (res.success) {
      setShowRejectModal(false)
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  const handleExecuteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await completeDisposalExecution(
      record.id,
      finalPrice ? parseFloat(finalPrice) : null
    )
    setLoading(false)
    if (res.success) {
      setShowExecuteModal(false)
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  const bookVal =
    record.asset?.current_book_value ?? record.asset?.purchase_price ?? 0
  const saleVal = record.sale_price ?? 0
  const gainLossVal = record.gain_loss_amount ?? saleVal - bookVal

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header (Hidden in print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/disposal"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Pelepasan
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="page-title">
              Permohonan Pelepasan #{record.id.slice(0, 8).toUpperCase()}
            </h1>
            <span
              className={`badge text-xs font-semibold ${
                record.approval_status === 'approved'
                  ? 'badge-green'
                  : record.approval_status === 'rejected'
                  ? 'badge-red'
                  : 'badge-yellow'
              }`}
            >
              {record.approval_status === 'approved'
                ? 'Disetujui'
                : record.approval_status === 'rejected'
                ? 'Ditolak'
                : 'Menunggu Persetujuan'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2"
          >
            <Printer className="w-4 h-4" /> Cetak Berita Acara
          </button>

          {canApprove && record.approval_status === 'pending' && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="btn-secondary text-xs py-2 text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                <X className="w-4 h-4" /> Tolak
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="btn-primary text-xs py-2 bg-charcoal hover:bg-blue-700"
              >
                <Check className="w-4 h-4" /> Setujui Permohonan
              </button>
            </>
          )}

          {canApprove &&
            record.approval_status === 'approved' &&
            !record.disposed_at && (
              <button
                onClick={() => setShowExecuteModal(true)}
                disabled={loading}
                className="btn-primary text-xs py-2 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" /> Eksekusi / Selesaikan Pelepasan
              </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Workflow Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rincian Pengajuan Pelepasan
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Metode Pelepasan</span>
                <span className="font-bold text-slate-900 capitalize">
                  {record.disposal_type}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Tanggal Diajukan</span>
                <span className="font-bold text-slate-900">
                  {new Date(record.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Pemohon</span>
                <span className="font-bold text-slate-900">
                  {record.requester?.full_name || 'Staff Unit'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Penyetujui / Approver</span>
                <span className="font-bold text-slate-900">
                  {record.approver?.full_name || '—'}
                </span>
              </div>
            </div>

            {/* Financial comparison */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-3 text-xs text-center">
              <div>
                <span className="text-slate-400 block mb-0.5">Nilai Buku Aset:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {formatRupiah(bookVal)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Nilai Pelepasan / Jual:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatRupiah(record.sale_price)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Gain / Loss:</span>
                <span
                  className={`font-extrabold text-sm ${
                    gainLossVal >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {gainLossVal >= 0 ? `+${formatRupiah(gainLossVal)}` : formatRupiah(gainLossVal)}
                </span>
              </div>
            </div>

            {record.buyer_or_recipient && (
              <div className="text-xs">
                <span className="text-slate-400 block mb-1">Pihak Pembeli / Penerima:</span>
                <span className="font-semibold text-slate-800">
                  {record.buyer_or_recipient}
                </span>
              </div>
            )}

            {record.target_business_unit && (
              <div className="text-xs">
                <span className="text-slate-400 block mb-1">Unit Bisnis Tujuan Transfer:</span>
                <span className="font-semibold text-slate-800">
                  {record.target_business_unit.name}
                </span>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Alasan & Justifikasi Pengajuan:
              </span>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {record.notes || 'Tidak ada catatan.'}
              </div>
            </div>

            {record.disposed_at && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Aset telah resmi dieksekusi pelepasan pada{' '}
                  <b>
                    {new Date(record.disposed_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </b>
                  .
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Asset Details */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Aset yang Dilepas
            </h3>

            {record.asset?.photo_url && (
              <img
                src={record.asset.photo_url}
                alt={record.asset.name}
                className="w-full h-36 object-cover rounded-xl border border-slate-200"
              />
            )}

            <div>
              <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {record.asset?.asset_code}
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-1">
                {record.asset?.name}
              </h4>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Unit Bisnis:</span>
                <span className="font-semibold text-slate-800">
                  {record.asset?.business_unit?.name}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kategori:</span>
                <span className="font-semibold text-slate-800">
                  {record.asset?.category?.name}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Harga Perolehan Awal:</span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(record.asset?.purchase_price)}
                </span>
              </div>
            </div>

            {record.asset && (
              <Link
                href={`/dashboard/assets/${record.asset.id}`}
                className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5"
              >
                Lihat Detail Lengkap Aset
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Tolak Permohonan Pelepasan Aset
            </h3>
            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Jelaskan alasan penolakan permohonan disposal ini..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !rejectReason.trim()}
                  className="flex-1 btn-primary bg-rose-600 hover:bg-rose-700"
                >
                  Konfirmasi Penolakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execute Modal */}
      {showExecuteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Eksekusi & Pembukuan Pelepasan Aset
            </h3>
            <p className="text-xs text-slate-500">
              Aksi ini akan mengubah status aset menjadi <b>DILEPAS (Disposed)</b> dan mengunci realisasi harga jual.
            </p>

            <form onSubmit={handleExecuteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Harga Realisasi Pelepasan Akhir (Rp)
                </label>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="Nilai uang yang diterima..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExecuteModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? 'Memproses...' : 'Selesaikan Pelepasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Berita Acara Pelepasan (BA Pelepasan) */}
      <div className="hidden print:block space-y-6 text-black">
        <div className="text-center border-b-2 border-black pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">
            BERITA ACARA PELEPASAN / PENGHAPUSBUKUAN ASET
          </h2>
          <p className="text-sm font-semibold mt-1">
            TECHSAS ASSET HUB &bull; {record.asset?.business_unit?.name?.toUpperCase()}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Nomor: BA-DISP/{record.id.slice(0, 8).toUpperCase()}/{new Date().getFullYear()}
          </p>
        </div>

        <p className="text-xs leading-relaxed">
          Pada hari ini, bertempat di kantor TECHSAS, telah dilakukan verifikasi dan persetujuan pelepasan atas aset tetap sebagai berikut:
        </p>

        <div className="grid grid-cols-2 gap-4 text-xs border border-black p-4">
          <div>
            <p className="font-bold">Kode Aset: {record.asset?.asset_code}</p>
            <p className="mt-1">Nama Aset: {record.asset?.name}</p>
            <p className="mt-1">Unit Bisnis: {record.asset?.business_unit?.name}</p>
          </div>
          <div>
            <p className="font-bold">Metode Pelepasan: {record.disposal_type?.toUpperCase()}</p>
            <p className="mt-1">Nilai Buku: {formatRupiah(bookVal)}</p>
            <p className="mt-1">Nilai Realisasi Pelepasan: {formatRupiah(record.sale_price)}</p>
          </div>
        </div>

        <div className="border border-black p-4 text-xs space-y-1">
          <p className="font-bold uppercase">Justifikasi & Alasan:</p>
          <p className="whitespace-pre-line">{record.notes}</p>
        </div>

        <div className="pt-14 flex justify-between text-xs text-center">
          <div>
            <p>Diajukan oleh (Staff Unit),</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1">
              ( {record.requester?.full_name || 'Staff Asset'} )
            </p>
          </div>
          <div>
            <p>Disetujui oleh (Corporate Director),</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1">
              ( {record.approver?.full_name || 'Direktur Asset Corp'} )
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
