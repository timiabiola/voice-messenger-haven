export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          last_request: string
          request_count: number
          user_id: string
        }
        Insert: {
          last_request?: string
          request_count?: number
          user_id: string
        }
        Update: {
          last_request?: string
          request_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          title: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          title: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      contact_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          avatar_url: string | null
          category: string | null
          created_at: string | null
          email: string | null
          id: string
          last_seen: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["contact_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_seen?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_seen?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contacts_groups: {
        Row: {
          contact_id: string
          created_at: string
          group_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          group_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_groups_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_alerts: {
        Row: {
          alert_name: string
          condition: string
          created_at: string | null
          message_template: string
        }
        Insert: {
          alert_name: string
          condition: string
          created_at?: string | null
          message_template: string
        }
        Update: {
          alert_name?: string
          condition?: string
          created_at?: string | null
          message_template?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_folder_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      load_test_results: {
        Row: {
          config: Json
          created_at: string | null
          end_time: string | null
          error_message: string | null
          id: string
          rate_limits: Json | null
          start_time: string
          status: Database["public"]["Enums"]["test_status"] | null
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          rate_limits?: Json | null
          start_time: string
          status?: Database["public"]["Enums"]["test_status"] | null
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          rate_limits?: Json | null
          start_time?: string
          status?: Database["public"]["Enums"]["test_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          category: string
          content: string | null
          created_at: string | null
          delivery_attempts: number | null
          error_code: string | null
          error_message: string | null
          id: string
          is_received: boolean | null
          is_selected: boolean | null
          is_sent: boolean | null
          last_delivery_attempt: string | null
          next_category: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string | null
          delivery_attempts?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          is_received?: boolean | null
          is_selected?: boolean | null
          is_sent?: boolean | null
          last_delivery_attempt?: string | null
          next_category?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string | null
          delivery_attempts?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          is_received?: boolean | null
          is_selected?: boolean | null
          is_sent?: boolean | null
          last_delivery_attempt?: string | null
          next_category?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_test: {
        Row: {
          category: string
          content: string | null
          created_at: string | null
          delivery_attempts: number | null
          error_code: string | null
          error_message: string | null
          id: string
          is_received: boolean | null
          is_selected: boolean | null
          is_sent: boolean | null
          last_delivery_attempt: string | null
          next_category: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string | null
          delivery_attempts?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          is_received?: boolean | null
          is_selected?: boolean | null
          is_sent?: boolean | null
          last_delivery_attempt?: string | null
          next_category?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string | null
          delivery_attempts?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          is_received?: boolean | null
          is_selected?: boolean | null
          is_sent?: boolean | null
          last_delivery_attempt?: string | null
          next_category?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      note_tag_relations: {
        Row: {
          created_at: string | null
          note_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          note_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tag_relations_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "note_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      note_tags_relations: {
        Row: {
          created_at: string
          note_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_relations_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "note_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          audio_url: string | null
          content: string | null
          created_at: string
          duration: number | null
          folder_id: string | null
          id: string
          title: string
          transcription: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          created_at?: string
          duration?: number | null
          folder_id?: string | null
          id?: string
          title: string
          transcription?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          created_at?: string
          duration?: number | null
          folder_id?: string | null
          id?: string
          title?: string
          transcription?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rls_debug_log: {
        Row: {
          created_at: string | null
          id: string
          operation: string | null
          policy_name: string | null
          table_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          operation?: string | null
          policy_name?: string | null
          table_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          operation?: string | null
          policy_name?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          category: string
          content: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_flagged: boolean | null
          is_read: boolean | null
          sender_id: string | null
          tag: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean | null
          sender_id?: string | null
          tag?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean | null
          sender_id?: string | null
          tag?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_saved_items_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items_tags: {
        Row: {
          created_at: string
          saved_item_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          saved_item_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          saved_item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_tags_saved_item_id_fkey"
            columns: ["saved_item_id"]
            isOneToOne: false
            referencedRelation: "saved_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_items_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      stat_refresh_logs: {
        Row: {
          error_message: string | null
          id: number
          refresh_completed_at: string | null
          refresh_started_at: string | null
          success: boolean | null
        }
        Insert: {
          error_message?: string | null
          id?: number
          refresh_completed_at?: string | null
          refresh_started_at?: string | null
          success?: boolean | null
        }
        Update: {
          error_message?: string | null
          id?: number
          refresh_completed_at?: string | null
          refresh_started_at?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      twilio_error_mapping: {
        Row: {
          category: Database["public"]["Enums"]["delivery_error_category"]
          created_at: string | null
          description: string | null
          error_code: string
          retry_strategy: Database["public"]["Enums"]["retry_strategy"]
        }
        Insert: {
          category: Database["public"]["Enums"]["delivery_error_category"]
          created_at?: string | null
          description?: string | null
          error_code: string
          retry_strategy: Database["public"]["Enums"]["retry_strategy"]
        }
        Update: {
          category?: Database["public"]["Enums"]["delivery_error_category"]
          created_at?: string | null
          description?: string | null
          error_code?: string
          retry_strategy?: Database["public"]["Enums"]["retry_strategy"]
        }
        Relationships: []
      }
      twilio_message_logs: {
        Row: {
          attempt: number
          created_at: string | null
          error_category:
            | Database["public"]["Enums"]["delivery_error_category"]
            | null
          error_code: string | null
          error_message: string | null
          id: string
          message_id: string | null
          next_retry: string | null
          retry_count: number
          retryable: boolean
          status: string | null
          twilio_sid: string | null
          updated_at: string | null
          voice_message_id: string | null
        }
        Insert: {
          attempt?: number
          created_at?: string | null
          error_category?:
            | Database["public"]["Enums"]["delivery_error_category"]
            | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          next_retry?: string | null
          retry_count?: number
          retryable?: boolean
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string | null
          voice_message_id?: string | null
        }
        Update: {
          attempt?: number
          created_at?: string | null
          error_category?:
            | Database["public"]["Enums"]["delivery_error_category"]
            | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          next_retry?: string | null
          retry_count?: number
          retryable?: boolean
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string | null
          voice_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_message_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_lifecycle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twilio_message_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twilio_message_logs_voice_message_id_fkey"
            columns: ["voice_message_id"]
            isOneToOne: false
            referencedRelation: "voice_messages"
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
      voice_message_recipients: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          recipient_id: string
          sender_id: string | null
          voice_message_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          recipient_id: string
          sender_id?: string | null
          voice_message_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          recipient_id?: string
          sender_id?: string | null
          voice_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_message_recipients_test_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_message_recipients_test_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_message_recipients_test_voice_message_id_fkey"
            columns: ["voice_message_id"]
            isOneToOne: false
            referencedRelation: "voice_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_message_recipients_minimal: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          recipient_id: string
          sender_id: string | null
          voice_message_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          recipient_id: string
          sender_id?: string | null
          voice_message_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          recipient_id?: string
          sender_id?: string | null
          voice_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vmr_minimal_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vmr_minimal_voice_message_id_fkey"
            columns: ["voice_message_id"]
            isOneToOne: false
            referencedRelation: "voice_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_messages: {
        Row: {
          audio_url: string
          created_at: string
          duration: number
          id: string
          is_private: boolean | null
          is_urgent: boolean | null
          phone_number: string | null
          sender: Json | null
          sender_id: string | null
          subject: string | null
          title: string | null
          twilio_sid: string | null
          twilio_status: string | null
          updated_at: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          duration: number
          id?: string
          is_private?: boolean | null
          is_urgent?: boolean | null
          phone_number?: string | null
          sender?: Json | null
          sender_id?: string | null
          subject?: string | null
          title?: string | null
          twilio_sid?: string | null
          twilio_status?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          duration?: number
          id?: string
          is_private?: boolean | null
          is_urgent?: boolean | null
          phone_number?: string | null
          sender?: Json | null
          sender_id?: string | null
          subject?: string | null
          title?: string | null
          twilio_sid?: string | null
          twilio_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_voice_messages_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_recordings: {
        Row: {
          audio_chunks: Json[] | null
          created_at: string | null
          id: string
          recording_time: number
          status: Database["public"]["Enums"]["recording_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          audio_chunks?: Json[] | null
          created_at?: string | null
          id?: string
          recording_time?: number
          status?: Database["public"]["Enums"]["recording_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          audio_chunks?: Json[] | null
          created_at?: string | null
          id?: string
          recording_time?: number
          status?: Database["public"]["Enums"]["recording_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      message_delivery_stats: {
        Row: {
          avg_delivery_time_seconds: number | null
          avg_retries: number | null
          error_category:
            | Database["public"]["Enums"]["delivery_error_category"]
            | null
          retried_messages: number | null
          status: string | null
          total_messages: number | null
        }
        Relationships: []
      }
      message_lifecycle: {
        Row: {
          delivery_status: string | null
          error_category:
            | Database["public"]["Enums"]["delivery_error_category"]
            | null
          id: string | null
          last_status_change: string | null
          message_status: string | null
          retry_count: number | null
          retry_strategy: Database["public"]["Enums"]["retry_strategy"] | null
          sent_time: string | null
        }
        Relationships: []
      }
      retry_effectiveness: {
        Row: {
          initial_error_category:
            | Database["public"]["Enums"]["delivery_error_category"]
            | null
          success_rate: number | null
          successful_retries: number | null
          total_retries: number | null
        }
        Relationships: []
      }
      rls_log_admin_view: {
        Row: {
          created_at: string | null
          id: string | null
          operation: string | null
          policy_name: string | null
          table_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          operation?: string | null
          policy_name?: string | null
          table_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          operation?: string | null
          policy_name?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      stat_refresh_performance: {
        Row: {
          avg_refresh_time_seconds: number | null
          failed_refreshes: number | null
          max_refresh_time_seconds: number | null
          refresh_date: string | null
          successful_refreshes: number | null
          total_refreshes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      emergency_pause_retries: {
        Args: {
          error_cat: Database["public"]["Enums"]["delivery_error_category"]
        }
        Returns: undefined
      }
      get_sender_profile: {
        Args: { sender_id: string }
        Returns: Json
      }
      has_role: {
        Args:
          | { role_to_check: string }
          | { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      safe_recipient_insert: {
        Args: { message_id: string; recipient_id: string; sender_id: string }
        Returns: undefined
      }
      toggle_message_selection: {
        Args: { message_id: string }
        Returns: {
          category: string
          content: string | null
          created_at: string | null
          delivery_attempts: number | null
          error_code: string | null
          error_message: string | null
          id: string
          is_received: boolean | null
          is_selected: boolean | null
          is_sent: boolean | null
          last_delivery_attempt: string | null
          next_category: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      contact_status: "online" | "offline" | "away"
      delivery_error_category:
        | "network"
        | "recipient"
        | "content"
        | "quota"
        | "unknown"
      error_category: "network" | "recipient" | "content" | "quota" | "unknown"
      message_category: "new" | "inbox" | "saved" | "trash"
      message_status: "read" | "unread"
      recording_status: "in_progress" | "paused" | "completed"
      retry_strategy: "immediate" | "linear_backoff" | "exponential_backoff"
      saved_item_category: "smart" | "personal" | "sender"
      test_status: "running" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      contact_status: ["online", "offline", "away"],
      delivery_error_category: [
        "network",
        "recipient",
        "content",
        "quota",
        "unknown",
      ],
      error_category: ["network", "recipient", "content", "quota", "unknown"],
      message_category: ["new", "inbox", "saved", "trash"],
      message_status: ["read", "unread"],
      recording_status: ["in_progress", "paused", "completed"],
      retry_strategy: ["immediate", "linear_backoff", "exponential_backoff"],
      saved_item_category: ["smart", "personal", "sender"],
      test_status: ["running", "completed", "failed"],
    },
  },
} as const
