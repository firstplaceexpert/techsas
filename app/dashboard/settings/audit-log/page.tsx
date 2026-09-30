import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, ChevronRight } from 'lucide-react'
import { requireRole } from '@/lib/auth/permissions'
import { getAuditLogs } from './actions'
import AuditLogClient from './AuditLogClient'

export const metadata: Metadata = {
  title: 'Audit Log & Jejak Aktivitas — TECHSAS',
  description: 'Rekaman lengkap riwayat perubahan data dan aktivitas pengguna',
}

export default async function AuditLogPage() {
  await requireRole('super_admin', 'corporate_admin')

  const initialData = await getAuditLogs({ page: 1, pageSize: 25 })

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/dashboard/settings" className="hover:text-slate-600 transition-colors">
            Pengaturan
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-medium">Audit Log</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                <ShieldCheck className="w-5 h-5" />
              </span>
              Audit Log & Jejak Aktivitas
            </h1>
            <p className="page-subtitle">
              Riwayat kronologis seluruh tindakan, perubahan aset, work order, dan mutasi data oleh pengguna
            </p>
          </div>
        </div>
      </div>

      <AuditLogClient initialData={initialData} />
    </div>
  )
}
