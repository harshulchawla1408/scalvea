export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
      country_settings: {
        Row: {
          country: string
          created_at: string | null
          currency: string
          currency_symbol: string
          delivery_time: string | null
          free_shipping_above: number | null
          id: string
          is_enabled: boolean | null
          shipping_charge: number | null
          tax_percentage: number | null
        }
        Insert: {
          country: string
          created_at?: string | null
          currency: string
          currency_symbol?: string
          delivery_time?: string | null
          free_shipping_above?: number | null
          id?: string
          is_enabled?: boolean | null
          shipping_charge?: number | null
          tax_percentage?: number | null
        }
        Update: {
          country?: string
          created_at?: string | null
          currency?: string
          currency_symbol?: string
          delivery_time?: string | null
          free_shipping_above?: number | null
          id?: string
          is_enabled?: boolean | null
          shipping_charge?: number | null
          tax_percentage?: number | null
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
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          currency?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity?: number
        }
        Update: {
          currency?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
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
          country: string
          coupon_code: string | null
          created_at: string | null
          currency: string
          delivery_estimate: string | null
          discount_amount: number | null
          gst: number | null
          id: string
          market: string | null
          order_number: string | null
          order_status: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string | null
          shipping_address: Json | null
          shipping_amount: number
          shipping_cost: number | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax_amount: number
          total: number | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          country?: string
          coupon_code?: string | null
          created_at?: string | null
          currency?: string
          delivery_estimate?: string | null
          discount_amount?: number | null
          gst?: number | null
          id?: string
          market?: string | null
          order_number?: string | null
          order_status?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          shipping_cost?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number
          total?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string
          coupon_code?: string | null
          created_at?: string | null
          currency?: string
          delivery_estimate?: string | null
          discount_amount?: number | null
          gst?: number | null
          id?: string
          market?: string | null
          order_number?: string | null
          order_status?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          shipping_cost?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number
          total?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_prices: {
        Row: {
          australia_price: number | null
          id: string
          india_price: number | null
          price_aud: number
          price_inr: number
          price_usd: number
          product_id: string
        }
        Insert: {
          australia_price?: number | null
          id?: string
          india_price?: number | null
          price_aud?: number
          price_inr?: number
          price_usd?: number
          product_id: string
        }
        Update: {
          australia_price?: number | null
          id?: string
          india_price?: number | null
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
          slug: string
          sku_india: string | null
          sku_australia: string | null
          updated_at: string | null
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
          slug: string
          sku_india?: string | null
          sku_australia?: string | null
          updated_at?: string | null
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
          slug?: string
          sku_india?: string | null
          sku_australia?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_blocked?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
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
