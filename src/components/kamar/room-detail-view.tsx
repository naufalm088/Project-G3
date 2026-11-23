"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PaymentBadge } from "@/components/kos/payment-badge";
import { RoomEditForm } from "@/components/kamar/room-edit-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { selectRoomDetail } from "@/lib/selectors";
import { formatRupiah, formatPeriod } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Room } from "@/lib/types";

export function RoomDetailView({ roomId }: { roomId?: string }) {
  const params = useParams<{ id: string }>();
  const id = roomId ?? params?.id;
  const router = useRouter();
  const { data, isDemo, client, refresh, updateData } = useAppData();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);

  if (!data) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </PageContainer>
    );
  }

  const detail = id ? selectRoomDetail(data, id) : null;
  if (!detail) {
    return (
      <PageContainer>
        <EmptyState
          icon="meeting_room"
          title="Kamar tidak ditemukan"
          description="Kamar ini mungkin sudah dihapus."
          action={
            <Link href="/dashboard" className="mt-1 rounded-lg bg-primary px-4 py-2 font-body-sm text-body-sm font-semibold text-on-primary">
              Kembali ke Dashboard
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const { room, tenant, payments, currentPayment } = detail;
  const effectiveRent = tenant?.monthlyRent && tenant.monthlyRent > 0 ? tenant.monthlyRent : room.monthlyRent;
  const paymentStatus = currentPayment
    ? currentPayment.status === "pending" && new Date(currentPayment.dueDate).getTime() < new Date().setHours(0, 0, 0, 0)
      ? "overdue"
      : currentPayment.status
    : "none";

  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const dueLabel = currentPayment ? new Date(currentPayment.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

  function buildWaText() {
    const kosName = data!.kos.name;
    const monthLabel = formatPeriod(period);
    const rentLine = effectiveRent > 0 ? `Sewa bulanan: ${formatRupiah(effectiveRent)}` : "";
    const dueLine = currentPayment ? `Jatuh tempo: ${dueLabel}` : "";
    return [
      `Halo ${tenant?.fullName ?? "Penghuni"},`,
      ``,
      `Tagihan sewa ${room.name} (${kosName}) periode ${monthLabel}:`,
      rentLine,
      dueLine,
      ``,
      `Mohon dibayar sebelum jatuh tempo. Terima kasih.`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function openWa(prefill: boolean) {
    if (!tenant?.phone) {
      toast({ title: "Nomor WA belum diatur", description: "Edit kamar untuk menambahkan nomor WhatsApp penghuni.", tone: "error" });
      return;
    }
    const phone = tenant.phone.replace(/[^0-9]/g, "");
    const international = phone.startsWith("0") ? "62" + phone.slice(1) : phone;
    const url = prefill
      ? `https://wa.me/${international}?text=${encodeURIComponent(buildWaText())}`
      : `https://wa.me/${international}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleSave(payload: {
    room: { name: string; number: string; floor: number; monthlyRent: number; status: Room["status"] };
    tenant: { fullName: string; phone: string; moveInDate: string; monthlyRent: number | null; dueDay: number; notes: string } | null;
  }) {
    try {
      if (isDemo || !client) {
        // local update
        updateData((prev) => {
          const rooms = prev.rooms.map((r) =>
            r.id === room.id
              ? { ...r, number: payload.room.number, name: payload.room.name, floor: payload.room.floor, monthlyRent: payload.room.monthlyRent, status: payload.room.status }
              : r,
          );
          let tenants = prev.tenants.filter((t) => t.roomId !== room.id);
          if (payload.tenant && payload.room.status === "occupied") {
            const existing = prev.tenants.find((t) => t.roomId === room.id);
            tenants = [
              ...tenants,
              {
                id: existing?.id ?? `demo-tenant-${room.id}`,
                kosId: prev.kos.id,
                roomId: room.id,
                fullName: payload.tenant.fullName,
                phone: payload.tenant.phone || null,
                moveInDate: payload.tenant.moveInDate || null,
                monthlyRent: payload.tenant.monthlyRent,
                dueDay: payload.tenant.dueDay,
                notes: payload.tenant.notes || null,
                createdAt: existing?.createdAt ?? new Date().toISOString(),
              },
            ];
          }
          return { ...prev, rooms, tenants };
        });
      } else {
        // supabase
        const { error: roomErr } = await client
          .from("rooms")
          .update({
            room_number: payload.room.number,
            name: payload.room.name,
            floor: payload.room.floor,
            monthly_rent: payload.room.monthlyRent,
            status: payload.room.status,
          })
          .eq("id", room.id);
        if (roomErr) throw new Error(roomErr.message);

        // remove tenant if no longer occupied
        if (payload.room.status !== "occupied") {
          await client.from("tenants").delete().eq("room_id", room.id);
        } else if (payload.tenant) {
          const { data: existing } = await client.from("tenants").select("id").eq("room_id", room.id).maybeSingle();
          const tenantPayload = {
            kos_id: data!.kos.id,
            room_id: room.id,
            full_name: payload.tenant.fullName,
            phone: payload.tenant.phone || null,
            move_in_date: payload.tenant.moveInDate || null,
            monthly_rent: payload.tenant.monthlyRent,
            due_day: payload.tenant.dueDay,
            notes: payload.tenant.notes || null,
          };
          if (existing?.id) {
            const { error } = await client.from("tenants").update(tenantPayload).eq("id", existing.id);
            if (error) throw new Error(error.message);
          } else {
            const { error } = await client.from("tenants").insert(tenantPayload);
            if (error) throw new Error(error.message);
          }
        }
        await refresh();
      }
      setEditing(false);
      toast({ title: "Perubahan disimpan", tone: "success" });
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: err instanceof Error ? err.message : "Coba lagi.", tone: "error" });
    }
  }

  async function handleMarkPaid() {
    if (!currentPayment) {
      toast({ title: "Tidak ada tagihan bulan ini", tone: "info" });
      return;
    }
    try {
      if (isDemo || !client) {
        updateData((prev) => ({
          ...prev,
          payments: prev.payments.map((p) =>
            p.id === currentPayment.id ? { ...p, status: "paid", paidAt: new Date().toISOString() } : p,
          ),
        }));
      } else {
        const { error } = await client
          .from("payments")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", currentPayment.id);
        if (error) throw new Error(error.message);
        await refresh();
      }
      toast({ title: "Ditandai lunas", tone: "success" });
    } catch (err) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Coba lagi.", tone: "error" });
    }
  }

  async function handleDeleteRoom() {
    if (!confirm(`Hapus ${room.name}? Semua data penghuni & pembayaran kamar ini akan terhapus.`)) return;
    try {
      if (isDemo || !client) {
        updateData((prev) => ({
          ...prev,
          rooms: prev.rooms.filter((r) => r.id !== room.id),
          tenants: prev.tenants.filter((t) => t.roomId !== room.id),
          payments: prev.payments.filter((p) => p.roomId !== room.id),
        }));
      } else {
        const { error } = await client.from("rooms").delete().eq("id", room.id);
        if (error) throw new Error(error.message);
        await refresh();
      }
      toast({ title: "Kamar dihapus", tone: "success" });
      router.replace("/dashboard");
    } catch (err) {
      toast({ title: "Gagal menghapus", description: err instanceof Error ? err.message : "Coba lagi.", tone: "error" });
    }
  }

  const toneClass =
    paymentStatus === "paid"
      ? "text-safe"
      : paymentStatus === "overdue"
        ? "text-danger-text"
        : paymentStatus === "pending"
          ? "text-warn-text"
          : "text-on-surface-variant";

  return (
    <PageContainer className="lg:max-w-5xl">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container active:scale-95"
          aria-label="Kembali"
        >
          <MaterialIcon name="arrow_back" className="text-[20px]" />
        </Link>
        <div className="flex flex-col">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface">
            {room.name}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Kamar {room.number} • Lantai {room.floor}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <PaymentBadge status={paymentStatus === "none" ? "none" : paymentStatus} />
        </div>
      </div>

      {editing ? (
        <RoomEditForm
          room={room}
          tenant={tenant}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          {/* Room info */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed font-mono font-bold">
                  {room.number}
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-body-lg font-bold text-on-surface">{room.name}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {room.status === "occupied" ? "Terisi" : room.status === "vacant" ? "Kosong" : "Maintenance"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-surface-container-high px-3 font-body-sm text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container active:scale-95"
              >
                <MaterialIcon name="edit" className="text-[16px]" />
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-3">
              <div>
                <span className="block font-body-sm text-[11px] text-on-surface-variant">Sewa Bulanan</span>
                <span className="font-mono text-body-lg font-bold text-on-surface">{formatRupiah(effectiveRent)}</span>
              </div>
              <div>
                <span className="block font-body-sm text-[11px] text-on-surface-variant">Lantai</span>
                <span className="font-mono text-body-lg font-bold text-on-surface">{room.floor}</span>
              </div>
            </div>
          </Card>

          {/* Tenant info */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <MaterialIcon name="person" className="text-[20px] text-primary" />
              <span className="font-headline-md text-body-lg font-bold text-on-surface">Penghuni</span>
            </div>
            {tenant ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-on-surface-variant">Nama</span>
                  <span className="font-body-md font-semibold text-on-surface">{tenant.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-on-surface-variant">No. WhatsApp</span>
                  <span className="font-mono text-body-sm text-on-surface">{tenant.phone ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-on-surface-variant">Tanggal Masuk</span>
                  <span className="font-body-sm text-on-surface">{tenant.moveInDate ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-on-surface-variant">Jatuh Tempo</span>
                  <span className="font-body-sm text-on-surface">tgl {tenant.dueDay} tiap bulan</span>
                </div>
                {tenant.notes ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-body-sm text-on-surface-variant">Catatan</span>
                    <span className="font-body-sm text-on-surface">{tenant.notes}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                icon="person_off"
                title="Belum ada penghuni"
                description="Edit kamar untuk menambahkan penghuni."
              />
            )}
          </Card>

          {/* Payment this month */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MaterialIcon name="receipt_long" className="text-[20px] text-primary" />
                <span className="font-headline-md text-body-lg font-bold text-on-surface">Tagihan Bulan Ini</span>
              </div>
              <PaymentBadge status={paymentStatus === "none" ? "none" : paymentStatus} />
            </div>
            {currentPayment ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-on-surface-variant">Periode</span>
                  <span className="font-body-md font-semibold text-on-surface">{formatPeriod(currentPayment.period)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-on-surface-variant">Jumlah</span>
                  <span className="font-mono text-body-lg font-bold text-on-surface">{formatRupiah(currentPayment.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-on-surface-variant">Jatuh Tempo</span>
                  <span className="font-body-sm text-on-surface">{dueLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-on-surface-variant">Status</span>
                  <span className={cn("font-body-sm font-semibold", toneClass)}>
                    {paymentStatus === "paid" ? "Lunas" : paymentStatus === "overdue" ? "Jatuh Tempo" : "Belum Bayar"}
                  </span>
                </div>
                {paymentStatus !== "paid" ? (
                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    className="mt-1 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-safe text-on-tertiary font-body-sm text-body-sm font-semibold shadow-soft transition-opacity active:opacity-90"
                  >
                    <MaterialIcon name="check_circle" className="text-[18px]" />
                    Tandai Lunas
                  </button>
                ) : null}
              </div>
            ) : (
              <EmptyState
                icon="receipt"
                title="Belum ada tagihan bulan ini"
                description="Tagihan akan muncul otomatis saat periode berjalan."
              />
            )}
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openWa(true)}
              disabled={!tenant?.phone}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-xl font-headline-md text-body-sm font-bold shadow-soft transition-all active:scale-95",
                tenant?.phone
                  ? "bg-primary text-on-primary hover:bg-primary-container"
                  : "cursor-not-allowed bg-surface-container-high text-on-surface-variant",
              )}
            >
              <MaterialIcon name="send" className="text-[18px]" />
              Tagih (WA)
            </button>
            <button
              type="button"
              onClick={() => openWa(false)}
              disabled={!tenant?.phone}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-xl font-headline-md text-body-sm font-bold shadow-soft transition-all active:scale-95",
                tenant?.phone
                  ? "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                  : "cursor-not-allowed bg-surface-container-high text-on-surface-variant",
              )}
            >
              <MaterialIcon name="chat" className="text-[18px]" />
              Chat Manual
            </button>
          </div>

          {/* Payment history */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <MaterialIcon name="history" className="text-[20px] text-primary" />
              <span className="font-headline-md text-body-lg font-bold text-on-surface">Riwayat Pembayaran</span>
            </div>
            {payments.length === 0 ? (
              <EmptyState icon="receipt_long" title="Belum ada riwayat" description="Pembayaran akan muncul di sini." />
            ) : (
              <div className="flex flex-col gap-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-surface-container-low p-2.5">
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-sm font-semibold text-on-surface">{formatPeriod(p.period)}</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        {p.paidAt ? `Dibayar ${new Date(p.paidAt).toLocaleDateString("id-ID")}` : `Jatuh tempo ${new Date(p.dueDate).toLocaleDateString("id-ID")}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-body-sm font-bold text-on-surface">{formatRupiah(p.amount)}</span>
                      <PaymentBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Danger zone */}
          <button
            type="button"
            onClick={handleDeleteRoom}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-danger-tint px-4 font-body-sm text-body-sm font-semibold text-danger-text transition-colors hover:bg-danger/10 active:scale-95"
          >
            <MaterialIcon name="delete" className="text-[18px]" />
            Hapus Kamar
          </button>
        </>
      )}
    </PageContainer>
  );
}
