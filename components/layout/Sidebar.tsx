'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Box,
  Building2,
  LayoutDashboard,
  MapPin,
  Settings,
  Tag,
  Camera,
  Printer,
  ClipboardCheck,
  Wrench,
  TrendingDown,
  Trash2,
  FileText,
  X,
  Truck,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { Profile } from '@/types'

interface NavGroup {
  groupLabel?: string
  items: {
    href: string
    label: string
    icon: React.ReactNode
  }[]
}

const navigationGroups: NavGroup[] = [
  {
    items: [
      {
        href: '/dashboard',
        label: 'Overview',
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
    ],
  },
  {
    groupLabel: 'OPERASIONAL & SCAN',
    items: [
      {
        href: '/dashboard/scanner',
        label: 'QR Scanner',
        icon: <Camera className="w-5 h-5" />,
      },
      {
        href: '/dashboard/assets/print-labels',
        label: 'Cetak Label QR',
        icon: <Printer className="w-5 h-5" />,
      },
      {
        href: '/dashboard/opname',
        label: 'Stock Opname',
        icon: <ClipboardCheck className="w-5 h-5" />,
      },
      {
        href: '/dashboard/work-orders',
        label: 'Work Orders',
        icon: <ClipboardList className="w-5 h-5" />,
      },
      {
        href: '/dashboard/maintenance',
        label: 'Jadwal Pemeliharaan',
        icon: <Wrench className="w-5 h-5" />,
      },
    ],
  },
  {
    groupLabel: 'DATA INVENTARIS',
    items: [
      {
        href: '/dashboard/assets',
        label: 'Daftar Aset',
        icon: <Box className="w-5 h-5" />,
      },
      {
        href: '/dashboard/vendors',
        label: 'Mitra Vendor',
        icon: <Truck className="w-5 h-5" />,
      },
      {
        href: '/dashboard/locations',
        label: 'Lokasi Fisik',
        icon: <MapPin className="w-5 h-5" />,
      },
      {
        href: '/dashboard/business-units',
        label: 'Unit Bisnis',
        icon: <Building2 className="w-5 h-5" />,
      },
      {
        href: '/dashboard/asset-categories',
        label: 'Kategori Aset',
        icon: <Tag className="w-5 h-5" />,
      },
    ],
  },
  {
    groupLabel: 'FINANSIAL & SIKLUS',
    items: [
      {
        href: '/dashboard/depreciation',
        label: 'Penyusutan Nilai',
        icon: <TrendingDown className="w-5 h-5" />,
      },
      {
        href: '/dashboard/disposal',
        label: 'Pelepasan / Disposal',
        icon: <Trash2 className="w-5 h-5" />,
      },
      {
        href: '/dashboard/reports',
        label: 'Pusat Laporan',
        icon: <FileText className="w-5 h-5" />,
      },
    ],
  },
  {
    groupLabel: 'SISTEM',
    items: [
      {
        href: '/dashboard/settings/users',
        label: 'Manajemen User',
        icon: <Settings className="w-5 h-5" />,
      },
      {
        href: '/dashboard/settings/audit-log',
        label: 'Audit Log & Jejak',
        icon: <ShieldCheck className="w-5 h-5" />,
      },
    ],
  },
]

interface SidebarProps {
  profile: Profile
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ profile, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 
        Expand-on-Hover Apple Sidebar:
        - Default state (no hover): compact width w-[76px], displaying ONLY icons.
        - Hover state: expands smoothly to w-[270px], revealing section titles, labels, & branding.
      */}
      <aside
        className={clsx(
          'group/sidebar fixed top-0 left-0 h-full z-50 flex flex-col',
          'transition-all duration-300 ease-in-out',
          'bg-white border-r border-cloud-200 shadow-apple',
          // Tablet & Laptop: compact 76px, expands to 270px on hover
          'w-[270px] md:w-[76px] md:hover:w-[270px] md:hover:shadow-2xl',
          // Mobile HP: drawer slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-cloud-100 flex-shrink-0 h-16 overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            {/* Logo Mark: Always visible */}
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-cloud-200/80 bg-white flex items-center justify-center p-0.5 shadow-2xs">
              <img
                src="/techsas-logo.png"
                alt="TECHSAS"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Brand Title: Expands on hover */}
            <div className="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 md:w-0 md:group-hover/sidebar:w-auto">
              <span className="font-sans font-black tracking-[0.16em] text-lg text-charcoal leading-none">
                TECHSAS
              </span>
              <span className="text-[9px] text-slate-400 font-medium tracking-tight mt-1">
                Universal Asset Platform
              </span>
            </div>
          </Link>

          {/* Close button on mobile HP only */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-charcoal hover:bg-cloud-100 active:bg-cloud-200 transition-colors"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3.5 px-3 scrollbar-thin space-y-3.5 overflow-x-hidden">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {/* Group Label / Divider */}
              {group.groupLabel && (
                <div className="py-1">
                  {/* Subtle divider in collapsed mode */}
                  <div className="h-px bg-cloud-200/60 mx-1 block md:group-hover/sidebar:hidden" />
                  {/* Section Title when hovered / on mobile */}
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider px-2 uppercase whitespace-nowrap overflow-hidden block md:hidden md:group-hover/sidebar:block transition-all duration-200">
                    {group.groupLabel}
                  </p>
                </div>
              )}

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => onClose?.()}
                        title={item.label}
                        className={clsx(
                          'flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative overflow-hidden',
                          active
                            ? 'bg-pale-100 text-charcoal shadow-xs border border-mint-300/80 font-bold'
                            : 'text-slate-600 hover:text-charcoal hover:bg-surface-100'
                        )}
                      >
                        {/* Section Icon: Always visible and centered in collapsed mode */}
                        <span
                          className={clsx(
                            'shrink-0 flex items-center justify-center w-5 h-5 transition-colors',
                            active ? 'text-[#2A4416]' : 'text-slate-500'
                          )}
                        >
                          {item.icon}
                        </span>

                        {/* Section Title / Label: Revealed on hover */}
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis transition-opacity duration-200 block md:hidden md:group-hover/sidebar:block">
                          {item.label}
                        </span>

                        
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Footer Card */}
        <div className="p-3 border-t border-cloud-100 flex-shrink-0 bg-surface-50 overflow-hidden">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-white border border-cloud-200 shadow-xs overflow-hidden">
            {/* User Avatar: Always visible */}
            <div className="relative shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-8 h-8 rounded-full object-cover shadow-xs border border-cloud-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {profile.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
              )}
              <span
                className="w-2.5 h-2.5 rounded-full bg-mint-500 ring-2 ring-white absolute -bottom-0.5 -right-0.5"
                title="Online"
              />
            </div>

            {/* User Info: Revealed on hover */}
            <div className="min-w-0 flex-1 whitespace-nowrap overflow-hidden transition-all duration-300 block md:hidden md:group-hover/sidebar:block">
              <p className="text-charcoal text-xs font-bold truncate leading-tight">
                {profile.full_name || 'User'}
              </p>
              <p className="text-slate-500 text-[10px] truncate capitalize mt-0.5">
                {profile.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
