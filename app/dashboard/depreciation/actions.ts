'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateAssetMonthlyDepreciation } from '@/lib/utils/depreciation'
import type { ActionResult, AssetDepreciationLog } from '@/types'

export interface DepreciationLogItem extends AssetDepreciationLog {
  asset: {
    id: string
    asset_code: string
    name: string
    purchase_price: number | null
    depreciation_method: string | null
    business_unit: { id: string; name: string } | null
    category: { id: string; name: string } | null
  } | null
}

export async function getDepreciationMetrics(businessUnitId?: string) {
  const supabase = await createClient()

  let query = (supabase.from('assets') as any)
    .select('purchase_price, current_book_value, status')
    .neq('status', 'disposed')

  if (businessUnitId) {
    query = query.eq('business_unit_id', businessUnitId)
  }

  const { data: assets } = await query

  const items = (assets || []) as {
    purchase_price: number | null
    current_book_value: number | null
  }[]

  const totalAcquisition = items.reduce(
    (sum, a) => sum + (Number(a.purchase_price) || 0),
    0
  )
  const totalBookValue = items.reduce(
    (sum, a) => sum + (Number(a.current_book_value) || 0),
    0
  )
  const totalAccumulatedDepreciation = Math.max(
    0,
    totalAcquisition - totalBookValue
  )

  return {
    totalAcquisition,
    totalBookValue,
    totalAccumulatedDepreciation,
    totalAssets: items.length,
  }
}

export async function getDepreciationLogs(filters: {
  periodMonth?: string
  businessUnitId?: string
} = {}): Promise<DepreciationLogItem[]> {
  const supabase = await createClient()

  let query = (supabase.from('asset_depreciation_log') as any)
    .select(
      `
      *,
      asset:assets(
        id, asset_code, name, purchase_price, depreciation_method,
        business_unit:business_units(id, name),
        category:asset_categories(id, name)
      )
    `
    )
    .order('period_month', { ascending: false })
    .order('calculated_at', { ascending: false })

  if (filters.periodMonth) {
    query = query.eq('period_month', filters.periodMonth)
  }

  const { data, error } = await query
  if (error) return []

  let list = (data || []) as DepreciationLogItem[]

  if (filters.businessUnitId) {
    list = list.filter((i) => i.asset?.business_unit?.id === filters.businessUnitId)
  }

  return list
}

/**
 * Execute batch calculation for all active assets in the specified month
 */
export async function runBatchMonthlyDepreciation(
  periodMonth: string, // e.g. "2025-08-01"
  businessUnitId?: string
): Promise<
  ActionResult<{
    processedCount: number
    totalDepreciated: number
  }>
