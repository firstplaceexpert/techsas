'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteBusinessUnit } from './actions'

export default function DeleteBusinessUnitButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Yakin ingin menghapus unit bisnis "${name}"?`)) return
    setLoading(true)
    try {
      const result = await deleteBusinessUnit(id)
      if (!result.success) {
        alert('Gagal: ' + (result.error || 'Terjadi kesalahan'))
      } else {
        router.refresh()
      }
    } catch (err: any) {
      alert('Gagal menghapus: ' + (err?.message || 'Error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn-ghost p-1.5 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg flex items-center gap-1 text-xs font-semibold transition-colors"
      id={`btn-delete-bu-${id}`}
      title={`Hapus unit bisnis ${name}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      <span>Hapus</span>
    </button>
  )
}
