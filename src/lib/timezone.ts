/**
 * timezone.ts
 *
 * Centralized date & time formatting utilities for Scalvea.
 * Configured for Australian Eastern Time: Australia/Melbourne (AEDT / GMT+11).
 */

export const MELBOURNE_TIMEZONE = "Australia/Melbourne";
export const AUS_TIMEZONE = MELBOURNE_TIMEZONE;

/**
 * Formats an ISO date/time string to Australian Eastern Time: Australia/Melbourne
 * Example output: "23 Oct 2026, 10:41:47 pm (Melbourne Time)"
 */
export function formatAusDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formatted = d.toLocaleString("en-AU", {
      timeZone: MELBOURNE_TIMEZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${formatted} (Melbourne Time)`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats an ISO date string to Australian Eastern Date (short)
 * Example output: "23 Oct 2026"
 */
export function formatAusDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-AU", {
      timeZone: AUS_TIMEZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns the Australian calendar date string formatted as YYYY-MM-DD
 * for accurate "Today" / "This Month" comparisons in AUS (GMT+11).
 */
export function getAusDateKey(dateInput: string | Date = new Date()): string {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-CA", { timeZone: AUS_TIMEZONE });
  } catch {
    return "";
  }
}
