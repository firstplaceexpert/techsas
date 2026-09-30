'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UploadCloud, Building2 } from 'lucide-react'
import { businessUnitSchema, type BusinessUnitFormValues } from '@/lib/validations/business-unit'
import { createBusinessUnit, updateBusinessUnit } from './actions'
import type { BusinessUnit } from '@/types'

const LOGO_PRESETS = [
  { label: 'Melaju Car Rental', path: '/logos/melaju-rental-mobil.png' },
  { label: 'BSM Rental Kamera', path: '/logos/rental-kamera.png' },
  { label: 'PlayStation Jogja', path: '/logos/playstation-jogja.png' },
  { label: 'Couvee Coffee', path: '/logos/unit-property-5.png' },
  { label: 'Gigs Production', path: '/logos/gigs-production.png' },
]

interface Props {
  initialData?: BusinessUnit
  unitId?: string
  onSubmit?: (values: BusinessUnitFormValues) => Promise<{ success: boolean; error?: string }>
  submitLabel?: string
}

export default function BusinessUnitForm({
  initialData,
  unitId,
  onSubmit,
  submitLabel = 'Simpan Unit Bisnis',
}: Props) {
  const router = useRouter()
  const [logoPreview, setLogoPreview] = useState<string>(initialData?.logo_url || '')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<BusinessUnitFormValues>({
    resolver: zodResolver(businessUnitSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      code: initialData?.code ?? '',
      type: (initialData?.type as any) ?? 'rental',
      logo_url: initialData?.logo_url ?? '',
      address: initialData?.address ?? '',
    },
  })

  const formName = watch('name')
  const formCode = watch('code')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoPreview(reader.result)
        setValue('logo_url', reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSelectPreset = (path: string) => {
    setLogoPreview(path)
    setValue('logo_url', path)
  }

  const handleFormSubmit = async (values: BusinessUnitFormValues) => {
    let result: { success: boolean; error?: string }
    if (onSubmit) {
      result = await onSubmit(values)
    } else if (initialData?.id || unitId) {
      result = await updateBusinessUnit(initialData?.id || unitId!, values)
    } else {
      result = await createBusinessUnit(values)
    }
    if (!result.success) {
      setError('root', { message: result.error })
      return
    }
    router.push('/dashboard/business-units')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-xl">
      {/* Name */}
      <div>
        <label htmlFor="bu-name" className="label">
          Nama Unit Bisnis / Usaha <span className="text-red-500">*</span>
        </label>
        <input
          id="bu-name"
          {...register('name')}
          className={`input ${errors.name ? 'input-error' : ''}`}
          placeholder="Contoh: Melaju Car Rental"
        />
        {errors.name && <p className="field-error">{errors.name.message}</p>}
      </div>

      {/* Code */}
      <div>
        <label htmlFor="bu-code" className="label">
          Kode Singkatan Unit (3-4 Huruf)
        </label>
        <input
          id="bu-code"
          {...register('code')}
          className="input font-mono font-bold uppercase"
          placeholder="Contoh: FLT, CAM, GME, CFE, EVT"
          maxLength={6}
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Digunakan sebagai penanda serial aset dan badge singkatan unit di dashboard.
        </p>
      </div>

      {/* Type */}
      <div>
        <label htmlFor="bu-type" className="label">
          Tipe / Sektor Bisnis <span className="text-red-500">*</span>
        </label>
        <select
          id="bu-type"
          {...register('type')}
          className={`input ${errors.type ? 'input-error' : ''}`}
        >
          <option value="rental">Rental Kendaraan & Armada Transportasi</option>
          <option value="multimedia">Rental Kamera, Lensa & Multimedia</option>
          <option value="gaming">Gaming Lounge & Rental Konsol PlayStation</option>
          <option value="cafe">Artisan Cafe, Coffee Shop & Roastery</option>
          <option value="event">Sound System, Audio & Event Production</option>
          <option value="other">Unit Bisnis / Sektor UMKM Lainnya</option>
        </select>
        {errors.type && <p className="field-error">{errors.type.message}</p>}
      </div>

      {/* Logo Section */}
      <div className="p-4 rounded-2xl bg-surface-50 border border-cloud-200 space-y-4">
        <label className="label mb-0">Logo Unit Bisnis</label>

        {/* Live Preview Box */}
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white border border-cloud-200">
          <div className="w-16 h-14 rounded-lg bg-surface-50 border border-cloud-200/80 p-1.5 flex items-center justify-center shrink-0">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="max-h-11 w-auto max-w-full object-contain"
              />
            ) : (
              <Building2 className="w-6 h-6 text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-charcoal block truncate">
              {formName || 'Nama Unit'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              Kode: {formCode || '—'}
            </span>
            <span className="text-[10px] text-mint-700 font-semibold block">
              {logoPreview ? '✓ Logo aktif terpasang' : 'Belum ada logo terpilih'}
            </span>
          </div>
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            accept="image/*"
            id="bu-logo-upload"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="bu-logo-upload"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-mint-400 bg-pale-50/80 hover:bg-pale-100 text-charcoal text-xs font-bold cursor-pointer transition-all active:scale-[0.99] text-center"
          >
            <UploadCloud className="w-4 h-4 text-[#2A4416]" />
            <span>Unggah File Logo dari Laptop / Komputer</span>
          </label>
          <p className="text-[10px] text-slate-400 text-center mt-1">
            Format file PNG, JPG, WEBP, atau SVG
          </p>
        </div>

        {/* Preset Logos */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
            Atau pilih dari logo UMKM yang sudah ada:
          </span>
          <div className="grid grid-cols-5 gap-2">
            {LOGO_PRESETS.map((opt) => (
              <button
                key={opt.path}
                type="button"
                onClick={() => handleSelectPreset(opt.path)}
                className={`h-12 p-1.5 rounded-xl border flex items-center justify-center transition-all bg-white ${
                  logoPreview === opt.path
                    ? 'border-mint-500 ring-2 ring-mint-300'
                    : 'border-cloud-200 hover:border-mint-300'
                }`}
                title={opt.label}
              >
                <img src={opt.path} alt={opt.label} className="max-h-7 w-auto object-contain" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="bu-address" className="label">
          Alamat Lokasi Unit
        </label>
        <textarea
          id="bu-address"
          {...register('address')}
          rows={3}
          className={`input resize-none ${errors.address ? 'input-error' : ''}`}
          placeholder="Jl. Laksda Adisucipto No.81, Sleman, Yogyakarta..."
        />
        {errors.address && <p className="field-error">{errors.address.message}</p>}
      </div>

      {/* Root error */}
      {errors.root && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {errors.root.message}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
          id="bu-form-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            submitLabel
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/business-units')}
          className="btn-secondary"
        >
          Batal
        </button>
      </div>
    </form>
  )
}
