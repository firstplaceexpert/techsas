import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/permissions'
import AssetCategoryForm from '../../AssetCategoryForm'
import { getAssetCategoryById } from '../../actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Kategori Aset' }

export default async function EditAssetCategoryPage({ params }: { params: { id: string } }) {
  await requireRole('super_admin', 'corporate_admin')
  const category = await getAssetCategoryById(params.id)
  if (!category) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/asset-categories" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </Link>
        <h1 className="page-title">Edit Kategori Aset</h1>
        <p className="page-subtitle">{category.name}</p>
      </div>
      <div className="card card-body">
        <AssetCategoryForm initialData={category} categoryId={params.id} submitLabel="Simpan Perubahan" />
      </div>
    </div>
  )
}
