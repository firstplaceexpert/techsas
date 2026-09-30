import { getScanPortalData } from '../actions'
import ScanPortalClient from './ScanPortalClient'
import { AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { uuid: string }
}): Promise<Metadata> {
  const data = await getScanPortalData(params.uuid)
  if (!data?.asset) return { title: 'Aset Tidak Ditemukan - TECHSAS TECHSAS' }
  return {
    title: `${data.asset.name} (${data.asset.asset_code}) - TECHSAS Asset Portal`,
    description: `Portal verifikasi aset ${data.asset.name} - ${data.asset.business_unit?.name || 'TECHSAS'}`,
  }
}

export default async function PublicScanPage({
  params,
}: {
  params: { uuid: string }
}) {
  const data = await getScanPortalData(params.uuid)

  if (!data?.asset) {
    return (
      <main className="min-h-screen relative flex items-center justify-center p-4 bg-stone-900">
        {/* Background Image with Overlay */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url('/images/background.jpg')` }}
        >
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]" />
        </div>

        <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center border border-rose-100 shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 font-serif">Label QR Tidak Dikenali</h1>
          <p className="text-xs text-stone-500 leading-relaxed">
            Barcode / QR code ini tidak terdaftar di pangkalan data inventaris TECHSAS Asset Management System. Pastikan stiker label QR resmi dan dalam kondisi baik.
          </p>
          <div className="pt-2 p-3 bg-stone-50/80 rounded-2xl border border-stone-200/80 text-xs text-stone-500">
            Hubungi Departemen IT & Asset Management TECHSAS untuk bantuan teknis.
          </div>
        </div>
      </main>
    )
  }

  return <ScanPortalClient asset={data.asset} currentUser={data.currentUser} />
}

