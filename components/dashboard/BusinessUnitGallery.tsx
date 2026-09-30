'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Plus,
  Building2,
  Settings2,
} from 'lucide-react'
import type { BusinessUnit } from '@/types'

function getFallbackLogo(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('melaju')) return '/logos/melaju-rental-mobil.png'
  if (n.includes('bsm') || n.includes('kamera')) return '/logos/rental-kamera.png'
  if (n.includes('playstation') || n.includes('ps')) return '/logos/playstation-jogja.png'
  if (n.includes('couvee') || n.includes('coffee')) return '/logos/unit-property-5.png'
  if (n.includes('gigs') || n.includes('event')) return '/logos/gigs-production.png'
  return '/logos/melaju-rental-mobil.png'
}

function getFallbackCode(name: string, code?: string | null): string {
  if (code && code.trim().length > 0) return code.toUpperCase()
  const n = name.toLowerCase()
  if (n.includes('melaju')) return 'FLT'
  if (n.includes('bsm') || n.includes('kamera')) return 'CAM'
  if (n.includes('playstation') || n.includes('ps')) return 'GME'
  if (n.includes('couvee') || n.includes('coffee')) return 'CFE'
  if (n.includes('gigs') || n.includes('event')) return 'EVT'
  return name.slice(0, 3).toUpperCase()
}

interface BusinessUnitGalleryProps {
  units?: BusinessUnit[]
  countsByUnit?: Record<string, number>
}

export default function BusinessUnitGallery({
  units = [],
  countsByUnit = {},
}: BusinessUnitGalleryProps) {
  // Count helper
  const getAssetCount = (unitName: string, unitCode: string): number => {
    if (!countsByUnit || Object.keys(countsByUnit).length === 0) return 0
    for (const [key, count] of Object.entries(countsByUnit)) {
      const k = key.toLowerCase()
      if (
        k.includes(unitName.toLowerCase().split(' ')[0]) ||
        unitName.toLowerCase().includes(k) ||
        k.includes(unitCode.toLowerCase())
      ) {
        return count
      }
    }
    return 0
  }

  return (
    <div className="bg-white rounded-3xl border border-cloud-200 shadow-apple p-6 sm:p-7 transition-all relative">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-cloud-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-pale-100 border border-mint-300/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5 text-charcoal" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-charcoal tracking-tight">
                Portofolio Unit Usaha UMKM
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2A4416] bg-pale-100 border border-mint-300/90 px-2.5 py-0.5 rounded-full">
                Multi-Tenant
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih unit bisnis untuk memfilter inventaris aset dan label QR
            </p>
          </div>
        </div>

        {/* Clean Header Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Link
            href="/dashboard/business-units"
            className="text-xs font-bold text-charcoal bg-pale-100 hover:bg-pale-200 border border-mint-300/80 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Kelola & Ubah Nama atau Logo Unit Bisnis"
          >
            <Settings2 className="w-3.5 h-3.5 text-charcoal" />
            <span>Kelola & Ubah Unit</span>
          </Link>
        </div>
      </div>

      {/* Grid of Ultra-Clean Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {units.map((unit) => {
          const code = getFallbackCode(unit.name, unit.code)
          const logoSrc = unit.logo_url || getFallbackLogo(unit.name)
          const actualCount = getAssetCount(unit.name, code)
          const filterKeyword = unit.name.split(' ')[0]

          return (
            <Link
              key={unit.id}
              href={`/dashboard/assets?search=${encodeURIComponent(filterKeyword)}`}
              className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-cloud-200 hover:border-mint-400 hover:shadow-apple-hover transition-all duration-200 active:scale-[0.99] min-h-[220px]"
            >
              <div>
                {/* Logo Showcase Box */}
                <div className="w-full h-32 sm:h-36 rounded-xl bg-surface-50 border border-cloud-200/70 p-4 flex items-center justify-center group-hover:bg-pale-50/40 group-hover:border-mint-200 transition-all relative overflow-hidden">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={logoSrc}
                      alt={unit.name}
                      className="max-h-20 sm:max-h-24 w-auto max-w-[85%] object-contain filter drop-shadow-2xs transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Top-Right Badges: Code + Count */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-white/95 px-2 py-0.5 rounded-md border border-cloud-200 shadow-2xs">
                      {code}
                    </span>
                    {actualCount > 0 && (
                      <span className="text-[10px] font-bold text-[#2A4416] bg-pale-100/95 border border-mint-300 px-2 py-0.5 rounded-full shadow-2xs">
                        {actualCount} Aset
                      </span>
                    )}
                  </div>
                </div>

                {/* Clean Business Name Only */}
                <div className="mt-4">
                  <h3 className="text-base font-bold text-charcoal group-hover:text-[#2A4416] transition-colors truncate">
                    {unit.name}
                  </h3>
                </div>
              </div>

              {/* Bottom Action Link */}
              <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-cloud-100">
                <span className="text-xs font-bold text-charcoal group-hover:text-[#2A4416] flex items-center gap-1.5 transition-colors">
                  <span>Lihat Inventaris & Label QR</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          )
        })}

        {/* 6th Slot: Click to Register New Unit Usaha */}
        <Link
          href="/dashboard/business-units/new"
          className="group flex flex-col justify-between p-5 rounded-2xl border-2 border-dashed border-cloud-300 hover:border-mint-500 bg-surface-50/50 hover:bg-pale-50/40 hover:shadow-apple-hover transition-all duration-200 active:scale-[0.99] text-left w-full min-h-[220px]"
        >
          <div className="w-full">
            <div className="w-full h-32 sm:h-36 rounded-xl border border-dashed border-cloud-300/80 bg-white/70 p-4 flex flex-col items-center justify-center group-hover:border-mint-400 transition-all">
              <div className="w-11 h-11 rounded-2xl bg-surface-100 text-charcoal flex items-center justify-center group-hover:bg-mint-400 group-hover:scale-105 transition-all shadow-2xs mb-2">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-charcoal">
                Tambah Unit Usaha
              </span>
              <span className="text-[10px] text-slate-400">
                Daftarkan UMKM / sektor baru
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-bold text-charcoal group-hover:text-[#2A4416]">
                + Daftarkan Unit Usaha Lain
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-cloud-200/60 w-full">
            <span className="text-xs font-bold text-charcoal group-hover:text-[#2A4416] flex items-center gap-1.5">
              <span>Buka Formulir Pendaftaran</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}
