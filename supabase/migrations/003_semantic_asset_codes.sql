-- ============================================================
-- TECHSAS - TECHSAS Asset Management System
-- Migration 003: Semantic Asset Code Generator (Ala KTP Capslock)
-- Format: [UNIT]-[KAT]-[YYMM]-[LOK]-[URUT]
-- Contoh: RAY-EL-2409-GFL-0001
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_semantic_asset_code()
RETURNS TRIGGER AS $$
DECLARE
  bu_code      TEXT := 'AMB';
  cat_code     TEXT := 'GN';
  date_code    TEXT := '';
  loc_code     TEXT := 'GFL';
  seq_val      BIGINT;
  seq_code     TEXT := '0001';
  bu_name      TEXT;
  cat_name     TEXT;
  loc_name     TEXT;
  p_date       DATE;
BEGIN
  -- Hanya generate jika asset_code belum diisi manual
  IF NEW.asset_code IS NULL OR NEW.asset_code = '' OR NEW.asset_code LIKE 'AMB-%' THEN
    
    -- 1. Deteksi Unit Bisnis Code
    IF NEW.business_unit_id IS NOT NULL THEN
      SELECT name INTO bu_name FROM public.business_units WHERE id = NEW.business_unit_id;
      IF bu_name ILIKE '%royal%' THEN
        bu_code := 'RAY';
      ELSIF bu_name ILIKE '%mall%' OR bu_name ILIKE '%plaza%' THEN
        bu_code := 'PAM';
      ELSIF bu_name ILIKE '%property%' OR bu_name ILIKE '%corporate%' THEN
        bu_code := 'APC';
      ELSIF bu_name ILIKE '%porta%' THEN
        bu_code := 'PTA';
      ELSIF bu_name ILIKE '%grand%' THEN
        bu_code := 'GAM';
      ELSE
        bu_code := UPPER(SUBSTRING(REGEXP_REPLACE(bu_name, '[^a-zA-Z]', '', 'g') FROM 1 FOR 3));
        IF LENGTH(bu_code) < 3 THEN bu_code := RPAD(bu_code, 3, 'X'); END IF;
      END IF;
    END IF;

    -- 2. Deteksi Kategori Code
    IF NEW.category_id IS NOT NULL THEN
      SELECT name INTO cat_name FROM public.asset_categories WHERE id = NEW.category_id;
      IF cat_name ILIKE '%furniture%' THEN
        cat_code := 'FN';
      ELSIF cat_name ILIKE '%elektronik%' OR cat_name ILIKE '%av%' THEN
        cat_code := 'EL';
      ELSIF cat_name ILIKE '%it%' OR cat_name ILIKE '%komputer%' THEN
        cat_code := 'IT';
      ELSIF cat_name ILIKE '%hvac%' OR cat_name ILIKE '%pendingin%' THEN
        cat_code := 'HV';
      ELSIF cat_name ILIKE '%housekeeping%' OR cat_name ILIKE '%laundry%' THEN
        cat_code := 'HK';
      ELSIF cat_name ILIKE '%dapur%' OR cat_name ILIKE '%f&b%' THEN
        cat_code := 'FB';
      ELSIF cat_name ILIKE '%kendaraan%' THEN
        cat_code := 'VH';
      ELSIF cat_name ILIKE '%keamanan%' OR cat_name ILIKE '%cctv%' THEN
        cat_code := 'SC';
      ELSIF cat_name ILIKE '%fitness%' THEN
        cat_code := 'FT';
      ELSIF cat_name ILIKE '%signage%' THEN
        cat_code := 'SG';
      ELSE
        cat_code := UPPER(SUBSTRING(REGEXP_REPLACE(cat_name, '[^a-zA-Z]', '', 'g') FROM 1 FOR 2));
        IF LENGTH(cat_code) < 2 THEN cat_code := RPAD(cat_code, 2, 'G'); END IF;
      END IF;
    END IF;

    -- 3. Deteksi Tanggal Perolehan Code (YYMM)
    p_date := COALESCE(NEW.purchase_date, CURRENT_DATE);
    date_code := TO_CHAR(p_date, 'YYMM');

    -- 4. Deteksi Lokasi / Lantai Code
    IF NEW.current_location_id IS NOT NULL THEN
      SELECT name INTO loc_name FROM public.locations WHERE id = NEW.current_location_id;
      IF loc_name ILIKE '%lobby%' OR loc_name ILIKE '%ground%' THEN
        loc_code := 'GFL';
      ELSIF loc_name ILIKE '%upper ground%' THEN
        loc_code := 'UGF';
      ELSIF loc_name ILIKE '%lantai 1%' OR loc_name ILIKE '%lt 1%' OR loc_name ILIKE '%lt. 1%' THEN
        loc_code := 'L01';
      ELSIF loc_name ILIKE '%lantai 2%' OR loc_name ILIKE '%lt 2%' OR loc_name ILIKE '%lt. 2%' THEN
        loc_code := 'L02';
      ELSIF loc_name ILIKE '%lantai 3%' OR loc_name ILIKE '%lt 3%' OR loc_name ILIKE '%lt. 3%' THEN
        loc_code := 'L03';
      ELSIF loc_name ILIKE '%basement 1%' OR loc_name ILIKE '%b1%' THEN
        loc_code := 'BS1';
      ELSIF loc_name ILIKE '%basement 2%' OR loc_name ILIKE '%b2%' THEN
        loc_code := 'BS2';
      ELSIF loc_name ILIKE '%basement%' THEN
        loc_code := 'BSM';
      ELSIF loc_name ILIKE '%convention%' OR loc_name ILIKE '%ballroom%' THEN
        loc_code := 'CNV';
      ELSIF loc_name ILIKE '%tower a%' THEN
        loc_code := 'TWA';
      ELSIF loc_name ILIKE '%outdoor%' OR loc_name ILIKE '%parkir%' THEN
        loc_code := 'OUT';
      ELSE
        loc_code := UPPER(SUBSTRING(REGEXP_REPLACE(loc_name, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 3));
        IF LENGTH(loc_code) < 3 THEN loc_code := RPAD(loc_code, 3, 'L'); END IF;
      END IF;
    END IF;

    -- 5. Sequence Number
    seq_val := nextval('asset_code_seq');
    seq_code := LPAD((seq_val % 10000)::TEXT, 4, '0');

    -- Gabungkan Format Capslock ala KTP
    NEW.asset_code := bu_code || '-' || cat_code || '-' || date_code || '-' || loc_code || '-' || seq_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger lama jika ada dan buat trigger baru
DROP TRIGGER IF EXISTS trg_assets_generate_code ON public.assets;

CREATE TRIGGER trg_assets_generate_code
  BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.generate_semantic_asset_code();
