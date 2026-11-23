# Smart Kos Energi — Monitoring Listrik Kos Berbasis IoT

Aplikasi web (mobile-first) untuk pemilik kos memantau konsumsi listrik per kamar, estimasi
tagihan PLN, tren pemakaian, dan peringatan dini anggaran. Dibangun oleh Kelompok G3
(Naufal Mirza Aldilla, Gagas Cahya Kamajengan, Julia Ayu Siagian).

## Fitur utama

- **Dashboard (Beranda)** — total tagihan berjalan, persentase anggaran, status AMAN/WASPADA/BAHAYA, panel sensor terpusat (tegangan, arus, daya, frekuensi), rincian 4 kamar dengan beban daya & akumulasi bulan ini, tagihan WA per kamar.
- **Riwayat & Tren** — filter 7 hari / bulan ini / bulan lalu, rata-rata pemakaian, puncak & terendah, grafik batang interaktif, rincian harian, ekspor PDF & CSV.
- **Limit & Atur** — atur batas anggaran bulanan, konversi kWh, ambang Waspada 75% & Bahaya 95%, toggle alarm & kanal notifikasi (WhatsApp/push), parameter teknis PLN & IoT, keluar akun.
- **Mode demo** — berjalan tanpa Supabase (data mock), cocok untuk presentasi. Set `NEXT_PUBLIC_DEMO_MODE=false` + kredensial Supabase untuk mode nyata.
- **Simulator IoT** — skrip Node mengirim data sensor (PZEM-004T) ke endpoint `/api/ingest` (validasi API key SHA-256, akumulasi ringkasan harian atomik).
- **Notifikasi otomatis** — ingest mengevaluasi budget dan membuat notifikasi Waspada/Bahaya per bulan (best-effort).

## Stack

- Next.js 16.4.6 (App Router, Turbopack, Cache Components, Partial Prefetching)
- React 19.3, TypeScript, Tailwind CSS 4.3.3
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — Auth + Postgres + RLS
- Recharts, Zod, jsPDF + jspdf-autotable, clsx, tailwind-merge
- Material Symbols Outlined (ikon)

## Struktur

```
src/
  app/                  # App Router (dashboard, riwayat, pengaturan, login, api/ingest)
  components/           # ui, layout, dashboard, riwayat, pengaturan, auth, providers
  lib/                  # config, types, energy, date, selectors, export, supabase, mock, data
supabase/migrations/    # skema DB + RLS + RPC
scripts/                # seed.mjs, simulator.mjs
stitch_reference/       # acuan desain Stitch (HTML + DESIGN.md)
docs/                   # think aloud, deploy, ringkasan PRD
```

## Setup lokal

1. Prasyarat: Node.js ≥ 20, npm ≥ 10.
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Salin env:
   ```bash
   copy .env.example .env.local
   ```
4. Mode demo (default): biarkan `NEXT_PUBLIC_DEMO_MODE=true`. Jalankan:
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000.

## Mode Supabase (data nyata)

1. Buat project Supabase, jalankan `supabase/migrations/20260101000000_init.sql` di SQL Editor.
2. Isi `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_DEMO_MODE=false
   INGEST_API_KEY=...   # rahasia, samakan dengan seed
   ```
3. Seed data demo:
   ```bash
   npm run seed
   ```
   (membuat user `owner@smartkos.dev` / `SmartKos#2026`, kos, 4 kamar, device, 30 hari ringkasan, notifikasi, dan file `scripts/.devices.json`).
4. Jalankan app: `npm run dev`.
5. (Opsional) Jalankan simulator di terminal lain:
   ```bash
   npm run simulate
   ```

## Skrip

| Skrip | Keterangan |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan build produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed data ke Supabase |
| `npm run simulate` | Simulator IoT (kirim data tiap 5 dtk) |

## Verifikasi

```bash
npm run typecheck && npm run lint && npm run build
```

## Catatan

- Ekspor “Excel” diimplementasikan sebagai **CSV** (UTF-8 BOM) agar dapat dibuka di Excel/LibreOffice, karena paket `xlsx` memiliki kerentanan tanpa fix.
- Relay ON/OFF, “Tagihan WA”, ekspor = aksi UI/demo sesuai PRD (bukan kontrol hardware nyata).
- Penamaan route proteksi menggunakan `src/proxy.ts` (pengganti Middleware di Next.js 16).

## Lisensi

Proyek akademik Kelompok G3. Tidak untuk penggunaan komersial.
