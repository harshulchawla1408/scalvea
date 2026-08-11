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
  medGray: [100, 100, 100] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
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
  const invoiceNumber = `${prefix}-${numPart.padStart(4, "0")}`;

  // Fetch actual MRPs from the database for these items if available
  const productIds = items.map((i) => i.product_id).filter(Boolean);
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
            mrpMap[p.product_id] = p.mrp_aud > 0 ? p.mrp_aud : p.price_aud;
          } else {
            mrpMap[p.product_id] = p.mrp_inr > 0 ? p.mrp_inr : p.price_inr;
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
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Header Section ───────────────────────────────────────────────────

  // Left: Logo and Tagline
  if (logoImg) {
    // Keep aspect ratio, scale width to ~50mm
    const imgWidth = 50;
    const imgHeight = (logoImg.height / logoImg.width) * imgWidth;
    doc.addImage(logoImg, "PNG", margin, y, imgWidth, imgHeight);
    y += imgHeight + 4;
  } else {
    doc.setFontSize(26);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.black);
    doc.text("Scalvea", margin, y + 10);
    y += 16;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.medGray);
  doc.text("CARE YOU DESERVE", margin, y);

  // Right: TAX INVOICE and details
  let rightY = margin + 5;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  const title = isAus ? "TAX INVOICE" : "INVOICE";
  doc.text(title, pageWidth - margin, rightY, { align: "right" });
  
  rightY += 12;
  
  const metaDetails = [
    { label: "Invoice Number", value: `:   ${invoiceNumber}` },
    { label: "Order Number", value: `:   ${order.order_number || "—"}` },
    { label: "Invoice Date", value: `:   ${fmtDate(new Date().toISOString())}` },
    { label: "Order Date", value: `:   ${fmtDate(order.created_at)}` },
    { label: "Payment Status", value: `:   ${(order.payment_status || "—").replace(/_/g, " ")}` },
    { label: "Payment Method", value: `:   ${(order.payment_method || "—").replace(/_/g, " ")}` },
  ];

  const metaLabelX = pageWidth - margin - 55;
  const metaValueX = pageWidth - margin - 35;
  
  for (const item of metaDetails) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR.black);
    doc.text(item.label, metaLabelX, rightY);
    
    doc.setFont("helvetica", "normal");
    doc.text(item.value, metaValueX, rightY);
    rightY += 6;
  }

  y = Math.max(y + 10, rightY + 5);

  // ── Thick Separator Line ─────────────────────────────────────────────
  
  doc.setDrawColor(...COLOR.black);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── FROM / BILL TO Section ─────────────────────────────────────────────

  const colWidth = contentWidth / 2;
  const addressFontSize = 9;
  const addressLineHeight = 5.5;

  // FROM column
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  doc.text("FROM", margin, y);
  y += 8;

  const fromLines = [
    { text: SCALVEA_FROM.name, bold: true },
    { text: `(Operating As: ${SCALVEA_FROM.operating_as})`, bold: false },
    { text: `ABN: ${SCALVEA_FROM.abn}`, bold: false },
    { text: "", bold: false },
    { text: SCALVEA_FROM.address, bold: false },
    { text: `${SCALVEA_FROM.city}, ${SCALVEA_FROM.country}`, bold: false },
    { text: "", bold: false },
    { text: "Returns & RTO Address:", bold: false },
    { text: SCALVEA_FROM.return_address, bold: false },
    { text: `${SCALVEA_FROM.return_city}, ${SCALVEA_FROM.return_country}`, bold: false },
    { text: "", bold: false },
    { text: `Email: ${SCALVEA_FROM.email}`, bold: false },
    { text: `Website: ${SCALVEA_FROM.website}`, bold: false },
  ];

  let fromY = y;
  for (const line of fromLines) {
    doc.setFont("helvetica", line.bold ? "bold" : "normal");
    doc.setFontSize(addressFontSize);
    doc.text(line.text, margin, fromY);
    fromY += addressLineHeight;
  }

  // BILL TO column
  const billX = margin + colWidth;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  doc.text("BILL TO", billX, y - 8);

  const customerName = order.customer_name
    || `${billing.first_name || billing.firstName || ""} ${billing.last_name || billing.lastName || ""}`.trim()
    || "Customer";
  const customerEmail = order.customer_email || billing.email || addr.email || "";
  const customerPhone = order.customer_phone || billing.phone || addr.phone || "";

  const billLines = [
    { text: customerName, bold: false },
    { text: customerEmail ? `Email: ${customerEmail}` : "", bold: false },
    { text: customerPhone ? `Phone: ${customerPhone}` : "", bold: false },
    { text: "", bold: false },
    { text: billing.address || billing.address_line1 || addr.address || addr.address_line1 || "", bold: false },
    { text: billing.address_line2 || addr.address_line2 || "", bold: false },
    { text: `${billing.city || addr.city || ""} ${billing.state || addr.state || ""} ${billing.postcode || addr.postcode || ""}`.trim(), bold: false },
    { text: billing.country || addr.country || order.country || "", bold: false },
  ].filter(l => l.text !== "" || l.text === "");

  let billY = y;
  for (const line of billLines) {
    if (!line.text) { billY += addressLineHeight; continue; }
    doc.setFont("helvetica", line.bold ? "bold" : "normal");
    doc.setFontSize(addressFontSize);
    doc.text(line.text, billX, billY);
    billY += addressLineHeight;
  }

  y = Math.max(fromY, billY) + 6;

  // ── Product Table ──────────────────────────────────────────────────────

  const tableHead = [
    ["#", "PRODUCT", "QTY", `MRP (${cur})`, `UNIT PRICE\n(AFTER DISCOUNT) (${cur})`, `DISCOUNT\n(${cur})`, `AMOUNT (${cur})`],
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
    
    const discount = (mrp - unitPrice) * qty;
    const amount = unitPrice * qty;

    // We can simulate strikethrough in standard jsPDF text but it's complex inside autoTable.
    // Instead we will just show the MRP.
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
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: COLOR.black,
      lineColor: COLOR.black,
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
      3: { halign: "center", cellWidth: 25 },
      4: { halign: "center", cellWidth: 32 },
      5: { halign: "center", cellWidth: 25 },
      6: { halign: "center", cellWidth: 25 },
    },
    theme: "grid",
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Financial Summary & Thank You Box ──────────────────────────────────

  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shipping_amount || 0);
  const total = Number(order.total_amount || 0);
  const tax = Number(order.gst_amount || order.tax_amount || 0);

  const summaryXOffset = pageWidth / 2 + 10;
  const summaryWidth = pageWidth - margin - summaryXOffset;
  
  // Left side: Thank you text
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for your order!", margin, y + 4);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("We appreciate your trust in Scalvea.", margin, y + 12);
  doc.text("If you have any questions about your order,", margin, y + 20);
  doc.text("please contact us at info@scalvea.com", margin, y + 26);

  // Right side: Box for totals
  let sumY = y;
  const rowHeight = 9;
  
  doc.setDrawColor(...COLOR.black);
  doc.setLineWidth(0.1);
  
  const drawSummaryRow = (label: string, value: string, isTotal = false) => {
    doc.rect(summaryXOffset, sumY, summaryWidth, rowHeight);
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(9);
    doc.text(label, summaryXOffset + 4, sumY + 6);
    doc.text(value, summaryXOffset + summaryWidth - 4, sumY + 6, { align: "right" });
    sumY += rowHeight;
  };

  drawSummaryRow("Subtotal (Product)", fmtCurrency(subtotal, cur));
  
  // Fix the shipping label logic
  const shippingLabel = "Shipping Fee";
  drawSummaryRow(shippingLabel, shipping === 0 ? "FREE" : fmtCurrency(shipping, cur));
  
  if (tax > 0) {
    drawSummaryRow(isAus ? "Tax (Included)" : "GST (Included)", fmtCurrency(tax, cur));
  }
  
  drawSummaryRow(`TOTAL (${cur})`, fmtCurrency(total, cur), true);
  drawSummaryRow("Amount Paid", fmtCurrency(total, cur), false);

  y = Math.max(y + 35, sumY) + 5;
  
  // Small thank you string under the totals
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for shopping with Scalvea.", pageWidth - margin, y, { align: "right" });

  y += 8;

  // ── Payment Information Box ────────────────────────────────────────────

  doc.rect(margin, y, contentWidth, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT INFORMATION", margin + 4, y + 6);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const paymentDetails = [
    { l: "Payment Method", v: `:   ${(order.payment_method || "—").replace(/_/g, " ")}` },
    { l: "Payment Status", v: `:   ${(order.payment_status || "—").replace(/_/g, " ")}` },
    { l: "Transaction ID", v: `:   ${getTransactionId(order)}` },
  ];
  
  let py = y + 12;
  for (const p of paymentDetails) {
    doc.text(p.l, margin + 4, py);
    doc.text(p.v, margin + 35, py);
    py += 5;
  }

  // ── Footer ─────────────────────────────────────────────────────────────

  const footerY = doc.internal.pageSize.getHeight() - 15;

  doc.setDrawColor(...COLOR.black);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Scalvea", pageWidth / 2, footerY + 1, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Care You Deserve", pageWidth / 2, footerY + 5, { align: "center" });
  doc.text("For any enquiries, please contact us at info@scalvea.com", pageWidth / 2, footerY + 9, { align: "center" });
  doc.text("www.scalvea.com", pageWidth / 2, footerY + 13, { align: "center" });

  // ── Save ───────────────────────────────────────────────────────────────

  const fileName = `Invoice-${invoiceNumber}.pdf`;
  doc.save(fileName);
}
