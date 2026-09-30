import {
  DEMO_USERS,
  INITIAL_ASSETS,
  INITIAL_BUSINESS_UNITS,
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_MAINTENANCE,
  INITIAL_NOTIFICATIONS,
} from './mock-data'
import { generateSemanticAssetCode } from '@/lib/utils/asset-code'

// In-memory persistent state during process lifetime
let assetsState = [...INITIAL_ASSETS]
let businessUnitsState = [...INITIAL_BUSINESS_UNITS]
let locationsState = [...INITIAL_LOCATIONS]
let categoriesState = [...INITIAL_CATEGORIES]
let maintenanceState = [...INITIAL_MAINTENANCE]
let notificationsState = [...INITIAL_NOTIFICATIONS]
let vendorsState: any[] = [
  {
    id: 'vnd-00000000-0000-0000-0000-000000000001',
    name: 'PT Daikin Aircon Indonesia',
    contact_person: 'Budi Santoso',
    email: 'budi@daikin.co.id',
    phone: '021-5551234',
    address: 'Jl. Industri Raya No.45, Jakarta Utara',
    category: 'service',
    rating: 5,
    notes: 'Vendor utama AC & HVAC untuk seluruh properti TECHSAS',
    is_active: true,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-08-10T14:00:00Z',
  },
  {
    id: 'vnd-00000000-0000-0000-0000-000000000002',
    name: 'CV Karya Elektrik Mandiri',
    contact_person: 'Andi Wijaya',
    email: 'info@karyaelektrik.com',
    phone: '0274-889976',
    address: 'Jl. Magelang KM 8, Sleman, Yogyakarta',
    category: 'spare_parts',
    rating: 4,
    notes: 'Supplier spare part panel listrik, MCB, kabel, dan fitting',
    is_active: true,
    created_at: '2024-03-20T09:00:00Z',
    updated_at: '2024-09-05T10:30:00Z',
  },
  {
    id: 'vnd-00000000-0000-0000-0000-000000000003',
    name: 'PT Indofurniture Abadi',
    contact_person: 'Siti Rahayu',
    email: 'order@indofurniture.co.id',
    phone: '031-7778899',
    address: 'Jl. Rungkut Industri No.12, Surabaya',
    category: 'general',
    rating: 4,
    notes: 'Supplier furniture custom hotel (bed frame, sofa lobby, meja restoran)',
    is_active: true,
    created_at: '2024-02-10T08:00:00Z',
    updated_at: '2024-07-15T11:00:00Z',
  },
  {
    id: 'vnd-00000000-0000-0000-0000-000000000004',
    name: 'CV Plumbing Nusantara',
    contact_person: 'Hendra Pramono',
    email: 'hendra@plumbingnusantara.id',
    phone: '0274-556677',
    address: 'Jl. Colombo No.88, Yogyakarta',
    category: 'contractor',
    rating: 3,
    notes: 'Kontraktor perbaikan sistem pipa dan sanitasi',
    is_active: true,
    created_at: '2024-05-01T09:00:00Z',
    updated_at: '2024-10-20T15:00:00Z',
  },
]
let workOrdersState: any[] = [
  {
    id: 'wo-00000000-0000-0000-0000-000000000001',
    wo_number: 'WO-00001',
    asset_id: INITIAL_ASSETS[0]?.id || 'ast-00000000-0000-0000-0000-000000000001',
    title: 'Perbaikan AC Lobby Utama — Kompresor Bermasalah',
    description: 'AC lobby utama mengeluarkan suara abnormal dan tidak dingin. Diagnosa awal: kompresor perlu penggantian.',
    priority: 'high',
    status: 'in_progress',
    maintenance_type: 'corrective',
    assigned_to: null,
    requested_by: null,
    approved_by: null,
    vendor_id: 'vnd-00000000-0000-0000-0000-000000000001',
    sla_target_hours: 24,
    actual_hours: null,
    labor_cost: 750000,
    parts_cost: 4500000,
    total_cost: 5250000,
    started_at: '2024-12-10T08:00:00Z',
    completed_at: null,
    notes: 'Teknisi Daikin sudah on-site, spare part kompresor dalam pengiriman.',
    created_at: '2024-12-09T14:00:00Z',
    updated_at: '2024-12-10T10:00:00Z',
  },
  {
    id: 'wo-00000000-0000-0000-0000-000000000002',
    wo_number: 'WO-00002',
    asset_id: INITIAL_ASSETS[2]?.id || 'ast-00000000-0000-0000-0000-000000000003',
    title: 'Servis Berkala Genset Gedung Convention',
    description: 'Servis rutin preventif generator set termasuk pergantian oli dan filter.',
    priority: 'medium',
    status: 'pending',
    maintenance_type: 'preventive',
    assigned_to: null,
    requested_by: null,
    approved_by: null,
    vendor_id: null,
    sla_target_hours: 72,
    actual_hours: null,
    labor_cost: 0,
    parts_cost: 0,
    total_cost: 0,
    started_at: null,
    completed_at: null,
    notes: null,
    created_at: '2024-12-11T09:00:00Z',
    updated_at: '2024-12-11T09:00:00Z',
  },
  {
    id: 'wo-00000000-0000-0000-0000-000000000003',
    wo_number: 'WO-00003',
    asset_id: INITIAL_ASSETS[5]?.id || 'ast-00000000-0000-0000-0000-000000000006',
    title: 'Penggantian LCD Display Informasi Lantai GF',
    description: 'LCD display informasi di ground floor mall mengalami burn-in parah. Perlu penggantian panel.',
    priority: 'low',
    status: 'completed',
    maintenance_type: 'corrective',
    assigned_to: null,
    requested_by: null,
    approved_by: null,
    vendor_id: null,
    sla_target_hours: 168,
    actual_hours: 4,
    labor_cost: 500000,
    parts_cost: 8500000,
    total_cost: 9000000,
    started_at: '2024-11-20T10:00:00Z',
    completed_at: '2024-11-22T15:00:00Z',
    notes: 'Panel LCD 55" berhasil diganti. Garansi vendor 1 tahun.',
    created_at: '2024-11-18T08:00:00Z',
    updated_at: '2024-11-22T15:00:00Z',
  },
]
let workOrderPartsState: any[] = [
  {
    id: 'wop-00000000-0000-0000-0000-000000000001',
    work_order_id: 'wo-00000000-0000-0000-0000-000000000001',
    part_name: 'Kompresor AC Daikin 2.5 PK',
    part_code: 'DK-COMP-25PK',
    quantity: 1,
    unit_cost: 4500000,
    total_cost: 4500000,
    source: 'vendor',
    source_asset_id: null,
    notes: 'Garansi komponen 2 tahun dari Daikin',
    created_at: '2024-12-10T08:30:00Z',
  },
]
let workOrderCommentsState: any[] = [
  {
    id: 'woc-00000000-0000-0000-0000-000000000001',
    work_order_id: 'wo-00000000-0000-0000-0000-000000000001',
    user_id: 'demo-super-admin-id',
    comment: 'Prioritas tinggi — tamu VIP check-in 2 hari lagi. Harap selesai sebelum Jumat.',
    created_at: '2024-12-09T14:30:00Z',
  },
]
let auditLogsState: any[] = [
  {
    id: 'al-00000000-0000-0000-0000-000000000001',
    user_id: 'demo-super-admin-id',
    user_name: 'Super Admin TECHSAS',
    action: 'create',
    table_name: 'work_orders',
    record_id: 'wo-00000000-0000-0000-0000-000000000001',
    old_data: null,
    new_data: { title: 'Perbaikan AC Lobby Utama — Kompresor Bermasalah', priority: 'high' },
    description: 'Membuat Work Order WO-00001',
    ip_address: '192.168.1.100',
    created_at: '2024-12-09T14:00:00Z',
  },
  {
    id: 'al-00000000-0000-0000-0000-000000000002',
    user_id: 'demo-super-admin-id',
    user_name: 'Super Admin TECHSAS',
    action: 'update',
    table_name: 'assets',
    record_id: INITIAL_ASSETS[0]?.id || 'ast-001',
    old_data: { condition: 'good' },
    new_data: { condition: 'under_repair' },
    description: 'Mengubah kondisi aset AC Split Daikin menjadi "Dalam Perbaikan"',
    ip_address: '192.168.1.100',
    created_at: '2024-12-09T14:05:00Z',
  },
  {
    id: 'al-00000000-0000-0000-0000-000000000003',
    user_id: 'demo-super-admin-id',
    user_name: 'Super Admin TECHSAS',
    action: 'status_change',
    table_name: 'work_orders',
    record_id: 'wo-00000000-0000-0000-0000-000000000001',
    old_data: { status: 'pending' },
    new_data: { status: 'in_progress' },
    description: 'Mengubah status WO-00001 dari Pending ke In Progress',
    ip_address: '192.168.1.100',
    created_at: '2024-12-10T08:00:00Z',
  },
]

