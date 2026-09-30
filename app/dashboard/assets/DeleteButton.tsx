'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteAsset } from './actions'

export default function DeleteAssetButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false)
  const handleDelete = async () => {
    if (!confirm(`Tandai aset "${name}" sebagai disposed? Tindakan ini bisa dibalik oleh admin.`)) return
    setLoading(true)
    const result = await deleteAsset(id)
    if (!result.success) alert('Gagal: ' + result.error)
    setLoading(false)
  }
  return (
    <button onClick={handleDelete} disabled={loading} className="btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50" id={`btn-delete-asset-${id}`}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  )
}
