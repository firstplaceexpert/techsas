-- ============================================================
-- TECHSAS - TECHSAS Asset Management System
-- Migration 001: Full Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS (via CHECK constraints on columns)
-- ============================================================

-- ============================================================
-- 1. BUSINESS UNITS
-- ============================================================
CREATE TABLE public.business_units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('hotel', 'mall', 'property', 'other')),
  address     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_units_type ON public.business_units(type);
CREATE INDEX idx_business_units_is_active ON public.business_units(is_active);

-- ============================================================
-- 2. LOCATIONS (hierarchical: site > building > floor > room/zone)
-- ============================================================
CREATE TABLE public.locations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE RESTRICT,
  parent_id        UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL,
  level            TEXT NOT NULL CHECK (level IN ('site', 'building', 'floor', 'room', 'zone')),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_locations_business_unit_id ON public.locations(business_unit_id);
CREATE INDEX idx_locations_parent_id ON public.locations(parent_id);
CREATE INDEX idx_locations_level ON public.locations(level);

-- ============================================================
-- 3. ASSET CATEGORIES
-- ============================================================
CREATE TABLE public.asset_categories (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                       TEXT NOT NULL,
  default_useful_life_months INTEGER NOT NULL DEFAULT 60,
  default_depreciation_method TEXT NOT NULL DEFAULT 'straight_line'
    CHECK (default_depreciation_method IN ('straight_line', 'declining_balance')),
  is_active                  BOOLEAN NOT NULL DEFAULT true,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_categories_name ON public.asset_categories(name);

-- ============================================================
-- 4. USER PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL DEFAULT '',
  role             TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer', 'viewer')),
  business_unit_id UUID REFERENCES public.business_units(id) ON DELETE SET NULL,
  department       TEXT,
  phone            TEXT,
  avatar_url       TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_business_unit_id ON public.profiles(business_unit_id);

-- ============================================================
-- 5. ASSETS
-- ============================================================

-- Sequence for asset code numbering
CREATE SEQUENCE IF NOT EXISTS asset_code_seq START 1;

CREATE TABLE public.assets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code            TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  description           TEXT,
  category_id           UUID NOT NULL REFERENCES public.asset_categories(id) ON DELETE RESTRICT,
  business_unit_id      UUID NOT NULL REFERENCES public.business_units(id) ON DELETE RESTRICT,
  current_location_id   UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  current_pic_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  photo_url             TEXT,
  purchase_date         DATE,
  purchase_price        NUMERIC(15, 2),
  useful_life_months    INTEGER,
  depreciation_method   TEXT CHECK (depreciation_method IN ('straight_line', 'declining_balance')),
  current_book_value    NUMERIC(15, 2),
  condition             TEXT NOT NULL DEFAULT 'good'
    CHECK (condition IN ('good', 'fair', 'damaged', 'under_repair')),
  status                TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'disposed')),
  qr_code_uuid          UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  warranty_until        DATE,
  legal_document_url    TEXT,
  created_by            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_asset_code ON public.assets(asset_code);
CREATE INDEX idx_assets_business_unit_id ON public.assets(business_unit_id);
CREATE INDEX idx_assets_current_location_id ON public.assets(current_location_id);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_condition ON public.assets(condition);
CREATE INDEX idx_assets_category_id ON public.assets(category_id);
CREATE INDEX idx_assets_created_at ON public.assets(created_at DESC);

-- ============================================================
-- 6. ASSET LOCATION HISTORY
-- ============================================================
CREATE TABLE public.asset_location_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  moved_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moved_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  note        TEXT
);

CREATE INDEX idx_asset_location_history_asset_id ON public.asset_location_history(asset_id);
CREATE INDEX idx_asset_location_history_moved_at ON public.asset_location_history(moved_at DESC);

