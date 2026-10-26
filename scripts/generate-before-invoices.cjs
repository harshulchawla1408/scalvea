/**
 * scripts/generate-before-invoices.cjs
 * Runs the OLD/EXISTING generateInvoicePDF logic on the test orders
 * to measure baseline vertical utilization and save before PDFs.
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
  black: [0, 0, 0],
  darkGray: [60, 60, 60],
  medGray: [120, 120, 120],
  lightGray: [220, 220, 220],
  white: [255, 255, 255],
};

const MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
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

function generateOldInvoice(order) {
  const isAus = order.currency !== "INR";
  const cur = order.currency || (isAus ? "AUD" : "INR");
  const items = order.order_items || [];
  const addr = order.shipping_address || {};
  const billing = order.billing_address || addr;

  const prefix = cur === "INR" ? "SCV-IND-INV" : "SCV-AUS-INV";
  const numPart = (order.order_number || "").replace(/[^0-9]/g, "");
  const invoiceNumber = numPart ? `${prefix}-${numPart.padStart(4, "0")}` : `${prefix}-XXXX`;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  const drawLabelValue = (label, value, x, startY, valueOffsetX, maxWidth) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR.darkGray);
    doc.text(label, x, startY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.black);
    const valueLines = doc.splitTextToSize(value || "—", maxWidth - valueOffsetX);
    doc.text(valueLines, x + valueOffsetX, startY);

    return valueLines.length * LINE_HEIGHT;
  };

  // Header
  let leftY = y;
  if (logoPngDataUrl) {
    const imgWidth = 46;
    const imgHeight = (985 / 2940) * imgWidth;
    doc.addImage(logoPngDataUrl, "PNG", MARGIN, leftY, imgWidth, imgHeight);
    leftY += imgHeight + 2;
  } else {
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR.black);
    doc.text("Scalvea", MARGIN, leftY + 7);
    leftY += 12;
  }

  let rightY = y + 2;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  const title = isAus ? "TAX INVOICE" : "INVOICE";
  doc.text(title, PAGE_WIDTH - MARGIN, rightY, { align: "right" });
  rightY += 8;

  const metaDetails = [
    { label: "Invoice Number", value: invoiceNumber },
    { label: "Order Number", value: order.order_number || "—" },
    { label: "Invoice Date", value: fmtDate(new Date().toISOString()) },
    { label: "Order Date", value: fmtDate(order.created_at) },
    { label: "Payment Status", value: String(order.payment_status || "—").replace(/_/g, " ").toUpperCase() },
    { label: "Payment Method", value: String(order.payment_method || "—").replace(/_/g, " ").toUpperCase() },
  ];

  const metaBoxWidth = 84;
  const metaX = PAGE_WIDTH - MARGIN - metaBoxWidth;
  const labelWidth = 30;

  for (const item of metaDetails) {
    const h = drawLabelValue(item.label, item.value, metaX, rightY, labelWidth, metaBoxWidth);
    rightY += h;
  }

  y = Math.max(leftY, rightY) + 4;

  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;

  // Addresses
  const colWidth = CONTENT_WIDTH / 2 - 4;
  const drawAddressColumn = (sectionTitle, lines, startX, startY) => {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR.black);
    doc.text(sectionTitle, startX, startY);

    let currentY = startY + 6;
    for (const line of lines) {
      if (!line.text) continue;
      doc.setFont("helvetica", line.bold ? "bold" : "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...(line.bold ? COLOR.black : COLOR.darkGray));
      const split = doc.splitTextToSize(line.text, colWidth);
      doc.text(split, startX, currentY);
      currentY += split.length * LINE_HEIGHT;
    }
    return currentY;
  };

  const fromLines = [
    { text: SCALVEA_FROM.name, bold: true },
    { text: `Operating As: ${SCALVEA_FROM.operating_as}  |  ABN: ${SCALVEA_FROM.abn}` },
    { text: `${SCALVEA_FROM.address}, ${SCALVEA_FROM.city}, ${SCALVEA_FROM.country}` },
    { text: `Returns: ${SCALVEA_FROM.return_address}, ${SCALVEA_FROM.return_city}` },
    { text: `Email: ${SCALVEA_FROM.email}  |  Web: ${SCALVEA_FROM.website}` },
  ];

  const customerName = order.customer_name || "Customer";
  const customerEmail = order.customer_email || addr.email || "";
  const customerPhone = order.customer_phone || addr.phone || "";
  const addrLine1 = addr.address_line1 || addr.address || "";
  const addrLine2 = addr.address_line2 || "";
  const cityStateZip = `${addr.city || ""} ${addr.state || ""} ${addr.postcode || ""}`.trim();
  const country = addr.country || order.country || "";

  const billLines = [
    { text: customerName, bold: true },
    ...(customerEmail ? [{ text: `Email: ${customerEmail}` }] : []),
    ...(customerPhone ? [{ text: `Phone: ${customerPhone}` }] : []),
    ...(addrLine1 ? [{ text: addrLine1 + (addrLine2 ? `, ${addrLine2}` : "") }] : []),
    ...(cityStateZip ? [{ text: `${cityStateZip}${country ? `, ${country}` : ""}` }] : []),
  ];

  const fromEndY = drawAddressColumn("FROM", fromLines, MARGIN, y);
  const billEndY = drawAddressColumn("BILL TO", billLines, MARGIN + CONTENT_WIDTH / 2 + 4, y);

  y = Math.max(fromEndY, billEndY) + 8;

  // Product Table
  const curSymbol = isAus ? "A$" : "₹";
  const tableHead = [
    ["#", "PRODUCT", "QTY", `MRP (${curSymbol})`, `UNIT PRICE (${curSymbol})`, `DISCOUNT (${curSymbol})`, `AMOUNT (${curSymbol})`],
  ];

  const tableBody = items.map((item, index) => {
    const qty = item.quantity || 1;
    const unitPrice = item.price || 0;
    const mrp = item.original_price || unitPrice;
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

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: MARGIN, right: MARGIN },
    pageBreak: 'avoid',
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: COLOR.black,
      lineColor: COLOR.lightGray,
      lineWidth: 0.1,
      valign: "middle",
    },
    headStyles: {
      fillColor: COLOR.black,
      textColor: COLOR.white,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", cellWidth: "auto" },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "right", cellWidth: 24 },
      4: { halign: "right", cellWidth: 26 },
      5: { halign: "right", cellWidth: 24 },
      6: { halign: "right", cellWidth: 26 },
    },
    theme: "grid",
  });

  y = doc.lastAutoTable.finalY + 8;

  // Financial summary & payment
  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shipping_amount || 0);
  const total = Number(order.total_amount || 0);
  const tax = Number(order.gst_amount || order.tax_amount || 0);

  const summaryWidth = 76;
  const summaryXOffset = PAGE_WIDTH - MARGIN - summaryWidth;
  const summaryRowHeight = 7.5;

  const leftColWidth = CONTENT_WIDTH - summaryWidth - 8;
  let leftInfoY = y;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  doc.text("Thank you for your order!", MARGIN, leftInfoY + 4);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.darkGray);
  doc.text("We appreciate your trust in Scalvea.", MARGIN, leftInfoY + 9);
  doc.text("For any enquiries, contact us at info@scalvea.com", MARGIN, leftInfoY + 14);

  const payBoxY = leftInfoY + 20;
  const payBoxHeight = 24;
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.1);
  doc.rect(MARGIN, payBoxY, leftColWidth, payBoxHeight);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  doc.text("PAYMENT DETAILS", MARGIN + 3, payBoxY + 5.5);

  const payItems = [
    { l: "Method", v: String(order.payment_method || "—").replace(/_/g, " ").toUpperCase() },
    { l: "Status", v: String(order.payment_status || "—").replace(/_/g, " ").toUpperCase() },
    { l: "Transaction ID", v: order.stripe_session_id || order.fastrr_order_id || "—" },
  ];

  let currentPayY = payBoxY + 11;
  for (const pi of payItems) {
    drawLabelValue(pi.l, pi.v, MARGIN + 3, currentPayY, 26, leftColWidth - 6);
    currentPayY += 4.5;
  }

  let sumY = y;
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.1);

  const drawSummaryRow = (label, value, isBold = false) => {
    doc.rect(summaryXOffset, sumY, summaryWidth, summaryRowHeight);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR.black);
    doc.text(label, summaryXOffset + 3.5, sumY + 5.2);
    doc.text(value, summaryXOffset + summaryWidth - 3.5, sumY + 5.2, { align: "right" });
    sumY += summaryRowHeight;
  };

  drawSummaryRow("Subtotal", fmtCurrency(subtotal, cur));
  drawSummaryRow("Shipping", shipping === 0 ? "FREE" : fmtCurrency(shipping, cur));
  if (tax > 0) {
    drawSummaryRow(isAus ? "Tax (Included)" : "GST (Included)", fmtCurrency(tax, cur));
  }
  drawSummaryRow(`TOTAL`, fmtCurrency(total, cur), true);
  drawSummaryRow("Amount Paid", fmtCurrency(total, cur), false);

  const contentEndBeforeFooter = Math.max(payBoxY + payBoxHeight, sumY);

  // Footer
  while (doc.internal.getNumberOfPages() > 1) {
    doc.deletePage(2);
  }
  doc.setPage(1);
  const footerY = PAGE_HEIGHT - 18;

  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, footerY - 4, PAGE_WIDTH - MARGIN, footerY - 4);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR.black);
  doc.text("Scalvea", PAGE_WIDTH / 2, footerY + 2, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.darkGray);
  doc.text("Care You Deserve  ·  info@scalvea.com  ·  www.scalvea.com", PAGE_WIDTH / 2, footerY + 6.5, { align: "center" });

  return {
    doc,
    metrics: {
      contentStartY: MARGIN,
      contentEndY: contentEndBeforeFooter,
      footerY: footerY,
      emptySpaceBeforeFooterMm: (footerY - 4) - contentEndBeforeFooter,
      pageHeightUtilizedPercent: ((contentEndBeforeFooter) / PAGE_HEIGHT * 100).toFixed(1) + "%",
      pageCount: doc.internal.getNumberOfPages(),
    },
  };
}

console.log("=== RUNNING BEFORE INVOICE MEASUREMENTS ===");
const report = [];
for (const test of testOrders) {
  const { doc, metrics } = generateOldInvoice(test.data);
  const outPath = path.join(outDir, `${test.name}_BEFORE.pdf`);
  fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')));
  report.push({ test: test.name, ...metrics, file: outPath });
  console.log(`[BEFORE] ${test.name}:`);
  console.log(`   Content ends at: ${metrics.contentEndY.toFixed(1)} mm`);
  console.log(`   Blank space before footer: ${metrics.emptySpaceBeforeFooterMm.toFixed(1)} mm`);
  console.log(`   Page height utilized: ${metrics.pageHeightUtilizedPercent}`);
  console.log(`   Pages: ${metrics.pageCount}`);
}

fs.writeFileSync(path.join(outDir, 'before_metrics.json'), JSON.stringify(report, null, 2));
console.log("✅ Before PDFs and metrics written to dist/test-invoices/");