export function getMockTableData(table: string): any[] {
  switch (table) {
    case 'assets':
      return assetsState
    case 'business_units':
      return businessUnitsState
    case 'locations':
      return locationsState
    case 'asset_categories':
      return categoriesState
    case 'asset_maintenance':
      return maintenanceState
    case 'notifications':
      return notificationsState
    case 'vendors':
      return vendorsState
    case 'work_orders':
      return workOrdersState
    case 'work_order_parts':
      return workOrderPartsState
    case 'work_order_comments':
      return workOrderCommentsState
    case 'audit_logs':
      return auditLogsState
    case 'profiles':
      return Object.values(DEMO_USERS).map((u) => u.profile)
    case 'approval_workflows':
      return [
        { action_type: 'disposal_sale', min_value_threshold: 50000000, required_role: 'corporate_admin' },
        { action_type: 'disposal_sale', min_value_threshold: 500000000, required_role: 'super_admin' },
        { action_type: 'high_value_purchase', min_value_threshold: 100000000, required_role: 'corporate_admin' },
      ]
    case 'disposal_records':
    case 'disposal_requests':
      return [
        {
          id: 'dsp-00000000-0000-0000-0000-000000000001',
          asset_id: assetsState[7]?.id || 'ast-00000000-0000-0000-0000-000000000008',
          disposal_type: 'sale',
          proposed_price: 15000000,
          reason: 'Pergantian perabot foodcourt dengan model ergonomis terbaru',
          approval_status: 'pending',
          created_at: '2024-11-25T11:00:00Z',
          asset: assetsState[7] || { name: 'Meja Kursi Foodcourt Set A', asset_code: 'AMB-00008' },
        },
      ]
    case 'stock_opname_schedules':
      return [
        {
          id: 'opn-00000000-0000-0000-0000-000000000001',
          title: 'Stock Opname Tahunan 2024 - Workshop Produksi',
          business_unit_id: 'bu-hotel-00000000-0000-0000-0000-000000000001',
          status: 'in_progress',
          scheduled_date: '2024-12-15',
          created_at: '2024-11-01T08:00:00Z',
        },
      ]
    case 'asset_location_history':
      return []
    case 'asset_depreciation_log':
      return []
    default:
      return []
  }
}

