'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  MapPin,
  DoorOpen,
  LayoutGrid,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { LocationNode } from '@/types'
import { deleteLocation } from './actions'

const levelConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  site:     { icon: <MapPin className="w-4 h-4" />, label: 'Site' },
  building: { icon: <Building2 className="w-4 h-4" />, label: 'Gedung' },
  floor:    { icon: <Layers className="w-4 h-4" />, label: 'Lantai' },
  room:     { icon: <DoorOpen className="w-4 h-4" />, label: 'Ruangan' },
  zone:     { icon: <LayoutGrid className="w-4 h-4" />, label: 'Zona' },
}

function LocationRow({
  node,
  canDelete,
  depth = 0,
}: {
  node: LocationNode
  canDelete: boolean
  depth?: number
}) {
  const [open, setOpen] = useState(depth < 2)
  const [deleting, setDeleting] = useState(false)
  const hasChildren = node.children && node.children.length > 0
  const cfg = levelConfig[node.level] ?? levelConfig.room

  const handleDelete = async () => {
    if (!confirm(`Nonaktifkan lokasi "${node.name}"?`)) return
    setDeleting(true)
    const result = await deleteLocation(node.id)
    if (!result.success) alert('Gagal: ' + result.error)
    setDeleting(false)
  }

  return (
    <div>
      <div
        className={clsx(
          'group flex items-center gap-2 py-2.5 px-4 border-b border-slate-50 hover:bg-surface-50 transition-colors',
        )}
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={clsx(
            'w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0',
            !hasChildren && 'invisible'
          )}
        >
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Icon */}
        <span className="text-slate-400 flex-shrink-0">{cfg.icon}</span>

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-slate-800">{node.name}</span>

        {/* Level badge */}
        <span className="badge badge-slate text-xs hidden sm:inline-flex">{cfg.label}</span>

        {/* Children count */}
        {hasChildren && (
          <span className="text-xs text-slate-400 hidden sm:block">
            {node.children!.length} sub-lokasi
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/dashboard/locations/${node.id}/edit`}
            className="btn-ghost btn-sm py-1"
            id={`btn-edit-loc-${node.id}`}
          >
            <Pencil className="w-3 h-3" />
          </Link>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-ghost btn-sm py-1 text-red-500 hover:text-red-700 hover:bg-red-50"
              id={`btn-delete-loc-${node.id}`}
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {open && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <LocationRow key={child.id} node={child} canDelete={canDelete} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function LocationTree({
  nodes,
  canDelete,
}: {
  nodes: LocationNode[]
  canDelete: boolean
}) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MapPin className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-slate-600 font-medium">Belum ada lokasi</h3>
        <p className="text-slate-400 text-sm mt-1">Tambahkan lokasi pertama untuk unit bisnis ini.</p>
      </div>
    )
  }

  return (
    <div>
      {nodes.map((node) => (
        <LocationRow key={node.id} node={node} canDelete={canDelete} />
      ))}
    </div>
  )
}
