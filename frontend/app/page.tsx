"use client";

import { SearchBar } from "@/components/SearchBar";

const PRICING = [
  { chars: "3 chars", price: "$15", originalPrice: "$20", example: "abc.tempo" },
  { chars: "4 chars", price: "$3.75", originalPrice: "$5", example: "name.tempo" },
  { chars: "5+ chars", price: "$1", originalPrice: null, example: "tempoid.tempo" },
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
        <div className="flex items-center gap-3 mb-6">
          <p className="text-xs text-tertiary uppercase tracking-wider">
            Pricing
          </p>
          <span className="text-[10px] font-medium text-white bg-primary px-2 py-0.5 uppercase tracking-wider">
            Launch Day — 25% Off
          </span>
        </div>
        <div className="grid grid-cols-3 gap-[1px] bg-border">
          {PRICING.map((p) => (
            <div key={p.chars} className="bg-white p-4 md:p-6 text-center">
              <p className="text-xs text-tertiary">{p.chars}</p>
              <p className="text-2xl md:text-3xl font-serif text-primary mt-2">
                {p.price}
                <span className="text-xs text-tertiary font-sans">/yr</span>
              </p>
              {p.originalPrice && (
                <p className="text-xs text-muted mt-1 line-through">
                  {p.originalPrice}/yr
                </p>
              )}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border">
          {STEPS.map((s) => (
            <div key={s.step} className="bg-white p-6">
              <p className="text-xs text-tertiary font-mono">{s.step}</p>
              <p className="text-sm font-medium text-primary mt-2">{s.title}</p>
              <p className="text-xs text-tertiary mt-1 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
