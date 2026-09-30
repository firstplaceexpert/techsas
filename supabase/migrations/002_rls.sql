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
