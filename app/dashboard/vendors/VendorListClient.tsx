'use client'

import { useState, useTransition } from 'react'
import {
  Truck,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Star,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building,
  User,
  X,
} from 'lucide-react'
import type { PaginatedResult, Vendor, VendorCategory } from '@/types'
import { getVendors, createVendor, updateVendor, deleteVendor, type VendorInput, type VendorFilters } from './actions'

interface Props {
  initialData: PaginatedResult<Vendor>
  canManage: boolean
}

const CATEGORY_MAP: Record<VendorCategory, { label: string; color: string }> = {
  service: { label: 'Service & Maintenance', color: 'bg-pale-100 text-charcoal border-cloud-200' },
  spare_parts: { label: 'Supplier Spare Parts', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  contractor: { label: 'Kontraktor & Sipil', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  general: { label: 'General Supplier', color: 'bg-purple-50 text-purple-700 border-purple-200' },
}

export default function VendorListClient({ initialData, canManage }: Props) {
  const [data, setData] = useState<PaginatedResult<Vendor>>(initialData)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isPending, startTransition] = useTransition()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Form State
  const [formData, setFormData] = useState<VendorInput>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    category: 'service',
    rating: 5,
    notes: '',
    is_active: true,
  })

  function refreshVendors(override: Partial<VendorFilters> = {}) {
    startTransition(async () => {
      const filters: VendorFilters = {
        search: override.search !== undefined ? override.search : search,
        category: override.category !== undefined ? override.category : categoryFilter,
        page: override.page !== undefined ? override.page : data.meta.page,
        pageSize: 20,
      }
      const res = await getVendors(filters)
      setData(res)
    })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    refreshVendors({ page: 1 })
  }

  function handleCategoryChange(val: string) {
    setCategoryFilter(val)
    refreshVendors({ category: val, page: 1 })
  }

  function handleOpenCreate() {
    setEditingVendor(null)
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      category: 'service',
      rating: 5,
      notes: '',
      is_active: true,
    })
    setModalError(null)
    setIsModalOpen(true)
  }

  function handleOpenEdit(vendor: Vendor) {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name,
      contact_person: vendor.contact_person || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      category: vendor.category,
      rating: vendor.rating || 5,
      notes: vendor.notes || '',
      is_active: vendor.is_active,
    })
    setModalError(null)
    setIsModalOpen(true)
  }

  async function handleSubmitModal(e: React.FormEvent) {
    e.preventDefault()
    setModalLoading(true)
    setModalError(null)

    try {
      if (editingVendor) {
        const res = await updateVendor(editingVendor.id, formData)
        if (!res.success) {
          setModalError(res.error || 'Gagal menyimpan perubahan')
          setModalLoading(false)
          return
        }
      } else {
        const res = await createVendor(formData)
        if (!res.success) {
          setModalError(res.error || 'Gagal menambahkan vendor')
          setModalLoading(false)
          return
        }
      }

      setIsModalOpen(false)
      refreshVendors()
    } catch (err: any) {
      setModalError(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleDelete(vendor: Vendor) {
    if (!confirm(`Apakah Anda yakin ingin menghapus vendor "${vendor.name}"?`)) {
      return
    }
    const res = await deleteVendor(vendor.id)
    if (!res.success) {
      alert(res.error || 'Gagal menghapus vendor')
      return
    }
    refreshVendors()
  }

  // Summary Metrics
  const totalCount = data.meta.total
  const serviceCount = data.data.filter((v) => v.category === 'service').length
  const sparePartsCount = data.data.filter((v) => v.category === 'spare_parts').length
  const activeCount = data.data.filter((v) => v.is_active).length

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Mitra Rekanan</p>
            <p className="text-xl font-bold text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-pale-100 flex items-center justify-center text-charcoal">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Service & Perbaikan</p>
            <p className="text-xl font-bold text-charcoal">{serviceCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Supplier Spare Parts</p>
            <p className="text-xl font-bold text-emerald-700">{sparePartsCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Vendor Aktif</p>
            <p className="text-xl font-bold text-amber-700">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari vendor, PIC, no. telepon, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-sm w-full"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="input text-sm py-2 px-3"
          >
            <option value="all">Semua Kategori</option>
            <option value="service">Service & Maintenance</option>
            <option value="spare_parts">Supplier Spare Parts</option>
            <option value="contractor">Kontraktor & Sipil</option>
            <option value="general">General Supplier</option>
          </select>

          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary text-sm flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Vendor</span>
            </button>
          )}
        </div>
      </div>

      {/* Vendor Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Vendor</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Kontak PIC</th>
                <th className="py-3.5 px-4">Telepon & Email</th>
                <th className="py-3.5 px-4">Alamat</th>
                <th className="py-3.5 px-4 text-center">Rating</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                {canManage && <th className="py-3.5 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Belum ada vendor terdaftar yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                data.data.map((vendor) => {
                  const cat = CATEGORY_MAP[vendor.category] || {
                    label: vendor.category,
                    color: 'bg-slate-50 text-slate-700 border-slate-200',
                  }
                  return (
                    <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{vendor.name}</div>
                        {vendor.notes && (
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                            {vendor.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cat.color}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {vendor.contact_person || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs space-y-1">
                        {vendor.phone && (
                          <a
                            href={`tel:${vendor.phone}`}
                            className="flex items-center gap-1 text-brand-600 hover:underline font-mono"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {vendor.phone}
                          </a>
                        )}
                        {vendor.email && (
                          <a
                            href={`mailto:${vendor.email}`}
                            className="flex items-center gap-1 text-slate-500 hover:text-brand-600"
                          >
                            <Mail className="w-3 h-3 text-slate-400" />
                            {vendor.email}
                          </a>
                        )}
                        {!vendor.phone && !vendor.email && <span className="text-slate-400">-</span>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        <div className="line-clamp-2">{vendor.address || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-0.5 text-amber-500 font-medium text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{vendor.rating ?? 5}</span>
                          <span className="text-slate-400 text-[10px]">/5</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {vendor.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(vendor)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Edit Vendor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(vendor)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Vendor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            <div>
              Menampilkan {((data.meta.page - 1) * data.meta.pageSize) + 1} -{' '}
              {Math.min(data.meta.page * data.meta.pageSize, data.meta.total)} dari {data.meta.total} vendor
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={data.meta.page <= 1 || isPending}
                onClick={() => refreshVendors({ page: data.meta.page - 1 })}
                className="btn btn-ghost p-1.5 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-slate-700">
                Halaman {data.meta.page} dari {data.meta.totalPages}
              </span>
              <button
                disabled={data.meta.page >= data.meta.totalPages || isPending}
                onClick={() => refreshVendors({ page: data.meta.page + 1 })}
                className="btn btn-ghost p-1.5 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Vendor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {editingVendor ? 'Edit Mitra Vendor' : 'Tambah Mitra Vendor Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
                {modalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Perusahaan / Vendor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: PT Daikin Aircon Indonesia"
                    className="input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kategori Vendor
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as VendorCategory })}
                      className="input w-full text-xs"
                    >
                      <option value="service">Service & Maintenance</option>
                      <option value="spare_parts">Supplier Spare Parts</option>
                      <option value="contractor">Kontraktor & Sipil</option>
                      <option value="general">General Supplier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rating Kepuasan (1 - 5)
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="input w-full text-xs"
                    >
                      <option value={5}>5 - Sangat Baik</option>
                      <option value={4}>4 - Baik</option>
                      <option value={3}>3 - Cukup</option>
                      <option value={2}>2 - Kurang</option>
                      <option value={1}>1 - Buruk</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama PIC / Kontak Person
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person || ''}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Contoh: Bpk. Budi Santoso"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0274-xxx atau 0812xxx"
                      className="input w-full font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email Resmi
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="kontak@vendor.co.id"
                    className="input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Lengkap Kantor / Workshop
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Jl. Raya..."
                    className="input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan / Layanan Spesialisasi
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Spesialis perbaikan chiller hotel, respon 24 jam..."
                    className="input w-full text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300"
                  />
                  <label htmlFor="is_active" className="text-xs text-slate-700 font-medium">
                    Vendor aktif (tersedia untuk ditugaskan pada Work Order)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn btn-primary text-xs"
                >
                  {modalLoading ? 'Menyimpan...' : editingVendor ? 'Simpan Perubahan' : 'Tambah Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
