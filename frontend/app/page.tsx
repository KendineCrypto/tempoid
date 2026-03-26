"use client";

import { SearchBar } from "@/components/SearchBar";

const PRICING = [
  { chars: "1-3 chars", price: "$20", example: "abc.tempo" },
  { chars: "4 chars", price: "$5", example: "name.tempo" },
  { chars: "5+ chars", price: "$1", example: "tempoid.tempo" },
];

const STEPS = [
  { step: "01", title: "Search", desc: "Find your perfect .tempo name" },
  { step: "02", title: "Register", desc: "Pay with pathUSD on Tempo" },
  { step: "03", title: "Use", desc: "Send, receive, and trade with your name" },
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
          Tempo blockchain.
        </p>

        <SearchBar />
      </div>

      {/* Pricing */}
      <div className="max-w-[720px] mx-auto w-full px-4 mb-16 md:mb-24">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          Pricing
        </p>
        <div className="grid grid-cols-3 gap-4">
          {PRICING.map((p) => (
            <div key={p.chars} className="bg-white/80 backdrop-blur-sm p-4 md:p-6 text-center rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
              <p className="text-xs text-tertiary">{p.chars}</p>
              <p className="text-2xl md:text-3xl font-serif text-primary mt-2">
                {p.price}
                <span className="text-xs text-tertiary font-sans">/yr</span>
              </p>
              <p className="text-[11px] text-muted mt-2 font-mono">{p.example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-[720px] mx-auto w-full px-4 mb-16 md:mb-24">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <div key={s.step} className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
              <p className="text-xs text-tertiary font-mono">{s.step}</p>
              <p className="text-sm font-medium text-primary mt-2">{s.title}</p>
              <p className="text-xs text-tertiary mt-1 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Agents */}
      <div className="max-w-[720px] mx-auto w-full px-4 mb-16 md:mb-24">
        <div className="bg-primary text-white p-6 md:p-8 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
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
            <div className="flex items-start gap-3">
              <span className="text-[10px] font-mono opacity-40 mt-1">01</span>
              <div>
                <p className="text-xs font-medium">Discover</p>
                <p className="text-[11px] font-mono opacity-50 mt-0.5">npx agentcash add https://tempoid.xyz</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[10px] font-mono opacity-40 mt-1">02</span>
              <div>
                <p className="text-xs font-medium">Check</p>
                <p className="text-[11px] font-mono opacity-50 mt-0.5">GET /api/mpp/check/agentname</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[10px] font-mono opacity-40 mt-1">03</span>
              <div>
                <p className="text-xs font-medium">Register</p>
                <p className="text-[11px] font-mono opacity-50 mt-0.5">POST /api/mpp/register</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-4 py-2 border border-white/20 hover:border-white/40 transition-colors text-center"
            >
              Read llms.txt
            </a>
            <a
              href="/api/openapi.json"
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
    </div>
  );
}