class MockQueryBuilder {
  private table: string
  private filters: Array<(item: any) => boolean> = []
  private sortFn: ((a: any, b: any) => number) | null = null
  private rangeFrom = 0
  private rangeTo = Infinity
  private isSingle = false
  private isMaybeSingle = false
  private isHead = false
  private selectCols: string = '*'
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: any = null

  constructor(table: string) {
    this.table = table
  }

  select(columns = '*', options?: { count?: string; head?: boolean }) {
    this.selectCols = columns
    if (options?.head) {
      this.isHead = true
    }
    return this
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value)
    return this
  }

  neq(column: string, value: any) {
    this.filters.push((item) => item[column] !== value)
    return this
  }

  lt(column: string, value: any) {
    this.filters.push((item) => {
      const val = item[column]
      if (val == null) return false
      return val < value
    })
    return this
  }

  lte(column: string, value: any) {
    this.filters.push((item) => {
      const val = item[column]
      if (val == null) return false
      return val <= value
    })
    return this
  }

  gt(column: string, value: any) {
    this.filters.push((item) => {
      const val = item[column]
      if (val == null) return false
      return val > value
    })
    return this
  }

  gte(column: string, value: any) {
    this.filters.push((item) => {
      const val = item[column]
      if (val == null) return false
      return val >= value
    })
    return this
  }

  ilike(column: string, pattern: string) {
    const clean = pattern.replace(/%/g, '').toLowerCase()
    this.filters.push((item) => {
      const val = String(item[column] || '').toLowerCase()
      return val.includes(clean)
    })
    return this
  }

  or(clause: string) {
    const parts = clause.split(',')
    this.filters.push((item) => {
      return parts.some((part) => {
        const [col, op, pattern] = part.split('.')
        if (op === 'ilike' && pattern) {
          const clean = pattern.replace(/%/g, '').toLowerCase()
          return String(item[col] || '').toLowerCase().includes(clean)
        }
        if (op === 'eq') {
          return item[col] === pattern
        }
        return false
      })
    })
    return this
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => values.includes(item[column]))
    return this
  }

  is(column: string, value: any) {
    this.filters.push((item) => item[column] === value)
    return this
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'eq') {
      this.filters.push((item) => item[column] !== value)
    }
    return this
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.sortFn = (a, b) => {
      const valA = a[column]
      const valB = b[column]
      if (valA === valB) return 0
      if (valA == null) return ascending ? -1 : 1
      if (valB == null) return ascending ? 1 : -1
      return ascending ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1
    }
    return this
  }

  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }

  limit(count: number) {
    this.rangeFrom = 0
    this.rangeTo = count - 1
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  maybeSingle() {
    this.isMaybeSingle = true
    return this
  }

  insert(data: any) {
    this.operation = 'insert'
    this.payload = data
    return this
  }

  update(data: any) {
    this.operation = 'update'
    this.payload = data
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  private execute() {
    const rawData = getMockTableData(this.table)

    // Handle INSERT
    if (this.operation === 'insert') {
      const itemsToInsert = Array.isArray(this.payload) ? this.payload : [this.payload]
      const created = itemsToInsert.map((item, idx) => {
        let finalItem = { ...item }
        if (this.table === 'assets' && (!finalItem.asset_code || finalItem.asset_code.startsWith('AMB-'))) {
          const bu = businessUnitsState.find((b) => b.id === finalItem.business_unit_id)
          const cat = categoriesState.find((c) => c.id === finalItem.category_id)
          const loc = locationsState.find((l) => l.id === finalItem.current_location_id)
          finalItem.asset_code = generateSemanticAssetCode({
            businessUnitNameOrType: bu?.name || bu?.type,
            categoryName: cat?.name,
            purchaseDate: finalItem.purchase_date,
            locationName: loc?.name,
            locationLevel: loc?.level,
            sequenceNumber: assetsState.length + idx + 1,
          })
        }
        return {
          id: finalItem.id || `gen-${Date.now()}-${idx}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: finalItem.is_active ?? true,
          ...finalItem,
        }
      })

      if (this.table === 'assets') {
        assetsState = [...created, ...assetsState]
      } else if (this.table === 'business_units') {
        businessUnitsState = [...businessUnitsState, ...created]
      } else if (this.table === 'locations') {
        locationsState = [...locationsState, ...created]
      } else if (this.table === 'asset_categories') {
        categoriesState = [...categoriesState, ...created]
      } else if (this.table === 'asset_maintenance') {
        maintenanceState = [...created, ...maintenanceState]
      } else if (this.table === 'notifications') {
        notificationsState = [...created, ...notificationsState]
      } else if (this.table === 'work_orders') {
        workOrdersState = [...created, ...workOrdersState]
      } else if (this.table === 'vendors') {
        vendorsState = [...created, ...vendorsState]
      } else if (this.table === 'work_order_parts') {
        workOrderPartsState = [...created, ...workOrderPartsState]
      } else if (this.table === 'work_order_comments') {
        workOrderCommentsState = [...created, ...workOrderCommentsState]
      } else if (this.table === 'audit_logs') {
        auditLogsState = [...created, ...auditLogsState]
      }

      const res = this.isSingle ? created[0] : created
      return { data: res, error: null, count: created.length }
    }

    // Handle UPDATE
    if (this.operation === 'update') {
      const updated: any[] = []
      const updater = (item: any) => {
        if (this.filters.every((fn) => fn(item))) {
          const next = { ...item, ...this.payload, updated_at: new Date().toISOString() }
          updated.push(next)
          return next
        }
        return item
      }

      if (this.table === 'assets') assetsState = assetsState.map(updater)
      if (this.table === 'business_units') businessUnitsState = businessUnitsState.map(updater)
      if (this.table === 'locations') locationsState = locationsState.map(updater)
      if (this.table === 'asset_categories') categoriesState = categoriesState.map(updater)
      if (this.table === 'asset_maintenance') maintenanceState = maintenanceState.map(updater)
      if (this.table === 'notifications') notificationsState = notificationsState.map(updater)
      if (this.table === 'work_orders') workOrdersState = workOrdersState.map(updater)
      if (this.table === 'vendors') vendorsState = vendorsState.map(updater)
      if (this.table === 'work_order_parts') workOrderPartsState = workOrderPartsState.map(updater)
      if (this.table === 'work_order_comments') workOrderCommentsState = workOrderCommentsState.map(updater)

      const res = this.isSingle ? updated[0] : updated
      return { data: res, error: null, count: updated.length }
    }

    // Handle DELETE
    if (this.operation === 'delete') {
      const remaining = rawData.filter((item) => !this.filters.every((fn) => fn(item)))
      if (this.table === 'assets') assetsState = remaining
      if (this.table === 'business_units') businessUnitsState = remaining
      if (this.table === 'locations') locationsState = remaining
      if (this.table === 'asset_categories') categoriesState = remaining
      if (this.table === 'asset_maintenance') maintenanceState = remaining
      if (this.table === 'work_orders') workOrdersState = remaining
      if (this.table === 'vendors') vendorsState = remaining
      if (this.table === 'work_order_parts') workOrderPartsState = remaining
      if (this.table === 'work_order_comments') workOrderCommentsState = remaining

      return { data: null, error: null, count: rawData.length - remaining.length }
    }

    // Handle SELECT
    let result = rawData.filter((item) => this.filters.every((fn) => fn(item)))
    const totalCount = result.length

    if (this.sortFn) {
      result.sort(this.sortFn)
    }

    // Join relations
    if (this.table === 'assets') {
      result = result.map((asset) => {
        const cat = categoriesState.find((c) => c.id === asset.category_id)
        const bu = businessUnitsState.find((b) => b.id === asset.business_unit_id)
        const loc = locationsState.find((l) => l.id === asset.current_location_id)
        const pic = Object.values(DEMO_USERS).find((u) => u.id === asset.current_pic_id)?.profile
        return {
          ...asset,
          category: cat ? { id: cat.id, name: cat.name, account_code_asset: cat.account_code_asset, account_code_accum: cat.account_code_accum, account_code_expense: cat.account_code_expense } : null,
          asset_categories: cat ? { id: cat.id, name: cat.name, account_code_asset: cat.account_code_asset, account_code_accum: cat.account_code_accum, account_code_expense: cat.account_code_expense } : null,
          business_unit: bu ? { id: bu.id, name: bu.name, type: bu.type } : null,
          business_units: bu ? { id: bu.id, name: bu.name, code: bu.code, type: bu.type, logo_url: bu.logo_url } : null,
          current_location: loc ? { id: loc.id, name: loc.name, level: loc.level } : null,
          locations: loc ? { id: loc.id, name: loc.name, level: loc.level } : null,
          current_pic: pic ? { id: pic.id, full_name: pic.full_name, role: pic.role } : null,
          profiles: pic ? { id: pic.id, full_name: pic.full_name, role: pic.role } : null,
        }
      })
    }

    if (this.table === 'asset_maintenance') {
      result = result.map((m) => {
        const ast = assetsState.find((a) => a.id === m.asset_id)
        const bu = ast ? businessUnitsState.find((b) => b.id === ast.business_unit_id) : null
        const loc = ast ? locationsState.find((l) => l.id === ast.current_location_id) : null
        const assetObj = ast
          ? {
              id: ast.id,
              name: ast.name,
              asset_code: ast.asset_code,
              photo_url: ast.photo_url,
              condition: ast.condition,
              business_unit: bu ? { id: bu.id, name: bu.name } : null,
              current_location: loc ? { id: loc.id, name: loc.name } : null,
            }
          : null
        return {
          ...m,
          asset: assetObj,
          assets: assetObj,
        }
      })
    }

    if (this.table === 'work_orders') {
      result = result.map((wo) => {
        const ast = assetsState.find((a) => a.id === wo.asset_id)
        const bu = ast ? businessUnitsState.find((b) => b.id === ast.business_unit_id) : null
        const loc = ast ? locationsState.find((l) => l.id === ast.current_location_id) : null
        const vnd = vendorsState.find((v) => v.id === wo.vendor_id)
        const assignedUser = Object.values(DEMO_USERS).find((u) => u.id === wo.assigned_to)?.profile
        const parts = workOrderPartsState.filter((p) => p.work_order_id === wo.id)
        const comments = workOrderCommentsState.filter((c) => c.work_order_id === wo.id)
        const assetObj = ast
          ? {
              id: ast.id,
              name: ast.name,
              asset_code: ast.asset_code,
              photo_url: ast.photo_url,
              condition: ast.condition,
              business_unit: bu ? { id: bu.id, name: bu.name } : null,
              current_location: loc ? { id: loc.id, name: loc.name } : null,
            }
          : null
        return {
          ...wo,
          asset: assetObj,
          assets: assetObj,
          vendor: vnd || null,
          vendors: vnd || null,
          assigned_user: assignedUser || null,
          parts,
          comments,
        }
      })
    }

    if (this.table === 'audit_logs') {
      result = result.map((al) => {
        const usr = Object.values(DEMO_USERS).find((u) => u.id === al.user_id)?.profile
        return {
          ...al,
          user: usr ? { id: usr.id, full_name: usr.full_name, role: usr.role } : null,
          profiles: usr ? { id: usr.id, full_name: usr.full_name, role: usr.role } : null,
        }
      })
    }

    if (this.isHead) {
      return { data: null, error: null, count: totalCount }
    }

    const sliced = result.slice(this.rangeFrom, this.rangeTo + 1)

    if (this.isSingle) {
      if (sliced.length === 0) {
        return { data: null, error: { message: 'Row not found' }, count: 0 }
      }
      return { data: sliced[0], error: null, count: 1 }
    }

    if (this.isMaybeSingle) {
      return { data: sliced[0] || null, error: null, count: sliced.length }
    }

    return { data: sliced, error: null, count: totalCount }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const res = this.execute()
    return Promise.resolve(res).then(onfulfilled, onrejected)
  }
}

export function createMockSupabaseClient(activeDemoEmail = 'admin@techsas.id') {
  const currentDemoUser = DEMO_USERS[activeDemoEmail] || DEMO_USERS['admin@techsas.id']

  return {
    from: (table: string) => new MockQueryBuilder(table),
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: currentDemoUser.id,
            email: currentDemoUser.email,
            user_metadata: {
              full_name: currentDemoUser.profile.full_name,
              role: currentDemoUser.profile.role,
            },
          },
        },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            user: {
              id: currentDemoUser.id,
              email: currentDemoUser.email,
            },
          },
        },
        error: null,
      }),
      signInWithPassword: async ({ email }: { email: string }) => {
        const found = DEMO_USERS[email] || DEMO_USERS['admin@techsas.id']
        return {
          data: {
            user: {
              id: found.id,
              email: found.email,
            },
          },
          error: null,
        }
      },
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    storage: {
      from: () => ({
        upload: async (path: string) => ({ data: { path }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `/uploads/${path}` } }),
        remove: async () => ({ data: {}, error: null }),
      }),
    },
    rpc: async () => ({ data: null, error: null }),
  }
}
