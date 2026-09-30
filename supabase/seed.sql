-- ============================================================
-- TECHSAS — Universal Smart Asset Management Platform
-- Seed Data untuk Multi-Sektor UMKM Indonesia
-- ============================================================

-- ============================================================
-- 1. BUSINESS UNITS (5 Flagship UMKM Sectors)
-- ============================================================
INSERT INTO public.business_units (id, name, type, address) VALUES
  ('bu-hotel-00000000-0000-0000-0000-000000000001', 'DriveNusa Fleet & Rental Mobil', 'other', 'Jl. Ringroad Utara No. 88, Sleman, D.I. Yogyakarta 55281'),
  ('bu-mall-000000000-0000-0000-0000-000000000002', 'KameraPro Gear & Production Studio', 'other', 'Jl. Kaliurang Km 5.2 No. 12, Depok, Sleman 55284'),
  ('bu-hotel-00000000-0000-0000-0000-000000000004', 'Nexus VIP Gaming & PS Lounge', 'other', 'Jl. Seturan Raya No. 45, Caturtunggal, Sleman 55281'),
  ('bu-hotel-00000000-0000-0000-0000-000000000005', 'Nusantara Artisan Coffee & Roastery', 'other', 'Jl. Prawirotaman No. 24, Mergangsan, Yogyakarta 55153'),
  ('bu-hotel-00000000-0000-0000-0000-000000000006', 'StageCraft Audio & Event Rental', 'other', 'Jl. Wonosari Km 7, Banguntapan, Bantul 55198'),
  ('bu-prop-00000000-0000-0000-0000-000000000003', 'TECHSAS Kantor Pusat & Cloud Center', 'property', 'Jl. Laksda Adisucipto No. 108, Yogyakarta 55281')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, type = EXCLUDED.type;

-- ============================================================
-- 2. LOCATIONS
-- ============================================================
INSERT INTO public.locations (id, business_unit_id, parent_id, name, level) VALUES
  -- DriveNusa Locations
  ('loc-h-site-000000-0000-0000-0000-000000000001', 'bu-hotel-00000000-0000-0000-0000-000000000001', NULL, 'DriveNusa Pool & Kantor Pusat', 'site'),
  ('loc-h-bld-000000-0000-0000-0000-000000000002', 'bu-hotel-00000000-0000-0000-0000-000000000001', 'loc-h-site-000000-0000-0000-0000-000000000001', 'Area Garasi & Pool Armada', 'building'),
  ('loc-h-rm-0000000-0000-0000-0000-000000000007', 'bu-hotel-00000000-0000-0000-0000-000000000001', 'loc-h-bld-000000-0000-0000-0000-000000000002', 'Customer Service & Rental Desk', 'room'),

  -- KameraPro Locations
  ('loc-m-site-000000-0000-0000-0000-000000000011', 'bu-mall-000000000-0000-0000-0000-000000000002', NULL, 'KameraPro Studio Utama', 'site'),
  ('loc-m-bld-000000-0000-0000-0000-000000000012', 'bu-mall-000000000-0000-0000-0000-000000000002', 'loc-m-site-000000-0000-0000-0000-000000000011', 'Studio Syuting & Storage Dry Box', 'building'),

  -- Nexus Gaming Locations
  ('loc-nexus-site-0000-0000-0000-000000000001', 'bu-hotel-00000000-0000-0000-0000-000000000004', NULL, 'Nexus VIP Gaming Lounge - Studio Utama', 'site'),

  -- Nusantara Coffee Locations
  ('loc-coffee-site-000-0000-0000-000000000001', 'bu-hotel-00000000-0000-0000-0000-000000000005', NULL, 'Nusantara Roastery & Bar Utama', 'site'),

  -- StageCraft Locations
  ('loc-stage-site-0000-0000-0000-000000000001', 'bu-hotel-00000000-0000-0000-0000-000000000006', NULL, 'StageCraft Audio Warehouse & Staging', 'site')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. ASSET CATEGORIES