> {
  const supabase = await createClient()

  // Format periodMonth to YYYY-MM-01
  const cleanPeriod = periodMonth.length === 7 ? `${periodMonth}-01` : periodMonth

  // 1. Fetch eligible active assets
  let query = (supabase.from('assets') as any)
    .select(
      'id, asset_code, purchase_price, useful_life_months, depreciation_method, current_book_value'
    )
    .eq('status', 'active')

  if (businessUnitId) {
    query = query.eq('business_unit_id', businessUnitId)
  }

  const { data: assets, error } = await query

  if (error || !assets || assets.length === 0) {
    return {
      success: false,
      error: 'Tidak ditemukan aset aktif untuk diproses penyusutannya.',
    }
  }

  let processedCount = 0
  let totalDepreciated = 0

  for (const asset of assets) {
    const calc = calculateAssetMonthlyDepreciation(
      asset.purchase_price,
      asset.useful_life_months,
      asset.current_book_value,
      asset.depreciation_method || 'straight_line'
    )

    if (calc.monthlyDepreciation > 0) {
      // Check if already calculated for this month
      const { data: existing } = await (supabase
        .from('asset_depreciation_log') as any)
        .select('id')
        .eq('asset_id', asset.id)
        .eq('period_month', cleanPeriod)
        .single()

      if (existing) {
        // Update existing log
        await (supabase.from('asset_depreciation_log') as any)
          .update({
            book_value: calc.newBookValue,
            depreciation_amount: calc.monthlyDepreciation,
            calculated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        // Insert new log
        await (supabase.from('asset_depreciation_log') as any).insert({
          asset_id: asset.id,
          period_month: cleanPeriod,
          book_value: calc.newBookValue,
          depreciation_amount: calc.monthlyDepreciation,
          calculated_at: new Date().toISOString(),
        })
      }

      // Update asset's current_book_value
      await (supabase
        .from('assets') as any)
        .update({ current_book_value: calc.newBookValue })
        .eq('id', asset.id)

      processedCount++
      totalDepreciated += calc.monthlyDepreciation
    }
  }

  revalidatePath('/dashboard/depreciation')
  revalidatePath('/dashboard/assets')

  return {
    success: true,
    data: {
      processedCount,
      totalDepreciated,
    },
  }
}

export interface JournalEntryLine {
  id: string
  date: string
  voucherNo: string
  accountCode: string
  accountName: string
  costCenter: string
  debit: number
  credit: number
  memo: string
}

export interface RollForwardCategoryItem {
  categoryName: string
  accountCode?: string
  assetCount: number
  beginningGross: number
  additions: number
  disposals: number
  endingGross: number
  beginningAccumDeprec: number
  monthlyDeprec: number
  disposalAccumDeprec: number
  endingAccumDeprec: number
  netBookValue: number
}

export interface AccountingJournalResult {
  periodMonth: string
  voucherNo: string
  date: string
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  lines: JournalEntryLine[]
  rollForward: RollForwardCategoryItem[]
}

function getCoAByCategory(catName: string) {
  const lower = catName.toLowerCase()
  if (lower.includes('elektronik') || lower.includes('komputer') || lower.includes('it')) {
    return { asset: '1-1201', accum: '1-1202', expense: '5-2101' }
  }
  if (lower.includes('mesin') || lower.includes('me') || lower.includes('genset') || lower.includes('ac') || lower.includes('hvac')) {
    return { asset: '1-1203', accum: '1-1204', expense: '5-2102' }
  }
  if (lower.includes('furnitur') || lower.includes('mebel') || lower.includes('perabot') || lower.includes('linen')) {
    return { asset: '1-1205', accum: '1-1206', expense: '5-2103' }
  }
  if (lower.includes('kendaraan') || lower.includes('mobil') || lower.includes('motor')) {
    return { asset: '1-1207', accum: '1-1208', expense: '5-2104' }
  }
  if (lower.includes('gedung') || lower.includes('bangunan')) {
    return { asset: '1-1209', accum: '1-1210', expense: '5-2105' }
  }
  return { asset: '1-1299', accum: '1-1298', expense: '5-2199' }
}

/**
 * Generate formal accounting journal entries and fixed asset roll-forward schedule
 */
export async function getMonthlyAccountingJournal(
  periodMonth: string,
  businessUnitId?: string
): Promise<AccountingJournalResult> {
  const supabase = await createClient()

  // Format date info
  const cleanPeriod = periodMonth.length === 7 ? periodMonth : periodMonth.slice(0, 7)
  const [year, month] = cleanPeriod.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const dateFormatted = `${lastDay}/${String(month).padStart(2, '0')}/${year}`
  const voucherBase = `JV/${year}/${String(month).padStart(2, '0')}`

  // Fetch all active assets with relations
  let query = (supabase.from('assets') as any)
    .select(
      `
      id, asset_code, name, purchase_price, current_book_value, useful_life_months,
      depreciation_method, created_at, status, account_code_asset, account_code_accum, account_code_expense,
      business_unit:business_units(id, name),
      category:asset_categories(id, name, account_code_asset, account_code_accum, account_code_expense)
    `
    )
    .neq('status', 'disposed')

  if (businessUnitId) {
    query = query.eq('business_unit_id', businessUnitId)
  }

  const { data: assets } = await query
  const assetList = (assets || []) as any[]

  // Group by Category + Business Unit + CoA for Journal Lines
  const journalGroups = new Map<
    string,
    { categoryName: string; buName: string; expenseCode: string; accumCode: string; monthlyDeprec: number; totalGross: number }
  >()

  // Group by Category for Roll-Forward Schedule
  const rollForwardMap = new Map<
    string,
    {
      categoryName: string
      assetCount: number
      gross: number
      currentBook: number
      monthlyDeprec: number
    }
  >()

  assetList.forEach((asset) => {
    const catName = asset.category?.name || 'Peralatan Umum'
    const buName = asset.business_unit?.name || 'Kantor Pusat'
    const price = Number(asset.purchase_price) || 0
    const currentBook = Number(asset.current_book_value) ?? price

    const fallbackCoA = getCoAByCategory(catName)
    const expenseCode = asset.account_code_expense || asset.category?.account_code_expense || fallbackCoA.expense
    const accumCode = asset.account_code_accum || asset.category?.account_code_accum || fallbackCoA.accum

    // Calculate monthly depreciation
    const calc = calculateAssetMonthlyDepreciation(
      price,
      asset.useful_life_months,
      currentBook,
      asset.depreciation_method || 'straight_line'
    )
    const monthlyAmt = calc.monthlyDepreciation

    // Journal map
    const jKey = `${catName}__${buName}__${expenseCode}__${accumCode}`
    const jCurr = journalGroups.get(jKey) || {
      categoryName: catName,
      buName,
      expenseCode,
      accumCode,
      monthlyDeprec: 0,
      totalGross: 0,
    }
    jCurr.monthlyDeprec += monthlyAmt
    jCurr.totalGross += price
    journalGroups.set(jKey, jCurr)

    // Roll-forward map
    const assetCoACode = asset.account_code_asset || asset.category?.account_code_asset || fallbackCoA.asset
    const rfCurr = rollForwardMap.get(catName) || {
      categoryName: catName,
      accountCode: assetCoACode,
      assetCount: 0,
      gross: 0,
      currentBook: 0,
      monthlyDeprec: 0,
    }
    rfCurr.assetCount += 1
    rfCurr.gross += price
    rfCurr.currentBook += currentBook
    rfCurr.monthlyDeprec += monthlyAmt
    rollForwardMap.set(catName, rfCurr)
  })

  // Build Journal Lines (Debit & Credit pairs)
  const lines: JournalEntryLine[] = []
  let lineIdx = 1

  journalGroups.forEach((group, _) => {
    if (group.monthlyDeprec <= 0) return

    const voucherNo = `${voucherBase}/${String(lineIdx).padStart(3, '0')}`

    // DEBIT: Beban Penyusutan
    lines.push({
      id: `jl-deb-${lineIdx}`,
      date: dateFormatted,
      voucherNo,
      accountCode: group.expenseCode,
      accountName: `Beban Penyusutan - ${group.categoryName}`,
      costCenter: group.buName,
      debit: group.monthlyDeprec,
      credit: 0,
      memo: `Alokasi Beban Penyusutan ${group.categoryName} (${group.buName}) - Periode ${cleanPeriod}`,
    })

    // KREDIT: Akumulasi Penyusutan (Contra Asset)
    lines.push({
      id: `jl-crd-${lineIdx}`,
      date: dateFormatted,
      voucherNo,
      accountCode: group.accumCode,
      accountName: `Akumulasi Penyusutan - ${group.categoryName}`,
      costCenter: group.buName,
      debit: 0,
      credit: group.monthlyDeprec,
      memo: `Kontra Akun Akumulasi Penyusutan Aset Tetap ${group.categoryName} (${group.buName})`,
    })

    lineIdx++
  })

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0)

  // Build Roll-Forward schedule items
  const rollForward: RollForwardCategoryItem[] = []
  rollForwardMap.forEach((rf) => {
    const endingGross = rf.gross
    const endingAccum = Math.max(0, rf.gross - rf.currentBook)
    const beginningAccum = Math.max(0, endingAccum - rf.monthlyDeprec)

    rollForward.push({
      categoryName: rf.categoryName,
      accountCode: (rf as any).accountCode || '—',
      assetCount: rf.assetCount,
      beginningGross: endingGross,
      additions: 0,
      disposals: 0,
      endingGross,
      beginningAccumDeprec: beginningAccum,
      monthlyDeprec: rf.monthlyDeprec,
      disposalAccumDeprec: 0,
      endingAccumDeprec: endingAccum,
      netBookValue: rf.currentBook,
    })
  })

  return {
    periodMonth: cleanPeriod,
    voucherNo: `${voucherBase}/ALL`,
    date: dateFormatted,
    totalDebit,
    totalCredit,
    isBalanced: totalDebit === totalCredit,
    lines,
    rollForward,
  }
}

export interface AccountingSpreadsheetData {
  periodMonth: string
  dateFormatted: string
  businessUnitName: string
  journal: AccountingJournalResult
  unitSummaries: {
    unitName: string
    unitType: string
    assetCount: number
    grossValue: number
    monthlyDepreciation: number
    bookValue: number
  }[]
  assetLedger: {
    assetCode: string
    name: string
    businessUnitName: string
    locationName: string
    picName: string
    categoryName: string
    accountCodeAsset: string
    purchaseDate: string
    usefulLifeMonths: number
    depreciationMethod: string
    purchasePrice: number
    monthlyDepreciation: number
    currentBookValue: number
    accumulatedDepreciation: number
    condition: string
    status: string
  }[]
}

/**
 * Fetch full comprehensive accounting data for multi-sheet Excel spreadsheet generation
 */
export async function getAccountingSpreadsheetData(
  periodMonth: string,
  businessUnitId?: string
): Promise<AccountingSpreadsheetData> {
  const supabase = await createClient()

  // 1. Get journal & roll-forward
  const journal = await getMonthlyAccountingJournal(periodMonth, businessUnitId)

  // 2. Business units info
  const { data: rawUnits } = await (supabase.from('business_units') as any)
    .select('id, name, type')
    .eq('is_active', true)
  const businessUnits = (rawUnits || []) as any[]

  let businessUnitName = 'Konsolidasi (Seluruh Unit Bisnis TECHSAS)'
  if (businessUnitId) {
    const found = businessUnits.find((u) => u.id === businessUnitId)
    if (found) businessUnitName = found.name
  }

  // 3. Fetch all active assets with relations
  let query = (supabase.from('assets') as any)
    .select(
      `
      id, asset_code, name, purchase_price, current_book_value, useful_life_months,
      depreciation_method, purchase_date, condition, status, account_code_asset,
      business_unit:business_units(id, name, type),
      category:asset_categories(id, name, account_code_asset),
      current_location:locations(id, name),
      current_pic:profiles(id, full_name)
    `
    )
    .neq('status', 'disposed')
    .order('asset_code', { ascending: true })

  if (businessUnitId) {
    query = query.eq('business_unit_id', businessUnitId)
  }

  const { data: rawAssets } = await query
  const assetList = (rawAssets || []) as any[]

  // 4. Summaries by Business Unit
  const unitMap = new Map<
    string,
    {
      unitName: string
      unitType: string
      assetCount: number
      grossValue: number
      monthlyDepreciation: number
      bookValue: number
    }
  >()

  // Initialize for all active business units
  businessUnits.forEach((bu) => {
    if (businessUnitId && bu.id !== businessUnitId) return
    unitMap.set(bu.name, {
      unitName: bu.name,
      unitType:
        bu.type === 'hotel'
          ? 'Hospitality / Hotel'
          : bu.type === 'mall'
          ? 'Retail & Mall'
          : 'Corporate / Property',
      assetCount: 0,
      grossValue: 0,
      monthlyDepreciation: 0,
      bookValue: 0,
    })
  })

  // 5. Build Asset Ledger
  const assetLedger = assetList.map((asset) => {
    const price = Number(asset.purchase_price) || 0
    const currentBook = Number(asset.current_book_value) ?? price
    const usefulLife = Number(asset.useful_life_months) || 0
    const buName = asset.business_unit?.name || 'Kantor Pusat'
    const buType = asset.business_unit?.type || 'corporate'

    const calc = calculateAssetMonthlyDepreciation(
      price,
      usefulLife,
      currentBook,
      asset.depreciation_method || 'straight_line'
    )
    const monthlyDeprec = calc.monthlyDepreciation
    const accumDeprec = Math.max(0, price - currentBook)

    // Update unit summary
    const uItem = unitMap.get(buName) || {
      unitName: buName,
      unitType: buType,
      assetCount: 0,
      grossValue: 0,
      monthlyDepreciation: 0,
      bookValue: 0,
    }
    uItem.assetCount += 1
    uItem.grossValue += price
    uItem.monthlyDepreciation += monthlyDeprec
    uItem.bookValue += currentBook
    unitMap.set(buName, uItem)

    return {
      assetCode: asset.asset_code,
      name: asset.name,
      businessUnitName: buName,
      locationName: asset.current_location?.name || '—',
      picName: asset.current_pic?.full_name || '—',
      categoryName: asset.category?.name || 'Umum',
      accountCodeAsset: asset.account_code_asset || asset.category?.account_code_asset || '—',
      purchaseDate: asset.purchase_date || '—',
      usefulLifeMonths: usefulLife,
      depreciationMethod: asset.depreciation_method || 'straight_line',
      purchasePrice: price,
      monthlyDepreciation: monthlyDeprec,
      currentBookValue: currentBook,
      accumulatedDepreciation: accumDeprec,
      condition:
        asset.condition === 'good'
          ? 'Baik'
          : asset.condition === 'fair'
          ? 'Cukup'
          : asset.condition === 'damaged'
          ? 'Rusak'
          : 'Dalam Perbaikan',
      status: asset.status === 'active' ? 'Aktif' : 'Pending',
    }
  })

  return {
    periodMonth: journal.periodMonth,
    dateFormatted: journal.date,
    businessUnitName,
    journal,
    unitSummaries: Array.from(unitMap.values()),
    assetLedger,
  }
}
