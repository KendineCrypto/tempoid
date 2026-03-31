"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { validateName, getYearlyFeeDisplay, getOriginalFeeDisplay, LAUNCH_DAY_DISCOUNT } from "@/lib/utils";
import { useNameAvailability } from "@/hooks/useNameService";
import { RegisterFlow } from "@/components/RegisterFlow";
import { TLD, TLDS } from "@/lib/contract";

export default function RegisterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = (params.name as string).toLowerCase();
  const tldParam = searchParams.get("tld") as TLD | null;
  const tld: TLD = tldParam && TLDS.includes(tldParam) ? tldParam : "tempo";
  const validation = validateName(name);
  const { isAvailable, isLoading } = useNameAvailability(name, tld);

  return (
    <div className="max-w-[480px] mx-auto py-12 md:py-20">
      <Link
        href="/"
        className="text-sm text-tertiary hover:text-primary transition-colors"
      >
        ← Back
      </Link>

      {/* Name */}
      <div className="mt-8 mb-8 pb-8 border-b border-border">
        <h1 className="font-serif text-[32px] md:text-[48px] leading-[1] tracking-tight text-primary">
          {name}<span className="text-muted">.{tld}</span>
        </h1>

        {!validation.valid ? (
          <p className="text-sm text-tertiary mt-4">{validation.error}</p>
        ) : isLoading ? (
          <p className="text-sm text-tertiary mt-4">Checking...</p>
        ) : isAvailable ? (
          <p className="text-sm text-primary mt-4">
            Available · {LAUNCH_DAY_DISCOUNT && (
              <span className="line-through text-muted mr-1">${getOriginalFeeDisplay(name)}</span>
            )}${getYearlyFeeDisplay(name)}/year
            {LAUNCH_DAY_DISCOUNT && (
              <span className="ml-2 text-[10px] font-medium bg-primary text-white px-1.5 py-0.5 uppercase">
                25% off
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-tertiary mt-4">Already registered</p>
        )}
      </div>

      {/* Register flow */}
      {validation.valid && isAvailable && <RegisterFlow name={name} tld={tld} />}

      {/* Link to profile if taken */}
      {validation.valid && isAvailable === false && (
        <Link
          href={`/name/${name}?tld=${tld}`}
          className="inline-block px-6 py-3 bg-primary text-white text-sm
                     hover:opacity-80 transition-opacity"
        >
          View Profile →
        </Link>
      )}
    </div>
  );
}
