import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/permissions'
import BusinessUnitForm from '../../BusinessUnitForm'
import { getBusinessUnitById } from '../../actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Unit Bisnis' }

export default async function EditBusinessUnitPage({
  params,
}: {
  params: { id: string }
}) {
  await requireRole('super_admin', 'corporate_admin')
  const unit = await getBusinessUnitById(params.id)
  if (!unit) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/business-units" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Unit Bisnis
        </Link>
        <h1 className="page-title">Edit Unit Bisnis</h1>
        <p className="page-subtitle">{unit.name}</p>
      </div>
      <div className="card card-body">
        <BusinessUnitForm
          initialData={unit}
          unitId={params.id}
          submitLabel="Simpan Perubahan"
        />
      </div>
    </div>
  )
}
