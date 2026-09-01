import type { Metadata, Viewport } from "next";
import { Montserrat, Noto_Sans_Armenian } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

const notoArmenian = Noto_Sans_Armenian({
  variable: "--font-noto-arm",
  subsets: ["armenian"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

/** Figma display face — Mirage Expanded by Vahe Tamrazyan (see LICENSE). */
const mirageExpanded = localFont({
  src: "../assets/fonts/Mirage-Expanded.otf",
  variable: "--font-mirage",
  display: "swap",
  weight: "400",
  style: "normal",
});

export const metadata: Metadata = {
  title: {
    default: "Degusto",
    template: "%s · Degusto",
  },
  description: "Multilingual e-commerce storefront",
};

/** Disable pinch / double-tap zoom on mobile viewports. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hy" className="h-full" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${notoArmenian.variable} ${mirageExpanded.variable} flex min-h-dvh flex-col overflow-x-hidden antialiased touch-manipulation`}
      >
        {children}
      </body>
    </html>
  );
}
