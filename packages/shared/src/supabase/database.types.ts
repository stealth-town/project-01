export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          decimals: number
          id: string
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decimals: number
          id?: string
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decimals?: number
          id?: string
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      building_purchases: {
        Row: {
          building_id: string
          created_at: string
          id: string
          slot_number: number
          usdc_cost: number
          user_id: string
        }
        Insert: {
          building_id: string
          created_at?: string
          id?: string
          slot_number: number
          usdc_cost?: number
          user_id: string
        }
        Update: {
          building_id?: string
          created_at?: string
          id?: string
          slot_number?: number
          usdc_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_purchases_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          created_at: string
          id: string
          slot_number: number
          status: Database["public"]["Enums"]["building_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          slot_number: number
          status?: Database["public"]["Enums"]["building_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          slot_number?: number
          status?: Database["public"]["Enums"]["building_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      character_dungeons: {
        Row: {
          character_id: string
          claimed_at: string | null
          created_at: string
          dungeon_run_id: string
          finished_at: string | null
          id: string
          joined_at: string
          starting_damage_rating: number
          total_damage_dealt: number
          updated_at: string
          usdc_earned: number
          user_id: string
        }
        Insert: {
          character_id: string
          claimed_at?: string | null
          created_at?: string
          dungeon_run_id: string
          finished_at?: string | null
          id?: string
          joined_at?: string
          starting_damage_rating?: number
          total_damage_dealt?: number
          updated_at?: string
          usdc_earned?: number
          user_id: string
        }
        Update: {
          character_id?: string
          claimed_at?: string | null
          created_at?: string
          dungeon_run_id?: string
          finished_at?: string | null
          id?: string
          joined_at?: string
          starting_damage_rating?: number
          total_damage_dealt?: number
          updated_at?: string
          usdc_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_dungeons_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_dungeons_dungeon_run_id_fkey"
            columns: ["dungeon_run_id"]
            isOneToOne: false
            referencedRelation: "dungeon_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_dungeons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          created_at: string
          damage_rating: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          damage_rating?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          damage_rating?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      concrete_items: {
        Row: {
          category: Database["public"]["Enums"]["item_category_enum"]
          dmg: number
          id: number
          item_name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category_enum"]
          dmg: number
          id?: number
          item_name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category_enum"]
          dmg?: number
          id?: number
          item_name?: string
        }
        Relationships: []
      }
      dungeon_events: {
        Row: {
          character_dungeon_id: string
          created_at: string
          damage_dealt: number
          id: string
        }
        Insert: {
          character_dungeon_id: string
          created_at?: string
          damage_dealt: number
          id?: string
        }
        Update: {
          character_dungeon_id?: string
          created_at?: string
          damage_dealt?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dungeon_events_character_dungeon_id_fkey"
            columns: ["character_dungeon_id"]
            isOneToOne: false
            referencedRelation: "character_dungeons"
            referencedColumns: ["id"]
          },
        ]
      }
      dungeon_runs: {
        Row: {
          character_id: string | null
          created_at: string
          duration_seconds: number
          finished_at: string | null
          id: string
          started_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          duration_seconds: number
          finished_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          character_id?: string | null
          created_at?: string
          duration_seconds?: number
          finished_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      energy_purchases: {
        Row: {
          created_at: string
          energy_amount: number
          id: string
          package_type: Database["public"]["Enums"]["energy_package"]
          usdc_cost: number
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_amount: number
          id?: string
          package_type: Database["public"]["Enums"]["energy_package"]
          usdc_cost: number
          user_id: string
        }
        Update: {
          created_at?: string
          energy_amount?: number
          id?: string
          package_type?: Database["public"]["Enums"]["energy_package"]
          usdc_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          character_id: string
          concrete_item_id: number | null
          created_at: string
          damage_contribution: number
          equipped_slot: number | null
          id: string
          is_equipped: boolean
          rarity: Database["public"]["Enums"]["item_rarity_enum"]
          updated_at: string
        }
        Insert: {
          character_id: string
          concrete_item_id?: number | null
          created_at?: string
          damage_contribution: number
          equipped_slot?: number | null
          id?: string
          is_equipped?: boolean
          rarity?: Database["public"]["Enums"]["item_rarity_enum"]
          updated_at?: string
        }
        Update: {
          character_id?: string
          concrete_item_id?: number | null
          created_at?: string
          damage_contribution?: number
          equipped_slot?: number | null
          id?: string
          is_equipped?: boolean
          rarity?: Database["public"]["Enums"]["item_rarity_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_concrete_item_id_fkey"
            columns: ["concrete_item_id"]
            isOneToOne: false
            referencedRelation: "concrete_items"
            referencedColumns: ["id"]
          },
        ]
      }
      towns: {
        Row: {
          created_at: string
          id: string
          level: number
          max_slots: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          max_slots?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          max_slots?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "towns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          asset_id: string
          building_id: string
          claimed: Database["public"]["Enums"]["trade_claimed"]
          completed_at: string | null
          completion_time: string | null
          created_at: string
          energy_spent: number
          entry_price: number | null
          id: string
          liquidation_price: number | null
          resolved_at: string | null
          risk_mode: Database["public"]["Enums"]["risk_mode"]
          started_at: string | null
          status: Database["public"]["Enums"]["trade_state"]
          tokens_reward: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          building_id: string
          claimed?: Database["public"]["Enums"]["trade_claimed"]
          completed_at?: string | null
          completion_time?: string | null
          created_at?: string
          energy_spent?: number
          entry_price?: number | null
          id?: string
          liquidation_price?: number | null
          resolved_at?: string | null
          risk_mode: Database["public"]["Enums"]["risk_mode"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["trade_state"]
          tokens_reward?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          building_id?: string
          claimed?: Database["public"]["Enums"]["trade_claimed"]
          completed_at?: string | null
          completion_time?: string | null
          created_at?: string
          energy_spent?: number
          entry_price?: number | null
          id?: string
          liquidation_price?: number | null
          resolved_at?: string | null
          risk_mode?: Database["public"]["Enums"]["risk_mode"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["trade_state"]
          tokens_reward?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          energy: number
          id: string
          tokens: number
          town_level: number
          updated_at: string
          usdc: number
        }
        Insert: {
          created_at?: string
          energy?: number
          id?: string
          tokens?: number
          town_level?: number
          updated_at?: string
          usdc?: number
        }
        Update: {
          created_at?: string
          energy?: number
          id?: string
          tokens?: number
          town_level?: number
          updated_at?: string
          usdc?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      building_status: "idle" | "active" | "completed" | "liquidated"
      energy_package: "small" | "medium" | "large"
      item_category_enum:
        | "helmet"
        | "weapon1"
        | "weapon2"
        | "boots"
        | "trinket"
        | "armor"
      item_rarity_enum: "common" | "rare" | "epic" | "legendary"
      item_type:
        | "weapon"
        | "armor"
        | "accessory"
        | "helmet"
        | "boots"
        | "gloves"
      risk_mode: "turtle" | "walk" | "cheetah"
      trade_claimed: "unclaimed" | "claimed" | "non_applicable"
      trade_state:
        | "pending"
        | "active"
        | "completed"
        | "liquidated"
        | "processing"
        | "stale"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      building_status: ["idle", "active", "completed", "liquidated"],
      energy_package: ["small", "medium", "large"],
      item_category_enum: [
        "helmet",
        "weapon1",
        "weapon2",
        "boots",
        "trinket",
        "armor",
      ],
      item_rarity_enum: ["common", "rare", "epic", "legendary"],
      item_type: ["weapon", "armor", "accessory", "helmet", "boots", "gloves"],
      risk_mode: ["turtle", "walk", "cheetah"],
      trade_claimed: ["unclaimed", "claimed", "non_applicable"],
      trade_state: [
        "pending",
        "active",
        "completed",
        "liquidated",
        "processing",
        "stale",
      ],
    },
  },
} as const

