import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { dayName, formatDateShort, fromDateKey } from "@/lib/date";
import { formatNumber, formatRupiah } from "@/lib/energy";
import { historyDayStatus } from "@/lib/history-status";
import type { HistoryView } from "@/lib/types";

function safeFileName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDecimal(value: number, digits = 2): string {
  return formatNumber(value, digits);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (text.includes(";") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadHistoryCsv(history: HistoryView, kosName: string) {
  const lines: string[] = [];

  lines.push(csvCell(`Laporan Riwayat Energi - ${kosName}`));
  lines.push(csvCell(`Periode;${history.rangeLabel}`));
  lines.push(csvCell(`Total;${formatDecimal(history.totalKwh)} kWh;${history.totalRupiah}`));
  lines.push("");

  const header = [
    "Tanggal",
    "Hari",
    "Pemakaian (kWh)",
    "Biaya (Rp)",
    "Status",
    "Keterangan",
  ];
  lines.push(header.map(csvCell).join(";"));

  for (const day of history.days) {
    const status = historyDayStatus(day, history.dailyTargetKwh);
    lines.push(
      [
        day.date,
        dayName(fromDateKey(day.date)),
        formatDecimal(day.kwh, 2),
        Math.round(day.rupiah),
        status.label,
        status.description,
      ]
        .map(csvCell)
        .join(";"),
    );
  }

  lines.push("");
  lines.push(csvCell(`Tarif per kWh;${history.tariffPerKwh}`));
  lines.push(csvCell("Dibuat oleh Smart Kos Energi - Kelompok G3"));

  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `riwayat-energi-${safeFileName(history.rangeLabel)}.csv`);
}

export function downloadHistoryPdf(history: HistoryView, kosName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(0, 104, 95);
  doc.rect(0, 0, pageWidth, 86, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Laporan Riwayat Energi", 40, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(kosName, 40, 56);
  doc.text(`Periode: ${history.rangeLabel}`, 40, 70);

  doc.setTextColor(11, 28, 48);
  doc.setFontSize(10);
  doc.text(
    `Total: ${formatDecimal(history.totalKwh)} kWh  |  ${formatRupiah(history.totalRupiah)}  |  Rata-rata: ${formatDecimal(
      history.averageKwh,
    )} kWh/hari`,
    40,
    112,
  );
  doc.text(
    `Target harian: ${formatDecimal(history.dailyTargetKwh)} kWh  |  Tarif: ${formatRupiah(
      history.tariffPerKwh,
    )} / kWh`,
    40,
    128,
  );

  const rows = history.days.map((day) => {
    const status = historyDayStatus(day, history.dailyTargetKwh);
    return [
      `${dayName(fromDateKey(day.date))}, ${formatDateShort(fromDateKey(day.date))}`,
      day.isMissing ? "-" : formatDecimal(day.kwh, 2),
      day.isMissing ? "-" : formatRupiah(day.rupiah),
      status.label,
      status.description,
    ];
  });

  autoTable(doc, {
    startY: 146,
    head: [["Tanggal", "kWh", "Biaya", "Status", "Keterangan"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [0, 104, 95], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [239, 244, 255] },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 45, halign: "right" },
      2: { cellWidth: 85, halign: "right" },
      3: { cellWidth: 70 },
      4: { cellWidth: "auto" },
    },
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(109, 122, 119);
      doc.text("Dibuat oleh Smart Kos Energi - Kelompok G3", 40, pageHeight - 24);
    },
  });

  doc.save(`riwayat-energi-${safeFileName(history.rangeLabel)}.pdf`);
}
