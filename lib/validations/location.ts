import { z } from 'zod'

export const locationSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  business_unit_id: z.string().uuid('Pilih unit bisnis yang valid'),
  parent_id: z.string().uuid('Pilih lokasi induk yang valid').nullable().optional(),
  level: z.enum(['site', 'building', 'floor', 'room', 'zone'], {
    required_error: 'Pilih level lokasi',
  }),
})

export type LocationFormValues = z.infer<typeof locationSchema>
