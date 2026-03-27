"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState, useRef, useEffect } from "react";
import { shortenAddress } from "@/lib/utils";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!mounted) {
    return (
      <div className="px-6 py-2 bg-primary text-white text-sm opacity-50">
        Connect Wallet
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        className="px-6 py-2 bg-primary text-white text-sm
                   hover:opacity-80 transition-opacity"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 border border-border text-sm
                   hover:border-primary transition-colors"
      >
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        {shortenAddress(address!)}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-border shadow-sm z-50 rounded-lg overflow-hidden">
          <a
            href="/account"
            className="block px-4 py-3 text-sm text-secondary hover:bg-bg transition-colors"
          >
            My Account
          </a>
          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-3 text-sm text-tertiary
                       hover:bg-bg transition-colors border-t border-border-light"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
