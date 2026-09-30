'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardCheck,
  Building2,
  MapPin,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { createOpnameSession } from '../actions'
import type { BusinessUnit, Location } from '@/types'

export default function NewOpnameClient({
  businessUnits,
  locations,
}: {
  businessUnits: BusinessUnit[]
  locations: Location[]
}) {
  const router = useRouter()
  const [businessUnitId, setBusinessUnitId] = useState(businessUnits[0]?.id || '')
  const [locationId, setLocationId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredLocations = locations.filter(
    (l) => !businessUnitId || l.business_unit_id === businessUnitId
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessUnitId) return

    setLoading(true)
    setError(null)

    const res = await createOpnameSession({
      business_unit_id: businessUnitId,
      location_id: locationId || null,
    })

    setLoading(false)

    if (res.success) {
      router.push(`/dashboard/opname/${res.data.id}`)
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/opname"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Opname
        </Link>
        <h1 className="page-title">Mulai Sesi Stock Opname</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tentukan unit bisnis dan area/ruangan yang akan diaudit fisiknya.
        </p>
      </div>

      <div className="card p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Bisnis Target <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={businessUnitId}
              onChange={(e) => {
                setBusinessUnitId(e.target.value)
                setLocationId('')
              }}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            >
              {businessUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lokasi / Gedung / Ruangan Spesifik (Opsional)
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Audit Seluruh Unit Bisnis (Semua Ruangan)</option>
              {filteredLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.level})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Jika memilih lokasi spesifik, sistem akan otomatis mencocokkan apakah aset yang discan benar-benar terdaftar di ruangan tersebut.
            </p>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading || !businessUnitId}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs shadow-lg shadow-brand-600/30"
              id="btn-submit-new-opname"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mempersiapkan Workspace Audit...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Mulai Audit & Buka Scanner
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
