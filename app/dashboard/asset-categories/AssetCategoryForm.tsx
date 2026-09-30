'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, BookOpen, Sparkles } from 'lucide-react'
import { assetCategorySchema, type AssetCategoryFormValues } from '@/lib/validations/asset-category'
import { createAssetCategory, updateAssetCategory } from './actions'
import type { AssetCategory } from '@/types'

interface Props {
  initialData?: AssetCategory
  categoryId?: string
  onSubmit?: (values: AssetCategoryFormValues) => Promise<{ success: boolean; error?: string }>
  submitLabel?: string
}

const COA_PRESETS = [
  {
    name: 'IT Equipment & Komputer',
    asset: '1-1201',
    accum: '1-1202',
    expense: '5-2101',
    months: 48,
    method: 'declining_balance' as const,
  },
  {
    name: 'Mesin, HVAC & Peralatan ME',
    asset: '1-1203',
    accum: '1-1204',
    expense: '5-2102',
    months: 96,
    method: 'straight_line' as const,
  },
  {
    name: 'Furniture & Fixtures',
    asset: '1-1205',
    accum: '1-1206',
    expense: '5-2103',
    months: 120,
    method: 'straight_line' as const,
  },
  {
    name: 'Kendaraan Operasional',
    asset: '1-1207',
    accum: '1-1208',
    expense: '5-2104',
    months: 60,
    method: 'straight_line' as const,
  },
  {
    name: 'Gedung & Bangunan',
    asset: '1-1209',
    accum: '1-1210',
    expense: '5-2105',
    months: 240,
    method: 'straight_line' as const,
  },
]

export default function AssetCategoryForm({ initialData, categoryId, onSubmit, submitLabel }: Props) {
  const router = useRouter()
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, setError } = useForm<AssetCategoryFormValues>({
    resolver: zodResolver(assetCategorySchema),
    defaultValues: {
      name: initialData?.name ?? '',
      account_code_asset: initialData?.account_code_asset ?? '',
      account_code_accum: initialData?.account_code_accum ?? '',
      account_code_expense: initialData?.account_code_expense ?? '',
      default_useful_life_months: initialData?.default_useful_life_months ?? 60,
      default_depreciation_method: initialData?.default_depreciation_method ?? 'straight_line',
    },
  })

  const applyPreset = (preset: typeof COA_PRESETS[0]) => {
    if (!watch('name')) setValue('name', preset.name)
    setValue('account_code_asset', preset.asset)
    setValue('account_code_accum', preset.accum)
    setValue('account_code_expense', preset.expense)
    setValue('default_useful_life_months', preset.months)
    setValue('default_depreciation_method', preset.method)
  }

  const handleFormSubmit = async (values: AssetCategoryFormValues) => {
    let result: { success: boolean; error?: string }
    if (onSubmit) {
      result = await onSubmit(values)
    } else if (initialData?.id || categoryId) {
      result = await updateAssetCategory(initialData?.id || categoryId!, values)
    } else {
      result = await createAssetCategory(values)
    }
    if (!result.success) { setError('root', { message: result.error }); return }
    router.push('/dashboard/asset-categories')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-xl">
      {/* Preset Cepat Standar CoA */}
      <div className="p-3.5 bg-brand-50/70 border border-brand-200/70 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-800">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Preset Standar Akuntansi & Bagan Akun (CoA):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COA_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 text-xs bg-white hover:bg-brand-100 hover:text-brand-900 border border-brand-200 rounded-lg font-medium text-slate-700 shadow-sm transition-all flex items-center gap-1"
            >
              <span className="font-mono font-bold text-brand-700">[{p.asset}]</span>
              <span>{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          Klik salah satu preset untuk mengisi kode akun CoA dan masa manfaat secara instan.
        </p>
      </div>

      <div>
        <label htmlFor="cat-name" className="label">Nama Kategori / Klasifikasi <span className="text-red-500">*</span></label>
        <input id="cat-name" {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Contoh: Furniture & Fixture" />
        {errors.name && <p className="field-error">{errors.name.message}</p>}
      </div>

      {/* --- SECTION: Bagan Akun (CoA) --- */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3.5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-600" />
          <h4 className="text-sm font-semibold text-slate-800">Pemetaan Chart of Accounts (CoA) Default</h4>
        </div>
        <p className="text-xs text-slate-500">
          Kode akun ini akan otomatis mengisi form setiap aset baru yang memilih kategori ini, dan dapat disesuaikan per unit bisnis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="cat-coa-asset" className="text-xs font-medium text-slate-700 block mb-1">
              Kode Akun Aset
            </label>
            <input
              id="cat-coa-asset"
              {...register('account_code_asset')}
              placeholder="Misal: 1-1205"
              className="input text-xs font-mono font-semibold"
            />
            <span className="text-[10px] text-slate-400">Debit saat perolehan</span>
          </div>

          <div>
            <label htmlFor="cat-coa-accum" className="text-xs font-medium text-slate-700 block mb-1">
              Akum. Penyusutan
            </label>
            <input
              id="cat-coa-accum"
              {...register('account_code_accum')}
              placeholder="Misal: 1-1206"
              className="input text-xs font-mono font-semibold"
            />
            <span className="text-[10px] text-slate-400">Kredit (Kontra Aset)</span>
          </div>

          <div>
            <label htmlFor="cat-coa-expense" className="text-xs font-medium text-slate-700 block mb-1">
              Beban Penyusutan
            </label>
            <input
              id="cat-coa-expense"
              {...register('account_code_expense')}
              placeholder="Misal: 5-2103"
              className="input text-xs font-mono font-semibold"
            />
            <span className="text-[10px] text-slate-400">Debit beban bulanan</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="cat-life" className="label mb-0">Umur Ekonomis Default (bulan) <span className="text-red-500">*</span></label>
          <span className="text-xs text-brand-600 font-semibold font-mono">
            {watch('default_useful_life_months') ? `${(watch('default_useful_life_months') / 12).toFixed(1)} Tahun` : ''}
          </span>
        </div>
        <input
          id="cat-life"
          type="number"
          min={1}
          max={600}
          {...register('default_useful_life_months', { valueAsNumber: true })}
          className={`input ${errors.default_useful_life_months ? 'input-error' : ''}`}
        />
        {errors.default_useful_life_months && <p className="field-error">{errors.default_useful_life_months.message}</p>}
        <p className="mt-1.5 text-xs text-slate-400">Nilai ini otomatis langsung mengisi form aset baru saat kategori ini dipilih.</p>
      </div>

      <div>
        <label htmlFor="cat-method" className="label">Metode Penyusutan Default <span className="text-red-500">*</span></label>
        <select id="cat-method" {...register('default_depreciation_method')} className="input">
          <option value="straight_line">Garis Lurus (Straight Line)</option>
          <option value="declining_balance">Saldo Menurun (Declining Balance)</option>
        </select>
      </div>

      {errors.root && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errors.root.message}</div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary" id="cat-form-submit">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : submitLabel}
        </button>
        <button type="button" onClick={() => router.push('/dashboard/asset-categories')} className="btn-secondary">Batal</button>
      </div>
    </form>
  )
}
