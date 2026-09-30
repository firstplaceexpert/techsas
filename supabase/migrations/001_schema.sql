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
