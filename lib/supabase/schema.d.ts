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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      compliance_checks: {
        Row: {
          checked_at: string | null
          compliance_result: Json
          created_at: string | null
          document_id: string | null
          id: string
          section_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          checked_at?: string | null
          compliance_result: Json
          created_at?: string | null
          document_id?: string | null
          id?: string
          section_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          checked_at?: string | null
          compliance_result?: Json
          created_at?: string | null
          document_id?: string | null
          id?: string
          section_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_checks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ectd_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comment_threads: {
        Row: {
          author_id: string
          created_at: string
          document_id: string
          id: string
          state: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          document_id: string
          id?: string
          state?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          document_id?: string
          id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comment_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comment_threads_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ectd_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comments: {
        Row: {
          content: string | null
          created_at: string
          id: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "document_comment_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_roles: {
        Row: {
          document_id: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          document_id: string
          role: string
          team_id: string
          user_id: string
        }
        Update: {
          document_id?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_roles_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ectd_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sources: {
        Row: {
          content: Json
          created_at: string | null
          document_id: string
          document_version: number
          id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          document_id: string
          document_version: number
          id?: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          document_id?: string
          document_version?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_sources_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ectd_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ectd_document_versions: {
        Row: {
          content: Json
          created_at: string | null
          detected_modules: string[] | null
          document_id: string
          id: string
          last_modified: string | null
          metadata: Json | null
          node_id: string | null
          owner_id: string | null
          project_id: string | null
          status: string | null
          team_id: string | null
          tiptap_doc_id: string | null
          version: number
          versioned_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          detected_modules?: string[] | null
          document_id: string
          id?: string
          last_modified?: string | null
          metadata?: Json | null
          node_id?: string | null
          owner_id?: string | null
          project_id?: string | null
          status?: string | null
          team_id?: string | null
          tiptap_doc_id?: string | null
          version?: number
          versioned_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          detected_modules?: string[] | null
          document_id?: string
          id?: string
          last_modified?: string | null
          metadata?: Json | null
          node_id?: string | null
          owner_id?: string | null
          project_id?: string | null
          status?: string | null
          team_id?: string | null
          tiptap_doc_id?: string | null
          version?: number
          versioned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ectd_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ectd_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ectd_document_versions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "ectd_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ectd_document_versions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ectd_document_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ectd_document_versions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ectd_documents: {
        Row: {
          content: Json
          created_at: string | null
          detected_modules: string[] | null
          id: string
          last_modified: string | null
          metadata: Json | null
          node_id: string
          owner_id: string | null
          project_id: string
          status: string | null
          team_id: string
          template_id: string | null
          tiptap_doc_id: string | null
          version: number | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          detected_modules?: string[] | null
          id?: string
          last_modified?: string | null
          metadata?: Json | null
          node_id: string
          owner_id?: string | null
          project_id: string
          status?: string | null
          team_id: string
          template_id?: string | null
          tiptap_doc_id?: string | null
          version?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          detected_modules?: string[] | null
          id?: string
          last_modified?: string | null
          metadata?: Json | null
          node_id?: string
          owner_id?: string | null
          project_id?: string
          status?: string | null
          team_id?: string
          template_id?: string | null
          tiptap_doc_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ectd_documents_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "ectd_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ectd_documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ectd_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ectd_documents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ectd_nodes: {
        Row: {
          id: string
          label: string
          parent_id: string | null
          parsed_text: string | null
          title: string
        }
        Insert: {
          id?: string
          label: string
          parent_id?: string | null
          parsed_text?: string | null
          title: string
        }
        Update: {
          id?: string
          label?: string
          parent_id?: string | null
          parsed_text?: string | null
          title?: string
        }
        Relationships: []
      }
      ectd_templates: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          node_id: string | null
          subsection_number: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          node_id?: string | null
          subsection_number?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          node_id?: string | null
          subsection_number?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ectd_templates_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "ectd_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      ind_docs: {
        Row: {
          content: string | null
          embedding: string | null
          filename: string | null
          id: string
          metadata: Json | null
          section: string | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          section?: string | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          section?: string | null
        }
        Relationships: []
      }
      project_settings: {
        Row: {
          allow_collaboration: boolean
          created_at: string
          is_public: boolean
          project_id: string
          updated_at: string | null
        }
        Insert: {
          allow_collaboration: boolean
          created_at?: string
          is_public?: boolean
          project_id?: string
          updated_at?: string | null
        }
        Update: {
          allow_collaboration?: boolean
          created_at?: string
          is_public?: boolean
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          additional_notes: string | null
          clinical_lead: string
          cmc_lead: string
          created_at: string
          description: string | null
          drug_name: string
          fda_contact_email: string | null
          id: string
          ind_number: string | null
          ind_title: string
          metadata: Json | null
          pre_ind_meeting_date: string | null
          preclinical_lead: string
          priority: string
          product_type: string
          progress: number
          project_creator_id: string | null
          publisher: string
          regulatory_owner: string
          sponsor_contact_email: string
          sponsor_name: string
          status: string
          target_ind_submission_date: string
          team_id: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          clinical_lead: string
          cmc_lead: string
          created_at: string
          description?: string | null
          drug_name: string
          fda_contact_email?: string | null
          id?: string
          ind_number?: string | null
          ind_title: string
          metadata?: Json | null
          pre_ind_meeting_date?: string | null
          preclinical_lead: string
          priority?: string
          product_type: string
          progress?: number
          project_creator_id?: string | null
          publisher: string
          regulatory_owner: string
          sponsor_contact_email: string
          sponsor_name: string
          status?: string
          target_ind_submission_date: string
          team_id: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          clinical_lead?: string
          cmc_lead?: string
          created_at?: string
          description?: string | null
          drug_name?: string
          fda_contact_email?: string | null
          id?: string
          ind_number?: string | null
          ind_title?: string
          metadata?: Json | null
          pre_ind_meeting_date?: string | null
          preclinical_lead?: string
          priority?: string
          product_type?: string
          progress?: number
          project_creator_id?: string | null
          publisher?: string
          regulatory_owner?: string
          sponsor_contact_email?: string
          sponsor_name?: string
          status?: string
          target_ind_submission_date?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_clinical_lead_fkey"
            columns: ["clinical_lead"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_cmc_lead_fkey"
            columns: ["cmc_lead"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_preclinical_lead_fkey"
            columns: ["preclinical_lead"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_creator_id_fkey"
            columns: ["project_creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_publisher_fkey"
            columns: ["publisher"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_regulatory_owner_fkey"
            columns: ["regulatory_owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_analysis_results: {
        Row: {
          created_at: string | null
          dimension_scores: Json
          document_name: string
          document_type: string
          experiment_variant_id: string | null
          id: string
          model_used: string
          overall_readiness_level: string
          response_time_ms: number | null
          session_id: string
          submission_readiness_index: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dimension_scores: Json
          document_name: string
          document_type: string
          experiment_variant_id?: string | null
          id?: string
          model_used: string
          overall_readiness_level: string
          response_time_ms?: number | null
          session_id: string
          submission_readiness_index: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dimension_scores?: Json
          document_name?: string
          document_type?: string
          experiment_variant_id?: string | null
          id?: string
          model_used?: string
          overall_readiness_level?: string
          response_time_ms?: number | null
          session_id?: string
          submission_readiness_index?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_analysis_results_experiment_variant_id_fkey"
            columns: ["experiment_variant_id"]
            isOneToOne: false
            referencedRelation: "prompt_experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_experiment_variants: {
        Row: {
          created_at: string | null
          experiment_id: string
          human_prompt_id: string | null
          id: string
          performance_metrics: Json | null
          system_prompt_id: string | null
          variant_name: string
        }
        Insert: {
          created_at?: string | null
          experiment_id: string
          human_prompt_id?: string | null
          id?: string
          performance_metrics?: Json | null
          system_prompt_id?: string | null
          variant_name: string
        }
        Update: {
          created_at?: string | null
          experiment_id?: string
          human_prompt_id?: string | null
          id?: string
          performance_metrics?: Json | null
          system_prompt_id?: string | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_experiment_variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "prompt_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_experiment_variants_human_prompt_id_fkey"
            columns: ["human_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_experiment_variants_system_prompt_id_fkey"
            columns: ["system_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_experiments: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          document_type: string
          end_date: string | null
          id: string
          metrics: Json | null
          name: string
          start_date: string | null
          status: string | null
          traffic_split: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type: string
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name: string
          start_date?: string | null
          status?: string | null
          traffic_split?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          start_date?: string | null
          status?: string | null
          traffic_split?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_performance_metrics: {
        Row: {
          created_at: string | null
          experiment_variant_id: string | null
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          period_end: string | null
          period_start: string | null
          prompt_template_id: string | null
          sample_size: number | null
        }
        Insert: {
          created_at?: string | null
          experiment_variant_id?: string | null
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          period_end?: string | null
          period_start?: string | null
          prompt_template_id?: string | null
          sample_size?: number | null
        }
        Update: {
          created_at?: string | null
          experiment_variant_id?: string | null
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          period_end?: string | null
          period_start?: string | null
          prompt_template_id?: string | null
          sample_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_performance_metrics_experiment_variant_id_fkey"
            columns: ["experiment_variant_id"]
            isOneToOne: false
            referencedRelation: "prompt_experiment_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_performance_metrics_prompt_template_id_fkey"
            columns: ["prompt_template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          document_type: string
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          prompt_type: string
          updated_at: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type: string
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          prompt_type: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          prompt_type?: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_usage_analytics: {
        Row: {
          created_at: string | null
          document_type: string | null
          error_message: string | null
          experiment_variant_id: string | null
          id: string
          model_used: string | null
          prompt_template_id: string | null
          response_time_ms: number | null
          session_id: string | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          error_message?: string | null
          experiment_variant_id?: string | null
          id?: string
          model_used?: string | null
          prompt_template_id?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          error_message?: string | null
          experiment_variant_id?: string | null
          id?: string
          model_used?: string | null
          prompt_template_id?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_usage_analytics_experiment_variant_id_fkey"
            columns: ["experiment_variant_id"]
            isOneToOne: false
            referencedRelation: "prompt_experiment_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_usage_analytics_prompt_template_id_fkey"
            columns: ["prompt_template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          change_log: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          prompt_template_id: string
          variables: Json | null
          version: number
        }
        Insert: {
          change_log?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt_template_id: string
          variables?: Json | null
          version: number
        }
        Update: {
          change_log?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt_template_id?: string
          variables?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_template_id_fkey"
            columns: ["prompt_template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      section_locks: {
        Row: {
          locked_at: string | null
          section_id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          locked_at?: string | null
          section_id: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          locked_at?: string | null
          section_id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          invited_at: string
          invited_by: string
          role: string
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          invited_at?: string
          invited_by: string
          role?: string
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          invited_at?: string
          invited_by?: string
          role?: string
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_settings: {
        Row: {
          allow_invites: boolean
          created_at: string
          default_role: string
          is_public: boolean
          team_id: string
          updated_at: string | null
        }
        Insert: {
          allow_invites?: boolean
          created_at?: string
          default_role?: string
          is_public?: boolean
          team_id: string
          updated_at?: string | null
        }
        Update: {
          allow_invites?: boolean
          created_at?: string
          default_role?: string
          is_public?: boolean
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          team_creator_id: string
          team_name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          team_creator_id: string
          team_name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          team_creator_id?: string
          team_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_team_creator_id_fkey"
            columns: ["team_creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_teams: {
        Row: {
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_teams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_team_creator: {
        Args: { p_team_id: string; p_user?: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { p_team_id: string; p_user?: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_ind_docs: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          filename: string
          id: string
          score: number
          section: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
