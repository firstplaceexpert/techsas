import type { Metadata } from 'next'
import Link from 'next/link'
import { Truck, ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/permissions'
import { getVendors } from './actions'
import VendorListClient from './VendorListClient'

export const metadata: Metadata = {
  title: 'Mitra Rekanan & Vendor — TECHSAS',
  description: 'Manajemen direktori vendor eksternal, kontraktor, dan supplier spare parts TECHSAS',
}

export default async function VendorsPage() {
  const user = await getCurrentUser()
  const canManage = user?.profile
    ? ['super_admin', 'corporate_admin', 'unit_admin'].includes(user.profile.role)
    : false

  const initialData = await getVendors({ page: 1, pageSize: 20 })

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-medium">Mitra Rekanan & Vendor</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                <Truck className="w-5 h-5" />
              </span>
              Mitra Rekanan & Vendor
            </h1>
            <p className="page-subtitle">
              Direktori mitra teknis eksternal, supplier suku cadang, dan kontraktor pemeliharaan aset
            </p>
          </div>
        </div>
      </div>

      <VendorListClient initialData={initialData} canManage={canManage} />
    </div>
  )
}
