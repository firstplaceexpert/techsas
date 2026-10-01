'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Bell,
  LogOut,
  Wrench,
  Trash2,
  Search,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/actions/notifications'
import { logoutDemo } from '@/app/(auth)/login/actions'
import AppleTopMenu from './AppleTopMenu'
import type { Profile, Notification } from '@/types'

export default function Header({
  profile,
}: {
  profile?: Profile
  onOpenMobileMenu?: () => void
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobilePortalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  const handleToggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev)
  }, [])

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications(8)
      setNotifications(res?.notifications || [])
      setUnreadCount(res?.unreadCount || 0)
    } catch {
      // Demo fallback
    }
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const isInsideBell = dropdownRef.current?.contains(target)
      const isInsideMobilePortal = mobilePortalRef.current?.contains(target)
      if (!isInsideBell && !isInsideMobilePortal) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Shortcut Cmd+K / Ctrl+K to quickly focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    await logoutDemo()
    router.push('/login')
    router.refresh()
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead()
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markNotificationAsRead(n.id)
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      )
    }
    setIsOpen(false)
    if (n.related_asset_id) {
      router.push(`/dashboard/assets/${n.related_asset_id}`)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/assets?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/dashboard/assets')
    }
  }

  const renderNotificationList = () => (
    <>
      <div className="p-3 bg-surface-50 border-b border-cloud-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-charcoal">
            Notifikasi Sistem
          </span>
          {unreadCount > 0 && (
            <span className="bg-pale-100 text-[#2A4416] border border-mint-300 text-[10px] py-0.5 px-2 rounded-full font-bold whitespace-nowrap">
              {unreadCount} baru
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] text-slate-600 hover:text-charcoal font-semibold whitespace-nowrap"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-cloud-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Tidak ada notifikasi baru.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3 flex items-start gap-2.5 hover:bg-surface-50 cursor-pointer transition-colors ${
                !n.is_read ? 'bg-pale-50/60' : ''
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  n.type === 'maintenance_report'
                    ? 'bg-amber-100 text-amber-700'
                    : n.type === 'disposal_approval'
                    ? 'bg-cloud-200 text-charcoal'
                    : 'bg-pale-100 text-[#2A4416]'
                }`}
              >
                {n.type === 'maintenance_report' ? (
                  <Wrench className="w-3.5 h-3.5" />
                ) : n.type === 'disposal_approval' ? (
                  <Trash2 className="w-3.5 h-3.5" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-charcoal leading-snug">
                  {n.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                  {n.message}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {new Date(n.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {!n.is_read && (
                <div className="w-1.5 h-1.5 rounded-full bg-mint-500 flex-shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </>
  )

  return (
    <>
      <header className="h-11 sm:h-12 bg-white/85 backdrop-blur-xl border border-cloud-200/90 rounded-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.03)] inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 transition-all duration-200 w-fit">
        {/* Apple-style 2-Line Burger Menu Button (Layar Kecil / HP Saja) */}
        <button
          type="button"
          onClick={handleToggleMenu}
          id="header-apple-menu-btn"
          className="md:hidden w-8 h-8 rounded-full flex flex-col items-center justify-center gap-[5px] text-slate-700 hover:text-charcoal hover:bg-cloud-100 active:scale-95 transition-all group shrink-0"
          title={isMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
          aria-expanded={isMenuOpen}
        >
          <span
            className={clsx(
              'block w-[18px] h-[2px] bg-[#0F0F0F] rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center pointer-events-none shrink-0',
              isMenuOpen ? 'rotate-45 translate-y-[3.5px] !bg-danger-600' : ''
            )}
          />
          <span
            className={clsx(
              'block w-[18px] h-[2px] bg-[#0F0F0F] rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center pointer-events-none shrink-0',
              isMenuOpen ? '-rotate-45 -translate-y-[3.5px] !bg-danger-600' : ''
            )}
          />
        </button>

        <div className="md:hidden w-px h-4 bg-cloud-200/80 shrink-0" />

        {/* Compact Global Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex items-center w-36 sm:w-48 md:w-56 transition-all"
        >
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aset..."
            className="w-full pl-8 pr-9 sm:pr-11 py-1 text-xs bg-cloud-100/70 hover:bg-cloud-100 focus:bg-white text-charcoal placeholder:text-slate-400 rounded-full border border-cloud-200/80 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-mint-500/50 transition-all"
          />
          <div className="absolute right-2 flex items-center">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 rounded-full hover:bg-cloud-200 text-slate-400 hover:text-charcoal transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center text-[9px] font-mono font-medium text-slate-400 bg-white px-1 py-0.5 rounded border border-cloud-200 shadow-2xs pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>
        </form>

        <div className="w-px h-4 bg-cloud-200/80 shrink-0" />

        {/* Notifications */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center transition-colors relative',
              isOpen
                ? 'bg-cloud-200/80 text-charcoal'
                : 'text-slate-600 hover:bg-cloud-100 hover:text-charcoal'
            )}
            title="Notifikasi Sistem"
            id="header-notifications-btn"
            aria-expanded={isOpen}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-mint-500 ring-2 ring-white" />
            )}
          </button>

          {/* Desktop Dropdown: Centered below the bell with popover arrow */}
          {isOpen && (
            <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-96 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-50 border-t border-l border-cloud-200 rotate-45 z-10" />
              <div className="relative bg-white rounded-2xl shadow-apple-hover border border-cloud-200 overflow-hidden">
                {renderNotificationList()}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Dropdown Portal: Centered cleanly across the screen without containment bugs */}
        {isOpen && mounted && createPortal(
          <div ref={mobilePortalRef} className="sm:hidden fixed inset-0 z-[120]">
            <div
              className="absolute inset-0 bg-charcoal/25 backdrop-blur-[1px] transition-opacity"
              onClick={() => setIsOpen(false)}
            />
            <div className="relative z-10 mx-auto w-[calc(100%-24px)] max-w-sm mt-[62px] bg-white rounded-2xl shadow-apple-hover border border-cloud-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {renderNotificationList()}
            </div>
          </div>,
          document.body
        )}

        <div className="w-px h-4 bg-cloud-200/80 shrink-0" />

        {/* Logout Tool */}
        <button
          onClick={handleLogout}
          id="header-logout-btn"
          title="Keluar dari sistem"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-slate-600 hover:text-danger-600 hover:bg-danger-50 border border-transparent hover:border-danger-200/70 text-xs font-semibold transition-all group active:scale-95 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-danger-600 transition-colors" />
          <span className="hidden sm:inline text-xs">Keluar</span>
        </button>
      </header>

      {/* Apple-style Top Slide-Down Menu */}
      <AppleTopMenu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        profile={profile}
      />
    </>
  )
}