-- ============================================================
-- 7. ASSET MAINTENANCE
-- ============================================================
CREATE TABLE public.asset_maintenance (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id           UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_type   TEXT NOT NULL
    CHECK (maintenance_type IN ('preventive', 'corrective', 'predictive')),
  scheduled_date     DATE,
  completed_date     DATE,
  cost               NUMERIC(15, 2),
  technician_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes              TEXT,
  next_schedule_date DATE,
  status             TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_maintenance_asset_id ON public.asset_maintenance(asset_id);
CREATE INDEX idx_asset_maintenance_status ON public.asset_maintenance(status);
CREATE INDEX idx_asset_maintenance_scheduled_date ON public.asset_maintenance(scheduled_date);

-- ============================================================
-- 8. ASSET DEPRECIATION LOG
-- ============================================================
CREATE TABLE public.asset_depreciation_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id            UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  period_month        DATE NOT NULL, -- First day of the month (e.g. 2024-01-01)
  book_value          NUMERIC(15, 2) NOT NULL,
  depreciation_amount NUMERIC(15, 2) NOT NULL,
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_depreciation_log_asset_id ON public.asset_depreciation_log(asset_id);
CREATE INDEX idx_asset_depreciation_log_period ON public.asset_depreciation_log(period_month DESC);

-- ============================================================
-- 9. OPNAME SESSIONS
-- ============================================================
CREATE TABLE public.opname_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE RESTRICT,
  location_id      UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  conducted_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_opname_sessions_business_unit_id ON public.opname_sessions(business_unit_id);
CREATE INDEX idx_opname_sessions_status ON public.opname_sessions(status);

-- ============================================================
-- 10. OPNAME SCANS
-- ============================================================
CREATE TABLE public.opname_scans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.opname_sessions(id) ON DELETE CASCADE,
  asset_id    UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  scanned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  matched     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_opname_scans_session_id ON public.opname_scans(session_id);
CREATE INDEX idx_opname_scans_asset_id ON public.opname_scans(asset_id);

-- ============================================================
-- 11. AUCTION LOTS
-- ============================================================
CREATE TABLE public.auction_lots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_number     TEXT NOT NULL UNIQUE,
  auction_date   DATE,
  auctioneer_name TEXT,
  total_assets   INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. DISPOSAL RECORDS
-- ============================================================
CREATE TABLE public.disposal_records (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id               UUID NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  disposal_type          TEXT NOT NULL
    CHECK (disposal_type IN ('sale', 'auction', 'donation', 'transfer', 'writeoff')),
  requested_by           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approval_status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  sale_price             NUMERIC(15, 2),
  buyer_or_recipient     TEXT,
  auction_lot_id         UUID REFERENCES public.auction_lots(id) ON DELETE SET NULL,
  target_business_unit_id UUID REFERENCES public.business_units(id) ON DELETE SET NULL,
  notes                  TEXT,
  gain_loss_amount       NUMERIC(15, 2),
  disposed_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disposal_records_asset_id ON public.disposal_records(asset_id);
CREATE INDEX idx_disposal_records_approval_status ON public.disposal_records(approval_status);

-- ============================================================
-- 13. APPROVAL WORKFLOWS
-- ============================================================
CREATE TABLE public.approval_workflows (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type         TEXT NOT NULL
    CHECK (action_type IN (
      'disposal_sale', 'disposal_auction', 'disposal_donation',
      'disposal_transfer', 'disposal_writeoff', 'high_value_purchase'
    )),
  min_value_threshold NUMERIC(15, 2),
  required_role       TEXT NOT NULL
    CHECK (required_role IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer', 'viewer')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type             TEXT NOT NULL,
  title            TEXT NOT NULL,
  message          TEXT NOT NULL,
  is_read          BOOLEAN NOT NULL DEFAULT false,
  related_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_business_units_updated_at
  BEFORE UPDATE ON public.business_units
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_asset_categories_updated_at
  BEFORE UPDATE ON public.asset_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_asset_maintenance_updated_at
  BEFORE UPDATE ON public.asset_maintenance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_auction_lots_updated_at
  BEFORE UPDATE ON public.auction_lots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TRIGGER: Auto-generate asset_code on INSERT
-- Format: AMB-XXXXX (5 digit padded)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_asset_code()
RETURNS TRIGGER AS $$
DECLARE
  seq_val BIGINT;
  code    TEXT;
BEGIN
  IF NEW.asset_code IS NULL OR NEW.asset_code = '' THEN
    seq_val := nextval('asset_code_seq');
    code := 'AMB-' || LPAD(seq_val::TEXT, 5, '0');
    NEW.asset_code := code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assets_generate_code
  BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.generate_asset_code();

-- ============================================================
-- TRIGGER: Auto-create profile when user signs up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ============================================================
-- TECHSAS - TECHSAS Asset Management System
-- Migration 002: Row Level Security (RLS)
-- ============================================================

-- ============================================================
-- HELPER FUNCTION: get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- HELPER FUNCTION: get current user's business_unit_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_user_business_unit()
RETURNS UUID AS $$
  SELECT business_unit_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- HELPER FUNCTION: is corporate-level user?
-- (super_admin and corporate_admin can see all business units)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_corporate_user()
RETURNS BOOLEAN AS $$
  SELECT role IN ('super_admin', 'corporate_admin')
  FROM public.profiles
  WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.business_units        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_depreciation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opname_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opname_scans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_lots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposal_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BUSINESS UNITS
-- ============================================================
-- Corporate users see all; unit-scoped users only see their own
CREATE POLICY "business_units_select" ON public.business_units
  FOR SELECT USING (
    public.is_corporate_user()
    OR id = public.get_current_user_business_unit()
  );

CREATE POLICY "business_units_insert" ON public.business_units
  FOR INSERT WITH CHECK (public.is_corporate_user());

CREATE POLICY "business_units_update" ON public.business_units
  FOR UPDATE USING (public.is_corporate_user());

CREATE POLICY "business_units_delete" ON public.business_units
  FOR DELETE USING (
    public.get_current_user_role() = 'super_admin'
  );

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE POLICY "locations_select" ON public.locations
  FOR SELECT USING (
    public.is_corporate_user()
    OR business_unit_id = public.get_current_user_business_unit()
  );

CREATE POLICY "locations_insert" ON public.locations
  FOR INSERT WITH CHECK (
    public.is_corporate_user()
    OR (
      public.get_current_user_role() IN ('unit_admin')
      AND business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "locations_update" ON public.locations
  FOR UPDATE USING (
    public.is_corporate_user()
    OR (
      public.get_current_user_role() = 'unit_admin'
      AND business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "locations_delete" ON public.locations
  FOR DELETE USING (
    public.is_corporate_user()
    OR (
      public.get_current_user_role() = 'unit_admin'
      AND business_unit_id = public.get_current_user_business_unit()
    )
  );

-- ============================================================
-- ASSET CATEGORIES (global data, everyone can read)
-- ============================================================
CREATE POLICY "asset_categories_select" ON public.asset_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "asset_categories_insert" ON public.asset_categories
  FOR INSERT WITH CHECK (public.is_corporate_user());

CREATE POLICY "asset_categories_update" ON public.asset_categories
  FOR UPDATE USING (public.is_corporate_user());

CREATE POLICY "asset_categories_delete" ON public.asset_categories
  FOR DELETE USING (
    public.get_current_user_role() = 'super_admin'
  );

-- ============================================================
-- PROFILES
-- ============================================================
-- Users can always read their own profile
-- Corporate users can see all profiles
-- Unit admins can see profiles in their unit
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.is_corporate_user()
    OR (
      public.get_current_user_role() = 'unit_admin'
      AND business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid() OR public.is_corporate_user());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR public.is_corporate_user()
  );

CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (
    public.get_current_user_role() = 'super_admin'
  );

-- ============================================================
-- ASSETS
-- ============================================================
CREATE POLICY "assets_select" ON public.assets
  FOR SELECT USING (
    public.is_corporate_user()
    OR business_unit_id = public.get_current_user_business_unit()
  );

CREATE POLICY "assets_insert" ON public.assets
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
    AND (
      public.is_corporate_user()
      OR business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "assets_update" ON public.assets
  FOR UPDATE USING (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
    AND (
      public.is_corporate_user()
      OR business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "assets_delete" ON public.assets
  FOR DELETE USING (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin')
    AND (
      public.is_corporate_user()
      OR business_unit_id = public.get_current_user_business_unit()
    )
  );

-- ============================================================
-- ASSET LOCATION HISTORY
-- ============================================================
CREATE POLICY "asset_location_history_select" ON public.asset_location_history
  FOR SELECT USING (
    public.is_corporate_user()
    OR EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_id
        AND (a.business_unit_id = public.get_current_user_business_unit() OR public.is_corporate_user())
    )
  );

CREATE POLICY "asset_location_history_insert" ON public.asset_location_history
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
  );

-- ============================================================
-- ASSET MAINTENANCE
-- ============================================================
CREATE POLICY "asset_maintenance_select" ON public.asset_maintenance
  FOR SELECT USING (
    public.is_corporate_user()
    OR EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_id
        AND a.business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "asset_maintenance_insert" ON public.asset_maintenance
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
  );

CREATE POLICY "asset_maintenance_update" ON public.asset_maintenance
  FOR UPDATE USING (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
  );

-- ============================================================
-- ASSET DEPRECIATION LOG (read-only for non-admins)
-- ============================================================
CREATE POLICY "asset_depreciation_log_select" ON public.asset_depreciation_log
  FOR SELECT USING (
    public.is_corporate_user()
    OR EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_id
        AND a.business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "asset_depreciation_log_insert" ON public.asset_depreciation_log
  FOR INSERT WITH CHECK (public.is_corporate_user());

-- ============================================================
-- OPNAME SESSIONS
-- ============================================================
CREATE POLICY "opname_sessions_select" ON public.opname_sessions
  FOR SELECT USING (
    public.is_corporate_user()
    OR business_unit_id = public.get_current_user_business_unit()
  );

CREATE POLICY "opname_sessions_insert" ON public.opname_sessions
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
    AND (
      public.is_corporate_user()
      OR business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "opname_sessions_update" ON public.opname_sessions
  FOR UPDATE USING (
    public.is_corporate_user()
    OR (
      public.get_current_user_role() IN ('unit_admin', 'field_officer')
      AND business_unit_id = public.get_current_user_business_unit()
    )
  );

-- ============================================================
-- OPNAME SCANS
-- ============================================================
CREATE POLICY "opname_scans_select" ON public.opname_scans
  FOR SELECT USING (
    public.is_corporate_user()
    OR EXISTS (
      SELECT 1 FROM public.opname_sessions os
      WHERE os.id = session_id
        AND (os.business_unit_id = public.get_current_user_business_unit() OR public.is_corporate_user())
    )
  );

CREATE POLICY "opname_scans_insert" ON public.opname_scans
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
  );

-- ============================================================
-- DISPOSAL RECORDS
-- ============================================================
CREATE POLICY "disposal_records_select" ON public.disposal_records
  FOR SELECT USING (
    public.is_corporate_user()
    OR EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_id
        AND a.business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "disposal_records_insert" ON public.disposal_records
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
  );

CREATE POLICY "disposal_records_update" ON public.disposal_records
  FOR UPDATE USING (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin')
  );

-- ============================================================
-- AUCTION LOTS (corporate only)
-- ============================================================
CREATE POLICY "auction_lots_select" ON public.auction_lots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auction_lots_insert" ON public.auction_lots
  FOR INSERT WITH CHECK (public.is_corporate_user());

CREATE POLICY "auction_lots_update" ON public.auction_lots
  FOR UPDATE USING (public.is_corporate_user());

-- ============================================================
-- APPROVAL WORKFLOWS (corporate only)
-- ============================================================
CREATE POLICY "approval_workflows_select" ON public.approval_workflows
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "approval_workflows_insert" ON public.approval_workflows
  FOR INSERT WITH CHECK (public.is_corporate_user());

CREATE POLICY "approval_workflows_update" ON public.approval_workflows
  FOR UPDATE USING (public.is_corporate_user());

-- ============================================================
-- NOTIFICATIONS (own only)
-- ============================================================
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (public.is_corporate_user() OR user_id = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());
-- ============================================================
-- TECHSAS - TECHSAS Asset Management System
-- Seed Data
-- ============================================================
-- NOTE: Run this AFTER creating your first super_admin user
-- in Supabase Auth dashboard, then update the UUID below.
-- ============================================================

-- ============================================================
-- 1. BUSINESS UNITS
-- ============================================================
INSERT INTO public.business_units (id, name, type, address) VALUES
  ('f919b000-a99a-4aa0-af24-dc775bcfa463', 'Workshop Produksi Utama', 'hotel', 'Jl. Laksda Adisucipto No.81, TECHSAS, Sleman, Yogyakarta 55281'),
  ('ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', 'Outlet Sentra Distribusi', 'mall', 'Jl. Laksda Adisucipto No.108, Depok, Sleman, Yogyakarta 55281'),
  ('5c023150-b144-4a52-a61a-e4e55cdc4ea9', 'TECHSAS Kantor Pusat & Corporate', 'property', 'Jl. Laksda Adisucipto No.108, Yogyakarta 55281');

-- ============================================================
-- 2. LOCATIONS (Hotel)
-- ============================================================
INSERT INTO public.locations (id, business_unit_id, parent_id, name, level) VALUES
  -- Site level
  ('91d7734f-712d-4e9f-a69e-3f0e6d6567d5', 'f919b000-a99a-4aa0-af24-dc775bcfa463', NULL, 'Workshop Produksi Utama – Site', 'site'),
  -- Building level
  ('d194da6c-7f92-4f81-a2eb-f8acfc297393', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '91d7734f-712d-4e9f-a69e-3f0e6d6567d5', 'Gedung Utama', 'building'),
  ('4ad20288-1347-4bd8-adc8-18b48ffd1847', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '91d7734f-712d-4e9f-a69e-3f0e6d6567d5', 'Gedung Convention', 'building'),
  -- Floor level
  ('0ca9dee3-81e1-4400-acef-2dad43613ab9', 'f919b000-a99a-4aa0-af24-dc775bcfa463', 'd194da6c-7f92-4f81-a2eb-f8acfc297393', 'Lantai Lobby (G)', 'floor'),
  ('f0fc792e-eae7-4d55-aee2-ef4247abb2f6', 'f919b000-a99a-4aa0-af24-dc775bcfa463', 'd194da6c-7f92-4f81-a2eb-f8acfc297393', 'Lantai 1', 'floor'),
  ('cf84b449-643c-429c-a44e-ab1e367283bb', 'f919b000-a99a-4aa0-af24-dc775bcfa463', 'd194da6c-7f92-4f81-a2eb-f8acfc297393', 'Lantai 2', 'floor'),
  -- Room/Zone level
  ('47ff028b-6c80-4c1c-a8d2-e3edf1302eb9', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '0ca9dee3-81e1-4400-acef-2dad43613ab9', 'Front Office & Resepsionis', 'room'),
  ('fbed57ac-7003-448f-a5ca-ecf82566f5fc', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '0ca9dee3-81e1-4400-acef-2dad43613ab9', 'Restoran Candi Bentar', 'room'),
  ('b810b5ab-fb3b-4e41-ac46-59f478d07596', 'f919b000-a99a-4aa0-af24-dc775bcfa463', 'f0fc792e-eae7-4d55-aee2-ef4247abb2f6', 'Ruang Kamar 101–120', 'zone'),
  ('7791892c-d2d2-4cad-a735-25bdbcace8f7', 'f919b000-a99a-4aa0-af24-dc775bcfa463', 'cf84b449-643c-429c-a44e-ab1e367283bb', 'Fitness Center & Spa', 'room');

-- ============================================================
-- 2. LOCATIONS (Mall)
-- ============================================================
INSERT INTO public.locations (id, business_unit_id, parent_id, name, level) VALUES
  ('6ef241cc-b64d-4fa1-aa30-0b31efa77cd7', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', NULL, 'Outlet Pusat – Site', 'site'),
  ('e5d505eb-3f4f-495f-ab13-5366e3fd8a54', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', '6ef241cc-b64d-4fa1-aa30-0b31efa77cd7', 'Gedung Mall Utama', 'building'),
  ('2186e642-e0fe-4f03-aaa1-3207a3ea0cd1', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', 'e5d505eb-3f4f-495f-ab13-5366e3fd8a54', 'Ground Floor (GF)', 'floor'),
  ('11e1f81d-c4f3-4f36-a42c-60c8c840be8b', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', 'e5d505eb-3f4f-495f-ab13-5366e3fd8a54', 'Upper Ground (UG)', 'floor'),
  ('e0fc0f80-f6e4-4702-a7d3-ba55012d6871', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', 'e5d505eb-3f4f-495f-ab13-5366e3fd8a54', 'Lantai 1', 'floor'),
  ('091f6e50-3253-40d5-a853-f529f9c2870e', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', '2186e642-e0fe-4f03-aaa1-3207a3ea0cd1', 'Area Foodcourt', 'zone'),
  ('4e59e386-6949-409b-acd7-f323c5f4cb90', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', '2186e642-e0fe-4f03-aaa1-3207a3ea0cd1', 'Customer Service & Manajemen', 'room'),
  ('e5824ff5-63cd-45b9-ae60-6e1e6fcb1e51', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', 'e0fc0f80-f6e4-4702-a7d3-ba55012d6871', 'Area Hiburan & Bioskop', 'zone');

-- ============================================================
-- 2. LOCATIONS (Property)
-- ============================================================
INSERT INTO public.locations (id, business_unit_id, parent_id, name, level) VALUES
  ('60332284-3ebf-4740-a955-b39ef7973359', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', NULL, 'TECHSAS Kantor Pusat – Site', 'site'),
  ('fbcae618-aff9-494f-a8ee-4e63f3721a4b', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', '60332284-3ebf-4740-a955-b39ef7973359', 'Tower A – Kondotel', 'building'),
  ('cd1115dc-db0c-4751-ab01-8bf3ae149c7c', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', '60332284-3ebf-4740-a955-b39ef7973359', 'Kantor Pengelola & Marketing', 'building'),
  ('899da459-3b40-449e-a7da-4eb699038f9c', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', 'fbcae618-aff9-494f-a8ee-4e63f3721a4b', 'Lobby & Amenities (G)', 'floor'),
  ('e7629ad9-d6d7-4b3a-a174-1a68d10dadf3', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', 'fbcae618-aff9-494f-a8ee-4e63f3721a4b', 'Lantai 3–10 Unit Kondotel', 'floor'),
  ('ffa91466-f991-4bef-a052-d174aa536c84', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', 'e7629ad9-d6d7-4b3a-a174-1a68d10dadf3', 'Unit 301–310', 'zone');

-- ============================================================
-- 3. ASSET CATEGORIES
-- ============================================================
INSERT INTO public.asset_categories (id, name, default_useful_life_months, default_depreciation_method) VALUES
  ('c4db2379-2a93-4e7e-a2f2-9e9820ba7b72', 'Furniture & Fixture', 120, 'straight_line'),
  ('366eca51-4b45-46fd-a999-61005cf0c131', 'Elektronik & AV', 60, 'declining_balance'),
  ('a9a95fab-2ba4-4bc9-abb8-b6f8429ca887', 'Kendaraan Operasional', 60, 'straight_line'),
  ('562cea71-aad0-4d59-a480-ed767bd755b6', 'Peralatan Dapur & F&B', 84, 'straight_line'),
  ('e2c482b9-ee22-4bc1-a9dd-ba37c6bf8b13', 'IT Equipment & Komputer', 48, 'declining_balance'),
  ('39c64f59-da84-420d-aaad-cddd630b6318', 'Mesin & Peralatan HVAC', 120, 'straight_line'),
  ('c76af0eb-40de-4a38-ae04-25262e192634', 'Peralatan Housekeeping', 60, 'straight_line'),
  ('9ffe43b6-d752-450c-a8dd-1f40be501420', 'Peralatan Keamanan & CCTV', 60, 'declining_balance'),
  ('798665c4-ec99-491d-a55a-458f3f2cdbbd', 'Peralatan Fitness & Olahraga', 84, 'straight_line'),
  ('000e4f78-3716-41b3-a68b-63c03797fd8b', 'Signage & Display Retail', 48, 'straight_line');

-- ============================================================
-- 4. DUMMY ASSETS (25 assets)
-- ============================================================
-- NOTE: asset_code will be auto-generated by trigger, we set it empty
-- We explicitly set qr_code_uuid for predictable seed data

-- Hotel Assets (10)
INSERT INTO public.assets (id, name, description, category_id, business_unit_id, current_location_id, purchase_date, purchase_price, useful_life_months, depreciation_method, current_book_value, condition, status, qr_code_uuid) VALUES
  (gen_random_uuid(), 'Sofa Lounge Lobby Premium', 'Sofa 3-seater kulit sintetis warna coklat tua, merk Ligna', 'c4db2379-2a93-4e7e-a2f2-9e9820ba7b72', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '47ff028b-6c80-4c1c-a8d2-e3edf1302eb9', '2022-03-15', 18500000, 120, 'straight_line', 15391667, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'TV LED 65" Samsung Smart TV', 'Samsung QA65Q80C, terpasang di ruang tunggu lobby', '366eca51-4b45-46fd-a999-61005cf0c131', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '47ff028b-6c80-4c1c-a8d2-e3edf1302eb9', '2022-06-01', 12000000, 60, 'declining_balance', 7680000, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Mesin Cuci Industri Electrolux WE165P', 'Kapasitas 16kg, laundry operasional hotel', '39c64f59-da84-420d-aaad-cddd630b6318', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '0ca9dee3-81e1-4400-acef-2dad43613ab9', '2021-08-20', 85000000, 120, 'straight_line', 72291667, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Laptop Dell Latitude 5540', 'Intel i7 Gen 13, RAM 16GB, SSD 512GB, untuk Front Desk Manager', 'e2c482b9-ee22-4bc1-a9dd-ba37c6bf8b13', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '47ff028b-6c80-4c1c-a8d2-e3edf1302eb9', '2023-01-10', 22000000, 48, 'declining_balance', 16843750, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Meja Makan Restoran Set (4 kursi)', 'Set meja makan kayu jati finishing natural, merk Kampoeng Furniture', 'c4db2379-2a93-4e7e-a2f2-9e9820ba7b72', 'f919b000-a99a-4aa0-af24-dc775bcfa463', 'fbed57ac-7003-448f-a5ca-ecf82566f5fc', '2021-05-01', 9500000, 120, 'straight_line', 8316667, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Treadmill Commercial LifeFitness T5', 'Treadmill lipat komersial, max 20km/h, untuk fitness center', '798665c4-ec99-491d-a55a-458f3f2cdbbd', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '7791892c-d2d2-4cad-a735-25bdbcace8f7', '2022-09-01', 55000000, 84, 'straight_line', 47321429, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'CCTV System Dahua 32CH NVR', 'NVR 32 channel + 24 IP Camera 4MP, area lobby dan parkir', '9ffe43b6-d752-450c-a8dd-1f40be501420', 'f919b000-a99a-4aa0-af24-dc775bcfa463', 'd194da6c-7f92-4f81-a2eb-f8acfc297393', '2021-11-15', 65000000, 60, 'declining_balance', 40960000, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Vacuum Cleaner Nilfisk GD930 S2', 'Vacuum industri 30L, untuk housekeeping lantai 1', 'c76af0eb-40de-4a38-ae04-25262e192634', 'f919b000-a99a-4aa0-af24-dc775bcfa463', 'f0fc792e-eae7-4d55-aee2-ef4247abb2f6', '2022-04-01', 8500000, 60, 'straight_line', 7233333, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Kendaraan Operasional Toyota Avanza', 'Plat AB 1234 XY, tahun 2021, untuk antar jemput tamu VIP', 'a9a95fab-2ba4-4bc9-abb8-b6f8429ca887', 'f919b000-a99a-4aa0-af24-dc775bcfa463', '91d7734f-712d-4e9f-a69e-3f0e6d6567d5', '2021-07-01', 220000000, 60, 'straight_line', 183333333, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Mesin Espresso La Marzocca Linea', 'Mesin kopi profesional 2-group, untuk Coffee Corner lobby', '562cea71-aad0-4d59-a480-ed767bd755b6', 'f919b000-a99a-4aa0-af24-dc775bcfa463', 'fbed57ac-7003-448f-a5ca-ecf82566f5fc', '2022-02-14', 135000000, 84, 'straight_line', 118392857, 'good', 'active', gen_random_uuid());

-- Mall Assets (8)
INSERT INTO public.assets (id, name, description, category_id, business_unit_id, current_location_id, purchase_date, purchase_price, useful_life_months, depreciation_method, current_book_value, condition, status, qr_code_uuid) VALUES
  (gen_random_uuid(), 'Digital Signage 75" Outdoor Samsung OH75B', 'Display outdoor waterproof, terpasang di main entrance mall', '000e4f78-3716-41b3-a68b-63c03797fd8b', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', '2186e642-e0fe-4f03-aaa1-3207a3ea0cd1', '2022-08-01', 98000000, 48, 'straight_line', 67083333, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Eskalator KONE EcoMod 3000', 'Eskalator kapasitas 6500 persons/hour, GF ke UG', '39c64f59-da84-420d-aaad-cddd630b6318', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', 'e5d505eb-3f4f-495f-ab13-5366e3fd8a54', '2020-01-01', 850000000, 120, 'straight_line', 736250000, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Server Dell PowerEdge R740', 'Server utama untuk POS & tenant billing system mall', 'e2c482b9-ee22-4bc1-a9dd-ba37c6bf8b13', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', '4e59e386-6949-409b-acd7-f323c5f4cb90', '2021-06-15', 185000000, 48, 'declining_balance', 87890625, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'AC Split Daikin 5PK FTKQ Series', 'AC untuk ruang Customer Service, energi efisien inverter', '39c64f59-da84-420d-aaad-cddd630b6318', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', '4e59e386-6949-409b-acd7-f323c5f4cb90', '2022-03-01', 28000000, 120, 'straight_line', 24266667, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Meja Kursi Foodcourt Set A (25 set)', 'Set meja+2 kursi stainless & HPL, untuk area foodcourt GF', 'c4db2379-2a93-4e7e-a2f2-9e9820ba7b72', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', '091f6e50-3253-40d5-a853-f529f9c2870e', '2020-06-01', 75000000, 120, 'straight_line', 61875000, 'fair', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'CCTV IP Camera Axis Q6135-LE (outdoor)', 'PTZ IP Camera 32x zoom, untuk area parkir basement', '9ffe43b6-d752-450c-a8dd-1f40be501420', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', '6ef241cc-b64d-4fa1-aa30-0b31efa77cd7', '2022-01-10', 45000000, 60, 'declining_balance', 30000000, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Generator Caterpillar C15 1000kVA', 'Genset backup daya utama mall, auto-start', '39c64f59-da84-420d-aaad-cddd630b6318', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', 'e5d505eb-3f4f-495f-ab13-5366e3fd8a54', '2019-09-01', 1250000000, 120, 'straight_line', 1031250000, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Mesin Antrian Digital Qmatic', 'Sistem antrian elektronik dengan display monitor, CS area', 'e2c482b9-ee22-4bc1-a9dd-ba37c6bf8b13', 'ecd4d1af-1655-4aeb-a8b2-e3205ae9dc50', '4e59e386-6949-409b-acd7-f323c5f4cb90', '2023-03-01', 35000000, 48, 'straight_line', 31979167, 'good', 'active', gen_random_uuid());

-- Property Assets (7)
INSERT INTO public.assets (id, name, description, category_id, business_unit_id, current_location_id, purchase_date, purchase_price, useful_life_months, depreciation_method, current_book_value, condition, status, qr_code_uuid) VALUES
  (gen_random_uuid(), 'Lift Penumpang Schindler 3300 AP', 'Lift kapasitas 8 orang 630kg, Tower A, 10 lantai', '39c64f59-da84-420d-aaad-cddd630b6318', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', 'fbcae618-aff9-494f-a8ee-4e63f3721a4b', '2020-03-15', 650000000, 120, 'straight_line', 552916667, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Water Heater Central Rheem 300L', 'Pemanas air terpusat untuk Tower A lantai 3-10', '39c64f59-da84-420d-aaad-cddd630b6318', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', '899da459-3b40-449e-a7da-4eb699038f9c', '2020-03-15', 85000000, 120, 'straight_line', 72291667, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Furniture Unit Kondotel 301 – Full Set', 'Set lengkap: tempat tidur queen, wardrobe, meja kerja, kursi, TV', 'c4db2379-2a93-4e7e-a2f2-9e9820ba7b72', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', 'ffa91466-f991-4bef-a052-d174aa536c84', '2021-01-01', 95000000, 120, 'straight_line', 81583333, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Laptop Lenovo ThinkPad L14 Gen 4', 'Untuk staf marketing kantor pengelola, i5/8GB/256GB', 'e2c482b9-ee22-4bc1-a9dd-ba37c6bf8b13', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', 'cd1115dc-db0c-4751-ab01-8bf3ae149c7c', '2023-06-01', 14500000, 48, 'declining_balance', 13203125, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Printer Multifungsi Canon imageRUNNER C3226i', 'Printer A3 warna laser, untuk kantor pengelola', 'e2c482b9-ee22-4bc1-a9dd-ba37c6bf8b13', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', 'cd1115dc-db0c-4751-ab01-8bf3ae149c7c', '2022-11-01', 38500000, 48, 'declining_balance', 28875000, 'fair', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'Pompa Air Grundfos CR 3-17', 'Pompa sirkulasi air bersih Tower A, kapasitas 18 m³/jam', '39c64f59-da84-420d-aaad-cddd630b6318', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', '899da459-3b40-449e-a7da-4eb699038f9c', '2020-03-15', 35000000, 120, 'straight_line', 29791667, 'good', 'active', gen_random_uuid()),
  (gen_random_uuid(), 'TV LED 43" Samsung Smart TV Unit Kondotel', 'Samsung UA43CU7700KXXD, terpasang di tiap unit kondotel (sample unit 302)', '366eca51-4b45-46fd-a999-61005cf0c131', '5c023150-b144-4a52-a61a-e4e55cdc4ea9', 'ffa91466-f991-4bef-a052-d174aa536c84', '2021-01-01', 8500000, 60, 'declining_balance', 5440000, 'good', 'active', gen_random_uuid());

-- ============================================================
-- 5. DEFAULT APPROVAL WORKFLOWS
-- ============================================================
INSERT INTO public.approval_workflows (action_type, min_value_threshold, required_role) VALUES
  ('disposal_sale', 50000000, 'corporate_admin'),
  ('disposal_sale', 500000000, 'super_admin'),
  ('disposal_auction', 0, 'corporate_admin'),
  ('disposal_donation', 0, 'unit_admin'),
  ('disposal_transfer', 0, 'unit_admin'),
  ('disposal_writeoff', 10000000, 'corporate_admin'),
  ('high_value_purchase', 100000000, 'corporate_admin'),
  ('high_value_purchase', 1000000000, 'super_admin');
