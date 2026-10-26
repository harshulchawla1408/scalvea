/**
 * scripts/test-invoice-generator.cjs
 * Comprehensive test harness for Scalvea PDF Invoice Generator.
 * Tests:
 * 1. Australian 1-product order (AUD, Stripe, Discount, Tax)
 * 2. Australian 3-product bundle order (AUD, Stripe, Free Shipping)
 * 3. Indian 2-product order (INR, Fastrr/COD, Free Delivery)
 * 4. Stress-test order with long customer name, multi-line address, and long transaction ID
 */

const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');
const sharp = require('sharp');

// Ensure output directory exists
const outDir = path.resolve(__dirname, '../dist/test-invoices');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Prepare flattened logo base64
let logoPngDataUrl = null;
try {
  const logoBuf = fs.readFileSync(path.resolve(__dirname, '../src/assets/logo.webp'));
  const pngBuf = sharp(logoBuf)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();
  // Wait synchronously
  const syncBuf = require('child_process').execSync(
    'node -e "const sharp=require(\'sharp\'); sharp(\'src/assets/logo.webp\').flatten({background:{r:255,g:255,b:255}}).png().toBuffer().then(b => process.stdout.write(b.toString(\'base64\')))"',
    { maxBuffer: 10 * 1024 * 1024 }
  );
  logoPngDataUrl = `data:image/png;base64,${syncBuf.toString('utf-8')}`;
  console.log('✅ Logo flattened to PNG base64, size:', logoPngDataUrl.length);
} catch (e) {
  console.warn('⚠️ Could not generate logo base64:', e.message);
}

// Export mock orders
const testOrders = [
  {
    name: '01_australian_single_product',
    data: {
      id: 'ord_au_001',
      order_number: 'SCV-2026-000110',
      created_at: '2026-10-26T14:05:00.000Z',
      country: 'Australia',
      currency: 'AUD',
      subtotal: 54.95,
      discount_amount: 5.00,
      shipping_amount: 0.00,
      tax_amount: 4.54,
      gst_amount: 4.54,
      total_amount: 49.95,
      payment_status: 'paid',
      payment_method: 'stripe',
      stripe_session_id: 'cs_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      customer_name: 'Sarah Jenkins',
      customer_email: 'sarah.jenkins@example.com.au',
      customer_phone: '+61 494 754 851',
      shipping_address: {
        first_name: 'Sarah',
        last_name: 'Jenkins',
        address_line1: '42 Collins Street, Level 14',
        address_line2: 'Apartment 1402',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'Australia',
      },
      order_items: [
        {
          product_name: 'Follicle 8 Hair Growth Serum',
          quantity: 1,
          price: 49.95,
          original_price: 54.95,
        },
      ],
    },
  },
  {
    name: '02_australian_bundle_three_products',
    data: {
      id: 'ord_au_002',
      order_number: 'SCV-2026-000111',
      created_at: '2026-10-26T16:30:00.000Z',
      country: 'Australia',
      currency: 'AUD',
      subtotal: 139.85,
      discount_amount: 39.85,
      coupon_code: 'BUNDLE-3FOR100',
      shipping_amount: 0.00,
      tax_amount: 9.09,
      gst_amount: 9.09,
      total_amount: 100.00,
      payment_status: 'paid',
      payment_method: 'stripe',
      stripe_session_id: 'cs_live_bundle_99887766554433221100',
      customer_name: 'Marcus Vance',
      customer_email: 'm.vance@sydneybusiness.com',
      customer_phone: '+61 412 345 678',
      shipping_address: {
        first_name: 'Marcus',
        last_name: 'Vance',
        address_line1: '88 George Street, The Rocks',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia',
      },
      order_items: [
        {
          product_name: 'Follicle 8 Hair Growth Serum (30 mL)',
          quantity: 2,
          price: 49.95,
          original_price: 54.95,
        },
        {
          product_name: 'Scalp-5 Anti Dandruff Serum (30 mL)',
          quantity: 1,
          price: 39.95,
          original_price: 44.95,
        },
      ],
    },
  },
  {
    name: '03_indian_two_products_inr',
    data: {
      id: 'ord_in_003',
      order_number: 'SCV-2026-000112',
      created_at: '2026-10-26T18:15:00.000Z',
      country: 'India',
      currency: 'INR',
      subtotal: 2398,
      discount_amount: 0,
      shipping_amount: 0,
      tax_amount: 365,
      gst_amount: 365,
      total_amount: 2398,
      payment_status: 'paid',
      payment_method: 'fastrr_upi',
      fastrr_order_id: 'fastrr_ord_987654321_in',
      customer_name: 'Aarav Sharma',
      customer_email: 'aarav.sharma@gmail.com',
      customer_phone: '+91 98765 43210',
      shipping_address: {
        first_name: 'Aarav',
        last_name: 'Sharma',
        address_line1: 'Flat 402, Godrej Woods, Sector 43',
        city: 'Noida',
        state: 'Uttar Pradesh',
        postcode: '201303',
        country: 'India',
      },
      order_items: [
        {
          product_name: 'Follicle 8 Hair Growth Serum',
          quantity: 1,
          price: 1499,
          original_price: 1999,
        },
        {
          product_name: 'Scalp-5 Anti Dandruff Hair Serum',
          quantity: 1,
          price: 899,
          original_price: 1199,
        },
      ],
    },
  },
  {
    name: '04_stress_test_long_address_and_id',
    data: {
      id: 'ord_stress_004',
      order_number: 'SCV-2026-000113',
      created_at: '2026-10-27T01:00:00.000Z',
      country: 'Australia',
      currency: 'AUD',
      subtotal: 104.90,
      discount_amount: 10.00,
      coupon_code: 'VIPCARE10',
      shipping_amount: 9.95,
      tax_amount: 9.54,
      gst_amount: 9.54,
      total_amount: 104.85,
      payment_status: 'paid',
      payment_method: 'stripe',
      stripe_session_id: 'ch_3Nzk7uLkdIwHu7ix0Habc123_very_long_transaction_reference_id_that_spans_multiple_lines_comfortably',
      customer_name: 'Dr. Alexander Maximilian Montgomery-Wellington III, Esq.',
      customer_email: 'alexander.maximilian.montgomery.wellington@medicalresearch.oxford.org.au',
      customer_phone: '+61 494 754 851',
      shipping_address: {
        first_name: 'Alexander',
        last_name: 'Montgomery-Wellington',
        address_line1: 'Penthouse Presidential Suite 1402, North Tower Residences, Royal Botanical Gardens',
        address_line2: '742 Evergreen Promenade Avenue West, Harbour Quarter Waterfront District',
        city: 'Southbank Melbourne',
        state: 'Victoria',
        postcode: '3006',
        country: 'Commonwealth of Australia',
      },
      order_items: [
        {
          product_name: 'Follicle 8 Hair Growth Serum — Advanced Clinical 30 mL Formulation with Redensyl & Procapil',
          quantity: 1,
          price: 49.95,
          original_price: 54.95,
        },
        {
          product_name: 'Hair Growth Serum — Black Edition Premium Deep Penetration Delivery System 30 mL',
          quantity: 1,
          price: 54.95,
          original_price: 59.95,
        },
      ],
    },
  },
];

module.exports = {
  testOrders,
  logoPngDataUrl,
  outDir,
};
