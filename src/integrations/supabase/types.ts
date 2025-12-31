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
      confirmations: {
        Row: {
          created_at: string
          id: string
          name: string
          strategy_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          strategy_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmations_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_replies: {
        Row: {
          content: string
          created_at: string
          feedback_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          feedback_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          feedback_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_replies_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "mentor_trade_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          relationship_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          relationship_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          relationship_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_messages_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "mentor_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          mentor_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mentor_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mentor_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentor_relationships: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentor_trade_feedback: {
        Row: {
          content: string
          created_at: string
          id: string
          mentor_id: string
          student_id: string
          trade_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mentor_id: string
          student_id: string
          trade_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mentor_id?: string
          student_id?: string
          trade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_trade_feedback_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          balance: number
          created_at: string
          drawdown: number | null
          id: string
          is_default: boolean
          name: string
          profit_goal: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          drawdown?: number | null
          id?: string
          is_default?: boolean
          name: string
          profit_goal?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          drawdown?: number | null
          id?: string
          is_default?: boolean
          name?: string
          profit_goal?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          chart_colors: Json | null
          country: string | null
          created_at: string
          email: string | null
          favorite_asset: string | null
          first_name: string | null
          id: string
          is_public: boolean
          last_name: string | null
          trading_style: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          chart_colors?: Json | null
          country?: string | null
          created_at?: string
          email?: string | null
          favorite_asset?: string | null
          first_name?: string | null
          id?: string
          is_public?: boolean
          last_name?: string | null
          trading_style?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          chart_colors?: Json | null
          country?: string | null
          created_at?: string
          email?: string | null
          favorite_asset?: string | null
          first_name?: string | null
          id?: string
          is_public?: boolean
          last_name?: string | null
          trading_style?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      shared_trade_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          shared_trade_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          shared_trade_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          shared_trade_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_trade_comments_shared_trade_id_fkey"
            columns: ["shared_trade_id"]
            isOneToOne: false
            referencedRelation: "shared_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_trade_likes: {
        Row: {
          created_at: string
          id: string
          shared_trade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shared_trade_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shared_trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_trade_likes_shared_trade_id_fkey"
            columns: ["shared_trade_id"]
            isOneToOne: false
            referencedRelation: "shared_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_trades: {
        Row: {
          created_at: string
          entry_price: number
          exit_price: number | null
          id: string
          is_closed: boolean
          notes: string | null
          pnl: number | null
          pnl_percentage: number | null
          screenshot_url: string | null
          strategy: string | null
          symbol: string
          trade_date: string
          trade_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_price: number
          exit_price?: number | null
          id?: string
          is_closed?: boolean
          notes?: string | null
          pnl?: number | null
          pnl_percentage?: number | null
          screenshot_url?: string | null
          strategy?: string | null
          symbol: string
          trade_date?: string
          trade_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          is_closed?: boolean
          notes?: string | null
          pnl?: number | null
          pnl_percentage?: number | null
          screenshot_url?: string | null
          strategy?: string | null
          symbol?: string
          trade_date?: string
          trade_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_confirmations: {
        Row: {
          confirmation_name: string
          created_at: string
          id: string
          trade_id: string
        }
        Insert: {
          confirmation_name: string
          created_at?: string
          id?: string
          trade_id: string
        }
        Update: {
          confirmation_name?: string
          created_at?: string
          id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_confirmations_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          commission: number | null
          created_at: string
          entry_date: string | null
          entry_price: number
          exit_date: string | null
          exit_price: number | null
          id: string
          is_closed: boolean
          notes: string | null
          pnl: number | null
          pnl_points: number | null
          portfolio_id: string | null
          quantity: number
          rating: number | null
          risk: number | null
          rr: number | null
          screenshot_url: string | null
          strategy: string | null
          symbol: string
          trade_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commission?: number | null
          created_at?: string
          entry_date?: string | null
          entry_price: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          is_closed?: boolean
          notes?: string | null
          pnl?: number | null
          pnl_points?: number | null
          portfolio_id?: string | null
          quantity?: number
          rating?: number | null
          risk?: number | null
          rr?: number | null
          screenshot_url?: string | null
          strategy?: string | null
          symbol: string
          trade_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commission?: number | null
          created_at?: string
          entry_date?: string | null
          entry_price?: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          is_closed?: boolean
          notes?: string | null
          pnl?: number | null
          pnl_points?: number | null
          portfolio_id?: string | null
          quantity?: number
          rating?: number | null
          risk?: number | null
          rr?: number | null
          screenshot_url?: string | null
          strategy?: string | null
          symbol?: string
          trade_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
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
      is_mentor_of: {
        Args: { mentor_user_id: string; student_user_id: string }
        Returns: boolean
      }
      lookup_user_id_by_username: {
        Args: { p_username: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
