/**
 * Depreciation Calculation Utility
 * Supports Straight Line and Declining Balance methods
 */

export interface DepreciationCalculation {
  monthlyDepreciation: number
  newBookValue: number
  isFullyDepreciated: boolean
}

/**
 * Calculate Straight Line Monthly Depreciation
 * Formula: (Purchase Price - Residual Value) / Useful Life Months
 */
export function calculateStraightLine(
  purchasePrice: number,
  usefulLifeMonths: number,
  currentBookValue: number,
  residualValue = 0
): DepreciationCalculation {
  if (usefulLifeMonths <= 0 || purchasePrice <= 0) {
    return {
      monthlyDepreciation: 0,
      newBookValue: currentBookValue,
      isFullyDepreciated: true,
    }
  }

  const baseDepreciable = Math.max(0, purchasePrice - residualValue)
  const monthlyRate = baseDepreciable / usefulLifeMonths

  const remainingDepreciable = Math.max(0, currentBookValue - residualValue)
  const actualDepreciation = Math.min(monthlyRate, remainingDepreciable)
  const newBookValue = Math.max(residualValue, currentBookValue - actualDepreciation)

  return {
    monthlyDepreciation: Math.round(actualDepreciation),
    newBookValue: Math.round(newBookValue),
    isFullyDepreciated: newBookValue <= residualValue,
  }
}

/**
 * Calculate Declining Balance Monthly Depreciation
 * Formula: Book Value * (Annual Rate / 12)
 */
export function calculateDecliningBalance(
  purchasePrice: number,
  usefulLifeMonths: number,
  currentBookValue: number,
  residualValue = 0
): DepreciationCalculation {
  if (usefulLifeMonths <= 0 || purchasePrice <= 0 || currentBookValue <= residualValue) {
    return {
      monthlyDepreciation: 0,
      newBookValue: currentBookValue,
      isFullyDepreciated: true,
    }
  }

  const usefulLifeYears = usefulLifeMonths / 12
  // Double declining balance rate: 2 / years
  const annualRate = Math.min(1, 2 / usefulLifeYears)
  const monthlyRate = annualRate / 12

  const calcDepreciation = currentBookValue * monthlyRate
  const remainingDepreciable = Math.max(0, currentBookValue - residualValue)
  const actualDepreciation = Math.min(calcDepreciation, remainingDepreciable)
  const newBookValue = Math.max(residualValue, currentBookValue - actualDepreciation)

  return {
    monthlyDepreciation: Math.round(actualDepreciation),
    newBookValue: Math.round(newBookValue),
    isFullyDepreciated: newBookValue <= residualValue,
  }
}

/**
 * Compute monthly depreciation for any asset
 */
export function calculateAssetMonthlyDepreciation(
  purchasePrice: number | null,
  usefulLifeMonths: number | null,
  currentBookValue: number | null,
  method: 'straight_line' | 'declining_balance' = 'straight_line',
  residualValue = 0
): DepreciationCalculation {
  const price = purchasePrice || 0
  const life = usefulLifeMonths || 60
  const bookVal = currentBookValue !== null ? currentBookValue : price

  if (method === 'declining_balance') {
    return calculateDecliningBalance(price, life, bookVal, residualValue)
  }
  return calculateStraightLine(price, life, bookVal, residualValue)
}
