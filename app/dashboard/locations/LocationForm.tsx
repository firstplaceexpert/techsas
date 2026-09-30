'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { locationSchema, type LocationFormValues } from '@/lib/validations/location'
import { createLocation, updateLocation } from './actions'
import type { BusinessUnit, Location } from '@/types'

interface Props {
  initialData?: Location
  locationId?: string
  businessUnits: BusinessUnit[]
  locations: Location[]
  onSubmit?: (values: LocationFormValues) => Promise<{ success: boolean; error?: string }>
  submitLabel?: string
}

const levelOptions = [
  { value: 'site', label: 'Site (Komplek / Kawasan)' },
  { value: 'building', label: 'Building (Gedung)' },
  { value: 'floor', label: 'Floor (Lantai)' },
  { value: 'room', label: 'Room (Ruangan)' },
  { value: 'zone', label: 'Zone (Area / Zona)' },
]

export default function LocationForm({ initialData, locationId, businessUnits, locations, onSubmit, submitLabel = 'Simpan Lokasi' }: Props) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      business_unit_id: initialData?.business_unit_id ?? businessUnits[0]?.id ?? '',
      parent_id: initialData?.parent_id ?? null,
      level: initialData?.level ?? 'building',
    },
  })

  const selectedBuId = watch('business_unit_id')
  const availableParents = locations.filter(
    (l) => l.business_unit_id === selectedBuId && l.id !== initialData?.id
  )

  const handleFormSubmit = async (values: LocationFormValues) => {
    let result: { success: boolean; error?: string }
    if (onSubmit) {
      result = await onSubmit(values)
    } else if (initialData?.id || locationId) {
      result = await updateLocation(initialData?.id || locationId!, values)
    } else {
      result = await createLocation(values)
    }
    if (!result.success) {
      setError('root', { message: result.error })
      return
    }
    router.push('/dashboard/locations?bu=' + values.business_unit_id)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-lg">
      {/* Business Unit */}
      <div>
        <label htmlFor="loc-bu" className="label">Unit Bisnis <span className="text-red-500">*</span></label>
        <select id="loc-bu" {...register('business_unit_id')} className={`input ${errors.business_unit_id ? 'input-error' : ''}`}>
          {businessUnits.map((bu) => (
            <option key={bu.id} value={bu.id}>{bu.name}</option>
          ))}
        </select>
        {errors.business_unit_id && <p className="field-error">{errors.business_unit_id.message}</p>}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="loc-name" className="label">Nama Lokasi <span className="text-red-500">*</span></label>
        <input
          id="loc-name"
          {...register('name')}
          className={`input ${errors.name ? 'input-error' : ''}`}
          placeholder="Contoh: Lantai 1, Lobby, Ruang Server..."
        />
        {errors.name && <p className="field-error">{errors.name.message}</p>}
      </div>

      {/* Level */}
      <div>
        <label htmlFor="loc-level" className="label">Level Lokasi <span className="text-red-500">*</span></label>
        <select id="loc-level" {...register('level')} className={`input ${errors.level ? 'input-error' : ''}`}>
          {levelOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {errors.level && <p className="field-error">{errors.level.message}</p>}
      </div>

      {/* Parent */}
      <div>
        <label htmlFor="loc-parent" className="label">Lokasi Induk <span className="text-slate-400 font-normal">(opsional)</span></label>
        <select
          id="loc-parent"
          {...register('parent_id')}
          className="input"
        >
          <option value="">— Tidak ada (root) —</option>
          {availableParents.map((loc) => (
            <option key={loc.id} value={loc.id}>
              [{loc.level.toUpperCase()}] {loc.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">Kosongkan jika ini adalah lokasi paling atas (site/gedung utama).</p>
      </div>

      {errors.root && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {errors.root.message}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary" id="loc-form-submit">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : submitLabel}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Batal</button>
      </div>
    </form>
  )
}
