"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { validateName } from "@/lib/utils";
import { useNameAvailability } from "@/hooks/useNameService";

const PLACEHOLDER_NAMES = [
  "satoshi",
  "vitalik",
  "claude",
  "agent",
  "defi",
  "tempo",
  "nakamoto",
  "ethereum",
  "bitcoin",
  "web3",
];

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timerRef.current);
  }, [value, delay]);

  return debounced;
}

function useAnimatedPlaceholder() {
  const [placeholder, setPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const indexRef = useRef(0);
  const charRef = useRef(0);

  useEffect(() => {
    const currentName = PLACEHOLDER_NAMES[indexRef.current];
    const targetText = currentName + ".tempo";

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charRef.current < targetText.length) {
          setPlaceholder(targetText.slice(0, charRef.current + 1));
          charRef.current++;
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (charRef.current > 0) {
          charRef.current--;
          setPlaceholder(targetText.slice(0, charRef.current));
        } else {
          setIsDeleting(false);
          indexRef.current = (indexRef.current + 1) % PLACEHOLDER_NAMES.length;
        }
      }
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timer);
  }, [placeholder, isDeleting]);

  return placeholder;
}

export function SearchBar() {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const animatedPlaceholder = useAnimatedPlaceholder();
  const router = useRouter();
  const name = input.toLowerCase().replace(/\.tempo$/, "").trim();
  const validation = name.length > 0 ? validateName(name) : null;

  const debouncedName = useDebounce(validation?.valid ? name : "", 300);

  const { isAvailable, isLoading } = useNameAvailability(debouncedName);

  // Show loading while debounce is pending
  const isTyping = debouncedName !== (validation?.valid ? name : "");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validation?.valid && isAvailable) {
        router.push(`/register/${name}`);
      } else if (validation?.valid && isAvailable === false) {
        router.push(`/name/${name}`);
      }
    },
    [name, validation, isAvailable, router]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[640px] mx-auto">
      <div className="relative border-b border-primary">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toLowerCase())}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? "Search a name" : animatedPlaceholder || "Search a name"}
          className="w-full py-3 md:py-4 pr-28 md:pr-32 text-[22px] md:text-[32px] font-serif bg-transparent
                     text-primary placeholder:text-[#999] focus:outline-none tracking-tight"
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-3">
          <span className="text-tertiary text-sm font-sans">.tempo</span>
          {validation?.valid && !isTyping && (
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white text-sm font-sans
                         hover:opacity-80 transition-opacity"
            >
              {isAvailable ? "Register" : isAvailable === false ? "View" : "Search"}
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      {name.length > 0 && (
        <div className="mt-4 font-sans">
          {!validation?.valid ? (
            <p className="text-sm text-tertiary">{validation?.error}</p>
          ) : isTyping || isLoading ? (
            <p className="text-sm text-tertiary">Checking availability...</p>
          ) : isAvailable === true ? (
            <p className="text-sm text-primary">
              <span className="font-medium">{name}.tempo</span> is available
              <span className="ml-2 text-tertiary">
                → ${name.length <= 3 ? "20" : name.length === 4 ? "5" : "1"}/year
              </span>
            </p>
          ) : isAvailable === false ? (
            <p className="text-sm text-tertiary">
              <span className="font-medium text-primary">{name}.tempo</span> is
              already registered
            </p>
          ) : null}
        </div>
      )}
    </form>
  );
}
