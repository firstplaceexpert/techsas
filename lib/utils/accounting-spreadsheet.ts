import * as XLSX from 'xlsx'
import type { AccountingSpreadsheetData } from '@/app/dashboard/depreciation/actions'

/**
 * Format helper for readable timestamps
 */
function getTimestamp() {
  const d = new Date()
  return `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
}

/**
 * Generate a professional, audit-ready Multi-Sheet Excel Workbook (.xlsx)
 * designed specifically for Finance, Accounting, and Tax teams.
 */
export function exportAccountingExcelWorkbook(data: AccountingSpreadsheetData) {
  const wb = XLSX.utils.book_new()
  const exportTime = getTimestamp()

  // =========================================================================
  // SHEET 1: RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY & BUSINESS UNIT RECAP)
  // =========================================================================
  const totalGross = data.journal.rollForward.reduce((s, r) => s + r.endingGross, 0)
  const totalDeprec = data.journal.rollForward.reduce((s, r) => s + r.monthlyDeprec, 0)
  const totalAccum = data.journal.rollForward.reduce((s, r) => s + r.endingAccumDeprec, 0)
  const totalBookValue = data.journal.rollForward.reduce((s, r) => s + r.netBookValue, 0)
  const totalAssetCount = data.journal.rollForward.reduce((s, r) => s + r.assetCount, 0)

  const summaryRows: any[][] = [
    ['PT PUTERA SEJAHTERA MANDIRI JAYA (TECHSAS ASSET HUB)'],
    ['LAPORAN REKAPITULASI ASET TETAP & AKUNTANSI PENYUSUTAN'],
    [''],
    ['Entitas / Unit Bisnis', data.businessUnitName],
    ['Periode Akuntansi', data.periodMonth],
    ['Tanggal Laporan', data.dateFormatted],
    ['Waktu Cetak', exportTime],
    ['Status Jurnal Double-Entry', data.journal.isBalanced ? 'SEIMBANG (BALANCE OK)' : 'TIDAK SEIMBANG'],
    [''],
    ['RINGKASAN UTAMA ASET TETAP (IDR)'],
    ['Indikator Finansial', 'Nilai (Rupiah)', 'Keterangan'],
    ['Total Nilai Perolehan (Gross Asset Value)', totalGross, 'Harga perolehan seluruh aset tetap aktif'],
    ['Total Beban Penyusutan Periode Ini', totalDeprec, `Beban penyusutan bulan ${data.periodMonth}`],
    ['Total Akumulasi Penyusutan', totalAccum, 'Kontra akun aset neraca per akhir periode'],
    ['Nilai Buku Bersih (Net Book Value / NBV)', totalBookValue, 'Nilai sisa buku tercatat di neraca'],
    ['Total Jumlah Unit Aset Terdaftar', totalAssetCount, 'Unit aset fisik aktif'],
    [''],
    ['REKAPITULASI KONSOLIDASI PER UNIT BISNIS'],
    [
      'No',
      'Nama Unit Bisnis',
      'Sektor / Tipe',
      'Jumlah Aset',
      'Nilai Perolehan (Rp)',
      'Beban Depresiasi Bulan Ini (Rp)',
      'Nilai Buku Bersih (Rp)',
      'Kontribusi Aset (%)',
    ],
  ]

  data.unitSummaries.forEach((u, i) => {
    const pct = totalGross > 0 ? (u.grossValue / totalGross) * 100 : 0
    summaryRows.push([
      i + 1,
      u.unitName,
      u.unitType,
      u.assetCount,
      u.grossValue,
      u.monthlyDepreciation,
      u.bookValue,
      Number(pct.toFixed(1)),
    ])
  })

  // Total row for unit summaries
  summaryRows.push([
    'TOTAL',
    'KONSOLIDASIAN',
    '—',
    totalAssetCount,
    totalGross,
    totalDeprec,
    totalBookValue,
    100,
  ])

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [
    { wch: 6 },
    { wch: 36 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 24 },
    { wch: 22 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSummary, '1. Ringkasan Eksekutif')

  // =========================================================================
  // SHEET 2: JADWAL MUTASI ASET TETAP (ROLL-FORWARD SCHEDULE - PSAK 16 / IAS 16)
  // =========================================================================
  const rfRows: any[][] = [
    ['PT PUTERA SEJAHTERA MANDIRI JAYA (TECHSAS ASSET HUB)'],
    ['DAFTAR MUTASI & JADWAL PENYUSUTAN ASET TETAP (FIXED ASSET ROLL-FORWARD)'],
    [`Periode: ${data.periodMonth} | Unit: ${data.businessUnitName} | Dicetak: ${exportTime}`],
    ['Standar Pelaporan: PSAK 16 / Lampiran Pajak Fiskal Aset Tetap'],
    [''],
    [
      'No',
      'Kode Akun (CoA)',
      'Kelompok / Golongan Aset',
      'Jumlah Unit',
      'Saldo Awal Perolehan (Rp)',
      'Penambahan (Rp)',
      'Pelepasan / Mutasi (Rp)',
      'Saldo Akhir Perolehan (Rp)',
      'Akum. Penyusutan Awal (Rp)',
      'Penyusutan Bulan Ini (Rp)',
      'Pelepasan Akumulasi (Rp)',
      'Akum. Penyusutan Akhir (Rp)',
      'Nilai Buku Bersih (NBV) (Rp)',
    ],
  ]

  let sumBeginningGross = 0
  let sumAdditions = 0
  let sumDisposals = 0
  let sumEndingGross = 0
  let sumBeginningAccum = 0
  let sumPeriodDeprec = 0
  let sumEndingAccum = 0
  let sumNBV = 0

  data.journal.rollForward.forEach((rf, i) => {
    sumBeginningGross += rf.beginningGross
    sumAdditions += rf.additions
    sumDisposals += rf.disposals
    sumEndingGross += rf.endingGross
    sumBeginningAccum += rf.beginningAccumDeprec
    sumPeriodDeprec += rf.monthlyDeprec
    sumEndingAccum += rf.endingAccumDeprec
    sumNBV += rf.netBookValue

    rfRows.push([
      i + 1,
      rf.accountCode || '—',
      rf.categoryName,
      rf.assetCount,
      rf.beginningGross,
      rf.additions,
      rf.disposals,
      rf.endingGross,
      rf.beginningAccumDeprec,
      rf.monthlyDeprec,
      rf.disposalAccumDeprec,
      rf.endingAccumDeprec,
      rf.netBookValue,
    ])
  })

  // Baris Total Roll-Forward
  rfRows.push([
    'TOTAL',
    '—',
    'SEMUA GOLONGAN ASET',
    totalAssetCount,
    sumBeginningGross,
    sumAdditions,
    sumDisposals,
    sumEndingGross,
    sumBeginningAccum,
    sumPeriodDeprec,
    0,
    sumEndingAccum,
    sumNBV,
  ])

  const wsRollForward = XLSX.utils.aoa_to_sheet(rfRows)
  wsRollForward['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 28 },
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 24 },
  ]
  XLSX.utils.book_append_sheet(wb, wsRollForward, '2. Mutasi Aset (Roll-Forward)')

  // =========================================================================
  // SHEET 3: JURNAL UMUM DOUBLE-ENTRY (GENERAL LEDGER ENTRIES)
  // =========================================================================
  const journalRows: any[][] = [
    ['PT PUTERA SEJAHTERA MANDIRI JAYA (TECHSAS ASSET HUB)'],
    ['JURNAL TRANSAKSI PENYUSUTAN ASET TETAP (DOUBLE-ENTRY GL ENTRY)'],
    [`No. Dokumen: ${data.journal.voucherNo} | Tanggal Posting: ${data.dateFormatted}`],
    ['Format Kompatibel: SAP, Accurate, Zahir, Jurnal.id, Oracle ERP'],
    [''],
    [
      'No. Urut',
      'No. Bukti / Voucher',
      'Tanggal Posting',
      'Kode Akun (CoA)',
      'Nama Akun Akuntansi',
      'Cost Center / Unit Bisnis',
      'Debit (Rp)',
      'Kredit (Rp)',
      'Keterangan / Memo Transaksi',
    ],
  ]

  data.journal.lines.forEach((l, i) => {
    journalRows.push([
      i + 1,
      l.voucherNo,
      l.date,
      l.accountCode,
      l.accountName,
      l.costCenter,
      l.debit,
      l.credit,
      l.memo,
    ])
  })

  // Baris Total Jurnal & Status Balance
  journalRows.push([
    'TOTAL',
    '—',
    '—',
    '—',
    'TOTAL MUTASI DEBIT / KREDIT',
    '—',
    data.journal.totalDebit,
    data.journal.totalCredit,
    data.journal.isBalanced ? 'BALANCE (DEBIT = KREDIT)' : 'TIDAK SEIMBANG',
  ])

  const wsJournal = XLSX.utils.aoa_to_sheet(journalRows)
  wsJournal['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 34 },
    { wch: 26 },
    { wch: 18 },
    { wch: 18 },
    { wch: 48 },
  ]
  XLSX.utils.book_append_sheet(wb, wsJournal, '3. Jurnal Akuntansi (GL)')

  // =========================================================================
  // SHEET 4: BUKU BESAR RINCIAN ASET (FIXED ASSET REGISTER)
  // =========================================================================
  const assetRows: any[][] = [
    ['PT PUTERA SEJAHTERA MANDIRI JAYA (TECHSAS ASSET HUB)'],
    ['BUKU BESAR RINCIAN INVENTARIS ASET TETAP (ASSET MASTER REGISTER)'],
    [`Unit: ${data.businessUnitName} | Per: ${exportTime} | Total: ${data.assetLedger.length} Aset`],
    [''],
    [
      'No',
      'Nomor Registrasi Aset (Tag)',
      'Nama Aset',
      'Unit Bisnis',
      'Lokasi Fisik',
      'PIC Penanggung Jawab',
      'Golongan Kategori',
      'Kode Akun (CoA)',
      'Tanggal Beli',
      'Masa Manfaat (Bln)',
      'Metode Depresiasi',
      'Harga Perolehan (Rp)',
      'Depresiasi Bulanan (Rp)',
      'Nilai Buku Saat Ini (Rp)',
      'Akum. Penyusutan (Rp)',
      'Kondisi Fisik',
      'Status Operasional',
    ],
  ]

  let sumLedgerGross = 0
  let sumLedgerDeprec = 0
  let sumLedgerBook = 0
  let sumLedgerAccum = 0

  data.assetLedger.forEach((a, i) => {
    sumLedgerGross += a.purchasePrice
    sumLedgerDeprec += a.monthlyDepreciation
    sumLedgerBook += a.currentBookValue
    sumLedgerAccum += a.accumulatedDepreciation

    assetRows.push([
      i + 1,
      a.assetCode,
      a.name,
      a.businessUnitName,
      a.locationName,
      a.picName,
      a.categoryName,
      a.accountCodeAsset || '—',
      a.purchaseDate || '—',
      a.usefulLifeMonths || 0,
      a.depreciationMethod === 'declining_balance' ? 'Saldo Menurun' : 'Garis Lurus',
      a.purchasePrice,
      a.monthlyDepreciation,
      a.currentBookValue,
      a.accumulatedDepreciation,
      a.condition,
      a.status,
    ])
  })

  // Baris Total Ledger
  assetRows.push([
    'TOTAL',
    '—',
    `${data.assetLedger.length} Unit Aset`,
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    sumLedgerGross,
    sumLedgerDeprec,
    sumLedgerBook,
    sumLedgerAccum,
    '—',
    '—',
  ])

  const wsAsset = XLSX.utils.aoa_to_sheet(assetRows)
  wsAsset['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 34 },
    { wch: 26 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 15 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsAsset, '4. Rincian Aset (Register)')

  // =========================================================================
  // TRIGGER DOWNLOAD
  // =========================================================================
  const cleanUnit = data.businessUnitName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)
  const filename = `TECHSAS_Rekap_Akuntansi_${cleanUnit}_${data.periodMonth}.xlsx`
  XLSX.writeFile(wb, filename)
}
