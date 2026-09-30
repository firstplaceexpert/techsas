import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, ChevronRight, Plus } from 'lucide-react'
import { getWorkOrders } from './actions'
import { getVendors } from '../vendors/actions'
import WorkOrderListClient from './WorkOrderListClient'

export const metadata: Metadata = {
  title: 'Work Orders & Pemeliharaan Teknis — TECHSAS',
  description: 'Sistem penerbitan tiket perintah kerja teknis, perbaikan aset, dan monitoring SLA vendor',
}

export default async function WorkOrdersPage() {
  const [initialData, vendorsResult] = await Promise.all([
    getWorkOrders({ page: 1, pageSize: 20 }),
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
          <span className="text-slate-700 font-medium">Work Orders</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                <ClipboardList className="w-5 h-5" />
              </span>
              Work Orders (Perintah Kerja)
            </h1>
            <p className="page-subtitle">
              Penerbitan tiket perbaikan, pelacakan SLA perbaikan vendor, dan pencatatan biaya suku cadang
            </p>
          </div>
        </div>
      </div>

      <WorkOrderListClient
        initialData={initialData}
        vendors={vendorsResult.data}
      />
    </div>
  )
}
