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
      compliance_deadlines: {
        Row: {
          created_at: string
          deadline_type: string
          due_date: string
          id: string
          is_custom: boolean
          notes: string | null
          org_id: string
          status: string
        }
        Insert: {
          created_at?: string
          deadline_type: string
          due_date: string
          id?: string
          is_custom?: boolean
          notes?: string | null
          org_id: string
          status?: string
        }
        Update: {
          created_at?: string
          deadline_type?: string
          due_date?: string
          id?: string
          is_custom?: boolean
          notes?: string | null
          org_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_deadlines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          ai_review_notes: string | null
          category: string
          created_at: string
          expiry_date: string | null
          file_path: string
          id: string
          name: string
          org_id: string
          status: string
        }
        Insert: {
          ai_review_notes?: string | null
          category: string
          created_at?: string
          expiry_date?: string | null
          file_path: string
          id?: string
          name: string
          org_id: string
          status?: string
        }
        Update: {
          ai_review_notes?: string | null
          category?: string
          created_at?: string
          expiry_date?: string | null
          file_path?: string
          id?: string
          name?: string
          org_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_scores: {
        Row: {
          calculated_at: string
          document_score: number
          filing_score: number
          financial_score: number
          governance_score: number
          id: string
          org_id: string
          overall_score: number
          policy_score: number
        }
        Insert: {
          calculated_at?: string
          document_score?: number
          filing_score?: number
          financial_score?: number
          governance_score?: number
          id?: string
          org_id: string
          overall_score?: number
          policy_score?: number
        }
        Update: {
          calculated_at?: string
          document_score?: number
          filing_score?: number
          financial_score?: number
          governance_score?: number
          id?: string
          org_id?: string
          overall_score?: number
          policy_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_scores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          email_type: string
          error_details: string | null
          id: string
          org_id: string | null
          recipient_email: string
          resend_id: string | null
          sent_at: string
          status: string
        }
        Insert: {
          email_type: string
          error_details?: string | null
          id?: string
          org_id?: string | null
          recipient_email: string
          resend_id?: string | null
          sent_at?: string
          status?: string
        }
        Update: {
          email_type?: string
          error_details?: string | null
          id?: string
          org_id?: string | null
          recipient_email?: string
          resend_id?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string
          currency: string
          description: string
          id: string
          org_id: string
          project_id: string
          receipt_url: string | null
          status: string
          submitted_at: string
          submitted_by: string
          whatsapp_message_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          description: string
          id?: string
          org_id: string
          project_id: string
          receipt_url?: string | null
          status?: string
          submitted_at?: string
          submitted_by: string
          whatsapp_message_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          org_id?: string
          project_id?: string
          receipt_url?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      funder_nonprofits: {
        Row: {
          created_at: string
          funder_id: string
          id: string
          nonprofit_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          funder_id: string
          id?: string
          nonprofit_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          funder_id?: string
          id?: string
          nonprofit_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funder_nonprofits_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funder_nonprofits_nonprofit_id_fkey"
            columns: ["nonprofit_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          expires_at: string
          funder_org_id: string
          id: string
          nonprofit_email: string
          nonprofit_name: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          expires_at?: string
          funder_org_id: string
          id?: string
          nonprofit_email: string
          nonprofit_name: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          expires_at?: string
          funder_org_id?: string
          id?: string
          nonprofit_email?: string
          nonprofit_name?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_funder_org_id_fkey"
            columns: ["funder_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_requests: {
        Row: {
          country: string
          id: string
          org_id: string
          requested_at: string
        }
        Insert: {
          country: string
          id?: string
          org_id: string
          requested_at?: string
        }
        Update: {
          country?: string
          id?: string
          org_id?: string
          requested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_reports: {
        Row: {
          created_at: string
          finalised_at: string | null
          financial_year: string
          form_data: Json
          generated_content: string | null
          id: string
          org_id: string
          status: string
        }
        Insert: {
          created_at?: string
          finalised_at?: string | null
          financial_year: string
          form_data?: Json
          generated_content?: string | null
          id?: string
          org_id: string
          status?: string
        }
        Update: {
          created_at?: string
          finalised_at?: string | null
          financial_year?: string
          form_data?: Json
          generated_content?: string | null
          id?: string
          org_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country: string
          created_at: string
          id: string
          name: string
          onboarding_status: string
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          phone_number: string | null
          slug: string
          subscription_plan: string
          subscription_status: string
          subscription_tier: string
          type: string
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          name: string
          onboarding_status?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          phone_number?: string | null
          slug: string
          subscription_plan?: string
          subscription_status?: string
          subscription_tier?: string
          type: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          name?: string
          onboarding_status?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          phone_number?: string | null
          slug?: string
          subscription_plan?: string
          subscription_status?: string
          subscription_tier?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      paddle_webhook_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed: boolean
          received_at: string
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          received_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          received_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number
          created_at: string
          description: string | null
          end_date: string | null
          funder_id: string | null
          id: string
          name: string
          org_id: string
          spent: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          funder_id?: string | null
          id?: string
          name: string
          org_id: string
          spent?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          funder_id?: string | null
          id?: string
          name?: string
          org_id?: string
          spent?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
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
          email: string
          full_name: string
          id: string
          is_active: boolean
          org_id: string
          phone_number: string | null
          role: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          org_id: string
          phone_number?: string | null
          role?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          org_id?: string
          phone_number?: string | null
          role?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_org_id: { Args: never; Returns: string }
      has_role_in_org: {
        Args: { _org_id: string; _required_role: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
