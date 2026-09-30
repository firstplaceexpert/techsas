import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/permissions'
import { getUserById, updateUserRole } from '../../actions'
import { getBusinessUnits } from '../../../../business-units/actions'
import UserRoleForm from '../../UserRoleForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Role User' }

export default async function EditUserPage({ params }: { params: { id: string } }) {
  await requireRole('super_admin', 'corporate_admin')
  const [user, businessUnits] = await Promise.all([getUserById(params.id), getBusinessUnits()])
  if (!user) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/settings/users" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Manajemen User
        </Link>
        <h1 className="page-title">Edit Role User</h1>
        <p className="page-subtitle">{user.full_name}</p>
      </div>
      <div className="card card-body">
        <UserRoleForm user={user} businessUnits={businessUnits} onSubmit={updateUserRole} />
      </div>
    </div>
  )
}
