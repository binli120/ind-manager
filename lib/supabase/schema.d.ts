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
      acknowledge: {
        Row: {
          chunk_id: string
          content: string
          created_at: string
          embedding: string
          filename: string
          id: string
          metadata: Json
          source_path: string | null
        }
        Insert: {
          chunk_id: string
          content: string
          created_at?: string
          embedding: string
          filename: string
          id?: string
          metadata?: Json
          source_path?: string | null
        }
        Update: {
          chunk_id?: string
          content?: string
          created_at?: string
          embedding?: string
          filename?: string
          id?: string
          metadata?: Json
          source_path?: string | null
        }
        Relationships: []
      }
      comment_mentions: {
        Row: {
          comment_id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          user_id: string
        }
        Update: {
          comment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "document_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          reaction: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          reaction: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "document_comments"
            referencedColumns: ["id"]
          },
        ]
      }
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
      document_anchors: {
        Row: {
          anchor_type: string | null
          created_at: string | null
          document_version_id: string | null
          id: string
          locator: Json | null
          page_end: number | null
          page_start: number | null
          text_end: number | null
          text_start: number | null
        }
        Insert: {
          anchor_type?: string | null
          created_at?: string | null
          document_version_id?: string | null
          id?: string
          locator?: Json | null
          page_end?: number | null
          page_start?: number | null
          text_end?: number | null
          text_start?: number | null
        }
        Update: {
          anchor_type?: string | null
          created_at?: string | null
          document_version_id?: string | null
          id?: string
          locator?: Json | null
          page_end?: number | null
          page_start?: number | null
          text_end?: number | null
          text_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_anchors_document_versions_id_fk"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_assets: {
        Row: {
          asset_type: string
          caption: string | null
          created_at: string | null
          description: string | null
          document_version_id: string
          extra_attributes: Json | null
          id: string
          index_on_page: number | null
          keywords: string[]
          page_number: number | null
          s3_bucket: string
          s3_key: string
        }
        Insert: {
          asset_type: string
          caption?: string | null
          created_at?: string | null
          description?: string | null
          document_version_id: string
          extra_attributes?: Json | null
          id?: string
          index_on_page?: number | null
          keywords?: string[]
          page_number?: number | null
          s3_bucket: string
          s3_key: string
        }
        Update: {
          asset_type?: string
          caption?: string | null
          created_at?: string | null
          description?: string | null
          document_version_id?: string
          extra_attributes?: Json | null
          id?: string
          index_on_page?: number | null
          keywords?: string[]
          page_number?: number | null
          s3_bucket?: string
          s3_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_assets_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
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
          anchor: Json | null
          content: string | null
          created_at: string
          created_by: string
          document_anchor_id: string | null
          document_version_id: string | null
          id: string
          parent_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["comment_status"] | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          anchor?: Json | null
          content?: string | null
          created_at?: string
          created_by: string
          document_anchor_id?: string | null
          document_version_id?: string | null
          id?: string
          parent_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          anchor?: Json | null
          content?: string | null
          created_at?: string
          created_by?: string
          document_anchor_id?: string | null
          document_version_id?: string | null
          id?: string
          parent_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_document_comments_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_document_versions_id_fk"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "document_comment_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      document_ingestion_status: {
        Row: {
          content_hash: string
          created_at: string | null
          document_version_id: string | null
          error_message: string | null
          id: string
          s3_bucket: string
          s3_key: string
          s3_version_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          document_version_id?: string | null
          error_message?: string | null
          id?: string
          s3_bucket: string
          s3_key: string
          s3_version_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          document_version_id?: string | null
          error_message?: string | null
          id?: string
          s3_bucket?: string
          s3_key?: string
          s3_version_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_ingestion_status_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_key_sections: {
        Row: {
          asset_ids: string[]
          char_end: number | null
          char_start: number | null
          confidence: number | null
          created_at: string | null
          document_version_id: string
          id: string
          model_name: string | null
          page_end: number | null
          page_start: number | null
          section_type: string
          text: string
        }
        Insert: {
          asset_ids?: string[]
          char_end?: number | null
          char_start?: number | null
          confidence?: number | null
          created_at?: string | null
          document_version_id: string
          id?: string
          model_name?: string | null
          page_end?: number | null
          page_start?: number | null
          section_type: string
          text: string
        }
        Update: {
          asset_ids?: string[]
          char_end?: number | null
          char_start?: number | null
          confidence?: number | null
          created_at?: string | null
          document_version_id?: string
          id?: string
          model_name?: string | null
          page_end?: number | null
          page_start?: number | null
          section_type?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_key_sections_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_roles: {
        Row: {
          document_id: string
          role: string
          user_id: string
        }
        Insert: {
          document_id: string
          role: string
          user_id: string
        }
        Update: {
          document_id?: string
          role?: string
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
            foreignKeyName: "document_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_section_embedding: {
        Row: {
          created_at: string | null
          embedding: string | null
          model_name: string | null
          section_id: string
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          model_name?: string | null
          section_id: string
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          model_name?: string | null
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_section_embedding_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: true
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_section_summary: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          keywords: string[]
          model_name: string | null
          section_id: string
          summary_purpose: string
          summary_text: Json
          summary_type: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          keywords?: string[]
          model_name?: string | null
          section_id: string
          summary_purpose: string
          summary_text: Json
          summary_type: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          keywords?: string[]
          model_name?: string | null
          section_id?: string
          summary_purpose?: string
          summary_text?: Json
          summary_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_section_summary_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sections: {
        Row: {
          char_end: number
          char_start: number
          created_at: string | null
          document_version_id: string
          id: string
          page_end: number | null
          page_start: number | null
          section_number: string
          section_title: string | null
        }
        Insert: {
          char_end: number
          char_start: number
          created_at?: string | null
          document_version_id: string
          id?: string
          page_end?: number | null
          page_start?: number | null
          section_number: string
          section_title?: string | null
        }
        Update: {
          char_end?: number
          char_start?: number
          created_at?: string | null
          document_version_id?: string
          id?: string
          page_end?: number | null
          page_start?: number | null
          section_number?: string
          section_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_document_versions_id_fk"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
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
      document_versions: {
        Row: {
          content_hash: string | null
          create_at: string | null
          create_by: string | null
          created_by: string
          document_id: string | null
          file_type: string | null
          id: string
          page_count: number | null
          s3_bucket: string | null
          s3_key: string | null
          s3_version_id: string | null
        }
        Insert: {
          content_hash?: string | null
          create_at?: string | null
          create_by?: string | null
          created_by: string
          document_id?: string | null
          file_type?: string | null
          id?: string
          page_count?: number | null
          s3_bucket?: string | null
          s3_key?: string | null
          s3_version_id?: string | null
        }
        Update: {
          content_hash?: string | null
          create_at?: string | null
          create_by?: string | null
          created_by?: string
          document_id?: string | null
          file_type?: string | null
          id?: string
          page_count?: number | null
          s3_bucket?: string | null
          s3_key?: string | null
          s3_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_documents_id_fk"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_users_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          embedding: string
          id: string
          metadata: Json
          section_number: string | null
          tenant_id: string | null
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          embedding: string
          id?: string
          metadata?: Json
          section_number?: string | null
          tenant_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          embedding?: string
          id?: string
          metadata?: Json
          section_number?: string | null
          tenant_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_users_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
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
      extracted_entities: {
        Row: {
          anchor: Json
          confidence: number | null
          created_at: string | null
          document_version_id: string
          entity_id: string
          entity_type: string
          extraction_run_id: string
          id: string
        }
        Insert: {
          anchor: Json
          confidence?: number | null
          created_at?: string | null
          document_version_id: string
          entity_id: string
          entity_type: string
          extraction_run_id: string
          id?: string
        }
        Update: {
          anchor?: Json
          confidence?: number | null
          created_at?: string | null
          document_version_id?: string
          entity_id?: string
          entity_type?: string
          extraction_run_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_entities_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_entities_extraction_run_id_fkey"
            columns: ["extraction_run_id"]
            isOneToOne: false
            referencedRelation: "extraction_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_runs: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_version_id: string
          extractor: string
          id: string
          model: string
          module: string
          schema_version_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_version_id: string
          extractor: string
          id?: string
          model: string
          module: string
          schema_version_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_version_id?: string
          extractor?: string
          id?: string
          model?: string
          module?: string
          schema_version_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_runs_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_runs_extraction_schema_versions_id_fk"
            columns: ["schema_version_id"]
            isOneToOne: false
            referencedRelation: "extraction_schema_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_schema_versions: {
        Row: {
          created_at: string | null
          id: string
          json_schema: Json | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          json_schema?: Json | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          json_schema?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      fda_communications: {
        Row: {
          communication_date: string
          communication_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          incoming_document_path: string | null
          ind_id: number
          meeting_minutes_path: string | null
          meeting_type: string | null
          outgoing_document_path: string | null
          requires_response: boolean | null
          response_due_date: string | null
          response_submitted_date: string | null
          subject: string | null
        }
        Insert: {
          communication_date: string
          communication_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          incoming_document_path?: string | null
          ind_id: number
          meeting_minutes_path?: string | null
          meeting_type?: string | null
          outgoing_document_path?: string | null
          requires_response?: boolean | null
          response_due_date?: string | null
          response_submitted_date?: string | null
          subject?: string | null
        }
        Update: {
          communication_date?: string
          communication_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          incoming_document_path?: string | null
          ind_id?: number
          meeting_minutes_path?: string | null
          meeting_type?: string | null
          outgoing_document_path?: string | null
          requires_response?: boolean | null
          response_due_date?: string | null
          response_submitted_date?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fda_communications_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "ind_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fda_communications_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "v_ind_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      ind_amendments: {
        Row: {
          amendment_number: number | null
          amendment_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          document_path: string | null
          ectd_sequence: string | null
          fda_acknowledgment_date: string | null
          fda_comments: string | null
          id: number
          ind_id: number
          serial_number: string | null
          submission_date: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          amendment_number?: number | null
          amendment_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_path?: string | null
          ectd_sequence?: string | null
          fda_acknowledgment_date?: string | null
          fda_comments?: string | null
          id?: number
          ind_id: number
          serial_number?: string | null
          submission_date: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          amendment_number?: number | null
          amendment_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_path?: string | null
          ectd_sequence?: string | null
          fda_acknowledgment_date?: string | null
          fda_comments?: string | null
          id?: number
          ind_id?: number
          serial_number?: string | null
          submission_date?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ind_amendments_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "ind_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ind_amendments_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "v_ind_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      ind_clinical_studies: {
        Row: {
          actual_enrollment: number | null
          clinical_hold_date: string | null
          clinical_hold_reason: string | null
          completion_date: string | null
          created_at: string | null
          id: number
          ind_id: number
          number_of_sites: number | null
          on_clinical_hold: boolean | null
          planned_enrollment: number | null
          principal_investigator: string | null
          protocol_number: string
          start_date: string | null
          study_phase: string | null
          study_status: string | null
          study_title: string | null
          updated_at: string | null
        }
        Insert: {
          actual_enrollment?: number | null
          clinical_hold_date?: string | null
          clinical_hold_reason?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: number
          ind_id: number
          number_of_sites?: number | null
          on_clinical_hold?: boolean | null
          planned_enrollment?: number | null
          principal_investigator?: string | null
          protocol_number: string
          start_date?: string | null
          study_phase?: string | null
          study_status?: string | null
          study_title?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_enrollment?: number | null
          clinical_hold_date?: string | null
          clinical_hold_reason?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: number
          ind_id?: number
          number_of_sites?: number | null
          on_clinical_hold?: boolean | null
          planned_enrollment?: number | null
          principal_investigator?: string | null
          protocol_number?: string
          start_date?: string | null
          study_phase?: string | null
          study_status?: string | null
          study_title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ind_clinical_studies_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "ind_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ind_clinical_studies_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "v_ind_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      ind_docs: {
        Row: {
          company: string | null
          content: string | null
          document_hash: string | null
          embedding: string | null
          embedding_1536: string | null
          filename: string | null
          id: string
          metadata: Json | null
          section: string | null
        }
        Insert: {
          company?: string | null
          content?: string | null
          document_hash?: string | null
          embedding?: string | null
          embedding_1536?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          section?: string | null
        }
        Update: {
          company?: string | null
          content?: string | null
          document_hash?: string | null
          embedding?: string | null
          embedding_1536?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          section?: string | null
        }
        Relationships: []
      }
      ind_expedited_designations: {
        Row: {
          clinical_evidence_summary: string | null
          created_at: string | null
          created_by: string | null
          designation_status: Database["public"]["Enums"]["designation_status"]
          designation_type: Database["public"]["Enums"]["designation_type"]
          fda_decision_date: string | null
          fda_decision_letter_path: string | null
          fda_denial_reason: string | null
          fda_response_due_date: string | null
          grant_letter_path: string | null
          granted_date: string | null
          id: number
          ind_id: number
          justification: string | null
          request_date: string | null
          request_submitted_by: string | null
          revocation_reason: string | null
          revoked_date: string | null
          updated_at: string | null
          updated_by: string | null
          withdrawal_reason: string | null
          withdrawn_date: string | null
        }
        Insert: {
          clinical_evidence_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          designation_status?: Database["public"]["Enums"]["designation_status"]
          designation_type: Database["public"]["Enums"]["designation_type"]
          fda_decision_date?: string | null
          fda_decision_letter_path?: string | null
          fda_denial_reason?: string | null
          fda_response_due_date?: string | null
          grant_letter_path?: string | null
          granted_date?: string | null
          id?: number
          ind_id: number
          justification?: string | null
          request_date?: string | null
          request_submitted_by?: string | null
          revocation_reason?: string | null
          revoked_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          withdrawal_reason?: string | null
          withdrawn_date?: string | null
        }
        Update: {
          clinical_evidence_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          designation_status?: Database["public"]["Enums"]["designation_status"]
          designation_type?: Database["public"]["Enums"]["designation_type"]
          fda_decision_date?: string | null
          fda_decision_letter_path?: string | null
          fda_denial_reason?: string | null
          fda_response_due_date?: string | null
          grant_letter_path?: string | null
          granted_date?: string | null
          id?: number
          ind_id?: number
          justification?: string | null
          request_date?: string | null
          request_submitted_by?: string | null
          revocation_reason?: string | null
          revoked_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          withdrawal_reason?: string | null
          withdrawn_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ind_expedited_designations_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "ind_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ind_expedited_designations_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "v_ind_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      ind_safety_reports: {
        Row: {
          actions_taken: string | null
          created_at: string | null
          created_by: string | null
          event_date: string | null
          event_description: string | null
          fda_submission_date: string | null
          form_3500a_path: string | null
          id: number
          ind_id: number
          protocol_modifications: string | null
          report_date: string
          report_type: string | null
          safety_report_number: string | null
          severity: string | null
          submitted_to_fda: boolean | null
          suspected_relationship: string | null
        }
        Insert: {
          actions_taken?: string | null
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          event_description?: string | null
          fda_submission_date?: string | null
          form_3500a_path?: string | null
          id?: number
          ind_id: number
          protocol_modifications?: string | null
          report_date: string
          report_type?: string | null
          safety_report_number?: string | null
          severity?: string | null
          submitted_to_fda?: boolean | null
          suspected_relationship?: string | null
        }
        Update: {
          actions_taken?: string | null
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          event_description?: string | null
          fda_submission_date?: string | null
          form_3500a_path?: string | null
          id?: number
          ind_id?: number
          protocol_modifications?: string | null
          report_date?: string
          report_type?: string | null
          safety_report_number?: string | null
          severity?: string | null
          submitted_to_fda?: boolean | null
          suspected_relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ind_safety_reports_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "ind_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ind_safety_reports_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "v_ind_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      ind_status_history: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          changed_by: string | null
          from_status: Database["public"]["Enums"]["ind_status_type"] | null
          id: number
          ind_id: number
          notes: string | null
          supporting_document_path: string | null
          to_status: Database["public"]["Enums"]["ind_status_type"]
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["ind_status_type"] | null
          id?: number
          ind_id: number
          notes?: string | null
          supporting_document_path?: string | null
          to_status: Database["public"]["Enums"]["ind_status_type"]
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["ind_status_type"] | null
          id?: number
          ind_id?: number
          notes?: string | null
          supporting_document_path?: string | null
          to_status?: Database["public"]["Enums"]["ind_status_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ind_status_history_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "ind_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ind_status_history_ind_id_fkey"
            columns: ["ind_id"]
            isOneToOne: false
            referencedRelation: "v_ind_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      ind_submissions: {
        Row: {
          active_ingredient: string | null
          clinical_hold_date: string | null
          clinical_hold_lifted_date: string | null
          clinical_hold_reason: string | null
          clinical_hold_type: string | null
          created_at: string | null
          created_by: string | null
          current_status: Database["public"]["Enums"]["ind_status_type"]
          effective_date: string | null
          fda_division: string | null
          fda_receipt_date: string | null
          fda_reviewer_name: string | null
          id: number
          inactive_date: string | null
          inactive_reason: string | null
          ind_number: string | null
          ind_type: string
          indication: string | null
          pre_ind_meeting_date: string | null
          product_name: string | null
          regulatory_project_manager: string | null
          sponsor_name: string
          sponsor_type: string | null
          status_changed_at: string | null
          submission_date: string | null
          terminated_date: string | null
          terminated_reason: string | null
          therapeutic_area: string | null
          updated_at: string | null
          updated_by: string | null
          withdrawn_date: string | null
          withdrawn_reason: string | null
        }
        Insert: {
          active_ingredient?: string | null
          clinical_hold_date?: string | null
          clinical_hold_lifted_date?: string | null
          clinical_hold_reason?: string | null
          clinical_hold_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_status?: Database["public"]["Enums"]["ind_status_type"]
          effective_date?: string | null
          fda_division?: string | null
          fda_receipt_date?: string | null
          fda_reviewer_name?: string | null
          id?: number
          inactive_date?: string | null
          inactive_reason?: string | null
          ind_number?: string | null
          ind_type: string
          indication?: string | null
          pre_ind_meeting_date?: string | null
          product_name?: string | null
          regulatory_project_manager?: string | null
          sponsor_name: string
          sponsor_type?: string | null
          status_changed_at?: string | null
          submission_date?: string | null
          terminated_date?: string | null
          terminated_reason?: string | null
          therapeutic_area?: string | null
          updated_at?: string | null
          updated_by?: string | null
          withdrawn_date?: string | null
          withdrawn_reason?: string | null
        }
        Update: {
          active_ingredient?: string | null
          clinical_hold_date?: string | null
          clinical_hold_lifted_date?: string | null
          clinical_hold_reason?: string | null
          clinical_hold_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_status?: Database["public"]["Enums"]["ind_status_type"]
          effective_date?: string | null
          fda_division?: string | null
          fda_receipt_date?: string | null
          fda_reviewer_name?: string | null
          id?: number
          inactive_date?: string | null
          inactive_reason?: string | null
          ind_number?: string | null
          ind_type?: string
          indication?: string | null
          pre_ind_meeting_date?: string | null
          product_name?: string | null
          regulatory_project_manager?: string | null
          sponsor_name?: string
          sponsor_type?: string | null
          status_changed_at?: string | null
          submission_date?: string | null
          terminated_date?: string | null
          terminated_reason?: string | null
          therapeutic_area?: string | null
          updated_at?: string | null
          updated_by?: string | null
          withdrawn_date?: string | null
          withdrawn_reason?: string | null
        }
        Relationships: []
      }
      join_submission_actiontypes_lookup: {
        Row: {
          actiontypes_lookupid: number | null
          applno: string
          j_submissionactiontypeid: number
          submissionno: number
          submissiontype: string | null
        }
        Insert: {
          actiontypes_lookupid?: number | null
          applno: string
          j_submissionactiontypeid?: number
          submissionno: number
          submissiontype?: string | null
        }
        Update: {
          actiontypes_lookupid?: number | null
          applno?: string
          j_submissionactiontypeid?: number
          submissionno?: number
          submissiontype?: string | null
        }
        Relationships: []
      }
      ncd_config: {
        Row: {
          config_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          project_id: string | null
          scope: Database["public"]["Enums"]["ncd_config_scope"]
          section_code: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
          value: Json
          version: number | null
        }
        Insert: {
          config_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          scope: Database["public"]["Enums"]["ncd_config_scope"]
          section_code?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          value: Json
          version?: number | null
        }
        Update: {
          config_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          scope?: Database["public"]["Enums"]["ncd_config_scope"]
          section_code?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: Json
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_config_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_ctd_section_def: {
        Row: {
          code: string
          level: number | null
          module: string | null
          parent_code: string | null
          title: string | null
        }
        Insert: {
          code: string
          level?: number | null
          module?: string | null
          parent_code?: string | null
          title?: string | null
        }
        Update: {
          code?: string
          level?: number | null
          module?: string | null
          parent_code?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_ctd_section_def_parent_code_fkey"
            columns: ["parent_code"]
            isOneToOne: false
            referencedRelation: "ncd_ctd_section_def"
            referencedColumns: ["code"]
          },
        ]
      }
      ncd_ctd_section_reference: {
        Row: {
          bucket: string
          created_at: string | null
          element_number: string
          id: string
          module4_sections: string[]
          payload: Json
          project_id: string
          section_number: string | null
          template_payload: Json
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          bucket: string
          created_at?: string | null
          element_number: string
          id?: string
          module4_sections?: string[]
          payload: Json
          project_id: string
          section_number?: string | null
          template_payload: Json
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string | null
          element_number?: string
          id?: string
          module4_sections?: string[]
          payload?: Json
          project_id?: string
          section_number?: string | null
          template_payload?: Json
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_ctd_section_reference_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_ctd_section_reference_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_ctd_section_summary: {
        Row: {
          bucket: string
          created_at: string | null
          element_numbers: string[]
          embedding: string | null
          final_text: string | null
          id: string
          model_name: string | null
          previous_id: string | null
          project_id: string
          section_number: string
          status: string
          summary_text: string
          tenant_id: string
          updated_at: string | null
          user_comment: string | null
          user_prompt: string | null
        }
        Insert: {
          bucket: string
          created_at?: string | null
          element_numbers?: string[]
          embedding?: string | null
          final_text?: string | null
          id?: string
          model_name?: string | null
          previous_id?: string | null
          project_id: string
          section_number: string
          status: string
          summary_text: string
          tenant_id: string
          updated_at?: string | null
          user_comment?: string | null
          user_prompt?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string | null
          element_numbers?: string[]
          embedding?: string | null
          final_text?: string | null
          id?: string
          model_name?: string | null
          previous_id?: string | null
          project_id?: string
          section_number?: string
          status?: string
          summary_text?: string
          tenant_id?: string
          updated_at?: string | null
          user_comment?: string | null
          user_prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_ctd_section_summary_previous_id_fkey"
            columns: ["previous_id"]
            isOneToOne: false
            referencedRelation: "ncd_ctd_section_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_ctd_section_summary_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_ctd_section_summary_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_ctd_tabulated_summary: {
        Row: {
          bucket: string
          created_at: string | null
          embedding: string | null
          final_payload: Json | null
          id: string
          model_name: string | null
          previous_id: string | null
          project_id: string
          section_number: string
          status: string
          table_payload: Json
          tenant_id: string
          updated_at: string | null
          user_comment: string | null
          user_prompt: string | null
        }
        Insert: {
          bucket: string
          created_at?: string | null
          embedding?: string | null
          final_payload?: Json | null
          id?: string
          model_name?: string | null
          previous_id?: string | null
          project_id: string
          section_number: string
          status: string
          table_payload: Json
          tenant_id: string
          updated_at?: string | null
          user_comment?: string | null
          user_prompt?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string | null
          embedding?: string | null
          final_payload?: Json | null
          id?: string
          model_name?: string | null
          previous_id?: string | null
          project_id?: string
          section_number?: string
          status?: string
          table_payload?: Json
          tenant_id?: string
          updated_at?: string | null
          user_comment?: string | null
          user_prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_ctd_tabulated_summary_previous_id_fkey"
            columns: ["previous_id"]
            isOneToOne: false
            referencedRelation: "ncd_ctd_tabulated_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_ctd_tabulated_summary_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_ctd_tabulated_summary_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_document_page: {
        Row: {
          id: number
          page_number: number
          source_document_id: string | null
          text: string | null
        }
        Insert: {
          id?: number
          page_number: number
          source_document_id?: string | null
          text?: string | null
        }
        Update: {
          id?: number
          page_number?: number
          source_document_id?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_document_page_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "ncd_source_document"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_dose_group: {
        Row: {
          dose_mg_per_kg: number | null
          dose_mg_per_m2: number | null
          duration_days: number | null
          extra_attributes: Json | null
          frequency: string | null
          id: string
          n_animals: number | null
          name: string | null
          sex: string | null
          study_id: string | null
        }
        Insert: {
          dose_mg_per_kg?: number | null
          dose_mg_per_m2?: number | null
          duration_days?: number | null
          extra_attributes?: Json | null
          frequency?: string | null
          id?: string
          n_animals?: number | null
          name?: string | null
          sex?: string | null
          study_id?: string | null
        }
        Update: {
          dose_mg_per_kg?: number | null
          dose_mg_per_m2?: number | null
          duration_days?: number | null
          extra_attributes?: Json | null
          frequency?: string | null
          id?: string
          n_animals?: number | null
          name?: string | null
          sex?: string | null
          study_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_dose_group_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "ncd_study"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_exposure_metric: {
        Row: {
          clinical_multiple: number | null
          dose_group_id: string | null
          extra_attributes: Json | null
          id: string
          matrix: string | null
          parameter: string | null
          source_chunk_id: string | null
          species: string | null
          study_id: string | null
          timepoint: string | null
          unit: string | null
          value: number | null
        }
        Insert: {
          clinical_multiple?: number | null
          dose_group_id?: string | null
          extra_attributes?: Json | null
          id?: string
          matrix?: string | null
          parameter?: string | null
          source_chunk_id?: string | null
          species?: string | null
          study_id?: string | null
          timepoint?: string | null
          unit?: string | null
          value?: number | null
        }
        Update: {
          clinical_multiple?: number | null
          dose_group_id?: string | null
          extra_attributes?: Json | null
          id?: string
          matrix?: string | null
          parameter?: string | null
          source_chunk_id?: string | null
          species?: string | null
          study_id?: string | null
          timepoint?: string | null
          unit?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_exposure_metric_dose_group_id_fkey"
            columns: ["dose_group_id"]
            isOneToOne: false
            referencedRelation: "ncd_dose_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_exposure_metric_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "ncd_text_chunk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_exposure_metric_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "ncd_study"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_finding: {
        Row: {
          adverse: boolean | null
          context_asset_ids: string[] | null
          context_page: number | null
          context_text: string | null
          dose_threshold_mg_per_kg: number | null
          extra_attributes: Json | null
          finding_term: string | null
          id: string
          is_positive: boolean | null
          noael_flag: boolean | null
          onset_day: number | null
          organ: string | null
          organ_system: string | null
          recovery: string | null
          reversible: boolean | null
          severity: string | null
          source_chunk_id: string | null
          study_id: string | null
        }
        Insert: {
          adverse?: boolean | null
          context_asset_ids?: string[] | null
          context_page?: number | null
          context_text?: string | null
          dose_threshold_mg_per_kg?: number | null
          extra_attributes?: Json | null
          finding_term?: string | null
          id?: string
          is_positive?: boolean | null
          noael_flag?: boolean | null
          onset_day?: number | null
          organ?: string | null
          organ_system?: string | null
          recovery?: string | null
          reversible?: boolean | null
          severity?: string | null
          source_chunk_id?: string | null
          study_id?: string | null
        }
        Update: {
          adverse?: boolean | null
          context_asset_ids?: string[] | null
          context_page?: number | null
          context_text?: string | null
          dose_threshold_mg_per_kg?: number | null
          extra_attributes?: Json | null
          finding_term?: string | null
          id?: string
          is_positive?: boolean | null
          noael_flag?: boolean | null
          onset_day?: number | null
          organ?: string | null
          organ_system?: string | null
          recovery?: string | null
          reversible?: boolean | null
          severity?: string | null
          source_chunk_id?: string | null
          study_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_finding_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "ncd_text_chunk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_finding_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "ncd_study"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_ingestion_pipeline_status: {
        Row: {
          content_hash: string
          document_version_id: string | null
          error_message: string | null
          id: string
          pipeline: string
          s3_bucket: string
          s3_key: string
          s3_version_id: string | null
          source_document_id: string | null
          started_at: string | null
          status: string
          study_id: string | null
          updated_at: string | null
        }
        Insert: {
          content_hash: string
          document_version_id?: string | null
          error_message?: string | null
          id?: string
          pipeline: string
          s3_bucket: string
          s3_key: string
          s3_version_id?: string | null
          source_document_id?: string | null
          started_at?: string | null
          status: string
          study_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content_hash?: string
          document_version_id?: string | null
          error_message?: string | null
          id?: string
          pipeline?: string
          s3_bucket?: string
          s3_key?: string
          s3_version_id?: string | null
          source_document_id?: string | null
          started_at?: string | null
          status?: string
          study_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_ingestion_pipeline_status_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_ingestion_pipeline_status_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "ncd_source_document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_ingestion_pipeline_status_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "ncd_study"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_ingestion_run_reports: {
        Row: {
          bucket: string
          company: string | null
          core_check: string | null
          core_failed: number | null
          core_runs: number | null
          created_at: string | null
          doc_failed: number | null
          doc_processed: number | null
          doc_skipped: number | null
          ended_at: string | null
          error_summary: Json | null
          force_core: boolean | null
          force_tox: boolean | null
          id: string
          md_suffix: string | null
          mode: string | null
          module: number | null
          project: string | null
          project_id: string | null
          report_json: Json | null
          run_id: string
          started_at: string | null
          tox_failed: number | null
          tox_runs: number | null
        }
        Insert: {
          bucket: string
          company?: string | null
          core_check?: string | null
          core_failed?: number | null
          core_runs?: number | null
          created_at?: string | null
          doc_failed?: number | null
          doc_processed?: number | null
          doc_skipped?: number | null
          ended_at?: string | null
          error_summary?: Json | null
          force_core?: boolean | null
          force_tox?: boolean | null
          id?: string
          md_suffix?: string | null
          mode?: string | null
          module?: number | null
          project?: string | null
          project_id?: string | null
          report_json?: Json | null
          run_id: string
          started_at?: string | null
          tox_failed?: number | null
          tox_runs?: number | null
        }
        Update: {
          bucket?: string
          company?: string | null
          core_check?: string | null
          core_failed?: number | null
          core_runs?: number | null
          created_at?: string | null
          doc_failed?: number | null
          doc_processed?: number | null
          doc_skipped?: number | null
          ended_at?: string | null
          error_summary?: Json | null
          force_core?: boolean | null
          force_tox?: boolean | null
          id?: string
          md_suffix?: string | null
          mode?: string | null
          module?: number | null
          project?: string | null
          project_id?: string | null
          report_json?: Json | null
          run_id?: string
          started_at?: string | null
          tox_failed?: number | null
          tox_runs?: number | null
        }
        Relationships: []
      }
      ncd_noael: {
        Row: {
          basis: string | null
          dose: number | null
          dose_group_id: string | null
          dose_unit: string | null
          endpoint: string | null
          id: string
          justification: string | null
          noael_value: number | null
          sex: string | null
          source_anchor_id: string | null
          species: string | null
          study_id: string | null
          unit: string | null
          value: string | null
        }
        Insert: {
          basis?: string | null
          dose?: number | null
          dose_group_id?: string | null
          dose_unit?: string | null
          endpoint?: string | null
          id?: string
          justification?: string | null
          noael_value?: number | null
          sex?: string | null
          source_anchor_id?: string | null
          species?: string | null
          study_id?: string | null
          unit?: string | null
          value?: string | null
        }
        Update: {
          basis?: string | null
          dose?: number | null
          dose_group_id?: string | null
          dose_unit?: string | null
          endpoint?: string | null
          id?: string
          justification?: string | null
          noael_value?: number | null
          sex?: string | null
          source_anchor_id?: string | null
          species?: string | null
          study_id?: string | null
          unit?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_noael_document_anchors_id_fk"
            columns: ["source_anchor_id"]
            isOneToOne: false
            referencedRelation: "document_anchors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_noael_ncd_dose_group_id_fk"
            columns: ["dose_group_id"]
            isOneToOne: false
            referencedRelation: "ncd_dose_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_noael_ncd_study_id_fk"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "ncd_study"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_nonclinical_endpoints: {
        Row: {
          basis: string | null
          confidence_score: number | null
          created_at: string | null
          derived: boolean | null
          document_id: string
          duration: string | null
          endpoint_type: string
          id: string
          project_id: string
          rationale: string | null
          route: string | null
          section_id: string | null
          sex: string | null
          species: string
          study_id: string
          tenant_id: string
          unit: string
          value: number
        }
        Insert: {
          basis?: string | null
          confidence_score?: number | null
          created_at?: string | null
          derived?: boolean | null
          document_id: string
          duration?: string | null
          endpoint_type: string
          id?: string
          project_id: string
          rationale?: string | null
          route?: string | null
          section_id?: string | null
          sex?: string | null
          species: string
          study_id: string
          tenant_id: string
          unit: string
          value: number
        }
        Update: {
          basis?: string | null
          confidence_score?: number | null
          created_at?: string | null
          derived?: boolean | null
          document_id?: string
          duration?: string | null
          endpoint_type?: string
          id?: string
          project_id?: string
          rationale?: string | null
          route?: string | null
          section_id?: string | null
          sex?: string | null
          species?: string
          study_id?: string
          tenant_id?: string
          unit?: string
          value?: number
        }
        Relationships: []
      }
      ncd_pk_parameters: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          day: number | null
          document_id: string
          dose: number | null
          dose_group: string | null
          dose_unit: string | null
          id: string
          matrix: string | null
          method: string | null
          parameter: string
          project_id: string
          route: string | null
          section_id: string | null
          sex: string | null
          species: string
          study_id: string
          tenant_id: string
          timepoint: string | null
          unit: string
          value: number
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          day?: number | null
          document_id: string
          dose?: number | null
          dose_group?: string | null
          dose_unit?: string | null
          id?: string
          matrix?: string | null
          method?: string | null
          parameter: string
          project_id: string
          route?: string | null
          section_id?: string | null
          sex?: string | null
          species: string
          study_id: string
          tenant_id: string
          timepoint?: string | null
          unit: string
          value: number
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          day?: number | null
          document_id?: string
          dose?: number | null
          dose_group?: string | null
          dose_unit?: string | null
          id?: string
          matrix?: string | null
          method?: string | null
          parameter?: string
          project_id?: string
          route?: string | null
          section_id?: string | null
          sex?: string | null
          species?: string
          study_id?: string
          tenant_id?: string
          timepoint?: string | null
          unit?: string
          value?: number
        }
        Relationships: []
      }
      ncd_pk_summary: {
        Row: {
          id: string
          interpretation: string | null
          parameter: string | null
          source_anchor_id: string | null
          species: string | null
          study_id: string | null
          unit: string | null
          value: number | null
        }
        Insert: {
          id?: string
          interpretation?: string | null
          parameter?: string | null
          source_anchor_id?: string | null
          species?: string | null
          study_id?: string | null
          unit?: string | null
          value?: number | null
        }
        Update: {
          id?: string
          interpretation?: string | null
          parameter?: string | null
          source_anchor_id?: string | null
          species?: string | null
          study_id?: string | null
          unit?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_pk_summary_document_anchors_id_fk"
            columns: ["source_anchor_id"]
            isOneToOne: false
            referencedRelation: "document_anchors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_pk_summary_ncd_study_id_fk"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "ncd_study"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_source_document: {
        Row: {
          ctd_section: string | null
          file_name: string
          id: string
          module: string
          project_id: string | null
          sha256: string
          uploaded_at: string | null
        }
        Insert: {
          ctd_section?: string | null
          file_name: string
          id?: string
          module: string
          project_id?: string | null
          sha256: string
          uploaded_at?: string | null
        }
        Update: {
          ctd_section?: string | null
          file_name?: string
          id?: string
          module?: string
          project_id?: string | null
          sha256?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_source_document_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_study: {
        Row: {
          created_at: string | null
          duration_days: number | null
          extra_attributes: Json | null
          glp_status: string | null
          id: string
          main_source_document_id: string | null
          module4_section: string | null
          project_id: string | null
          route: string | null
          source_document_id: string | null
          species: string | null
          sponsor_study_id: string | null
          strain: string | null
          study_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_days?: number | null
          extra_attributes?: Json | null
          glp_status?: string | null
          id?: string
          main_source_document_id?: string | null
          module4_section?: string | null
          project_id?: string | null
          route?: string | null
          source_document_id?: string | null
          species?: string | null
          sponsor_study_id?: string | null
          strain?: string | null
          study_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_days?: number | null
          extra_attributes?: Json | null
          glp_status?: string | null
          id?: string
          main_source_document_id?: string | null
          module4_section?: string | null
          project_id?: string | null
          route?: string | null
          source_document_id?: string | null
          species?: string | null
          sponsor_study_id?: string | null
          strain?: string | null
          study_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_study_documents_id_fk"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_study_main_source_document_id_fkey"
            columns: ["main_source_document_id"]
            isOneToOne: false
            referencedRelation: "ncd_source_document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_study_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_study_safety_summary: {
        Row: {
          clinical_multiple: number | null
          id: string
          limiting_finding: string | null
          limiting_organ: string | null
          loael_mg_per_kg: number | null
          noael_mg_per_kg: number | null
          source_chunk_id: string | null
          study_id: string | null
        }
        Insert: {
          clinical_multiple?: number | null
          id?: string
          limiting_finding?: string | null
          limiting_organ?: string | null
          loael_mg_per_kg?: number | null
          noael_mg_per_kg?: number | null
          source_chunk_id?: string | null
          study_id?: string | null
        }
        Update: {
          clinical_multiple?: number | null
          id?: string
          limiting_finding?: string | null
          limiting_organ?: string | null
          loael_mg_per_kg?: number | null
          noael_mg_per_kg?: number | null
          source_chunk_id?: string | null
          study_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_study_safety_summary_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "ncd_text_chunk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_study_safety_summary_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: true
            referencedRelation: "ncd_study"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_template_override: {
        Row: {
          created_at: string
          id: string
          payload: Json
          section: string
          subsection: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload: Json
          section: string
          subsection?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          section?: string
          subsection?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ncd_term_dictionary: {
        Row: {
          canonical_term: string | null
          category: string | null
          id: string | null
          maps_to_section: string | null
          priority: number | null
          synonyms: string[] | null
        }
        Insert: {
          canonical_term?: string | null
          category?: string | null
          id?: string | null
          maps_to_section?: string | null
          priority?: number | null
          synonyms?: string[] | null
        }
        Update: {
          canonical_term?: string | null
          category?: string | null
          id?: string | null
          maps_to_section?: string | null
          priority?: number | null
          synonyms?: string[] | null
        }
        Relationships: []
      }
      ncd_term_occurrence: {
        Row: {
          confidence: number | null
          id: string
          source_anchor_id: string | null
          term__dictionary_id: string | null
        }
        Insert: {
          confidence?: number | null
          id?: string
          source_anchor_id?: string | null
          term__dictionary_id?: string | null
        }
        Update: {
          confidence?: number | null
          id?: string
          source_anchor_id?: string | null
          term__dictionary_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_term_occurrence_document_anchors_id_fk"
            columns: ["source_anchor_id"]
            isOneToOne: false
            referencedRelation: "document_anchors"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_text_chunk: {
        Row: {
          id: string
          offset_end: number | null
          offset_start: number | null
          page_from: number | null
          page_to: number | null
          raw_text: string
          section_label: string | null
          source_document_id: string | null
          study_id: string | null
        }
        Insert: {
          id?: string
          offset_end?: number | null
          offset_start?: number | null
          page_from?: number | null
          page_to?: number | null
          raw_text: string
          section_label?: string | null
          source_document_id?: string | null
          study_id?: string | null
        }
        Update: {
          id?: string
          offset_end?: number | null
          offset_start?: number | null
          page_from?: number | null
          page_to?: number | null
          raw_text?: string
          section_label?: string | null
          source_document_id?: string | null
          study_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_text_chunk_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "ncd_source_document"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_text_chunk_embedding: {
        Row: {
          chunk_id: string
          embedding: string | null
        }
        Insert: {
          chunk_id: string
          embedding?: string | null
        }
        Update: {
          chunk_id?: string
          embedding?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_text_chunk_embedding_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: true
            referencedRelation: "ncd_text_chunk"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_topic: {
        Row: {
          category: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          category?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          category?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_topic_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ncd_topic"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_topic_assignment: {
        Row: {
          chunk_id: string | null
          exposure_id: string | null
          finding_id: string | null
          id: string
          project_id: string | null
          study_id: string | null
          topic_id: string | null
        }
        Insert: {
          chunk_id?: string | null
          exposure_id?: string | null
          finding_id?: string | null
          id?: string
          project_id?: string | null
          study_id?: string | null
          topic_id?: string | null
        }
        Update: {
          chunk_id?: string | null
          exposure_id?: string | null
          finding_id?: string | null
          id?: string
          project_id?: string | null
          study_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_topic_assignment_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "ncd_text_chunk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_topic_assignment_exposure_id_fkey"
            columns: ["exposure_id"]
            isOneToOne: false
            referencedRelation: "ncd_exposure_metric"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_topic_assignment_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "ncd_finding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_topic_assignment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_topic_assignment_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "ncd_study"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncd_topic_assignment_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ncd_topic"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_topic_synonym: {
        Row: {
          id: string
          synonym: string | null
          topic_id: string | null
        }
        Insert: {
          id?: string
          synonym?: string | null
          topic_id?: string | null
        }
        Update: {
          id?: string
          synonym?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_topic_synonym_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ncd_topic"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_validation: {
        Row: {
          comment: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          reviewer_id: string | null
          status: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          reviewer_id?: string | null
          status?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          reviewer_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncd_validation_users_id_fk"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          resource_id: string | null
          resource_type: string | null
          severity: string | null
          starts_at: string | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          severity?: string | null
          starts_at?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          severity?: string | null
          starts_at?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          created_at: string
          delivery_channel: string | null
          dismissed_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_channel?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_channel?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notification_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string
          document_comment_id: string | null
          from: string | null
          id: string
          is_read: boolean
          resource_id: string | null
          type: Database["public"]["Enums"]["notification_type"] | null
        }
        Insert: {
          created_at?: string
          created_by: string
          document_comment_id?: string | null
          from?: string | null
          id?: string
          is_read?: boolean
          resource_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
        }
        Update: {
          created_at?: string
          created_by?: string
          document_comment_id?: string | null
          from?: string | null
          id?: string
          is_read?: boolean
          resource_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_document_comments_id_fk"
            columns: ["document_comment_id"]
            isOneToOne: false
            referencedRelation: "document_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          additional_notes: string | null
          clinical_lead: string | null
          cmc_lead: string | null
          created_at: string
          description: string | null
          drug_name: string
          fda_contact_email: string | null
          id: string
          ind_number: string | null
          ind_title: string
          metadata: Json | null
          pre_ind_meeting_date: string | null
          preclinical_lead: string | null
          priority: string | null
          product_type: string
          progress: number | null
          project_creator_id: string | null
          project_start_date: string | null
          publisher: string | null
          regulatory_owner: string | null
          sponsor_contact_email: string
          sponsor_name: string | null
          status: string | null
          target_ind_submission_date: string | null
          tenantid: string | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          clinical_lead?: string | null
          cmc_lead?: string | null
          created_at?: string
          description?: string | null
          drug_name: string
          fda_contact_email?: string | null
          id?: string
          ind_number?: string | null
          ind_title: string
          metadata?: Json | null
          pre_ind_meeting_date?: string | null
          preclinical_lead?: string | null
          priority?: string | null
          product_type: string
          progress?: number | null
          project_creator_id?: string | null
          project_start_date?: string | null
          publisher?: string | null
          regulatory_owner?: string | null
          sponsor_contact_email: string
          sponsor_name?: string | null
          status?: string | null
          target_ind_submission_date?: string | null
          tenantid?: string | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          clinical_lead?: string | null
          cmc_lead?: string | null
          created_at?: string
          description?: string | null
          drug_name?: string
          fda_contact_email?: string | null
          id?: string
          ind_number?: string | null
          ind_title?: string
          metadata?: Json | null
          pre_ind_meeting_date?: string | null
          preclinical_lead?: string | null
          priority?: string | null
          product_type?: string
          progress?: number | null
          project_creator_id?: string | null
          project_start_date?: string | null
          publisher?: string | null
          regulatory_owner?: string | null
          sponsor_contact_email?: string
          sponsor_name?: string | null
          status?: string | null
          target_ind_submission_date?: string | null
          tenantid?: string | null
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
            foreignKeyName: "projects_tenantid_fkey"
            columns: ["tenantid"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      tenants: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_number: number | null
          contact_person: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          owner_user_id: string | null
          status: Database["public"]["Enums"]["tenant_status_type"]
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_number?: number | null
          contact_person?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          owner_user_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status_type"]
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_number?: number | null
          contact_person?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          owner_user_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status_type"]
        }
        Relationships: []
      }
      user_project: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          modified_at: string | null
          project_id: string | null
          role: Database["public"]["Enums"]["user_roles"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          modified_at?: string | null
          project_id?: string | null
          role?: Database["public"]["Enums"]["user_roles"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          modified_at?: string | null
          project_id?: string | null
          role?: Database["public"]["Enums"]["user_roles"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_project_projects_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_project_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_project_users_id_fk_2"
            columns: ["created_by"]
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
          public_id: number
          status: Database["public"]["Enums"]["user_status"] | null
          submission_role: Database["public"]["Enums"]["submission_role"]
          tenantid: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          phone?: string | null
          public_id?: number
          status?: Database["public"]["Enums"]["user_status"] | null
          submission_role?: Database["public"]["Enums"]["submission_role"]
          tenantid?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          public_id?: number
          status?: Database["public"]["Enums"]["user_status"] | null
          submission_role?: Database["public"]["Enums"]["submission_role"]
          tenantid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenantid_fkey"
            columns: ["tenantid"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_ind_dashboard: {
        Row: {
          active_studies: number | null
          current_status: Database["public"]["Enums"]["ind_status_type"] | null
          days_in_status: number | null
          effective_date: string | null
          has_breakthrough_therapy: boolean | null
          has_fast_track: boolean | null
          id: number | null
          ind_number: string | null
          product_name: string | null
          sponsor_name: string | null
          submission_date: string | null
          therapeutic_area: string | null
          total_studies: number | null
        }
        Relationships: []
      }
      v_pending_fda_actions: {
        Row: {
          action_detail: string | null
          action_type: string | null
          current_status: Database["public"]["Enums"]["ind_status_type"] | null
          due_date: string | null
          id: number | null
          ind_number: string | null
          product_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anchor_in_current_tenant: {
        Args: { p_anchor_id: string }
        Returns: boolean
      }
      chunk_in_current_tenant: {
        Args: { p_chunk_id: string }
        Returns: boolean
      }
      create_ind_submission: {
        Args: {
          p_created_by: string
          p_product_name: string
          p_sponsor_name: string
          p_therapeutic_area: string
        }
        Returns: number
      }
      current_tenant_id: { Args: never; Returns: string }
      document_version_in_current_tenant: {
        Args: { p_document_version_id: string }
        Returns: boolean
      }
      dose_group_in_current_tenant: {
        Args: { p_dose_group_id: string }
        Returns: boolean
      }
      exposure_in_current_tenant: {
        Args: { p_exposure_id: string }
        Returns: boolean
      }
      finding_in_current_tenant: {
        Args: { p_finding_id: string }
        Returns: boolean
      }
      is_team_creator: {
        Args: { p_team_id: string; p_user?: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { p_team_id: string; p_user?: string }
        Returns: boolean
      }
      match_acknowledge: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          chunk_id: string
          content: string
          filename: string
          id: string
          score: number
        }[]
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          distance: number
          id: number
          metadata: Json
        }[]
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
      project_in_current_tenant: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      source_document_in_current_tenant: {
        Args: { p_source_document_id: string }
        Returns: boolean
      }
      study_in_current_tenant: {
        Args: { p_study_id: string }
        Returns: boolean
      }
      user_in_current_tenant: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      comment_status: "open" | "resolved" | "responded"
      designation_status:
        | "not_applicable"
        | "under_consideration"
        | "requested"
        | "granted"
        | "denied"
        | "withdrawn"
        | "revoked"
      designation_type:
        | "fast_track"
        | "breakthrough_therapy"
        | "priority_review"
        | "accelerated_approval"
      ind_status_type:
        | "draft"
        | "pre_ind_meeting_requested"
        | "pre_ind_meeting_completed"
        | "submitted"
        | "under_review"
        | "active"
        | "clinical_hold_complete"
        | "clinical_hold_partial"
        | "inactive"
        | "withdrawn"
        | "terminated"
      ncd_config_scope: "system" | "tenant" | "user" | "project"
      notification_type:
        | "document_comment"
        | "task_assignment"
        | "deadline_reminder"
        | "system_alert"
      submission_role:
        | "reg_affairs_manager_lead"
        | "regulatory_writer_medical_writer"
        | "ectd_publishing_specialist"
        | "clinical_development_lead"
        | "medical_monitor"
        | "nonclinical_toxicology_lead"
        | "cmc_lead"
        | "quality_assurance"
        | "project_manager"
        | "data_manager_biostatistician"
        | "document_management_specialist"
        | "system_administrator"
      tenant_status: "active" | "inactive" | "hold"
      tenant_status_type: "active" | "inactive" | "pending"
      user_roles:
        | "regulatory_owner"
        | "admin"
        | "regulatory_writer_medical_writer"
        | "guest"
        | "qa_specialist"
        | "regulatory_reviewer"
        | "legal_reviewer"
        | "document_management_specialist"
      user_status: "pending" | "active" | "inactive" | "invited" | "suspended"
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
      comment_status: ["open", "resolved", "responded"],
      designation_status: [
        "not_applicable",
        "under_consideration",
        "requested",
        "granted",
        "denied",
        "withdrawn",
        "revoked",
      ],
      designation_type: [
        "fast_track",
        "breakthrough_therapy",
        "priority_review",
        "accelerated_approval",
      ],
      ind_status_type: [
        "draft",
        "pre_ind_meeting_requested",
        "pre_ind_meeting_completed",
        "submitted",
        "under_review",
        "active",
        "clinical_hold_complete",
        "clinical_hold_partial",
        "inactive",
        "withdrawn",
        "terminated",
      ],
      ncd_config_scope: ["system", "tenant", "user", "project"],
      notification_type: [
        "document_comment",
        "task_assignment",
        "deadline_reminder",
        "system_alert",
      ],
      submission_role: [
        "reg_affairs_manager_lead",
        "regulatory_writer_medical_writer",
        "ectd_publishing_specialist",
        "clinical_development_lead",
        "medical_monitor",
        "nonclinical_toxicology_lead",
        "cmc_lead",
        "quality_assurance",
        "project_manager",
        "data_manager_biostatistician",
        "document_management_specialist",
        "system_administrator",
      ],
      tenant_status: ["active", "inactive", "hold"],
      tenant_status_type: ["active", "inactive", "pending"],
      user_roles: [
        "regulatory_owner",
        "admin",
        "regulatory_writer_medical_writer",
        "guest",
        "qa_specialist",
        "regulatory_reviewer",
        "legal_reviewer",
        "document_management_specialist",
      ],
      user_status: ["pending", "active", "inactive", "invited", "suspended"],
    },
  },
} as const
