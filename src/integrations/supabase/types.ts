export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string | null
          first_name: string | null
          id: string
          is_default: boolean | null
          label: string | null
          last_name: string | null
          phone: string | null
          postcode: string | null
          state: string | null
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name?: string | null
          phone?: string | null
          postcode?: string | null
          state?: string | null
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name?: string | null
          phone?: string | null
          postcode?: string | null
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          country: string | null
          created_at: string | null
          discount_percentage: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_usage: number | null
          usage_count: number | null
        }
        Insert: {
          code: string
          country?: string | null
          created_at?: string | null
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_usage?: number | null
          usage_count?: number | null
        }
        Update: {
          code?: string
          country?: string | null
          created_at?: string | null
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_usage?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          change_amount: number
          created_at: string | null
          id: string
          new_quantity: number | null
          previous_quantity: number | null
          product_id: string
          reason: string | null
        }
        Insert: {
          change_amount: number
          created_at?: string | null
          id?: string
          new_quantity?: number | null
          previous_quantity?: number | null
          product_id: string
          reason?: string | null
        }
        Update: {
          change_amount?: number
          created_at?: string | null
          id?: string
          new_quantity?: number | null
          previous_quantity?: number | null
          product_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          currency: string
          id: string
          image_url: string | null
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          variant: string | null
        }
        Insert: {
          currency?: string
          id?: string
          image_url?: string | null
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity?: number
          sku?: string | null
          variant?: string | null
        }
        Update: {
          currency?: string
          id?: string
          image_url?: string | null
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          // Core fields
          id: string
          order_number: string | null
          created_at: string | null
          updated_at: string | null
          // Customer
          user_id: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          is_guest: boolean | null
          // Geography
          country: string
          currency: string
          market: string | null
          // Financials
          subtotal: number
          tax_amount: number
          shipping_amount: number
          discount_amount: number | null
          total_amount: number
          gst: number | null
          shipping_cost: number | null
          total: number | null
          coupon_code: string | null
          // Status
          order_status: string | null
          payment_status: string | null
          fulfillment_status: string | null
          // Payment
          payment_method: string | null
          payment_provider: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          transaction_id: string | null
          // Addresses
          shipping_address: Json | null
          billing_address: Json | null
          // Delivery
          delivery_estimate: string | null
          delivery_method: string | null
          courier_name: string | null
          courier: string | null
          tracking_number: string | null
          awb: string | null
          shipment_id: string | null
          shipping_label_url: string | null
          manifest_url: string | null
          pickup_status: string | null
          dispatch_date: string | null
          delivery_date: string | null
          // Order source
          order_source: string | null
          source: string | null
          platform: string | null
          sales_channel: string | null
          // Shiprocket
          shiprocket_order_id: string | null
          fastrr_order_id: string | null
          // Admin / Manual Order fields
          created_by_admin: string | null
          admin_created_at: string | null
          admin_notes: string | null
          notes: string | null
          manual_payment_method: string | null
          // Invoice
          invoice_number: string | null
          invoice_url: string | null
          tax_invoice: boolean | null
          // Misc
          gateway_response: Json | null
          total_amount_payable: number | null
        }
        Insert: {
          id?: string
          order_number?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          is_guest?: boolean | null
          country?: string
          currency?: string
          market?: string | null
          subtotal?: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number | null
          total_amount?: number
          gst?: number | null
          shipping_cost?: number | null
          total?: number | null
          coupon_code?: string | null
          order_status?: string | null
          payment_status?: string | null
          fulfillment_status?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          transaction_id?: string | null
          shipping_address?: Json | null
          billing_address?: Json | null
          delivery_estimate?: string | null
          delivery_method?: string | null
          courier_name?: string | null
          courier?: string | null
          tracking_number?: string | null
          awb?: string | null
          shipment_id?: string | null
          shipping_label_url?: string | null
          manifest_url?: string | null
          pickup_status?: string | null
          dispatch_date?: string | null
          delivery_date?: string | null
          order_source?: string | null
          source?: string | null
          platform?: string | null
          sales_channel?: string | null
          shiprocket_order_id?: string | null
          fastrr_order_id?: string | null
          created_by_admin?: string | null
          admin_created_at?: string | null
          admin_notes?: string | null
          notes?: string | null
          manual_payment_method?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          tax_invoice?: boolean | null
          gateway_response?: Json | null
          total_amount_payable?: number | null
        }
        Update: {
          id?: string
          order_number?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          is_guest?: boolean | null
          country?: string
          currency?: string
          market?: string | null
          subtotal?: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number | null
          total_amount?: number
          gst?: number | null
          shipping_cost?: number | null
          total?: number | null
          coupon_code?: string | null
          order_status?: string | null
          payment_status?: string | null
          fulfillment_status?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          transaction_id?: string | null
          shipping_address?: Json | null
          billing_address?: Json | null
          delivery_estimate?: string | null
          delivery_method?: string | null
          courier_name?: string | null
          courier?: string | null
          tracking_number?: string | null
          awb?: string | null
          shipment_id?: string | null
          shipping_label_url?: string | null
          manifest_url?: string | null
          pickup_status?: string | null
          dispatch_date?: string | null
          delivery_date?: string | null
          order_source?: string | null
          source?: string | null
          platform?: string | null
          sales_channel?: string | null
          shiprocket_order_id?: string | null
          fastrr_order_id?: string | null
          created_by_admin?: string | null
          admin_created_at?: string | null
          admin_notes?: string | null
          notes?: string | null
          manual_payment_method?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          tax_invoice?: boolean | null
          gateway_response?: Json | null
          total_amount_payable?: number | null
        }
        Relationships: []
      }
      product_prices: {
        Row: {
          australia_price: number | null
          id: string
          india_price: number | null
          mrp_aud: number | null
          mrp_inr: number | null
          price_aud: number
          price_inr: number
          price_usd: number
          product_id: string
        }
        Insert: {
          australia_price?: number | null
          id?: string
          india_price?: number | null
          mrp_aud?: number | null
          mrp_inr?: number | null
          price_aud?: number
          price_inr?: number
          price_usd?: number
          product_id: string
        }
        Update: {
          australia_price?: number | null
          id?: string
          india_price?: number | null
          mrp_aud?: number | null
          mrp_inr?: number | null
          price_aud?: number
          price_inr?: number
          price_usd?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          category: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          how_to_use: string | null
          id: string
          images: string[] | null
          ingredients: string | null
          inventory_quantity: number | null
          inventory_quantity_india: number | null
          inventory_quantity_australia: number | null
          is_active: boolean | null
          is_active_india: boolean | null
          is_active_australia: boolean | null
          key_ingredients: string[] | null
          low_stock_threshold: number | null
          name: string
          size: string | null
          sku: string | null
          sku_india: string | null
          sku_australia: string | null
          slug: string
          updated_at: string | null
          weight: number | null
          shiprocket_product_id: number | null
          shiprocket_variant_id: number | null
        }
        Insert: {
          badge?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          how_to_use?: string | null
          id?: string
          images?: string[] | null
          ingredients?: string | null
          inventory_quantity?: number | null
          inventory_quantity_india?: number | null
          inventory_quantity_australia?: number | null
          is_active?: boolean | null
          is_active_india?: boolean | null
          is_active_australia?: boolean | null
          key_ingredients?: string[] | null
          low_stock_threshold?: number | null
          name: string
          size?: string | null
          sku?: string | null
          sku_india?: string | null
          sku_australia?: string | null
          slug: string
          updated_at?: string | null
          weight?: number | null
          shiprocket_product_id?: number | null
          shiprocket_variant_id?: number | null
        }
        Update: {
          badge?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          how_to_use?: string | null
          id?: string
          images?: string[] | null
          ingredients?: string | null
          inventory_quantity?: number | null
          inventory_quantity_india?: number | null
          inventory_quantity_australia?: number | null
          is_active?: boolean | null
          is_active_india?: boolean | null
          is_active_australia?: boolean | null
          key_ingredients?: string[] | null
          low_stock_threshold?: number | null
          name?: string
          size?: string | null
          sku?: string | null
          sku_india?: string | null
          sku_australia?: string | null
          slug?: string
          updated_at?: string | null
          weight?: number | null
          shiprocket_product_id?: number | null
          shiprocket_variant_id?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_blocked?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          product_id: string
          rating: number
          reviewer_name: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          rating: number
          reviewer_name?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          rating?: number
          reviewer_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
