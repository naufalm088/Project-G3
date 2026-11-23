# Think Aloud — Panduan Pengujian Usabilitas
## Smart Kos Energi (Kelompok G3)

Dokumen ini menjelaskan protokol *think aloud* yang digunakan untuk mengevaluasi
antarmuka Smart Kos Energi, mengacu pada materi "Thinking Aloud" (dosen).

## 1. Tujuan

- Menilai kemudahan penggunaan (learnability & efficiency) dashboard monitoring listrik kos.
- Mengidentifikasi hambatan kognitif, kebingungan label/ikon, dan kesalahan interaksi.
- Memvalidasi alur utama: cek tagihan, baca status, lihat riwayat, ubah anggaran, kirim tagihan WA.

## 2. Partisipan

- 5–8 pemilik kos / pengelola kos (usia 30–60), tidak harus melek teknologi.
- Kriteria: mengelola minimal 3 kamar, pernah menerima tagihan listrik kos.
- Rekrutmen via jaringan pribadi; kompensasi kecil (pulsa) opsional.

## 3. Perangkat & Lingkungan

- Smartphone Android (layar 6–6.7"), koneksi internet stabil.
- Aplikasi dijalankan mode demo atau produksi (URL Vercel).
- Perekaman: screen recorder (AZ Screen Recorder / built-in) + audio (mic eksternal) + catatan observer.
- Durasi: 30–45 menit per sesi.

## 4. Tugas (Tasks)

1. **T1 — Cek tagihan berjalan**: "Berapa perkiraan tagihan listrik kos bulan ini dan berapa persen dari anggaran?"
2. **T2 — Status & kamar**: "Kamar mana yang paling boros? Apa statusnya (aman/waspada/bahaya)?"
3. **T3 — Sensor**: "Berapa tegangan listrik dan total daya saat ini?"
4. **T4 — Riwayat**: "Hari apa pemakaian tertinggi minggu ini? Berapa kWh-nya?"
5. **T5 — Ekspor**: "Unduh laporan 7 hari terakhir dalam bentuk PDF."
6. **T6 — Ubah anggaran**: "Ubah batas anggaran bulanan menjadi Rp 1.000.000 lalu simpan."
7. **T7 — Notifikasi**: "Aktifkan peringatan Waspada dan nonaktifkan push notifikasi."
8. **T8 — Tagihan WA**: "Kirim tagihan WA untuk kamar paling boros."

## 5. Prosedur

1. Sambutan & penjelasan think aloud (5 menit): "Ucapkan apa yang Anda pikirkan, jangan menahan; tidak ada jawaban salah; kami menguji aplikasi, bukan Anda."
2. Persetujuan perekaman (informed consent).
3. Pre-test kuesioner singkat (pengalaman teknologi, kebiasaan cek tagihan).
4. Pelaksanaan tugas T1–T8 (think aloud), observer mencatat:
   - waktu penyelesaian per tugas,
   - jumlah kesalahan/klik salah,
   - utterances kunci (kebingungan, ekspektasi, saran).
5. Post-test: SUS (System Usability Scale) 10 item + wawancara singkat (apa yang paling membantu / paling membingungkan).
6. Debrief & terima kasih.

## 6. Metrik

- **Task success rate** (% tugas selesai tanpa bantuan).
- **Time on task** (detik).
- **Error rate** (klik salah / salah baca).
- **SUS score** (target ≥ 68).
- **Kutipan think aloud** (klasifikasi: navigasi, label/ikon, feedback, kepercayaan data).

## 7. Template Catatan Observer

| Tugas | Waktu (s) | Sukses (Y/T) | Kesalahan | Utterance kunci |
| --- | --- | --- | --- | --- |
| T1 |  |  |  |  |
| T2 |  |  |  |  |
| ... |  |  |  |  |

## 8. Analisis & Iterasi

- Transkrip utterance → koding tema (navigasi, terminologi, visual hierarchy).
- Prioritaskan isu (severity 1–3) dan perbaiki sebelum rilis berikutnya.
- Ulangi pengujian setelah perbaikan (iterasi).

## 9. Etika

- Data anonim, tidak menyimpan identitas tanpa izin.
- Partisipan boleh berhenti kapan saja.
- Hasil hanya untuk perbaikan produk akademik.
