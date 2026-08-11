import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/logo1.png";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
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
  darkGray: [60, 60, 60] as [number, number, number],
  medGray: [120, 120, 120] as [number, number, number],
  lightGray: [220, 220, 220] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 4.5;
const FOOTER_RESERVE = 30; // mm reserved for footer at bottom

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

function getTransactionId(order: OrderData): string {
  if (order.stripe_session_id) return order.stripe_session_id;
  if (order.fastrr_order_id) return order.fastrr_order_id;
  if (order.shiprocket_order_id) return order.shiprocket_order_id;
  return "—";
}

// ─── Main Generator ──────────────────────────────────────────────────────────

export async function generateInvoicePDF(order: OrderData): Promise<void> {
  const isAus = order.currency !== "INR";
  const cur = order.currency || (isAus ? "AUD" : "INR");
  const items = order.order_items || [];
  const addr = order.shipping_address || {};
  const billing = order.billing_address || addr;
  
  const prefix = cur === "INR" ? "SCV-IND-INV" : "SCV-AUS-INV";
  const numPart = (order.order_number || "").replace(/[^0-9]/g, "");
  const invoiceNumber = numPart ? `${prefix}-${numPart.padStart(4, "0")}` : `${prefix}-XXXX`;

  // Fetch actual MRPs from the database for these items if available
  const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
  const mrpMap: Record<string, number> = {};
  
  if (productIds.length > 0) {
    try {
      const { data } = await supabase
        .from("product_prices")
        .select("product_id, mrp_aud, mrp_inr, price_aud, price_inr")
        .in("product_id", productIds);
        
      if (data) {
        data.forEach((p) => {
          if (cur === "AUD") {
            mrpMap[p.product_id] = (p.mrp_aud && p.mrp_aud > 0) ? p.mrp_aud : p.price_aud;
          } else {
            mrpMap[p.product_id] = (p.mrp_inr && p.mrp_inr > 0) ? p.mrp_inr : p.price_inr;
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch MRPs", e);
    }
  }

  // Pre-load the logo
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadImage(logoUrl);
  } catch (e) {
    console.error("Could not load logo for invoice", e);
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  // ── Layout Engine Helpers ──

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > PAGE_HEIGHT - FOOTER_RESERVE) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const drawLabelValue = (label: string, value: string, x: number, startY: number, valueOffsetX: number, maxWidth: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.darkGray);
    doc.text(label, x, startY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.black);
    const valueLines = doc.splitTextToSize(value || "—", maxWidth - valueOffsetX);
    doc.text(valueLines, x + valueOffsetX, startY);
    
    return valueLines.length * LINE_HEIGHT;
  };

  // ── Header Section ───────────────────────────────────────────────────

  let leftY = y;
  // Left: Logo and Tagline
  if (logoImg) {
    const imgWidth = 45;
    const imgHeight = (logoImg.height / logoImg.width) * imgWidth;
    doc.addImage(logoImg, "PNG", MARGIN, leftY, imgWidth, imgHeight);
    leftY += imgHeight + 4;
  } else {
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR.black);
    doc.text("Scalvea", MARGIN, leftY + 8);
    leftY += 14;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.medGray);
  doc.text("CARE YOU DESERVE", MARGIN, leftY);
  leftY += LINE_HEIGHT;

  // Right: TAX INVOICE and details
  let rightY = y + 4;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  const title = isAus ? "TAX INVOICE" : "INVOICE";
  doc.text(title, PAGE_WIDTH - MARGIN, rightY, { align: "right" });
  rightY += 10;
  
  const metaDetails = [
    { label: "Invoice Number", value: invoiceNumber },
    { label: "Order Number", value: order.order_number || "—" },
    { label: "Invoice Date", value: fmtDate(new Date().toISOString()) },
    { label: "Order Date", value: fmtDate(order.created_at) },
    { label: "Payment Status", value: String(order.payment_status || "—").replace(/_/g, " ") },
    { label: "Payment Method", value: String(order.payment_method || "—").replace(/_/g, " ") },
  ];

  const metaBoxWidth = 85;
  const metaX = PAGE_WIDTH - MARGIN - metaBoxWidth;
  const labelWidth = 32;

  for (const item of metaDetails) {
    const h = drawLabelValue(item.label, item.value, metaX, rightY, labelWidth, metaBoxWidth);
    rightY += h;
  }

  y = Math.max(leftY, rightY) + 8;

  // ── Thick Separator Line ─────────────────────────────────────────────
  
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  // ── FROM / BILL TO Section ─────────────────────────────────────────────

  checkPageBreak(50); // Need roughly 50mm for the addresses

  const colWidth = CONTENT_WIDTH / 2 - 5;

  const drawAddressColumn = (title: string, lines: {text: string, bold?: boolean}[], startX: number, startY: number) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR.black);
    doc.text(title, startX, startY);
    
    let currentY = startY + 8;
    for (const line of lines) {
      if (!line.text) {
        currentY += LINE_HEIGHT;
        continue;
      }
      doc.setFont("helvetica", line.bold ? "bold" : "normal");
      doc.setFontSize(9);
      doc.setTextColor(...(line.bold ? COLOR.black : COLOR.darkGray));
      const split = doc.splitTextToSize(line.text, colWidth);
      doc.text(split, startX, currentY);
      currentY += split.length * LINE_HEIGHT;
    }
    return currentY;
  };

  const fromLines = [
    { text: SCALVEA_FROM.name, bold: true },
    { text: `Operating As: ${SCALVEA_FROM.operating_as}` },
    { text: `ABN: ${SCALVEA_FROM.abn}` },
    { text: "" },
    { text: SCALVEA_FROM.address },
    { text: `${SCALVEA_FROM.city}` },
    { text: SCALVEA_FROM.country },
    { text: "" },
    { text: "Returns & RTO Address:", bold: true },
    { text: SCALVEA_FROM.return_address },
    { text: `${SCALVEA_FROM.return_city}, ${SCALVEA_FROM.return_country}` },
    { text: "" },
    { text: SCALVEA_FROM.email },
    { text: SCALVEA_FROM.website },
  ];

  const customerName = order.customer_name
    || `${billing.first_name || billing.firstName || ""} ${billing.last_name || billing.lastName || ""}`.trim()
    || "Customer";
  const customerEmail = order.customer_email || billing.email || addr.email || "";
  const customerPhone = order.customer_phone || billing.phone || addr.phone || "";

  const billLines: { text: string, bold?: boolean }[] = [];
  if (customerName) billLines.push({ text: customerName, bold: true });
  if (customerEmail) billLines.push({ text: `Email: ${customerEmail}` });
  if (customerPhone) billLines.push({ text: `Phone: ${customerPhone}` });
  billLines.push({ text: "" });

  const addrLine1 = billing.address_line1 || billing.address || addr.address_line1 || addr.address;
  if (addrLine1) billLines.push({ text: addrLine1 });
  const addrLine2 = billing.address_line2 || addr.address_line2;
  if (addrLine2) billLines.push({ text: addrLine2 });
  const cityStateZip = `${billing.city || addr.city || ""} ${billing.state || addr.state || ""} ${billing.postcode || addr.postcode || ""}`.trim();
  if (cityStateZip) billLines.push({ text: cityStateZip });
  const country = billing.country || addr.country || order.country;
  if (country) billLines.push({ text: country });

  const fromEndY = drawAddressColumn("FROM", fromLines, MARGIN, y);
  const billEndY = drawAddressColumn("BILL TO", billLines, MARGIN + CONTENT_WIDTH / 2 + 5, y);

  y = Math.max(fromEndY, billEndY) + 12;

  // ── Product Table ──────────────────────────────────────────────────────
  
  const curSymbol = isAus ? "A$" : "₹";

  const tableHead = [
    ["#", "PRODUCT", "QTY", `MRP\n(${curSymbol})`, `UNIT PRICE\n(${curSymbol})`, `DISCOUNT\n(${curSymbol})`, `AMOUNT\n(${curSymbol})`],
  ];

  const tableBody = items.map((item, index) => {
    const qty = item.quantity || 1;
    const unitPrice = item.price || 0;
    
    // Resolve MRP: prefer DB mrpMap, then item.original_price, fallback to unitPrice
    let mrp = unitPrice;
    if (item.product_id && mrpMap[item.product_id]) {
      mrp = mrpMap[item.product_id];
    } else if (item.original_price) {
      mrp = item.original_price;
    }
    
    // If MRP is somehow lower than unit price, don't show negative discount. Just adjust MRP.
    if (mrp < unitPrice) mrp = unitPrice;

    const discount = (mrp - unitPrice) * qty;
    const amount = unitPrice * qty;

    return [
      String(index + 1),
      item.product_name || "Scalvea Product",
      String(qty),
      fmtCurrency(mrp, cur),
      fmtCurrency(unitPrice, cur),
      discount > 0 ? `-${fmtCurrency(discount, cur)}` : "—",
      fmtCurrency(amount, cur),
    ];
  });

  if (tableBody.length === 0) {
    tableBody.push(["", "No items recorded", "", "", "", "", ""]);
  }

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: MARGIN, right: MARGIN, bottom: FOOTER_RESERVE },
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: COLOR.black,
      lineColor: COLOR.lightGray,
      lineWidth: 0.1,
      valign: "middle",
    },
    headStyles: {
      fillColor: COLOR.black,
      textColor: COLOR.white,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", cellWidth: "auto" },
      2: { halign: "center", cellWidth: 15 },
      3: { halign: "right", cellWidth: 25 },
      4: { halign: "right", cellWidth: 25 },
      5: { halign: "right", cellWidth: 25 },
      6: { halign: "right", cellWidth: 25 },
    },
    theme: "grid",
    showHead: 'everyPage', // ensure headers repeat
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Financial Summary & Thank You ──────────────────────────────────────

  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shipping_amount || 0);
  const total = Number(order.total_amount || 0);
  const tax = Number(order.gst_amount || order.tax_amount || 0);

  const summaryWidth = 75;
  const summaryXOffset = PAGE_WIDTH - MARGIN - summaryWidth;
  const summaryRowHeight = 9;

  // Calculate total height of summary block to check page break
  const summaryRows = 4 + (tax > 0 ? 1 : 0); // Subtotal, Shipping, (Tax), Total, Amount Paid
  const summaryHeight = summaryRows * summaryRowHeight + 10;
  
  checkPageBreak(Math.max(summaryHeight, 30));

  // Left side: Thank you text (drawn at the same Y as the summary)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  doc.text("Thank you for your order!", MARGIN, y + 4);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.darkGray);
  doc.text("We appreciate your trust in Scalvea.", MARGIN, y + 12);
  doc.text("If you have any questions about your order,", MARGIN, y + 20);
  doc.text("please contact us at info@scalvea.com", MARGIN, y + 26);

  // Right side: Box for totals
  let sumY = y;
  
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.1);
  
  const drawSummaryRow = (label: string, value: string, isBold = false) => {
    doc.rect(summaryXOffset, sumY, summaryWidth, summaryRowHeight);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.black);
    doc.text(label, summaryXOffset + 4, sumY + 6);
    doc.text(value, summaryXOffset + summaryWidth - 4, sumY + 6, { align: "right" });
    sumY += summaryRowHeight;
  };

  drawSummaryRow("Subtotal", fmtCurrency(subtotal, cur));
  drawSummaryRow("Shipping", shipping === 0 ? "FREE" : fmtCurrency(shipping, cur));
  
  if (tax > 0) {
    drawSummaryRow(isAus ? "Tax (Included)" : "GST (Included)", fmtCurrency(tax, cur));
  }
  
  drawSummaryRow(`TOTAL`, fmtCurrency(total, cur), true);

  const amountPaidRaw = (order as any).amount_paid;
  let amountPaid = 0;
  if (amountPaidRaw !== undefined && amountPaidRaw !== null) {
    amountPaid = Number(amountPaidRaw);
  } else {
    amountPaid = (order.payment_status?.toLowerCase() === "paid" || order.payment_status?.toLowerCase() === "successful") ? total : 0;
  }
  drawSummaryRow("Amount Paid", fmtCurrency(amountPaid, cur), false);

  y = Math.max(y + 35, sumY) + 12;

  // ── Payment Information Box ────────────────────────────────────────────

  const paymentDetails = [
    { l: "Payment Method", v: String(order.payment_method || "—").replace(/_/g, " ") },
    { l: "Payment Status", v: String(order.payment_status || "—").replace(/_/g, " ") },
    { l: "Transaction ID", v: getTransactionId(order) },
  ];
  
  // Calculate height needed
  doc.setFontSize(9);
  let paymentBoxHeight = 12; // padding top + title
  const pLabelWidth = 32;
  const pMaxWidth = CONTENT_WIDTH - 8;
  
  for (const p of paymentDetails) {
    const lines = doc.splitTextToSize(p.v || "—", pMaxWidth - pLabelWidth);
    paymentBoxHeight += lines.length * LINE_HEIGHT;
  }
  paymentBoxHeight += 4; // padding bottom

  checkPageBreak(paymentBoxHeight + 10);

  doc.setDrawColor(...COLOR.lightGray);
  doc.rect(MARGIN, y, CONTENT_WIDTH, paymentBoxHeight);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  doc.text("PAYMENT INFORMATION", MARGIN + 4, y + 7);
  
  let py = y + 14;
  for (const p of paymentDetails) {
    const h = drawLabelValue(p.l, p.v, MARGIN + 4, py, pLabelWidth, pMaxWidth);
    py += h;
  }

  y += paymentBoxHeight + 10;

  // ── Footer ─────────────────────────────────────────────────────────────

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = PAGE_HEIGHT - 22;

    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, footerY - 5, PAGE_WIDTH - MARGIN, footerY - 5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR.black);
    doc.text("Scalvea", PAGE_WIDTH / 2, footerY + 1, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.darkGray);
    doc.text("Care You Deserve", PAGE_WIDTH / 2, footerY + 5, { align: "center" });
    doc.text("For any enquiries, please contact us at info@scalvea.com", PAGE_WIDTH / 2, footerY + 9, { align: "center" });
    doc.text("www.scalvea.com", PAGE_WIDTH / 2, footerY + 13, { align: "center" });
    
    if (pageCount > 1) {
      doc.setFontSize(7);
      doc.setTextColor(...COLOR.lightGray);
      doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, footerY + 13, { align: "right" });
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────

  const fileName = `Invoice-${invoiceNumber}.pdf`;
  doc.save(fileName);
}
