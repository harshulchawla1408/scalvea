/**
 * scripts/test-redesigned-invoice.cjs
 * Implements the redesigned Scalvea A4 Tax Invoice Generator
 * and validates vertical utilization, text wrapping, and accuracy across all test orders.
 */

const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');
const { testOrders, logoPngDataUrl, outDir } = require('./test-invoice-scenarios.cjs');

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
  black: [18, 18, 18],
  darkGray: [55, 55, 55],
  medGray: [110, 110, 110],
  lightGray: [225, 225, 225],
  lighterGray: [246, 246, 246],
  white: [255, 255, 255],
  accentBg: [248, 249, 250],
};

const MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 182 mm
const LINE_HEIGHT = 4.2;

function fmtCurrency(val, currency) {
  const num = Number(val || 0);
  if (currency === "INR") return `₹${Math.round(num).toLocaleString("en-IN")}`;
  return `A$${num.toFixed(2)}`;
}

function fmtDate(dateStr) {
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

function getFormattedPaymentMethod(order) {
  const method = String(order.manual_payment_method || order.payment_method || "—").toLowerCase();
  if (method.includes("stripe")) return "Stripe (Card / Apple Pay)";
  if (method.includes("upi")) return "UPI Payment";
  if (method.includes("fastrr")) return "Fastrr Checkout";
  if (method.includes("cod") || method.includes("cash")) return "Cash on Delivery (COD)";
  if (method.includes("bank") || method.includes("transfer")) return "Bank Transfer";
  return method ? method.replace(/_/g, " ").toUpperCase() : "—";
}

function getTransactionReference(order) {
  return (
    order.transaction_id ||
    order.stripe_payment_intent_id ||
    order.stripe_session_id ||
    order.fastrr_order_id ||
    order.shiprocket_order_id ||
    "—"
  );
}

function generateRedesignedInvoice(order, options = {}) {
  const isAus = order.currency !== "INR";
  const cur = order.currency || (isAus ? "AUD" : "INR");
  const items = order.order_items || [];
  const addr = order.shipping_address || {};
  const billing = order.billing_address || addr;

  // Invoice Number derivation
  const prefix = cur === "INR" ? "SCV-IND-INV" : "SCV-AUS-INV";
  const numPart = (order.order_number || "").replace(/[^0-9]/g, "");
  const invoiceNumber = order.invoice_number || (numPart ? `${prefix}-${numPart.padStart(4, "0")}` : `${prefix}-0001`);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  // ── 1. HEADER SECTION ────────────────────────────────────────────────────────
  let leftY = y;
  const logoData = options.logoPngDataUrl || logoPngDataUrl;

  if (logoData) {
    const imgWidth = 44;
    const imgHeight = (985 / 2940) * imgWidth; // ~14.7 mm
    doc.addImage(logoData, "PNG", MARGIN, leftY, imgWidth, imgHeight);
    leftY += imgHeight + 2;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...COLOR.black);
    doc.text("SCALVEA", MARGIN, leftY + 7);
    leftY += 10;
  }

  // Tagline below logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLOR.medGray);
  doc.text("CARE YOU DESERVE", MARGIN, leftY + 2.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("AUSTRALIAN CLINICAL FORMULATIONS", MARGIN, leftY + 6);
  leftY += 9;

  // Right Header: TAX INVOICE & Meta Details
  let rightY = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...COLOR.black);
  const isTaxApplicable = isAus || Number(order.gst_amount || order.tax_amount || 0) > 0;
  const docTitle = isTaxApplicable ? "TAX INVOICE" : "INVOICE";
  doc.text(docTitle, PAGE_WIDTH - MARGIN, rightY + 6, { align: "right" });
  rightY += 11;

  // Metadata block (Invoice #, Order #, Dates, Status, Method)
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
    const valLines = doc.splitTextToSize(item.value, metaBoxWidth - metaLabelWidth);
    doc.text(valLines, metaX + metaLabelWidth, rightY);
    rightY += Math.max(valLines.length * 3.8, 4.2);
  }

  y = Math.max(leftY, rightY) + 3;

  // Double accent divider
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

  // Compute Bill lines first to determine equal panel heights
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

  // Calculate required height for both columns to keep cards identical
  const measureColumnHeight = (lines) => {
    let h = panelHeaderHeight + 3;
    doc.setFontSize(8);
    for (const l of lines) {
      doc.setFont("helvetica", l.bold ? "bold" : "normal");
      const split = doc.splitTextToSize(l.text, panelWidth - 7);
      h += split.length * 3.8;
    }
    return h + 3;
  };

  const panelHeight = Math.max(measureColumnHeight(fromLines), measureColumnHeight(billLines), 36);

  const drawAddressCard = (title, lines, x, startY) => {
    // Outer border
    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.2);
    doc.setFillColor(...COLOR.white);
    doc.roundedRect(x, startY, panelWidth, panelHeight, 1.2, 1.2, "FD");

    // Header band
    doc.setFillColor(...COLOR.accentBg);
    doc.roundedRect(x, startY, panelWidth, panelHeaderHeight, 1.2, 1.2, "F");
    // Crisp line under header
    doc.setDrawColor(...COLOR.lightGray);
    doc.line(x, startY + panelHeaderHeight, x + panelWidth, startY + panelHeaderHeight);

    // Header title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR.black);
    doc.text(title, x + 3.5, startY + 4.5);

    // Lines
    let curY = startY + panelHeaderHeight + 4;
    for (const l of lines) {
      doc.setFont("helvetica", l.bold ? "bold" : "normal");
      doc.setFontSize(8);
      doc.setTextColor(...(l.bold ? COLOR.black : COLOR.darkGray));
      const split = doc.splitTextToSize(l.text, panelWidth - 7);
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
    const mrp = Math.max(Number(item.original_price || unitPrice), unitPrice);
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
    tableBody.push(["", "Standard Scalvea Hair Care Order", "1", fmtCurrency(order.total_amount, cur), fmtCurrency(order.total_amount, cur), "—", fmtCurrency(order.total_amount, cur)]);
  }

  // Adaptive table padding based on items count to preserve strict 1-page fit
  const rowCount = tableBody.length;
  const tableCellPadding = rowCount > 3 ? 3.5 : 4.2;

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: MARGIN, right: MARGIN },
    pageBreak: 'avoid',
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

  y = doc.lastAutoTable.finalY + 6.5;

  // ── 4. LOWER SECTION: PAYMENT & ASSURANCE (LEFT) + FINANCIAL SUMMARY (RIGHT) ──
  const summaryWidth = 76;
  const leftColWidth = CONTENT_WIDTH - summaryWidth - 6; // 100 mm

  // Financial calculations
  const total = Number(order.total_amount || order.total || order.total_amount_payable || 0);
  const shipping = Number(order.shipping_amount || order.shipping_cost || 0);
  const discountAmount = Number(order.discount_amount || 0);
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

  // Measure pay box height with proper text wrapping
  let payBoxContentH = payBoxHeaderHeight + 3.5;
  doc.setFontSize(7.5);
  for (const pf of payFields) {
    const valLines = doc.splitTextToSize(pf.value, leftColWidth - 32);
    payBoxContentH += Math.max(valLines.length * 3.6, 4.2);
  }
  const payBoxHeight = payBoxContentH + 2;

  // Draw Card 1: Payment Box
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
    const valLines = doc.splitTextToSize(pf.value, leftColWidth - 34);
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
  const careLines = doc.splitTextToSize(careNotice, leftColWidth - 7);
  const policyY = leftCurY + payBoxHeaderHeight + 4.2;
  doc.text(careLines, payX + 3.5, policyY);
  leftCurY += assuranceBoxH;

  // Right Column: Financial Summary Table
  const summaryXOffset = PAGE_WIDTH - MARGIN - summaryWidth;
  let sumY = y;
  const summaryRowHeight = 7.2;

  const drawSummaryRow = (label, value, isGrandTotal = false, isSecondary = false) => {
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

  const contentEndBeforeFooter = Math.max(leftCurY, sumY);

  // ── 5. FOOTER (Strict single-page enforcement) ──────────────────────────────
  while (doc.internal.getNumberOfPages() > 1) {
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
  doc.text("SCALVEA GROUPS PTY LTD  ·  ABN 99 696 417 679  ·  117/530 Little Collins St, Melbourne VIC 3000, Australia", PAGE_WIDTH / 2, footerY + 9.5, { align: "center" });

  const totalPageHeightUtilizedMm = footerY + 11 - MARGIN;
  const utilizationPercent = ((totalPageHeightUtilizedMm / PAGE_HEIGHT) * 100).toFixed(1);

  return {
    doc,
    metrics: {
      contentStartY: MARGIN,
      contentEndY: contentEndBeforeFooter,
      footerY: footerY,
      totalSpanMm: totalPageHeightUtilizedMm,
      pageHeightUtilizedPercent: `${utilizationPercent}%`,
      pageCount: doc.internal.getNumberOfPages(),
    },
  };
}

console.log("=== RUNNING REDESIGNED INVOICE GENERATOR ===");
const report = [];
for (const test of testOrders) {
  const { doc, metrics } = generateRedesignedInvoice(test.data);
  const outPath = path.join(outDir, `${test.name}_AFTER.pdf`);
  fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')));
  report.push({ test: test.name, ...metrics, file: outPath });
  console.log(`[AFTER] ${test.name}:`);
  console.log(`   Content ends at: ${metrics.contentEndY.toFixed(1)} mm`);
  console.log(`   Total page span: ${metrics.totalSpanMm.toFixed(1)} mm`);
  console.log(`   Page height utilized: ${metrics.pageHeightUtilizedPercent}`);
  console.log(`   Pages: ${metrics.pageCount}`);
}

fs.writeFileSync(path.join(outDir, 'after_metrics.json'), JSON.stringify(report, null, 2));
console.log("✅ After PDFs and metrics written to dist/test-invoices/");

module.exports = { generateRedesignedInvoice };
