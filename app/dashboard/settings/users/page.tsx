import Link from 'next/link'
import { Users, Pencil } from 'lucide-react'
import { getUsers } from './actions'
import { requireRole } from '@/lib/auth/permissions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manajemen User' }

const roleBadge: Record<string, string> = {
  super_admin: 'badge-red',
  corporate_admin: 'badge-purple',
  unit_admin: 'badge-blue',
  field_officer: 'badge-green',
  viewer: 'badge-slate',
}
const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  corporate_admin: 'Corporate Admin',
  unit_admin: 'Unit Admin',
  field_officer: 'Field Officer',
  viewer: 'Viewer',
}

export default async function UsersPage() {
  await requireRole('super_admin', 'corporate_admin')
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen User</h1>
          <p className="page-subtitle">{users.length} user terdaftar</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-slate-600 font-medium">Belum ada user</h3>
          <p className="text-slate-400 text-sm mt-1">User akan muncul setelah mendaftar melalui Supabase Auth.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Role</th>
                <th>Unit Bisnis</th>
                <th>Departemen</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-brand-700">
                          {user.full_name?.charAt(0).toUpperCase() ?? 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.full_name || '(Belum diisi)'}</p>
                        <p className="text-xs text-slate-400">{user.phone ?? ''}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={roleBadge[user.role] ?? 'badge-slate'}>
                      {roleLabel[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="text-slate-500">{user.business_unit?.name ?? <span className="text-slate-300 italic">Semua Unit</span>}</td>
                  <td className="text-slate-500">{user.department ?? '—'}</td>
                  <td>
                    <span className={user.is_active ? 'badge-green' : 'badge-slate'}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <Link
                        href={`/dashboard/settings/users/${user.id}/edit`}
                        className="btn-ghost btn-sm"
                        id={`btn-edit-user-${user.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Role
                      </Link>
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
