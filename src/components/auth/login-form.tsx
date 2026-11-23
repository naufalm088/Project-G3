"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { MaterialIcon } from "@/components/ui/material-icon";
import { DEMO_MODE, USE_SUPABASE } from "@/lib/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("Bu Suwanti");
  const [kosName, setKosName] = useState("Kos Melati Harmoni");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isDemo = DEMO_MODE || !USE_SUPABASE;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (isDemo) {
      router.replace(nextPath);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Supabase belum dikonfigurasi. Aktifkan kredensial di .env.local.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const { data, error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: "Pemilik Kos" },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        if (data.session) {
          await client.rpc("provision_owner", { p_kos_name: kosName });
          router.replace(nextPath);
          router.refresh();
          return;
        }

        setInfo(
          "Akun dibuat. Periksa email untuk konfirmasi, lalu masuk. Setelah masuk, kos akan dibuat otomatis.",
        );
        setMode("login");
      } else {
        const { error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw new Error(signInError.message);
        }

        try {
          await client.rpc("provision_owner", { p_kos_name: kosName || "Kos Saya" });
        } catch {
          // Abaikan: kos mungkin sudah ada atau RPC belum tersedia.
        }

        router.replace(nextPath);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan autentikasi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer className="min-h-dvh justify-center">
      <div className="flex flex-col items-center gap-space-md">
        <div className="flex items-center gap-space-sm">
          <Logo className="h-12 w-12" />
          <div className="flex flex-col">
            <span className="font-headline-md text-body-lg font-bold text-on-surface">
              Monitoring Kos Ijo
            </span>
            <span className="font-label-status text-label-status uppercase tracking-wider text-on-surface-variant">
              Kelompok G3
            </span>
          </div>
        </div>

        <Card className="flex w-full flex-col gap-space-md">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface">
              {mode === "login" ? "Masuk ke Dashboard" : "Buat Akun Pemilik Kos"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isDemo
                ? "Mode demo aktif. Tekan tombol untuk masuk tanpa akun."
                : mode === "login"
                  ? "Gunakan akun Supabase Anda untuk mengakses data kos."
                  : "Daftar dengan email dan password, lalu kos akan dibuat otomatis."}
            </p>
          </div>

          {isDemo ? (
            <button
              type="button"
              onClick={() => router.replace(nextPath)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-headline-md text-body-md font-bold text-on-primary shadow-soft transition-opacity active:opacity-90"
            >
              <MaterialIcon name="login" className="text-[20px]" />
              Masuk Mode Demo
            </button>
          ) : (
            <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
              <div className="flex rounded-xl bg-surface-container-low p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={cn(
                    "flex-1 rounded-lg py-2 font-body-sm text-body-sm font-semibold transition-all",
                    mode === "login"
                      ? "bg-surface-container-lowest text-primary shadow-soft"
                      : "text-on-surface-variant",
                  )}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={cn(
                    "flex-1 rounded-lg py-2 font-body-sm text-body-sm font-semibold transition-all",
                    mode === "register"
                      ? "bg-surface-container-lowest text-primary shadow-soft"
                      : "text-on-surface-variant",
                  )}
                >
                  Daftar
                </button>
              </div>

              {mode === "register" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="font-body-sm font-medium text-on-surface-variant"
                      htmlFor="full-name"
                    >
                      Nama Pemilik
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      className="h-12 w-full rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="font-body-sm font-medium text-on-surface-variant"
                      htmlFor="kos-name"
                    >
                      Nama Kos
                    </label>
                    <input
                      id="kos-name"
                      type="text"
                      value={kosName}
                      onChange={(event) => setKosName(event.target.value)}
                      required
                      className="h-12 w-full rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label className="font-body-sm font-medium text-on-surface-variant" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-12 w-full rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="font-body-sm font-medium text-on-surface-variant"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  className="h-12 w-full rounded-xl bg-surface-container-low px-4 font-body-md text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {error ? (
                <div className="rounded-lg bg-danger-tint px-3 py-2 font-body-sm text-[12px] text-danger-text">
                  {error}
                </div>
              ) : null}

              {info ? (
                <div className="rounded-lg bg-tertiary-container/20 px-3 py-2 font-body-sm text-[12px] text-tertiary">
                  {info}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex h-12 w-full items-center justify-center gap-2 rounded-xl font-headline-md text-body-md font-bold shadow-soft transition-all active:scale-95",
                  loading
                    ? "cursor-wait bg-surface-container-high text-on-surface-variant"
                    : "bg-primary text-on-primary hover:bg-primary-container",
                )}
              >
                <MaterialIcon name={loading ? "sync" : "login"} className="text-[20px]" />
                {loading
                  ? "Memproses…"
                  : mode === "login"
                    ? "Masuk"
                    : "Daftar & Buat Kos"}
              </button>
            </form>
          )}

          {!isDemo ? (
            <p className="text-center font-body-sm text-[11px] text-on-surface-variant">
              Belum punya akun? Pilih tab &quot;Daftar&quot;. Kos &amp; 4 kamar default akan dibuat
              otomatis.
            </p>
          ) : null}
        </Card>
      </div>
    </PageContainer>
  );
}
