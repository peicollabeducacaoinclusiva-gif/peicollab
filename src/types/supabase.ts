// ./src/types/supabase.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      family_access_tokens: {
        Row: {
          access_count: number
          created_at: string
          created_by: string
          expires_at: string
          id: string
          last_accessed_at: string | null
          pei_id: string
          student_id: string
          token_hash: string
          used: boolean
        }
        Insert: {
          access_count?: number
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          pei_id: string
          student_id: string
          token_hash: string
          used?: boolean
        }
        Update: {
          access_count?: number
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          pei_id?: string
          student_id?: string
          token_hash?: string
          used?: boolean
        }
        Relationships: []
      }
      pei_access_attempts: {
        Row: {
          attempted_at: string
          created_at: string | null
          id: string
          ip_address: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          created_at?: string | null
          id?: string
          ip_address: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          created_at?: string | null
          id?: string
          ip_address?: string
          success?: boolean
        }
        Relationships: []
      }
      pei_access_logs: {
        Row: {
          accessed_at: string
          id: string
          ip_address: string | null
          pei_id: string | null
          token_used: string
          user_agent: string | null
          verified: boolean | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          pei_id?: string | null
          token_used: string
          user_agent?: string | null
          verified?: boolean | null
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          pei_id?: string | null
          token_used?: string
          user_agent?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      pei_accessibility_resources: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          pei_id: string
          resource_type: string
          usage_frequency: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          pei_id: string
          resource_type: string
          usage_frequency?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          pei_id?: string
          resource_type?: string
          usage_frequency?: string | null
        }
        Relationships: []
      }
      pei_barriers: {
        Row: {
          barrier_type: string
          created_at: string | null
          description: string | null
          id: string
          pei_id: string
          severity: string | null
        }
        Insert: {
          barrier_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          pei_id: string
          severity?: string | null
        }
        Update: {
          barrier_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          pei_id?: string
          severity?: string | null
        }
        Relationships: []
      }
      pei_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          pei_id: string
          student_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          pei_id: string
          student_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          pei_id?: string
          student_id?: string
          user_id?: string
        }
        Relationships: []
      }
      pei_family_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          last_accessed_at: string | null
          pei_id: string
          token: string
          token_hash: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          pei_id: string
          token: string
          token_hash?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          pei_id?: string
          token?: string
          token_hash?: string | null
        }
        Relationships: []
      }
      pei_goals: {
        Row: {
          barrier_id: string | null
          category: Database["public"]["Enums"]["pei_goal_category"] | null
          created_at: string | null
          description: string
          id: string
          notes: string | null
          pei_id: string
          progress_level: string | null
          progress_score: number | null
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          barrier_id?: string | null
          category?: Database["public"]["Enums"]["pei_goal_category"] | null
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          pei_id: string
          progress_level?: string | null
          progress_score?: number | null
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          barrier_id?: string | null
          category?: Database["public"]["Enums"]["pei_goal_category"] | null
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          pei_id?: string
          progress_level?: string | null
          progress_score?: number | null
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pei_history: {
        Row: {
          change_summary: string | null
          change_type: string
          changed_at: string
          changed_by: string
          diagnosis_data: Json | null
          evaluation_data: Json | null
          id: string
          pei_id: string
          planning_data: Json | null
          status: Database["public"]["Enums"]["pei_status"] | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          change_type: string
          changed_at?: string
          changed_by: string
          diagnosis_data?: Json | null
          evaluation_data?: Json | null
          id?: string
          pei_id: string
          planning_data?: Json | null
          status?: Database["public"]["Enums"]["pei_status"] | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          change_type?: string
          changed_at?: string
          changed_by?: string
          diagnosis_data?: Json | null
          evaluation_data?: Json | null
          id?: string
          pei_id?: string
          planning_data?: Json | null
          status?: Database["public"]["Enums"]["pei_status"] | null
          version_number?: number
        }
        Relationships: []
      }
      pei_meeting_participants: {
        Row: {
          id: string
          meeting_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          meeting_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          meeting_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      pei_meetings: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          location_or_link: string | null
          pei_id: string
          scheduled_for: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          location_or_link?: string | null
          pei_id: string
          scheduled_for: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          location_or_link?: string | null
          pei_id?: string
          scheduled_for?: string
          title?: string
        }
        Relationships: []
      }
      pei_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          notification_type: string
          pei_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_type: string
          pei_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          pei_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pei_referrals: {
        Row: {
          created_at: string | null
          date: string | null
          follow_up: string | null
          id: string
          pei_id: string
          reason: string | null
          referred_to: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          follow_up?: string | null
          id?: string
          pei_id: string
          reason?: string | null
          referred_to: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          follow_up?: string | null
          id?: string
          pei_id?: string
          reason?: string | null
          referred_to?: string
        }
        Relationships: []
      }
      pei_reviews: {
        Row: {
          created_at: string | null
          evaluation_data: Json | null
          id: string
          next_review_date: string | null
          notes: string | null
          pei_id: string
          review_date: string | null
          reviewer_id: string | null
          reviewer_role: string
        }
        Insert: {
          created_at?: string | null
          evaluation_data?: Json | null
          id?: string
          next_review_date?: string | null
          notes?: string | null
          pei_id: string
          review_date?: string | null
          reviewer_id?: string | null
          reviewer_role: string
        }
        Update: {
          created_at?: string | null
          evaluation_data?: Json | null
          id?: string
          next_review_date?: string | null
          notes?: string | null
          pei_id?: string
          review_date?: string | null
          reviewer_id?: string | null
          reviewer_role?: string
        }
        Relationships: []
      }

      pei_teachers: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          pei_id: string
          teacher_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          pei_id: string
          teacher_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          pei_id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      peis: {
        Row: {
          assigned_teacher_id: string | null
          created_at: string | null
          created_by: string
          diagnosis_data: Json | null
          evaluation_data: Json | null
          family_approved_at: string | null
          family_approved_by: string | null
          id: string
          is_synced: boolean | null
          planning_data: Json | null
          status: Database["public"]["Enums"]["pei_status"]
          student_id: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_teacher_id?: string | null
          created_at?: string | null
          created_by: string
          diagnosis_data?: Json | null
          evaluation_data?: Json | null
          family_approved_at?: string | null
          family_approved_by?: string | null
          id?: string
          is_synced?: boolean | null
          planning_data?: Json | null
          status?: Database["public"]["Enums"]["pei_status"]
          student_id: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_teacher_id?: string | null
          created_at?: string | null
          created_by?: string
          diagnosis_data?: Json | null
          evaluation_data?: Json | null
          family_approved_at?: string | null
          family_approved_by?: string | null
          id?: string
          is_synced?: boolean | null
          planning_data?: Json | null
          status?: Database["public"]["Enums"]["pei_status"]
          student_id?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      signup_debug_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: number
          message: string | null
          step: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: number
          message?: string | null
          step?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: number
          message?: string | null
          step?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_access: {
        Row: {
          created_at: string | null
          id: string
          role: string
          student_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          student_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          student_id?: string
          user_id?: string
        }
        Relationships: []
      }
      student_family: {
        Row: {
          created_at: string | null
          family_user_id: string
          id: string
          relationship: string | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          family_user_id: string
          id?: string
          relationship?: string | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          family_user_id?: string
          id?: string
          relationship?: string | null
          student_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          family_guidance_notes: string | null
          father_name: string | null
          id: string
          mother_name: string | null
          name: string
          phone: string | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          family_guidance_notes?: string | null
          father_name?: string | null
          id?: string
          mother_name?: string | null
          name: string
          phone?: string | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          family_guidance_notes?: string | null
          father_name?: string | null
          id?: string
          mother_name?: string | null
          name?: string
          phone?: string | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          network_address: string | null
          network_email: string | null
          network_name: string | null
          network_phone: string | null
          network_responsible: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          network_address?: string | null
          network_email?: string | null
          network_name?: string | null
          network_phone?: string | null
          network_responsible?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          network_address?: string | null
          network_email?: string | null
          network_name?: string | null
          network_phone?: string | null
          network_responsible?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          created_at: string | null
          id: string
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          school_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tutorial_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          tutorial_completed: boolean | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          tutorial_completed?: boolean | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          tutorial_completed?: boolean | null
          user_id?: string
        }
        Relationships: []
      },
      pei_specialist_orientations: {
        Row: {
          created_at: string | null
          guidance: string
          id: string
          orientation_field: string
          pei_id: string
          specialist_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          guidance: string
          id?: string
          orientation_field: string
          pei_id: string
          specialist_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          guidance?: string
          id?: string
          orientation_field?: string
          pei_id?: string
          specialist_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_pei_family: {
        Args: { pei_uuid: string; access_token: string }
        Returns: Json
      }
      can_access_pei: {
        Args: { _user_id: string; _pei_id: string }
        Returns: boolean
      }
      can_family_view_pei_via_token: {
        Args: { _pei_id: string }
        Returns: boolean
      }
      can_view_student: {
        Args: { _user_id: string; _student_id: string }
        Returns: boolean
      }
      clean_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      clean_old_access_attempts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_pei_access_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_secure_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pei_for_family: {
        Args: { pei_uuid: string; access_token: string }
        Returns: Json
      }
      get_user_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_safe: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_safe: {
        Args: { _user_id: string }
        Returns: string
      }
      get_users_with_emails: {
        Args: Record<PropertyKey, never>
        Returns: { user_id: string; email: string }[]
      }
      has_role: {
        Args: { _user_id: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      hash_token: {
        Args: { token_value: string }
        Returns: string
      }
      user_can_access_pei: {
        Args: { _user_id: string; _pei_id: string }
        Returns: boolean
      }
      user_has_tenant_access: {
        Args: { _user_id: string; _school_id: string }
        Returns: boolean
      }
      validate_family_token: {
        Args: { token_value: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "superadmin" | "coordinator" | "school_manager" | "aee_teacher" | "teacher" | "family" | "specialist"
      pei_goal_category: "academic" | "functional"
      pei_meeting_participant_status: "invited" | "confirmed" | "declined" | "attended"
      pei_meeting_status: "scheduled" | "completed" | "cancelled"
      pei_status: "draft" | "pending" | "returned" | "approved"
      user_role: "superadmin" | "coordinator" | "teacher" | "family" | "aee_teacher" | "school_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]