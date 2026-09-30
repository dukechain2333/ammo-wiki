import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { UnitsProvider } from "@/components/units";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
const cond = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-plex-cond" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: factory and military ammunition data`, template: `%s · ${SITE_NAME}` },
  description:
    "An open, sourced reference of factory and military ammunition: bullet weight, ballistic coefficient and muzzle velocity by barrel length. Edit it on GitHub.",
  openGraph: { siteName: SITE_NAME, type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${cond.variable} ${mono.variable}`}>
      <body>
        <UnitsProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </UnitsProvider>
      </body>
    </html>
  );
}
