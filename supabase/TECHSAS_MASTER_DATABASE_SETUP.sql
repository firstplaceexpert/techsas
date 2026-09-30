-- ============================================================
-- TECHSAS — Smart Asset Management System
-- MASTER DATABASE SETUP FOR SUPABASE (100% INDEPENDENT PROJECT)
-- Proyek Terpisah: Tidak berhubungan dengan Ambarrukmo
-- ============================================================

-- 1. Enable Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-running (clean slate)
DROP TABLE IF EXISTS public.work_order_comments CASCADE;
DROP TABLE IF EXISTS public.work_order_parts CASCADE;
DROP TABLE IF EXISTS public.work_orders CASCADE;
DROP TABLE IF EXISTS public.disposal_records CASCADE;
DROP TABLE IF EXISTS public.asset_maintenance CASCADE;
DROP TABLE IF EXISTS public.asset_depreciation_log CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.asset_categories CASCADE;
DROP TABLE IF EXISTS public.business_units CASCADE;

-- ============================================================
-- 2. TABLE DEFINITIONS
-- ============================================================

-- A. Business Units (Multi-Tenant UMKM)
CREATE TABLE public.business_units (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT,
  type        TEXT NOT NULL CHECK (type IN ('rental', 'multimedia', 'gaming', 'cafe', 'event', 'hotel', 'mall', 'property', 'other')),
  logo_url    TEXT,
  address     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B. Locations (Hierarchical per unit)
CREATE TABLE public.locations (
  id               TEXT PRIMARY KEY,
  business_unit_id TEXT REFERENCES public.business_units(id) ON DELETE CASCADE,
  parent_id        TEXT REFERENCES public.locations(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  level            TEXT NOT NULL CHECK (level IN ('site', 'building', 'floor', 'room')),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- C. Asset Categories
CREATE TABLE public.asset_categories (
  id                         TEXT PRIMARY KEY,
  name                       TEXT NOT NULL,
  description                TEXT,
  default_useful_life_months INTEGER NOT NULL DEFAULT 48,
  default_depreciation_method TEXT NOT NULL DEFAULT 'straight_line',
  account_code_asset         TEXT,
  account_code_accum         TEXT,
  account_code_expense       TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- D. Profiles (Users)
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name        TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')),
  business_unit_id TEXT REFERENCES public.business_units(id) ON DELETE SET NULL,
  department       TEXT,
  phone            TEXT,
  avatar_url       TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E. Vendors
CREATE TABLE public.vendors (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  contact_person TEXT,
  phone          TEXT,
  email          TEXT,
  address        TEXT,
  services       TEXT[],
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- F. Assets
CREATE TABLE public.assets (
  id                  TEXT PRIMARY KEY,
  asset_code          TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  description         TEXT,
  category_id         TEXT REFERENCES public.asset_categories(id) ON DELETE SET NULL,
  business_unit_id    TEXT REFERENCES public.business_units(id) ON DELETE CASCADE,
  current_location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL,
  current_pic_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  photo_url           TEXT,
  purchase_date       DATE NOT NULL,
  purchase_price      NUMERIC(15,2) NOT NULL DEFAULT 0,
  useful_life_months  INTEGER NOT NULL DEFAULT 48,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line',
  salvage_value       NUMERIC(15,2) NOT NULL DEFAULT 0,
  current_book_value  NUMERIC(15,2) NOT NULL DEFAULT 0,
  condition           TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'fair', 'damaged', 'under_repair')),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'disposed', 'written_off')),
  qr_code_uuid        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  warranty_until      DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- G. Maintenance
CREATE TABLE public.asset_maintenance (
  id               TEXT PRIMARY KEY,
  asset_id         TEXT REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'inspection', 'calibration')),
  description      TEXT NOT NULL,
  cost             NUMERIC(15,2) DEFAULT 0,
  scheduled_date   DATE NOT NULL,
  completed_date   DATE,
  performed_by     TEXT,
  vendor_id        TEXT REFERENCES public.vendors(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- H. Work Orders
CREATE TABLE public.work_orders (
  id               TEXT PRIMARY KEY,
  wo_number        TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT,
  asset_id         TEXT REFERENCES public.assets(id) ON DELETE CASCADE,
  business_unit_id TEXT REFERENCES public.business_units(id) ON DELETE CASCADE,
  priority         TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date         DATE,
  completed_at     TIMESTAMPTZ,
  total_cost       NUMERIC(15,2) DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- I. Notifications
CREATE TABLE public.notifications (
  id               TEXT PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  message          TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('maintenance', 'work_order', 'disposal', 'audit', 'general')),
  related_asset_id TEXT REFERENCES public.assets(id) ON DELETE SET NULL,
  is_read          BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- J. Audit Logs
CREATE TABLE public.audit_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT,
  user_name   TEXT,
  action      TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  description TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS) - Permissive for quick start
-- ============================================================
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon reads/writes for easy setup
CREATE POLICY "Public Read All" ON public.business_units FOR SELECT USING (true);
CREATE POLICY "Public All" ON public.business_units FOR ALL USING (true);

CREATE POLICY "Public Read Loc" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Public All Loc" ON public.locations FOR ALL USING (true);

CREATE POLICY "Public Read Cat" ON public.asset_categories FOR SELECT USING (true);
CREATE POLICY "Public All Cat" ON public.asset_categories FOR ALL USING (true);

CREATE POLICY "Public Read Prof" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public All Prof" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Public Read Assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Public All Assets" ON public.assets FOR ALL USING (true);

CREATE POLICY "Public Read Maint" ON public.asset_maintenance FOR SELECT USING (true);
CREATE POLICY "Public All Maint" ON public.asset_maintenance FOR ALL USING (true);

CREATE POLICY "Public Read WO" ON public.work_orders FOR SELECT USING (true);
CREATE POLICY "Public All WO" ON public.work_orders FOR ALL USING (true);

CREATE POLICY "Public Read Notif" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Public All Notif" ON public.notifications FOR ALL USING (true);

CREATE POLICY "Public Read Audit" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Public All Audit" ON public.audit_logs FOR ALL USING (true);

CREATE POLICY "Public Read Vendor" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Public All Vendor" ON public.vendors FOR ALL USING (true);

-- ============================================================
-- 4. SEED DATA (5 REAL YOGYAKARTA UMKM UNITS)
-- ============================================================

INSERT INTO public.business_units (id, name, code, type, logo_url, address) VALUES
  ('bu-hotel-00000000-0000-0000-0000-000000000001', 'Melaju Car Rental', 'FLT', 'rental', '/logos/melaju-rental-mobil.png', 'Jl. Laksda Adisucipto No.81, Sleman, Yogyakarta 55281'),
  ('bu-mall-000000000-0000-0000-0000-000000000002', 'BSM Rental Kamera', 'CAM', 'multimedia', '/logos/rental-kamera.png', 'Jl. Laksda Adisucipto No.108, Depok, Sleman, Yogyakarta 55281'),
  ('bu-hotel-00000000-0000-0000-0000-000000000004', 'Sewa PlayStation Jogja', 'GME', 'gaming', '/logos/playstation-jogja.png', 'Jl. Laksda Adisucipto No.82, Sleman, Yogyakarta 55281'),
  ('bu-hotel-00000000-0000-0000-0000-000000000005', 'Couvee Coffee & Roastery', 'CFE', 'cafe', '/logos/unit-property-5.png', 'Jl. Colombo No.7, Caturtunggal, Depok, Sleman, Yogyakarta 55281'),
  ('bu-hotel-00000000-0000-0000-0000-000000000006', 'Gigs Production', 'EVT', 'event', '/logos/gigs-production.png', 'Jl. Malioboro No.52-58, Danurejan, Yogyakarta 55213');

-- Categories
INSERT INTO public.asset_categories (id, name, description, default_useful_life_months, default_depreciation_method, account_code_asset, account_code_accum, account_code_expense) VALUES
  ('cat-001', 'Furniture & Display', 'Meja, kursi gaming, etalase bar', 60, 'straight_line', '1-1310', '1-1320', '6-1300'),
  ('cat-002', 'Elektronik & Multimedia', 'Kamera mirrorless, TV OLED 4K, audio mixer', 48, 'straight_line', '1-1410', '1-1420', '6-1400'),
  ('cat-003', 'Kendaraan & Transportasi', 'Mobil MPV rental, motor matic', 96, 'straight_line', '1-1510', '1-1520', '6-1500'),
  ('cat-004', 'Peralatan F&B Barista', 'Mesin espresso, coffee grinder, chiller bar', 60, 'straight_line', '1-1610', '1-1620', '6-1600'),
  ('cat-005', 'Gaming Hardware & Konsol', 'PS5 Pro 2TB, TV 4K, controller DualSense', 36, 'straight_line', '1-1710', '1-1720', '6-1700'),
  ('cat-006', 'Sound & Event Production', 'Speaker line array JBL, mixer Soundcraft, mic wireless', 60, 'straight_line', '1-1810', '1-1820', '6-1800');

-- Locations
INSERT INTO public.locations (id, business_unit_id, parent_id, name, level) VALUES
  ('loc-flt-01', 'bu-hotel-00000000-0000-0000-0000-000000000001', NULL, 'Garasi Pool Armada Melaju', 'site'),
  ('loc-cam-01', 'bu-mall-000000000-0000-0000-0000-000000000002', NULL, 'Studio & Dry Box BSM', 'site'),
  ('loc-gme-01', 'bu-hotel-00000000-0000-0000-0000-000000000004', NULL, 'VIP Gaming Lounge PS Jogja', 'site'),
  ('loc-cfe-01', 'bu-hotel-00000000-0000-0000-0000-000000000005', NULL, 'Bar Roastery Couvee', 'site'),
  ('loc-evt-01', 'bu-hotel-00000000-0000-0000-0000-000000000006', NULL, 'Warehouse Audio Gigs', 'site');

-- Super Admin Profile
INSERT INTO public.profiles (id, full_name, role, business_unit_id, department, phone, avatar_url) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Andi Prasetya (Super Admin)', 'super_admin', NULL, 'IT & Asset Operations', '0811-2345-001', '/logos/admin-profil.jpeg');

-- Sample Initial Assets
INSERT INTO public.assets (
  id, asset_code, name, description, category_id, business_unit_id,
  current_location_id, purchase_date, purchase_price, useful_life_months,
  depreciation_method, current_book_value, condition, status, qr_code_uuid
) VALUES
  ('ast-01', 'TECHSAS-FLT-VH-2401-0001', 'Toyota Avanza 1.5 G CVT 2024', 'Armada rental mobil keluarga utama', 'cat-003', 'bu-hotel-00000000-0000-0000-0000-000000000001', 'loc-flt-01', '2024-01-15', 275000000, 96, 'straight_line', 246406250, 'good', 'active', '00000001-qr00-0000-0000-000000000001'),
  ('ast-02', 'TECHSAS-CAM-AV-2401-0002', 'Sony A7 IV Kit 28-70mm', 'Kamera mirrorless full frame rental', 'cat-002', 'bu-mall-000000000-0000-0000-0000-000000000002', 'loc-cam-01', '2024-02-10', 38000000, 48, 'straight_line', 31666667, 'good', 'active', '00000001-qr00-0000-0000-000000000002'),
  ('ast-03', 'TECHSAS-GME-IT-2401-0003', 'Sony PlayStation 5 Pro 2TB', 'Konsol gaming rental station 1', 'cat-005', 'bu-hotel-00000000-0000-0000-0000-000000000004', 'loc-gme-01', '2024-03-01', 14500000, 36, 'straight_line', 12493056, 'good', 'active', '00000001-qr00-0000-0000-000000000003'),
  ('ast-04', 'TECHSAS-CFE-EQ-2401-0004', 'La Marzocco Linea Classic 2-Group', 'Mesin espresso komersial bar utama', 'cat-004', 'bu-hotel-00000000-0000-0000-0000-000000000005', 'loc-cfe-01', '2024-01-20', 165000000, 60, 'straight_line', 143000000, 'good', 'active', '00000001-qr00-0000-0000-000000000004'),
  ('ast-05', 'TECHSAS-EVT-AV-2401-0005', 'Speaker Aktif JBL EON715 (Pair)', 'Paket sound system rental event panggung', 'cat-006', 'bu-hotel-00000000-0000-0000-0000-000000000006', 'loc-evt-01', '2024-02-05', 24000000, 60, 'straight_line', 20800000, 'good', 'active', '00000001-qr00-0000-0000-000000000005');
