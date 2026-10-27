/**
 * orderExports.ts
 *
 * Secure, Excel-compatible CSV export utilities for Scalvea Admin Orders.
 * - Formula injection prevention (prepends single quote to '=', '+', '-', '@')
 * - UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
 * - Meta Ads custom audience value-based CSV export
 * - Preserves leading zeros on postcodes and phone numbers
 */

import { NormalizedOrder } from "@/types/ordersReporting";
import { formatAusDateTime } from "@/lib/timezone";

/**
 * Escapes a single CSV cell value safely.
 * Prevents CSV formula injection and handles quotes, commas, and newlines.
 */
export function escapeCSV(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();

  // Prevent spreadsheet formula execution in Excel/Google Sheets
  if (/^[=\+\-@]/.test(str)) {
    str = "'" + str;
  }

  // If contains delimiter, quote, or newline, wrap in quotes and escape quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Initiates browser download of CSV text with UTF-8 BOM.
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // \uFEFF is UTF-8 Byte Order Mark (BOM) ensuring Excel opens Unicode characters correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports the complete filtered dataset to an Excel-compatible CSV.
 */
export function exportOrdersComprehensiveCSV(orders: NormalizedOrder[], filename?: string): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const finalFilename = filename || `scalvea_orders_${dateStr}.csv`;

  const headers = [
    "Order Number",
    "Order Date (Melbourne Time)",
    "Original Timestamp (UTC)",
    "Customer First Name",
    "Customer Last Name",
    "Customer Full Name",
    "Customer Email",
    "Customer Phone",
    "Shipping Address Line 1",
    "Shipping Address Line 2",
    "Shipping City",
    "Shipping State",
    "Shipping Postcode",
    "Shipping Country",
    "Billing First Name",
    "Billing Last Name",
    "Billing Address Line 1",
    "Billing Address Line 2",
    "Billing City",
    "Billing State",
    "Billing Postcode",
    "Billing Country",
    "Country",
    "Currency",
    "Market",
    "Subtotal",
    "Tax Amount",
    "Shipping Amount",
    "Discount Amount",
    "Authoritative Total",
    "Raw Total",
    "Coupon Code",
    "Payment Status",
    "Payment Method",
    "Order Status",
    "Fulfillment Status",
    "Order Source",
    "Delivery Method",
    "Courier Name",
    "Tracking Number",
    "Total Items Count",
    "Product Summary",
    "Quality Flags",
  ];

  const rows = orders.map((o) => {
    // Authoritative total calculation: resolves historical records where total was 0 but total_amount had the verified value
    const authTotal = o.total_amount || o.total || o.total_amount_payable || 0;
    const flags = Array.isArray(o.data_quality_flags) ? o.data_quality_flags.join("; ") : "";
    const itemsCount = o.total_items_count ?? (Array.isArray(o.order_items) ? o.order_items.reduce((s, it) => s + (it.quantity || 1), 0) : 0);
    const prodSummary = o.product_summary || (Array.isArray(o.order_items) ? o.order_items.map(it => `${it.product_name || "Item"} (x${it.quantity || 1})`).join(", ") : "");

    return [
      escapeCSV(o.order_number),
      escapeCSV(formatAusDateTime(o.created_at)),
      escapeCSV(o.created_at),
      escapeCSV(o.customer_first_name),
      escapeCSV(o.customer_last_name),
      escapeCSV(o.customer_name),
      escapeCSV(o.customer_email),
      escapeCSV(o.customer_phone),
      escapeCSV(o.shipping_address_line1),
      escapeCSV(o.shipping_address_line2),
      escapeCSV(o.shipping_city),
      escapeCSV(o.shipping_state),
      escapeCSV(o.shipping_postcode),
      escapeCSV(o.shipping_country),
      escapeCSV(o.billing_first_name),
      escapeCSV(o.billing_last_name),
      escapeCSV(o.billing_address_line1),
      escapeCSV(o.billing_address_line2),
      escapeCSV(o.billing_city),
      escapeCSV(o.billing_state),
      escapeCSV(o.billing_postcode),
      escapeCSV(o.billing_country),
      escapeCSV(o.country),
      escapeCSV(o.currency),
      escapeCSV(o.market),
      escapeCSV(Number(o.subtotal || 0).toFixed(2)),
      escapeCSV(Number(o.tax_amount || 0).toFixed(2)),
      escapeCSV(Number(o.shipping_amount || 0).toFixed(2)),
      escapeCSV(Number(o.discount_amount || 0).toFixed(2)),
      escapeCSV(Number(authTotal).toFixed(2)),
      escapeCSV(Number(o.total || 0).toFixed(2)),
      escapeCSV(o.coupon_code),
      escapeCSV(o.payment_status),
      escapeCSV(o.payment_method || o.payment_provider),
      escapeCSV(o.order_status),
      escapeCSV(o.fulfillment_status),
      escapeCSV(o.order_source || o.source),
      escapeCSV(o.delivery_method),
      escapeCSV(o.courier_name || o.courier),
      escapeCSV(o.tracking_number),
      escapeCSV(itemsCount),
      escapeCSV(prodSummary),
      escapeCSV(flags),
    ].join(",");
  });

  const csvText = [headers.join(","), ...rows].join("\r\n");
  downloadCSV(csvText, finalFilename);
}

