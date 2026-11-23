# Panduan Deploy — Smart Kos Monitor

## 1. Supabase

1. Buat project di https://supabase.com.
2. SQL Editor → jalankan `supabase/migrations/20260101000000_init.sql` (skema awal: profiles, kos, RLS, provision_owner).
3. SQL Editor → jalankan `supabase/migrations/20260102000000_kos_monitoring.sql` (rooms, tenants, payments, settings, notifications).
4. SQL Editor → jalankan `supabase/migrations/20260103000000_settings_template.sql` (kolom wa_template).
5. SQL Editor → jalankan `supabase/migrations/20260104000000_fix_schema.sql` (perbaikan rooms/settings untuk DB lama).
6. Auth → Providers → Email: matikan "Confirm email" (untuk demo kelas).
7. Project Settings → API: catat Project URL, anon public key, service_role key.

Seed data:
```
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
```
atau isi `.env.local` lalu `npm run seed`.

## 2. GitHub

```
git init
git add .
git commit -m "feat: Smart Kos Monitor MVP"
git branch -M main
git remote add origin https://github.com/<user>/smart-kos-monitor.git
git push -u origin main
```
Pastikan `.env.local` tidak ter-commit (sudah di `.gitignore`).

## 3. Vercel

1. Import repo di https://vercel.com/new.
2. Framework: Next.js (auto). Build command default `next build`.
3. Environment Variables (Production & Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_DEMO_MODE=false`
   - `NEXT_PUBLIC_APP_URL=https://<nama>.vercel.app`
4. Deploy. Setelah dapat URL, update `NEXT_PUBLIC_APP_URL` → Redeploy.
5. Smoke test: buka URL → login `owner@smartkos.dev` / `SmartKos#2026` → cek dashboard, kamar, riwayat, CCTV, pengaturan.

## 4. Mode demo di produksi

Set `NEXT_PUBLIC_DEMO_MODE=true` dan kosongkan kredensial Supabase. App berjalan dengan data mock.

## Troubleshooting

- **Build gagal: useSearchParams/usePathname** — bungkus dalam `<Suspense>` atau `export const instant = false`.
- **Cache Components** — baca waktu (`new Date()`) hanya di client.
- **Proxy/Middleware** — Next.js 16 memakai `src/proxy.ts`.
- **Data kos tidak ditemukan** — panggil `provision_owner` (otomatis saat login/daftar) atau jalankan seed.
- **CCTV blank** — isi URL stream di Pengaturan; jika kosong tampil placeholder.
- **Foto kos** — ganti `public/kos-photo.png` dengan foto baru (nama sama).