-- ============================================================
INSERT INTO public.asset_categories (id, name, description, default_useful_life_months, default_depreciation_method, account_code_asset, account_code_accum, account_code_expense) VALUES
  ('cat-001-00000000-0000-0000-0000-000000000001', 'Furniture & Fixture', 'Meja, kursi gaming, sofa lounge, etalase', 60, 'straight_line', '1-1310', '1-1320', '6-1300'),
  ('cat-002-00000000-0000-0000-0000-000000000002', 'Elektronik & AV', 'TV 4K OLED, sistem sound PA, kamera mirrorless, mixer audio', 48, 'straight_line', '1-1410', '1-1420', '6-1400'),
  ('cat-003-00000000-0000-0000-0000-000000000003', 'Kendaraan & Armada Rental', 'Mobil MPV rental, motor matic operasional', 96, 'straight_line', '1-1510', '1-1520', '6-1500'),
  ('cat-004-00000000-0000-0000-0000-000000000004', 'Peralatan F&B & Barista', 'Mesin espresso komersial, grinder kopi, chiller bar', 60, 'straight_line', '1-1610', '1-1620', '6-1600'),
  ('cat-005-00000000-0000-0000-0000-000000000005', 'IT & Gaming Hardware', 'Konsol PS5 Pro, PC gaming, gamepad, server lokal', 36, 'straight_line', '1-1710', '1-1720', '6-1700'),
  ('cat-006-00000000-0000-0000-0000-000000000006', 'Pembangkit Daya & Genset', 'Generator genset silent inverter, UPS daya panggung', 84, 'straight_line', '1-1810', '1-1820', '6-1800')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. REALISTIC FLAGSHIP ASSETS
