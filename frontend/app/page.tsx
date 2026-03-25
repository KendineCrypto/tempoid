"use client";

import { SearchBar } from "@/components/SearchBar";
import Link from "next/link";

const PRICING = [
  { chars: "1-3 chars", price: "$20", example: "abc.tempo", note: "Premium" },
  { chars: "4 chars", price: "$5", example: "name.tempo", note: null },
  { chars: "5+ chars", price: "$1", example: "tempoid.tempo", note: null },
];

const USE_CASES = [
  {
    title: "Send by name",
    desc: "Send pathUSD to anyone using their .tempo name. No more copying wallet addresses.",
  },
  {
    title: "On-chain identity",
    desc: "Set your bio, avatar, and social links. All stored on-chain, owned by you.",
  },
  {
    title: "Trade names",
    desc: "List your .tempo name on the marketplace. Buy and sell with atomic payments.",
  },
];

const AGENT_STEPS = [
  { step: "01", title: "Discover", code: "npx agentcash add https://tempoid.xyz" },
  { step: "02", title: "Check", code: "GET /api/mpp/check/agentname" },
  { step: "03", title: "Register", code: "POST /api/mpp/register" },
];

export default function HomePage() {
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center max-w-[720px] mx-auto w-full px-4 py-16 md:py-24">
        <h1 className="font-serif text-[48px] md:text-[72px] leading-[0.95] tracking-tight text-primary mb-4">
          Your name,
          <br />
          on Tempo
        </h1>
        <p className="text-secondary text-sm md:text-lg leading-relaxed mb-10 md:mb-14 max-w-[460px]">
          Register human-readable{" "}
          <span className="text-primary font-medium">.tempo</span> names on the
          Tempo blockchain. Send payments by name, not by address.
        </p>

        <SearchBar />
      </div>

      {/* What is TempoID */}
      <div className="max-w-[720px] mx-auto w-full px-4 mb-16 md:mb-24">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          What is TempoID
        </p>
        <div className="bg-white p-6 md:p-8">
          <p className="text-sm md:text-base text-secondary leading-relaxed">
            TempoID is the name service for the Tempo blockchain. It turns wallet
            addresses like <span className="font-mono text-xs text-tertiary">0x767b...d3f9</span> into
            human-readable names like <span className="font-medium text-primary">yourname.tempo</span>.
            Register a name, send payments by name, trade names on the marketplace —
            all on-chain.
          </p>
        </div>
      </div>

      {/* Use Cases */}
      <div className="max-w-[720px] mx-auto w-full px-4 mb-16 md:mb-24">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          What you can do
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border">
          {USE_CASES.map((uc) => (
            <div key={uc.title} className="bg-white p-6">
              <p className="text-sm font-medium text-primary">{uc.title}</p>
              <p className="text-xs text-tertiary mt-2 leading-relaxed">
                {uc.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-[720px] mx-auto w-full px-4 mb-16 md:mb-24">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          Pricing
        </p>
        <div className="grid grid-cols-3 gap-[1px] bg-border">
          {PRICING.map((p) => (
            <div key={p.chars} className="bg-white p-4 md:p-6 text-center">
              <p className="text-xs text-tertiary">{p.chars}</p>
              <p className="text-2xl md:text-3xl font-serif text-primary mt-2">
                {p.price}
                <span className="text-xs text-tertiary font-sans">/yr</span>
              </p>
              {p.note && (
                <p className="text-[10px] text-tertiary mt-1 uppercase tracking-wider">
                  {p.note}
                </p>
              )}
              <p className="text-[11px] text-muted mt-2 font-mono">{p.example}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-3">
          Paid in pathUSD on Tempo. All names renew annually.
        </p>
      </div>

      {/* How it works */}
      <div className="max-w-[720px] mx-auto w-full px-4 mb-16 md:mb-24">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border">
          <div className="bg-white p-6">
            <p className="text-xs text-tertiary font-mono">01</p>
            <p className="text-sm font-medium text-primary mt-2">Search</p>
            <p className="text-xs text-tertiary mt-1 leading-relaxed">
              Find your perfect .tempo name
            </p>
          </div>
          <div className="bg-white p-6">
            <p className="text-xs text-tertiary font-mono">02</p>
            <p className="text-sm font-medium text-primary mt-2">Register</p>
            <p className="text-xs text-tertiary mt-1 leading-relaxed">
              Connect your wallet and pay with pathUSD
            </p>
          </div>
          <div className="bg-white p-6">
            <p className="text-xs text-tertiary font-mono">03</p>
            <p className="text-sm font-medium text-primary mt-2">Use</p>
            <p className="text-xs text-tertiary mt-1 leading-relaxed">
              Send, receive, and trade with your name
            </p>
          </div>
        </div>
      </div>

      {/* AI Agents Section */}
      <div className="max-w-[720px] mx-auto w-full px-4 mb-16 md:mb-24">
        <div className="bg-primary text-white p-6 md:p-8">
          <p className="text-xs uppercase tracking-wider opacity-50 mb-4">
            For AI Agents
          </p>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-[1.1] mb-3">
            Your agent needs
            <br />
            an identity too
          </h2>
          <p className="text-sm opacity-70 leading-relaxed mb-6 max-w-[480px]">
            AI agents can register .tempo domains autonomously via MPP.
            No frontend, no human in the loop. Just one command.
          </p>

          <div className="space-y-3 mb-6">
            {AGENT_STEPS.map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="text-[10px] font-mono opacity-40 mt-1">{s.step}</span>
                <div>
                  <p className="text-xs font-medium">{s.title}</p>
                  <p className="text-[11px] font-mono opacity-50 mt-0.5">{s.code}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://tempoid.xyz/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-4 py-2 border border-white/20 hover:border-white/40 transition-colors text-center"
            >
              Read llms.txt
            </a>
            <a
              href="https://tempoid.xyz/api/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-4 py-2 border border-white/20 hover:border-white/40 transition-colors text-center"
            >
              OpenAPI Spec
            </a>
            <a
              href="https://www.mppscan.com/server/2a0fa682b26a3951bcf1b55f2552cc48698def04d8634618bdbdd0da86d80767"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-4 py-2 border border-white/20 hover:border-white/40 transition-colors text-center"
            >
              MPPscan
            </a>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-[720px] mx-auto w-full px-4 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[11px] text-muted">
          <p>
            Contract:{" "}
            <a
              href="https://explore.tempo.xyz/address/0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:text-tertiary transition-colors"
            >
              0x9A56...Bc3A9
            </a>
            {" "}on Tempo Mainnet
          </p>
          <div className="flex gap-4">
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
      </div>
    </div>
  );
}
