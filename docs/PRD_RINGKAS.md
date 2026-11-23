# Ringkasan PRD — Smart Energy Monitor Kos (Kelompok G3)

Sumber: `PRD_Smart_Energy_Monitor_Kos_Kelompok_G3.pdf`.

## Latar belakang

Pemilik kos kesulitan memantau konsumsi listrik per kamar dan sering terkejut tagihan PLN
membengkak. Dibutuhkan dashboard real-time per kamar dengan peringatan dini.

## Persona

- **Bu Suwanti** — pemilik kos, 4 kamar, tidak melek teknologi, butuh tampilan sederhana & bahasa Indonesia, akses via HP.

## Fitur (MVP)

| Kode | Fitur |
| --- | --- |
| FT-01 | Total tagihan berjalan + persentase anggaran |
| FT-02 | Status AMAN (<75%) / WASPADA (75–95%) / BAHAYA (>95%) |
| FT-03 | Monitoring per kamar (akumulasi kWh, beban daya, relay ON/OFF) |
| FT-04 | Atur batas anggaran bulanan + konversi kWh |
| FT-05 | Notifikasi peringatan (Waspada/Bahaya) via WhatsApp & push |
| FT-06 | Riwayat & tren (grafik, puncak/terendah, rata-rata) |
| FT-07 | Ekspor laporan PDF & CSV |

## Parameter teknis

- Sensor: 4x PZEM-004T v3 (CT clamp non-invasif) + ESP32 gateway.
- Tarif PLN R-1/TR: Rp 1.444,70/kWh (subsidi non, daya 1.300–2.200 VA).
- Ambang: Waspada 75%, Bahaya 95% dari budget.
- Budget default: Rp 850.000/bulan.
- Stale/offline: data > 5 menit.
- Siklus tagihan: tgl 1 – akhir bulan, reset 00:00.

## KPI keberhasilan

- Task success rate ≥ 80%, SUS ≥ 68.
- Penurunan tagihan listrik ≥ 10% setelah 2 bulan pemakaian.
- 0 kejadian pemadaman akibat overload setelah monitoring.

## Non-fungsional

- Mobile-first, PWA-friendly, offline-tolerant (data terakhir tetap tampil).
- Keamanan: RLS per pemilik, API key SHA-256 untuk ingest.
- Bahasa Indonesia, format angka id-ID.

## Out of scope (MVP)

- Kontrol hardware nyata (relay remote), tagihan otomatis via WhatsApp API, multi-pemilik/kos.
