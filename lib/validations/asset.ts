import { z } from 'zod'

export const assetSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(200, 'Nama maksimal 200 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().or(z.literal('')),
  category_id: z.string().uuid('Pilih kategori yang valid'),
  account_code_asset: z.string().max(50, 'Maksimal 50 karakter').optional().nullable().or(z.literal('')),
  account_code_accum: z.string().max(50, 'Maksimal 50 karakter').optional().nullable().or(z.literal('')),
  account_code_expense: z.string().max(50, 'Maksimal 50 karakter').optional().nullable().or(z.literal('')),
  business_unit_id: z.string().uuid('Pilih unit bisnis yang valid'),
  current_location_id: z.string().uuid('Pilih lokasi yang valid').nullable().optional(),
  current_pic_id: z.string().uuid('Pilih PIC yang valid').nullable().optional(),
  photo_url: z.string().url('URL foto tidak valid').nullable().optional().or(z.literal('')),
  purchase_date: z.string().nullable().optional(),
  purchase_price: z
    .number({ invalid_type_error: 'Harga harus berupa angka' })
    .nonnegative('Harga tidak boleh negatif')
    .nullable()
    .optional(),
  useful_life_months: z
    .number({ invalid_type_error: 'Umur ekonomis harus berupa angka' })
    .int('Harus bilangan bulat')
    .min(1, 'Minimal 1 bulan')
    .max(600, 'Maksimal 600 bulan')
    .nullable()
    .optional(),
  depreciation_method: z.enum(['straight_line', 'declining_balance']).nullable().optional(),
  condition: z.enum(['good', 'fair', 'damaged', 'under_repair']),
  warranty_until: z.string().nullable().optional(),
  legal_document_url: z.string().url('URL dokumen tidak valid').nullable().optional().or(z.literal('')),
})

export type AssetFormValues = z.infer<typeof assetSchema>
