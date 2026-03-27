"use client";

import { useAccount, useConnect, useDisconnect, useConnectors } from "wagmi";
import { useState, useRef, useEffect, useMemo } from "react";
import { shortenAddress } from "@/lib/utils";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const [showOptions, setShowOptions] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Deduplicate connectors — keep one MetaMask/Injected and one WebAuthn
  const uniqueConnectors = useMemo(() => {
    const seen = new Set<string>();
    return connectors.filter((c) => {
      const type = c.type === "webAuthn" ? "webAuthn" : "injected";
      if (seen.has(type)) return false;
      seen.add(type);
      return true;
    });
  }, [connectors]);

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

  if (!mounted) {
    return (
      <div className="px-6 py-2 bg-primary text-white text-sm opacity-50">
        Connect Wallet
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
          Connect Wallet
        </button>

        {showOptions && (
          <div className="absolute right-0 mt-1 w-56 bg-white border border-border shadow-lg z-50 rounded-lg overflow-hidden">
            {uniqueConnectors.map((connector) => {
              const isWebAuthn = connector.type === "webAuthn";
              return (
                <button
                  key={connector.uid}
                  onClick={() => {
                    console.log("Connecting with:", connector.type, connector.name);
                    connect(
                      { connector },
                      {
                        onSuccess: (data) => console.log("Connected:", data),
                        onError: (err) => console.error("Connect error:", err),
                      }
                    );
                    setShowOptions(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-primary
                             hover:bg-bg transition-colors border-b border-border-light last:border-b-0"
                >
                  {isWebAuthn ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect width="20" height="20" rx="4" fill="#1A1A1A"/>
                        <path d="M10 5C7.5 5 6 7 6 10s1.5 5 4 5 4-2 4-5-1.5-5-4-5z" fill="white" fillOpacity="0.8"/>
                      </svg>
                      <span>Tempo Wallet</span>
                      <span className="text-[10px] text-tertiary ml-auto">passkey</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect width="20" height="20" rx="4" fill="#F6851B"/>
                        <path d="M15.5 4L10.5 7.8L11.3 5.5L15.5 4Z" fill="white" fillOpacity="0.8"/>
                      </svg>
                      <span>MetaMask</span>
                    </>
                  )}
                </button>
              );
            })}
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
