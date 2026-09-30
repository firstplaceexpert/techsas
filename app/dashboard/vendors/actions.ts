'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import type { ActionResult, PaginatedResult, Vendor, VendorCategory } from '@/types'

export interface VendorFilters {
  search?: string
  category?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}

export interface VendorInput {
  name: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  category: VendorCategory
  rating?: number
  notes?: string | null
  is_active?: boolean
}

export async function getVendors(
  filters: VendorFilters = {}
): Promise<PaginatedResult<Vendor>> {
  const supabase = await createClient()
  const { page = 1, pageSize = 20 } = filters

  let query = supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    )
  }

  const { data, error, count } = await query

  if (error) {
    console.error('getVendors error:', error)
    return {
      data: [],
      meta: { page, pageSize, total: 0, totalPages: 0 },
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)
  return {
    data: (data || []) as Vendor[],
    meta: {
      total,
      page,
      pageSize,
      totalPages,
    },
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Vendor
}

export async function createVendor(input: VendorInput): Promise<ActionResult<Vendor>> {
  const profile = await requireRole('super_admin', 'corporate_admin', 'unit_admin')
  const supabase = await createClient()

  if (!input.name || input.name.trim().length === 0) {
    return { success: false, error: 'Nama vendor wajib diisi' }
  }

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      name: input.name.trim(),
      contact_person: input.contact_person?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      category: input.category || 'general',
      rating: input.rating ?? 5,
      notes: input.notes?.trim() || null,
      is_active: input.is_active ?? true,
    })
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || 'Gagal menambahkan vendor' }
  }

  await logAudit({
    action: 'create',
    tableName: 'vendors',
    recordId: data.id,
    newData: data,
    description: `Menambahkan vendor baru: ${data.name} (${data.category})`,
  })

  revalidatePath('/dashboard/vendors')
  return { success: true, data: data as Vendor }
}

export async function updateVendor(
  id: string,
  input: Partial<VendorInput>
): Promise<ActionResult<Vendor>> {
  const profile = await requireRole('super_admin', 'corporate_admin', 'unit_admin')
  const supabase = await createClient()

  const existing = await getVendorById(id)
  if (!existing) {
    return { success: false, error: 'Vendor tidak ditemukan' }
  }

  const { data, error } = await supabase
    .from('vendors')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || 'Gagal memperbarui vendor' }
  }

  await logAudit({
    action: 'update',
    tableName: 'vendors',
    recordId: id,
    oldData: existing,
    newData: data,
    description: `Memperbarui data vendor: ${data.name}`,
  })

  revalidatePath('/dashboard/vendors')
  return { success: true, data: data as Vendor }
}

export async function deleteVendor(id: string): Promise<ActionResult<void>> {
  await requireRole('super_admin', 'corporate_admin')
  const supabase = await createClient()

  const existing = await getVendorById(id)
  if (!existing) {
    return { success: false, error: 'Vendor tidak ditemukan' }
  }

  const { error } = await supabase.from('vendors').delete().eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  await logAudit({
    action: 'delete',
    tableName: 'vendors',
    recordId: id,
    oldData: existing,
    description: `Menghapus vendor: ${existing.name}`,
  })

  revalidatePath('/dashboard/vendors')
  return { success: true, data: undefined }
}
