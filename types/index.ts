// Re-export all database types
export * from './database'

// ============================================================
// Computed / Joined Types
// ============================================================

import type {
  Asset,
  AssetCategory,
  BusinessUnit,
  Location,
  Profile,
  WorkOrder,
  WorkOrderPart,
  WorkOrderComment,
  Vendor,
  AuditLog,
} from './database'

/** Asset with all related entities joined */
export type AssetWithRelations = Asset & {
  category: AssetCategory | null
  business_unit: BusinessUnit | null
  current_location: Location | null
  current_pic: Profile | null
}

/** Location node for tree UI */
export type LocationNode = Location & {
  business_unit: BusinessUnit | null
  children?: LocationNode[]
}

/** Profile with business unit info */
export type ProfileWithUnit = Profile & {
  business_unit: BusinessUnit | null
}

/** Asset list item (lighter than full relations) */
export type AssetListItem = Pick<
  Asset,
  | 'id'
  | 'asset_code'
  | 'name'
  | 'condition'
  | 'status'
  | 'photo_url'
  | 'purchase_price'
  | 'current_book_value'
  | 'purchase_date'
  | 'created_at'
  | 'account_code_asset'
> & {
  category: Pick<AssetCategory, 'id' | 'name' | 'account_code_asset'> | null
  business_unit: Pick<BusinessUnit, 'id' | 'name' | 'type'> | null
  current_location: Pick<Location, 'id' | 'name' | 'level'> | null
}

/** Work Order with all relations joined */
export type WorkOrderWithRelations = WorkOrder & {
  asset: {
    id: string
    asset_code: string
    name: string
    photo_url: string | null
    condition: string
    purchase_price?: number | null
    current_book_value?: number | null
    business_unit: { id: string; name: string } | null
    current_location: { id: string; name: string } | null
  } | null
  assignee?: { id: string; full_name: string; role?: string } | null
  assigned_user?: { id: string; full_name: string; role?: string } | null
  requester?: { id: string; full_name: string; role?: string } | null
  approver?: { id: string; full_name: string; role?: string } | null
  vendor: {
    id: string
    name: string
    contact_person?: string | null
    phone?: string | null
    email?: string | null
    category?: string
    rating?: number | null
  } | null
  parts?: WorkOrderPart[]
  comments?: (WorkOrderComment & {
    user: { id: string; full_name: string; role?: string } | null
  })[]
}

/** Vendor with usage stats */
export type VendorWithStats = Vendor & {
  total_work_orders?: number
  total_cost?: number
}

/** Audit Log with user profile joined */
export type AuditLogWithUser = AuditLog & {
  user: { id: string; full_name: string; role?: string } | null
}

/** Pagination meta */
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** Paginated result wrapper */
export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
}

/** Server Action result */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/** Asset filters for list query */
export interface AssetFilters {
  search?: string
  businessUnitId?: string
  categoryId?: string
  status?: string
  condition?: string
  page?: number
  pageSize?: number
}
