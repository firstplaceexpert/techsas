'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Truck,
  Wrench,
  DollarSign,
  Clock,
  Box,
} from 'lucide-react'
import type {
  AssetListItem,
  Vendor,
  WorkOrderPriority,
  WorkOrderMaintenanceType,
} from '@/types'
import { createWorkOrder, type CreateWorkOrderInput } from '../actions'

interface Props {
  assets: AssetListItem[]
  vendors: Vendor[]
  preselectedAssetId?: string
}

interface PartItem {
  part_name: string
  part_code: string
  quantity: number
  unit_cost: number
  source: 'inventory' | 'vendor' | 'cannibalized'
  notes: string
}

function formatRupiah(n?: number | null) {
  if (n == null || n === 0) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function WorkOrderForm({ assets, vendors, preselectedAssetId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [assetId, setAssetId] = useState(preselectedAssetId || (assets[0]?.id || ''))
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<WorkOrderPriority>('medium')
  const [maintenanceType, setMaintenanceType] = useState<WorkOrderMaintenanceType>('corrective')
  const [vendorId, setVendorId] = useState('')
  const [slaHours, setSlaHours] = useState(48)
  const [laborCost, setLaborCost] = useState(0)
  const [notes, setNotes] = useState('')

  // Dynamic spare parts
  const [parts, setParts] = useState<PartItem[]>([])

  function handlePriorityChange(newPrio: WorkOrderPriority) {
    setPriority(newPrio)
    if (newPrio === 'emergency') setSlaHours(12)
    else if (newPrio === 'high') setSlaHours(24)
    else if (newPrio === 'medium') setSlaHours(48)
    else if (newPrio === 'low') setSlaHours(72)
  }

  function handleAddPart() {
    setParts([
      ...parts,
      {
        part_name: '',
        part_code: '',
        quantity: 1,
        unit_cost: 0,
        source: 'vendor',
        notes: '',
      },
    ])
  }

  function handleRemovePart(index: number) {
    setParts(parts.filter((_, i) => i !== index))
  }

  function handleUpdatePart(index: number, field: keyof PartItem, value: any) {
    const next = [...parts]
    next[index] = { ...next[index], [field]: value }
    setParts(next)
  }

  const partsTotalCost = parts.reduce((sum, p) => sum + (p.quantity * (p.unit_cost || 0)), 0)
  const grandTotalCost = (laborCost || 0) + partsTotalCost

  const selectedAsset = assets.find((a) => a.id === assetId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!title.trim()) {
      setError('Judul Work Order wajib diisi')
      setLoading(false)
      return
    }

    if (!assetId) {
      setError('Aset target wajib dipilih')
      setLoading(false)
      return
    }

    const input: CreateWorkOrderInput = {
      asset_id: assetId,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      maintenance_type: maintenanceType,
      vendor_id: vendorId || null,
      sla_target_hours: slaHours,
      labor_cost: laborCost || 0,
      parts_cost: partsTotalCost,
      notes: notes.trim() || null,
      parts: parts
        .filter((p) => p.part_name.trim().length > 0)
        .map((p) => ({
          part_name: p.part_name.trim(),
          part_code: p.part_code.trim() || undefined,
          quantity: Number(p.quantity) || 1,
          unit_cost: Number(p.unit_cost) || 0,
          source: p.source,
          notes: p.notes.trim() || undefined,
        })),
    }

    try {
      const res = await createWorkOrder(input)
      if (!res.success) {
        setError(res.error || 'Gagal membuat Work Order')
        setLoading(false)
        return
      }

      router.push(`/dashboard/work-orders/${res.data?.id}`)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Asset Selection Card */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Box className="w-5 h-5 text-brand-600" />
          1. Pilih Aset Target
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Aset yang Mengalami Masalah / Perlu Pemeliharaan <span className="text-rose-500">*</span>
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="input w-full text-sm"
              required
            >
              <option value="">-- Pilih Aset --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.asset_code} — {a.name} ({a.business_unit?.name || 'Unit'})
                </option>
              ))}
            </select>
          </div>

          {selectedAsset && (
            <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100 text-xs">
              <div>
                <p className="font-semibold text-slate-800">{selectedAsset.name}</p>
                <p className="text-slate-400 font-mono mt-0.5">
                  Kode: {selectedAsset.asset_code} • Lokasi: {selectedAsset.current_location?.name || '-'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                Kondisi saat ini: {selectedAsset.condition}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Work Order Details Card */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-brand-600" />
          2. Rincian Pekerjaan & Prioritas
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Perintah Kerja (Work Order) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Perbaikan Kompresor AC Kamar 304 Tidak Dingin"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipe Pemeliharaan
              </label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value as WorkOrderMaintenanceType)}
                className="input w-full text-xs"
              >
                <option value="corrective">Korektif (Perbaikan Kerusakan)</option>
                <option value="preventive">Preventif (Jadwal Rutin)</option>
                <option value="emergency">Darurat (Emergency Breakdown)</option>
                <option value="inspection">Inspeksi Teknis Fisik</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value as WorkOrderPriority)}
                className="input w-full text-xs"
              >
                <option value="emergency">EMERGENCY (Penanganan Segera &lt; 12 Jam)</option>
                <option value="high">Tinggi (&lt; 24 Jam)</option>
                <option value="medium">Sedang (&lt; 48 Jam)</option>
                <option value="low">Rendah (&lt; 72 Jam)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Masalah / Instruksi Pekerjaan
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan detail gejala kerusakan, riwayat insiden, atau instruksi khusus untuk teknisi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-500" />
                Mitra Vendor / Teknisi Eksternal (Opsional)
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="input w-full text-xs"
              >
                <option value="">-- Tim Internal Maintenance --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category} • Rating {v.rating || 5}/5)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Target Waktu Selesai (SLA dalam Jam)
              </label>
              <input
                type="number"
                min={1}
                value={slaHours}
                onChange={(e) => setSlaHours(Number(e.target.value))}
                className="input w-full text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suku Cadang & Biaya Card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-600" />
            3. Estimasi Biaya & Suku Cadang (Parts)
          </h2>
          <button
            type="button"
            onClick={handleAddPart}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Suku Cadang
          </button>
        </div>

        {/* Spare Parts List */}
        {parts.length > 0 && (
          <div className="space-y-3 pt-2">
            {parts.map((part, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Item Part #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePart(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Suku Cadang
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Freon R410A / Filter Oli"
                      value={part.part_name}
                      onChange={(e) => handleUpdatePart(idx, 'part_name', e.target.value)}
                      className="input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kode Part / Part No.
                    </label>
                    <input
                      type="text"
                      placeholder="P/N-12345"
                      value={part.part_code}
                      onChange={(e) => handleUpdatePart(idx, 'part_code', e.target.value)}
                      className="input w-full text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jumlah (Qty)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={part.quantity}
                      onChange={(e) => handleUpdatePart(idx, 'quantity', Number(e.target.value))}
                      className="input w-full text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Harga Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={part.unit_cost}
                      onChange={(e) => handleUpdatePart(idx, 'unit_cost', Number(e.target.value))}
                      className="input w-full text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px]">Asal Part:</span>
                    <select
                      value={part.source}
                      onChange={(e) => handleUpdatePart(idx, 'source', e.target.value)}
                      className="input text-[11px] py-1 px-2"
                    >
                      <option value="vendor">Beli dari Vendor</option>
                      <option value="inventory">Stok Gudang Sendiri</option>
                      <option value="cannibalized">Kanibal Aset Bekas (Reused)</option>
                    </select>
                  </div>
                  <div className="font-mono font-semibold text-slate-800">
                    Subtotal: {formatRupiah(part.quantity * (part.unit_cost || 0))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cost Summary Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimasi Biaya Jasa / Tenaga Kerja (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                placeholder="0"
                className="input w-full text-xs font-mono"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Total Estimasi Biaya:</span>
                <span className="text-sm font-bold text-brand-700 font-mono">
                  {formatRupiah(grandTotalCost)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Tambahan
          </label>
          <textarea
            rows={2}
            placeholder="Informasi garansi part, syarat serah terima, dll..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full text-xs"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard/work-orders" className="btn btn-secondary text-xs flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Batal
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary text-xs flex items-center gap-1.5 shadow-sm px-6"
        >
          <ClipboardList className="w-4 h-4" />
          {loading ? 'Menerbitkan...' : 'Terbitkan Work Order'}
        </button>
      </div>
    </form>
  )
}
