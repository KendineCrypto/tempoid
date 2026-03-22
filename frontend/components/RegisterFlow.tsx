"use client";

import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { getYearlyFeeDisplay } from "@/lib/utils";
import { tempo } from "@/lib/wagmi";
import { useRegister } from "@/hooks/useRegister";

interface RegisterFlowProps {
  name: string;
}

export function RegisterFlow({ name }: RegisterFlowProps) {
  const [years, setYears] = useState(1);
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const yearlyFee = getYearlyFeeDisplay(name);
  const totalFee = yearlyFee * years;
  const wrongChain = chainId !== tempo.id;

  const {
    approve,
    register,
    isApproving,
    isRegistering,
    isApproved,
    isRegistered,
    error,
  } = useRegister(name, years);

  if (!isConnected) {
    return (
      <div className="py-12 text-center">
        <p className="text-tertiary text-sm">Connect your wallet to register</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Duration */}
      <div>
        <p className="text-xs text-tertiary mb-3 uppercase tracking-wider">
          Registration Period
        </p>
        <div className="grid grid-cols-3 gap-[1px] bg-border">
          {[1, 2, 3].map((y) => (
            <button
              key={y}
              onClick={() => setYears(y)}
              className={`py-3 text-sm transition-colors ${
                years === y
                  ? "bg-primary text-white"
                  : "bg-white text-secondary hover:bg-bg"
              }`}
            >
              {y} Year{y > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="border-t border-border pt-6">
        <div className="flex justify-between text-sm text-tertiary">
          <span>Annual fee</span>
          <span>${yearlyFee} pathUSD</span>
        </div>
        <div className="flex justify-between text-sm text-tertiary mt-2">
          <span>Duration</span>
          <span>{years} year{years > 1 ? "s" : ""}</span>
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t border-border">
          <span className="text-sm font-medium text-primary">Total</span>
          <span className="text-lg font-serif text-primary">
            ${totalFee} pathUSD
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {/* Switch chain */}
        {wrongChain && (
          <button
            onClick={() => switchChain({ chainId: tempo.id })}
            className="w-full py-4 text-sm bg-primary text-white hover:opacity-80 transition-opacity"
          >
            Switch to Tempo Network
          </button>
        )}

        {/* Approve */}
        <button
          onClick={approve}
          disabled={isApproved || isApproving || wrongChain}
          className={`w-full py-4 text-sm transition-all flex items-center justify-center gap-3 ${
            isApproved
              ? "bg-bg text-tertiary border border-border"
              : "bg-white border border-primary text-primary hover:bg-primary hover:text-white"
          }`}
        >
          <span className="w-5 h-5 border border-current flex items-center justify-center text-xs">
            {isApproved ? "✓" : "1"}
          </span>
          {isApproving
            ? "Approving pathUSD..."
            : isApproved
              ? "pathUSD Approved"
              : "Approve pathUSD"}
        </button>

        {/* Register */}
        <button
          onClick={register}
          disabled={!isApproved || isRegistering || isRegistered}
          className={`w-full py-4 text-sm transition-all flex items-center justify-center gap-3 ${
            isRegistered
              ? "bg-bg text-tertiary border border-border"
              : isApproved
                ? "bg-primary text-white hover:opacity-80"
                : "bg-bg text-muted border border-border-light cursor-not-allowed"
          }`}
        >
          <span className="w-5 h-5 border border-current flex items-center justify-center text-xs">
            {isRegistered ? "✓" : "2"}
          </span>
          {isRegistering
            ? "Registering..."
            : isRegistered
              ? "Registration Complete"
              : "Register Name"}
        </button>
      </div>

      {/* Success */}
      {isRegistered && (
        <div className="border-t border-border pt-6 text-center">
          <p className="font-serif text-2xl text-primary">{name}.tempo</p>
          <p className="text-sm text-tertiary mt-2">is now yours</p>
          <a
            href={`/name/${name}`}
            className="inline-block mt-4 px-6 py-2 bg-primary text-white text-sm
                       hover:opacity-80 transition-opacity"
          >
            View Profile →
          </a>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 border-t border-border pt-4">
          {error}
        </p>
      )}
    </div>
  );
}
