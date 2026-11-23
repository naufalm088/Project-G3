# Ringkasan PRD — Smart Kos Monitor (Kelompok G3)

Sumber: PRD awal (monitoring listrik kos) direvisi total menjadi monitoring kos online.

## Latar belakang

Pemilik kos kesulitan memantau kamar, penghuni, pembayaran sewa, dan keamanan kos secara terpusat.
Dibutuhkan dashboard online (HP & PC) yang ramah orang tua/pemilik kos, dengan fitur tagih sewa
via WhatsApp dan CCTV.

## Persona

- **Bu Suwanti** — pemilik kos, 6 kamar, tidak melek teknologi, butuh tampilan sederhana & bahasa Indonesia, akses via HP/PC.

## Fitur (MVP)

| Kode | Fitur |
| --- | --- |
| FT-01 | Dashboard: CCTV preview, pendapatan bulan ini (target vs terkumpul + progress + grafik 6 bulan), counts (total/terisi/kosong/jatuh tempo), grid kamar, notifikasi, tips |
| FT-02 | Daftar & detail kamar (edit kamar/penghuni, status pembayaran, Tagih WA manual, Chat Manual, Tandai Lunas, riwayat pembayaran kamar, hapus kamar) |
| FT-03 | Riwayat pembayaran (filter periode/kamar/status, ringkasan, ekspor PDF & CSV) |
| FT-04 | CCTV (preview di dashboard + halaman penuh, placeholder jika belum terhubung, URL di Pengaturan) |
| FT-05 | Pengaturan: profil kos, due day, sewa default, CCTV URL, notifikasi, template pesan WA, mode UI (Klasik/Modern), CRUD kamar, logout |
| FT-06 | Mode UI Klasik (card) / Modern (3D interaktif, drag untuk memutar, klik kamar → detail; gudang = under maintenance) |
| FT-07 | Notifikasi in-app (H-3 jatuh tempo, overdue) + link WA manual |
| FT-08 | Auth (login/register Supabase, provisioning kos + 6 kamar + gudang) |

## Parameter

- Total kamar: 6 + 1 gudang (maintenance).
- Sewa bulanan per kamar (contoh): 550k / 550k / 500k / 600k / 450k / 500k.
- Jatuh tempo: tanggal 1–28 (default 5).
- Target pendapatan bulan ini = jumlah sewa kamar terisi (auto-update).
- CCTV: 1 kamera untuk seluruh kos.

## KPI keberhasilan

- Task success rate ≥ 80%, SUS ≥ 68.
- Pemilik dapat mengetahui status pembayaran semua kamar dalam < 10 detik.
- Penagihan via WA dilakukan dalam ≤ 3 klik.

## Non-fungsional

- Responsif: mobile (bottom nav) → tablet → desktop (wide layout).
- Keamanan: RLS per pemilik, auth Supabase.
- Bahasa Indonesia, format angka id-ID.
- Aksesibilitas: touch target ≥ 48px, aria-label.

## Out of scope (MVP)

- Kontrol hardware/CCTV auto-provisioning, auto-send WhatsApp (butuh WhatsApp Business API), multi-pemilik/kos, pembayaran parsial, maintenance request, laporan keuangan lanjut.
