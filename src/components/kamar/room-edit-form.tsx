"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import type { Room, Tenant } from "@/lib/types";

type Props = {
  room: Room;
  tenant: Tenant | null;
  onSave: (payload: {
    room: { name: string; number: string; floor: number; monthlyRent: number; status: Room["status"] };
    tenant: { fullName: string; phone: string; moveInDate: string; monthlyRent: number | null; dueDay: number; notes: string } | null;
  }) => Promise<void>;
  onCancel: () => void;
};

export function RoomEditForm({ room, tenant, onSave, onCancel }: Props) {
  const [number, setNumber] = useState(room.number);
  const [name, setName] = useState(room.name);
  const [floor, setFloor] = useState(room.floor);
  const [rent, setRent] = useState(room.monthlyRent);
  const [status, setStatus] = useState<Room["status"]>(room.status);

  const [tenantName, setTenantName] = useState(tenant?.fullName ?? "");
  const [tenantPhone, setTenantPhone] = useState(tenant?.phone ?? "");
  const [moveIn, setMoveIn] = useState(tenant?.moveInDate ?? "");
  const [tenantRent, setTenantRent] = useState(tenant?.monthlyRent ?? null);
  const [dueDay, setDueDay] = useState(tenant?.dueDay ?? 5);
  const [notes, setNotes] = useState(tenant?.notes ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const occupied = status === "occupied";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!number.trim() || !name.trim()) {
      setError("Nomor dan nama kamar wajib diisi.");
      return;
    }
    if (occupied && !tenantName.trim()) {
      setError("Nama penghuni wajib diisi jika kamar terisi.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        room: { name: name.trim(), number: number.trim(), floor, monthlyRent: rent, status },
        tenant: occupied
          ? {
              fullName: tenantName.trim(),
              phone: tenantPhone.trim(),
              moveInDate: moveIn,
              monthlyRent: tenantRent && tenantRent > 0 ? tenantRent : null,
              dueDay,
              notes: notes.trim(),
            }
          : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <MaterialIcon name="edit" className="text-[20px] text-primary" />
        <span className="font-headline-md text-body-lg font-bold text-on-surface">
          Edit {room.name}
        </span>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="room-number">
              Nomor Kamar
            </label>
            <input
              id="room-number"
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="room-name">
              Nama Kamar
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="room-floor">
              Lantai
            </label>
            <input
              id="room-floor"
              type="number"
              min={1}
              value={floor}
              onChange={(e) => setFloor(Number(e.target.value) || 1)}
              className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="room-rent">
              Sewa Bulanan (Rp)
            </label>
            <input
              id="room-rent"
              type="number"
              min={0}
              value={rent}
              onChange={(e) => setRent(Number(e.target.value) || 0)}
              className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-body-sm font-medium text-on-surface-variant">Status Kamar</span>
          <div className="flex flex-wrap gap-2">
            {(["occupied", "vacant", "maintenance"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-body-sm text-body-sm font-semibold transition-all",
                  status === s
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface hover:bg-surface-container",
                )}
              >
                {s === "occupied" ? "Terisi" : s === "vacant" ? "Kosong" : "Maintenance"}
              </button>
            ))}
          </div>
        </div>

        {occupied ? (
          <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3">
            <span className="font-label-status text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Data Penghuni
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="tenant-name">
                  Nama Penghuni
                </label>
                <input
                  id="tenant-name"
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="h-11 rounded-xl bg-surface-container-lowest px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="tenant-phone">
                  No. WhatsApp
                </label>
                <input
                  id="tenant-phone"
                  type="tel"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="h-11 rounded-xl bg-surface-container-lowest px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="move-in">
                  Tanggal Masuk
                </label>
                <input
                  id="move-in"
                  type="date"
                  value={moveIn}
                  onChange={(e) => setMoveIn(e.target.value)}
                  className="h-11 rounded-xl bg-surface-container-lowest px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="tenant-rent">
                  Sewa Khusus (Rp, opsional)
                </label>
                <input
                  id="tenant-rent"
                  type="number"
                  min={0}
                  value={tenantRent ?? ""}
                  onChange={(e) => setTenantRent(e.target.value ? Number(e.target.value) : null)}
                  placeholder={`Default ${formatRupiah(rent)}`}
                  className="h-11 rounded-xl bg-surface-container-lowest px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="due-day">
                  Tanggal Jatuh Tempo (1-28)
                </label>
                <input
                  id="due-day"
                  type="number"
                  min={1}
                  max={28}
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value) || 5)}
                  className="h-11 rounded-xl bg-surface-container-lowest px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="notes">
                  Catatan
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="rounded-xl bg-surface-container-lowest px-4 py-2 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg bg-danger-tint px-3 py-2 font-body-sm text-[12px] text-danger-text">{error}</div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl font-headline-md text-body-sm font-bold shadow-soft transition-all active:scale-95",
              saving ? "cursor-wait bg-surface-container-high text-on-surface-variant" : "bg-primary text-on-primary hover:bg-primary-container",
            )}
          >
            <MaterialIcon name={saving ? "sync" : "save"} className="text-[18px]" />
            {saving ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 items-center justify-center rounded-xl bg-surface-container-high px-4 font-body-sm text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container active:scale-95"
          >
            Batal
          </button>
        </div>
      </form>
    </Card>
  );
}
