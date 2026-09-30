/**
 * TECHSAS Universal Asset Management System
 * Semantic Asset Code Generator & Parser (Standar Kodefikasi Aset Digital (EAM ISO 55000))
 * 
 * Format Baku:
 *   [UNIT]-[KAT]-[YYMM]-[LOK]-[URUT]
 * Contoh:
 *   FLT-VH-2409-GFL-0001 (DriveNusa Fleet - Kendaraan)
 *   CAM-CM-2408-ST1-0002 (KameraPro - Kamera)
 *   GME-GM-2407-VIP-0003 (Nexus Gaming - PS5)
 *   CFE-FB-2406-BAR-0004 (Artisan Cafe - Espresso)
 */

// 1. Kamus Kode Unit Bisnis UMKM (3 Huruf Kapital)
export const BUSINESS_UNIT_CODE_MAP: Record<string, string> = {
  // Rental Mobil & Armada UMKM
  'drivenusa': 'FLT',
  'fleet': 'FLT',
  'rental mobil': 'FLT',
  'mobil': 'FLT',

  // Rental Kamera & Studio Multimedia
  'kamerapro': 'CAM',
  'kamera': 'CAM',
  'studio': 'CAM',
  'multimedia': 'CAM',

  // Rental PS VIP & Gaming Lounge
  'nexus gaming': 'GME',
  'gaming': 'GME',
  'rental ps': 'GME',
  'ps5': 'GME',

  // Artisan Cafe & Roastery
  'kopi artisan': 'CFE',
  'cafe': 'CFE',
  'roastery': 'CFE',
  'fnb': 'CFE',

  // Sound System & Alat Event
  'stagecraft': 'EVT',
  'sound': 'EVT',
  'event': 'EVT',
  'audio': 'EVT',

  // Corporate & Headquarter
  'corporate': 'COR',
  'hq': 'COR',
  'kantor': 'COR',
}

// 2. Kamus Kode Kategori Aset (2 Huruf Kapital)
export const CATEGORY_CODE_MAP: Record<string, string> = {
  'kendaraan & armada': 'VH',
  'kendaraan operasional': 'VH',
  'kendaraan': 'VH',
  'mobil': 'VH',
  'motor': 'VH',

  'kamera & multimedia': 'CM',
  'elektronik & av': 'CM',
  'kamera': 'CM',
  'lensa': 'CM',
  'audio': 'CM',

  'gaming console & hardware': 'GM',
  'konsol gaming': 'GM',
  'gaming': 'GM',

  'peralatan dapur & f&b': 'FB',
  'peralatan kopi & cafe': 'FB',
  'f&b': 'FB',
  'mesin kopi': 'FB',

  'sound system & event gear': 'EV',
  'sound system': 'EV',
  'alat pesta': 'EV',

  'it equipment & komputer': 'IT',
  'it': 'IT',
  'komputer': 'IT',
  'laptop': 'IT',

  'furniture & fixture': 'FN',
  'furniture': 'FN',
  'sofa': 'FN',
  'kursi': 'FN',

  'mesin & peralatan hvac': 'HV',
  'hvac': 'HV',
  'ac': 'HV',

  'peralatan keamanan & cctv': 'SC',
  'cctv': 'SC',
}

/**
 * Mendapatkan kode unit bisnis (3 huruf capslock)
 */
export function getBusinessUnitCode(nameOrType?: string | null): string {
  if (!nameOrType) return 'TCS'
  const normalized = nameOrType.trim().toLowerCase()
  
  for (const [key, code] of Object.entries(BUSINESS_UNIT_CODE_MAP)) {
    if (normalized.includes(key)) {
      return code
    }
  }

  const clean = nameOrType.replace(/[^a-zA-Z]/g, '').toUpperCase()
  return clean.slice(0, 3).padEnd(3, 'T')
}

/**
 * Mendapatkan kode kategori aset (2 huruf capslock)
 */
export function getCategoryCode(name?: string | null): string {
  if (!name) return 'AS'
  const normalized = name.trim().toLowerCase()

  for (const [key, code] of Object.entries(CATEGORY_CODE_MAP)) {
    if (normalized.includes(key)) {
      return code
    }
  }

  const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
  return clean.slice(0, 2).padEnd(2, 'A')
}

