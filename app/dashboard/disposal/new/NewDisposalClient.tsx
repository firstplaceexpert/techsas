'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trash2,
  ArrowLeft,
  Loader2,
  DollarSign,
  Building2,
  Send,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import { createDisposalRequest } from '../actions'
import type { AssetListItem, BusinessUnit, DisposalType } from '@/types'

function formatRupiah(n?: number | null) {
  if (n == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function NewDisposalClient({
  assets,
  businessUnits,
}: {
  assets: AssetListItem[]
  businessUnits: BusinessUnit[]
}) {
  const router = useRouter()
  const [assetId, setAssetId] = useState(assets[0]?.id || '')
  const [disposalType, setDisposalType] = useState<DisposalType>('sale')
  const [salePrice, setSalePrice] = useState('')
  const [buyerRecipient, setBuyerRecipient] = useState('')
  const [targetUnitId, setTargetUnitId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAsset = assets.find((a) => a.id === assetId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetId || !notes.trim()) return

    setLoading(true)
    setError(null)

    const res = await createDisposalRequest({
      asset_id: assetId,
      disposal_type: disposalType,
      sale_price: salePrice ? parseFloat(salePrice) : null,
      buyer_or_recipient: buyerRecipient || null,
      target_business_unit_id: disposalType === 'transfer' ? targetUnitId : null,
      notes,
    })

    setLoading(false)

    if (res.success) {
      router.push(`/dashboard/disposal/${res.data.id}`)
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/disposal"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pelepasan
        </Link>
        <h1 className="page-title">Pengajuan Pelepasan Aset (Disposal)</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Formulir permohonan pelepasan aset tetap grup untuk ditinjau oleh Manager Unit dan Direksi.
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
              Pilih Aset yang Akan Dilepas <span className="text-red-500">*</span>
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

          {selectedAsset && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Harga Perolehan Awal:</span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(selectedAsset.purchase_price)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Nilai Buku Saat Ini:</span>
                <span className="font-bold text-emerald-700">
                  {formatRupiah(selectedAsset.current_book_value)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Metode Pelepasan / Disposal <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDisposalType('sale')}
                className={`p-2 rounded-xl border text-center font-medium transition-all ${
                  disposalType === 'sale'
                    ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Jual Langsung
              </button>

              <button
                type="button"
                onClick={() => setDisposalType('auction')}
                className={`p-2 rounded-xl border text-center font-medium transition-all ${
                  disposalType === 'auction'
                    ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Lelang
              </button>

              <button
                type="button"
                onClick={() => setDisposalType('donation')}
                className={`p-2 rounded-xl border text-center font-medium transition-all ${
                  disposalType === 'donation'
                    ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Hibah / CSR
              </button>

              <button
                type="button"
                onClick={() => setDisposalType('transfer')}
                className={`p-2 rounded-xl border text-center font-medium transition-all ${
                  disposalType === 'transfer'
                    ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Transfer Unit
              </button>

              <button
                type="button"
                onClick={() => setDisposalType('writeoff')}
                className={`p-2 rounded-xl border text-center font-medium transition-all ${
                  disposalType === 'writeoff'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Musnah / Scrap
              </button>
            </div>
          </div>

          {(disposalType === 'sale' || disposalType === 'auction') && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Taksiran Harga Pelepasan / Target Penjualan (Rp)
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Contoh: 5000000"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          {(disposalType === 'sale' || disposalType === 'donation') && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Calon Pembeli / Lembaga Penerima Hibah
              </label>
              <input
                type="text"
                value={buyerRecipient}
                onChange={(e) => setBuyerRecipient(e.target.value)}
                placeholder="Nama pihak ketiga atau yayasan penerima..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          {disposalType === 'transfer' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unit Bisnis Tujuan Transfer <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={targetUnitId}
                onChange={(e) => setTargetUnitId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Pilih Unit Bisnis Tujuan...</option>
                {businessUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alasan Pelepasan & Justifikasi Bisnis <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan pertimbangan teknis, umur ekonomis habis, rusak berat tak ekonomis diperbaiki, atau restrukturisasi aset..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !assetId || !notes.trim()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30"
              id="btn-submit-disposal"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengajukan Permohonan...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Ajukan Permohonan Pelepasan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
