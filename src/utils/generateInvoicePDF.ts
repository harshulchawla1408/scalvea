import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/logo.webp";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  price: number;
  currency?: string;
  discount_amount?: number;
  original_price?: number;
}

export interface OrderData {
  id: string;
  order_number: string;
  created_at: string;
  country?: string;
  currency?: string;
  subtotal?: number;
  tax_amount?: number;
  gst_amount?: number;
  shipping_amount?: number;
  shipping_cost?: number;
  discount_amount?: number;
  coupon_discount?: number;
  coupon_code?: string;
  total_amount?: number;
  total?: number;
  total_amount_payable?: number;
  amount_paid?: number;
  payment_status?: string;
  payment_method?: string;
  manual_payment_method?: string;
  payment_provider?: string;
  order_status?: string;
  delivery_estimate?: string;
  delivery_method?: string;
  courier?: string;
  courier_name?: string;
  tracking_number?: string;
  awb?: string;
  customer_name?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: any;
  billing_address?: any;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  transaction_id?: string;
  fastrr_order_id?: string;
  shiprocket_order_id?: string;
  order_items?: OrderItem[];
  user_id?: string;
  order_source?: string;
  invoice_number?: string;
}

// ─── Company & Legal Constants ────────────────────────────────────────────────

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
  black: [18, 18, 18] as [number, number, number],
  darkGray: [55, 55, 55] as [number, number, number],
  medGray: [110, 110, 110] as [number, number, number],
  lightGray: [225, 225, 225] as [number, number, number],
  lighterGray: [246, 246, 246] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accentBg: [248, 249, 250] as [number, number, number],
};

const MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 182 mm

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(val: number, currency: string): string {
  const num = Number(val || 0);
  if (currency === "INR") return `₹${Math.round(num).toLocaleString("en-IN")}`;
  return `A$${num.toFixed(2)}`;
}

function fmtDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || "—";
    return d.toLocaleDateString("en-AU", {
      timeZone: "Australia/Melbourne",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr || "—";
  }
}

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });

/**
 * Pre-processes the logo onto an offscreen canvas with a pure white background.
 * Converts to PNG data URL so PDF viewers never render transparency as black.
 */
async function loadFlattenedLogo(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    if (typeof window === "undefined" || !window.document) return null;
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    const width = img.naturalWidth || img.width || 600;
    const height = img.naturalHeight || img.height || 200;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return {
      dataUrl: canvas.toDataURL("image/png"),
      width,
      height,
    };
  } catch (err) {
    console.warn("Could not load flattened logo for invoice:", err);
    return null;
  }
}

function getFormattedPaymentMethod(order: OrderData): string {
  const method = String(order.manual_payment_method || order.payment_method || order.payment_provider || "—").toLowerCase();
  if (method.includes("stripe")) return "Stripe (Card / Apple Pay)";
  if (method.includes("upi")) return "UPI Payment";
  if (method.includes("fastrr")) return "Fastrr Checkout";
  if (method.includes("cod") || method.includes("cash")) return "Cash on Delivery (COD)";
  if (method.includes("bank") || method.includes("transfer")) return "Bank Transfer";
  return method ? method.replace(/_/g, " ").toUpperCase() : "—";
}

function getTransactionReference(order: OrderData): string {
  return (
    order.transaction_id ||
    order.stripe_payment_intent_id ||
    order.stripe_session_id ||
    order.fastrr_order_id ||
    order.shiprocket_order_id ||
    "—"
  );
}

/**
 * Ensures text cleanly wraps into multiple lines even if a single unbroken word
 * (such as a long transaction hash or email) exceeds the column width.
 */
function wrapSafeText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return ["—"];
  const words = text.split(" ");
  const processedWords = words.map((w) => {
    if (doc.getTextWidth(w) <= maxWidth) return w;
    let chunked = "";
    let cur = "";
    for (const char of w) {
      if (doc.getTextWidth(cur + char) > maxWidth - 1) {
        chunked += cur + " ";
        cur = char;
      } else {
        cur += char;
      }
    }
    return chunked + cur;
  });
  return doc.splitTextToSize(processedWords.join(" "), maxWidth);
}

