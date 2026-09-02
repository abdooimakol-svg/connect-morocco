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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cin_url: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          education: string | null
          email: string | null
          experience: string | null
          first_name: string | null
          gender: string | null
          gmail: string | null
          id: string
          interests: string[] | null
          languages: string[] | null
          last_name: string | null
          learning_goals: string | null
          linkedin: string | null
          occupation: string | null
          phone_number: string | null
          portfolio: string | null
          professional_title: string | null
          profile_completed: boolean
          rejection_reason: string | null
          skills: string[] | null
          status: Database["public"]["Enums"]["profile_status"]
          teaching_interests: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cin_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: string | null
          email?: string | null
          experience?: string | null
          first_name?: string | null
          gender?: string | null
          gmail?: string | null
          id: string
          interests?: string[] | null
          languages?: string[] | null
          last_name?: string | null
          learning_goals?: string | null
          linkedin?: string | null
          occupation?: string | null
          phone_number?: string | null
          portfolio?: string | null
          professional_title?: string | null
          profile_completed?: boolean
          rejection_reason?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["profile_status"]
          teaching_interests?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cin_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: string | null
          email?: string | null
          experience?: string | null
          first_name?: string | null
          gender?: string | null
          gmail?: string | null
          id?: string
          interests?: string[] | null
          languages?: string[] | null
          last_name?: string | null
          learning_goals?: string | null
          linkedin?: string | null
          occupation?: string | null
          phone_number?: string | null
          portfolio?: string | null
          professional_title?: string | null
          profile_completed?: boolean
          rejection_reason?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["profile_status"]
          teaching_interests?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          hand_raised: boolean
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["participant_role"]
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          hand_raised?: boolean
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["participant_role"]
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          hand_raised?: boolean
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["participant_role"]
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_reactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          cover_gradient: string | null
          created_at: string
          description: string | null
          ended_at: string | null
          host_id: string
          id: string
          is_private: boolean
          language: string | null
          livekit_room: string
          max_participants: number
          password: string | null
          skill_level: string | null
          status: Database["public"]["Enums"]["room_status"]
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          cover_gradient?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          host_id: string
          id?: string
          is_private?: boolean
          language?: string | null
          livekit_room: string
          max_participants?: number
          password?: string | null
          skill_level?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          cover_gradient?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          host_id?: string
          id?: string
          is_private?: boolean
          language?: string | null
          livekit_room?: string
          max_participants?: number
          password?: string | null
          skill_level?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          city: string
          country: string
          education: string
          experience: string
          first_name: string
          id: string
          interests: string[]
          languages: string[]
          last_name: string
          learning_goals: string
          occupation: string
          professional_title: string
          skills: string[]
          teaching_interests: string
          username: string
        }[]
      }
      is_room_moderator: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      participant_role: "host" | "speaker" | "listener" | "moderator"
      profile_status: "pending" | "approved" | "rejected"
      room_status: "active" | "locked" | "ended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      participant_role: ["host", "speaker", "listener", "moderator"],
      profile_status: ["pending", "approved", "rejected"],
      room_status: ["active", "locked", "ended"],
    },
  },
} as const
