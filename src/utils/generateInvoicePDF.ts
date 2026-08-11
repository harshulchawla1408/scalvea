/**
 * generateInvoicePDF.ts
 *
 * Professional A4 PDF invoice generator for Scalvea orders.
 * Used by both admin and user dashboards.
 *
 * - Australia orders → "TAX INVOICE" with ABN, Scalvea Groups PTY LTD details
 * - India orders → "INVOICE" with Scalvea branding
 * - Supports: product table, financials, customer details, payment info
 * - Clean monochrome design matching Scalvea branding
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id?: string;
  product_name: string;
  quantity: number;
  price: number;
  currency?: string;
  discount_amount?: number;
  original_price?: number;
}

interface OrderData {
  id: string;
  order_number: string;
  created_at: string;
  country?: string;
  currency?: string;
  subtotal?: number;
  tax_amount?: number;
  gst_amount?: number;
  shipping_amount?: number;
  discount_amount?: number;
  coupon_code?: string;
  total_amount?: number;
  payment_status?: string;
  payment_method?: string;
  order_status?: string;
  delivery_estimate?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: any;
  billing_address?: any;
  stripe_session_id?: string;
  fastrr_order_id?: string;
  shiprocket_order_id?: string;
  order_items?: OrderItem[];
  user_id?: string;
  order_source?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCALVEA_FROM = {
  name: "SCALVEA GROUPS PTY LTD",
  operating_as: "Scalvea",
  abn: "99 696 417 679",
  address: "117/530 Little Collins St",
  city: "Melbourne VIC 3000",
  country: "Australia",
  return_address: "17 Travers Street",
  return_city: "Craigieburn VIC 3064",
  return_country: "Australia",
  email: "info@scalvea.com",
  website: "www.scalvea.com",
};

const COLOR = {
  black: [0, 0, 0] as [number, number, number],
  darkGray: [51, 51, 51] as [number, number, number],
  medGray: [120, 120, 120] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  veryLightGray: [245, 245, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [34, 139, 34] as [number, number, number],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(val: number, currency: string): string {
  if (currency === "INR") return `₹${Math.round(val || 0).toLocaleString("en-IN")}`;
  return `A$${Number(val || 0).toFixed(2)}`;
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function generateInvoiceNumber(order: OrderData): string {
  const prefix = order.currency === "INR" ? "SCV-IND-INV" : "SCV-AUS-INV";
  // Extract numeric part from order_number like SCV_0014 → 0014
  const numPart = (order.order_number || "").replace(/[^0-9]/g, "");
  return `${prefix}-${numPart.padStart(4, "0")}`;
}

function getTransactionId(order: OrderData): string {
  if (order.stripe_session_id) return order.stripe_session_id;
  if (order.fastrr_order_id) return order.fastrr_order_id;
  if (order.shiprocket_order_id) return order.shiprocket_order_id;
  return "—";
}

// ─── Main Generator ──────────────────────────────────────────────────────────

export function generateInvoicePDF(order: OrderData): void {
  const isAus = order.currency !== "INR";
  const cur = order.currency || (isAus ? "AUD" : "INR");
  const items = order.order_items || [];
  const addr = order.shipping_address || {};
  const billing = order.billing_address || addr;
  const invoiceNumber = generateInvoiceNumber(order);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Header: Logo + Invoice Title ───────────────────────────────────────

  // Left: Scalvea branding
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  doc.text("SCALVEA", margin, y + 7);
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.medGray);
  doc.text("CARE YOU DESERVE", margin, y + 12);

  // Right: Invoice title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  const title = isAus ? "TAX INVOICE" : "INVOICE";
  doc.text(title, pageWidth - margin, y + 7, { align: "right" });

  y += 20;

  // Thin separator line
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Invoice Meta (2 columns) ───────────────────────────────────────────

  const metaLeftX = margin;
  const metaRightX = pageWidth - margin;
  const metaFontSize = 8;
  const metaLabelSize = 7;
  const metaLineHeight = 4.5;

  // Left column labels+values
  const metaLeft = [
    { label: "Invoice Number", value: invoiceNumber },
    { label: "Order Number", value: order.order_number || "—" },
    { label: "Invoice Date", value: fmtDate(new Date().toISOString()) },
    { label: "Order Date", value: fmtDate(order.created_at) },
  ];

  const metaRight = [
    { label: "Payment Status", value: (order.payment_status || "—").toUpperCase() },
    { label: "Payment Method", value: (order.payment_method || "—").replace(/_/g, " ").toUpperCase() },
    { label: "Order Status", value: (order.order_status || "—").replace(/_/g, " ").toUpperCase() },
  ];

  let metaY = y;
  for (const item of metaLeft) {
    doc.setFontSize(metaLabelSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.medGray);
    doc.text(item.label, metaLeftX, metaY);
    doc.setFontSize(metaFontSize);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR.darkGray);
    doc.text(item.value, metaLeftX + 32, metaY);
    metaY += metaLineHeight;
  }

  metaY = y;
  for (const item of metaRight) {
    doc.setFontSize(metaLabelSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.medGray);
    doc.text(item.label, metaRightX - 60, metaY);
    doc.setFontSize(metaFontSize);
    doc.setFont("helvetica", "bold");
    // Must spread the color array — passing array directly crashes jsPDF
    const textColor = (item.label === "Payment Status" && item.value === "PAID")
      ? COLOR.green
      : COLOR.darkGray;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(item.value, metaRightX, metaY, { align: "right" });
    metaY += metaLineHeight;
  }

  y = Math.max(y + metaLeft.length * metaLineHeight, metaY) + 6;

  // ── FROM / BILL TO Section ─────────────────────────────────────────────

  // Separator
  doc.setDrawColor(...COLOR.lightGray);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  const colWidth = contentWidth / 2;
  const addressFontSize = 8;
  const addressLineHeight = 4;

  // FROM column
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.medGray);
  doc.text("FROM", metaLeftX, y);
  y += 4;

  const fromLines = [
    SCALVEA_FROM.name,
    `Operating As: ${SCALVEA_FROM.operating_as}`,
    `ABN: ${SCALVEA_FROM.abn}`,
    SCALVEA_FROM.address,
    `${SCALVEA_FROM.city}, ${SCALVEA_FROM.country}`,
    "",
    "Returns & RTO Address:",
    SCALVEA_FROM.return_address,
    `${SCALVEA_FROM.return_city}, ${SCALVEA_FROM.return_country}`,
    "",
    SCALVEA_FROM.email,
    SCALVEA_FROM.website,
  ];

  let fromY = y;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.darkGray);
  doc.setFontSize(addressFontSize);
  for (const line of fromLines) {
    doc.text(line, metaLeftX, fromY);
    fromY += addressLineHeight;
  }

  // BILL TO column
  const billX = metaLeftX + colWidth + 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.medGray);
  doc.text("BILL TO", billX, y - 4);

  const customerName = order.customer_name
    || `${billing.first_name || billing.firstName || ""} ${billing.last_name || billing.lastName || ""}`.trim()
    || "Customer";
  const customerEmail = order.customer_email || billing.email || addr.email || "";
  const customerPhone = order.customer_phone || billing.phone || addr.phone || "";

  const billLines = [
    customerName,
    customerEmail,
    customerPhone ? `Ph: ${customerPhone}` : "",
    billing.address || billing.address_line1 || addr.address || addr.address_line1 || "",
    billing.address_line2 || addr.address_line2 || "",
    `${billing.city || addr.city || ""}, ${billing.state || addr.state || ""} ${billing.postcode || addr.postcode || ""}`,
    billing.country || addr.country || order.country || "",
  ].filter(Boolean);

  let billY = y;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.darkGray);
  doc.setFontSize(addressFontSize);
  for (const line of billLines) {
    doc.text(line, billX, billY);
    billY += addressLineHeight;
  }

  y = Math.max(fromY, billY) + 6;

  // ── Product Table ──────────────────────────────────────────────────────

  doc.setDrawColor(...COLOR.lightGray);
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;

  const tableHead = [
    ["Product", "Qty", `MRP (${isAus ? "AUD" : "INR"})`, `Unit Price (${isAus ? "AUD" : "INR"})`, `Discount (${isAus ? "AUD" : "INR"})`, `Amount (${isAus ? "AUD" : "INR"})`],
  ];

  const tableBody = items.map((item) => {
    const qty = item.quantity || 1;
    const unitPrice = item.price || 0;
    const originalPrice = item.original_price || unitPrice; // MRP defaults to unit price if not set
    const discount = (originalPrice - unitPrice) * qty;
    const amount = unitPrice * qty;

    return [
      item.product_name || "Scalvea Product",
      String(qty),
      fmtCurrency(originalPrice, cur),
      fmtCurrency(unitPrice, cur),
      discount > 0 ? fmtCurrency(discount, cur) : "—",
      fmtCurrency(amount, cur),
    ];
  });

  if (tableBody.length === 0) {
    tableBody.push(["No items recorded", "", "", "", "", ""]);
  }

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      textColor: COLOR.darkGray,
      lineColor: COLOR.lightGray,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLOR.veryLightGray,
      textColor: COLOR.darkGray,
      fontStyle: "bold",
      fontSize: 7,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 12 },
      2: { halign: "right", cellWidth: 28 },
      3: { halign: "right", cellWidth: 32 },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "right", cellWidth: 28 },
    },
    theme: "grid",
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Financial Summary ──────────────────────────────────────────────────

  const summaryX = pageWidth - margin - 70;
  const summaryValueX = pageWidth - margin;
  const summaryLineHeight = 5.5;

  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shipping_amount || 0);
  const discount = Number(order.discount_amount || 0);
  const tax = Number(order.gst_amount || order.tax_amount || 0);
  const total = Number(order.total_amount || 0);

  const summaryRows: { label: string; value: string; bold?: boolean; color?: [number, number, number] }[] = [
    { label: "Subtotal (Products)", value: fmtCurrency(subtotal, cur) },
  ];

  if (discount > 0) {
    summaryRows.push({
      label: order.coupon_code ? `Discount (${order.coupon_code})` : "Discount",
      value: `-${fmtCurrency(discount, cur)}`,
      color: COLOR.green,
    });
  }

  if (tax > 0) {
    summaryRows.push({ label: isAus ? "Tax (Included)" : "GST (Included)", value: fmtCurrency(tax, cur) });
  }

  // Shipping logic: AUS = A$9.50 for orders < A$60, else free; IN = from DB
  const shippingLabel = isAus
    ? (shipping === 0 ? "Shipping Fee (Free — order ≥ A$60)" : "Shipping Fee")
    : (shipping === 0 ? "Shipping Fee (Free)" : "Shipping Fee");

  summaryRows.push({ label: shippingLabel, value: shipping === 0 ? "FREE" : fmtCurrency(shipping, cur) });

  summaryRows.push({ label: "", value: "", bold: false }); // spacer

  summaryRows.push({
    label: `TOTAL (${isAus ? "AUD" : "INR"})`,
    value: fmtCurrency(total, cur),
    bold: true,
  });

  summaryRows.push({
    label: "Amount Paid",
    value: fmtCurrency(total, cur),
    bold: true,
    color: COLOR.green,
  });

  for (const row of summaryRows) {
    if (!row.label && !row.value) {
      y += 2;
      continue;
    }

    doc.setFontSize(row.bold ? 9 : 8);
    doc.setFont("helvetica", row.bold ? "bold" : "normal");
    // Always spread r,g,b — never pass array directly to setTextColor
    const rowColor = row.color || COLOR.darkGray;
    doc.setTextColor(rowColor[0], rowColor[1], rowColor[2]);
    doc.text(row.label, summaryX, y);
    doc.text(row.value, summaryValueX, y, { align: "right" });
    y += summaryLineHeight;
  }

  y += 4;

  // ── Payment Information ────────────────────────────────────────────────

  doc.setDrawColor(...COLOR.lightGray);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.darkGray);
  doc.text("PAYMENT INFORMATION", margin, y);
  y += 5;

  const paymentInfo = [
    { label: "Payment Method", value: (order.payment_method || "—").replace(/_/g, " ").toUpperCase() },
    { label: "Payment Status", value: (order.payment_status || "—").toUpperCase() },
    { label: "Transaction ID", value: getTransactionId(order) },
  ];

  for (const info of paymentInfo) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.medGray);
    doc.text(info.label + ":", margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR.darkGray);
    doc.text(info.value, margin + 35, y);
    y += 4.5;
  }

  y += 8;

  // ── Thank You & Free Shipping Message ──────────────────────────────────

  doc.setDrawColor(...COLOR.lightGray);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.darkGray);
  doc.text("Thank you for shopping with Scalvea!", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.medGray);
  doc.text("Your hair deserves the best — we're honoured to be part of your care routine.", pageWidth / 2, y, { align: "center" });
  y += 5;

  // Free shipping message (only for AUS orders >= A$60)
  if (isAus && shipping === 0 && subtotal >= 60) {
    doc.setFontSize(7);
    doc.setTextColor(...COLOR.green);
    // Note: no emoji — jsPDF standard fonts don't support them
    doc.text("You qualified for FREE shipping on this order (A$60+ threshold).", pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  // ── Footer ─────────────────────────────────────────────────────────────

  const footerY = doc.internal.pageSize.getHeight() - 15;

  doc.setDrawColor(...COLOR.lightGray);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.darkGray);
  doc.text("Scalvea", pageWidth / 2, footerY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.medGray);
  doc.text("Care You Deserve  ·  info@scalvea.com  ·  www.scalvea.com", pageWidth / 2, footerY + 4, { align: "center" });

  // ── Save ───────────────────────────────────────────────────────────────

  const fileName = `Invoice-${invoiceNumber}.pdf`;
  doc.save(fileName);
}
