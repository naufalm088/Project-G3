# Smart Kos Monitor — Monitoring Kos Online

Aplikasi web (responsif: HP & PC) untuk pemilik kos memantau kamar, penghuni, pembayaran sewa,
notifikasi jatuh tempo, dan CCTV keamanan kos. Dibangun oleh Kelompok G3
(Naufal Mirza Aldilla, Gagas Cahya Kamajengan, Julia Ayu Siagian).

## Fitur utama

- **Dashboard (Beranda)** — CCTV preview, pendapatan bulan ini (target vs terkumpul + progress + grafik 6 bulan), counts (total/terisi/kosong/jatuh tempo), grid kamar mode Klasik atau Modern 3D, notifikasi, tips.
- **Kamar** — daftar kamar + detail kamar (edit kamar/penghuni, status pembayaran, Tagih WA manual, Chat Manual, Tandai Lunas, riwayat pembayaran kamar, hapus kamar).
- **Riwayat** — tabel pembayaran (filter periode/kamar/status), ringkasan Lunas/Belum/Jatuh Tempo, ekspor PDF & CSV.
- **CCTV** — tampilan penuh kamera keamanan (placeholder jika belum terhubung).
- **Pengaturan** — profil kos, due day, sewa default, CCTV URL, notifikasi, template pesan WA, mode UI (Klasik/Modern), CRUD kamar, logout.
- **Mode demo** — berjalan tanpa Supabase (data mock). Set `NEXT_PUBLIC_DEMO_MODE=false` + kredensial Supabase untuk data nyata.
- **Auth** — login/register Supabase, provisioning kos + 6 kamar + gudang otomatis.

## Stack

- Next.js 16.4.6 (App Router, Turbopack, Cache Components, Partial Prefetching)
- React 19.3, TypeScript, Tailwind CSS 4.3.3
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — Auth + Postgres + RLS
- Recharts, Zod, jsPDF + jspdf-autotable, clsx, tailwind-merge
- Material Symbols Outlined

## Struktur

```
src/
  app/                  # App Router (dashboard, kamar, riwayat, cctv, pengaturan, login)
  components/           # ui, layout, dashboard, kamar, kos, cctv, pengaturan, providers
  lib/                  # config, types, format, date, selectors, export, supabase, mock, data
supabase/migrations/    # skema DB + RLS + RPC (provision_owner)
scripts/                # seed.mjs
stitch_reference/       # acuan desain Stitch
docs/                   # think aloud, deploy, ringkasan PRD
public/                 # aset (kos-photo.png)
```

## Setup lokal

1. Prasyarat: Node.js ≥ 20, npm ≥ 10.
2. Pasang dependensi: `npm install`
3. Salin env: `copy .env.example .env.local`
4. Mode demo (default): biarkan `NEXT_PUBLIC_DEMO_MODE=true`. Jalankan `npm run dev` → http://localhost:3000.
5. Mode Supabase: isi kredensial, set `NEXT_PUBLIC_DEMO_MODE=false`, jalankan migration SQL, `npm run seed`, lalu `npm run dev`.

## Skrip

| Skrip | Keterangan |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan build produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed data ke Supabase |

## Verifikasi

```
npm run typecheck && npm run lint && npm run build
```

## Catatan

- Foto kos (`public/kos-photo.png`) dipakai sebagai tekstur di mode Modern 3D (drag untuk memutar).
- CCTV menggunakan embed URL (HLS/iframe); jika kosong tampil placeholder.
- Tagih WA membuka `wa.me` dengan teks terisi (klik kirim manual, bukan auto-send).
- Responsif: mobile (bottom nav) → tablet → desktop (sidebar-like wide layout).

## Lisensi

Proyek akademik Kelompok G3. Tidak untuk penggunaan komersial.
