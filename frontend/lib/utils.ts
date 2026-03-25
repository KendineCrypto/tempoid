import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validate a .tempo name (without the .tempo suffix).
 * Rules: lowercase a-z, 0-9, hyphen. Min 3, max 63 chars.
 * Cannot start or end with hyphen.
 */
export function validateName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (name.length < 1) return { valid: false, error: "Minimum 1 character" };
  if (name.length > 63) return { valid: false, error: "Maximum 63 characters" };
  if (name.startsWith("-") || name.endsWith("-"))
    return { valid: false, error: "Cannot start or end with a hyphen" };
  if (!/^[a-z0-9-]+$/.test(name))
    return {
      valid: false,
      error: "Only lowercase letters, numbers, and hyphens allowed",
    };
  return { valid: true };
}

/**
 * Launch day discount flag — set to false after launch day.
 */
export const LAUNCH_DAY_DISCOUNT = false;

/**
 * Calculate yearly fee based on name length (display value, not wei).
 * When LAUNCH_DAY_DISCOUNT is true, returns 25% off prices.
 */
export function getYearlyFeeDisplay(name: string): number {
  const len = name.length;
  if (LAUNCH_DAY_DISCOUNT) {
    if (len <= 3) return 15;
    if (len === 4) return 3.75;
    return 1;
  }
  if (len <= 3) return 20;
  if (len === 4) return 5;
  return 1;
}

/**
 * Get original (non-discounted) yearly fee for strikethrough display.
 */
export function getOriginalFeeDisplay(name: string): number {
  const len = name.length;
  if (len <= 3) return 20;
  if (len === 4) return 5;
  return 1;
}

/**
 * Format an address for display: 0x1234...abcd
 */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a timestamp to a readable date string.
 */
export function formatExpiry(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Convert pathUSD amount from wei (6 decimals) to display value.
 */
export function formatPathUSD(wei: bigint): string {
  const value = Number(wei) / 1e6;
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}
