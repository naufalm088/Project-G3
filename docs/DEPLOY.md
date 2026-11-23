# Panduan Deploy — Smart Kos Energi

## 1. Supabase

1. Buat project di https://supabase.com (region terdekat, mis. Singapore).
2. Buka **SQL Editor**, tempel isi `supabase/migrations/20260101000000_init.sql`, jalankan.
3. (Opsional) Nonaktifkan konfirmasi email di **Auth → Providers → Email** agar registrasi langsung aktif (untuk demo kelas).
4. Catat:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (rahasia, jangan diekspos ke client)
5. Seed data:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... INGEST_API_KEY=... npm run seed
   ```
   atau isi `.env.local` lalu `npm run seed`.

## 2. GitHub

```bash
git init
git add .
git commit -m "feat: Smart Kos Energi MVP"
git branch -M main
git remote add origin https://github.com/<user>/smart-energy-monitor.git
git push -u origin main
```

Pastikan `.env.local` tidak ter-commit (sudah di `.gitignore`).

## 3. Vercel

1. Import repo di https://vercel.com/new.
2. Framework preset: **Next.js** (auto-detected).
3. Environment Variables (Production & Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_DEMO_MODE=false`
   - `NEXT_PUBLIC_APP_URL=https://<nama>.vercel.app`
   - `INGEST_API_KEY=<sama dengan seed>`
4. Deploy. Build command default `next build`.
5. Uji:
   - Buka URL, login `owner@smartkos.dev` / `SmartKos#2026`.
   - Jalankan simulator lokal menunjuk ke URL produksi:
     ```bash
     SIMULATOR_URL=https://<nama>.vercel.app INGEST_API_KEY=... npm run simulate
     ```

## 4. Mode demo di produksi (tanpa Supabase)

Set `NEXT_PUBLIC_DEMO_MODE=true` dan kosongkan kredensial Supabase. App berjalan dengan data mock; cocok untuk presentasi tanpa backend.

## Troubleshooting

- **Build gagal: useSearchParams** — bungkus komponen yang memakai hook dalam `<Suspense>`.
- **Proxy/Middleware** — Next.js 16 memakai `src/proxy.ts`, bukan `middleware.ts`.
- **Cache Components** — baca nilai waktu (`new Date()`) hanya di client (`useEffect`/event handler) atau di dalam `<Suspense>`.
- **Ingest 401** — pastikan `INGEST_API_KEY` sama antara `.env` server dan simulator, dan device sudah di-seed (hash SHA-256).
- **Data kos tidak ditemukan** — panggil `provision_owner` (otomatis saat login/daftar) atau jalankan seed.