/**
 * Exports Meta Ads Value-Based Custom Audience CSV.
 * Columns: email,phone,fn,ln,ct,st,zp,country,value,currency
 * Restricted to verified, eligible paid orders (excludes cancelled and refunded orders).
 */
export function exportMetaCustomAudienceCSV(orders: NormalizedOrder[], filename?: string): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const finalFilename = filename || `meta_custom_audience_orders_${dateStr}.csv`;

  // Filter to eligible customer purchases only
  const eligible = orders.filter((o) => {
    const isPaid = (o.payment_status || "").toLowerCase() === "paid";
    const notCancelled = !["cancelled", "refunded"].includes((o.order_status || "").toLowerCase());
    const hasValue = Number(o.total_amount || o.total || 0) > 0;
    const hasContact = Boolean(o.customer_email || o.customer_phone);
    return isPaid && notCancelled && hasValue && hasContact;
  });

  const headers = ["email", "phone", "fn", "ln", "ct", "st", "zp", "country", "value", "currency"];

  const rows = eligible.map((o) => {
    // Sanitize Email
    const email = (o.customer_email || "").trim().toLowerCase();

    // Sanitize Phone: strip non-digits, format with country prefix
    let rawPhone = (o.customer_phone || "").replace(/[^0-9]/g, "");
    if (rawPhone.length > 0) {
      if (o.country === "Australia" && rawPhone.startsWith("04")) {
        rawPhone = "61" + rawPhone.slice(1);
      } else if (o.country === "Australia" && rawPhone.startsWith("4") && rawPhone.length === 9) {
        rawPhone = "61" + rawPhone;
      } else if (o.country === "India" && rawPhone.length === 10) {
        rawPhone = "91" + rawPhone;
      }
    }

    const fn = (o.customer_first_name || (o.customer_name ? o.customer_name.split(" ")[0] : "")).trim().toLowerCase();
    const ln = (o.customer_last_name || (o.customer_name ? o.customer_name.split(" ").slice(1).join(" ") : "")).trim().toLowerCase();
    const ct = (o.shipping_city || "").trim().toLowerCase();
    const st = (o.shipping_state || "").trim().toLowerCase().slice(0, 15);
    const zp = (o.shipping_postcode || "").trim();
    const country = o.country === "India" ? "in" : "au";
    const val = Number(o.total_amount || o.total || 0).toFixed(2);
    const currency = o.currency || (o.country === "India" ? "INR" : "AUD");

    return [
      escapeCSV(email),
      escapeCSV(rawPhone),
      escapeCSV(fn),
      escapeCSV(ln),
      escapeCSV(ct),
      escapeCSV(st),
      escapeCSV(zp),
      escapeCSV(country),
      escapeCSV(val),
      escapeCSV(currency),
    ].join(",");
  });

  const csvText = [headers.join(","), ...rows].join("\r\n");
  downloadCSV(csvText, finalFilename);
}
