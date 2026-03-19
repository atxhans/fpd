// Auto-generated types placeholder — run `npx supabase gen types typescript` to regenerate
// This file provides TypeScript interfaces matching the DB schema

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          status: 'active' | 'trial' | 'suspended' | 'cancelled'
          plan: 'trial' | 'starter' | 'professional' | 'business' | 'enterprise'
          seat_limit: number | null
          contract_tier: string | null
          renewal_date: string | null
          onboarding_status: 'pending' | 'in_progress' | 'complete'
          website: string | null
          phone: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          zip: string | null
          country: string
          timezone: string
          logo_url: string | null
          primary_color: string | null
          internal_notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          name: string
          slug: string
          status?: 'active' | 'trial' | 'suspended' | 'cancelled'
          plan?: 'trial' | 'starter' | 'professional' | 'business' | 'enterprise'
          seat_limit?: number | null
          contract_tier?: string | null
          renewal_date?: string | null
          onboarding_status?: 'pending' | 'in_progress' | 'complete'
          website?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          country?: string
          timezone?: string
          logo_url?: string | null
          primary_color?: string | null
          internal_notes?: string | null
          metadata?: Json
          deleted_at?: string | null
        }
        Update: {
          name?: string
          slug?: string
          status?: 'active' | 'trial' | 'suspended' | 'cancelled'
          plan?: 'trial' | 'starter' | 'professional' | 'business' | 'enterprise'
          seat_limit?: number | null
          contract_tier?: string | null
          renewal_date?: string | null
          onboarding_status?: 'pending' | 'in_progress' | 'complete'
          website?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          country?: string
          timezone?: string
          logo_url?: string | null
          primary_color?: string | null
          internal_notes?: string | null
          metadata?: Json
          deleted_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          is_platform_user: boolean
          platform_role: string | null
          is_active: boolean
          last_sign_in_at: string | null
          metadata: Json
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_platform_user?: boolean
          platform_role?: string | null
          is_active?: boolean
          last_sign_in_at?: string | null
          metadata?: Json
          timezone?: string
        }
        Update: {
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_platform_user?: boolean
          platform_role?: string | null
          is_active?: boolean
          last_sign_in_at?: string | null
          metadata?: Json
          timezone?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: string
          is_active: boolean
          invited_by: string | null
          invited_at: string | null
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          user_id: string
          role: string
          is_active?: boolean
          invited_by?: string | null
          invited_at?: string | null
          accepted_at?: string | null
        }
        Update: {
          role?: string
          is_active?: boolean
          accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'memberships_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memberships_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          email: string | null
          phone: string | null
          customer_type: 'residential' | 'commercial' | 'industrial'
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          tenant_id: string
          name: string
          email?: string | null
          phone?: string | null
          customer_type?: 'residential' | 'commercial' | 'industrial'
          notes?: string | null
          metadata?: Json
          deleted_at?: string | null
        }
        Update: {
          name?: string
          email?: string | null
          phone?: string | null
          customer_type?: 'residential' | 'commercial' | 'industrial'
          notes?: string | null
          metadata?: Json
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'customers_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          }
        ]
      }
      sites: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          name: string
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          zip: string
          country: string
          latitude: number | null
          longitude: number | null
          site_type: 'residential' | 'commercial' | 'industrial'
          notes: string | null
          climate_zone: string | null
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          tenant_id: string
          customer_id: string
          name: string
          address_line1: string
          address_line2?: string | null
          city: string
          state: string
          zip: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          site_type?: 'residential' | 'commercial' | 'industrial'
          notes?: string | null
          climate_zone?: string | null
          metadata?: Json
          deleted_at?: string | null
        }
        Update: {
          name?: string
          address_line1?: string
          address_line2?: string | null
          city?: string
          state?: string
          zip?: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          site_type?: 'residential' | 'commercial' | 'industrial'
          notes?: string | null
          climate_zone?: string | null
          metadata?: Json
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sites_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sites_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      equipment: {
        Row: {
          id: string
          tenant_id: string
          site_id: string
          customer_id: string
          manufacturer: string
          model_number: string | null
          serial_number: string | null
          unit_name: string | null
          unit_type: string
          location: 'indoor' | 'outdoor' | 'both' | null
          refrigerant_type: string | null
          tonnage: number | null
          capacity_btu: number | null
          install_date: string | null
          warranty_expiry: string | null
          warranty_notes: string | null
          status: 'active' | 'retired' | 'decommissioned'
          notes: string | null
          metadata: Json
          ai_summary: Json | null
          ai_summary_generated_at: string | null
          health_score: number | null
          health_score_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          tenant_id: string
          site_id: string
          customer_id: string
          manufacturer: string
          model_number?: string | null
          serial_number?: string | null
          unit_name?: string | null
          unit_type: string
          location?: 'indoor' | 'outdoor' | 'both' | null
          refrigerant_type?: string | null
          tonnage?: number | null
          capacity_btu?: number | null
          install_date?: string | null
          warranty_expiry?: string | null
          warranty_notes?: string | null
          status?: 'active' | 'retired' | 'decommissioned'
          notes?: string | null
          metadata?: Json
          ai_summary?: Json | null
          ai_summary_generated_at?: string | null
          health_score?: number | null
          health_score_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          manufacturer?: string
          model_number?: string | null
          serial_number?: string | null
          unit_name?: string | null
          unit_type?: string
          location?: 'indoor' | 'outdoor' | 'both' | null
          refrigerant_type?: string | null
          tonnage?: number | null
          capacity_btu?: number | null
          install_date?: string | null
          warranty_expiry?: string | null
          warranty_notes?: string | null
          status?: 'active' | 'retired' | 'decommissioned'
          notes?: string | null
          metadata?: Json
          ai_summary?: Json | null
          ai_summary_generated_at?: string | null
          health_score?: number | null
          health_score_at?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'equipment_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'equipment_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          tenant_id: string
          job_number: string
          customer_id: string
          site_id: string
          assigned_technician_id: string | null
          created_by: string
          service_category: string
          priority: 'low' | 'normal' | 'high' | 'emergency'
          problem_description: string | null
          resolution_summary: string | null
          follow_up_required: boolean
          follow_up_notes: string | null
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          status: 'unassigned' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
          notes: string | null
          metadata: Json
          weather_snapshot: Json | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          tenant_id: string
          job_number: string
          customer_id: string
          site_id: string
          assigned_technician_id?: string | null
          created_by: string
          service_category: string
          priority?: 'low' | 'normal' | 'high' | 'emergency'
          problem_description?: string | null
          resolution_summary?: string | null
          follow_up_required?: boolean
          follow_up_notes?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          status?: 'unassigned' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
          notes?: string | null
          metadata?: Json
          weather_snapshot?: Json | null
          deleted_at?: string | null
        }
        Update: {
          assigned_technician_id?: string | null
          service_category?: string
          priority?: 'low' | 'normal' | 'high' | 'emergency'
          problem_description?: string | null
          resolution_summary?: string | null
          follow_up_required?: boolean
          follow_up_notes?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          status?: 'unassigned' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
          notes?: string | null
          metadata?: Json
          weather_snapshot?: Json | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'jobs_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'jobs_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          }
        ]
      }
      readings: {
        Row: {
          id: string
          tenant_id: string
          job_id: string
          equipment_id: string | null
          technician_id: string
          reading_type_id: string
          raw_value: Json | null
          value: number | null
          bool_value: boolean | null
          text_value: string | null
          unit: string | null
          refrigerant_type: string | null
          technician_notes: string | null
          is_flagged: boolean
          flag_reason: string | null
          source: 'manual' | 'device' | 'import' | 'api'
          device_id: string | null
          captured_at: string
          created_at: string
        }
        Insert: {
          tenant_id: string
          job_id: string
          equipment_id?: string | null
          technician_id: string
          reading_type_id: string
          raw_value?: Json | null
          value?: number | null
          bool_value?: boolean | null
          text_value?: string | null
          unit?: string | null
          refrigerant_type?: string | null
          technician_notes?: string | null
          is_flagged?: boolean
          flag_reason?: string | null
          source?: 'manual' | 'device' | 'import' | 'api'
          device_id?: string | null
          captured_at?: string
        }
        Update: {
          technician_notes?: string | null
          is_flagged?: boolean
          flag_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'readings_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          tenant_id: string | null
          actor_id: string | null
          actor_email: string | null
          impersonated_by: string | null
          impersonation_session_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          resource_label: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          tenant_id?: string | null
          actor_id?: string | null
          actor_email?: string | null
          impersonated_by?: string | null
          impersonation_session_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          resource_label?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      impersonation_sessions: {
        Row: {
          id: string
          initiated_by: string
          target_user_id: string
          target_tenant_id: string | null
          reason: string
          status: 'active' | 'ended'
          started_at: string
          ended_at: string | null
          ended_by: string | null
          metadata: Json
        }
        Insert: {
          initiated_by: string
          target_user_id: string
          target_tenant_id?: string | null
          reason: string
          status?: 'active' | 'ended'
          ended_at?: string | null
          ended_by?: string | null
          metadata?: Json
        }
        Update: {
          status?: 'active' | 'ended'
          ended_at?: string | null
          ended_by?: string | null
        }
        Relationships: []
      }
      platform_feature_flags: {
        Row: {
          id: string
          flag_key: string
          enabled: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          flag_key: string
          enabled: boolean
          description?: string | null
        }
        Update: {
          flag_key?: string
          enabled?: boolean
          description?: string | null
        }
        Relationships: []
      }
      tenant_feature_flags: {
        Row: {
          id: string
          tenant_id: string
          flag_key: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          flag_key: string
          enabled: boolean
        }
        Update: {
          tenant_id?: string
          flag_key?: string
          enabled?: boolean
        }
        Relationships: []
      }
      diagnostic_rules: {
        Row: {
          id: string
          rule_key: string
          name: string
          description: string | null
          severity: 'critical' | 'warning' | 'info'
          conditions: Json
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          rule_key: string
          name: string
          description?: string | null
          severity: 'critical' | 'warning' | 'info'
          conditions: Json
          enabled?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          severity?: 'critical' | 'warning' | 'info'
          conditions?: Json
          enabled?: boolean
        }
        Relationships: []
      }
      diagnostic_results: {
        Row: {
          id: string
          job_id: string
          tenant_id: string
          rule_key: string
          severity: 'critical' | 'warning' | 'info'
          message: string
          detail: string | null
          source: 'rules_engine' | 'ai'
          created_at: string
        }
        Insert: {
          job_id: string
          tenant_id: string
          rule_key: string
          severity: 'critical' | 'warning' | 'info'
          message: string
          detail?: string | null
          source: 'rules_engine' | 'ai'
        }
        Update: Record<string, never>
        Relationships: []
      }
      reading_types: {
        Row: {
          id: string
          key: string
          label: string
          unit: string
          category: string | null
          sort_order: number
          normal_min: number | null
          normal_max: number | null
          created_at: string
        }
        Insert: {
          key: string
          label: string
          unit: string
          category?: string | null
          sort_order?: number
          normal_min?: number | null
          normal_max?: number | null
        }
        Update: {
          key?: string
          label?: string
          unit?: string
          category?: string | null
          sort_order?: number
          normal_min?: number | null
          normal_max?: number | null
        }
        Relationships: []
      }
      support_cases: {
        Row: {
          id: string
          tenant_id: string
          reported_by: string | null
          assigned_to: string | null
          subject: string
          description: string | null
          page_url: string | null
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          reported_by?: string | null
          assigned_to?: string | null
          subject: string
          description?: string | null
          page_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
        }
        Update: {
          assigned_to?: string | null
          subject?: string
          description?: string | null
          page_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
        }
        Relationships: []
      }
      support_case_comments: {
        Row: {
          id: string
          case_id: string
          author_id: string
          body: string
          is_internal: boolean
          created_at: string
        }
        Insert: {
          case_id: string
          author_id: string
          body: string
          is_internal?: boolean
        }
        Update: {
          body?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          id: string
          tenant_id: string | null
          customer_id: string | null
          source: 'email' | 'web_form' | 'manual'
          contact_name: string | null
          contact_email: string
          contact_phone: string | null
          subject: string | null
          description: string | null
          address: string | null
          status: 'new' | 'acknowledged' | 'converted' | 'spam' | 'closed'
          job_id: string | null
          raw_payload: Json
          auto_response_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id?: string | null
          customer_id?: string | null
          source?: 'email' | 'web_form' | 'manual'
          contact_name?: string | null
          contact_email: string
          contact_phone?: string | null
          subject?: string | null
          description?: string | null
          address?: string | null
          status?: 'new' | 'acknowledged' | 'converted' | 'spam' | 'closed'
          job_id?: string | null
          raw_payload?: Json
          auto_response_sent_at?: string | null
        }
        Update: {
          tenant_id?: string | null
          customer_id?: string | null
          status?: 'new' | 'acknowledged' | 'converted' | 'spam' | 'closed'
          job_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          description?: string | null
          address?: string | null
          auto_response_sent_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          id: string
          tenant_id: string
          key: string
          subject: string
          html_body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          key: string
          subject?: string
          html_body?: string
        }
        Update: {
          subject?: string
          html_body?: string
        }
        Relationships: [
          {
            foreignKeyName: 'email_templates_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          }
        ]
      }
      api_keys: {
        Row: {
          id: string
          tenant_id: string
          key_hash: string
          label: string
          created_at: string
          last_used_at: string | null
          revoked_at: string | null
        }
        Insert: {
          tenant_id: string
          key_hash: string
          label?: string
        }
        Update: {
          label?: string
          last_used_at?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'api_keys_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          }
        ]
      }
      job_equipment: {
        Row: {
          id: string
          job_id: string
          equipment_id: string
          created_at: string
        }
        Insert: {
          job_id: string
          equipment_id: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'job_equipment_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_equipment_equipment_id_fkey'
            columns: ['equipment_id']
            isOneToOne: false
            referencedRelation: 'equipment'
            referencedColumns: ['id']
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          tenant_id: string
          job_id: string | null
          customer_id: string
          invoice_number: string
          status: 'draft' | 'sent' | 'paid' | 'void'
          line_items: Json
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          notes: string | null
          due_date: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          job_id?: string | null
          customer_id: string
          invoice_number: string
          status?: 'draft' | 'sent' | 'paid' | 'void'
          line_items?: Json
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          notes?: string | null
          due_date?: string | null
          paid_at?: string | null
        }
        Update: {
          status?: 'draft' | 'sent' | 'paid' | 'void'
          line_items?: Json
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          notes?: string | null
          due_date?: string | null
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'invoices_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      chat_conversations: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          assigned_agent_id: string | null
          status: 'open' | 'active' | 'closed'
          unread_by_agent: number
          unread_by_user: number
          last_message_at: string
          created_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          assigned_agent_id?: string | null
          status?: 'open' | 'active' | 'closed'
          unread_by_agent?: number
          unread_by_user?: number
          last_message_at?: string
          closed_at?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          status?: 'open' | 'active' | 'closed'
          unread_by_agent?: number
          unread_by_user?: number
          last_message_at?: string
          closed_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'chat_conversations_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'chat_conversations_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'chat_conversations_assigned_agent_id_fkey'; columns: ['assigned_agent_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          sender_role: 'user' | 'agent'
          body: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          sender_role: 'user' | 'agent'
          body: string
          read_at?: string | null
        }
        Update: {
          read_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'chat_messages_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'chat_conversations'; referencedColumns: ['id'] },
          { foreignKeyName: 'chat_messages_sender_id_fkey'; columns: ['sender_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
        }
        Update: {
          p256dh?: string
          auth?: string
        }
        Relationships: [
          { foreignKeyName: 'push_subscriptions_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
