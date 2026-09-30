-- ============================================================
-- Migration 004: Support Chart of Accounts (CoA) in categories and assets
-- ============================================================

-- 1. Add CoA columns to asset_categories
ALTER TABLE public.asset_categories
  ADD COLUMN IF NOT EXISTS account_code_asset VARCHAR(50),
  ADD COLUMN IF NOT EXISTS account_code_accum VARCHAR(50),
  ADD COLUMN IF NOT EXISTS account_code_expense VARCHAR(50);

-- 2. Add CoA columns to assets (for asset-level manual overrides per company policy)
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS account_code_asset VARCHAR(50),
  ADD COLUMN IF NOT EXISTS account_code_accum VARCHAR(50),
  ADD COLUMN IF NOT EXISTS account_code_expense VARCHAR(50);

-- 3. Backfill default standard CoA for existing categories
UPDATE public.asset_categories
SET
  account_code_asset = '1-1201',
  account_code_accum = '1-1202',
  account_code_expense = '5-2101'
WHERE LOWER(name) LIKE '%elektronik%' OR LOWER(name) LIKE '%komputer%' OR LOWER(name) LIKE '%it%' OR LOWER(name) LIKE '%cctv%';

UPDATE public.asset_categories
SET
  account_code_asset = '1-1203',
  account_code_accum = '1-1204',
  account_code_expense = '5-2102'
WHERE LOWER(name) LIKE '%mesin%' OR LOWER(name) LIKE '%hvac%' OR LOWER(name) LIKE '%dapur%' OR LOWER(name) LIKE '%fitness%';

UPDATE public.asset_categories
SET
  account_code_asset = '1-1205',
  account_code_accum = '1-1206',
  account_code_expense = '5-2103'
WHERE LOWER(name) LIKE '%furnitur%' OR LOWER(name) LIKE '%housekeeping%' OR LOWER(name) LIKE '%signage%';

UPDATE public.asset_categories
SET
  account_code_asset = '1-1207',
  account_code_accum = '1-1208',
  account_code_expense = '5-2104'
WHERE LOWER(name) LIKE '%kendaraan%';

UPDATE public.asset_categories
SET
  account_code_asset = '1-1209',
  account_code_accum = '1-1210',
  account_code_expense = '5-2105'
WHERE LOWER(name) LIKE '%gedung%' OR LOWER(name) LIKE '%bangunan%';

-- Fallback for any other categories
UPDATE public.asset_categories
SET
  account_code_asset = COALESCE(account_code_asset, '1-1299'),
  account_code_accum = COALESCE(account_code_accum, '1-1298'),
  account_code_expense = COALESCE(account_code_expense, '5-2199')
WHERE account_code_asset IS NULL;

-- 4. Backfill assets with their category default CoA
UPDATE public.assets a
SET
  account_code_asset = c.account_code_asset,
  account_code_accum = c.account_code_accum,
  account_code_expense = c.account_code_expense
FROM public.asset_categories c
WHERE a.category_id = c.id AND a.account_code_asset IS NULL;
