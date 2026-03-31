"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useState } from "react";
import Link from "next/link";
import { shortenAddress, formatExpiry, getYearlyFeeDisplay, formatPathUSD } from "@/lib/utils";
import { useNameInfo, useNameMetadata } from "@/hooks/useNameService";
import { useRenew, useTransfer, useSetPrimaryName } from "@/hooks/useRegister";
import { useListForSale, useCancelListing, useListing } from "@/hooks/useMarketplace";
import { TLD, TLDS } from "@/lib/contract";

export default function NameProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = (params.name as string).toLowerCase();
  const tldParam = searchParams.get("tld") as TLD | null;
  const tld: TLD = tldParam && TLDS.includes(tldParam) ? tldParam : "tempo";
  const { address } = useAccount();
  const { owner, expiry, isExpired, isAvailable, isLoading } = useNameInfo(name, tld);
  const { metadata } = useNameMetadata(name, [
    "avatar",
    "twitter",
    "website",
    "bio",
  ], tld);

  const isOwner =
    address && owner && address.toLowerCase() === owner.toLowerCase();

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAddr, setTransferAddr] = useState("");
  const [showList, setShowList] = useState(false);
  const [listPrice, setListPrice] = useState("");

  const { renew, isPending: isRenewing } = useRenew(name, tld);
  const { transfer, isPending: isTransferring } = useTransfer(name, tld);
  const { list, isPending: isListing, isSuccess: isListed } = useListForSale(name, tld);
  const { cancel, isPending: isCancelling } = useCancelListing(name, tld);
  const { active: isListedOnMarket, price: listingPrice } = useListing(name, tld);
  const { setPrimary, isPending: isSettingPrimary } = useSetPrimaryName(tld);

  if (isLoading) {
    return (
      <div className="py-32 text-center">
        <p className="text-sm text-tertiary">Loading...</p>
      </div>
    );
  }

  if (isAvailable) {
    return (
      <div className="max-w-[480px] mx-auto py-12 md:py-20 text-center">
        <h1 className="font-serif text-[32px] md:text-[48px] leading-[1] tracking-tight text-primary">
          {name}<span className="text-muted">.{tld}</span>
        </h1>
        <p className="text-sm text-tertiary mt-4 mb-8">This name is available</p>
        <Link
          href={`/register/${name}?tld=${tld}`}
          className="inline-block px-6 py-3 bg-primary text-white text-sm
                     hover:opacity-80 transition-opacity"
        >
          Register — ${getYearlyFeeDisplay(name)}/yr →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto py-12 md:py-20">
      <Link
        href="/"
        className="text-sm text-tertiary hover:text-primary transition-colors"
      >
        ← Back
      </Link>

      {/* Header */}
      <div className="mt-8 mb-12">
        <h1 className="font-serif text-[36px] md:text-[56px] leading-[1] tracking-tight text-primary">
          {name}<span className="text-muted">.{tld}</span>
        </h1>
        {metadata.bio && (
          <p className="text-secondary mt-4 text-base">{metadata.bio}</p>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-border">
        <div className="bg-white p-5 md:p-6">
          <p className="text-xs text-tertiary uppercase tracking-wider mb-2">
            Owner
          </p>
          <p className="text-sm text-primary font-sans">
            {owner ? shortenAddress(owner) : "—"}
          </p>
          {owner && (
            <a
              href={`https://explore.tempo.xyz/address/${owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-tertiary hover:text-primary transition-colors mt-1 inline-block"
            >
              View on Explorer →
            </a>
          )}
        </div>

        <div className="bg-white p-5 md:p-6">
          <p className="text-xs text-tertiary uppercase tracking-wider mb-2">
            Expires
          </p>
          <p
            className={`text-sm ${isExpired ? "text-red-600" : "text-primary"}`}
          >
            {expiry ? formatExpiry(expiry) : "—"}
          </p>
          {isExpired && (
            <span className="text-xs text-red-600 mt-1 inline-block">
              Expired
            </span>
          )}
        </div>
      </div>

      {/* Social */}
      {(metadata.twitter || metadata.website) && (
        <div className="mt-8 flex items-center gap-6">
          {metadata.twitter && (
            <a
              href={`https://x.com/${metadata.twitter.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-tertiary hover:text-primary transition-colors"
            >
              {metadata.twitter} →
            </a>
          )}
          {metadata.website && (
            <a
              href={metadata.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-tertiary hover:text-primary transition-colors"
            >
              {metadata.website} →
            </a>
          )}
        </div>
      )}

      {/* Owner actions */}
      {isOwner && !isExpired && (
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
            Manage
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => renew(1)}
              disabled={isRenewing}
              className="px-5 py-2.5 border border-primary text-primary text-sm
                         hover:bg-primary hover:text-white transition-all"
            >
              {isRenewing ? "Renewing..." : "Renew 1 Year"}
            </button>

            <button
              onClick={() => setShowTransfer(!showTransfer)}
              className="px-5 py-2.5 border border-border text-secondary text-sm
                         hover:border-primary transition-colors"
            >
              Transfer
            </button>

            <button
              onClick={() => setPrimary(name)}
              disabled={isSettingPrimary}
              className="px-5 py-2.5 border border-border text-secondary text-sm
                         hover:border-primary transition-colors"
            >
              {isSettingPrimary ? "Setting..." : "Set as Primary"}
            </button>

            {isListedOnMarket ? (
              <button
                onClick={cancel}
                disabled={isCancelling}
                className="px-5 py-2.5 border border-red-300 text-red-600 text-sm
                           hover:bg-red-50 transition-colors"
              >
                {isCancelling ? "Cancelling..." : `Listed $${listingPrice ? formatPathUSD(listingPrice) : ""} — Cancel`}
              </button>
            ) : (
              <button
                onClick={() => setShowList(!showList)}
                className="px-5 py-2.5 border border-border text-secondary text-sm
                           hover:border-primary transition-colors"
              >
                List for Sale
              </button>
            )}
          </div>

          {showTransfer && (
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                value={transferAddr}
                onChange={(e) => setTransferAddr(e.target.value)}
                placeholder="0x... new owner address"
                className="flex-1 px-4 py-2.5 border-b border-border bg-transparent
                           text-sm text-primary placeholder:text-muted focus:outline-none
                           focus:border-primary transition-colors"
              />
              <button
                onClick={() => {
                  if (transferAddr.startsWith("0x")) {
                    transfer(transferAddr as `0x${string}`);
                  }
                }}
                disabled={isTransferring || !transferAddr}
                className="px-5 py-2.5 bg-primary text-white text-sm
                           hover:opacity-80 transition-opacity"
              >
                {isTransferring ? "..." : "Send"}
              </button>
            </div>
          )}

          {showList && !isListedOnMarket && !isListed && (
            <div className="mt-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-tertiary">$</span>
                  <input
                    type="number"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    placeholder="Price in pathUSD"
                    min="0"
                    step="0.01"
                    className="w-full pl-4 py-2.5 border-b border-border bg-transparent
                               text-sm text-primary placeholder:text-muted focus:outline-none
                               focus:border-primary transition-colors [appearance:textfield]
                               [&::-webkit-outer-spin-button]:appearance-none
                               [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <button
                  onClick={() => {
                    if (listPrice && Number(listPrice) > 0) {
                      list(listPrice);
                    }
                  }}
                  disabled={isListing || !listPrice || Number(listPrice) <= 0}
                  className="px-5 py-2.5 bg-primary text-white text-sm
                             hover:opacity-80 transition-opacity"
                >
                  {isListing ? "Listing..." : "List"}
                </button>
              </div>
              <p className="text-xs text-tertiary mt-2">
                2.5% commission will be deducted on sale
              </p>
            </div>
          )}

          {isListed && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200">
              <p className="text-sm text-green-800">
                Successfully listed on marketplace for ${listPrice} pathUSD
              </p>
              <Link
                href="/marketplace"
                className="text-xs text-green-700 hover:text-green-900 mt-1 inline-block"
              >
                View on Marketplace →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
