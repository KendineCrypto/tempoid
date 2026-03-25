"use client";

import { SearchBar } from "@/components/SearchBar";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero — full viewport */}
      <section className="min-h-[90vh] flex flex-col justify-center max-w-[800px] mx-auto w-full px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-tertiary mb-8">
          Tempo Name Service
        </p>
        <h1 className="font-serif text-[52px] md:text-[80px] leading-[0.92] tracking-tight text-primary mb-6">
          Your name,
          <br />
          on Tempo
        </h1>
        <p className="text-secondary text-base md:text-lg leading-relaxed mb-12 max-w-[480px]">
          Human-readable names for the Tempo blockchain.
          Send payments by name, not by address.
        </p>
        <div className="max-w-[520px]">
          <SearchBar />
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[800px] mx-auto w-full px-6">
        <div className="h-[1px] bg-border" />
      </div>

      {/* What is TempoID */}
      <section className="max-w-[800px] mx-auto w-full px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-tertiary mb-4">
              About
            </p>
            <h2 className="font-serif text-[32px] md:text-[40px] leading-[1.05] text-primary">
              What is TempoID
            </h2>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm text-secondary leading-[1.8]">
              TempoID turns wallet addresses into human-readable names.
              Instead of copying <span className="font-mono text-[12px] text-tertiary">0x767b...d3f9</span>,
              you share <span className="font-medium text-primary">yourname.tempo</span>.
            </p>
            <p className="text-sm text-secondary leading-[1.8] mt-4">
              Register a name, send pathUSD to anyone by name, trade names
              on the built-in marketplace. Everything on-chain, everything yours.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[800px] mx-auto w-full px-6">
        <div className="h-[1px] bg-border" />
      </div>

      {/* Features */}
      <section className="max-w-[800px] mx-auto w-full px-6 py-20 md:py-28">
        <p className="text-[11px] uppercase tracking-[0.2em] text-tertiary mb-12">
          Features
        </p>
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
            <p className="text-sm font-medium text-primary">Send by name</p>
            <p className="text-sm text-secondary leading-[1.8]">
              Send pathUSD to any .tempo name. No wallet addresses to memorize or copy-paste.
            </p>
          </div>
          <div className="h-[1px] bg-border-light" />
          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
            <p className="text-sm font-medium text-primary">On-chain identity</p>
            <p className="text-sm text-secondary leading-[1.8]">
              Set your bio, avatar, and social links. All metadata is stored on-chain and owned by you.
            </p>
          </div>
          <div className="h-[1px] bg-border-light" />
          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
            <p className="text-sm font-medium text-primary">Marketplace</p>
            <p className="text-sm text-secondary leading-[1.8]">
              List your name for sale or buy names from others. Atomic payments with 2.5% protocol fee.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[800px] mx-auto w-full px-6">
        <div className="h-[1px] bg-border" />
      </div>

      {/* Pricing */}
      <section className="max-w-[800px] mx-auto w-full px-6 py-20 md:py-28">
        <p className="text-[11px] uppercase tracking-[0.2em] text-tertiary mb-12">
          Pricing
        </p>
        <div className="grid grid-cols-3 gap-8 md:gap-12">
          <div>
            <p className="font-serif text-[36px] md:text-[48px] text-primary leading-none">
              $20
            </p>
            <p className="text-xs text-tertiary mt-2">per year</p>
            <p className="text-[11px] text-muted mt-4">1 — 3 characters</p>
            <p className="font-mono text-[11px] text-muted mt-1">abc.tempo</p>
          </div>
          <div>
            <p className="font-serif text-[36px] md:text-[48px] text-primary leading-none">
              $5
            </p>
            <p className="text-xs text-tertiary mt-2">per year</p>
            <p className="text-[11px] text-muted mt-4">4 characters</p>
            <p className="font-mono text-[11px] text-muted mt-1">name.tempo</p>
          </div>
          <div>
            <p className="font-serif text-[36px] md:text-[48px] text-primary leading-none">
              $1
            </p>
            <p className="text-xs text-tertiary mt-2">per year</p>
            <p className="text-[11px] text-muted mt-4">5+ characters</p>
            <p className="font-mono text-[11px] text-muted mt-1">tempoid.tempo</p>
          </div>
        </div>
        <p className="text-[11px] text-muted mt-8">
          Paid in pathUSD on Tempo. All names renew annually.
        </p>
      </section>

      {/* Divider */}
      <div className="max-w-[800px] mx-auto w-full px-6">
        <div className="h-[1px] bg-border" />
      </div>

      {/* How it works */}
      <section className="max-w-[800px] mx-auto w-full px-6 py-20 md:py-28">
        <p className="text-[11px] uppercase tracking-[0.2em] text-tertiary mb-12">
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p className="font-mono text-[11px] text-muted mb-3">01</p>
            <p className="text-sm font-medium text-primary mb-2">Search</p>
            <p className="text-sm text-tertiary leading-[1.7]">
              Find your .tempo name. Check availability instantly.
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] text-muted mb-3">02</p>
            <p className="text-sm font-medium text-primary mb-2">Register</p>
            <p className="text-sm text-tertiary leading-[1.7]">
              Connect your wallet and pay with pathUSD.
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] text-muted mb-3">03</p>
            <p className="text-sm font-medium text-primary mb-2">Own</p>
            <p className="text-sm text-tertiary leading-[1.7]">
              Your name is on-chain. Send, receive, and trade freely.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[800px] mx-auto w-full px-6">
        <div className="h-[1px] bg-border" />
      </div>

      {/* AI Agents */}
      <section className="max-w-[800px] mx-auto w-full px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-tertiary mb-4">
              For AI Agents
            </p>
            <h2 className="font-serif text-[32px] md:text-[40px] leading-[1.05] text-primary">
              Your agent
              <br />
              needs a name
            </h2>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm text-secondary leading-[1.8]">
              AI agents can register .tempo domains autonomously via MPP.
              No frontend needed, no human in the loop.
            </p>
            <div className="mt-6 p-4 bg-primary text-white font-mono text-[12px] leading-[1.8] overflow-x-auto">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">Add to your agent</p>
              <p>npx agentcash add https://tempoid.xyz</p>
            </div>
            <div className="mt-4 flex gap-4">
              <a
                href="/llms.txt"
                target="_blank"
                className="text-[11px] text-tertiary hover:text-primary transition-colors"
              >
                llms.txt ↗
              </a>
              <a
                href="/api/openapi.json"
                target="_blank"
                className="text-[11px] text-tertiary hover:text-primary transition-colors"
              >
                OpenAPI ↗
              </a>
              <a
                href="https://www.mppscan.com/server/2a0fa682b26a3951bcf1b55f2552cc48698def04d8634618bdbdd0da86d80767"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-tertiary hover:text-primary transition-colors"
              >
                MPPscan ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[800px] mx-auto w-full px-6">
        <div className="h-[1px] bg-border" />
      </div>

      {/* Footer */}
      <section className="max-w-[800px] mx-auto w-full px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-[11px] text-muted">
            <a
              href="https://explore.tempo.xyz/address/0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:text-tertiary transition-colors"
            >
              0x9A56...Bc3A9
            </a>
            <span className="mx-2">·</span>
            Tempo Mainnet
          </div>
          <div className="flex gap-6 text-[11px] text-muted">
            <a
              href="https://github.com/KendineCrypto/tempoid"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-tertiary transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://twitter.com/tempoidapp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-tertiary transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
