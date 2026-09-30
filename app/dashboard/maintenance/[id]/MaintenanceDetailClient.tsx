'use client'

import { useState } from 'react'
import {
  Wrench,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Building2,
  ArrowLeft,
  Loader2,
  Printer,
  FileText,
  Clock,
  Check,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { completeMaintenance, type MaintenanceWithRelations } from '../actions'

export default function MaintenanceDetailClient({
  maint,
}: {
  maint: MaintenanceWithRelations
}) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [cost, setCost] = useState<string>(maint.cost ? String(maint.cost) : '')
  const [completedDate, setCompletedDate] = useState(
    maint.completed_date || new Date().toISOString().split('T')[0]
  )
  const [completionNotes, setCompletionNotes] = useState('')
  const [nextScheduleDate, setNextScheduleDate] = useState(
    maint.next_schedule_date || ''
  )
  const [condition, setCondition] = useState<string>('good')
  const [loading, setLoading] = useState(false)

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await completeMaintenance(maint.id, {
      cost: cost ? parseFloat(cost) : 0,
      completed_date: completedDate,
      notes: completionNotes,
      next_schedule_date: nextScheduleDate || null,
      assetCondition: condition,
    })

    setLoading(false)

    if (res.success) {
      setIsCompleting(false)
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header (Hidden during print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/maintenance"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Pemeliharaan
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Work Order #{maint.id.slice(0, 8).toUpperCase()}</h1>
            <span
              className={`badge text-xs font-semibold ${
                maint.status === 'completed'
                  ? 'badge-green'
                  : maint.status === 'in_progress'
                  ? 'badge-blue'
                  : 'badge-yellow'
              }`}
            >
              {maint.status === 'completed'
                ? 'Selesai Dikerjakan'
                : maint.status === 'in_progress'
                ? 'Sedang Dikerjakan'
                : 'Menunggu / Terjadwal'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2"
          >
            <Printer className="w-4 h-4" /> Cetak Lembar SPK
          </button>
          {maint.status !== 'completed' && (
            <button
              onClick={() => setIsCompleting(true)}
              className="btn-primary text-xs flex items-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-4 h-4" /> Selesaikan Work Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Work Order Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detail Instruksi Kerja (SPK)
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Jenis Perawatan</span>
                <span className="font-bold text-slate-900 capitalize">
                  {maint.maintenance_type}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Tanggal Jadwal</span>
                <span className="font-bold text-slate-900">
                  {maint.scheduled_date || '—'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Teknisi Bertugas</span>
                <span className="font-bold text-slate-900">
                  {maint.technician?.full_name || 'Tim Internal'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Biaya Realisasi</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {maint.cost
                    ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                      }).format(maint.cost)
                    : 'Rp 0'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Kerusakan & Riwayat Tindakan:
              </span>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {maint.notes || 'Tidak ada catatan khusus.'}
              </div>
            </div>

            {maint.completed_date && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Selesai pada: {maint.completed_date}
                </span>
                {maint.next_schedule_date && (
                  <span>Jadwal Berikutnya: {maint.next_schedule_date}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Asset Card */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Aset Terkait
            </h3>

            {maint.asset?.photo_url && (
              <img
                src={maint.asset.photo_url}
                alt={maint.asset.name}
                className="w-full h-36 object-cover rounded-xl border border-slate-200"
              />
            )}

            <div>
              <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {maint.asset?.asset_code}
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-1">
                {maint.asset?.name}
              </h4>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Unit Bisnis:</span>
                <span className="font-semibold text-slate-800">
                  {maint.asset?.business_unit?.name}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Lokasi:</span>
                <span className="font-semibold text-slate-800">
                  {maint.asset?.current_location?.name || '—'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kondisi Aset:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {maint.asset?.condition}
                </span>
              </div>
            </div>

            {maint.asset && (
              <Link
                href={`/dashboard/assets/${maint.asset.id}`}
                className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5"
              >
                Lihat Detail Lengkap Aset
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {isCompleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Penyelesaian Work Order
              </h3>
              <button
                onClick={() => setIsCompleting(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Penyelesaian <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Biaya Riil Perbaikan / Sparepart (Rp)
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Update Kondisi Fisik Akhir Aset
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="good">Baik (Normal Operasional)</option>
                  <option value="fair">Cukup (Masih bisa dipakai)</option>
                  <option value="damaged">Rusak (Perlu tindakan lanjut)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jadwalkan Perawatan Berikutnya (Opsional)
                </label>
                <input
                  type="date"
                  value={nextScheduleDate}
                  onChange={(e) => setNextScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tindakan Teknisi / Penggantian Part
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Jelaskan part yang diganti atau hasil pengujian..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleting(false)}
                  className="flex-1 btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Tandai Selesai'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Surat Perintah Kerja (SPK) Sheet */}
      <div className="hidden print:block space-y-6 text-black">
        <div className="text-center border-b-2 border-black pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">
            SURAT PERINTAH KERJA (WORK ORDER PEMELIHARAAN)
          </h2>
          <p className="text-sm font-semibold mt-1">
            TECHSAS ASSET HUB &bull; {maint.asset?.business_unit?.name?.toUpperCase()}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Nomor SPK: WO-{maint.id.slice(0, 8).toUpperCase()} &bull; Tanggal:{' '}
            {maint.scheduled_date}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs border border-black p-4">
          <div>
            <p className="font-bold">Kode Aset: {maint.asset?.asset_code}</p>
            <p className="mt-1">Nama Aset: {maint.asset?.name}</p>
            <p className="mt-1">Lokasi Fisik: {maint.asset?.current_location?.name}</p>
          </div>
          <div>
            <p className="font-bold">Jenis: {maint.maintenance_type?.toUpperCase()}</p>
            <p className="mt-1">Teknisi Ditugaskan: {maint.technician?.full_name || 'Tim Internal'}</p>
            <p className="mt-1">Status: {maint.status?.toUpperCase()}</p>
          </div>
        </div>

        <div className="border border-black p-4 text-xs space-y-2">
          <p className="font-bold uppercase">Deskripsi Masalah / Rencana Perbaikan:</p>
          <p className="whitespace-pre-line">{maint.notes}</p>
        </div>

        <div className="pt-12 flex justify-between text-xs text-center">
          <div>
            <p>Pemberi Tugas (Asset Officer),</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1">
              ( .................................................. )
            </p>
          </div>
          <div>
            <p>Pelaksana / Teknisi,</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1">
              ( {maint.technician?.full_name || '..................................................'} )
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
