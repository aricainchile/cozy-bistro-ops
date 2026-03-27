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
      cash_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_amount: number | null
          id: string
          is_open: boolean
          notes: string | null
          opened_at: string
          opened_by: string
          opening_amount: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          id?: string
          is_open?: boolean
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_amount?: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          id?: string
          is_open?: boolean
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_amount?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          print_destination: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          print_destination?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          print_destination?: string
          sort_order?: number
        }
        Relationships: []
      }
      delivery_orders: {
        Row: {
          assigned_driver: string | null
          created_at: string
          customer_address: string
          customer_name: string
          customer_phone: string
          delivery_notes: string | null
          estimated_time: string | null
          id: string
          order_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          assigned_driver?: string | null
          created_at?: string
          customer_address?: string
          customer_name: string
          customer_phone?: string
          delivery_notes?: string | null
          estimated_time?: string | null
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          assigned_driver?: string | null
          created_at?: string
          customer_address?: string
          customer_name?: string
          customer_phone?: string
          delivery_notes?: string | null
          estimated_time?: string | null
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          min_stock: number
          product_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number
          product_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number
          product_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          inventory_item_id: string
          invoice_number: string | null
          quantity: number
          reason: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          inventory_item_id: string
          invoice_number?: string | null
          quantity: number
          reason?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          inventory_item_id?: string
          invoice_number?: string | null
          quantity?: number
          reason?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_visit_at: string
          name: string
          phone: string
          points: number
          tier: string
          total_spent: number
          total_visits: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit_at?: string
          name: string
          phone?: string
          points?: number
          tier?: string
          total_spent?: number
          total_visits?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit_at?: string
          name?: string
          phone?: string
          points?: number
          tier?: string
          total_spent?: number
          total_visits?: number
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          points_cost: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          points_cost?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          points_cost?: number
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          reward_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          reward_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          reward_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          subtotal?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
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
          created_at: string
          created_by: string
          guests: number
          id: string
          notes: string | null
          order_number: number
          status: Database["public"]["Enums"]["order_status"]
          table_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          guests?: number
          id?: string
          notes?: string | null
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          guests?: number
          id?: string
          notes?: string | null
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          cash_session_id: string | null
          created_at: string
          created_by: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          receipt_number: number
          tip: number
        }
        Insert: {
          amount: number
          cash_session_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          receipt_number?: number
          tip?: number
        }
        Update: {
          amount?: number
          cash_session_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          receipt_number?: number
          tip?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          created_at: string
          destination: string
          id: string
          items: Json
          order_id: string
          order_number: number
          status: string
          table_info: string
        }
        Insert: {
          created_at?: string
          destination: string
          id?: string
          items?: Json
          order_id: string
          order_number: number
          status?: string
          table_info?: string
        }
        Update: {
          created_at?: string
          destination?: string
          id?: string
          items?: Json
          order_id?: string
          order_number?: number
          status?: string
          table_info?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          ip_address: string
          location: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          ip_address?: string
          location?: string
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          ip_address?: string
          location?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          description: string | null
          discount: number | null
          id: string
          image_url: string | null
          name: string
          price: number
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          created_at: string
          guests: number | null
          id: string
          seats: number
          status: Database["public"]["Enums"]["table_status"]
          table_number: number
          updated_at: string
          waiter_name: string | null
        }
        Insert: {
          created_at?: string
          guests?: number | null
          id?: string
          seats?: number
          status?: Database["public"]["Enums"]["table_status"]
          table_number: number
          updated_at?: string
          waiter_name?: string | null
        }
        Update: {
          created_at?: string
          guests?: number | null
          id?: string
          seats?: number
          status?: Database["public"]["Enums"]["table_status"]
          table_number?: number
          updated_at?: string
          waiter_name?: string | null
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          id: string
          notes: string | null
          shift_id: string | null
          staff_id: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          staff_id: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "staff_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          hire_date: string
          id: string
          name: string
          phone: string
          role: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          hire_date?: string
          id?: string
          name: string
          phone?: string
          role?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          hire_date?: string
          id?: string
          name?: string
          phone?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_shifts: {
        Row: {
          created_at: string
          created_by: string
          end_time: string
          id: string
          notes: string | null
          shift_date: string
          staff_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          notes?: string | null
          shift_date: string
          staff_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          notes?: string | null
          shift_date?: string
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          created_at: string
          id: string
          report_data: Json
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_data?: Json
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          report_data?: Json
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "garzon" | "jefe_local" | "admin"
      delivery_status:
        | "pendiente"
        | "preparando"
        | "en_camino"
        | "entregado"
        | "cancelado"
      movement_type: "entrada" | "salida" | "ajuste" | "venta"
      order_status:
        | "pending"
        | "in_preparation"
        | "ready"
        | "served"
        | "cancelled"
      payment_method:
        | "efectivo"
        | "debito"
        | "credito"
        | "transferencia"
        | "cuenta_empresa"
      table_status: "available" | "occupied" | "reserved"
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
      app_role: ["garzon", "jefe_local", "admin"],
      delivery_status: [
        "pendiente",
        "preparando",
        "en_camino",
        "entregado",
        "cancelado",
      ],
      movement_type: ["entrada", "salida", "ajuste", "venta"],
      order_status: [
        "pending",
        "in_preparation",
        "ready",
        "served",
        "cancelled",
      ],
      payment_method: [
        "efectivo",
        "debito",
        "credito",
        "transferencia",
        "cuenta_empresa",
      ],
      table_status: ["available", "occupied", "reserved"],
    },
  },
} as const
