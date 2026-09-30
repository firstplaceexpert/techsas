import Link from 'next/link'
import { Users, ChevronRight, ShieldCheck } from 'lucide-react'
import { requireRole } from '@/lib/auth/permissions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function SettingsPage() {
  const profile = await requireRole('super_admin', 'corporate_admin', 'unit_admin')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Pengaturan</h1>
        <p className="page-subtitle">Konfigurasi sistem dan manajemen akses</p>
      </div>

      <div className="card divide-y divide-slate-50">
        {['super_admin', 'corporate_admin'].includes(profile.role) && (
          <>
            <Link href="/dashboard/settings/users" className="flex items-center gap-4 p-5 hover:bg-surface-50 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-brand-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Manajemen User</p>
                <p className="text-sm text-slate-400">Assign role dan unit bisnis ke pengguna</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </Link>

            <Link href="/dashboard/settings/audit-log" className="flex items-center gap-4 p-5 hover:bg-surface-50 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Audit Log & Jejak Aktivitas</p>
                <p className="text-sm text-slate-400">Riwayat audit trail, perubahan aset, dan aktivitas pengguna</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
