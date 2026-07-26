import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat, Noto_Sans_Armenian } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

const notoArmenian = Noto_Sans_Armenian({
  variable: "--font-noto-arm",
  subsets: ["armenian"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "White Shop",
    template: "%s · White Shop",
  },
  description: "Multilingual e-commerce storefront",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hy" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${notoArmenian.variable} flex min-h-dvh flex-col overflow-x-hidden antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
