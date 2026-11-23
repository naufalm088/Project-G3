import { cn } from "@/lib/utils";
import { statusToneForPayment, statusToneForRoom } from "@/lib/format";
import type { PaymentStatus, RoomStatus } from "@/lib/types";

const paymentStyles: Record<ReturnType<typeof statusToneForPayment>, string> = {
  safe: "bg-safe-tint text-safe-text",
  warn: "bg-warn-tint text-warn-text",
  danger: "bg-danger-tint text-danger-text",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

const paymentLabels: Record<PaymentStatus | "none", string> = {
  paid: "Lunas",
  pending: "Belum Bayar",
  overdue: "Jatuh Tempo",
  none: "Belum Ada Tagihan",
};

export function PaymentBadge({ status }: { status: PaymentStatus | "none" }) {
  const tone = statusToneForPayment(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-status text-label-status font-bold",
        paymentStyles[tone],
      )}
    >
      {paymentLabels[status]}
    </span>
  );
}

const roomStyles: Record<ReturnType<typeof statusToneForRoom>, string> = {
  safe: "bg-safe-tint text-safe-text",
  warn: "bg-warn-tint text-warn-text",
  danger: "bg-danger-tint text-danger-text",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

const roomLabels: Record<RoomStatus, string> = {
  occupied: "Terisi",
  vacant: "Kosong",
  maintenance: "Maintenance",
};

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const tone = statusToneForRoom(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-status text-label-status font-bold",
        roomStyles[tone],
      )}
    >
      {roomLabels[status]}
    </span>
  );
}
