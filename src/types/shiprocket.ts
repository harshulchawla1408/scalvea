export interface ShiprocketProductSyncPayload {
  product: {
    id: string;
    sku: string;
    name: string;
    description?: string;
    price: number;
    inventory_quantity: number;
    weight: number;
    shiprocket_variant_id?: string;
  };
}

export interface ShiprocketOrderWebhookPayload {
  order_id: string;
  status: string;
  phone: string;
  email: string;
  payment_type: string;
  amount: number;
  items?: Array<{
    variant_id: string;
    quantity: number;
    price?: number;
    name?: string;
  }>;
}

export interface ShiprocketOrderDetails {
  order_id: string;
  status: string;
  amount: number;
  payment_method: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postcode: string;
    phone: string;
    email: string;
  };
  items: Array<{
    variant_id: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  coupon_code?: string;
  discount_amount?: number;
  tax_amount?: number;
  shipping_amount?: number;
  tracking_id?: string;
  courier_name?: string;
}
