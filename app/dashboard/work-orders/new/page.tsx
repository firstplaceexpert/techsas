import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { getAssets } from '@/app/dashboard/assets/actions'
import { getVendors } from '@/app/dashboard/vendors/actions'
import WorkOrderForm from './WorkOrderForm'

export const metadata: Metadata = {
  title: 'Terbitkan Work Order Baru — TECHSAS',
  description: 'Formulir pembuatan tiket perintah kerja teknis dan pemeliharaan aset',
}

interface PageProps {
  searchParams: Promise<{ asset_id?: string }>
}

export default async function NewWorkOrderPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const assetId = resolvedParams.asset_id

  const [assetsResult, vendorsResult] = await Promise.all([
    getAssets({ pageSize: 150 }),
    getVendors({ pageSize: 100, isActive: true }),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/dashboard/work-orders" className="hover:text-slate-600 transition-colors">
            Work Orders
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-medium">Terbitkan WO Baru</span>
        </nav>

        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <ClipboardList className="w-5 h-5" />
            </span>
            Terbitkan Work Order Baru
          </h1>
          <p className="page-subtitle">
            Buat tiket pemeliharaan, tugaskan vendor rekanan, dan catat estimasi suku cadang
          </p>
        </div>
      </div>

      <WorkOrderForm
        assets={assetsResult.data}
        vendors={vendorsResult.data}
        preselectedAssetId={assetId}
      />
    </div>
  )
}
