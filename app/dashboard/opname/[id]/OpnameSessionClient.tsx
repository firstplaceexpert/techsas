'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Printer,
  ArrowLeft,
  Loader2,
  RefreshCw,
  MapPin,
  Building2,
  Calendar,
  Check,
  X,
  Volume2,
  FileSpreadsheet,
} from 'lucide-react'
import Link from 'next/link'
import { BrowserMultiFormatReader } from '@zxing/browser'
import {
  recordOpnameScan,
  reconcileMisplacedAssets,
  completeOpnameSession,
  type OpnameSessionDetail,
} from '../actions'

function playScanSound(matched: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = matched ? 'sine' : 'triangle'
    osc.frequency.setValueAtTime(matched ? 880 : 440, ctx.currentTime) // High beep for match, lower for misplace
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  } catch (e) {
    // Audio context not allowed or failed
  }
}

export default function OpnameSessionClient({
  initialSession,
}: {
  initialSession: OpnameSessionDetail
}) {
  const [session, setSession] = useState<OpnameSessionDetail>(initialSession)
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [activeTab, setActiveTab] = useState<'matched' | 'misplaced' | 'missing' | 'report'>('matched')
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(null)
  const [reconciling, setReconciling] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [lastScannedCode, setLastScannedCode] = useState<string>('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<any>(null)
  const scanningCooldown = useRef(false)

  // Categorize assets
  const matchedScans = session.scans.filter((s) => s.matched)
  const misplacedScans = session.scans.filter((s) => !s.matched)
  const scannedAssetIds = new Set(session.scans.map((s) => s.asset_id))
  const missingAssets = session.targetAssets.filter((a) => !scannedAssetIds.has(a.id))

  const totalTarget = session.targetAssets.length
  const totalScanned = session.scans.length
  const progressPercent = totalTarget > 0 ? Math.min(100, Math.round((matchedScans.length / totalTarget) * 100)) : 0

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    setStatusMessage(null)
    setIsScanning(true)

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader()
      }

      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result) => {
          if (result && !scanningCooldown.current) {
            const text = result.getText()
            scanningCooldown.current = true
            handleScanCode(text)
            // Cooldown of 1.5 seconds between reads
            setTimeout(() => {
              scanningCooldown.current = false
            }, 1500)
          }
        }
      )
      controlsRef.current = controls
    } catch (err: any) {
      setIsScanning(false)
      setStatusMessage({
        type: 'error',
        text: `Tidak dapat mengakses kamera: ${err.message}`,
      })
    }
  }

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    setIsScanning(false)
  }

  const handleScanCode = async (codeText: string) => {
    setLastScannedCode(codeText)
    const res = await recordOpnameScan(session.id, codeText)

    if (res.success) {
      playScanSound(res.data.matched)
      const asset = res.data.asset
      if (res.data.matched) {
        setStatusMessage({
          type: 'success',
          text: `[SESUAI] ${asset.asset_code} - ${asset.name}`,
        })
      } else {
        setStatusMessage({
          type: 'warn',
          text: `[SALAH LOKASI] ${asset.asset_code} - Terdaftar di: ${asset.current_location?.name || 'Unit lain'}`,
        })
      }
      // Reload session
      window.location.reload()
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error,
      })
    }
  }

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleScanCode(manualCode)
    setManualCode('')
  }

  const handleReconcileAll = async () => {
    if (!confirm('Apakah Anda yakin ingin memindahkan seluruh aset yang salah lokasi ke lokasi sesi opname ini secara otomatis?')) return

    setReconciling(true)
    const res = await reconcileMisplacedAssets(session.id)
    setReconciling(false)

    if (res.success) {
      alert(`Berhasil merekonsiliasi ${res.data?.reconciledCount} aset ke lokasi ini!`)
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  const handleCompleteSession = async () => {
    if (!confirm('Selesaikan dan tutup sesi opname ini? Anda tidak dapat menambah scan baru setelah sesi ditutup.')) return

    setCompleting(true)
    const res = await completeOpnameSession(session.id)
    setCompleting(false)

    if (res.success) {
      stopScanning()
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header (Hidden during print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard/opname"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Opname
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="page-title">Sesi Opname: {session.business_unit?.name}</h1>
              <span
                className={`badge text-xs ${
                  session.status === 'in_progress' ? 'badge-yellow' : 'badge-green'
                }`}
              >
                {session.status === 'in_progress' ? 'Sedang Berlangsung' : 'Selesai'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Target Lokasi: <b>{session.location?.name || 'Seluruh Unit'}</b>
              </span>
              <span>Auditor: {session.conductor?.full_name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2.5"
            >
              <Printer className="w-4 h-4" /> Cetak Laporan Opname
            </button>
            {session.status === 'in_progress' && (
              <button
                onClick={handleCompleteSession}
                disabled={completing}
                className="btn-primary text-xs flex items-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Selesaikan Audit
              </button>
            )}
          </div>
        </div>

        {/* Progress & Stat Counters Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4 border-l-4 border-l-brand-600 bg-white">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Total Target Aset
            </p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalTarget}</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {progressPercent}% target terverifikasi
            </span>
          </div>

          <div className="card p-4 border-l-4 border-l-emerald-500 bg-white">
            <p className="text-[11px] text-emerald-600 uppercase tracking-wider font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sesuai Lokasi
            </p>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {matchedScans.length}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Aset fisik sesuai database</p>
          </div>

          <div className="card p-4 border-l-4 border-l-amber-500 bg-white">
            <p className="text-[11px] text-amber-600 uppercase tracking-wider font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Salah Lokasi
            </p>
            <p className="text-xl font-extrabold text-amber-600 mt-0.5">
              {misplacedScans.length}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Ditemukan di luar ruang terdaftar</p>
          </div>

          <div className="card p-4 border-l-4 border-l-rose-500 bg-white">
            <p className="text-[11px] text-rose-600 uppercase tracking-wider font-semibold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Belum Ditemukan
            </p>
            <p className="text-xl font-extrabold text-rose-600 mt-0.5">
              {missingAssets.length}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Belum dipindai pada sesi ini</p>
          </div>
        </div>

        {/* Live Scanner Dock */}
        {session.status === 'in_progress' && (
          <div className="card overflow-hidden bg-slate-900 border-slate-800 text-white p-4 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Camera Preview Thumbnail */}
              <div className="relative w-full md:w-64 h-36 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-700 flex-shrink-0">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${
                    isScanning ? 'opacity-100' : 'opacity-0 absolute'
                  }`}
                  playsInline
                  muted
                />
                {!isScanning ? (
                  <div className="text-center p-3 text-slate-400 text-xs">
                    <Camera className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <span>Kamera Siap</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 border-2 border-emerald-400/70 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
                    <span className="text-[10px] bg-black/70 px-2 py-0.5 rounded text-emerald-300">
                      Scanning Aktif...
                    </span>
                  </div>
                )}
              </div>

              {/* Controls and manual barcode input */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Mode Pemindaian Berkelanjutan (Continuous Scanner)
                  </span>
                  {!isScanning ? (
                    <button
                      onClick={startScanning}
                      className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-brand-500 hover:bg-brand-400"
                    >
                      <Camera className="w-3.5 h-3.5" /> Hidupkan Scanner Kamera
                    </button>
                  ) : (
                    <button
                      onClick={stopScanning}
                      className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-rose-600/80 text-white hover:bg-rose-600 border-rose-500"
                    >
                      <CameraOff className="w-3.5 h-3.5" /> Matikan Scanner
                    </button>
                  )}
                </div>

                <form onSubmit={handleManualScan} className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Atau ketik AMB-XXXXX / tempel kode QR..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  />
                  <button type="submit" className="btn-secondary text-xs px-4">
                    Submit Scan
                  </button>
                </form>

                {/* Status toast message */}
                {statusMessage && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : statusMessage.type === 'warn'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <span>{statusMessage.text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matched')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'matched'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Sesuai Lokasi ({matchedScans.length})
          </button>

          <button
            onClick={() => setActiveTab('misplaced')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'misplaced'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Salah Lokasi ({misplacedScans.length})
          </button>

          <button
            onClick={() => setActiveTab('missing')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'missing'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Belum Ditemukan ({missingAssets.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Matched Scans Table */}
      {activeTab === 'matched' && (
        <div className="card overflow-hidden">
          <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <span>Aset Terverifikasi Sesuai Lokasi Fisik</span>
            <span>Total: {matchedScans.length} item</span>
          </div>

          {matchedScans.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada aset yang cocok terverifikasi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Kode Aset</th>
                    <th className="py-2.5 px-4 font-semibold">Nama Aset</th>
                    <th className="py-2.5 px-4 font-semibold">Kondisi</th>
                    <th className="py-2.5 px-4 font-semibold">Waktu Pindai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {matchedScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {scan.asset?.asset_code}
                      </td>
                      <td className="py-2.5 px-4 font-medium">{scan.asset?.name}</td>
                      <td className="py-2.5 px-4 capitalize">{scan.asset?.condition}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(scan.scanned_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Misplaced Scans Table with Auto-Reconcile Button */}
      {activeTab === 'misplaced' && (
        <div className="card overflow-hidden">
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-amber-900">
              Aset Ditemukan di Lokasi Ini tapi Tercatat di Ruangan / Unit Lain ({misplacedScans.length} item)
            </span>
            {misplacedScans.length > 0 && session.location_id && (
              <button
                onClick={handleReconcileAll}
                disabled={reconciling}
                className="btn-primary text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5 self-start sm:self-auto"
              >
                {reconciling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Rekonsiliasi / Sesuaikan Lokasi Otomatis
              </button>
            )}
          </div>

          {misplacedScans.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada aset yang salah lokasi terdeteksi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Kode Aset</th>
                    <th className="py-2.5 px-4 font-semibold">Nama Aset</th>
                    <th className="py-2.5 px-4 font-semibold">Lokasi di Database</th>
                    <th className="py-2.5 px-4 font-semibold">Unit Bisnis</th>
                    <th className="py-2.5 px-4 font-semibold">Waktu Pindai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {misplacedScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-amber-50/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-900">
                        {scan.asset?.asset_code}
                      </td>
                      <td className="py-2.5 px-4 font-medium">{scan.asset?.name}</td>
                      <td className="py-2.5 px-4 text-rose-600 font-semibold">
                        {scan.asset?.current_location?.name || 'Belum Ada Lokasi'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {scan.asset?.business_unit?.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(scan.scanned_at).toLocaleTimeString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Missing / Unscanned Table */}
      {activeTab === 'missing' && (
        <div className="card overflow-hidden">
          <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs text-rose-900 font-semibold">
            <span>Aset Terdaftar di Area Ini tapi Belum Ditemukan ({missingAssets.length} item)</span>
          </div>

          {missingAssets.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-600 font-semibold">
              Seluruh aset terdaftar di ruangan ini telah ditemukan dan terverifikasi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Kode Aset</th>
                    <th className="py-2.5 px-4 font-semibold">Nama Aset</th>
                    <th className="py-2.5 px-4 font-semibold">Kondisi Terakhir</th>
                    <th className="py-2.5 px-4 font-semibold">Lokasi Tercatat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {missingAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                        {asset.asset_code}
                      </td>
                      <td className="py-2.5 px-4 font-medium">{asset.name}</td>
                      <td className="py-2.5 px-4 capitalize">{asset.condition}</td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {asset.current_location?.name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Printable Report Sheet Layout */}
      <div className="hidden print:block space-y-6 text-black">
        <div className="text-center border-b-2 border-black pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">
            BERITA ACARA HASIL STOCK OPNAME ASET
          </h2>
          <p className="text-sm font-semibold mt-1">
            TECHSAS ASSET HUB &bull; {session.business_unit?.name?.toUpperCase()}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Lokasi Audit: {session.location?.name || 'Seluruh Area'} &bull; Tanggal:{' '}
            {new Date(session.started_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 text-xs">
          <div className="p-3 border border-black">
            <p className="font-bold">Total Target Aset:</p>
            <p className="text-lg font-bold mt-1">{totalTarget}</p>
          </div>
          <div className="p-3 border border-black">
            <p className="font-bold">Ditemukan Sesuai:</p>
            <p className="text-lg font-bold mt-1">{matchedScans.length}</p>
          </div>
          <div className="p-3 border border-black">
            <p className="font-bold">Salah Lokasi:</p>
            <p className="text-lg font-bold mt-1">{misplacedScans.length}</p>
          </div>
          <div className="p-3 border border-black">
            <p className="font-bold">Belum Ditemukan / Hilang:</p>
            <p className="text-lg font-bold mt-1">{missingAssets.length}</p>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-xs uppercase mb-2">1. Ringkasan Aset Terpindai</h3>
          <table className="w-full text-[10px] border border-black text-left">
            <thead>
              <tr className="border-b border-black bg-slate-100">
                <th className="p-1 border-r border-black">No</th>
                <th className="p-1 border-r border-black">Kode Aset</th>
                <th className="p-1 border-r border-black">Nama Aset</th>
                <th className="p-1 border-r border-black">Status Audit</th>
                <th className="p-1">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {session.scans.map((scan, idx) => (
                <tr key={scan.id} className="border-b border-slate-300">
                  <td className="p-1 border-r border-black">{idx + 1}</td>
                  <td className="p-1 border-r border-black font-mono font-bold">{scan.asset?.asset_code}</td>
                  <td className="p-1 border-r border-black">{scan.asset?.name}</td>
                  <td className="p-1 border-r border-black font-semibold">
                    {scan.matched ? 'Sesuai Lokasi' : 'Salah Lokasi'}
                  </td>
                  <td className="p-1">
                    {scan.matched ? 'OK' : `Tercatat di: ${scan.asset?.current_location?.name || 'Lain'}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-10 flex justify-between text-xs text-center">
          <div>
            <p>Petugas Auditor / Pelaksana,</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1">
              ( {session.conductor?.full_name || 'Staff Auditor'} )
            </p>
          </div>
          <div>
            <p>Mengetahui, Unit Asset Manager,</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1">
              ( .................................................. )
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
