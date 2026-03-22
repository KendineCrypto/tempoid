"use client";

import { SearchBar } from "@/components/SearchBar";

export default function HomePage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      {/* Hero */}
      <div className="max-w-[640px] mx-auto w-full">
        <h1 className="font-serif text-[40px] md:text-[72px] leading-[1] tracking-tight text-primary mb-4">
          Your name,
          <br />
          on Tempo
        </h1>
        <p className="text-secondary text-sm md:text-base leading-relaxed mb-10 md:mb-16 max-w-[440px]">
          Register human-readable .tempo names instead of long wallet
          addresses. Send, receive, share simply.
        </p>

        {/* Search */}
        <SearchBar />
      </div>

      {/* Pricing */}
      <div className="max-w-[640px] mx-auto w-full mt-16 md:mt-24">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          Pricing
        </p>
        <div className="grid grid-cols-3 gap-[1px] bg-border">
          <PriceBlock chars="3 chars" price={20} example="abc" />
          <PriceBlock chars="4 chars" price={5} example="name" />
          <PriceBlock chars="5+ chars" price={1} example="tempo" />
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-[640px] mx-auto w-full mt-16 md:mt-24">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          How it works
        </p>
        <div className="space-y-[1px] bg-border">
          <Step num="01" title="Search" desc="Find an available .tempo name" />
          <Step
            num="02"
            title="Approve"
            desc="Approve pathUSD payment"
          />
          <Step
            num="03"
            title="Register"
            desc="Confirm the transaction and claim your name"
          />
        </div>
      </div>
    </div>
  );
}

function PriceBlock({
  chars,
  price,
  example,
}: {
  chars: string;
  price: number;
  example: string;
}) {
  return (
    <div className="bg-white p-6">
      <p className="text-xs text-tertiary">{chars}</p>
      <p className="text-2xl font-serif text-primary mt-2">
        ${price}
        <span className="text-sm text-tertiary font-sans">/yr</span>
      </p>
      <p className="text-xs text-muted mt-3 font-serif">{example}.tempo</p>
    </div>
  );
}

function Step({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white p-6 flex items-start gap-6">
      <span className="text-xs text-muted font-sans">{num}</span>
      <div>
        <p className="text-sm font-medium text-primary">{title}</p>
        <p className="text-sm text-tertiary mt-1">{desc}</p>
      </div>
    </div>
  );
}