-- ============================================================
INSERT INTO public.assets (
  id, asset_code, name, description, category_id, business_unit_id,
  current_location_id, purchase_date, purchase_price, useful_life_months,
  depreciation_method, current_book_value, condition, status, qr_code_uuid
) VALUES
  -- DriveNusa Fleet
  ('ast-flt-00000000-0000-0000-0000-000000000001', 'TCS-FLT-2401-0001', 'Toyota Avanza 1.5 G CVT 2023', 'Unit armada rental MPV 7-seater warna Silver Metalik, nopol AB 1420 QK', 'cat-003-00000000-0000-0000-0000-000000000003', 'bu-hotel-00000000-0000-0000-0000-000000000001', 'loc-h-bld-000000-0000-0000-0000-000000000002', '2023-05-10', 265000000, 96, 'straight_line', 237447917, 'good', 'active', '00000001-qr00-0000-0000-000000000001'),
  ('ast-flt-00000000-0000-0000-0000-000000000002', 'TCS-FLT-2401-0002', 'Toyota Kijang Innova Zenix 2.0 V', 'Unit armada rental premium MPV warna Hitam Mika, nopol AB 1899 XX', 'cat-003-00000000-0000-0000-0000-000000000003', 'bu-hotel-00000000-0000-0000-0000-000000000001', 'loc-h-bld-000000-0000-0000-0000-000000000002', '2023-06-15', 425000000, 96, 'straight_line', 380729167, 'good', 'active', '00000001-qr00-0000-0000-000000000002'),

  -- KameraPro
  ('ast-cam-00000000-0000-0000-0000-000000000001', 'TCS-CAM-2401-0001', 'Kamera Mirrorless Sony Alpha A7 IV Body', 'Kamera full-frame 33MP hybrid foto-video 4K 60p rental studio', 'cat-002-00000000-0000-0000-0000-000000000002', 'bu-mall-000000000-0000-0000-0000-000000000002', 'loc-m-bld-000000-0000-0000-0000-000000000012', '2023-09-01', 34500000, 48, 'straight_line', 26593750, 'good', 'active', '00000002-qr00-0000-0000-000000000001'),
  ('ast-cam-00000000-0000-0000-0000-000000000002', 'TCS-CAM-2401-0002', 'Lensa Sony FE 24-70mm f/2.8 GM II', 'Lensa zoom standar profesional G-Master mount E rental kit', 'cat-002-00000000-0000-0000-0000-000000000002', 'bu-mall-000000000-0000-0000-0000-000000000002', 'loc-m-bld-000000-0000-0000-0000-000000000012', '2023-09-10', 31900000, 60, 'straight_line', 25520000, 'good', 'active', '00000002-qr00-0000-0000-000000000002'),

  -- Nexus Gaming
  ('ast-nexus-0000000-0000-0000-0000-000000000001', 'TCS-GME-2401-0001', 'Console Sony PlayStation 5 Pro 2TB', 'Unit konsol PS5 Pro edisi 2TB untuk VIP Room A, lengkap HDMI 2.1 & kabel daya', 'cat-005-00000000-0000-0000-0000-000000000005', 'bu-hotel-00000000-0000-0000-0000-000000000004', 'loc-nexus-site-0000-0000-0000-000000000001', '2024-01-10', 13500000, 48, 'straight_line', 12375000, 'good', 'active', '00000004-qr00-0000-0000-000000000001'),
  ('ast-nexus-0000000-0000-0000-0000-000000000002', 'TCS-GME-2401-0002', 'TV OLED LG C3 55 Inch 120Hz 4K Gaming', 'Monitor display 55 inch OLED dengan refresh rate 120Hz dan NVIDIA G-Sync', 'cat-002-00000000-0000-0000-0000-000000000002', 'bu-hotel-00000000-0000-0000-0000-000000000004', 'loc-nexus-site-0000-0000-0000-000000000001', '2024-01-10', 19800000, 60, 'straight_line', 18480000, 'good', 'active', '00000004-qr00-0000-0000-000000000002'),

  -- Nusantara Coffee
  ('ast-cfe-00000000-0000-0000-0000-000000000001', 'TCS-CFE-2308-0001', 'Espresso Machine La Marzocco Linea Classic S 2-Group', 'Mesin espresso komersial dual-boiler stainless steel untuk operasional bar cafe', 'cat-004-00000000-0000-0000-0000-000000000004', 'bu-hotel-00000000-0000-0000-0000-000000000005', 'loc-coffee-site-000-0000-0000-000000000001', '2023-08-15', 155000000, 84, 'straight_line', 142142857, 'good', 'active', '00000005-qr00-0000-0000-000000000001'),
  ('ast-cfe-00000000-0000-0000-0000-000000000002', 'TCS-CFE-2308-0002', 'Coffee Grinder Mahlkönig EK43 Commercial', 'Grinder kopi all-round komersial untuk filter dan espresso bar', 'cat-004-00000000-0000-0000-0000-000000000004', 'bu-hotel-00000000-0000-0000-0000-000000000005', 'loc-coffee-site-000-0000-0000-000000000001', '2023-08-20', 48000000, 60, 'straight_line', 43200000, 'good', 'active', '00000005-qr00-0000-0000-000000000002'),

  -- StageCraft Audio
  ('ast-evt-00000000-0000-0000-0000-000000000001', 'TCS-EVT-2311-0001', 'Active PA Speaker System JBL EON715 15-Inch (Sepasang)', 'Speaker aktif portabel 1300W Bluetooth DSP untuk live event dan rental panggung', 'cat-002-00000000-0000-0000-0000-000000000002', 'bu-hotel-00000000-0000-0000-0000-000000000006', 'loc-stage-site-0000-0000-0000-000000000001', '2023-11-01', 22000000, 60, 'straight_line', 19800000, 'good', 'active', '00000006-qr00-0000-0000-000000000001'),
  ('ast-evt-00000000-0000-0000-0000-000000000004', 'TCS-EVT-2310-0002', 'Genset Silent Inverter Honda EU70is 5500W', 'Generator listrik portabel super silent bertenaga 5.5 kVA inverter clean power', 'cat-006-00000000-0000-0000-0000-000000000006', 'bu-hotel-00000000-0000-0000-0000-000000000006', 'loc-stage-site-0000-0000-0000-000000000001', '2023-10-15', 43000000, 84, 'straight_line', 39928571, 'good', 'active', '00000006-qr00-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;
