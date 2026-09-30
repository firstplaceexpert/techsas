'use server'

import { createClient } from '@/lib/supabase/server'

export async function getComprehensiveReportData() {
  const supabase = await createClient()

  // 1. All assets
  const { data: assets } = await (supabase.from('assets') as any)
    .select(
      `
      id, asset_code, name, purchase_date, purchase_price, current_book_value,
      condition, status, useful_life_months, depreciation_method,
      business_unit:business_units(id, name, type),
      category:asset_categories(id, name),
      current_location:locations(id, name, level)
    `
    )
    .order('created_at', { ascending: false })

  // 2. All location mutation histories
  const { data: locationHistory } = await (supabase
    .from('asset_location_history') as any)
    .select(
      `
      id, moved_at, note,
      asset:assets(id, asset_code, name, business_unit:business_units(name)),
      location:locations(id, name, level),
      mover:profiles(id, full_name)
    `
    )
    .order('moved_at', { ascending: false })
    .limit(300)

  // 3. Maintenance records
  const { data: maintenance } = await (supabase
    .from('asset_maintenance') as any)
    .select(
      `
      id, maintenance_type, scheduled_date, completed_date, cost, status, notes,
      asset:assets(id, asset_code, name, business_unit:business_units(name), category:asset_categories(name)),
      technician:profiles(id, full_name)
    `
    )
    .order('created_at', { ascending: false })

  // 4. Depreciation logs
  const { data: depreciationLogs } = await (supabase
    .from('asset_depreciation_log') as any)
    .select(
      `
      id, period_month, book_value, depreciation_amount, calculated_at,
      asset:assets(id, asset_code, name, purchase_price, business_unit:business_units(name), category:asset_categories(name))
    `
    )
    .order('period_month', { ascending: false })
    .limit(300)

  // 5. Disposal records
  const { data: disposals } = await (supabase
    .from('disposal_records') as any)
    .select(
      `
      id, disposal_type, approval_status, sale_price, gain_loss_amount, disposed_at, created_at, notes,
      asset:assets(id, asset_code, name, purchase_price, current_book_value, business_unit:business_units(name)),
      requester:profiles!disposal_records_requested_by_fkey(id, full_name),
      approver:profiles!disposal_records_approved_by_fkey(id, full_name)
    `
    )
    .order('created_at', { ascending: false })

  // 6. Work Orders
  const { data: workOrders } = await (supabase
    .from('work_orders') as any)
    .select(
      `
      id, wo_number, title, priority, status, maintenance_type, sla_target_hours, actual_hours,
      labor_cost, parts_cost, total_cost, created_at, started_at, completed_at,
      asset:assets(id, asset_code, name, business_unit:business_units(name)),
      vendor:vendors(id, name, category)
    `
    )
    .order('created_at', { ascending: false })

  // 7. Vendors
  const { data: vendors } = await (supabase
    .from('vendors') as any)
    .select('*')
    .order('name', { ascending: true })

  return {
    assets: assets || [],
    locationHistory: locationHistory || [],
    maintenance: maintenance || [],
    depreciationLogs: depreciationLogs || [],
    disposals: disposals || [],
    workOrders: workOrders || [],
    vendors: vendors || [],
  }
}
