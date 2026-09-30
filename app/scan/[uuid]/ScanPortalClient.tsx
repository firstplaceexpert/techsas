'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Building2,
  MapPin,
  Tag,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Wrench,
  Clock,
  QrCode,
  ArrowLeft,
  Camera,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Info,
  Lock,
  ExternalLink,
  DollarSign,
  Calendar,
  UserCheck,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react'
import {
  submitPublicIssueReport,
  updateAssetConditionQuick,
  recordQuickInspection,
  type PublicAssetInfo,
  type PublicIssueReportResult,
  type LoggedInStaffInfo,
  type AdminAssetDetails,
} from '../actions'
import { parseSemanticAssetCode } from '@/lib/utils/asset-code'

const ISSUE_CATEGORIES = [
  { id: 'ac', label: 'AC & Sistem Pendingin' },
  { id: 'electrical', label: 'Kelistrikan & Penerangan' },
  { id: 'plumbing', label: 'Saluran Air & Plumbing' },
  { id: 'furniture', label: 'Mebel, Furnitur & Interior' },
  { id: 'fixtures', label: 'Pintu, Jendela & Kunci' },
  { id: 'other', label: 'Lainnya / Kendala Operasional' },
]

function formatRupiah(amount: number | null | undefined) {
  if (amount == null) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'corporate_admin':
      return 'Corporate Admin'
    case 'unit_admin':
      return 'Admin Unit'
    case 'field_officer':
      return 'Field Officer'
    default:
      return 'Staf TECHSAS'
  }
}

