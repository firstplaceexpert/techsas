'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Camera,
  Printer,
  ClipboardCheck,
  ClipboardList,
  Wrench,
  Box,
  Truck,
  MapPin,
  Building2,
  Tag,
  TrendingDown,
  Trash2,
  FileText,
  Settings,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { Profile } from '@/types'

interface NavItem {
  href: string
  label: string
  desc: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
}

const menuSections: NavSection[] = [
  {
    title: 'OPERASIONAL & SCAN',
    items: [
      {
        href: '/dashboard',
        label: 'Overview',
        desc: 'Ringkasan & statistik utama aset',
        icon: <LayoutDashboard className="w-4 h-4 text-[#2A4416]" />,
      },
      {
        href: '/dashboard/scanner',
        label: 'QR Scanner',
        desc: 'Pindai barcode & label QR fisik',
        icon: <Camera className="w-4 h-4 text-emerald-600" />,
      },
      {
        href: '/dashboard/assets/print-labels',
        label: 'Cetak Label QR',
        desc: 'Generate & print batch label QR aset',
        icon: <Printer className="w-4 h-4 text-teal-600" />,
      },
      {
        href: '/dashboard/opname',
        label: 'Stock Opname',
        desc: 'Audit fisik & rekonsiliasi berkala',
        icon: <ClipboardCheck className="w-4 h-4 text-lime-600" />,
      },
      {
        href: '/dashboard/work-orders',
        label: 'Work Orders',
        desc: 'Perintah kerja & pemeliharaan teknisi',
        icon: <ClipboardList className="w-4 h-4 text-amber-600" />,
      },
      {
        href: '/dashboard/maintenance',
        label: 'Jadwal Pemeliharaan',
        desc: 'Preventive service & perbaikan',
        icon: <Wrench className="w-4 h-4 text-orange-600" />,
      },
    ],
  },
  {
    title: 'DATA INVENTARIS',
    items: [
      {
        href: '/dashboard/assets',
        label: 'Daftar Aset',
        desc: 'Katalog lengkap inventaris perusahaan',
        icon: <Box className="w-4 h-4 text-blue-600" />,
      },
      {
        href: '/dashboard/vendors',
        label: 'Mitra Vendor',
        desc: 'Penyedia servis & supplier aset',
        icon: <Truck className="w-4 h-4 text-sky-600" />,
      },
      {
        href: '/dashboard/locations',
        label: 'Lokasi Fisik',
        desc: 'Gedung, lantai, dan ruangan',
        icon: <MapPin className="w-4 h-4 text-indigo-600" />,
      },
      {
        href: '/dashboard/business-units',
        label: 'Unit Bisnis',
        desc: 'Entitas cabang & unit operasional',
        icon: <Building2 className="w-4 h-4 text-violet-600" />,
      },
      {
        href: '/dashboard/asset-categories',
        label: 'Kategori Aset',
        desc: 'Klasifikasi & pengelompokan jenis',
        icon: <Tag className="w-4 h-4 text-purple-600" />,
      },
    ],
  },
  {
    title: 'FINANSIAL & LAPORAN',
    items: [
      {
        href: '/dashboard/depreciation',
        label: 'Penyusutan Nilai',
        desc: 'Depresiasi garis lurus & nilai buku',
        icon: <TrendingDown className="w-4 h-4 text-rose-600" />,
      },
      {
        href: '/dashboard/disposal',
        label: 'Pelepasan / Disposal',
        desc: 'Penghapusan, hibah & lelang aset',
        icon: <Trash2 className="w-4 h-4 text-red-600" />,
      },
      {
        href: '/dashboard/reports',
        label: 'Pusat Laporan',
        desc: 'Ekspor data, PDF & analisis komprehensif',
        icon: <FileText className="w-4 h-4 text-cyan-600" />,
      },
    ],
  },
  {
    title: 'SISTEM & AKUN',
    items: [
      {
        href: '/dashboard/settings/users',
        label: 'Manajemen Pengguna',
        desc: 'Hak akses & akun personel',
        icon: <Settings className="w-4 h-4 text-slate-700" />,
      },
      {
        href: '/dashboard/settings/audit-log',
        label: 'Audit Log & Jejak',
        desc: 'Rekaman aktivitas & jejak sistem',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-700" />,
      },
    ],
  },
]

export default function AppleTopMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
  profile?: Profile
}) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Auto-close ONLY when route actually changes
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      onClose()
    }
  }, [pathname, onClose])

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={clsx(
          'fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[98] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
      />

      {/* Full-Screen Top Slide-Down Menu Sheet (reaches all the way to the bottom) */}
      <div
        className={clsx(
          'fixed inset-0 h-full h-[100dvh] w-full z-[100] bg-[#FAFCFA] flex flex-col shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto overscroll-contain',
          isOpen
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-full opacity-0 pointer-events-none'
        )}
      >
        {/* Menu Content Container */}
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-16 space-y-6">
          {/* Grid of Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5">
                  {section.title}
                </h4>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={clsx(
                          'group flex items-start gap-3 p-2.5 rounded-2xl transition-all duration-150',
                          isActive
                            ? 'bg-pale-100/90 text-charcoal border border-mint-300 font-bold shadow-2xs'
                            : 'hover:bg-white hover:shadow-2xs text-slate-700 hover:text-charcoal border border-transparent hover:border-cloud-200/80'
                        )}
                      >
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105',
                            isActive ? 'bg-white shadow-2xs' : 'bg-surface-100 group-hover:bg-white'
                          )}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold leading-tight">
                              {item.label}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
