'use client'

import { useState, useRef } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  X,
  Wrench,
  ShieldAlert,
  Camera,
  Trash2,
  Copy,
  Check,
  PhoneCall,
  Flame,
  Clock,
  Sparkles,
  Zap,
  Droplets,
  Armchair,
  DoorClosed,
  HelpCircle,
} from 'lucide-react'
import { submitPublicIssueReport, type PublicIssueReportResult } from '../actions'

const ISSUE_CATEGORIES = [
  { id: 'ac', label: 'AC & Pendingin', icon: Sparkles },
  { id: 'electrical', label: 'Listrik & Elektronik', icon: Zap },
  { id: 'plumbing', label: 'Air & Plumbing', icon: Droplets },
  { id: 'furniture', label: 'Fisik & Furnitur', icon: Armchair },
  { id: 'fixtures', label: 'Pintu, Kusen & Kunci', icon: DoorClosed },
  { id: 'other', label: 'Kendala Lainnya', icon: HelpCircle },
]

export default function ReportIssueModal({
  assetId,
  assetName,
  assetCode,
  businessUnitName,
}: {
  assetId: string
  assetName: string
  assetCode: string
  businessUnitName?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [reporterName, setReporterName] = useState('')
  const [reporterContact, setReporterContact] = useState('')
  const [urgency, setUrgency] = useState<'urgent' | 'medium' | 'low'>('medium')
  const [category, setCategory] = useState('ac')
  const [description, setDescription] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketResult, setTicketResult] = useState<PublicIssueReportResult | null>(null)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG/PNG/WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5 MB')
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
      assetId,
      reporterName,
      reporterContact,
      issueType: 'corrective',
      urgency,
      category: categoryName,
      description,
      photoDataUrl: photoPreview || undefined,
    })

    setLoading(false)

    if (res.success) {
      setTicketResult(res.data)
    } else {
      setError(res.error || 'Gagal mengirim laporan. Silakan coba lagi.')
    }
  }

  const handleCopyTicket = () => {
    if (!ticketResult?.ticketNumber) return
    navigator.clipboard.writeText(ticketResult.ticketNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      setTicketResult(null)
      setError(null)
      setDescription('')
      setReporterName('')
      setReporterContact('')
      setPhotoPreview(null)
      setUrgency('medium')
      setCategory('ac')
    }, 300)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold py-3.5 px-5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] group text-sm"
      >
        <ShieldAlert className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" />
        Laporkan Kerusakan / Kendala Aset
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] border border-stone-100">
            {/* Modal Header */}
            <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-serif">
                    Form Pengaduan Kerusakan Aset
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {assetName} &bull; <span className="font-mono text-brand-300">{assetCode}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 text-stone-800">
              {ticketResult ? (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                      Aduan Berhasil Didaftarkan
                    </span>
                    <h4 className="text-lg font-extrabold text-stone-900 font-serif">
                      Tiket Kerusakan Diterbitkan!
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      Laporan kerusakan aset <b>{assetName}</b> telah diteruskan ke tim Maintenance & Engineering <b>{businessUnitName || 'TECHSAS'}</b>.
                    </p>
                  </div>

                  {/* Ticket Card */}
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-left space-y-2 max-w-md mx-auto">
                    <div className="flex items-center justify-between text-xs border-b border-stone-200/80 pb-2">
                      <span className="text-stone-500 font-medium">Nomor Tiket Aduan:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
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

                    <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
                      <span>Kode Aset Terlapor:</span>
                      <span className="font-mono font-semibold text-stone-800">{ticketResult.assetCode}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span>Waktu Registrasi:</span>
                      <span className="font-medium text-stone-800">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 space-y-2 max-w-md mx-auto">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Halo Tim Engineering TECHSAS, saya melaporkan kendala aset dengan Nomor Tiket: ${ticketResult.ticketNumber} pada aset ${ticketResult.assetName} (${ticketResult.assetCode}). Mohon bantuan penanganannya. Terima kasih!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-xs transition-all"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Teruskan Bukti Tiket ke WhatsApp Engineering
                    </a>

                    <button
                      onClick={handleClose}
                      className="btn-secondary w-full text-xs py-3"
                    >
                      Selesai / Tutup
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Tingkat Urgensi */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Tingkat Urgensi Penanganan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setUrgency('urgent')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          urgency === 'urgent'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-xs'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50 text-xs'
                        }`}
                      >
                        <Flame className="w-4 h-4 text-rose-600" />
                        <span className="text-[11px] leading-tight font-semibold">Darurat</span>
                        <span className="text-[9px] text-rose-600/80 leading-tight">Ganggu Tamu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUrgency('medium')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          urgency === 'medium'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold shadow-xs'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50 text-xs'
                        }`}
                      >
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-[11px] leading-tight font-semibold">Sedang</span>
                        <span className="text-[9px] text-amber-600/80 leading-tight">Butuh Servis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUrgency('low')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          urgency === 'low'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50 text-xs'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="text-[11px] leading-tight font-semibold">Ringan</span>
                        <span className="text-[9px] text-emerald-600/80 leading-tight">Perawatan</span>
                      </button>
                    </div>
                  </div>

                  {/* Kategori Kendala */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Kategori Kendala <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ISSUE_CATEGORIES.map((cat) => {
                        const Icon = cat.icon
                        const isSelected = category === cat.id
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`px-3 py-2 text-xs font-medium rounded-xl border flex items-center gap-2 transition-all ${
                              isSelected
                                ? 'bg-brand-50 border-brand-500 text-brand-900 font-bold shadow-xs'
                                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-600' : 'text-stone-400'}`} />
                            <span className="truncate">{cat.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Data Pelapor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nama Pelapor <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        placeholder="Nama staf / tamu / vendor"
                        className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-stone-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        No. WhatsApp Pelapor <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={reporterContact}
                        onChange={(e) => setReporterContact(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-stone-50/50"
                      />
                    </div>
                  </div>

                  {/* Foto Kerusakan */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Lampiran Foto Kerusakan (Opsional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />

                    {photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 max-h-44 flex items-center justify-center group">
                        <img
                          src={photoPreview}
                          alt="Preview kerusakan"
                          className="max-h-44 w-auto object-contain"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-xl shadow transition-all"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3.5 px-4 rounded-xl border border-dashed border-stone-300 hover:border-brand-400 bg-stone-50/70 hover:bg-brand-50/30 text-stone-500 hover:text-brand-700 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                      >
                        <Camera className="w-4 h-4 text-brand-600" />
                        Ambil Foto Kamera / Unggah Bukti Kerusakan
                      </button>
                    )}
                  </div>

                  {/* Deskripsi Masalah */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Deskripsi Kerusakan / Keluhan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Jelaskan detail bagian mana yang rusak, bunyi aneh, mati total, bocor, dsb..."
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-stone-50/50"
                    />
                  </div>

                  {/* Tombol Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold py-3 px-5 rounded-2xl shadow-md transition-all disabled:opacity-50 text-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses & Menerbitkan Tiket...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Kirim Pengaduan & Dapatkan No. Tiket
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
