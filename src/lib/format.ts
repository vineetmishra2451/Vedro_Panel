/**
 * Indian Number Formatting and Currency Utilities for Vedro
 */

/**
 * Format paise (Int) into INR display string (e.g., ₹1,23,456.00)
 */
export function formatINR(paise: number | null | undefined, includeDecimals = true): string {
  if (paise === null || paise === undefined) return "₹0.00";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Format paise into compact INR string (e.g., ₹1.5L or ₹2.4Cr)
 */
export function formatCompactINR(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "₹0";
  const absRupees = Math.abs(paise / 100);
  const sign = paise < 0 ? "-" : "";

  if (absRupees >= 10000000) {
    return `${sign}₹${(absRupees / 10000000).toFixed(2)} Cr`;
  }
  if (absRupees >= 100000) {
    return `${sign}₹${(absRupees / 100000).toFixed(2)} L`;
  }
  if (absRupees >= 1000) {
    return `${sign}₹${(absRupees / 1000).toFixed(1)} K`;
  }
  return formatINR(paise, false);
}

/**
 * Format regular integer count into Indian numbering system (e.g. 1,50,000)
 */
export function formatIndianNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(value);
}

/**
 * Format percentage (e.g. 15.4%)
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parse a rupee string or number to integer paise
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === "string") {
    const cleaned = rupees.replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }
  return Math.round(rupees * 100);
}

/**
 * Format Date to readable standard
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format DateTime with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
