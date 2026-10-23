export type CartStatus = "active" | "checkout_started" | "abandoned" | "purchased";

export interface CartItemRecord {
  id?: string;
  cart_id?: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartRecord {
  id: string;
  user_id: string;
  session_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  country: string;
  currency: string;
  raw_total: number;
  bundle_discount: number;
  total: number;
  item_count: number;
  status: CartStatus;
  computed_status?: CartStatus;
  last_event: string | null;
  event_id: string | null;
  metadata: Record<string, any>;
  abandoned_at: string | null;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
  items?: CartItemRecord[];
}

export interface CartEventRecord {
  id?: string;
  cart_id: string;
  user_id: string | null;
  event_name: "add_to_cart" | "remove_from_cart" | "update_quantity" | "begin_checkout" | "cart_abandoned" | "purchase";
  event_id?: string;
  value: number;
  currency: string;
  items: CartItemRecord[];
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface CartFilterOptions {
  status?: string;
  country?: string;
  searchQuery?: string;
  dateRange?: "all" | "today" | "7days" | "30days";
  minValue?: number;
}
