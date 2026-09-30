'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import type { Profile } from '@/types'

interface DashboardShellProps {
  profile: Profile
  children: React.ReactNode
}

export default function DashboardShell({ profile, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Auto-close mobile sidebar whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex h-full min-h-screen bg-stone-50 print:bg-white print:block">
      {/* Sidebar with responsive drawer support (hidden in print) */}
      <div className="print:hidden">
        <Sidebar
          profile={profile}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content Area (removes sidebar indent in print) */}
      <div className="flex flex-col flex-1 min-w-0 w-full lg:pl-[76px] print:!pl-0 print:!ml-0 print:!block print:!w-full transition-all duration-300">
        <div className="print:hidden">
          <Header
            profile={profile}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3.5 sm:p-5 md:p-6 print:!p-0 print:!m-0 print:!overflow-visible print:!block print:!w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
