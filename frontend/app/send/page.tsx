"use client";

import { useState, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { useResolveName, useSendPathUSD } from "@/hooks/useSend";
import { useReverseLookup } from "@/hooks/useNameService";
import { shortenAddress } from "@/lib/utils";
import { tempo } from "@/lib/wagmi";

export default function SendPage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { name: senderName } = useReverseLookup(address);
  const wrongChain = chainId !== tempo.id;

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");

  const { resolvedAddress, isLoading: isResolving, isError, cleanName } =
    useResolveName(recipient);

  const {
    send,
    isTransferPending,
    isTransferConfirmed,
    error,
  } = useSendPathUSD();

  useEffect(() => {
    if (isTransferConfirmed) setStep("done");
  }, [isTransferConfirmed]);

  if (!isConnected) {
    return (
      <div className="py-20 md:py-32 text-center">
        <h1 className="font-serif text-[32px] md:text-[40px] text-primary mb-4">Send</h1>
        <p className="text-sm text-tertiary mb-8">
          Connect your wallet to send pathUSD
        </p>
        <WalletButton />
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="max-w-[480px] mx-auto py-12 md:py-20 text-center">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          Sent
        </p>
        <h1 className="font-serif text-[40px] md:text-[56px] leading-[1] tracking-tight text-primary">
          ${amount}
        </h1>
        <p className="text-secondary mt-4">
          to{" "}
          <span className="font-serif text-primary">
            {cleanName}.tempo
          </span>
        </p>
        <p className="text-xs text-tertiary mt-2">
          {resolvedAddress ? shortenAddress(resolvedAddress) : ""}
        </p>

        <div className="mt-12 flex justify-center gap-4">
          <button
            onClick={() => {
              setRecipient("");
              setAmount("");
              setStep("form");
            }}
            className="px-6 py-2.5 bg-primary text-white text-sm
                       hover:opacity-80 transition-opacity"
          >
            Send Another →
          </button>
        </div>
      </div>
    );
  }

  if (step === "confirm" && resolvedAddress) {
    return (
      <div className="max-w-[480px] mx-auto py-12 md:py-20">
        <button
          onClick={() => setStep("form")}
          className="text-sm text-tertiary hover:text-primary transition-colors"
        >
          ← Back
        </button>

        <div className="mt-8">
          <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
            Confirm Transfer
          </p>

          <div className="space-y-[1px] bg-border">
            <div className="bg-white p-6">
              <p className="text-xs text-tertiary">From</p>
              <p className="text-sm text-primary mt-1 font-serif">
                {senderName ? `${senderName}.tempo` : shortenAddress(address!)}
              </p>
            </div>
            <div className="bg-white p-6">
              <p className="text-xs text-tertiary">To</p>
              <p className="text-sm text-primary mt-1 font-serif">
                {cleanName}.tempo
              </p>
              <p className="text-xs text-tertiary mt-1">
                {shortenAddress(resolvedAddress)}
              </p>
            </div>
            <div className="bg-white p-6">
              <p className="text-xs text-tertiary">Amount</p>
              <p className="text-2xl text-primary mt-1 font-serif">
                ${amount} <span className="text-sm text-tertiary font-sans">pathUSD</span>
              </p>
            </div>
          </div>

          {wrongChain ? (
            <button
              onClick={() => switchChain({ chainId: tempo.id })}
              className="w-full mt-6 py-4 bg-primary text-white text-sm
                         hover:opacity-80 transition-opacity"
            >
              Switch to Tempo Network
            </button>
          ) : (
            <button
              onClick={() => send(resolvedAddress, amount)}
              disabled={isTransferPending}
              className="w-full mt-6 py-4 bg-primary text-white text-sm
                         hover:opacity-80 transition-opacity"
            >
              {isTransferPending ? "Sending..." : `Send $${amount} pathUSD`}
            </button>
          )}

          {error && (
            <p className="text-sm text-red-600 mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto py-12 md:py-20">
      <h1 className="font-serif text-[32px] md:text-[48px] leading-[1] tracking-tight text-primary mb-2">
        Send
      </h1>
      <p className="text-sm text-tertiary mb-12">
        Send pathUSD to any .tempo name
      </p>

      {/* Recipient */}
      <div className="mb-8">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-3">
          Recipient
        </p>
        <div className="relative border-b border-primary">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value.toLowerCase())}
            placeholder="name"
            className="w-full py-3 pr-20 text-lg font-serif bg-transparent text-primary
                       placeholder:text-muted focus:outline-none"
          />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-tertiary text-sm">
            .tempo
          </span>
        </div>

        {/* Resolution status */}
        {cleanName.length >= 3 && (
          <div className="mt-3">
            {isResolving ? (
              <p className="text-xs text-tertiary">Resolving...</p>
            ) : resolvedAddress ? (
              <p className="text-xs text-primary">
                → {shortenAddress(resolvedAddress)}
              </p>
            ) : isError || cleanName.length >= 3 ? (
              <p className="text-xs text-tertiary">Name not found</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="mb-12">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-3">
          Amount
        </p>
        <div className="relative border-b border-primary">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-tertiary text-lg">
            $
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full py-3 pl-5 pr-20 text-lg font-serif bg-transparent text-primary
                       placeholder:text-muted focus:outline-none [appearance:textfield]
                       [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-tertiary text-sm">
            pathUSD
          </span>
        </div>
      </div>

      {/* Send button */}
      <button
        onClick={() => setStep("confirm")}
        disabled={!resolvedAddress || !amount || Number(amount) <= 0}
        className={`w-full py-4 text-sm transition-all ${
          resolvedAddress && amount && Number(amount) > 0
            ? "bg-primary text-white hover:opacity-80"
            : "bg-border-light text-muted cursor-not-allowed"
        }`}
      >
        {!resolvedAddress
          ? "Enter a valid .tempo name"
          : !amount || Number(amount) <= 0
            ? "Enter amount"
            : `Send $${amount} to ${cleanName}.tempo →`}
      </button>
    </div>
  );
}
