import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/permissions'
import AssetCategoryForm from '../AssetCategoryForm'
import { createAssetCategory } from '../actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Kategori Aset' }

export default async function NewAssetCategoryPage() {
  await requireRole('super_admin', 'corporate_admin')
  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/asset-categories" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </Link>
        <h1 className="page-title">Tambah Kategori Aset</h1>
      </div>
      <div className="card card-body">
        <AssetCategoryForm onSubmit={createAssetCategory} submitLabel="Simpan Kategori" />
      </div>
    </div>
  )
}
