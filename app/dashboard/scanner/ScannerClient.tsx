'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Camera,
  CameraOff,
  Search,
  Upload,
  Layers,
  MapPin,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Building2,
  Tag,
  ShieldAlert,
  Volume2,
} from 'lucide-react'
import Link from 'next/link'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { lookupAsset, quickMoveAssetLocation, quickCreateMaintenance } from './actions'
import type { AssetWithRelations, BusinessUnit, Location } from '@/types'

function playBeepSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // 880Hz (A5)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch (e) {
    // Audio context not allowed or failed
  }
}

export default function ScannerClient({
  businessUnits,
  locations,
}: {
  businessUnits: BusinessUnit[]
  locations: Location[]
}) {
  const [isScanning, setIsScanning] = useState(false)
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [manualCode, setManualCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scannedAsset, setScannedAsset] = useState<AssetWithRelations | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'move' | 'maintenance' | 'audit'>('info')

  // Move Form State
  const [moveLocationId, setMoveLocationId] = useState('')
  const [moveUnitId, setMoveUnitId] = useState('')
  const [moveNote, setMoveNote] = useState('')
  const [moveLoading, setMoveLoading] = useState(false)
  const [moveSuccess, setMoveSuccess] = useState(false)

  // Maintenance Form State
  const [maintType, setMaintType] = useState<'preventive' | 'corrective' | 'predictive'>('corrective')
  const [maintNotes, setMaintNotes] = useState('')
  const [maintCondition, setMaintCondition] = useState<string>('under_repair')
  const [maintLoading, setMaintLoading] = useState(false)
  const [maintSuccess, setMaintSuccess] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<any>(null)

  // Initialize available camera list
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        setVideoDevices(devices)
        if (devices.length > 0) {
          // Prefer back/environment camera if available
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
          )
          setSelectedCameraId(backCam ? backCam.deviceId : devices[0].deviceId)
        }
      } catch (e) {
        console.warn('Could not list video devices:', e)
      }
    }
    getDevices()

    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    setErrorMessage(null)
    setIsScanning(true)

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader()
      }

      const controls = await readerRef.current.decodeFromVideoDevice(
        selectedCameraId || undefined,
        videoRef.current!,
        (result, error) => {
          if (result) {
            playBeepSound()
            handleDetectedCode(result.getText())
          }
        }
      )

      controlsRef.current = controls
    } catch (err: any) {
      console.error('Camera scan error:', err)
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Silakan izinkan akses kamera di browser Anda.'
          : `Gagal membuka kamera: ${err.message}`
      )
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    setIsScanning(false)
  }

  const handleDetectedCode = async (codeText: string) => {
    stopScanning()
    setSearching(true)
    setErrorMessage(null)

    const asset = await lookupAsset(codeText)
    setSearching(false)

    if (asset) {
      setScannedAsset(asset)
      setMoveLocationId(asset.current_location_id || '')
      setMoveUnitId(asset.business_unit_id || '')
      setActiveTab('info')
      setMoveSuccess(false)
      setMaintSuccess(false)
    } else {
      setErrorMessage(`Aset dengan kode / QR "${codeText}" tidak ditemukan.`)
    }
  }

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleDetectedCode(manualCode)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSearching(true)
    setErrorMessage(null)

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader()
      }
      const imgUrl = URL.createObjectURL(file)
      const result = await readerRef.current.decodeFromImageUrl(imgUrl)
      URL.revokeObjectURL(imgUrl)

      if (result) {
        playBeepSound()
        handleDetectedCode(result.getText())
      }
    } catch (err: any) {
      setErrorMessage('Tidak dapat mendeteksi QR Code dari gambar yang diunggah.')
    } finally {
      setSearching(false)
    }
  }

  const handleQuickMove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedAsset || !moveLocationId) return

    setMoveLoading(true)
    const res = await quickMoveAssetLocation(
      scannedAsset.id,
      moveLocationId,
      moveUnitId || undefined,
      moveNote
    )
    setMoveLoading(false)

    if (res.success) {
      setMoveSuccess(true)
      // refresh asset info
      const updated = await lookupAsset(scannedAsset.id)
      if (updated) setScannedAsset(updated)
    } else {
      setErrorMessage(res.error)
    }
  }

  const handleQuickMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedAsset || !maintNotes.trim()) return

    setMaintLoading(true)
    const res = await quickCreateMaintenance(
      scannedAsset.id,
      maintType,
      maintNotes,
      maintCondition
    )
    setMaintLoading(false)

    if (res.success) {
      setMaintSuccess(true)
      const updated = await lookupAsset(scannedAsset.id)
      if (updated) setScannedAsset(updated)
    } else {
      setErrorMessage(res.error)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="page-title">QR Scanner Kamera</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Pindai label QR fisik aset secara instan untuk melihat detail, pindah lokasi, atau buat tiket pemeliharaan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner Viewport & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card overflow-hidden bg-slate-950 border-slate-800 text-white relative shadow-xl">
            {/* Camera Viewport */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover transition-opacity ${
                  isScanning ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                playsInline
                muted
              />

              {!isScanning && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Kamera Nonaktif</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik tombol di bawah untuk mulai memindai QR Code.
                    </p>
                  </div>
                </div>
              )}

              {/* Scanning Overlay Reticle */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-brand-400/80 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand-400 -mt-1 -ml-1 rounded-tl" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand-400 -mt-1 -mr-1 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand-400 -mb-1 -ml-1 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand-400 -mb-1 -mr-1 rounded-br" />
                    {/* Laser animated scan bar */}
                    <div className="absolute left-2 right-2 h-0.5 bg-brand-400 shadow-[0_0_8px_#38bdf8] animate-pulse top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[11px] font-medium bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-brand-300 mt-4">
                    Arahkan kamera ke QR Code
                  </span>
                </div>
              )}
            </div>

            {/* Camera Controls Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
              {videoDevices.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value)
                    if (isScanning) {
                      stopScanning()
                      setTimeout(() => startScanning(), 200)
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400"
                >
                  {videoDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Kamera (${dev.deviceId.slice(0, 5)})`}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-2">
                {!isScanning ? (
                  <button
                    onClick={startScanning}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all active:scale-[0.99]"
                    id="btn-start-camera"
                  >
                    <Camera className="w-4 h-4" /> Mulai Kamera
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-[0.99]"
                    id="btn-stop-camera"
                  >
                    <CameraOff className="w-4 h-4" /> Matikan Kamera
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Alternative Inputs: Manual Code & File Upload */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700">Alternatif Input</h3>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik AMB-XXXXX atau UUID..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={searching || !manualCode.trim()}
                className="btn-secondary text-xs px-3"
              >
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cari'}
              </button>
            </form>

            <div className="relative">
              <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/40 rounded-xl cursor-pointer text-xs text-slate-600 transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Foto / Barcode Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Asset Result & Quick Actions */}
        <div className="lg:col-span-7 space-y-4">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Pencarian Gagal</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {searching ? (
            <div className="card p-12 text-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" />
              <p className="text-xs font-medium text-slate-600">Mengidentifikasi data aset...</p>
            </div>
          ) : scannedAsset ? (
            <div className="card overflow-hidden shadow-xl border-brand-500/20">
              {/* Asset Hero Header */}
              <div className="bg-gradient-to-r from-slate-900 to-brand-950 p-5 text-white flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-brand-500/30 text-brand-300 border border-brand-500/40 px-2 py-0.5 rounded">
                      {scannedAsset.asset_code}
                    </span>
                    <span className="text-[11px] font-medium bg-white/10 px-2 py-0.5 rounded capitalize">
                      {scannedAsset.condition.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{scannedAsset.name}</h2>
                  <p className="text-xs text-slate-300">
                    {scannedAsset.business_unit?.name} &bull; {scannedAsset.category?.name}
                  </p>
                </div>

                <Link
                  href={`/dashboard/assets/${scannedAsset.id}`}
                  className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white font-medium px-3 py-1.5 rounded-lg border border-white/20 transition-colors flex-shrink-0"
                >
                  Detail <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Action Tabs Bar */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`px-3 py-2 font-semibold border-b-2 rounded-t-lg transition-all ${
                    activeTab === 'info'
                      ? 'border-brand-600 text-brand-700 bg-white shadow-sm'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ringkasan Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('move')}
                  className={`px-3 py-2 font-semibold border-b-2 rounded-t-lg transition-all ${
                    activeTab === 'move'
                      ? 'border-brand-600 text-brand-700 bg-white shadow-sm'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pindah Lokasi (Quick Move)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('maintenance')}
                  className={`px-3 py-2 font-semibold border-b-2 rounded-t-lg transition-all ${
                    activeTab === 'maintenance'
                      ? 'border-brand-600 text-brand-700 bg-white shadow-sm'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Catat Perbaikan
                </button>
              </div>

              {/* Tab 1: Info Overview */}
              {activeTab === 'info' && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Lokasi Terdaftar
                      </span>
                      <p className="font-semibold text-slate-800">
                        {scannedAsset.current_location?.name || 'Belum Ada Lokasi'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-brand-500" /> Unit Bisnis
                      </span>
                      <p className="font-semibold text-slate-800">
                        {scannedAsset.business_unit?.name}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                        <Tag className="w-3.5 h-3.5 text-amber-500" /> Kategori
                      </span>
                      <p className="font-semibold text-slate-800">
                        {scannedAsset.category?.name}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-blue-500" /> Status Operasional
                      </span>
                      <p className="font-semibold text-slate-800 capitalize">
                        {scannedAsset.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('move')}
                      className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Pindah Lokasi
                    </button>
                    <button
                      onClick={() => setActiveTab('maintenance')}
                      className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Lapor Pemeliharaan
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Quick Move Location */}
              {activeTab === 'move' && (
                <div className="p-5">
                  {moveSuccess ? (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm">
                        Lokasi Aset Berhasil Dipindahkan!
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Riwayat mutasi lokasi otomatis dicatat ke riwayat audit aset.
                      </p>
                      <button
                        onClick={() => setMoveSuccess(false)}
                        className="btn-secondary text-xs"
                      >
                        Pindah Lagi / Ubah
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleQuickMove} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Unit Bisnis Tujuan
                        </label>
                        <select
                          value={moveUnitId}
                          onChange={(e) => setMoveUnitId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
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
                          Lokasi / Ruangan Tujuan <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={moveLocationId}
                          onChange={(e) => setMoveLocationId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="">Pilih Lokasi Ruangan...</option>
                          {locations
                            .filter((l) => !moveUnitId || l.business_unit_id === moveUnitId)
                            .map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.level})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Catatan / Alasan Perpindahan
                        </label>
                        <input
                          type="text"
                          value={moveNote}
                          onChange={(e) => setMoveNote(e.target.value)}
                          placeholder="Contoh: Pemindahan sementara untuk event di Ballroom..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={moveLoading || !moveLocationId}
                        className="btn-primary w-full text-xs flex items-center justify-center gap-2 py-2.5"
                      >
                        {moveLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Menyimpan Perpindahan...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-3.5 h-3.5" /> Konfirmasi Pindah Lokasi
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Tab 3: Quick Maintenance */}
              {activeTab === 'maintenance' && (
                <div className="p-5">
                  {maintSuccess ? (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm">
                        Tiket Pemeliharaan Berhasil Dibuat!
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Tiket telah masuk ke antrian pemeliharaan unit bisnis terkait.
                      </p>
                      <button
                        onClick={() => setMaintSuccess(false)}
                        className="btn-secondary text-xs"
                      >
                        Buat Tiket Lain
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleQuickMaintenance} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Tipe Pemeliharaan
                        </label>
                        <select
                          value={maintType}
                          onChange={(e) => setMaintType(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="corrective">Perbaikan Kerusakan (Corrective)</option>
                          <option value="preventive">Perawatan Rutin (Preventive)</option>
                          <option value="predictive">Pemeriksaan Berkala (Predictive)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Update Kondisi Fisik Aset
                        </label>
                        <select
                          value={maintCondition}
                          onChange={(e) => setMaintCondition(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="under_repair">Dalam Perbaikan (Under Repair)</option>
                          <option value="damaged">Rusak (Damaged)</option>
                          <option value="fair">Cukup (Fair)</option>
                          <option value="good">Baik (Good)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Catatan Kerusakan / Instruksi Teknisi <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={maintNotes}
                          onChange={(e) => setMaintNotes(e.target.value)}
                          placeholder="Jelaskan detail kendala teknis atau perbaikan yang dibutuhkan..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={maintLoading || !maintNotes.trim()}
                        className="btn-primary w-full text-xs flex items-center justify-center gap-2 py-2.5"
                      >
                        {maintLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Menyimpan Tiket...
                          </>
                        ) : (
                          <>
                            <Wrench className="w-3.5 h-3.5" /> Buat Tiket Pemeliharaan
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 text-center text-slate-400 space-y-2">
              <Camera className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Aset Terpindai</p>
              <p className="text-xs max-w-sm mx-auto text-slate-400">
                Pindai QR Code menggunakan kamera smartphone/laptop atau masukkan kode aset secara manual pada kolom sebelah kiri.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
