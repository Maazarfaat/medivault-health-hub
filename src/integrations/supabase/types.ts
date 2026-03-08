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
      blood_test_bookings: {
        Row: {
          appointment_date: string
          centre_id: string | null
          created_at: string
          id: string
          notes: string | null
          preferred_time: string | null
          status: Database["public"]["Enums"]["booking_status"]
          test_type: string
          updated_at: string
          user_id: string
          user_latitude: number | null
          user_longitude: number | null
        }
        Insert: {
          appointment_date: string
          centre_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          test_type: string
          updated_at?: string
          user_id: string
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Update: {
          appointment_date?: string
          centre_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          test_type?: string
          updated_at?: string
          user_id?: string
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Relationships: []
      }
      csv_uploads: {
        Row: {
          created_at: string
          error_records: number
          id: string
          pharmacy_id: string
          processed_records: number
          total_records: number
          upload_date: string
        }
        Insert: {
          created_at?: string
          error_records?: number
          id?: string
          pharmacy_id: string
          processed_records?: number
          total_records?: number
          upload_date?: string
        }
        Update: {
          created_at?: string
          error_records?: number
          id?: string
          pharmacy_id?: string
          processed_records?: number
          total_records?: number
          upload_date?: string
        }
        Relationships: []
      }
      hospital_inventory: {
        Row: {
          batch_number: string | null
          created_at: string
          expiry_date: string
          hospital_id: string
          id: string
          name: string
          quantity: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiry_date: string
          hospital_id: string
          id?: string
          name: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string
          hospital_id?: string
          id?: string
          name?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      pharmacy_inventory: {
        Row: {
          batch_number: string | null
          created_at: string
          expiry_date: string
          id: string
          name: string
          pharmacy_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiry_date: string
          id?: string
          name: string
          pharmacy_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string
          id?: string
          name?: string
          pharmacy_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          language: string | null
          latitude: number | null
          longitude: number | null
          mobile_number: string | null
          mobile_verified: boolean | null
          name: string
          profile_completion: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          language?: string | null
          latitude?: number | null
          longitude?: number | null
          mobile_number?: string | null
          mobile_verified?: boolean | null
          name: string
          profile_completion?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          language?: string | null
          latitude?: number | null
          longitude?: number | null
          mobile_number?: string | null
          mobile_verified?: boolean | null
          name?: string
          profile_completion?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restock_requests: {
        Row: {
          id: string
          medicine_name: string
          pharmacy_id: string | null
          request_date: string
          requested_quantity: number
          status: Database["public"]["Enums"]["restock_status"]
          updated_at: string
          user_id: string
          user_latitude: number | null
          user_longitude: number | null
        }
        Insert: {
          id?: string
          medicine_name: string
          pharmacy_id?: string | null
          request_date?: string
          requested_quantity: number
          status?: Database["public"]["Enums"]["restock_status"]
          updated_at?: string
          user_id: string
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Update: {
          id?: string
          medicine_name?: string
          pharmacy_id?: string | null
          request_date?: string
          requested_quantity?: number
          status?: Database["public"]["Enums"]["restock_status"]
          updated_at?: string
          user_id?: string
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          batch_number: string | null
          created_at: string
          customer_id: string | null
          customer_mobile: string
          expiry_date: string | null
          id: string
          medicine_name: string
          pharmacy_id: string
          quantity: number
          sale_date: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          customer_id?: string | null
          customer_mobile: string
          expiry_date?: string | null
          id?: string
          medicine_name: string
          pharmacy_id: string
          quantity: number
          sale_date?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          customer_id?: string | null
          customer_mobile?: string
          expiry_date?: string | null
          id?: string
          medicine_name?: string
          pharmacy_id?: string
          quantity?: number
          sale_date?: string
        }
        Relationships: []
      }
      user_medicines: {
        Row: {
          added_method: Database["public"]["Enums"]["add_method"]
          batch_number: string | null
          created_at: string
          dosage: string | null
          doses_taken: number | null
          expiry_date: string
          id: string
          name: string
          prescribed_doses: number | null
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          added_method?: Database["public"]["Enums"]["add_method"]
          batch_number?: string | null
          created_at?: string
          dosage?: string | null
          doses_taken?: number | null
          expiry_date: string
          id?: string
          name: string
          prescribed_doses?: number | null
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          added_method?: Database["public"]["Enums"]["add_method"]
          batch_number?: string | null
          created_at?: string
          dosage?: string | null
          doses_taken?: number | null
          expiry_date?: string
          id?: string
          name?: string
          prescribed_doses?: number | null
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_user_by_mobile: { Args: { _mobile: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      add_method: "pharmacy" | "csv" | "scan" | "manual"
      booking_status: "pending" | "accepted" | "completed"
      medicine_status: "safe" | "expiring" | "expired"
      restock_status: "pending" | "accepted" | "rejected" | "fulfilled"
      user_role: "user" | "pharmacy" | "hospital" | "bloodTestCentre"
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
      add_method: ["pharmacy", "csv", "scan", "manual"],
      booking_status: ["pending", "accepted", "completed"],
      medicine_status: ["safe", "expiring", "expired"],
      restock_status: ["pending", "accepted", "rejected", "fulfilled"],
      user_role: ["user", "pharmacy", "hospital", "bloodTestCentre"],
    },
  },
} as const
