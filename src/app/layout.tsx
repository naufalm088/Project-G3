import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  applicationName: "Monitoring Kos Ijo",
  title: {
    default: "Monitoring Kos Ijo",
    template: "%s · Monitoring Kos Ijo",
  },
  description:
    "Dashboard monitoring listrik kos berbasis IoT: estimasi tagihan, tren pemakaian, dan peringatan dini untuk pemilik kos.",
  authors: [
    { name: "Naufal Mirza Aldilla" },
    { name: "Gagas Cahya Kamajengan" },
    { name: "Julia Ayu Siagian" },
  ],
  keywords: ["IoT", "listrik kos", "monitoring energi", "dashboard", "ESP32", "PZEM-004T"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#00685f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${jetbrains.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-surface font-sans text-on-surface antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
