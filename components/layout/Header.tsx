'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Bell,
  LogOut,
  Wrench,
  Trash2,
  Menu,
  Search,
} from 'lucide-react'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/actions/notifications'
import { logoutDemo } from '@/app/(auth)/login/actions'
import TechsasLogo from '@/components/brand/TechsasLogo'
import type { Profile, Notification } from '@/types'

export default function Header({
  profile,
  onOpenMobileMenu,
}: {
  profile: Profile
  onOpenMobileMenu?: () => void
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  return (
    <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-cloud-200 sticky top-0 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-30 transition-all">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:text-charcoal hover:bg-cloud-100 active:bg-cloud-200 transition-colors focus:outline-none"
          title="Buka Menu Navigasi"
          id="btn-open-mobile-menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <TechsasLogo variant="horizontal" iconSize={26} />
        </div>

        {/* Apple Style Global Quick Search */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cloud-100/80 border border-cloud-200 text-xs text-slate-400 w-64 hover:border-slate-300 transition-colors cursor-pointer"
             onClick={() => router.push('/dashboard/assets')}>
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Cari aset, serial, lokasi...</span>
          <span className="ml-auto text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-cloud-200 text-slate-400">⌘K</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell with Apple Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-cloud-100 hover:text-charcoal transition-colors relative"
            title="Notifikasi"
            id="header-notifications-btn"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-mint-500 ring-2 ring-white" />
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-apple-hover border border-cloud-200 overflow-hidden z-50 animate-fade-in">
              <div className="p-3.5 bg-surface-50 border-b border-cloud-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-charcoal">
                    Notifikasi Sistem
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-pale-100 text-[#2A4416] border border-mint-300 text-[10px] py-0.5 px-2 rounded-full font-bold">
                      {unreadCount} baru
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-slate-600 hover:text-charcoal font-semibold"
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
                      className={`p-3.5 flex items-start gap-3 hover:bg-surface-50 cursor-pointer transition-colors ${
                        !n.is_read ? 'bg-pale-50/60' : ''
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
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
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {!n.is_read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-mint-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-cloud-200" />

        {/* User Badge - Apple pill style */}
        <div className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-cloud-100 transition-colors">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User'}
              className="w-7 h-7 rounded-full object-cover border border-cloud-200 shadow-xs"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-charcoal text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {profile.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
          )}
          <span className="font-semibold text-xs text-charcoal hidden sm:block">
            {profile.full_name || 'User'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          id="header-logout-btn"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
          title="Keluar"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
