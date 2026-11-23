"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialIcon } from "@/components/ui/material-icon";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { RoomEditForm } from "@/components/kamar/room-edit-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";


// Re-export Toggle? It's defined below in this file actually. Move Toggle here.
function ToggleLocal({
  checked,
  onChange,
  label,
  size = "md",
  tone = "primary",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  size?: "lg" | "md";
  tone?: "primary" | "tertiary" | "danger";
}) {
  const sizes = {
    lg: { track: "h-8 w-14", knob: "after:top-[4px] after:left-[4px] after:h-6 after:w-6", shift: "peer-checked:after:translate-x-6" },
    md: { track: "h-6 w-11", knob: "after:top-[2px] after:left-[2px] after:h-5 after:w-5", shift: "peer-checked:after:translate-x-5" },
  } as const;
  const s = sizes[size];
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className={cn(
          "relative rounded-full bg-surface-container-highest transition-colors after:absolute after:rounded-full after:bg-white after:shadow-md after:transition-all after:content-['']",
          s.track, s.knob, s.shift,
          tone === "primary" && "peer-checked:bg-primary",
          tone === "tertiary" && "peer-checked:bg-tertiary",
          tone === "danger" && "peer-checked:bg-danger",
        )}
      />
    </label>
  );
}

export function SettingsScreen() {
  const { data, loading, error, isDemo, client, refresh, updateData, saveSettings } = useAppData();
  const { toast } = useToast();
  const router = useRouter();

  const [kosName, setKosName] = useState("");
  const [kosAddress, setKosAddress] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [rentDueDay, setRentDueDay] = useState(5);
  const [defaultRent, setDefaultRent] = useState(500000);
  const [notifActive, setNotifActive] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifOverdue, setNotifOverdue] = useState(true);
  const [cctvUrl, setCctvUrl] = useState("");
  const [uiMode, setUiMode] = useState<"classic" | "modern">("classic");
  const [waTemplate, setWaTemplate] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomRent, setNewRoomRent] = useState(500000);
  const [signingOut, setSigningOut] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (data) {
      setKosName(data.kos.name);
      setKosAddress(data.kos.address ?? "");
      setOwnerPhone(data.settings.ownerPhone ?? "");
      setRentDueDay(data.settings.rentDueDay);
      setDefaultRent(data.settings.defaultRent);
      setNotifActive(data.settings.notifActive);
      setNotifReminder(data.settings.notifReminder);
      setNotifOverdue(data.settings.notifOverdue);
      setCctvUrl(data.settings.cctvUrl ?? data.kos.cctvUrl ?? "");
      setUiMode(data.settings.uiMode);
      setWaTemplate(data.settings.waTemplate ?? "");
      setDirty(false);
    }
  }, [data]);
  /* eslint-enable react-hooks/set-state-in-effect */


  if (!data) {
    if (loading) {
      return (
        <PageContainer>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <EmptyState icon="cloud_off" title="Gagal memuat pengaturan" description={error ?? "Data belum tersedia."} />
      </PageContainer>
    );
  }

  const rooms = data.rooms.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  async function handleSaveAll() {
    setSaving(true);
    try {
      if (isDemo || !client) {
        updateData((prev) => ({
          ...prev,
          kos: { ...prev.kos, name: kosName, address: kosAddress || null, cctvUrl: cctvUrl || null },
          settings: {
            ...prev.settings,
            rentDueDay,
            defaultRent,
            notifActive,
            notifReminder,
            notifOverdue,
            ownerPhone: ownerPhone || null,
            cctvUrl: cctvUrl || null,
            uiMode,
            waTemplate: waTemplate || null,
            updatedAt: new Date().toISOString(),
          },
        }));
      } else {
        const { error: kosErr } = await client.from("kos").update({ name: kosName, address: kosAddress || null, cctv_url: cctvUrl || null }).eq("id", data!.kos.id);
        if (kosErr) throw new Error(kosErr.message);
        await saveSettings({
          kosId: data!.kos.id,
          rentDueDay,
          defaultRent,
          notifActive,
          notifReminder,
          notifOverdue,
          ownerPhone: ownerPhone || null,
          cctvUrl: cctvUrl || null,
          uiMode,
          waTemplate: waTemplate || null,
        });
      }
      toast({ title: "Pengaturan disimpan", tone: "success" });
      setDirty(false);
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: err instanceof Error ? err.message : "Coba lagi.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddRoom() {
    if (!newRoomNumber.trim() || !newRoomName.trim()) {
      toast({ title: "Nomor dan nama kamar wajib diisi", tone: "error" });
      return;
    }
    try {
      if (isDemo || !client) {
        const newRoom = {
          id: `demo-room-${Date.now()}`,
          kosId: data!.kos.id,
          number: newRoomNumber.trim(),
          name: newRoomName.trim(),
          floor: newRoomFloor,
          monthlyRent: newRoomRent,
          status: "vacant" as const,
          sortOrder: data!.rooms.length + 1,
          createdAt: new Date().toISOString(),
        };
        updateData((prev) => ({ ...prev, rooms: [...prev.rooms, newRoom] }));
      } else {
        const { error } = await client.from("rooms").insert({
          kos_id: data!.kos.id,
          room_number: newRoomNumber.trim(),
          name: newRoomName.trim(),
          floor: newRoomFloor,
          monthly_rent: newRoomRent,
          status: "vacant",
          sort_order: data!.rooms.length + 1,
        });
        if (error) throw new Error(error.message);
        await refresh();
      }
      setShowAddRoom(false);
      setNewRoomNumber("");
      setNewRoomName("");
      setNewRoomFloor(1);
      setNewRoomRent(defaultRent);
      toast({ title: "Kamar ditambahkan", tone: "success" });
    } catch (err) {
      toast({ title: "Gagal menambah kamar", description: err instanceof Error ? err.message : "Coba lagi.", tone: "error" });
    }
  }

  async function handleDeleteRoom(roomId: string) {
    if (!confirm("Hapus kamar ini? Data penghuni & pembayaran akan terhapus.")) return;
    try {
      if (isDemo || !client) {
        updateData((prev) => ({
          ...prev,
          rooms: prev.rooms.filter((r) => r.id !== roomId),
          tenants: prev.tenants.filter((t) => t.roomId !== roomId),
          payments: prev.payments.filter((p) => p.roomId !== roomId),
        }));
      } else {
        const { error } = await client.from("rooms").delete().eq("id", roomId);
        if (error) throw new Error(error.message);
        await refresh();
      }
      toast({ title: "Kamar dihapus", tone: "success" });
    } catch (err) {
      toast({ title: "Gagal menghapus", description: err instanceof Error ? err.message : "Coba lagi.", tone: "error" });
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      if (!isDemo) {
        const c = client;
        await c?.auth.signOut();
      }
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const editingRoom = editingRoomId ? data.rooms.find((r) => r.id === editingRoomId) : null;
  const editingTenant = editingRoomId ? data.tenants.find((t) => t.roomId === editingRoomId) ?? null : null;

  return (
    <PageContainer className="lg:max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold tracking-tight text-on-surface">
            Pengaturan
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Kelola kos, kamar, dan preferensi
          </span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <MaterialIcon name="tune" className="text-[22px]" />
        </div>
      </div>

      {/* Profil Kos */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MaterialIcon name="home_work" className="text-[20px] text-primary" />
          <span className="font-headline-md text-body-lg font-bold text-on-surface">Profil Kos</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="kos-name">Nama Kos</label>
            <input id="kos-name" type="text" value={kosName} onChange={(e) => { setKosName(e.target.value); setDirty(true); }} className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="kos-address">Alamat</label>
            <input id="kos-address" type="text" value={kosAddress} onChange={(e) => { setKosAddress(e.target.value); setDirty(true); }} className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="owner-phone">No. WhatsApp Pemilik</label>
            <input id="owner-phone" type="tel" value={ownerPhone} onChange={(e) => { setOwnerPhone(e.target.value); setDirty(true); }} className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
      </Card>

      {/* Pembayaran */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MaterialIcon name="payments" className="text-[20px] text-primary" />
          <span className="font-headline-md text-body-lg font-bold text-on-surface">Pembayaran</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="due-day">Tanggal Jatuh Tempo (1-28)</label>
            <input id="due-day" type="number" min={1} max={28} value={rentDueDay} onChange={(e) => { setRentDueDay(Number(e.target.value) || 5); setDirty(true); }} className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="default-rent">Sewa Default (Rp)</label>
            <input id="default-rent" type="number" min={0} value={defaultRent} onChange={(e) => { setDefaultRent(Number(e.target.value) || 0); setDirty(true); }} className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
      </Card>

      {/* CCTV */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MaterialIcon name="videocam" className="text-[20px] text-primary" />
          <span className="font-headline-md text-body-lg font-bold text-on-surface">CCTV</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="cctv-url">URL Stream (HLS .m3u8 atau iframe)</label>
          <input id="cctv-url" type="url" value={cctvUrl} onChange={(e) => { setCctvUrl(e.target.value); setDirty(true); }} placeholder="https://..." className="h-11 rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
          <span className="font-body-sm text-[11px] text-on-surface-variant">Kosongkan jika belum terhubung. Lihat di halaman CCTV.</span>
        </div>
      </Card>

      {/* Notifikasi */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <MaterialIcon name="notifications_active" className="text-[24px] text-primary" />
            <span className="font-headline-md text-body-lg font-bold text-on-surface">Notifikasi</span>
          </div>
          <ToggleLocal checked={notifActive} onChange={(v) => { setNotifActive(v); setDirty(true); }} label="Aktifkan notifikasi" size="lg" />
        </div>
        <div className={cn("flex flex-col gap-2 transition-opacity", notifActive ? "opacity-100" : "pointer-events-none opacity-50")}>
          <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
            <span className="font-body-md text-[13px] font-semibold text-on-surface">Pengingat H-3 jatuh tempo</span>
            <ToggleLocal checked={notifReminder} onChange={(v) => { setNotifReminder(v); setDirty(true); }} label="Pengingat" tone="tertiary" />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
            <span className="font-body-md text-[13px] font-semibold text-on-surface">Peringatan kamar jatuh tempo</span>
            <ToggleLocal checked={notifOverdue} onChange={(v) => { setNotifOverdue(v); setDirty(true); }} label="Overdue" tone="danger" />
          </div>
        </div>
      </Card>

      {/* Template WA */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MaterialIcon name="chat" className="text-[20px] text-primary" />
          <span className="font-headline-md text-body-lg font-bold text-on-surface">Template Pesan WA</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="wa-template">Template (variabel: {`{nama}`}, {`{kamar}`}, {`{kos}`}, {`{bulan}`}, {`{jumlah}`}, {`{jatuhTempo}`})</label>
          <textarea
            id="wa-template"
            value={waTemplate}
            onChange={(e) => { setWaTemplate(e.target.value); setDirty(true); }}
            rows={6}
            className="rounded-xl bg-surface-container-low px-4 py-2 font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Card>

      {/* Mode UI */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MaterialIcon name="palette" className="text-[20px] text-primary" />
          <span className="font-headline-md text-body-lg font-bold text-on-surface">Tampilan</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body-md text-[13px] text-on-surface">Mode UI</span>
          <ModeToggle value={uiMode} onChange={(m) => { setUiMode(m); setDirty(true); }} />
        </div>
      </Card>

      {/* Kelola Kamar */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MaterialIcon name="meeting_room" className="text-[20px] text-primary" />
            <span className="font-headline-md text-body-lg font-bold text-on-surface">Kelola Kamar</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddRoom((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 font-body-sm text-body-sm font-semibold text-on-primary shadow-soft transition-opacity active:opacity-90"
          >
            <MaterialIcon name={showAddRoom ? "close" : "add"} className="text-[18px]" />
            {showAddRoom ? "Batal" : "Tambah Kamar"}
          </button>
        </div>

        {showAddRoom ? (
          <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input type="text" placeholder="Nomor kamar" value={newRoomNumber} onChange={(e) => setNewRoomNumber(e.target.value)} className="h-10 rounded-xl bg-surface-container-lowest px-3 font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="text" placeholder="Nama kamar" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="h-10 rounded-xl bg-surface-container-lowest px-3 font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="number" min={1} placeholder="Lantai" value={newRoomFloor} onChange={(e) => setNewRoomFloor(Number(e.target.value) || 1)} className="h-10 rounded-xl bg-surface-container-lowest px-3 font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="number" min={0} placeholder="Sewa (Rp)" value={newRoomRent} onChange={(e) => setNewRoomRent(Number(e.target.value) || 0)} className="h-10 rounded-xl bg-surface-container-lowest px-3 font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button type="button" onClick={handleAddRoom} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary font-body-sm text-body-sm font-semibold text-on-primary shadow-soft transition-opacity active:opacity-90">
              <MaterialIcon name="add" className="text-[18px]" />
              Simpan Kamar Baru
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container font-mono font-bold text-on-surface">
                  {room.number}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-body-md text-[13px] font-semibold text-on-surface">{room.name}</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    {room.status === "occupied" ? "Terisi" : room.status === "vacant" ? "Kosong" : "Maintenance"} • {formatRupiah(room.monthlyRent)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingRoomId(room.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container active:scale-95"
                  aria-label="Edit kamar"
                >
                  <MaterialIcon name="edit" className="text-[16px]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRoom(room.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-tint text-danger-text transition-colors hover:bg-danger/10 active:scale-95"
                  aria-label="Hapus kamar"
                >
                  <MaterialIcon name="delete" className="text-[16px]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {editingRoomId && editingRoom ? (
          <RoomEditForm
            room={editingRoom}
            tenant={editingTenant}
            onSave={async (payload) => {
              // reuse RoomDetailView save logic inline
              if (isDemo || !client) {
                updateData((prev) => {
                  const rooms = prev.rooms.map((r) =>
                    r.id === editingRoom.id
                      ? { ...r, number: payload.room.number, name: payload.room.name, floor: payload.room.floor, monthlyRent: payload.room.monthlyRent, status: payload.room.status }
                      : r,
                  );
                  let tenants = prev.tenants.filter((t) => t.roomId !== editingRoom.id);
                  if (payload.tenant && payload.room.status === "occupied") {
                    const existing = prev.tenants.find((t) => t.roomId === editingRoom.id);
                    tenants = [
                      ...tenants,
                      {
                        id: existing?.id ?? `demo-tenant-${editingRoom.id}`,
                        kosId: prev.kos.id,
                        roomId: editingRoom.id,
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
                const { error: roomErr } = await client.from("rooms").update({
                  room_number: payload.room.number,
                  name: payload.room.name,
                  floor: payload.room.floor,
                  monthly_rent: payload.room.monthlyRent,
                  status: payload.room.status,
                }).eq("id", editingRoom.id);
                if (roomErr) throw new Error(roomErr.message);
                if (payload.room.status !== "occupied") {
                  await client.from("tenants").delete().eq("room_id", editingRoom.id);
                } else if (payload.tenant) {
                  const { data: existing } = await client.from("tenants").select("id").eq("room_id", editingRoom.id).maybeSingle();
                  const tp = {
                    kos_id: data!.kos.id,
                    room_id: editingRoom.id,
                    full_name: payload.tenant.fullName,
                    phone: payload.tenant.phone || null,
                    move_in_date: payload.tenant.moveInDate || null,
                    monthly_rent: payload.tenant.monthlyRent,
                    due_day: payload.tenant.dueDay,
                    notes: payload.tenant.notes || null,
                  };
                  if (existing?.id) {
                    const { error } = await client.from("tenants").update(tp).eq("id", existing.id);
                    if (error) throw new Error(error.message);
                  } else {
                    const { error } = await client.from("tenants").insert(tp);
                    if (error) throw new Error(error.message);
                  }
                }
                await refresh();
              }
              setEditingRoomId(null);
              toast({ title: "Perubahan disimpan", tone: "success" });
            }}
            onCancel={() => setEditingRoomId(null)}
          />
        ) : null}
      </Card>

      {/* Logout */}
      <Card className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
            <MaterialIcon name="logout" className="text-[18px]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-body-md text-[13px] font-semibold text-on-surface">Keluar dari akun</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              {isDemo ? "Kembali ke layar masuk (mode demo)" : "Akhiri sesi pada perangkat ini"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="shrink-0 rounded-lg bg-surface-container-high px-3 py-2 font-body-sm text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container active:scale-95 disabled:opacity-60"
        >
          {signingOut ? "Keluar…" : "Keluar"}
        </button>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-40 -mx-gutter bg-surface/90 px-gutter py-2 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving || !dirty}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl font-headline-md text-body-sm font-bold shadow-float transition-all active:scale-[0.98]",
            dirty && !saving
              ? "bg-primary text-on-primary hover:bg-primary-container"
              : "cursor-not-allowed bg-surface-container-high text-on-surface-variant",
          )}
        >
          <MaterialIcon name={saving ? "sync" : "cloud_sync"} className="text-[24px]" />
          {saving ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </div>
    </PageContainer>
  );
}