// ─── Main Generator ──────────────────────────────────────────────────────────

export interface GenerateInvoiceOptions {
  returnDoc?: boolean;
  logoDataUrl?: string;
  logoDimensions?: { width: number; height: number };
}

export async function generateInvoicePDF(
  order: OrderData,
  options: GenerateInvoiceOptions = {}
): Promise<jsPDF | void> {
  const isAus = order.currency !== "INR";
  const cur = order.currency || (isAus ? "AUD" : "INR");
  const items = order.order_items || [];
  const addr = order.shipping_address || {};
  const billing = order.billing_address || addr;

  // Derives clean, standardized invoice number (e.g. SCV-AUS-INV-0110)
  const prefix = cur === "INR" ? "SCV-IND-INV" : "SCV-AUS-INV";
  const rawNum = order.order_number || "";
  const parts = rawNum.split(/[-_]/);
  const lastNumeric = parts.filter((p) => /^[0-9]+$/.test(p)).pop() || rawNum.replace(/[^0-9]/g, "").slice(-4);
  const invoiceSeq = lastNumeric ? lastNumeric.padStart(4, "0") : "0001";
  const invoiceNumber = order.invoice_number || `${prefix}-${invoiceSeq}`;

  // Fetch actual MRPs from database if available
  const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
  const mrpMap: Record<string, number> = {};

  if (productIds.length > 0 && typeof supabase !== "undefined") {
    try {
      const { data } = await supabase
        .from("product_prices")
        .select("product_id, mrp_aud, mrp_inr, price_aud, price_inr")
        .in("product_id", productIds);

      if (data) {
        data.forEach((p) => {
          if (cur === "AUD") {
            mrpMap[p.product_id] = p.mrp_aud && p.mrp_aud > 0 ? p.mrp_aud : p.price_aud;
          } else {
            mrpMap[p.product_id] = p.mrp_inr && p.mrp_inr > 0 ? p.mrp_inr : p.price_inr;
          }
        });
      }
    } catch (e) {
      console.warn("Notice: product_prices lookup for invoice:", e);
    }
  }

  // Pre-load logo with white canvas flattening
  let logoData = options.logoDataUrl || null;
  let logoRatio = 2940 / 985;
  if (!logoData) {
    const flattened = await loadFlattenedLogo(logoUrl);
    if (flattened) {
      logoData = flattened.dataUrl;
      logoRatio = flattened.width / flattened.height;
    }
  } else if (options.logoDimensions) {
    logoRatio = options.logoDimensions.width / options.logoDimensions.height;
  }

  // Initialize A4 PDF (210 x 297 mm)
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  // ── 1. HEADER SECTION ────────────────────────────────────────────────────────
  let leftY = y;
  const logoWidth = 44;
  const logoHeight = logoWidth / logoRatio;

  if (logoData) {
    doc.addImage(logoData, "PNG", MARGIN, leftY, logoWidth, logoHeight);
    leftY += logoHeight + 2;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...COLOR.black);
    doc.text("SCALVEA", MARGIN, leftY + 7);
    leftY += 10;
  }

  // Refined subtitle below logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLOR.medGray);
  doc.text("CLINICAL HAIR & SCALP SCIENCE", MARGIN, leftY + 3.2);
  leftY += 7.5;

  // Right Header: TAX INVOICE title & metadata block
  let rightY = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...COLOR.black);
  const isTaxApplicable = isAus || Number(order.gst_amount || order.tax_amount || 0) > 0;
  const docTitle = isTaxApplicable ? "TAX INVOICE" : "INVOICE";
  doc.text(docTitle, PAGE_WIDTH - MARGIN, rightY + 6, { align: "right" });
  rightY += 11;

  const metaBoxWidth = 86;
  const metaX = PAGE_WIDTH - MARGIN - metaBoxWidth;
  const metaLabelWidth = 32;

  const metaRows = [
    { label: "Invoice Number:", value: invoiceNumber, bold: true },
    { label: "Order Number:", value: order.order_number || "—" },
    { label: "Invoice Date:", value: fmtDate(new Date().toISOString()) },
    { label: "Order Date:", value: fmtDate(order.created_at) },
    { label: "Payment Status:", value: String(order.payment_status || "—").replace(/_/g, " ").toUpperCase(), bold: true },
    { label: "Payment Method:", value: getFormattedPaymentMethod(order) },
  ];

  for (const item of metaRows) {
    doc.setFont("helvetica", item.bold ? "bold" : "normal");
    doc.setFontSize(8);
    doc.setTextColor(...(item.bold ? COLOR.black : COLOR.darkGray));
    doc.text(item.label, metaX, rightY);

    doc.setFont("helvetica", item.bold ? "bold" : "normal");
    doc.setTextColor(...COLOR.black);
    const valLines = wrapSafeText(doc, item.value, metaBoxWidth - metaLabelWidth);
    doc.text(valLines, metaX + metaLabelWidth, rightY);
    rightY += Math.max(valLines.length * 3.8, 4.2);
  }

  y = Math.max(leftY, rightY) + 3;

  // Double accent divider rule
  doc.setDrawColor(...COLOR.black);
  doc.setLineWidth(0.45);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.15);
  doc.line(MARGIN, y + 1, PAGE_WIDTH - MARGIN, y + 1);
  y += 5.5;

  // ── 2. FROM & BILL TO ADDRESS PANELS (Side-by-side cards) ────────────────────
  const panelWidth = (CONTENT_WIDTH - 6) / 2; // 88 mm each
  const panelHeaderHeight = 6.5;

  const customerName = (
    order.customer_name ||
    `${billing.first_name || billing.firstName || ""} ${billing.last_name || billing.lastName || ""}`.trim() ||
    "Valued Customer"
  );
  const customerEmail = order.customer_email || billing.email || addr.email || "";
  const customerPhone = order.customer_phone || billing.phone || addr.phone || "";
  const addrLine1 = billing.address_line1 || billing.address || addr.address_line1 || addr.address || "";
  const addrLine2 = billing.address_line2 || addr.address_line2 || "";
  const cityStateZip = [
    billing.city || addr.city || "",
    billing.state || addr.state || "",
    billing.postcode || addr.postcode || "",
  ].filter(Boolean).join(", ");
  const country = billing.country || addr.country || order.country || (isAus ? "Australia" : "India");

  const fromLines = [
    { text: SCALVEA_FROM.name, bold: true },
    { text: `Trading as: ${SCALVEA_FROM.operating_as}` },
    { text: `ABN: ${SCALVEA_FROM.abn}`, bold: true },
    { text: `Office: ${SCALVEA_FROM.address}, ${SCALVEA_FROM.city}, ${SCALVEA_FROM.country}` },
    { text: `Returns: ${SCALVEA_FROM.return_address}, ${SCALVEA_FROM.return_city}, ${SCALVEA_FROM.return_country}` },
    { text: `Support: ${SCALVEA_FROM.email}  ·  ${SCALVEA_FROM.website}` },
  ];

  const billLines = [
    { text: customerName, bold: true },
    ...(addrLine1 ? [{ text: addrLine1 }] : []),
    ...(addrLine2 ? [{ text: addrLine2 }] : []),
    ...(cityStateZip ? [{ text: `${cityStateZip}, ${country}` }] : (country ? [{ text: country }] : [])),
    ...(customerEmail ? [{ text: `Email: ${customerEmail}` }] : []),
    ...(customerPhone ? [{ text: `Phone: ${customerPhone}` }] : []),
  ];

  // Measure content heights to keep panels symmetrical
  const measureColumnHeight = (lines: { text: string; bold?: boolean }[]) => {
    let h = panelHeaderHeight + 3;
    doc.setFontSize(8);
    for (const l of lines) {
      doc.setFont("helvetica", l.bold ? "bold" : "normal");
      const split = wrapSafeText(doc, l.text, panelWidth - 7);
      h += split.length * 3.8;
    }
    return h + 3;
  };

  const panelHeight = Math.max(measureColumnHeight(fromLines), measureColumnHeight(billLines), 36);

  const drawAddressCard = (title: string, lines: { text: string; bold?: boolean }[], x: number, startY: number) => {
    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.2);
    doc.setFillColor(...COLOR.white);
    doc.roundedRect(x, startY, panelWidth, panelHeight, 1.2, 1.2, "FD");

    doc.setFillColor(...COLOR.accentBg);
    doc.roundedRect(x, startY, panelWidth, panelHeaderHeight, 1.2, 1.2, "F");
    doc.setDrawColor(...COLOR.lightGray);
    doc.line(x, startY + panelHeaderHeight, x + panelWidth, startY + panelHeaderHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR.black);
    doc.text(title, x + 3.5, startY + 4.5);

    let curY = startY + panelHeaderHeight + 4;
    for (const l of lines) {
      doc.setFont("helvetica", l.bold ? "bold" : "normal");
      doc.setFontSize(8);
      doc.setTextColor(...(l.bold ? COLOR.black : COLOR.darkGray));
      const split = wrapSafeText(doc, l.text, panelWidth - 7);
      doc.text(split, x + 3.5, curY);
      curY += split.length * 3.8;
    }
  };

  drawAddressCard("FROM (SELLER)", fromLines, MARGIN, y);
  drawAddressCard("BILL TO (CUSTOMER)", billLines, MARGIN + panelWidth + 6, y);

  y += panelHeight + 6;

  // ── 3. PRODUCT TABLE ────────────────────────────────────────────────────────
  const curSymbol = isAus ? "A$" : "₹";
  const tableHead = [
    ["#", "ITEM DESCRIPTION", "QTY", `MRP (${curSymbol})`, `UNIT PRICE (${curSymbol})`, `DISCOUNT (${curSymbol})`, `TOTAL (${curSymbol})`],
  ];

  const tableBody = items.map((item, index) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.price || 0);

    let mrp = unitPrice;
    if (item.product_id && mrpMap[item.product_id]) {
      mrp = mrpMap[item.product_id];
    } else if (item.original_price) {
      mrp = Number(item.original_price);
    }
    if (mrp < unitPrice) mrp = unitPrice;

    const discount = (mrp - unitPrice) * qty;
    const amount = unitPrice * qty;

    return [
      String(index + 1),
      item.product_name || "Scalvea Formulation",
      String(qty),
      fmtCurrency(mrp, cur),
      fmtCurrency(unitPrice, cur),
      discount > 0 ? `-${fmtCurrency(discount, cur)}` : "—",
      fmtCurrency(amount, cur),
    ];
  });

  if (tableBody.length === 0) {
    const totalFallback = Number(order.total_amount || 0);
    tableBody.push(["1", "Scalvea Hair Care Formulation", "1", fmtCurrency(totalFallback, cur), fmtCurrency(totalFallback, cur), "—", fmtCurrency(totalFallback, cur)]);
  }

  // Adaptive padding based on rows count to prevent multi-page spillover
  const rowCount = tableBody.length;
  const tableCellPadding = rowCount > 3 ? 3.5 : 4.2;

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: MARGIN, right: MARGIN },
    pageBreak: "avoid",
    styles: {
      fontSize: 8,
      cellPadding: tableCellPadding,
      textColor: COLOR.black,
      lineColor: COLOR.lightGray,
      lineWidth: 0.15,
      valign: "middle",
    },
    headStyles: {
      fillColor: COLOR.black,
      textColor: COLOR.white,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      valign: "middle",
      cellPadding: 4.2,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", cellWidth: 66 },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "right", cellWidth: 22 },
      4: { halign: "right", cellWidth: 24 },
      5: { halign: "right", cellWidth: 22 },
      6: { halign: "right", cellWidth: 24 },
    },
    alternateRowStyles: {
      fillColor: [253, 253, 253],
    },
    theme: "grid",
  });

  y = (doc as any).lastAutoTable.finalY + 6.5;

  // ── 4. LOWER SECTION: PAYMENT & ASSURANCE (LEFT) + FINANCIAL SUMMARY (RIGHT) ──
  const summaryWidth = 76;
  const leftColWidth = CONTENT_WIDTH - summaryWidth - 6; // 100 mm

  // Financial values
  const total = Number(order.total_amount || order.total || order.total_amount_payable || 0);
  const shipping = Number(order.shipping_amount || order.shipping_cost || 0);
  const discountAmount = Number(order.discount_amount || order.coupon_discount || 0);
  const subtotal = Number(order.subtotal || (total - shipping + discountAmount));

  // Verified GST / Tax Calculation
  let tax = Number(order.gst_amount || order.tax_amount || 0);
  if (tax === 0 && isAus && total > 0) {
    // 10% Australian GST included in gross retail price (ATO standard formula: Total / 11)
    tax = Number((total / 11).toFixed(2));
  }

  // Amount Paid & Balance Due
  const amountPaidRaw = order.amount_paid;
  let amountPaid = 0;
  if (amountPaidRaw !== undefined && amountPaidRaw !== null) {
    amountPaid = Number(amountPaidRaw);
  } else {
    const isPaid = ["paid", "completed", "successful"].includes(String(order.payment_status || "").toLowerCase());
    amountPaid = isPaid ? total : 0;
  }
  const balanceDue = Math.max(0, total - amountPaid);

  // Left Column Box 1: Payment & Transaction Details
  const payBoxHeaderHeight = 6;
  const payX = MARGIN;
  let leftCurY = y;

  const txnId = getTransactionReference(order);
  const carrierName = order.courier_name || order.courier || (isAus ? "Australia Post" : "Shiprocket Express");
  const trackingNo = order.tracking_number || order.awb || "Dispatched on fulfillment";

  const payFields = [
    { label: "Payment Gateway:", value: getFormattedPaymentMethod(order) },
    { label: "Payment Status:", value: String(order.payment_status || "—").replace(/_/g, " ").toUpperCase(), bold: true },
    { label: "Transaction Ref:", value: txnId },
    { label: "Delivery Carrier:", value: carrierName },
    { label: "Tracking Ref:", value: trackingNo },
  ];

  let payBoxContentH = payBoxHeaderHeight + 3.5;
  doc.setFontSize(7.5);
  for (const pf of payFields) {
    const valLines = wrapSafeText(doc, pf.value, leftColWidth - 32);
    payBoxContentH += Math.max(valLines.length * 3.6, 4.2);
  }
  const payBoxHeight = payBoxContentH + 2;

  // Render Box 1
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.2);
  doc.setFillColor(...COLOR.white);
  doc.roundedRect(payX, leftCurY, leftColWidth, payBoxHeight, 1.2, 1.2, "FD");

  doc.setFillColor(...COLOR.accentBg);
  doc.roundedRect(payX, leftCurY, leftColWidth, payBoxHeaderHeight, 1.2, 1.2, "F");
  doc.setDrawColor(...COLOR.lightGray);
  doc.line(payX, leftCurY + payBoxHeaderHeight, payX + leftColWidth, leftCurY + payBoxHeaderHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR.black);
  doc.text("PAYMENT & TRANSACTION RECORD", payX + 3.5, leftCurY + 4.3);

  let pLineY = leftCurY + payBoxHeaderHeight + 3.8;
  for (const pf of payFields) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR.darkGray);
    doc.text(pf.label, payX + 3.5, pLineY);

    doc.setFont("helvetica", pf.bold ? "bold" : "normal");
    doc.setTextColor(...COLOR.black);
    const valLines = wrapSafeText(doc, pf.value, leftColWidth - 34);
    doc.text(valLines, payX + 32, pLineY);
    pLineY += Math.max(valLines.length * 3.6, 4.2);
  }

  leftCurY += payBoxHeight + 4;

  // Left Column Box 2: Customer Care & Support Notice
  const assuranceBoxH = 16.5;
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.2);
  doc.setFillColor(...COLOR.white);
  doc.roundedRect(payX, leftCurY, leftColWidth, assuranceBoxH, 1.2, 1.2, "FD");

  doc.setFillColor(...COLOR.accentBg);
  doc.roundedRect(payX, leftCurY, leftColWidth, payBoxHeaderHeight, 1.2, 1.2, "F");
  doc.setDrawColor(...COLOR.lightGray);
  doc.line(payX, leftCurY + payBoxHeaderHeight, payX + leftColWidth, leftCurY + payBoxHeaderHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR.black);
  doc.text("SCALVEA CARE & POLICY ASSURANCE", payX + 3.5, leftCurY + 4.3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR.darkGray);
  const careNotice = "• Questions or customer care? Contact our team at info@scalvea.com.";
  const careLines = wrapSafeText(doc, careNotice, leftColWidth - 7);
  const policyY = leftCurY + payBoxHeaderHeight + 4.2;
  doc.text(careLines, payX + 3.5, policyY);
  leftCurY += assuranceBoxH;

  // Right Column: Financial Summary Table
  const summaryXOffset = PAGE_WIDTH - MARGIN - summaryWidth;
  let sumY = y;
  const summaryRowHeight = 7.2;

  const drawSummaryRow = (label: string, value: string, isGrandTotal = false, isSecondary = false) => {
    if (isGrandTotal) {
      doc.setFillColor(...COLOR.black);
      doc.rect(summaryXOffset, sumY, summaryWidth, summaryRowHeight + 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLOR.white);
      doc.text(label, summaryXOffset + 4, sumY + 5.5);
      doc.text(value, summaryXOffset + summaryWidth - 4, sumY + 5.5, { align: "right" });
      sumY += summaryRowHeight + 1;
    } else {
      doc.setDrawColor(...COLOR.lightGray);
      doc.setLineWidth(0.15);
      doc.rect(summaryXOffset, sumY, summaryWidth, summaryRowHeight);
      doc.setFont("helvetica", isSecondary ? "normal" : "bold");
      doc.setFontSize(8);
      doc.setTextColor(...(isSecondary ? COLOR.darkGray : COLOR.black));
      doc.text(label, summaryXOffset + 3.5, sumY + 4.8);
      doc.setFont("helvetica", isSecondary ? "normal" : "bold");
      doc.text(value, summaryXOffset + summaryWidth - 3.5, sumY + 4.8, { align: "right" });
      sumY += summaryRowHeight;
    }
  };

  drawSummaryRow("Items Subtotal", fmtCurrency(subtotal, cur), false, true);

  if (discountAmount > 0) {
    const discLabel = order.coupon_code ? `Discount (${order.coupon_code})` : "Discount Applied";
    drawSummaryRow(discLabel, `-${fmtCurrency(discountAmount, cur)}`, false, true);
  }

  drawSummaryRow("Shipping & Handling", shipping === 0 ? "FREE" : fmtCurrency(shipping, cur), false, true);

  if (tax > 0) {
    const taxLabel = isAus ? "GST (10% Included in Total)" : "Tax (Included in Total)";
    drawSummaryRow(taxLabel, fmtCurrency(tax, cur), false, true);
  }

  drawSummaryRow(isAus ? "TOTAL AUD (Inc. GST)" : "TOTAL DUE", fmtCurrency(total, cur), true);
  drawSummaryRow("Amount Paid", fmtCurrency(amountPaid, cur), false, false);

  if (balanceDue > 0) {
    drawSummaryRow("Balance Outstanding", fmtCurrency(balanceDue, cur), false, false);
  }

  // ── 5. FOOTER (Strict single-page enforcement) ──────────────────────────────
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(2);
  }
  doc.setPage(1);

  const footerY = PAGE_HEIGHT - 20;

  // Thin separator line
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, footerY - 4, PAGE_WIDTH - MARGIN, footerY - 4);

  // Scalvea Brand Signature
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.black);
  doc.text("SCALVEA", PAGE_WIDTH / 2, footerY + 1, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR.darkGray);
  doc.text("Care You Deserve  ·  info@scalvea.com  ·  www.scalvea.com", PAGE_WIDTH / 2, footerY + 5.5, { align: "center" });

  doc.setFontSize(6.8);
  doc.setTextColor(...COLOR.medGray);
  doc.text(
    "SCALVEA GROUPS PTY LTD  ·  ABN 99 696 417 679  ·  117/530 Little Collins St, Melbourne VIC 3000, Australia",
    PAGE_WIDTH / 2,
    footerY + 9.5,
    { align: "center" }
  );

  // ── Return or Save ─────────────────────────────────────────────────────────
  if (options.returnDoc) {
    return doc;
  }

  const fileName = `Invoice-${invoiceNumber}.pdf`;
  doc.save(fileName);
}
