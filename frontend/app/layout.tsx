import { WalletButton } from "@/components/WalletButton";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TempoID — Tempo Name Service",
  description:
    "Register human-readable .tempo names on the Tempo blockchain. Send, receive, trade — simply.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "TempoID — Tempo Name Service",
    description:
      "Register human-readable .tempo names on the Tempo blockchain. Send, receive, trade — simply.",
    siteName: "TempoID",
    type: "website",
    url: "https://tempoid.xyz",
  },
  twitter: {
    card: "summary_large_image",
    title: "TempoID — Tempo Name Service",
    description:
      "Register human-readable .tempo names on the Tempo blockchain.",
    creator: "@tempoidapp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          {/* Nav */}
          <nav className="fixed top-0 left-0 right-0 z-50 bg-bg">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-1">
                <span className="text-primary font-serif text-lg md:text-xl tracking-tight">
                  tempo<span className="opacity-40">|</span>id
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-8">
                <Link href="/" className="text-sm text-secondary hover:text-primary transition-colors">Search</Link>
                <Link href="/send" className="text-sm text-secondary hover:text-primary transition-colors">Send</Link>
                <Link href="/marketplace" className="text-sm text-secondary hover:text-primary transition-colors">Marketplace</Link>
                <Link href="/account" className="text-sm text-secondary hover:text-primary transition-colors">Account</Link>
                <Link href="/developers" className="text-sm text-secondary hover:text-primary transition-colors">Developers</Link>
                <WalletButton />
              </div>
              <div className="flex md:hidden items-center gap-4">
                <Link href="/send" className="text-xs text-secondary">Send</Link>
                <Link href="/marketplace" className="text-xs text-secondary">Market</Link>
                <Link href="/account" className="text-xs text-secondary">Account</Link>
                <Link href="/developers" className="text-xs text-secondary">Dev</Link>
                <WalletButton />
              </div>

            </div>
            <div className="border-b border-border" />
          </nav>

          {/* Content */}
          <main className="pt-14 md:pt-16">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">{children}</div>
          </main>

          {/* Footer */}
          <footer className="mt-20 md:mt-32 border-t border-border">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-sm text-tertiary font-serif">tempo|id</span>
              <div className="flex items-center gap-6 text-sm text-tertiary flex-wrap justify-center">
                <a
                  href="https://x.com/tempoidapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Twitter
                </a>
                <a
                  href="https://github.com/KendineCrypto/tempoid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://www.mppscan.com/server/2a0fa682b26a3951bcf1b55f2552cc48698def04d8634618bdbdd0da86d80767"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  MPPscan
                </a>
                <a
                  href="https://explore.tempo.xyz/address/0x9a56ae2275c85aab13533c00d2cfa42c619bc3a9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Explorer
                </a>
                <a
                  href="https://tempo.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Tempo
                </a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
