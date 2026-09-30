import Link from 'next/link'
import { Plus, Pencil, Tag } from 'lucide-react'
import { getAssetCategories } from './actions'
import { requireRole } from '@/lib/auth/permissions'
import DeleteCategoryButton from './DeleteButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kategori Aset' }

const methodLabel: Record<string, string> = {
  straight_line: 'Garis Lurus',
  declining_balance: 'Saldo Menurun',
}

export default async function AssetCategoriesPage() {
  const profile = await requireRole('super_admin', 'corporate_admin')
  const categories = await getAssetCategories()

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori Aset</h1>
          <p className="page-subtitle">{categories.length} kategori aktif</p>
        </div>
        <Link href="/dashboard/asset-categories/new" className="btn-primary" id="btn-add-category">
          <Plus className="w-4 h-4" /> Tambah Kategori
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Tag className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-slate-600 font-medium">Belum ada kategori</h3>
          <Link href="/dashboard/asset-categories/new" className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Tambah Sekarang
          </Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Kategori / Klasifikasi</th>
                <th>Kode Akun (CoA)</th>
                <th>Umur Ekonomis (Default)</th>
                <th>Metode Penyusutan</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <span className="font-medium text-slate-900">{cat.name}</span>
                    </div>
                  </td>
                  <td>
                    {cat.account_code_asset ? (
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-700 font-bold inline-block">
                          {cat.account_code_asset}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Akum: {cat.account_code_accum || '—'} | Beban: {cat.account_code_expense || '—'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Belum diatur</span>
                    )}
                  </td>
                  <td>{cat.default_useful_life_months} bulan ({(cat.default_useful_life_months / 12).toFixed(1)} tahun)</td>
                  <td>
                    <span className={cat.default_depreciation_method === 'straight_line' ? 'badge-blue' : 'badge-purple'}>
                      {methodLabel[cat.default_depreciation_method]}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/asset-categories/${cat.id}/edit`} className="btn-ghost btn-sm" id={`btn-edit-cat-${cat.id}`}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                      {profile.role === 'super_admin' && (
                        <DeleteCategoryButton id={cat.id} name={cat.name} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
