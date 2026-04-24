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
      knockout_matches: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean | null
          is_third_place_playoff: boolean | null
          match_date: string | null
          match_order: number
          match_time: string | null
          round_id: string
          team1_id: string | null
          team1_penalties: number | null
          team1_score: number | null
          team1_score_90: number | null
          team1_seed: number | null
          team2_id: string | null
          team2_penalties: number | null
          team2_score: number | null
          team2_score_90: number | null
          team2_seed: number | null
          updated_at: string
          venue: string | null
          went_to_extra_time: boolean | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_third_place_playoff?: boolean | null
          match_date?: string | null
          match_order: number
          match_time?: string | null
          round_id: string
          team1_id?: string | null
          team1_penalties?: number | null
          team1_score?: number | null
          team1_score_90?: number | null
          team1_seed?: number | null
          team2_id?: string | null
          team2_penalties?: number | null
          team2_score?: number | null
          team2_score_90?: number | null
          team2_seed?: number | null
          updated_at?: string
          venue?: string | null
          went_to_extra_time?: boolean | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_third_place_playoff?: boolean | null
          match_date?: string | null
          match_order?: number
          match_time?: string | null
          round_id?: string
          team1_id?: string | null
          team1_penalties?: number | null
          team1_score?: number | null
          team1_score_90?: number | null
          team1_seed?: number | null
          team2_id?: string | null
          team2_penalties?: number | null
          team2_score?: number | null
          team2_score_90?: number | null
          team2_seed?: number | null
          updated_at?: string
          venue?: string | null
          went_to_extra_time?: boolean | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knockout_matches_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "knockout_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      knockout_rounds: {
        Row: {
          created_at: string
          id: string
          league_id: string
          round_name: string
          round_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          round_name: string
          round_order: number
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          round_name?: string
          round_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "knockout_rounds_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          format: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          season: string
          short_name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          format?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          season: string
          short_name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          format?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          season?: string
          short_name?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      match_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          match_id: string
          minute: number | null
          player_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          match_id: string
          minute?: number | null
          player_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          match_id?: string
          minute?: number | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineups: {
        Row: {
          created_at: string
          id: string
          is_starter: boolean | null
          match_id: string
          player_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_starter?: boolean | null
          match_id: string
          player_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_starter?: boolean | null
          match_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          created_at: string
          home_score: number | null
          home_team_id: string
          id: string
          is_completed: boolean | null
          league_id: string | null
          match_date: string
          match_time: string
          motm_player_id: string | null
          updated_at: string
          venue: string
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          created_at?: string
          home_score?: number | null
          home_team_id: string
          id?: string
          is_completed?: boolean | null
          league_id?: string | null
          match_date: string
          match_time: string
          motm_player_id?: string | null
          updated_at?: string
          venue: string
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          created_at?: string
          home_score?: number | null
          home_team_id?: string
          id?: string
          is_completed?: boolean | null
          league_id?: string | null
          match_date?: string
          match_time?: string
          motm_player_id?: string | null
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_motm_player_id_fkey"
            columns: ["motm_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author: string | null
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          age: number | null
          appearances: number | null
          assists: number | null
          created_at: string
          goals: number | null
          id: string
          name: string
          nationality: string | null
          number: number
          photo_url: string | null
          position: string
          rating: number | null
          red_cards: number | null
          team_id: string | null
          updated_at: string
          yellow_cards: number | null
        }
        Insert: {
          age?: number | null
          appearances?: number | null
          assists?: number | null
          created_at?: string
          goals?: number | null
          id?: string
          name: string
          nationality?: string | null
          number: number
          photo_url?: string | null
          position: string
          rating?: number | null
          red_cards?: number | null
          team_id?: string | null
          updated_at?: string
          yellow_cards?: number | null
        }
        Update: {
          age?: number | null
          appearances?: number | null
          assists?: number | null
          created_at?: string
          goals?: number | null
          id?: string
          name?: string
          nationality?: string | null
          number?: number
          photo_url?: string | null
          position?: string
          rating?: number | null
          red_cards?: number | null
          team_id?: string | null
          updated_at?: string
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          drawn: number | null
          founded: number | null
          goals_against: number | null
          goals_for: number | null
          id: string
          league_id: string | null
          logo_url: string | null
          lost: number | null
          manager: string | null
          name: string
          played: number | null
          short_name: string
          stadium: string | null
          updated_at: string
          won: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          drawn?: number | null
          founded?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_id?: string | null
          logo_url?: string | null
          lost?: number | null
          manager?: string | null
          name: string
          played?: number | null
          short_name: string
          stadium?: string | null
          updated_at?: string
          won?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          drawn?: number | null
          founded?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_id?: string | null
          logo_url?: string | null
          lost?: number | null
          manager?: string | null
          name?: string
          played?: number | null
          short_name?: string
          stadium?: string | null
          updated_at?: string
          won?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
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
      recalculate_player_rating: {
        Args: { _player_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "editor"
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
      app_role: ["admin", "editor"],
    },
  },
} as const
