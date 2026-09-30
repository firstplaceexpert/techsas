# TECHSAS — Universal Smart Asset Lifecycle & Tracking Platform

> **Karya Kompetisi Web Development — IT DAYS 2026**  
> **Tema Utama:** *Mens et Corpus* (Pikiran & Tubuh)  
> **Subtema:** *B. Pemberdayaan Ekonomi & UMKM*  
> **Penyelenggara:** Himpunan Mahasiswa Informatika (HMIF) Universitas Sanata Dharma Yogyakarta  

---

## 📌 Sekilas Proyek

**TECHSAS** (*Technology for Efficient & Centralized Handling of Strategic Assets*) adalah platform manajemen aset terpadu berbasis *cloud* dan *QR-Code Digital Passport* yang didesain khusus untuk memberdayakan pelaku usaha mikro, kecil, dan menengah (UMKM) padat aset (*asset-heavy*) di Indonesia.

Melalui pendekatan estetika **Apple UI/UX Design System**, TECHSAS mendemokratisasi teknologi pengelolaan aset berstandar *enterprise*—memungkinkan pemilik bisnis melacak kondisi fisik barang modal, mencatat riwayat pemeliharaan, mencegah kehilangan/penukaran, serta menghitung nilai buku dan penyusutan akuntansi secara otomatis tanpa memerlukan alat *scanner* mahal.

---

## 🏢 Solusi Multi-Sektor UMKM yang Didukung

TECHSAS dirancang secara universal untuk berbagai industri UMKM berbasis aset:

1. **🚗 Rental Kendaraan & Armada (`DriveNusa Fleet`):** Melacak servis berkala mobil/motor, odometer km, perlengkapan toolkit, dan riwayat klaim penyewa.
2. **📸 Rental Kamera & Studio Multimedia (`KameraPro Studio`):** Melacak lensa kamera bernilai puluhan juta, sensor cleaning, jamur (*fungus*), dan aksesoris audio.
3. **🎮 Rental PS VIP & Gaming Lounge (`Nexus VIP Lounge`):** Mengamankan stik DualSense controller dari analog drift/tertukar, konsol PS5, TV 4K OLED, dan sofa gaming.
4. **☕ Cafe & Coffee Roastery (`Nusantara Artisan Coffee`):** Menjadwalkan descaling mesin espresso, penggantian burr grinder, perawatan chiller, dan POS kasir.
5. **🎉 Rental Alat Event & Audio (`StageCraft Audio`):** Inspeksi kabel, speaker aktif, mixer audio, dan genset sebelum dan sesudah disewakan.

---

## ✨ Fitur-Fitur Unggulan (Core Innovations)

- **📱 Smart Camera Scanner (Tanpa Alat Tambahan):** Memanfaatkan kamera HP staf via browser untuk audit stock opname kilat.
- **🏷️ Label QR Digital Passport Generator:** Generator stiker QR dinamis yang siap cetak dalam berbagai ukuran (*Thermal / Grid Sticker A4*).
- **🌐 Portal Publik Lapor Kerusakan (Zero Login):** Pelanggan atau staf dapat memindai label QR pada alat/meja untuk langsung mengirim tiket perbaikan fasilitas tanpa registrasi.
- **📊 Mesin Depresiasi Akuntansi Otomatis:** Perhitungan nilai buku (*Net Book Value*) secara real-time menggunakan metode *Straight-Line* maupun *Declining Balance*.
- **🛠️ Modul Work Order & Maintenance:** Manajemen tiket perbaikan teknisi internal maupun klaim garansi vendor rekanan.
- **📋 Audit Log & Keamanan RLS:** Seluruh mutasi aset dan pembaruan data tercatat secara permanen dengan *Row Level Security* (PostgreSQL).

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Server-Side Rendering (SSR) & Server Actions |
| **Bahasa** | TypeScript 5 (Strict Mode) | Type-safe enterprise codebase |
| **Styling** | Tailwind CSS v3 | Apple Design Language (Charcoal, Mint Green, Pale Green) |
| **Database** | Supabase (PostgreSQL 15) | Relational database dengan Row Level Security |
| **Autentikasi** | Supabase Auth + Session Cookies | RBAC: Super Admin, Unit Admin, Field Engineer |
| **Scanner Engine** | @zxing/browser | Web-based real-time optical barcode/QR reader |
| **Iconography** | Lucide React | Clean minimalist vector icons |

---

## 🚀 Panduan Menjalankan Aplikasi Secara Lokal

### Prasyarat:
- **Node.js** versi 18.x atau lebih baru
- **npm** atau **yarn**

### 1. Kloning Repositori
```bash
git clone https://github.com/username/techsas.git
cd techsas
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (.env.local)
Buat file `.env.local` pada *root directory* proyek:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
*(Catatan: Mode Demo Prototipe dapat langsung dijalankan tanpa database cloud dengan akun demo instan yang telah disediakan).*

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka browser dan akses **`http://localhost:3000`**.

---

## 👤 Akun Pengujian Demo (1-Click Login)

Pada halaman login (`/login`), telah disediakan 5 profil peran siap pakai:
- **Super Admin:** `admin@techsas.id` (Akses Penuh Semua Divisi)
- **Corporate Admin:** `corporate@techsas.id` (Manajemen Kebijakan & Kantor Pusat)
- **Admin Rental Armada:** `admin.produksi@techsas.id` (Operasional Armada & Kendaraan)
- **Admin Studio & Media:** `admin.outlet@techsas.id` (Kamera, Multimedia & Alat Sewa)
- **Field Engineer / Teknisi:** `field@techsas.id` (Inspeksi Lapangan & Tiket Kerusakan)
- *Kata Sandi Default:* `admin123`

---

## 📄 Lisensi & Hak Cipta
Dikembangkan untuk **IT Days 2026 Universitas Sanata Dharma**. Seluruh hak cipta dilindungi undang-undang.