export default function ScanPortalClient({
  asset,
  currentUser,
}: {
  asset: PublicAssetInfo & { adminDetails?: AdminAssetDetails | null }
  currentUser?: LoggedInStaffInfo | null
}) {
  const [viewMode, setViewMode] = useState<'info' | 'report'>('info')

  const parsedCode = parseSemanticAssetCode(asset.asset_code)

  // Dynamic Condition State for Admin Quick Updates
  const [currentCondition, setCurrentCondition] = useState(asset.condition)
  const [isUpdatingCondition, setIsUpdatingCondition] = useState(false)
  const [conditionSuccessMessage, setConditionSuccessMessage] = useState<string | null>(null)

  // Inspection State for Staff
  const [isInspecting, setIsInspecting] = useState(false)
  const [inspectionSuccess, setInspectionSuccess] = useState<string | null>(null)

  // Form State
  const [reporterName, setReporterName] = useState(currentUser?.fullName || '')
  const [urgency, setUrgency] = useState<'urgent' | 'medium' | 'low'>('urgent')
  const [category, setCategory] = useState('ac')
  const [description, setDescription] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketResult, setTicketResult] = useState<PublicIssueReportResult | null>(null)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const conditionLabels: Record<string, { label: string; color: string; icon: any }> = {
    good: {
      label: 'Kondisi Prima',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle,
    },
    fair: {
      label: 'Kondisi Cukup',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
    },
    damaged: {
      label: 'Kondisi Rusak',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: AlertTriangle,
    },
    under_repair: {
      label: 'Dalam Perbaikan',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: Wrench,
    },
  }

  const condition = conditionLabels[currentCondition] || {
    label: currentCondition,
    color: 'bg-stone-100 text-stone-700 border-stone-200',
    icon: HelpCircle,
  }

  const ConditionIcon = condition.icon

  const handleQuickConditionChange = async (newCond: 'good' | 'fair' | 'damaged' | 'under_repair') => {
    if (newCond === currentCondition || isUpdatingCondition) return
    setIsUpdatingCondition(true)
    setConditionSuccessMessage(null)
    setError(null)

    const res = await updateAssetConditionQuick(asset.id, newCond)
    setIsUpdatingCondition(false)

    if (res.success) {
      setCurrentCondition(newCond)
      setConditionSuccessMessage(`Kondisi aset berhasil diperbarui ke "${conditionLabels[newCond]?.label || newCond}"`)
      setTimeout(() => setConditionSuccessMessage(null), 3500)
    } else {
      setError(res.error || 'Gagal mengubah kondisi aset')
    }
  }

  const handleQuickInspection = async () => {
    if (isInspecting) return
    setIsInspecting(true)
    setInspectionSuccess(null)
    setError(null)

    const res = await recordQuickInspection(asset.id)
    setIsInspecting(false)

    if (res.success) {
      setInspectionSuccess(`Verifikasi fisik berhasil disimpan pada ${res.data.timestamp}`)
      setTimeout(() => setInspectionSuccess(null), 4000)
    } else {
      setError(res.error || 'Gagal mencatat inspeksi')
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, atau WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file foto maksimal 5 MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const selectedCategoryObj = ISSUE_CATEGORIES.find((c) => c.id === category)
    const categoryName = selectedCategoryObj ? selectedCategoryObj.label : 'Umum'

    const res = await submitPublicIssueReport({
      assetId: asset.id,
      reporterName: reporterName.trim() || (currentUser?.fullName ?? 'Tamu / Pengunjung Lapangan'),
      issueType: 'corrective',
      urgency,
      category: categoryName,
      description,
      photoDataUrl: photoPreview || undefined,
    })

    setLoading(false)

    if (res.success) {
      setTicketResult(res.data)
      if (urgency === 'urgent') {
        setCurrentCondition('under_repair')
      }
    } else {
      setError(res.error || 'Gagal mengirim laporan pengaduan. Silakan periksa kembali.')
    }
  }

  const handleCopyTicket = () => {
    if (!ticketResult) return
    navigator.clipboard.writeText(ticketResult.ticketNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setTicketResult(null)
    setError(null)
    setDescription('')
    setReporterName(currentUser?.fullName || '')
    setPhotoPreview(null)
    setUrgency('urgent')
    setCategory('ac')
    setViewMode('info')
  }

  return (
    <main className="min-h-screen sm:h-screen relative flex flex-col justify-center items-center p-2 sm:p-3 bg-stone-900 overflow-y-auto sm:overflow-hidden">
      {/* Background Grand Ballroom TECHSAS */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/images/background.jpg')` }}
      >
        <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]" />
      </div>

      {/* Main Card Container */}
      <div className="max-w-md w-full my-auto relative z-10 max-h-[96vh] overflow-y-auto rounded-3xl shadow-2xl">
        <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
          
          {/* STAFF PRO ACTIVE BANNER (Only shown when logged in) */}
          {currentUser && (
            <div className="bg-gradient-to-r from-amber-700 via-stone-900 to-amber-800 text-white px-4 py-2 flex items-center justify-between text-[11px] border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div>
                  <span className="font-bold text-amber-300">Mode Staf Terverifikasi: </span>
                  <span className="text-stone-200 font-medium">
                    {currentUser.fullName} ({getRoleBadge(currentUser.role)})
                  </span>
                </div>
              </div>
              <Link
                href={`/dashboard/assets/${asset.id}`}
                className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition-colors"
              >
                Dashboard <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Top Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-stone-50 via-white to-stone-50 border-b border-stone-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                <Image
                  src="/favicon.png"
                  alt="TECHSAS"
                  width={32}
                  height={32}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h2 className="text-xs font-bold text-stone-900 tracking-wide font-serif">
                  TECHSAS ASSET HUB
                </h2>
                <p className="text-[10px] text-stone-500 font-medium">Portal Layanan & Verifikasi Aset</p>
              </div>
            </div>

            {viewMode === 'info' ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Terverifikasi
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('info')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>
            )}
          </div>

          {/* Toast / Notification Messages */}
          {conditionSuccessMessage && (
            <div className="m-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{conditionSuccessMessage}</span>
            </div>
          )}

          {inspectionSuccess && (
            <div className="m-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <ClipboardCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{inspectionSuccess}</span>
            </div>
          )}

          {/* VIEW 1: ASSET INFO */}
          {viewMode === 'info' && (
            <div className="animate-fade-in">
              {/* Asset Photo / Graphic Placeholder */}
              {asset.photo_url ? (
                <div className="w-full h-44 sm:h-48 relative bg-stone-100 border-b border-stone-100">
                  <img
                    src={asset.photo_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                      {asset.asset_code}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-28 bg-gradient-to-br from-stone-50 via-brand-50/20 to-stone-100 flex flex-col items-center justify-center text-brand-700/60 border-b border-stone-100 p-2">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-brand-200/60 flex items-center justify-center text-brand-600 shadow-xs mb-1">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-stone-700 bg-white px-2.5 py-0.5 rounded-lg border border-stone-200">
                    {asset.asset_code}
                  </span>
                </div>
              )}

              {/* Content Body */}
              <div className="p-4 sm:p-5 space-y-3.5">
                {/* Title & Status Badges */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold border px-2.5 py-0.5 rounded-lg ${condition.color}`}>
                      <ConditionIcon className="w-3 h-3" />
                      {condition.label}
                    </span>
                    <span className="text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-0.5 rounded-lg">
                      Status: {asset.status === 'active' ? 'Aktif' : asset.status}
                    </span>
                  </div>

                  <h1 className="text-base sm:text-lg font-bold text-stone-900 leading-snug font-serif">
                    {asset.name}
                  </h1>
                  {asset.description && (
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                      {asset.description}
                    </p>
                  )}
                </div>

                {/* Nomor Registrasi Aset Semantic Code Breakdown Card */}
                {parsedCode.isSemantic && (
                  <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                        <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider font-serif">
                          Struktur Registrasi Aset (EAM Tag)
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-black text-stone-900 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                        {asset.asset_code}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
                      <div className="bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
                        <span className="block font-black text-brand-800 text-[11px]">
                          {parsedCode.unitCode}
                        </span>
                        <span className="text-[8px] text-stone-400 font-sans font-semibold">UNIT</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
                        <span className="block font-black text-amber-800 text-[11px]">
                          {parsedCode.categoryCode}
                        </span>
                        <span className="text-[8px] text-stone-400 font-sans font-semibold">KAT</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
                        <span className="block font-black text-blue-800 text-[11px]">
                          {parsedCode.yearMonth}
                        </span>
                        <span className="text-[8px] text-stone-400 font-sans font-semibold">YYMM</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
                        <span className="block font-black text-emerald-800 text-[11px]">
                          {parsedCode.locationCode}
                        </span>
                        <span className="text-[8px] text-stone-400 font-sans font-semibold">LOK</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
                        <span className="block font-black text-purple-800 text-[11px]">
                          {parsedCode.sequence}
                        </span>
                        <span className="text-[8px] text-stone-400 font-sans font-semibold">URUT</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details Grid (Public Safe Info) */}
                <div className="bg-stone-50/90 p-3 rounded-2xl border border-stone-200/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-stone-200/70">
                    <span className="text-stone-500 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-brand-600" /> Unit Bisnis
                    </span>
                    <span className="font-semibold text-stone-800 text-right">
                      {asset.business_unit?.name || 'TECHSAS'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-stone-200/70">
                    <span className="text-stone-500 flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-600" /> Kategori
                    </span>
                    <span className="font-semibold text-stone-800">
                      {asset.category?.name || 'Umum'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-stone-500 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> Lokasi Penempatan
                    </span>
                    <span className="font-semibold text-stone-800 text-right">
                      {asset.current_location?.name || 'Area Terdata'}
                    </span>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* SPECIAL STAFF ONLY SECTIONS (FINANCIAL & QUICK ACTIONS) */}
                {/* ======================================================== */}
                {currentUser && asset.adminDetails && (
                  <div className="space-y-3 pt-1">
                    {/* Financial Box */}
                    <div className="bg-gradient-to-br from-amber-500/10 via-brand-500/5 to-stone-50 p-3.5 rounded-2xl border border-amber-400/30 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-amber-300/40 pb-1.5">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5 font-serif">
                          <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                          Data Finansial & Akuntansi (Khusus Staf)
                        </span>
                        <span className="text-[10px] bg-amber-200/60 text-amber-900 font-semibold px-2 py-0.5 rounded-md">
                          Internal Only
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-white/80 p-2 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] text-stone-500 block">Harga Perolehan Asli</span>
                          <span className="font-bold text-stone-900 font-mono text-xs">
                            {formatRupiah(asset.adminDetails.purchase_price)}
                          </span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] text-stone-500 block">Nilai Buku Saat Ini</span>
                          <span className="font-bold text-brand-700 font-mono text-xs">
                            {formatRupiah(asset.adminDetails.current_book_value)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-stone-600 space-y-1 pt-1">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Masa Manfaat & Metode:</span>
                          <span className="font-medium text-stone-800">
                            {asset.adminDetails.useful_life_months ? `${asset.adminDetails.useful_life_months} Bulan` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Garansi Pabrikan:</span>
                          <span className="font-medium text-stone-800">
                            {asset.adminDetails.warranty_until || 'Tidak ada garansi aktif'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">PIC Penanggung Jawab:</span>
                          <span className="font-medium text-stone-800">
                            {asset.adminDetails.current_pic_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Staff Field Quick Actions */}
                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Aksi Cepat Petugas Lapangan
                        </span>
                        {isUpdatingCondition && (
                          <span className="text-[10px] text-stone-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                          </span>
                        )}
                      </div>

                      {/* Quick Condition Pills */}
                      <div>
                        <span className="text-[10px] font-semibold text-stone-500 block mb-1">
                          Ubah Status Kondisi Langsung:
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {(['good', 'fair', 'damaged', 'under_repair'] as const).map((condKey) => {
                            const isSelected = currentCondition === condKey
                            return (
                              <button
                                key={condKey}
                                type="button"
                                disabled={isUpdatingCondition}
                                onClick={() => handleQuickConditionChange(condKey)}
                                className={`py-1.5 px-1 rounded-xl text-center text-[10px] font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-stone-900 text-white shadow-xs'
                                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                                }`}
                              >
                                {condKey === 'good' && 'Prima'}
                                {condKey === 'fair' && 'Cukup'}
                                {condKey === 'damaged' && 'Rusak'}
                                {condKey === 'under_repair' && 'Perbaikan'}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Quick Opname Inspection */}
                      <button
                        type="button"
                        onClick={handleQuickInspection}
                        disabled={isInspecting}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-2 px-3 rounded-xl shadow-xs transition-colors text-xs"
                      >
                        {isInspecting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Merekam Inspeksi...
                          </>
                        ) : (
                          <>
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            Catat Verifikasi Fisik Aset Hari Ini (Opname)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Report Issue Button (Available for Both Public and Staff) */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('report')}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-4 rounded-2xl shadow-sm hover:shadow transition-all active:scale-[0.99] text-xs tracking-wide"
                  >
                    <Wrench className="w-4 h-4" />
                    Laporkan Kerusakan / Kendala Aset
                  </button>
                  <p className="text-[10px] text-stone-400 text-center mt-1.5 leading-relaxed">
                    Menemukan kendala fisik? Tekan tombol di atas untuk meneruskan laporan ke tim Engineering.
                  </p>
                </div>


              </div>
            </div>
          )}

          {/* VIEW 2: DAMAGE REPORT FORM */}
          {viewMode === 'report' && (
            <div className="p-4 sm:p-5 animate-fade-in text-stone-800">
              {ticketResult ? (
                /* Success Screen */
                <div className="py-2 text-center space-y-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full uppercase tracking-wider mb-1">
                      Laporan Berhasil Terdaftar
                    </span>
                    <h3 className="text-base font-extrabold text-stone-900 font-serif">
                      Tiket Aduan Diterbitkan
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5 max-w-xs mx-auto leading-relaxed">
                      Laporan kerusakan aset <b>{asset.name}</b> telah diteruskan ke sistem penugasan teknisi <b>{asset.business_unit?.name || 'TECHSAS'}</b>.
                    </p>
                  </div>

                  {/* Ticket Summary Box */}
                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                      <span className="text-stone-500 font-medium">Nomor Tiket Aduan:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200">
                        <span>{ticketResult.ticketNumber}</span>
                        <button
                          type="button"
                          onClick={handleCopyTicket}
                          title="Salin Nomor Tiket"
                          className="hover:text-brand-900 transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-stone-600 pt-0.5">
                      <span>Kode Aset Terlapor:</span>
                      <span className="font-mono font-semibold text-stone-800">{asset.asset_code}</span>
                    </div>

                    <div className="flex items-center justify-between text-stone-600">
                      <span>Waktu Registrasi:</span>
                      <span className="font-medium text-stone-800">
                        {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                  </div>

                  {/* Status Konfirmasi Masuk Sistem Otomatis */}
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-left flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-snug">
                      <p className="font-bold text-emerald-950">Laporan Telah Masuk ke Sistem</p>
                      <p className="text-emerald-800 mt-0.5">
                        Laporan telah tersinkronisasi otomatis ke dashboard penugasan tim Engineering & Operasional TECHSAS.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors shadow-xs"
                    >
                      Selesai & Kembali ke Informasi Aset
                    </button>
                  </div>
                </div>
              ) : (
                /* Report Form */
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {/* Form Title Banner */}
                  <div className="pb-1.5 border-b border-stone-100">
                    <h3 className="text-sm font-bold text-stone-900 font-serif">
                      Pengaduan Kendala Aset
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      {asset.name} &bull; <span className="font-mono text-brand-700 font-bold">{asset.asset_code}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* 1. Tingkat Urgensi */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Tingkat Urgensi Penanganan <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100/80 rounded-2xl border border-stone-200/80">
                      <button
                        type="button"
                        onClick={() => setUrgency('urgent')}
                        className={`py-2 px-2 rounded-xl text-center transition-all flex flex-col items-center justify-center ${
                          urgency === 'urgent'
                            ? 'bg-red-600 text-white font-bold shadow-md ring-2 ring-red-400/40'
                            : 'text-stone-700 hover:bg-white hover:text-red-700 font-semibold'
                        }`}
                      >
                        <span className="text-xs leading-none">Darurat / Kritis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUrgency('medium')}
                        className={`py-2 px-2 rounded-xl text-center transition-all flex flex-col items-center justify-center ${
                          urgency === 'medium'
                            ? 'bg-amber-600 text-white font-bold shadow-md ring-2 ring-amber-400/40'
                            : 'text-stone-700 hover:bg-white hover:text-amber-800 font-semibold'
                        }`}
                      >
                        <span className="text-xs leading-none">Sedang</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUrgency('low')}
                        className={`py-2 px-2 rounded-xl text-center transition-all flex flex-col items-center justify-center ${
                          urgency === 'low'
                            ? 'bg-stone-700 text-white font-bold shadow-md ring-2 ring-stone-400/40'
                            : 'text-stone-700 hover:bg-white hover:text-stone-900 font-semibold'
                        }`}
                      >
                        <span className="text-xs leading-none">Ringan</span>
                      </button>
                    </div>

                    <div className="mt-1.5 min-h-[38px] flex items-center">
                      {urgency === 'urgent' && (
                        <div className="w-full py-1.5 px-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-[11px] leading-normal flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                          <span>
                            <strong className="font-bold">Prioritas Darurat:</strong> Penanganan segera untuk fasilitas & operasional.
                          </span>
                        </div>
                      )}

                      {urgency === 'medium' && (
                        <div className="w-full py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-normal flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>
                            <strong className="font-bold">Prioritas Sedang:</strong> Penanganan standar dalam antrean teknisi harian.
                          </span>
                        </div>
                      )}

                      {urgency === 'low' && (
                        <div className="w-full py-1.5 px-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-[11px] leading-normal flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 text-stone-600 flex-shrink-0" />
                          <span>
                            <strong className="font-bold">Prioritas Ringan:</strong> Penanganan berkala untuk pemeliharaan estetika.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Kategori Kendala */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Kategori Kendala <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/70 focus:outline-none focus:ring-2 focus:ring-brand-400 text-stone-800 font-medium cursor-pointer"
                    >
                      {ISSUE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Identitas Pelapor */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Nama / Identitas Pelapor <span className="text-stone-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Contoh: Tamu Kamar 302, Pengunjung, atau Staf F&B"
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-stone-50/60 text-stone-800"
                    />
                  </div>

                  {/* 4. Foto Lampiran Kerusakan */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />

                    {photoPreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50 h-28 flex items-center justify-center">
                        <img
                          src={photoPreview}
                          alt="Preview kerusakan"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-lg shadow hover:bg-red-700 transition-colors"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-stone-300 hover:border-brand-400 bg-stone-50/70 hover:bg-brand-50/20 text-stone-700 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-brand-600" />
                        Lampirkan Foto Bukti Kerusakan (Opsional)
                      </button>
                    )}
                  </div>

                  {/* 5. Deskripsi Kerusakan */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Deskripsi Kerusakan / Kendala <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Jelaskan detail bagian mana yang rusak, bunyi aneh, bocor, dsb..."
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-stone-50/50"
                    />
                  </div>

                  {/* Tombol Aksi */}
                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('info')}
                      className="py-2.5 px-4 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow transition-all disabled:opacity-50 text-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Memproses Tiket...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Kirim Tiket Pengaduan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-white/90 pt-2 drop-shadow-sm">
          <p className="font-medium font-serif text-white tracking-wide">
            TECHSAS Asset Management System
          </p>
        </div>
      </div>
    </main>
  )
}
