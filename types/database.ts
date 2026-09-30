// ============================================================
// TECHSAS Database Types
// Manually maintained, matching the Supabase schema.
// ============================================================

export type UserRole = 'super_admin' | 'corporate_admin' | 'unit_admin' | 'field_officer' | 'viewer'
export type BusinessUnitType = 'rental' | 'multimedia' | 'gaming' | 'cafe' | 'event' | 'hotel' | 'mall' | 'property' | 'other'
export type LocationLevel = 'site' | 'building' | 'floor' | 'room' | 'zone'
export type DepreciationMethod = 'straight_line' | 'declining_balance'
export type AssetCondition = 'good' | 'fair' | 'damaged' | 'under_repair'
export type AssetStatus = 'active' | 'pending' | 'disposed'
export type MaintenanceType = 'preventive' | 'corrective' | 'predictive'
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue'
export type OpnameStatus = 'in_progress' | 'completed'
export type DisposalType = 'sale' | 'auction' | 'donation' | 'transfer' | 'writeoff'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type AuctionStatus = 'draft' | 'open' | 'closed'
export type ApprovalActionType =
  | 'disposal_sale'
  | 'disposal_auction'
  | 'disposal_donation'
  | 'disposal_transfer'
  | 'disposal_writeoff'
  | 'high_value_purchase'
export type VendorCategory = 'spare_parts' | 'service' | 'general' | 'contractor'
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'emergency'
export type WorkOrderStatus = 'pending' | 'approved' | 'in_progress' | 'on_hold' | 'completed' | 'rejected' | 'cancelled'
export type WorkOrderMaintenanceType = 'preventive' | 'corrective' | 'emergency' | 'inspection'
export type WOPartSource = 'warehouse' | 'vendor' | 'cannibalized'
export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'login' | 'export' | 'status_change'

// ============================================================
// Table Row Types
// ============================================================

