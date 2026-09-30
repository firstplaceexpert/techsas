import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Building2 } from 'lucide-react'
import { getBusinessUnits } from './actions'
import { requireRole } from '@/lib/auth/permissions'
import DeleteBusinessUnitButton from './DeleteButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Unit Bisnis' }

const typeLabels: Record<string, string> = {
  rental:     'Rental Armada',
  multimedia: 'Multimedia & Kamera',
  gaming:     'Gaming & Konsol',
  cafe:       'Cafe & Roastery',
  event:      'Audio & Event',
  hotel:      'Rental Armada',
  mall:       'Multimedia & Kamera',
  property:   'Gaming & Konsol',
  other:      'Unit Bisnis UMKM',
}

function getFallbackLogo(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('melaju')) return '/logos/melaju-rental-mobil.png'
  if (n.includes('bsm') || n.includes('kamera')) return '/logos/rental-kamera.png'
  if (n.includes('playstation') || n.includes('ps')) return '/logos/playstation-jogja.png'
  if (n.includes('couvee') || n.includes('coffee')) return '/logos/unit-property-5.png'
  if (n.includes('gigs') || n.includes('event')) return '/logos/gigs-production.png'
  return '/logos/melaju-rental-mobil.png'
}

export default async function BusinessUnitsPage() {
  const profile = await requireRole('super_admin', 'corporate_admin')
  const units = await getBusinessUnits()

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Unit Bisnis</h1>
          <p className="page-subtitle">{units.length} unit bisnis aktif terdaftar</p>
        </div>
        <Link
          href="/dashboard/business-units/new"
          className="btn-primary"
          id="btn-add-business-unit"
        >
          <Plus className="w-4 h-4" /> Tambah Unit Bisnis
        </Link>
      </div>

      {units.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-slate-600 font-medium">Belum ada unit bisnis</h3>
          <p className="text-slate-400 text-sm mt-1">
            Mulai dengan menambahkan unit bisnis pertama.
          </p>
          <Link href="/dashboard/business-units/new" className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Tambah Sekarang
          </Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Unit Bisnis</th>
                <th>Tipe / Sektor</th>
                <th>Alamat</th>
                <th>Dibuat</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => {
                const sectorLabel = typeLabels[unit.type] || unit.type
                const logoSrc = unit.logo_url || getFallbackLogo(unit.name)

                return (
                  <tr key={unit.id} className="hover:bg-brand-50/20 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-xl bg-surface-50 border border-cloud-200/80 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={unit.name}
                              className="max-h-7 w-auto max-w-full object-contain filter drop-shadow-2xs"
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-brand-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-charcoal">{unit.name}</span>
                            {unit.code && (
                              <span className="text-[10px] font-mono font-bold bg-surface-100 border border-cloud-200 text-slate-600 px-1.5 py-0.2 rounded">
                                {unit.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-slate-700">{sectorLabel}</span>
                    </td>
                    <td className="text-slate-500 max-w-xs truncate">{unit.address ?? '—'}</td>
                    <td className="text-slate-400 text-xs">
                      {new Date(unit.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/business-units/${unit.id}/edit`}
                          className="btn-ghost p-1.5 text-slate-500 hover:text-charcoal hover:bg-cloud-100 rounded-lg flex items-center gap-1 text-xs font-semibold"
                          title="Ubah Nama, Sektor, atau Logo Unit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        <DeleteBusinessUnitButton id={unit.id} name={unit.name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
