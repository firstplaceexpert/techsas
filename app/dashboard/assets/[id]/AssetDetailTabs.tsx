'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  MapPin,
  Wrench,
  TrendingDown,
  QrCode,
  Download,
  Printer,
  Plus,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  X,
} from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { getPublicScanUrl } from '@/lib/utils/qrcode'
import { quickMoveAssetLocation } from '@/app/dashboard/scanner/actions'
import type {
  AssetWithRelations,
  Location,
  BusinessUnit,
  Profile,
} from '@/types'

export default function AssetDetailTabs({
  asset,
  locationHistory,
  maintenanceHistory,
  depreciationLogs,
  locations,
  businessUnits,
  canManage,
}: {
  asset: AssetWithRelations
  locationHistory: any[]
  maintenanceHistory: any[]
  depreciationLogs: any[]
  locations: Location[]
  businessUnits: BusinessUnit[]
  canManage: boolean
}) {
  const [activeTab, setActiveTab] = useState<
    'location' | 'maintenance' | 'depreciation' | 'qr'
  >('location')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Move Modal State
  const [isMoveOpen, setIsMoveOpen] = useState(false)
  const [targetLocationId, setTargetLocationId] = useState(
    asset.current_location_id || ''
  )
  const [targetUnitId, setTargetUnitId] = useState(asset.business_unit_id || '')
  const [moveNote, setMoveNote] = useState('')
  const [moveLoading, setMoveLoading] = useState(false)
  const [moveSuccess, setMoveSuccess] = useState(false)

  useEffect(() => {
    async function gen() {
      if (asset.qr_code_uuid) {
        const url = getPublicScanUrl(asset.qr_code_uuid)
        const dataUrl = await QRCode.toDataURL(url, {
          width: 320,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
        setQrDataUrl(dataUrl)
      }
    }
    gen()
  }, [asset.qr_code_uuid])

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetLocationId) return

    setMoveLoading(true)
    const res = await quickMoveAssetLocation(
      asset.id,
      targetLocationId,
      targetUnitId,
      moveNote
    )
    setMoveLoading(false)

    if (res.success) {
      setMoveSuccess(true)
      setTimeout(() => {
        setIsMoveOpen(false)
        setMoveSuccess(false)
        window.location.reload()
      }, 1000)
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('location')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'location'
              ? 'border-brand-600 text-brand-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Riwayat Lokasi ({locationHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'border-brand-600 text-brand-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Riwayat Pemeliharaan ({maintenanceHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('depreciation')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'depreciation'
              ? 'border-brand-600 text-brand-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Buku & Penyusutan ({depreciationLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'qr'
              ? 'border-brand-600 text-brand-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          Label QR Code
        </button>
      </div>

      {/* Tab 1: Location History */}
      {activeTab === 'location' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Timeline Perpindahan Lokasi
            </h3>
            {canManage && (
              <button
                onClick={() => setIsMoveOpen(true)}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Pindah Lokasi Baru
              </button>
            )}
          </div>

          {locationHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Belum ada riwayat mutasi perpindahan lokasi.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {locationHistory.map((h, i) => (
                <div key={h.id || i} className="relative group">
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-brand-500 bg-white group-first:bg-brand-600" />
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {h.location?.name || 'Lokasi Tidak Terdaftar'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(h.moved_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {h.note && (
                      <p className="text-xs text-slate-600">{h.note}</p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Oleh: {h.mover?.full_name || 'Sistem'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Maintenance History */}
      {activeTab === 'maintenance' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Catatan Pemeliharaan & Tiket Perbaikan
            </h3>
            {canManage && (
              <Link
                href={`/dashboard/maintenance/new?assetId=${asset.id}`}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Catat Pemeliharaan
              </Link>
            )}
          </div>

          {maintenanceHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Belum ada riwayat pemeliharaan pada aset ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {maintenanceHistory.map((m) => (
                <div key={m.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 capitalize">
                        {m.maintenance_type}
                      </span>
                      <span
                        className={`badge ${
                          m.status === 'completed'
                            ? 'badge-green'
                            : m.status === 'in_progress'
                            ? 'badge-blue'
                            : 'badge-yellow'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    {m.notes && <p className="text-slate-600 whitespace-pre-line">{m.notes}</p>}
                    <p className="text-[11px] text-slate-400">
                      Teknisi: {m.technician?.full_name || 'Internal'} &bull; Jadwal:{' '}
                      {m.scheduled_date || '—'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-semibold text-slate-900 block">
                      {m.cost
                        ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            maximumFractionDigits: 0,
                          }).format(m.cost)
                        : 'Rp 0'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(m.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Depreciation Logs */}
      {activeTab === 'depreciation' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Buku Nilai & Riwayat Penyusutan Bulanan
            </h3>
            <Link
              href="/dashboard/depreciation"
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
            >
              Buka Engine Depresiasi &rarr;
            </Link>
          </div>

          {depreciationLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Belum ada log pembukuan penyusutan untuk aset ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2">Periode Bulan</th>
                    <th className="py-2">Penyusutan</th>
                    <th className="py-2">Nilai Buku Akhir</th>
                    <th className="py-2">Waktu Hitung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {depreciationLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 font-medium">{log.period_month}</td>
                      <td className="py-2 text-rose-600 font-semibold">
                        -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(log.depreciation_amount)}
                      </td>
                      <td className="py-2 font-bold text-slate-900">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(log.book_value)}
                      </td>
                      <td className="py-2 text-slate-400">
                        {new Date(log.calculated_at).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: QR Code & Label Preview */}
      {activeTab === 'qr' && (
        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="p-4 bg-white border border-slate-300 rounded-2xl shadow-sm text-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={asset.asset_code}
                className="w-48 h-48 object-contain mx-auto"
              />
            ) : (
              <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                Membuat QR...
              </div>
            )}
            <p className="text-xs font-mono font-bold text-slate-900 mt-2">
              {asset.asset_code}
            </p>
          </div>

          <div className="space-y-3 flex-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-800">
              QR Code Label Fisik
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              QR Code ini terhubung langsung ke URL verifikasi publik dan dashboard manajemen aset TECHSAS.
            </p>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`QR-${asset.asset_code}.png`}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download Gambar QR
                </a>
              )}
              <Link
                href={`/dashboard/assets/print-labels`}
                className="btn-primary text-xs flex items-center gap-1.5 py-2"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Label Sticker
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Move Location Modal */}
      {isMoveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Pindahkan Lokasi Aset
              </h3>
              <button
                onClick={() => setIsMoveOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {moveSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  Lokasi Berhasil Dipindahkan!
                </p>
              </div>
            ) : (
              <form onSubmit={handleMoveSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit Bisnis Tujuan
                  </label>
                  <select
                    value={targetUnitId}
                    onChange={(e) => setTargetUnitId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {businessUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lokasi Ruangan Baru <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={targetLocationId}
                    onChange={(e) => setTargetLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Lokasi...</option>
                    {locations
                      .filter((l) => !targetUnitId || l.business_unit_id === targetUnitId)
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.level})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Alasan Perpindahan
                  </label>
                  <input
                    type="text"
                    value={moveNote}
                    onChange={(e) => setMoveNote(e.target.value)}
                    placeholder="Contoh: Relokasi ke kamar 302..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMoveOpen(false)}
                    className="flex-1 btn-secondary"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={moveLoading || !targetLocationId}
                    className="flex-1 btn-primary flex items-center justify-center gap-1.5"
                  >
                    {moveLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Simpan Perpindahan'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
