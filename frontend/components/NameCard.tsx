"use client";

import Link from "next/link";
import { shortenAddress, formatExpiry, getYearlyFeeDisplay } from "@/lib/utils";

interface NameCardProps {
  name: string;
  owner?: string;
  expiry?: number;
  isAvailable?: boolean;
}

export function NameCard({ name, owner, expiry, isAvailable }: NameCardProps) {
  return (
    <Link
      href={isAvailable ? `/register/${name}` : `/name/${name}`}
      className="block p-6 border border-border bg-white hover:border-primary
                 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-serif text-primary group-hover:opacity-70 transition-opacity">
            {name}.tempo
          </h3>
          {owner && (
            <p className="text-xs text-tertiary mt-2 font-sans">
              {shortenAddress(owner)}
            </p>
          )}
          {expiry && (
            <p className="text-xs text-muted mt-1 font-sans">
              Expires {formatExpiry(expiry)}
            </p>
          )}
        </div>
        <div className="text-right font-sans">
          {isAvailable ? (
            <span className="text-xs text-tertiary">Available</span>
          ) : (
            <span className="text-xs text-muted">Registered</span>
          )}
          <p className="text-sm text-primary mt-1">
            ${getYearlyFeeDisplay(name)}/yr
          </p>
        </div>
      </div>
    </Link>
  );
}
