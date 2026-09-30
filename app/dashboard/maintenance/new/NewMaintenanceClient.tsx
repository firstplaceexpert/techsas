'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Wrench,
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  Box,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { createMaintenance } from '../actions'
import type { AssetListItem, Profile } from '@/types'

export default function NewMaintenanceClient({
  assets,
  technicians,
  defaultAssetId,
}: {
  assets: AssetListItem[]
  technicians: Profile[]
  defaultAssetId?: string
}) {
  const router = useRouter()
  const [assetId, setAssetId] = useState(defaultAssetId || assets[0]?.id || '')
  const [maintenanceType, setMaintenanceType] = useState<
    'preventive' | 'corrective' | 'predictive'
  >('corrective')
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [technicianId, setTechnicianId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetId || !notes.trim()) return

    setLoading(true)
    setError(null)

    const res = await createMaintenance({
      asset_id: assetId,
      maintenance_type: maintenanceType,
      scheduled_date: scheduledDate,
      technician_id: technicianId || null,
      notes,
    })

    setLoading(false)

    if (res.success) {
      router.push(`/dashboard/maintenance/${res.data.id}`)
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/maintenance"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pemeliharaan
        </Link>
        <h1 className="page-title">Buat Tiket / Jadwal Pemeliharaan</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Registrasi perbaikan kerusakan atau buat jadwal perawatan preventif aset.
        </p>
      </div>

      <div className="card p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Aset <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.asset_code} - {a.name} ({a.business_unit?.name || 'Unit'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Jenis Pemeliharaan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMaintenanceType('corrective')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                  maintenanceType === 'corrective'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Perbaikan Rusak
                <span className="block text-[10px] opacity-75">Corrective</span>
              </button>

              <button
                type="button"
                onClick={() => setMaintenanceType('preventive')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                  maintenanceType === 'preventive'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Perawatan Rutin
                <span className="block text-[10px] opacity-75">Preventive</span>
              </button>

              <button
                type="button"
                onClick={() => setMaintenanceType('predictive')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                  maintenanceType === 'predictive'
                    ? 'bg-pale-100 border-blue-500 text-charcoal shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Kalibrasi/Cek
                <span className="block text-[10px] opacity-75">Predictive</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Jadwal Pengerjaan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Teknisi / Petugas Pelaksana
              </label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Pilih Teknisi / Internal...</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Kerusakan / Rencana Tindakan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan detail kendala teknis, gejala kerusakan, atau sparepart yang perlu diganti..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !assetId || !notes.trim()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30"
              id="btn-submit-new-maintenance"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan Tiket Work Order...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  Simpan & Terbitkan Work Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
