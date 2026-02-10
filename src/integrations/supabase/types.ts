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
      ai_chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_connections: {
        Row: {
          account_id: string | null
          account_name: string | null
          broker_name: string
          created_at: string | null
          environment: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          portfolio_id: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          broker_name?: string
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          portfolio_id?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          broker_name?: string
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          portfolio_id?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_connections_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_permissions: {
        Row: {
          can_read: boolean | null
          can_upload: boolean | null
          can_write: boolean | null
          channel_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_read?: boolean | null
          can_upload?: boolean | null
          can_write?: boolean | null
          channel_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_read?: boolean | null
          can_upload?: boolean | null
          can_write?: boolean | null
          channel_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "channel_permissions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      community_channels: {
        Row: {
          channel_type: Database["public"]["Enums"]["channel_type"] | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          position: number | null
          updated_at: string
        }
        Insert: {
          channel_type?: Database["public"]["Enums"]["channel_type"] | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          position?: number | null
          updated_at?: string
        }
        Update: {
          channel_type?: Database["public"]["Enums"]["channel_type"] | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          position?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      community_messages: {
        Row: {
          channel_id: string
          content: string | null
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_edited: boolean | null
          is_pinned: boolean | null
          reply_to_id: string | null
          trade_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          reply_to_id?: string | null
          trade_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          reply_to_id?: string | null
          trade_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
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
          trade_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          relationship_id: string
          sender_id: string
          trade_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          relationship_id?: string
          sender_id?: string
          trade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_messages_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "mentor_relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_messages_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
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
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
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
          conclusions: string | null
          created_at: string
          entry_price: number
          entry_reason: string | null
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
          conclusions?: string | null
          created_at?: string
          entry_price: number
          entry_reason?: string | null
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
          conclusions?: string | null
          created_at?: string
          entry_price?: number
          entry_reason?: string | null
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
      trade_screenshots: {
        Row: {
          created_at: string
          id: string
          position: number
          screenshot_url: string
          timeframe: string | null
          trade_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          screenshot_url: string
          timeframe?: string | null
          trade_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          screenshot_url?: string
          timeframe?: string | null
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_screenshots_trade_id_fkey"
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
          conclusions: string | null
          created_at: string
          entry_date: string | null
          entry_price: number
          entry_reason: string | null
          exit_date: string | null
          exit_price: number | null
          external_trade_id: string | null
          id: string
          is_closed: boolean
          mental_state: string | null
          mistakes: string[] | null
          notes: string | null
          pnl: number | null
          pnl_points: number | null
          portfolio_id: string | null
          quantity: number
          rating: number | null
          risk: number | null
          rr: number | null
          screenshot_url: string | null
          session: string | null
          setup_type: string | null
          strategy: string | null
          symbol: string
          trade_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commission?: number | null
          conclusions?: string | null
          created_at?: string
          entry_date?: string | null
          entry_price: number
          entry_reason?: string | null
          exit_date?: string | null
          exit_price?: number | null
          external_trade_id?: string | null
          id?: string
          is_closed?: boolean
          mental_state?: string | null
          mistakes?: string[] | null
          notes?: string | null
          pnl?: number | null
          pnl_points?: number | null
          portfolio_id?: string | null
          quantity?: number
          rating?: number | null
          risk?: number | null
          rr?: number | null
          screenshot_url?: string | null
          session?: string | null
          setup_type?: string | null
          strategy?: string | null
          symbol: string
          trade_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commission?: number | null
          conclusions?: string | null
          created_at?: string
          entry_date?: string | null
          entry_price?: number
          entry_reason?: string | null
          exit_date?: string | null
          exit_price?: number | null
          external_trade_id?: string | null
          id?: string
          is_closed?: boolean
          mental_state?: string | null
          mistakes?: string[] | null
          notes?: string | null
          pnl?: number | null
          pnl_points?: number | null
          portfolio_id?: string | null
          quantity?: number
          rating?: number | null
          risk?: number | null
          rr?: number | null
          screenshot_url?: string | null
          session?: string | null
          setup_type?: string | null
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
      user_channel_presence: {
        Row: {
          channel_id: string
          id: string
          is_typing: boolean | null
          last_seen: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          is_typing?: boolean | null
          last_seen?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          is_typing?: boolean | null
          last_seen?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_channel_presence_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
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
      channel_type: "text" | "announcements" | "trades"
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
      channel_type: ["text", "announcements", "trades"],
    },
  },
} as const
