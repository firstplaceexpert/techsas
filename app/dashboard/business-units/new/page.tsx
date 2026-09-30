import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/permissions'
import BusinessUnitForm from '../BusinessUnitForm'
import { createBusinessUnit } from '../actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Unit Bisnis' }

export default async function NewBusinessUnitPage() {
  await requireRole('super_admin', 'corporate_admin')

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/business-units" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Unit Bisnis
        </Link>
        <h1 className="page-title">Tambah Unit Bisnis</h1>
        <p className="page-subtitle">Daftarkan unit bisnis baru ke sistem TECHSAS</p>
      </div>
      <div className="card card-body">
        <BusinessUnitForm onSubmit={createBusinessUnit} submitLabel="Simpan Unit Bisnis" />
      </div>
    </div>
  )
}
