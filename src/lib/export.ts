import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatRupiah } from "@/lib/format";
import type { PaymentHistoryView } from "@/lib/types";

function safeFileName(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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

export function downloadPaymentCsv(view: PaymentHistoryView, kosName: string) {
  const lines: string[] = [];
  lines.push(csvCell(`Laporan Pembayaran Kos - ${kosName}`));
  lines.push(csvCell(`Total Lunas;${view.totalCollected}`));
  lines.push(csvCell(`Total Belum;${view.totalPending}`));
  lines.push(csvCell(`Total Jatuh Tempo;${view.totalOverdue}`));
  lines.push("");

  const header = ["Periode", "Kamar", "Penghuni", "Jumlah (Rp)", "Jatuh Tempo", "Status", "Dibayar"];
  lines.push(header.map(csvCell).join(";"));

  const roomMap = new Map(view.rooms.map((r) => [r.id, r]));
  const tenantMap = new Map(view.tenants.map((t) => [t.id, t]));

  for (const p of view.payments) {
    const room = roomMap.get(p.roomId);
    const tenant = p.tenantId ? tenantMap.get(p.tenantId) : undefined;
    lines.push(
      [
        p.period,
        room?.name ?? "-",
        tenant?.fullName ?? "-",
        Math.round(p.amount),
        p.dueDate,
        p.status,
        p.paidAt ? new Date(p.paidAt).toISOString().slice(0, 10) : "-",
      ]
        .map(csvCell)
        .join(";"),
    );
  }

  lines.push("");
  lines.push(csvCell("Dibuat oleh Smart Kos Monitor - Kelompok G3"));

  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `pembayaran-kos-${safeFileName(kosName)}.csv`);
}

export function downloadPaymentPdf(view: PaymentHistoryView, kosName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(0, 104, 95);
  doc.rect(0, 0, pageWidth, 86, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Laporan Pembayaran Kos", 40, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(kosName, 40, 56);
  doc.text(`Total catatan: ${view.payments.length}`, 40, 70);

  doc.setTextColor(11, 28, 48);
  doc.setFontSize(10);
  doc.text(
    `Lunas: ${formatRupiah(view.totalCollected)}  |  Belum: ${formatRupiah(view.totalPending)}  |  Jatuh tempo: ${formatRupiah(view.totalOverdue)}`,
    40,
    112,
  );

  const roomMap = new Map(view.rooms.map((r) => [r.id, r]));
  const tenantMap = new Map(view.tenants.map((t) => [t.id, t]));

  const rows = view.payments.map((p) => {
    const room = roomMap.get(p.roomId);
    const tenant = p.tenantId ? tenantMap.get(p.tenantId) : undefined;
    return [
      p.period,
      room?.name ?? "-",
      tenant?.fullName ?? "-",
      formatRupiah(p.amount),
      new Date(p.dueDate).toLocaleDateString("id-ID"),
      p.status === "paid" ? "Lunas" : p.status === "overdue" ? "Jatuh Tempo" : "Belum",
      p.paidAt ? new Date(p.paidAt).toLocaleDateString("id-ID") : "-",
    ];
  });

  autoTable(doc, {
    startY: 130,
    head: [["Periode", "Kamar", "Penghuni", "Jumlah", "Jatuh Tempo", "Status", "Dibayar"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [0, 104, 95], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [239, 244, 255] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 60 },
      2: { cellWidth: 90 },
      3: { cellWidth: 75, halign: "right" },
      4: { cellWidth: 70 },
      5: { cellWidth: 60 },
      6: { cellWidth: 70 },
    },
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(109, 122, 119);
      doc.text("Dibuat oleh Smart Kos Monitor - Kelompok G3", 40, pageHeight - 24);
    },
  });

  doc.save(`pembayaran-kos-${safeFileName(kosName)}.pdf`);
}
