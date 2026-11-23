-- =============================================================================
-- Smart Kos Monitor — Tambah kolom template pesan WA di settings
-- Kelompok G3
-- Jalankan di Supabase SQL Editor setelah 20260102000000_kos_monitoring.sql
-- =============================================================================
alter table public.settings
  add column if not exists wa_template text;

-- default template (opsional)
update public.settings
set wa_template = 'Halo {nama},

Tagihan sewa {kamar} ({kos}) periode {bulan}:
- Sewa bulanan: {jumlah}
- Jatuh tempo: {jatuhTempo}

Mohon dibayar sebelum jatuh tempo. Terima kasih.'
where wa_template is null;
