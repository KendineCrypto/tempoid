"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { shortenAddress } from "@/lib/utils";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const passkeyConnector = connectors.find((c) => c.id === "webAuthn" || c.name.toLowerCase().includes("passkey"));
  const walletConnector = connectors.find((c) => c.id === "injected" || c.type === "injected");

  if (!mounted) {
    return (
      <div className="px-6 py-2 bg-primary text-white text-sm opacity-50">
        Connect
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="px-6 py-2 bg-primary text-white text-sm
                     hover:opacity-80 transition-opacity"
        >
          Connect
        </button>

        {showOptions && (
          <div className="absolute right-0 mt-1 w-56 bg-white border border-border shadow-sm z-50">
            {passkeyConnector && (
              <button
                onClick={() => {
                  connect({ connector: passkeyConnector });
                  setShowOptions(false);
                }}
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-secondary
                           hover:bg-bg transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  <circle cx="12" cy="16" r="1"/>
                </svg>
                Sign in with Passkey
              </button>
            )}
            {walletConnector && (
              <button
                onClick={() => {
                  connect({ connector: walletConnector });
                  setShowOptions(false);
                }}
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-secondary
                           hover:bg-bg transition-colors border-t border-border-light"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M16 12h2"/>
                </svg>
                Connect Wallet
              </button>
            )}
          </div>
        )}
      </div>
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
        <div className="absolute right-0 mt-1 w-44 bg-white border border-border shadow-sm z-50">
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
