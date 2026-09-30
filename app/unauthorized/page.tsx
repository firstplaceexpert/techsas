import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Akses Ditolak',
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Akses Ditolak</h1>
        <p className="text-slate-500 mb-8">
          Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator
          jika Anda merasa ini adalah kesalahan.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary">
            Kembali ke Dashboard
          </Link>
          <Link href="/login" className="btn-secondary">
            Login Akun Lain
          </Link>
        </div>
      </div>
    </div>
  )
}
