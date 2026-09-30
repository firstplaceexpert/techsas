'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Printer,
  Tag,
  CheckSquare,
  Square,
  Search,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { getPublicScanUrl } from '@/lib/utils/qrcode'
import type { AssetListItem, BusinessUnit, AssetCategory } from '@/types'

interface AssetWithQR extends AssetListItem {
  qr_code_uuid: string
  qrDataUrl?: string
}

export default function PrintLabelsClient({
  initialAssets,
  businessUnits,
  categories,
}: {
  initialAssets: (AssetListItem & { qr_code_uuid: string })[]
  businessUnits: BusinessUnit[]
  categories: AssetCategory[]
}) {
  const [assets] = useState<AssetWithQR[]>(initialAssets)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialAssets.slice(0, 10).map((a) => a.id)
  )
  const [search, setSearch] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [copiesPerAsset, setCopiesPerAsset] = useState<number>(1)
  const [qrCache, setQrCache] = useState<Record<string, string>>({})
  const [generatingQRs, setGeneratingQRs] = useState(false)

  // Generate high-resolution QR codes for all assets
  useEffect(() => {
    async function generateQRs() {
      setGeneratingQRs(true)
      const newCache = { ...qrCache }

      for (const asset of assets) {
        if (!newCache[asset.id] && asset.qr_code_uuid) {
          const url = getPublicScanUrl(asset.qr_code_uuid)
          try {
            const dataUrl = await QRCode.toDataURL(url, {
              width: 320,
              margin: 0,
              color: { dark: '#000000', light: '#ffffff' },
              errorCorrectionLevel: 'M',
            })
            newCache[asset.id] = dataUrl
          } catch (e) {
            console.error('Error generating QR for', asset.asset_code, e)
          }
        }
      }

      setQrCache(newCache)
      setGeneratingQRs(false)
    }

    generateQRs()
  }, [assets])

  // Filter assets based on search and dropdowns
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchSearch =
        !search ||
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.asset_code.toLowerCase().includes(search.toLowerCase()) ||
        (asset.business_unit?.name || '').toLowerCase().includes(search.toLowerCase())
      const matchUnit = !selectedUnit || asset.business_unit?.id === selectedUnit
      const matchCategory = !selectedCategory || asset.category?.id === selectedCategory
      return matchSearch && matchUnit && matchCategory
    })
  }, [assets, search, selectedUnit, selectedCategory])

  const selectedAssets = useMemo(() => {
    return assets.filter((a) => selectedIds.includes(a.id))
  }, [assets, selectedIds])

  // Expanded items based on copiesPerAsset
  const printItems = useMemo(() => {
    const list: AssetWithQR[] = []
    for (const asset of selectedAssets) {
      for (let i = 0; i < copiesPerAsset; i++) {
        list.push(asset)
      }
    }
    return list
  }, [selectedAssets, copiesPerAsset])

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAllFiltered = () => {
    const ids = filteredAssets.map((a) => a.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])))
    }
  }

  const handleSelectBatchPreset = (count: number) => {
    const sliced = filteredAssets.slice(0, count).map((a) => a.id)
    setSelectedIds(sliced)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Screen Controls (Hidden during print) */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard/assets"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Aset
            </Link>
            <h1 className="page-title flex items-center gap-2">
              <Printer className="w-6 h-6 text-brand-600" />
              Cetak Label Aset
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Format standar 2 kolom untuk kertas A4 dan A3. Seluruh kode dan detail aset tercetak utuh.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={selectedAssets.length === 0 || generatingQRs}
              className="btn-primary flex items-center gap-2 shadow-sm px-5 py-2 text-sm font-semibold"
              id="btn-trigger-print"
            >
              <Printer className="w-4 h-4" />
              Cetak {printItems.length} Label
              {copiesPerAsset > 1 && ` (${selectedAssets.length} aset x ${copiesPerAsset})`}
            </button>
          </div>
        </div>

        {/* Kontrol & Filter Cetak */}
        <div className="card p-3.5 bg-white border border-stone-200 shadow-sm space-y-3">
          {/* Baris Filter: Cari, Unit Bisnis, Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari kode semantik / nama aset..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50/60 hover:bg-white focus:bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-2 text-xs bg-stone-50/60 hover:bg-white focus:bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors text-stone-700"
            >
              <option value="">Semua Unit Bisnis</option>
              {businessUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-stone-50/60 hover:bg-white focus:bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors text-stone-700"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Baris Opsi: Salinan per Aset & Pilihan Cepat */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-stone-100 text-xs">
            {/* Salinan per Aset */}
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-medium">Salinan per label:</span>
              <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCopiesPerAsset(num)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      copiesPerAsset === num
                        ? 'bg-stone-800 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Cepat Batch */}
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Pilih cepat:</span>
              <button
                type="button"
                onClick={() => handleSelectBatchPreset(10)}
                className="px-2.5 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium transition-colors"
              >
                10 Aset (1 Lembar A4)
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(filteredAssets.map((a) => a.id))}
                className="px-2.5 py-1 rounded-md border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-medium transition-colors"
              >
                Pilih Semua ({filteredAssets.length})
              </button>
            </div>
          </div>
        </div>

        {/* Asset Selection Drawer/Table */}
        <div className="card overflow-hidden">
          <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
            <button
              onClick={handleSelectAllFiltered}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand-600 transition-colors"
            >
              {filteredAssets.length > 0 &&
              filteredAssets.every((a) => selectedIds.includes(a.id)) ? (
                <CheckSquare className="w-4 h-4 text-brand-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              Pilih Semua Hasil Filter ({filteredAssets.length} Aset)
            </button>
            <span className="text-xs text-slate-500">
              {selectedAssets.length} dari {assets.length} aset terpilih
            </span>
          </div>

          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
            {filteredAssets.map((asset) => {
              const isSelected = selectedIds.includes(asset.id)

              return (
                <div
                  key={asset.id}
                  onClick={() => handleToggleSelect(asset.id)}
                  className={`px-4 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-brand-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                        {asset.asset_code}
                      </span>
                      <span className="font-medium text-slate-800">{asset.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="hidden sm:inline font-medium">{asset.business_unit?.name}</span>
                    <span className="text-slate-400">•</span>
                    <span>{asset.category?.name}</span>
                  </div>
                </div>
              )
            })}
            {filteredAssets.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada aset yang cocok dengan filter pencarian.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div className="print-container w-full">
        {selectedAssets.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 print:hidden">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">Belum ada aset yang dipilih untuk dicetak.</p>
            <p className="text-xs mt-1">Pilih satu atau beberapa aset pada tabel di atas untuk menampilkan pratinjau lembar sticker.</p>
          </div>
        ) : (
          <div className="space-y-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden text-xs text-stone-500 px-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-stone-700">
                  Pratinjau Lembar Cetak ({printItems.length} label)
                </span>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  QR Link: techsas-techsas.vercel.app/scan/...
                </span>
              </div>
              <span className="bg-stone-100 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-stone-700 border border-stone-200 self-start sm:self-auto">
                Format Standar 2 Kolom (Fit Penuh Kertas)
              </span>
            </div>

            {/* Canvas Container simulating paper sheet */}
            <div className="print-canvas bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm w-full print:p-0 print:border-0 print:shadow-none">
              
              {/* THE DEFINITIVE UNIFIED LABEL GRID (2 COLUMNS PER ROW, WIDE LANDSCAPE BADGE, ZERO TRUNCATION) */}
              <div className="label-print-grid grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {printItems.map((asset, index) => (
                  <div
                    key={`${asset.id}-${index}`}
                    className="label-print-card border-2 border-slate-300 rounded-xl p-3.5 flex items-stretch gap-3.5 bg-white relative overflow-hidden"
                  >
                    {/* High-Contrast Full QR Code Column */}
                    <div
                      style={{ width: '84px', minWidth: '84px', maxWidth: '84px' }}
                      className="shrink-0 bg-white flex items-center justify-center border border-slate-300 rounded-lg p-1 shadow-2xs self-stretch"
                    >
                      {qrCache[asset.id] ? (
                        <img
                          src={qrCache[asset.id]}
                          alt={asset.asset_code}
                          className="w-full h-full aspect-square object-contain"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[76px] bg-slate-100 flex items-center justify-center text-[9px] text-slate-400 rounded">
                          QR...
                        </div>
                      )}
                    </div>

                    {/* Content Column: FULL TEXT, ZERO CLIPPING, NO '...' */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      {/* Top: Brand Header & Full Business Unit */}
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1 mb-1">
                          <span className="text-[10px] font-black text-brand-950 font-serif tracking-wider uppercase shrink-0">
                            TECHSAS ASSET HUB
                          </span>
                          <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-right leading-tight">
                            {asset.business_unit?.name}
                          </span>
                        </div>

                        {/* Middle: Crisp, Bold, Single-Line Monospace Code */}
                        <div className="font-mono font-black text-slate-950 text-[14px] tracking-tight leading-snug my-0.5 whitespace-nowrap">
                          {asset.asset_code}
                        </div>

                        {/* Middle: Full Asset Name (Never clipped into dots) */}
                        <p className="text-[11.5px] font-bold text-slate-900 leading-snug break-words">
                          {asset.name}
                        </p>
                      </div>

                      {/* Bottom Footer: Full Category & Location */}
                      <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-1 mt-1 text-[9px] text-slate-600 font-medium">
                        <span className="leading-tight">{asset.category?.name}</span>
                        <span className="font-semibold text-slate-800 text-right leading-tight">
                          {asset.current_location?.name || 'Area Terdata'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Dynamic Print Stylesheet (Forces 2 full columns across 100% paper width) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: auto;
                margin: 8mm;
              }
              *, *:before, *:after {
                box-sizing: border-box !important;
              }
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
              }
              aside,
              header,
              nav,
              footer,
              .print\\:hidden {
                display: none !important;
              }
              main {
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                display: block !important;
              }
              .print-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
              }
              .print-canvas {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                background: transparent !important;
                display: block !important;
              }
              .label-print-grid {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                grid-gap: 4mm !important;
                width: 100% !important;
              }
              .label-print-card {
                min-height: 48mm !important;
                border: 1.5px dashed #94a3b8 !important;
                border-radius: 8px !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                box-shadow: none !important;
                width: 100% !important;
                background: #ffffff !important;
              }
            }
          `,
        }}
      />
    </div>
  )
}
