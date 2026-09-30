import { z } from 'zod'

export const businessUnitSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
  code: z.string().max(10, 'Kode maksimal 10 karakter').optional().or(z.literal('')),
  type: z.enum(
    ['rental', 'multimedia', 'gaming', 'cafe', 'event', 'hotel', 'mall', 'property', 'other'],
    {
      required_error: 'Pilih tipe unit bisnis',
    }
  ),
  logo_url: z.string().optional().or(z.literal('')),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').optional().or(z.literal('')),
})

export type BusinessUnitFormValues = z.infer<typeof businessUnitSchema>
