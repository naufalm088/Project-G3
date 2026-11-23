import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { AppDataProvider } from "@/components/providers/app-data-provider";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppDataProvider>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1 pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </AppDataProvider>
  );
}
