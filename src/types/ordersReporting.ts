/**
 * ordersReporting.ts
 *
 * Types and interfaces for Scalvea Normalized Orders & Reporting System.
 * Adheres strictly to additive schema updates with full customer address normalization.
 */

export interface NormalizedOrder {
  id: string;
  order_number: string | null;
  created_at: string | null;
  updated_at: string | null;
  
  // Customer details
  user_id: string | null;
  customer_name: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  is_guest: boolean | null;

  // Shipping details
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postcode: string | null;
  shipping_country: string | null;
  shipping_address: any | null; // Raw JSON preserved

  // Billing details
  billing_first_name: string | null;
  billing_last_name: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_postcode: string | null;
  billing_country: string | null;
  billing_address: any | null; // Raw JSON preserved

  // Geography & Currency
  country: string;
  currency: string;
  market: string | null;
  order_source: string | null;
  source: string | null;
  sales_channel: string | null;

  // Financial fields
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number | null;
  total_amount: number;
  gst: number | null;
  shipping_cost: number | null;
  total: number | null;
  total_amount_payable: number | null;
  coupon_code: string | null;

  // Status & Delivery
  order_status: string;
  payment_status: string;
  fulfillment_status: string | null;
  payment_method: string | null;
  payment_provider: string | null;
  delivery_estimate: string | null;
  delivery_method: string | null;
  courier_name: string | null;
  courier: string | null;
  tracking_number: string | null;
  stripe_session_id: string | null;
  shiprocket_order_id: string | null;
  fastrr_order_id: string | null;
  created_by_admin: string | null;
  admin_created_at: string | null;
  admin_notes: string | null;
  manual_payment_method: string | null;
  edd_date: string | null;
  rto_prediction: string | null;
  shipping_plan: string | null;

  // Reporting additions
  product_summary?: string | null;
  total_items_count?: number | null;
  data_quality_flags?: string[] | null;
  order_items?: any[];
}

export type OrderSortField = "created_at" | "total_amount" | "customer_name" | "order_number";
export type SortDirection = "asc" | "desc";

export interface OrderFilterState {
  searchQuery: string;
  country: "All" | "Australia" | "India";
  state: string;
  city: string;
  postcode: string;
  orderStatus: string;
  paymentStatus: string;
  currency: "All" | "AUD" | "INR";
  source: "All" | "Online" | "Manual";
  dateRange: "all" | "today" | "7d" | "30d" | "this_month" | "custom";
  customStartDate: string;
  customEndDate: string;
  qualityFilter: "all" | "has_issues" | "complete";
  sortBy: OrderSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

/**
 * Meta Ads Custom Audience CSV format
 * Columns required: email, phone, fn, ln, ct, st, zp, country, value, currency
 */
export interface MetaAudienceExportRow {
  email: string;
  phone: string;
  fn: string;
  ln: string;
  ct: string;
  st: string;
  zp: string;
  country: string;
  value: string;
  currency: string;
}
