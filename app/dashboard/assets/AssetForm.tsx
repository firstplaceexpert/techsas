'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload, X, FileText, Tag, Sparkles, QrCode, Boxes, BookOpen } from 'lucide-react'
import { assetSchema, type AssetFormValues } from '@/lib/validations/asset'
import { uploadAssetPhoto, uploadAssetDocument, createAsset, updateAsset, createBulkAssets } from './actions'
import { generateSemanticAssetCode, parseSemanticAssetCode } from '@/lib/utils/asset-code'
import type { AssetCategory, BusinessUnit, Location, Profile, Asset } from '@/types'

interface Props {
  initialData?: Asset
  assetId?: string
  categories: AssetCategory[]
  businessUnits: BusinessUnit[]
  locations: Location[]
  users: Profile[]
  onSubmit?: (values: AssetFormValues) => Promise<{ success: boolean; error?: string }>
  submitLabel?: string
  defaultBusinessUnitId?: string
}

const conditionOptions = [
  { value: 'good', label: 'Baik' },
  { value: 'fair', label: 'Cukup' },
  { value: 'damaged', label: 'Rusak' },
  { value: 'under_repair', label: 'Dalam Perbaikan' },
]

export default function AssetForm({
  initialData, assetId, categories, businessUnits, locations, users, onSubmit, submitLabel = 'Simpan Aset', defaultBusinessUnitId,
}: Props) {
  const router = useRouter()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo_url ?? null)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkQuantity, setBulkQuantity] = useState<number>(50)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      category_id: initialData?.category_id ?? '',
      account_code_asset: initialData?.account_code_asset ?? '',
      account_code_accum: initialData?.account_code_accum ?? '',
      account_code_expense: initialData?.account_code_expense ?? '',
      business_unit_id: initialData?.business_unit_id ?? defaultBusinessUnitId ?? businessUnits[0]?.id ?? '',
      current_location_id: initialData?.current_location_id ?? null,
      current_pic_id: initialData?.current_pic_id ?? null,
      photo_url: initialData?.photo_url ?? '',
      purchase_date: initialData?.purchase_date ?? '',
      purchase_price: initialData?.purchase_price ?? undefined,
      useful_life_months: initialData?.useful_life_months ?? undefined,
      depreciation_method: initialData?.depreciation_method ?? 'straight_line',
      condition: initialData?.condition ?? 'good',
      warranty_until: initialData?.warranty_until ?? '',
      legal_document_url: initialData?.legal_document_url ?? '',
    },
  })

  const selectedBuId = watch('business_unit_id')
  const filteredLocations = locations.filter((l) => l.business_unit_id === selectedBuId)
  const filteredUsers = users.filter(
    (u) => u.business_unit_id === selectedBuId || u.role === 'super_admin' || u.role === 'corporate_admin'
  )

  // Auto-fill useful_life_months and CoA codes from category
  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId)
    if (cat) {
      setValue('useful_life_months', cat.default_useful_life_months)
      setValue('depreciation_method', cat.default_depreciation_method)
      if (cat.account_code_asset) {
        setValue('account_code_asset', cat.account_code_asset)
      }
      if (cat.account_code_accum) {
        setValue('account_code_accum', cat.account_code_accum)
      }
      if (cat.account_code_expense) {
        setValue('account_code_expense', cat.account_code_expense)
      }
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadAssetPhoto(fd)
    if (result.success) {
      setValue('photo_url', result.data)
      setPhotoPreview(result.data)
    } else {
      alert('Upload gagal: ' + result.error)
    }
    setUploadingPhoto(false)
  }

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadAssetDocument(fd)
    if (result.success) {
      setValue('legal_document_url', result.data)
    } else {
      alert('Upload gagal: ' + result.error)
    }
    setUploadingDoc(false)
  }

  const handleFormSubmit = async (values: AssetFormValues) => {
    let result: { success: boolean; error?: string }
    if (onSubmit) {
      result = await onSubmit(values)
    } else if (initialData?.id || assetId) {
      result = await updateAsset(initialData?.id || assetId!, values)
    } else if (isBulkMode && bulkQuantity > 1) {
      const bulkRes = await createBulkAssets(values, bulkQuantity)
      if (!bulkRes.success) {
        setError('root', { message: bulkRes.error })
        return
      }
      router.push('/dashboard/assets/print-labels')
      router.refresh()
      return
    } else {
      result = await createAsset(values)
    }
    if (!result.success) { setError('root', { message: result.error }); return }
    router.push('/dashboard/assets')
    router.refresh()
  }

  const selectedCatId = watch('category_id')
  const selectedLocId = watch('current_location_id')
  const selectedPurchaseDate = watch('purchase_date')

  const selectedBu = businessUnits.find((b) => b.id === selectedBuId)
  const selectedCat = categories.find((c) => c.id === selectedCatId)
  const selectedLoc = locations.find((l) => l.id === selectedLocId)

  const previewCode = initialData?.asset_code || generateSemanticAssetCode({
    businessUnitNameOrType: selectedBu?.name || selectedBu?.type,
    categoryName: selectedCat?.name,
    purchaseDate: selectedPurchaseDate,
    locationName: selectedLoc?.name,
    locationLevel: selectedLoc?.level,
    sequenceNumber: 1,
  })

  const previewCodeEnd = isBulkMode ? generateSemanticAssetCode({
    businessUnitNameOrType: selectedBu?.name || selectedBu?.type,
    categoryName: selectedCat?.name,
    purchaseDate: selectedPurchaseDate,
    locationName: selectedLoc?.name,
    locationLevel: selectedLoc?.level,
    sequenceNumber: bulkQuantity,
  }) : previewCode

  const parsedCode = parseSemanticAssetCode(previewCode)

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* --- BANNER: Standar Kodefikasi Aset Inventaris (EAM Standard) --- */}
      <div className="bg-white rounded-2xl border border-cloud-200 shadow-apple p-5 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-pale-100 border border-mint-200 flex items-center justify-center text-charcoal">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {initialData?.asset_code
                  ? 'Nomor Registrasi Aset Terdaftar'
                  : isBulkMode
                  ? `Rentang Alokasi Nomor Inventaris (${bulkQuantity} Unit)`
                  : 'Kodefikasi Aset Inventaris (Standar EAM)'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2A4416] bg-pale-100 border border-mint-300 px-2 py-0.5 rounded-full">
                ISO 55000 Tag
              </span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-charcoal tracking-wide mt-1">
              {isBulkMode ? `${previewCode} ... ${previewCodeEnd}` : previewCode}
            </div>
          </div>

          {/* Semantic Structure Breakdown Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            <span className="px-2.5 py-1 bg-surface-100 rounded-lg text-slate-600 border border-cloud-200">
              UNIT: <strong className="text-charcoal font-bold">{parsedCode.unitCode}</strong>
            </span>
            <span className="px-2.5 py-1 bg-surface-100 rounded-lg text-slate-600 border border-cloud-200">
              KAT: <strong className="text-charcoal font-bold">{parsedCode.categoryCode}</strong>
            </span>
            <span className="px-2.5 py-1 bg-surface-100 rounded-lg text-slate-600 border border-cloud-200">
              PERIODE: <strong className="text-charcoal font-bold">{parsedCode.yearMonth || 'AUTO'}</strong>
            </span>
            <span className="px-2.5 py-1 bg-surface-100 rounded-lg text-slate-600 border border-cloud-200">
              LOKASI: <strong className="text-charcoal font-bold">{parsedCode.locationCode}</strong>
            </span>
            <span className="px-2.5 py-1 bg-pale-100 rounded-lg text-[#2A4416] border border-mint-300 font-bold">
              {isBulkMode ? `QTY: ${bulkQuantity} Unit` : `URUT: ${parsedCode.sequence}`}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-cloud-100">
          {initialData?.asset_code
            ? 'Format kode register ini menjadi identitas fisik unik aset dan tertaut otomatis pada barcode stiker & label QR.'
            : isBulkMode
            ? `Sistem akan mengalokasikan ${bulkQuantity} nomor register unik berurutan lengkap dengan QR code individual, siap dicetak melalui menu Cetak Label QR.`
            : 'Nomor register inventaris ini otomatis tersusun secara semantik dari Unit Bisnis, Kategori, Periode Pengadaan, dan Lokasi Penempatan.'}
        </p>
      </div>

      {/* --- TOGGLE PENGADAAN MASSAL (BULK CREATION) --- */}
      {!initialData && !assetId && (
        <div className="bg-white border border-cloud-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-apple transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-100 border border-cloud-200 text-charcoal flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-2xs">
              <Boxes className="w-5 h-5 text-charcoal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-charcoal">
                  Mode Registrasi Massal (Bulk Procurement)
                </h4>
                {isBulkMode && (
                  <span className="badge-mint text-[10px]">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Gunakan untuk pengadaan aset berskala banyak sekaligus (contoh: 50 unit stik gaming, 20 set kursi ergonomis, 30 lensa kamera, atau 100 unit GPS armada). Sistem otomatis mengalokasikan nomor urut unik & QR code individual per unit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setIsBulkMode(!isBulkMode)}
              className={isBulkMode ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
            >
              {isBulkMode ? 'Mode Massal Aktif' : 'Aktifkan Mode Massal'}
            </button>
          </div>
        </div>
      )}

      {/* --- PENGATURAN JUMLAH UNIT MASSAL --- */}
      {isBulkMode && !initialData && !assetId && (
        <div className="bg-pale-50/40 border border-mint-300/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Jumlah Pengadaan (Qty Unit) <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500">
                Tentukan berapa unit aset identik yang ingin didaftarkan ke sistem sekaligus.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="2"
                max="1000"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(Math.max(2, Math.min(1000, parseInt(e.target.value, 10) || 2)))}
                className="w-28 text-center text-base font-bold font-mono px-3 py-1.5 border border-cloud-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint-500 bg-white text-charcoal"
              />
              <span className="text-xs font-bold text-slate-700">Unit / Pcs</span>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Pilihan Cepat:</span>
            {[10, 25, 50, 100, 250, 500, 1000].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setBulkQuantity(num)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  bulkQuantity === num
                    ? 'bg-charcoal text-white font-bold'
                    : 'bg-surface-100 text-slate-700 hover:bg-cloud-100 border border-cloud-200'
                }`}
              >
                {num} Pcs
              </button>
            ))}
          </div>

          {/* Summary Box */}
          <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="flex items-center justify-between font-medium">
              <span>Alokasi Kode Unik Aset:</span>
              <span className="font-mono font-bold text-slate-900">
                {previewCode} s/d {previewCodeEnd}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Rekomendasi Cetak Stiker Percetakan:</span>
              <span className="font-semibold text-purple-900">
                {Math.ceil(bulkQuantity / 50)} Lembar Kertas A3+ (Isi 50 sticker per lembar)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION: Info Dasar --- */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Informasi Dasar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="asset-name" className="label">Nama Aset <span className="text-red-500">*</span></label>
            <input id="asset-name" {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Contoh: Sofa Lounge Premium 3-seater" />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="asset-category" className="label mb-0">Kategori / Standar CoA <span className="text-red-500">*</span></label>
              {watch('account_code_asset') && (
                <span className="text-[11px] font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                  CoA: {watch('account_code_asset')}
                </span>
              )}
            </div>
            <select
              id="asset-category"
              {...register('category_id', { onChange: (e) => handleCategoryChange(e.target.value) })}
              className={`input ${errors.category_id ? 'input-error' : ''}`}
            >
              <option value="">— Pilih Kategori / Standar CoA —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.account_code_asset ? `[${c.account_code_asset}] ` : ''}{c.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="field-error">{errors.category_id.message}</p>}
          </div>

          <div>
            <label htmlFor="asset-bu" className="label">Unit Bisnis <span className="text-red-500">*</span></label>
            <select id="asset-bu" {...register('business_unit_id')} className={`input ${errors.business_unit_id ? 'input-error' : ''}`}>
              <option value="">— Pilih unit bisnis —</option>
              {businessUnits.map((bu) => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
            {errors.business_unit_id && <p className="field-error">{errors.business_unit_id.message}</p>}
          </div>

          <div>
            <label htmlFor="asset-location" className="label">Lokasi Awal</label>
            <select id="asset-location" {...register('current_location_id')} className="input">
              <option value="">— Pilih lokasi —</option>
              {filteredLocations.map((l) => <option key={l.id} value={l.id}>[{l.level.toUpperCase()}] {l.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="asset-pic" className="label">PIC (Penanggung Jawab)</label>
            <select id="asset-pic" {...register('current_pic_id')} className="input">
              <option value="">— Pilih PIC —</option>
              {filteredUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.role.replace('_', ' ')})</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="asset-condition" className="label">Kondisi <span className="text-red-500">*</span></label>
            <select id="asset-condition" {...register('condition')} className="input">
              {conditionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="asset-desc" className="label">Deskripsi</label>
            <textarea id="asset-desc" {...register('description')} rows={3} className="input resize-none" placeholder="Spesifikasi, merek, nomor seri, dll." />
          </div>
        </div>
      </div>

      {/* --- SECTION: Foto --- */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Foto Aset</h3>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} id="photo-file-input" />
        <input {...register('photo_url')} type="hidden" />

        <div className="flex items-start gap-4">
          {photoPreview ? (
            <div className="relative group">
              <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-xl object-cover border border-slate-200" />
              <button
                type="button"
                onClick={() => { setPhotoPreview(null); setValue('photo_url', '') }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
              onClick={() => photoInputRef.current?.click()}
            >
              {uploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin text-brand-500" /> : <Upload className="w-6 h-6 text-slate-300" />}
              <span className="text-xs text-slate-400">{uploadingPhoto ? 'Mengupload...' : 'Upload foto'}</span>
            </div>
          )}
          <div className="text-xs text-slate-400 space-y-1 pt-1">
            <p>Format: JPG, PNG, WebP</p>
            <p>Maksimal: 5MB</p>
            <button type="button" onClick={() => photoInputRef.current?.click()} className="btn-secondary btn-sm mt-2" disabled={uploadingPhoto}>
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {photoPreview ? 'Ganti Foto' : 'Pilih Foto'}
            </button>
          </div>
        </div>
      </div>

      {/* --- SECTION: Data Pembelian & Penyusutan --- */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Bagan Akun (CoA) & Kebijakan Akuntansi
          </h3>
          {watch('category_id') && (
            <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium border border-brand-200/60">
              Mengikuti Standar Kategori: {categories.find((c) => c.id === watch('category_id'))?.name}
            </span>
          )}
        </div>

        {/* Panel Konfigurasi CoA yang Otomatis Terisi dan Bisa Diubah Manual */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-800">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <span>Bagan Akun Akuntansi (Chart of Accounts / CoA)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kode akun terisi otomatis dari kategori yang dipilih, namun <strong>dapat Anda ubah manual</strong> sesuai kebijakan sub-akun perusahaan / unit bisnis Anda.
              </p>
            </div>
            {watch('account_code_asset') && (
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white border border-brand-200 text-brand-700 font-bold shadow-sm whitespace-nowrap">
                Aktif: {watch('account_code_asset')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div>
              <label htmlFor="asset-coa" className="text-xs font-semibold text-slate-700 block mb-1">
                Kode Akun Aset Tetap (CoA)
              </label>
              <input
                id="asset-coa"
                {...register('account_code_asset')}
                placeholder="Contoh: 1-1201 atau 1-1201.01"
                className="input text-xs font-mono font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Akun neraca aset (debit saat beli)</span>
            </div>

            <div>
              <label htmlFor="asset-coa-accum" className="text-xs font-medium text-slate-700 block mb-1">
                Akun Akumulasi Penyusutan
              </label>
              <input
                id="asset-coa-accum"
                {...register('account_code_accum')}
                placeholder="Contoh: 1-1202"
                className="input text-xs font-mono font-medium text-slate-800 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Kontra akun aset (kredit)</span>
            </div>

            <div>
              <label htmlFor="asset-coa-expense" className="text-xs font-medium text-slate-700 block mb-1">
                Akun Beban Penyusutan
              </label>
              <input
                id="asset-coa-expense"
                {...register('account_code_expense')}
                placeholder="Contoh: 5-2101"
                className="input text-xs font-mono font-medium text-slate-800 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Akun laba rugi beban (debit jurnal)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="asset-purchase-date" className="label">Tanggal Pembelian</label>
            <input id="asset-purchase-date" type="date" {...register('purchase_date')} className="input" />
          </div>
          <div>
            <label htmlFor="asset-price" className="label">Harga Perolehan (Rp) <span className="text-red-500">*</span></label>
            <input id="asset-price" type="number" min={0} step={1000} {...register('purchase_price', { valueAsNumber: true })} className="input font-mono" placeholder="0" />
            {errors.purchase_price && <p className="field-error">{errors.purchase_price.message}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="asset-life" className="label mb-0">Umur Ekonomis (bulan) <span className="text-red-500">*</span></label>
              <span className="text-xs text-slate-400 font-mono">
                {watch('useful_life_months') ? `(${(Number(watch('useful_life_months')) / 12).toFixed(1)} Tahun)` : ''}
              </span>
            </div>
            <input id="asset-life" type="number" min={1} {...register('useful_life_months', { valueAsNumber: true })} className="input font-mono" />
            {errors.useful_life_months && <p className="field-error">{errors.useful_life_months.message}</p>}
          </div>
          <div>
            <label htmlFor="asset-dep-method" className="label">Metode Penyusutan</label>
            <select id="asset-dep-method" {...register('depreciation_method')} className="input">
              <option value="straight_line">Garis Lurus (Straight Line) — Standar</option>
              <option value="declining_balance">Saldo Menurun (Declining Balance)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="asset-warranty" className="label">Masa Garansi Pabrik Hingga</label>
            <input id="asset-warranty" type="date" {...register('warranty_until')} className="input" />
          </div>
        </div>

        {/* Live Accounting Depreciation Preview Box */}
        {Number(watch('purchase_price')) > 0 && Number(watch('useful_life_months')) > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-brand-50/30 rounded-xl border border-brand-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Simulasi Perhitungan Akuntansi Otomatis:
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Metode: {watch('depreciation_method') === 'declining_balance' ? 'Saldo Menurun Ganda' : 'Garis Lurus'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                <span className="text-slate-400 block text-[11px]">Beban Penyusutan / Bulan:</span>
                <span className="font-bold text-brand-700 font-mono text-sm">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                    Math.round(Number(watch('purchase_price')) / Number(watch('useful_life_months')))
                  )}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                <span className="text-slate-400 block text-[11px]">Beban Penyusutan / Tahun:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                    Math.round((Number(watch('purchase_price')) / Number(watch('useful_life_months'))) * 12)
                  )}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                <span className="text-slate-400 block text-[11px]">Nilai Buku Akhir Thn ke-1:</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                    Math.max(0, Math.round(Number(watch('purchase_price')) - ((Number(watch('purchase_price')) / Number(watch('useful_life_months'))) * 12)))
                  )}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Nilai ini langsung disinkronkan ke generator jurnal penyesuaian bulanan untuk tim akuntansi.
            </p>
          </div>
        )}
      </div>

      {/* --- SECTION: Dokumen Legal --- */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Dokumen Legal</h3>
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={handleDocUpload} id="doc-file-input" />
        <input {...register('legal_document_url')} type="hidden" />
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => docInputRef.current?.click()} className="btn-secondary" disabled={uploadingDoc}>
            {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {uploadingDoc ? 'Mengupload...' : 'Upload Dokumen'}
          </button>
          {watch('legal_document_url') && (
            <a href={watch('legal_document_url') ?? ''} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Lihat Dokumen
            </a>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">Format: PDF, DOC, DOCX, JPG, PNG. Maksimal 10MB.</p>
      </div>

      {errors.root && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errors.root.message}</div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg" id="asset-form-submit">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
            </>
          ) : isBulkMode && !initialData && !assetId ? (
            `Daftarkan & Buat ${bulkQuantity} Label Aset Sekaligus`
          ) : (
            submitLabel
          )}
        </button>
        <button type="button" onClick={() => router.push('/dashboard/assets')} className="btn-secondary btn-lg">Batal</button>
      </div>
    </form>
  )
}
