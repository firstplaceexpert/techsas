import Link from 'next/link'
import {
  ClipboardCheck,
  Plus,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { getOpnameSessions } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Opname & Audit Fisik - TECHSAS TECHSAS',
}

export default async function OpnamePage() {
  const sessions = await getOpnameSessions()

  const inProgressCount = sessions.filter((s) => s.status === 'in_progress').length
  const completedCount = sessions.filter((s) => s.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Stock Opname & Audit Fisik</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit fisik berkala keberadaan aset di seluruh unit usaha dan lokasi TECHSAS.
          </p>
        </div>

        <Link
          href="/dashboard/opname/new"
          className="btn-primary flex items-center gap-2 self-start"
          id="btn-create-opname-session"
        >
          <Plus className="w-4 h-4" /> Mulai Sesi Opname Baru
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pale-100 text-charcoal flex items-center justify-center font-bold">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Sesi Audit</p>
            <p className="text-xl font-bold text-slate-900">{sessions.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Sedang Berjalan</p>
            <p className="text-xl font-bold text-amber-600">{inProgressCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Selesai / Ditutup</p>
            <p className="text-xl font-bold text-emerald-600">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Daftar Sesi Stock Opname
          </h2>
        </div>

        {sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Belum ada sesi audit opname.</p>
            <p className="mt-1">Klik tombol di atas untuk memulai sesi scanning fisik baru.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`badge text-xs font-semibold ${
                        session.status === 'in_progress'
                          ? 'badge-yellow'
                          : 'badge-green'
                      }`}
                    >
                      {session.status === 'in_progress'
                        ? 'Sedang Berlangsung'
                        : 'Selesai'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {session.business_unit?.name}
                    </span>
                    {session.location && (
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {session.location.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Mulai:{' '}
                      {new Date(session.started_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {session.finished_at && (
                      <span>
                        Selesai:{' '}
                        {new Date(session.finished_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    <span>Auditor: {session.conductor?.full_name || 'Staff Unit'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/dashboard/opname/${session.id}`}
                    className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3.5 font-semibold"
                  >
                    Buka Workspace Audit <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