export interface BusinessUnit {
  id: string
  name: string
  code?: string | null
  type: BusinessUnitType
  logo_url?: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  business_unit_id: string
  parent_id: string | null
  name: string
  level: LocationLevel
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AssetCategory {
  id: string
  name: string
  account_code_asset?: string | null
  account_code_accum?: string | null
  account_code_expense?: string | null
  default_useful_life_months: number
  default_depreciation_method: DepreciationMethod
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  business_unit_id: string | null
  department: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  asset_code: string
  name: string
  description: string | null
  category_id: string
  account_code_asset?: string | null
  account_code_accum?: string | null
  account_code_expense?: string | null
  business_unit_id: string
  current_location_id: string | null
  current_pic_id: string | null
  photo_url: string | null
  purchase_date: string | null
  purchase_price: number | null
  useful_life_months: number | null
  depreciation_method: DepreciationMethod | null
  current_book_value: number | null
  condition: AssetCondition
  status: AssetStatus
  qr_code_uuid: string
  warranty_until: string | null
  legal_document_url?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface AssetLocationHistory {
  id: string
  asset_id: string
  location_id: string | null
  moved_by: string | null
  moved_at: string
  note: string | null
}

export interface AssetMaintenance {
  id: string
  asset_id: string
  maintenance_type: MaintenanceType
  scheduled_date: string | null
  completed_date: string | null
  cost: number | null
  technician_id: string | null
  notes: string | null
  next_schedule_date: string | null
  status: MaintenanceStatus
  created_at: string
  updated_at: string
}

export interface AssetDepreciationLog {
  id: string
  asset_id: string
  period_month: string
  book_value: number
  depreciation_amount: number
  calculated_at: string
}

export interface OpnameSession {
  id: string
  business_unit_id: string
  location_id: string | null
  conducted_by: string | null
  started_at: string
  finished_at: string | null
  status: OpnameStatus
  created_at: string
}

export interface OpnameScan {
  id: string
  session_id: string
  asset_id: string
  scanned_at: string
  matched: boolean
}

export interface AuctionLot {
  id: string
  lot_number: string
  auction_date: string | null
  auctioneer_name: string | null
  total_assets: number
  status: AuctionStatus
  created_at: string
  updated_at: string
}

export interface DisposalRecord {
  id: string
  asset_id: string
  disposal_type: DisposalType
  requested_by: string | null
  approved_by: string | null
  approval_status: ApprovalStatus
  sale_price: number | null
  buyer_or_recipient: string | null
  auction_lot_id: string | null
  target_business_unit_id: string | null
  notes: string | null
  gain_loss_amount: number | null
  disposed_at: string | null
  created_at: string
}

export interface ApprovalWorkflow {
  id: string
  action_type: ApprovalActionType
  min_value_threshold: number | null
  required_role: UserRole
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  related_asset_id?: string | null
  reference_id?: string | null
  created_at: string
}

export interface Vendor {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  category: VendorCategory
  rating: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkOrder {
  id: string
  wo_number: string
  asset_id: string
  title: string
  description: string | null
  priority: WorkOrderPriority
  status: WorkOrderStatus
  maintenance_type: MaintenanceType
  assigned_to: string | null
  requested_by: string | null
  approved_by: string | null
  vendor_id: string | null
  sla_target_hours: number | null
  actual_hours: number | null
  labor_cost: number | null
  parts_cost: number | null
  total_cost: number | null
  started_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WorkOrderPart {
  id: string
  work_order_id: string
  part_name: string
  part_code: string | null
  quantity: number
  unit_cost: number
  total_cost: number
  source: WOPartSource
  source_asset_id: string | null
  notes: string | null
  created_at: string
}

export interface WorkOrderComment {
  id: string
  work_order_id: string
  user_id: string
  comment: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  user_name: string | null
  action: AuditAction
  table_name: string
  record_id: string | null
  old_data: any | null
  new_data: any | null
  description: string | null
  ip_address: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      business_units: {
        Row: BusinessUnit
        Insert: {
          id?: string
          name: string
          type: BusinessUnitType
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: BusinessUnitType
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: Location
        Insert: {
          id?: string
          business_unit_id: string
          parent_id?: string | null
          name: string
          level: LocationLevel
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_unit_id?: string
          parent_id?: string | null
          name?: string
          level?: LocationLevel
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_categories: {
        Row: AssetCategory
        Insert: {
          id?: string
          name: string
          account_code_asset?: string | null
          account_code_accum?: string | null
          account_code_expense?: string | null
          default_useful_life_months?: number
          default_depreciation_method?: DepreciationMethod
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          account_code_asset?: string | null
          account_code_accum?: string | null
          account_code_expense?: string | null
          default_useful_life_months?: number
          default_depreciation_method?: DepreciationMethod
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: {
          id: string
          full_name?: string
          role?: UserRole
          business_unit_id?: string | null
          department?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          business_unit_id?: string | null
          department?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: Asset
        Insert: {
          id?: string
          asset_code?: string
          name: string
          description?: string | null
          category_id: string
          account_code_asset?: string | null
          account_code_accum?: string | null
          account_code_expense?: string | null
          business_unit_id: string
          current_location_id?: string | null
          current_pic_id?: string | null
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          useful_life_months?: number | null
          depreciation_method?: DepreciationMethod | null
          current_book_value?: number | null
          condition?: AssetCondition
          status?: AssetStatus
          qr_code_uuid?: string
          warranty_until?: string | null
          legal_document_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          asset_code?: string
          name?: string
          description?: string | null
          category_id?: string
          account_code_asset?: string | null
          account_code_accum?: string | null
          account_code_expense?: string | null
          business_unit_id?: string
          current_location_id?: string | null
          current_pic_id?: string | null
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          useful_life_months?: number | null
          depreciation_method?: DepreciationMethod | null
          current_book_value?: number | null
          condition?: AssetCondition
          status?: AssetStatus
          qr_code_uuid?: string
          warranty_until?: string | null
          legal_document_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_location_history: {
        Row: AssetLocationHistory
        Insert: {
          id?: string
          asset_id: string
          location_id?: string | null
          moved_by?: string | null
          moved_at?: string
          note?: string | null
        }
        Update: {
          id?: string
          asset_id?: string
          location_id?: string | null
          moved_by?: string | null
          moved_at?: string
          note?: string | null
        }
        Relationships: []
      }
      asset_maintenance: {
        Row: AssetMaintenance
        Insert: {
          id?: string
          asset_id: string
          maintenance_type: MaintenanceType
          scheduled_date?: string | null
          completed_date?: string | null
          cost?: number | null
          technician_id?: string | null
          notes?: string | null
          next_schedule_date?: string | null
          status?: MaintenanceStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          maintenance_type?: MaintenanceType
          scheduled_date?: string | null
          completed_date?: string | null
          cost?: number | null
          technician_id?: string | null
          notes?: string | null
          next_schedule_date?: string | null
          status?: MaintenanceStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_depreciation_log: {
        Row: AssetDepreciationLog
        Insert: {
          id?: string
          asset_id: string
          period_month: string
          book_value: number
          depreciation_amount: number
          calculated_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          period_month?: string
          book_value?: number
          depreciation_amount?: number
          calculated_at?: string
        }
        Relationships: []
      }
      opname_sessions: {
        Row: OpnameSession
        Insert: {
          id?: string
          business_unit_id: string
          location_id?: string | null
          conducted_by?: string | null
          started_at?: string
          finished_at?: string | null
          status?: OpnameStatus
          created_at?: string
        }
        Update: {
          id?: string
          business_unit_id?: string
          location_id?: string | null
          conducted_by?: string | null
          started_at?: string
          finished_at?: string | null
          status?: OpnameStatus
          created_at?: string
        }
        Relationships: []
      }
      opname_scans: {
        Row: OpnameScan
        Insert: {
          id?: string
          session_id: string
          asset_id: string
          scanned_at?: string
          matched?: boolean
        }
        Update: {
          id?: string
          session_id?: string
          asset_id?: string
          scanned_at?: string
          matched?: boolean
        }
        Relationships: []
      }
      auction_lots: {
        Row: AuctionLot
        Insert: {
          id?: string
          lot_number: string
          auction_date?: string | null
          auctioneer_name?: string | null
          total_assets?: number
          status?: AuctionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lot_number?: string
          auction_date?: string | null
          auctioneer_name?: string | null
          total_assets?: number
          status?: AuctionStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      disposal_records: {
        Row: DisposalRecord
        Insert: {
          id?: string
          asset_id: string
          disposal_type: DisposalType
          requested_by?: string | null
          approved_by?: string | null
          approval_status?: ApprovalStatus
          sale_price?: number | null
          buyer_or_recipient?: string | null
          auction_lot_id?: string | null
          target_business_unit_id?: string | null
          notes?: string | null
          gain_loss_amount?: number | null
          disposed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          disposal_type?: DisposalType
          requested_by?: string | null
          approved_by?: string | null
          approval_status?: ApprovalStatus
          sale_price?: number | null
          buyer_or_recipient?: string | null
          auction_lot_id?: string | null
          target_business_unit_id?: string | null
          notes?: string | null
          gain_loss_amount?: number | null
          disposed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      approval_workflows: {
        Row: ApprovalWorkflow
        Insert: {
          id?: string
          action_type: ApprovalActionType
          min_value_threshold?: number | null
          required_role: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          action_type?: ApprovalActionType
          min_value_threshold?: number | null
          required_role?: UserRole
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          related_asset_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          related_asset_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      vendors: {
        Row: Vendor
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          category?: VendorCategory
          rating?: number | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          category?: VendorCategory
          rating?: number | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: WorkOrder
        Insert: {
          id?: string
          wo_number?: string
          asset_id: string
          title: string
          description?: string | null
          priority?: WorkOrderPriority
          status?: WorkOrderStatus
          maintenance_type?: MaintenanceType
          assigned_to?: string | null
          requested_by?: string | null
          approved_by?: string | null
          vendor_id?: string | null
          sla_target_hours?: number | null
          actual_hours?: number | null
          labor_cost?: number | null
          parts_cost?: number | null
          total_cost?: number | null
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wo_number?: string
          asset_id?: string
          title?: string
          description?: string | null
          priority?: WorkOrderPriority
          status?: WorkOrderStatus
          maintenance_type?: MaintenanceType
          assigned_to?: string | null
          requested_by?: string | null
          approved_by?: string | null
          vendor_id?: string | null
          sla_target_hours?: number | null
          actual_hours?: number | null
          labor_cost?: number | null
          parts_cost?: number | null
          total_cost?: number | null
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_order_parts: {
        Row: WorkOrderPart
        Insert: {
          id?: string
          work_order_id: string
          part_name: string
          part_code?: string | null
          quantity?: number
          unit_cost?: number
          total_cost?: number
          source?: WOPartSource
          source_asset_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          work_order_id?: string
          part_name?: string
          part_code?: string | null
          quantity?: number
          unit_cost?: number
          total_cost?: number
          source?: WOPartSource
          source_asset_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      work_order_comments: {
        Row: WorkOrderComment
        Insert: {
          id?: string
          work_order_id: string
          user_id: string
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          work_order_id?: string
          user_id?: string
          comment?: string
          created_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: AuditLog
        Insert: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          action: AuditAction
          table_name: string
          record_id?: string | null
          old_data?: any | null
          new_data?: any | null
          description?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          action?: AuditAction
          table_name?: string
          record_id?: string | null
          old_data?: any | null
          new_data?: any | null
          description?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
