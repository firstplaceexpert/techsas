import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/permissions'
import { getWorkOrderById } from '../actions'
import WorkOrderDetailClient from './WorkOrderDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const wo = await getWorkOrderById(id)
  if (!wo) return { title: 'Work Order Tidak Ditemukan' }
  return {
    title: `${wo.wo_number} — ${wo.title} | TECHSAS`,
    description: `Detail perintah kerja untuk aset ${wo.asset?.name}`,
  }
}

export default async function WorkOrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const [wo, user] = await Promise.all([
    getWorkOrderById(id),
    getCurrentUser(),
  ])

  if (!wo) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Link href="/dashboard/work-orders" className="hover:text-slate-600 transition-colors">
          Work Orders
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-700 font-medium font-mono">{wo.wo_number}</span>
      </nav>

      <WorkOrderDetailClient
        initialWorkOrder={wo}
        currentUser={user?.profile || null}
      />
    </div>
  )
}
