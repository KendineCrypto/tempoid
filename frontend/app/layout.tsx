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
    title: "TempID — Tempo Name Service",
    description:
      "Register human-readable .tempo names on the Tempo blockchain. Send, receive, trade — simply.",
    siteName: "TempID",
    type: "website",
    url: "https://tempoid.xyz",
  },
  twitter: {
    card: "summary_large_image",
    title: "TempID — Tempo Name Service",
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

              <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-6 text-sm text-tertiary">
                <a
                  href="https://x.com/tempoidapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  @tempoidapp →
                </a>
                <a
                  href="https://explore.tempo.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Explorer →
                </a>
                <a
                  href="https://tempo.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Tempo →
                </a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
