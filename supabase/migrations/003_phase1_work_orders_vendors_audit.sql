-- ============================================================
-- TECHSAS - TECHSAS Asset Management System
-- Migration 003: Phase 1 — Work Orders, Vendors, Audit Trail
-- ============================================================

-- ============================================================
-- 15. VENDORS
-- ============================================================
CREATE TABLE public.vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  contact_person  TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  category        TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('spare_parts', 'service', 'general', 'contractor')),
  rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_category ON public.vendors(category);
CREATE INDEX idx_vendors_is_active ON public.vendors(is_active);

-- ============================================================
-- 16. WORK ORDERS
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS work_order_seq START 1;

CREATE TABLE public.work_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_number         TEXT NOT NULL UNIQUE,
  asset_id          UUID NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  title             TEXT NOT NULL,
  description       TEXT,
  priority          TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'in_progress', 'on_hold', 'completed', 'rejected', 'cancelled')),
  maintenance_type  TEXT NOT NULL DEFAULT 'corrective'
    CHECK (maintenance_type IN ('preventive', 'corrective', 'predictive')),
  assigned_to       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vendor_id         UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  sla_target_hours  INTEGER,
  actual_hours      NUMERIC(8, 2),
  labor_cost        NUMERIC(15, 2) DEFAULT 0,
  parts_cost        NUMERIC(15, 2) DEFAULT 0,
  total_cost        NUMERIC(15, 2) DEFAULT 0,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_work_orders_wo_number ON public.work_orders(wo_number);
CREATE INDEX idx_work_orders_asset_id ON public.work_orders(asset_id);
CREATE INDEX idx_work_orders_status ON public.work_orders(status);
CREATE INDEX idx_work_orders_priority ON public.work_orders(priority);
CREATE INDEX idx_work_orders_assigned_to ON public.work_orders(assigned_to);
CREATE INDEX idx_work_orders_created_at ON public.work_orders(created_at DESC);

-- ============================================================
-- 17. WORK ORDER PARTS (Spare parts used per WO)
-- ============================================================
CREATE TABLE public.work_order_parts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  part_name       TEXT NOT NULL,
  part_code       TEXT,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_cost       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_cost      NUMERIC(15, 2) NOT NULL DEFAULT 0,
  source          TEXT NOT NULL DEFAULT 'vendor'
    CHECK (source IN ('warehouse', 'vendor', 'cannibalized')),
  source_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_work_order_parts_work_order_id ON public.work_order_parts(work_order_id);

-- ============================================================
-- 18. WORK ORDER COMMENTS
-- ============================================================
CREATE TABLE public.work_order_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_work_order_comments_work_order_id ON public.work_order_comments(work_order_id);

-- ============================================================
-- 19. AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name   TEXT,
  action      TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'status_change')),
  table_name  TEXT NOT NULL,
  record_id   TEXT,
  old_data    JSONB,
  new_data    JSONB,
  description TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-generate WO number
CREATE OR REPLACE FUNCTION public.generate_wo_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  IF NEW.wo_number IS NULL OR NEW.wo_number = '' THEN
    seq_val := nextval('work_order_seq');
    NEW.wo_number := 'WO-' || LPAD(seq_val::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_work_orders_generate_wo_number
  BEFORE INSERT ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_wo_number();

-- Auto-update timestamps
CREATE TRIGGER trg_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- VENDORS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_select" ON public.vendors
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "vendors_insert" ON public.vendors
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin')
  );

CREATE POLICY "vendors_update" ON public.vendors
  FOR UPDATE USING (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin')
  );

CREATE POLICY "vendors_delete" ON public.vendors
  FOR DELETE USING (public.is_corporate_user());

-- WORK ORDERS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_orders_select" ON public.work_orders
  FOR SELECT USING (
    public.is_corporate_user()
    OR EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_id
        AND a.business_unit_id = public.get_current_user_business_unit()
    )
  );

CREATE POLICY "work_orders_insert" ON public.work_orders
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
  );

CREATE POLICY "work_orders_update" ON public.work_orders
  FOR UPDATE USING (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
  );

-- WORK ORDER PARTS
ALTER TABLE public.work_order_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_order_parts_select" ON public.work_order_parts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "work_order_parts_insert" ON public.work_order_parts
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'corporate_admin', 'unit_admin', 'field_officer')
  );

-- WORK ORDER COMMENTS
ALTER TABLE public.work_order_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_order_comments_select" ON public.work_order_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "work_order_comments_insert" ON public.work_order_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- AUDIT LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING (public.is_corporate_user());

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
