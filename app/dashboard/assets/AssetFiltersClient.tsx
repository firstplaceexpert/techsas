'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { AssetCategory, BusinessUnit, AssetFilters } from '@/types'

interface Props {
  businessUnits: BusinessUnit[]
  categories: AssetCategory[]
  currentFilters: AssetFilters
}

export default function AssetFiltersClient({ businessUnits, categories, currentFilters }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(currentFilters.search ?? '')

  const applyFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(window.location.search)
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      router.push(`/dashboard/assets?${params.toString()}`)
    },
    [router]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilter('search', search)
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/dashboard/assets')
  }

  const hasFilters = currentFilters.search || currentFilters.businessUnitId || currentFilters.categoryId || currentFilters.status || currentFilters.condition

  return (
    <div className="card card-body">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode aset..."
              className="input pl-9"
              id="asset-search-input"
            />
          </div>
          <button type="submit" className="btn-primary btn-sm px-4" id="asset-search-btn">Cari</button>
        </form>

        {/* Business Unit filter */}
        <select
          value={currentFilters.businessUnitId ?? ''}
          onChange={(e) => applyFilter('businessUnitId', e.target.value)}
          className="input w-auto min-w-40"
          id="filter-business-unit"
        >
          <option value="">Semua Unit Bisnis</option>
          {businessUnits.map((bu) => (
            <option key={bu.id} value={bu.id}>{bu.name}</option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={currentFilters.categoryId ?? ''}
          onChange={(e) => applyFilter('categoryId', e.target.value)}
          className="input w-auto min-w-36"
          id="filter-category"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Condition filter */}
        <select
          value={currentFilters.condition ?? ''}
          onChange={(e) => applyFilter('condition', e.target.value)}
          className="input w-auto min-w-32"
          id="filter-condition"
        >
          <option value="">Semua Kondisi</option>
          <option value="good">Baik</option>
          <option value="fair">Cukup</option>
          <option value="damaged">Rusak</option>
          <option value="under_repair">Dalam Perbaikan</option>
        </select>

        {/* Status filter */}
        <select
          value={currentFilters.status ?? ''}
          onChange={(e) => applyFilter('status', e.target.value)}
          className="input w-auto min-w-28"
          id="filter-status"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="pending">Pending</option>
        </select>

        {/* Clear */}
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost btn-sm text-red-500 hover:bg-red-50 hover:text-red-700" id="btn-clear-filters">
            <X className="w-4 h-4" /> Reset
          </button>
        )}
      </div>
    </div>
  )
}
