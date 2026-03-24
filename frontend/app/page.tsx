"use client";

import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { shortenAddress } from "@/lib/utils";

const FEATURES = [
  {
    title: "Human-Readable Names",
    desc: "Replace 0x742d... with tempoid.tempo",
  },
  {
    title: "Send via Name",
    desc: "Send pathUSD to any .tempo name directly",
  },
  {
    title: "Marketplace",
    desc: "Buy and sell premium .tempo names",
  },
];

const LAUNCH_TIME = new Date("2026-03-24T20:00:00Z").getTime();

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, ended: false });

  useEffect(() => {
    function calc() {
      const diff = LAUNCH_TIME - Date.now();
      if (diff <= 0) return { h: 0, m: 0, s: 0, ended: true };
      return {
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        ended: false,
      };
    }
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export default function WaitlistPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [mounted, setMounted] = useState(false);
  const [joined, setJoined] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const countdown = useCountdown();

  useEffect(() => {
    setMounted(true);

    // Load waitlist data from localStorage
    const stored = localStorage.getItem("tempoid_waitlist");
    const data = stored ? JSON.parse(stored) : { addresses: [], baseCount: 0 };

    // Set initial base count if first time
    if (!data.baseCount) {
      data.baseCount = 127 + Math.floor(Math.random() * 50);
      localStorage.setItem("tempoid_waitlist", JSON.stringify(data));
    }

    setWaitlistCount(data.baseCount + data.addresses.length);

    // Check if current wallet already joined
    if (address && data.addresses.includes(address.toLowerCase())) {
      setJoined(true);
    }
  }, [address]);

  const handleJoin = () => {
    if (!address) return;

    const stored = localStorage.getItem("tempoid_waitlist");
    const data = stored ? JSON.parse(stored) : { addresses: [], baseCount: 147 };

    const addr = address.toLowerCase();
    if (!data.addresses.includes(addr)) {
      data.addresses.push(addr);
      localStorage.setItem("tempoid_waitlist", JSON.stringify(data));
      setWaitlistCount(data.baseCount + data.addresses.length);
    }

    setJoined(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center relative overflow-hidden">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2"
                style={{
                  background: ["#000", "#666", "#999", "#ccc"][
                    Math.floor(Math.random() * 4)
                  ],
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Hero */}
      <div className="max-w-[640px] mx-auto w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-white mb-8 md:mb-12">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-secondary uppercase tracking-wider">
            Coming Soon
          </span>
        </div>

        <h1 className="font-serif text-[48px] md:text-[80px] leading-[0.95] tracking-tight text-primary mb-6">
          Your name,
          <br />
          on Tempo
        </h1>

        <p className="text-secondary text-sm md:text-lg leading-relaxed mb-8 md:mb-10 max-w-[460px] mx-auto">
          Register human-readable{" "}
          <span className="text-primary font-medium">.tempo</span> names on the
          Tempo blockchain. Join the waitlist for early access.
        </p>

        {/* Countdown */}
        {mounted && !countdown.ended && (
          <div className="mb-10 md:mb-14">
            <p className="text-xs text-tertiary uppercase tracking-wider mb-4">
              Launching in
            </p>
            <div className="inline-flex items-center gap-1 md:gap-2">
              {[
                { val: countdown.h, label: "HRS" },
                { val: countdown.m, label: "MIN" },
                { val: countdown.s, label: "SEC" },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-1 md:gap-2">
                  {i > 0 && (
                    <span className="text-xl md:text-3xl text-tertiary font-light">:</span>
                  )}
                  <div className="flex flex-col items-center">
                    <div className="w-16 md:w-20 h-16 md:h-20 bg-white border border-border flex items-center justify-center">
                      <span className="text-2xl md:text-4xl font-serif text-primary tabular-nums">
                        {String(item.val).padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-[9px] md:text-[10px] text-tertiary mt-1.5 tracking-widest">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mounted && countdown.ended && (
          <div className="mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary bg-white">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-primary font-medium">We are live!</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          {!mounted ? (
            <div className="px-10 py-4 bg-primary text-white text-sm opacity-50">
              Loading...
            </div>
          ) : !isConnected ? (
            <button
              onClick={() => connect({ connector: injected() })}
              className="px-10 py-4 bg-primary text-white text-sm
                         hover:opacity-80 transition-all group"
            >
              Connect Wallet to Join Waitlist
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          ) : joined ? (
            <div className="flex flex-col items-center gap-3">
              <div className="px-10 py-4 border-2 border-primary bg-white text-primary text-sm font-medium">
                ✓ You're on the waitlist
              </div>
              <p className="text-xs text-tertiary mt-1">
                You'll get early access when we launch
              </p>
              <p className="text-xs text-tertiary">
                Wallet:{" "}
                <span className="text-secondary font-mono">
                  {shortenAddress(address!)}
                </span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleJoin}
                className="px-10 py-4 bg-primary text-white text-sm
                           hover:opacity-80 transition-all group"
              >
                Join the Waitlist
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>
              <p className="text-xs text-tertiary">
                Connected:{" "}
                <span className="text-secondary font-mono">
                  {shortenAddress(address!)}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Counter - uncomment when ready to show count
        {mounted && waitlistCount > 0 && (
          <div className="mt-8 md:mt-10">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-border">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 border-2 border-white flex items-center justify-center"
                    style={{
                      backgroundColor: ["#E5E5E5", "#D4D4D4", "#C4C4C4", "#B4B4B4", "#A4A4A4"][i],
                    }}
                  >
                    <span className="text-[8px] text-gray-600 font-medium">
                      {["T", "E", "M", "P", "O"][i]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-secondary">
                <span className="text-primary font-medium">{waitlistCount}+</span>{" "}
                people waiting
              </p>
            </div>
          </div>
        )}
        */}
      </div>

      {/* Features Preview */}
      <div className="max-w-[640px] mx-auto w-full mt-20 md:mt-28">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6 text-center">
          What's coming
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white p-6">
              <p className="text-sm font-medium text-primary">{f.title}</p>
              <p className="text-xs text-tertiary mt-2 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="max-w-[640px] mx-auto w-full mt-12 md:mt-16">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6 text-center">
          Waitlist Pricing
        </p>
        <div className="grid grid-cols-3 gap-[1px] bg-border">
          <div className="bg-white p-4 md:p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white text-[9px] px-2 py-0.5 font-medium">
              -25%
            </div>
            <p className="text-xs text-tertiary">3 chars</p>
            <p className="text-xl md:text-2xl font-serif text-primary mt-2">
              $15<span className="text-xs text-tertiary font-sans">/yr</span>
            </p>
            <p className="text-[10px] text-tertiary mt-1 line-through">$20/yr</p>
          </div>
          <div className="bg-white p-4 md:p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white text-[9px] px-2 py-0.5 font-medium">
              -25%
            </div>
            <p className="text-xs text-tertiary">4 chars</p>
            <p className="text-xl md:text-2xl font-serif text-primary mt-2">
              $3.75<span className="text-xs text-tertiary font-sans">/yr</span>
            </p>
            <p className="text-[10px] text-tertiary mt-1 line-through">$5/yr</p>
          </div>
          <div className="bg-white p-4 md:p-6 text-center">
            <p className="text-xs text-tertiary">5+ chars</p>
            <p className="text-xl md:text-2xl font-serif text-primary mt-2">
              $1<span className="text-xs text-tertiary font-sans">/yr</span>
            </p>
            <p className="text-[10px] text-tertiary mt-1 invisible">$1/yr</p>
          </div>
        </div>
        <p className="text-[11px] text-tertiary text-center mt-3">
          Early access discount for waitlist members only
        </p>
      </div>

      {/* Get Ready */}
      <div className="max-w-[640px] mx-auto w-full mt-12 md:mt-16">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6 text-center">
          Get Ready
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-border">
          <button
            onClick={async () => {
              const ethereum = (window as any).ethereum;
              if (!ethereum) {
                window.open("https://metamask.io/download/", "_blank");
                return;
              }
              try {
                await ethereum.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: "0x1079" }],
                });
              } catch (switchError: any) {
                if (switchError.code === 4902) {
                  try {
                    await ethereum.request({
                      method: "wallet_addEthereumChain",
                      params: [{
                        chainId: "0x1079",
                        chainName: "Tempo Mainnet",
                        nativeCurrency: { name: "USD", symbol: "USD", decimals: 18 },
                        rpcUrls: ["https://rpc.presto.tempo.xyz"],
                        blockExplorerUrls: ["https://explore.tempo.xyz"],
                      }],
                    });
                  } catch (addError) {
                    console.error("Failed to add Tempo:", addError);
                  }
                } else {
                  console.error("Failed to switch:", switchError);
                }
              }
            }}
            className="bg-white p-6 text-left hover:bg-bg transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Add Tempo to MetaMask</p>
                <p className="text-xs text-tertiary mt-1">Add Tempo mainnet to your wallet</p>
              </div>
              <span className="text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all">→</span>
            </div>
          </button>
          <a
            href="https://relay.link/bridge/tempo?toCurrency=0x20c0000000000000000000000000000000000000&fromCurrency=0x0000000000000000000000000000000000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-6 text-left hover:bg-bg transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Buy pathUSD</p>
                <p className="text-xs text-tertiary mt-1">Bridge to Tempo via Relay</p>
              </div>
              <span className="text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all">→</span>
            </div>
          </a>
        </div>
      </div>

      {/* Social */}
      <div className="max-w-[640px] mx-auto w-full mt-12 md:mt-16 text-center">
        <p className="text-xs text-tertiary mb-4">Follow us for updates</p>
        <a
          href="https://x.com/tempoidapp"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-white
                     text-sm text-secondary hover:text-primary hover:border-primary transition-all"
        >
          𝕏 @tempoidapp →
        </a>
      </div>
    </div>
  );
}
