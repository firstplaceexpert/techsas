'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { updateUserRoleSchema, type UpdateUserRoleFormValues } from '@/lib/validations/user'
import type { BusinessUnit, ProfileWithUnit } from '@/types'

interface Props {
  user: ProfileWithUnit
  businessUnits: BusinessUnit[]
  onSubmit: (values: UpdateUserRoleFormValues) => Promise<{ success: boolean; error?: string }>
}

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'corporate_admin', label: 'Corporate Admin' },
  { value: 'unit_admin', label: 'Unit Admin' },
  { value: 'field_officer', label: 'Field Officer' },
  { value: 'viewer', label: 'Viewer' },
]

export default function UserRoleForm({ user, businessUnits, onSubmit }: Props) {
  const router = useRouter()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm<UpdateUserRoleFormValues>({
    resolver: zodResolver(updateUserRoleSchema),
    defaultValues: {
      user_id: user.id,
      role: user.role,
      business_unit_id: user.business_unit_id ?? undefined,
      full_name: user.full_name,
      department: user.department ?? '',
      phone: user.phone ?? '',
    },
  })

  const selectedRole = watch('role')
  const isCorporate = selectedRole === 'super_admin' || selectedRole === 'corporate_admin'

  const handleFormSubmit = async (values: UpdateUserRoleFormValues) => {
    const result = await onSubmit(values)
    if (!result.success) { setError('root', { message: result.error }); return }
    router.push('/dashboard/settings/users')
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-lg">
      <input {...register('user_id')} type="hidden" />

      <div>
        <label htmlFor="user-fullname" className="label">Nama Lengkap</label>
        <input id="user-fullname" {...register('full_name')} className={`input ${errors.full_name ? 'input-error' : ''}`} />
        {errors.full_name && <p className="field-error">{errors.full_name.message}</p>}
      </div>

      <div>
        <label htmlFor="user-role" className="label">Role <span className="text-red-500">*</span></label>
        <select id="user-role" {...register('role')} className="input">
          {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          {isCorporate
            ? 'Role corporate tidak perlu ditautkan ke unit bisnis tertentu.'
            : 'Role ini perlu ditautkan ke unit bisnis tertentu.'}
        </p>
      </div>

      {!isCorporate && (
        <div>
          <label htmlFor="user-bu" className="label">Unit Bisnis <span className="text-red-500">*</span></label>
          <select id="user-bu" {...register('business_unit_id')} className="input">
            <option value="">— Pilih unit bisnis —</option>
            {businessUnits.map((bu) => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
          </select>
          {errors.business_unit_id && <p className="field-error">{errors.business_unit_id.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="user-dept" className="label">Departemen</label>
        <input id="user-dept" {...register('department')} className="input" placeholder="Contoh: Engineering, F&B, HRD..." />
      </div>

      <div>
        <label htmlFor="user-phone" className="label">Nomor HP</label>
        <input id="user-phone" type="tel" {...register('phone')} className="input" placeholder="08xx-xxxx-xxxx" />
      </div>

      {errors.root && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errors.root.message}</div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary" id="user-role-form-submit">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
        </button>
        <button type="button" onClick={() => router.push('/dashboard/settings/users')} className="btn-secondary">Batal</button>
      </div>
    </form>
  )
}
