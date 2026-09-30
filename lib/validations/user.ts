import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  user_id: z.string().uuid('ID user tidak valid'),
  role: z.enum(['super_admin', 'corporate_admin', 'unit_admin', 'field_officer', 'viewer'], {
    required_error: 'Pilih role yang valid',
  }),
  business_unit_id: z.string().uuid('Pilih unit bisnis yang valid').nullable().optional(),
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional(),
  department: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
})

export type UpdateUserRoleFormValues = z.infer<typeof updateUserRoleSchema>