/**
 * Mendapatkan kode lokasi / area (3 karakter capslock)
 */
export function getLocationCode(locationName?: string | null, level?: string | null): string {
  if (!locationName) return 'GFL'
  const str = locationName.toLowerCase()

  if (str.includes('vip')) return 'VIP'
  if (str.includes('barista') || str.includes('bar')) return 'BAR'
  if (str.includes('studio 1') || str.includes('studio-1')) return 'ST1'
  if (str.includes('studio 2') || str.includes('studio-2')) return 'ST2'
  if (str.includes('garage') || str.includes('garasi') || str.includes('pool')) return 'GRG'
  if (str.includes('gudang') || str.includes('warehouse')) return 'GDG'
  if (str.includes('lobby') || str.includes('front')) return 'GFL'
  if (str.includes('lantai 1') || str.includes('lt 1')) return 'L01'
  if (str.includes('lantai 2') || str.includes('lt 2')) return 'L02'
  if (str.includes('outdoor')) return 'OUT'

  const clean = locationName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return clean.slice(0, 3).padEnd(3, 'L')
}

/**
 * Mendapatkan kode tanggal (YYMM) dari purchase_date
 */
export function getDateCode(dateString?: string | null): string {
  const d = dateString ? new Date(dateString) : new Date()
  const validDate = isNaN(d.getTime()) ? new Date() : d

  const yy = validDate.getFullYear().toString().slice(-2)
  const mm = (validDate.getMonth() + 1).toString().padStart(2, '0')
  return `${yy}${mm}`
}

export interface SemanticCodeParams {
  businessUnitNameOrType?: string | null
  categoryName?: string | null
  purchaseDate?: string | null
  locationName?: string | null
  locationLevel?: string | null
  sequenceNumber?: number | string
}

/**
 * Generate kode aset semantik standar EAM
 * Hasil contoh: FLT-VH-2409-GRG-0001
 */
export function generateSemanticAssetCode(params: SemanticCodeParams): string {
  const bu = getBusinessUnitCode(params.businessUnitNameOrType)
  const cat = getCategoryCode(params.categoryName)
  const yymm = getDateCode(params.purchaseDate)
  const loc = getLocationCode(params.locationName, params.locationLevel)

  const seqNum = typeof params.sequenceNumber === 'number'
    ? params.sequenceNumber
    : parseInt(params.sequenceNumber || '1', 10) || 1
  
  const seq = seqNum.toString().padStart(4, '0').slice(-4)

  return `${bu}-${cat}-${yymm}-${loc}-${seq}`
}

export interface ParsedSemanticCode {
  isSemantic: boolean
  unitCode: string
  categoryCode: string
  yearMonth: string
  locationCode: string
  sequence: string
  formattedYearMonth: string
}

/**
 * Parser / Decoder kode aset semantik
 */
export function parseSemanticAssetCode(code: string): ParsedSemanticCode {
  if (!code) {
    return {
      isSemantic: false,
      unitCode: 'TCS',
      categoryCode: 'AS',
      yearMonth: '',
      locationCode: 'GEN',
      sequence: '0000',
      formattedYearMonth: '-',
    }
  }

  const parts = code.trim().toUpperCase().split('-')

  if (parts.length === 5) {
    const [unitCode, categoryCode, yearMonth, locationCode, sequence] = parts
    let formattedYearMonth = yearMonth
    if (yearMonth.length === 4) {
      const yy = `20${yearMonth.slice(0, 2)}`
      const mm = yearMonth.slice(2, 4)
      formattedYearMonth = `${mm}/${yy}`
    }

    return {
      isSemantic: true,
      unitCode,
      categoryCode,
      yearMonth,
      locationCode,
      sequence,
      formattedYearMonth,
    }
  }

  return {
    isSemantic: false,
    unitCode: parts[0] || 'TCS',
    categoryCode: 'AS',
    yearMonth: '',
    locationCode: 'GEN',
    sequence: parts[1] || '0000',
    formattedYearMonth: '-',
  }
}
