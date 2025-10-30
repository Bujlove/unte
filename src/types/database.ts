/**
 * Database types for Supabase tables
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          company_size: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: "applicant" | "recruiter" | "admin";
          subscription_status: "free" | "basic" | "premium" | "enterprise" | null;
          subscription_expires_at: string | null;
          trial_ends_at: string | null;
          searches_count: number;
          searches_limit: number;
          team_id: string | null;
          email_verified: boolean;
          email_notifications: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          company_size?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "applicant" | "recruiter" | "admin";
          subscription_status?: "free" | "basic" | "premium" | "enterprise" | null;
          subscription_expires_at?: string | null;
          trial_ends_at?: string | null;
          searches_count?: number;
          searches_limit?: number;
          team_id?: string | null;
          email_verified?: boolean;
          email_notifications?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          company_size?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "applicant" | "recruiter" | "admin";
          subscription_status?: "free" | "basic" | "premium" | "enterprise" | null;
          subscription_expires_at?: string | null;
          trial_ends_at?: string | null;
          searches_count?: number;
          searches_limit?: number;
          team_id?: string | null;
          email_verified?: boolean;
          email_notifications?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          settings: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          settings?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          settings?: Json | null;
          created_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          mime_type: string | null;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          location: string | null;
          parsed_data: Json | null;
          skills: string[] | null;
          experience_years: number | null;
          last_position: string | null;
          last_company: string | null;
          education_level: string | null;
          languages: Json | null;
          salary_expectation: Json | null;
          embedding: number[] | null;
          summary_embedding: number[] | null;
          status: "pending" | "processing" | "completed" | "failed";
          processing_status?: "pending" | "processing" | "completed" | "failed" | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          quality_score: number | null;
          upload_token: string | null;
          consent_given: boolean;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          parsed_data?: Json | null;
          skills?: string[] | null;
          experience_years?: number | null;
          last_position?: string | null;
          last_company?: string | null;
          education_level?: string | null;
          languages?: Json | null;
          salary_expectation?: Json | null;
          embedding?: number[] | null;
          summary_embedding?: number[] | null;
          status?: "pending" | "processing" | "completed" | "failed";
          processing_status?: "pending" | "processing" | "completed" | "failed" | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          quality_score?: number | null;
          upload_token?: string | null;
          consent_given?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          parsed_data?: Json | null;
          skills?: string[] | null;
          experience_years?: number | null;
          last_position?: string | null;
          last_company?: string | null;
          education_level?: string | null;
          languages?: Json | null;
          salary_expectation?: Json | null;
          embedding?: number[] | null;
          summary_embedding?: number[] | null;
          status?: "pending" | "processing" | "completed" | "failed";
          processing_status?: "pending" | "processing" | "completed" | "failed" | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          quality_score?: number | null;
          upload_token?: string | null;
          consent_given?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      searches: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          filters: Json | null;
          results_count: number | null;
          is_template: boolean;
          template_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          filters?: Json | null;
          results_count?: number | null;
          is_template?: boolean;
          template_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          query?: string;
          filters?: Json | null;
          results_count?: number | null;
          is_template?: boolean;
          template_name?: string | null;
          created_at?: string;
        };
      };
      search_results: {
        Row: {
          id: string;
          search_id: string;
          resume_id: string;
          relevance_score: number | null;
          match_details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          search_id: string;
          resume_id: string;
          relevance_score?: number | null;
          match_details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          search_id?: string;
          resume_id?: string;
          relevance_score?: number | null;
          match_details?: Json | null;
          created_at?: string;
        };
      };
      saved_candidates: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string;
          notes: string | null;
          tags: string[] | null;
          status: "new" | "contacted" | "interview" | "rejected" | "hired";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id: string;
          notes?: string | null;
          tags?: string[] | null;
          status?: "new" | "contacted" | "interview" | "rejected" | "hired";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string;
          notes?: string | null;
          tags?: string[] | null;
          status?: "new" | "contacted" | "interview" | "rejected" | "hired";
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: string | null;
          payment_method: string | null;
          external_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          status?: string | null;
          payment_method?: string | null;
          external_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: string | null;
          payment_method?: string | null;
          external_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string | null;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      resume_summaries: {
        Row: {
          id: string;
          resume_id: string;
          quick_id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          location: string | null;
          current_position: string | null;
          current_company: string | null;
          last_position: string | null;
          last_company: string | null;
          experience_years: number | null;
          education_level: string | null;
          primary_skills: string[] | null;
          secondary_skills: string[] | null;
          skills: string[] | null;
          languages: string[] | null;
          summary: string | null;
          ai_summary: string | null;
          quality_score: number | null;
          confidence_score: number | null;
          upload_token: string | null;
          consent_given: boolean | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          quick_id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          current_position?: string | null;
          current_company?: string | null;
          last_position?: string | null;
          last_company?: string | null;
          experience_years?: number | null;
          education_level?: string | null;
          primary_skills?: string[] | null;
          secondary_skills?: string[] | null;
          skills?: string[] | null;
          languages?: string[] | null;
          summary?: string | null;
          ai_summary?: string | null;
          quality_score?: number | null;
          confidence_score?: number | null;
          upload_token?: string | null;
          consent_given?: boolean | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          quick_id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          current_position?: string | null;
          current_company?: string | null;
          last_position?: string | null;
          last_company?: string | null;
          experience_years?: number | null;
          education_level?: string | null;
          primary_skills?: string[] | null;
          secondary_skills?: string[] | null;
          skills?: string[] | null;
          languages?: string[] | null;
          summary?: string | null;
          ai_summary?: string | null;
          quality_score?: number | null;
          confidence_score?: number | null;
          upload_token?: string | null;
          consent_given?: boolean | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

