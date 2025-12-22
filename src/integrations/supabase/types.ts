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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      day_checklist_items: {
        Row: {
          created_at: string
          id: string
          label: string
          label_pt: string | null
          novena_day_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          label_pt?: string | null
          novena_day_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          label_pt?: string | null
          novena_day_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "day_checklist_items_novena_day_id_fkey"
            columns: ["novena_day_id"]
            isOneToOne: false
            referencedRelation: "novena_days"
            referencedColumns: ["id"]
          },
        ]
      }
      day_content_blocks: {
        Row: {
          block_type: string
          content: string
          content_pt: string | null
          created_at: string
          id: string
          novena_day_id: string
          sort_order: number
        }
        Insert: {
          block_type: string
          content: string
          content_pt?: string | null
          created_at?: string
          id?: string
          novena_day_id: string
          sort_order?: number
        }
        Update: {
          block_type?: string
          content?: string
          content_pt?: string | null
          created_at?: string
          id?: string
          novena_day_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "day_content_blocks_novena_day_id_fkey"
            columns: ["novena_day_id"]
            isOneToOne: false
            referencedRelation: "novena_days"
            referencedColumns: ["id"]
          },
        ]
      }
      novena_days: {
        Row: {
          created_at: string
          day_number: number
          id: string
          novena_id: string
          title: string
          title_pt: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          novena_id: string
          title: string
          title_pt?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          novena_id?: string
          title?: string
          title_pt?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "novena_days_novena_id_fkey"
            columns: ["novena_id"]
            isOneToOne: false
            referencedRelation: "novenas"
            referencedColumns: ["id"]
          },
        ]
      }
      novenas: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_pt: string | null
          duration: number
          id: string
          is_active: boolean | null
          slug: string
          title: string
          title_pt: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_pt?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          slug: string
          title: string
          title_pt?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_pt?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          slug?: string
          title?: string
          title_pt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_anonymous: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_anonymous?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_anonymous?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          body: string
          created_at: string
          display_name: string
          id: string
          is_featured: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          display_name: string
          id?: string
          is_featured?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          id?: string
          is_featured?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_day_progress: {
        Row: {
          checklist_state: Json | null
          completed_at: string | null
          created_at: string
          day_number: number
          id: string
          is_completed: boolean | null
          run_id: string
          updated_at: string
        }
        Insert: {
          checklist_state?: Json | null
          completed_at?: string | null
          created_at?: string
          day_number: number
          id?: string
          is_completed?: boolean | null
          run_id: string
          updated_at?: string
        }
        Update: {
          checklist_state?: Json | null
          completed_at?: string | null
          created_at?: string
          day_number?: number
          id?: string
          is_completed?: boolean | null
          run_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_day_progress_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "user_novena_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_novena_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          novena_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          novena_id: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          novena_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_novena_runs_novena_id_fkey"
            columns: ["novena_id"]
            isOneToOne: false
            referencedRelation: "novenas"
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
          role?: Database["public"]["Enums"]["app_role"]
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
