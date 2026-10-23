/**
 * timezone.ts
 *
 * Centralized date & time formatting utilities for Scalvea.
 * Configured for Australian Eastern Time: Australia/Sydney (AEDT / GMT+11).
 */

export const AUS_TIMEZONE = "Australia/Sydney";

/**
 * Formats an ISO date/time string to Australian Eastern Time (GMT+11 / AEDT)
 * Example output: "23 Oct 2026, 10:41:47 pm (AUS - GMT+11)"
 */
export function formatAusDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formatted = d.toLocaleString("en-AU", {
      timeZone: AUS_TIMEZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${formatted} (AUS - GMT+11)`;
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
