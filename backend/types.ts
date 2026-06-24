/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

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
      activity_log: {
        Row: {
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      agent_metrics: {
        Row: {
          agent_id: string | null
          agent_name: string
          cost_usd: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_tokens: number | null
          metadata: Json | null
          model_used: string
          outcome_score: number | null
          output_tokens: number | null
          success: boolean | null
          task_id: string | null
          total_tokens: number | null
        }
        Insert: {
          agent_id?: string | null
          agent_name: string
          cost_usd?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model_used: string
          outcome_score?: number | null
          output_tokens?: number | null
          success?: boolean | null
          task_id?: string | null
          total_tokens?: number | null
        }
        Update: {
          agent_id?: string | null
          agent_name?: string
          cost_usd?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model_used?: string
          outcome_score?: number | null
          output_tokens?: number | null
          success?: boolean | null
          task_id?: string | null
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_performance_logs: {
        Row: {
          agent_name: string
          created_at: string | null
          decision: string | null
          id: string
          latency_ms: number | null
          metadata: Json | null
          prompt_variant: string
          reasoning: string | null
          scenario: Json
          score: number | null
          user_id: string | null
        }
        Insert: {
          agent_name: string
          created_at?: string | null
          decision?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          prompt_variant?: string
          reasoning?: string | null
          scenario: Json
          score?: number | null
          user_id?: string | null
        }
        Update: {
          agent_name?: string
          created_at?: string | null
          decision?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          prompt_variant?: string
          reasoning?: string | null
          scenario?: Json
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_task_log: {
        Row: {
          ab_test_id: string | null
          ab_variant: string | null
          agent_name: string
          cost_usd: number
          created_at: string | null
          execution_time_ms: number | null
          id: string
          input_preview: string | null
          input_tokens: number
          metadata: Json | null
          model_used: string
          outcome_collected_at: string | null
          outcome_data: Json | null
          outcome_score: number | null
          outcome_source: string | null
          output_preview: string | null
          output_tokens: number
          output_word_count: number | null
          parent_task_id: string | null
          pipeline_final_score: number | null
          pipeline_id: string | null
          pipeline_position: number | null
          prompt_version: string
          run_timestamp: string
          task_id: string
          task_type: string
        }
        Insert: {
          ab_test_id?: string | null
          ab_variant?: string | null
          agent_name: string
          cost_usd?: number
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          input_preview?: string | null
          input_tokens?: number
          metadata?: Json | null
          model_used: string
          outcome_collected_at?: string | null
          outcome_data?: Json | null
          outcome_score?: number | null
          outcome_source?: string | null
          output_preview?: string | null
          output_tokens?: number
          output_word_count?: number | null
          parent_task_id?: string | null
          pipeline_final_score?: number | null
          pipeline_id?: string | null
          pipeline_position?: number | null
          prompt_version: string
          run_timestamp?: string
          task_id: string
          task_type?: string
        }
        Update: {
          ab_test_id?: string | null
          ab_variant?: string | null
          agent_name?: string
          cost_usd?: number
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          input_preview?: string | null
          input_tokens?: number
          metadata?: Json | null
          model_used?: string
          outcome_collected_at?: string | null
          outcome_data?: Json | null
          outcome_score?: number | null
          outcome_source?: string | null
          output_preview?: string | null
          output_tokens?: number
          output_word_count?: number | null
          parent_task_id?: string | null
          pipeline_final_score?: number | null
          pipeline_id?: string | null
          pipeline_position?: number | null
          prompt_version?: string
          run_timestamp?: string
          task_id?: string
          task_type?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          avg_outcome_score: number | null
          capabilities: string[] | null
          created_at: string | null
          current_task_id: string | null
          heartbeat_at: string | null
          id: string
          instructions: string | null
          model: string | null
          name: string
          openclaw_agent_id: string | null
          project_id: string | null
          role: string
          skills: string[] | null
          source: string
          status: string
          total_cost_usd: number | null
          total_runs: number | null
          updated_at: string | null
        }
        Insert: {
          avg_outcome_score?: number | null
          capabilities?: string[] | null
          created_at?: string | null
          current_task_id?: string | null
          heartbeat_at?: string | null
          id?: string
          instructions?: string | null
          model?: string | null
          name: string
          openclaw_agent_id?: string | null
          project_id?: string | null
          role: string
          skills?: string[] | null
          source?: string
          status?: string
          total_cost_usd?: number | null
          total_runs?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_outcome_score?: number | null
          capabilities?: string[] | null
          created_at?: string | null
          current_task_id?: string | null
          heartbeat_at?: string | null
          id?: string
          instructions?: string | null
          model?: string | null
          name?: string
          openclaw_agent_id?: string | null
          project_id?: string | null
          role?: string
          skills?: string[] | null
          source?: string
          status?: string
          total_cost_usd?: number | null
          total_runs?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feature_definitions: {
        Row: {
          category: string
          cost_per_use_usd: number
          cost_unit: string
          created_at: string | null
          default_budget_usd: number
          description: string
          display_name: string
          feature_key: string
          is_available: boolean
        }
        Insert: {
          category: string
          cost_per_use_usd?: number
          cost_unit?: string
          created_at?: string | null
          default_budget_usd?: number
          description: string
          display_name: string
          feature_key: string
          is_available?: boolean
        }
        Update: {
          category?: string
          cost_per_use_usd?: number
          cost_unit?: string
          created_at?: string | null
          default_budget_usd?: number
          description?: string
          display_name?: string
          feature_key?: string
          is_available?: boolean
        }
        Relationships: []
      }
      ai_feature_flags: {
        Row: {
          alert_threshold_pct: number
          created_at: string | null
          enabled: boolean
          feature_key: string
          id: string
          monthly_budget_usd: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold_pct?: number
          created_at?: string | null
          enabled?: boolean
          feature_key: string
          id?: string
          monthly_budget_usd?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold_pct?: number
          created_at?: string | null
          enabled?: boolean
          feature_key?: string
          id?: string
          monthly_budget_usd?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feature_flags_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "ai_feature_definitions"
            referencedColumns: ["feature_key"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          cost_usd: number
          created_at: string | null
          feature_key: string
          id: string
          latency_ms: number | null
          metadata: Json | null
          operation: string | null
          simulation_id: string | null
          strategy: string | null
          symbol: string | null
          tokens_in: number | null
          tokens_out: number | null
          tokens_used: number | null
          trade_id: string | null
          user_id: string
        }
        Insert: {
          cost_usd?: number
          created_at?: string | null
          feature_key: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          operation?: string | null
          simulation_id?: string | null
          strategy?: string | null
          symbol?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          tokens_used?: number | null
          trade_id?: string | null
          user_id: string
        }
        Update: {
          cost_usd?: number
          created_at?: string | null
          feature_key?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          operation?: string | null
          simulation_id?: string | null
          strategy?: string | null
          symbol?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          tokens_used?: number | null
          trade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "ai_feature_definitions"
            referencedColumns: ["feature_key"]
          },
        ]
      }
      alerts: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string | null
          project_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          project_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          project_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          settings_json: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings_json?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          settings_json?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      approved_brands: {
        Row: {
          brand_name: string
          coverage_tier: string | null
          created_at: string
          db_version: number
          expansion_notes: string | null
          id: string
          source_evidence_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          brand_name: string
          coverage_tier?: string | null
          created_at?: string
          db_version?: number
          expansion_notes?: string | null
          id?: string
          source_evidence_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          brand_name?: string
          coverage_tier?: string | null
          created_at?: string
          db_version?: number
          expansion_notes?: string | null
          id?: string
          source_evidence_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      approved_products: {
        Row: {
          actives_positioning: string | null
          affiliate_potential: string | null
          avoid_caution_logic: string | null
          best_skin_findings: string[]
          best_skin_types: string[]
          brand_id: string
          created_at: string
          db_version: number
          exclusion_flags: string[]
          finding_tags: string[]
          id: string
          notes: string | null
          priority: number
          product_name: string
          product_type: string | null
          recommendation_category_id: string | null
          recommendation_logic: string | null
          routine_slot: string | null
          source_url: string | null
          updated_at: string
          verification_level: string
          when_to_use: string | null
        }
        Insert: {
          actives_positioning?: string | null
          affiliate_potential?: string | null
          avoid_caution_logic?: string | null
          best_skin_findings?: string[]
          best_skin_types?: string[]
          brand_id: string
          created_at?: string
          db_version?: number
          exclusion_flags?: string[]
          finding_tags?: string[]
          id?: string
          notes?: string | null
          priority?: number
          product_name: string
          product_type?: string | null
          recommendation_category_id?: string | null
          recommendation_logic?: string | null
          routine_slot?: string | null
          source_url?: string | null
          updated_at?: string
          verification_level?: string
          when_to_use?: string | null
        }
        Update: {
          actives_positioning?: string | null
          affiliate_potential?: string | null
          avoid_caution_logic?: string | null
          best_skin_findings?: string[]
          best_skin_types?: string[]
          brand_id?: string
          created_at?: string
          db_version?: number
          exclusion_flags?: string[]
          finding_tags?: string[]
          id?: string
          notes?: string | null
          priority?: number
          product_name?: string
          product_type?: string | null
          recommendation_category_id?: string | null
          recommendation_logic?: string | null
          routine_slot?: string | null
          source_url?: string | null
          updated_at?: string
          verification_level?: string
          when_to_use?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "approved_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_products_recommendation_category_id_fkey"
            columns: ["recommendation_category_id"]
            isOneToOne: false
            referencedRelation: "recommendation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ask_conversations: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ask_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ask_memory: {
        Row: {
          fact: string
          id: string
          salience: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          fact: string
          id?: string
          salience?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          fact?: string
          id?: string
          salience?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ask_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ask_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          systems_referenced: string[] | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          systems_referenced?: string[] | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          systems_referenced?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ask_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ask_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          category: string
          created_at: string | null
          current_value: number
          id: string
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          quantity: number | null
          symbol: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          current_value?: number
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          symbol?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          current_value?: number
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          symbol?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audio_assets: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          final_mix_url: string | null
          id: string
          music_track_id: string | null
          session_id: string
          status: string
          tts_audio_url: string | null
          voice_id: string | null
          voice_provider: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          final_mix_url?: string | null
          id?: string
          music_track_id?: string | null
          session_id: string
          status?: string
          tts_audio_url?: string | null
          voice_id?: string | null
          voice_provider?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          final_mix_url?: string | null
          id?: string
          music_track_id?: string | null
          session_id?: string
          status?: string
          tts_audio_url?: string | null
          voice_id?: string | null
          voice_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_assets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          agent_name: string
          block_reason: string | null
          created_at: string | null
          decided_at: string | null
          decision: string | null
          duration_ms: number | null
          edge_type: string | null
          id: string
          kronos_pass: boolean | null
          kronos_used: boolean
          metadata: Json | null
          mirofish_score: number | null
          mirofish_used: boolean
          output: Json | null
          red_team_score: number | null
          size_fraction: number | null
          strategy_key: string | null
          symbol: string | null
          trade_context: Json | null
          user_id: string | null
        }
        Insert: {
          agent_name?: string
          block_reason?: string | null
          created_at?: string | null
          decided_at?: string | null
          decision?: string | null
          duration_ms?: number | null
          edge_type?: string | null
          id?: string
          kronos_pass?: boolean | null
          kronos_used?: boolean
          metadata?: Json | null
          mirofish_score?: number | null
          mirofish_used?: boolean
          output?: Json | null
          red_team_score?: number | null
          size_fraction?: number | null
          strategy_key?: string | null
          symbol?: string | null
          trade_context?: Json | null
          user_id?: string | null
        }
        Update: {
          agent_name?: string
          block_reason?: string | null
          created_at?: string | null
          decided_at?: string | null
          decision?: string | null
          duration_ms?: number | null
          edge_type?: string | null
          id?: string
          kronos_pass?: boolean | null
          kronos_used?: boolean
          metadata?: Json | null
          mirofish_score?: number | null
          mirofish_used?: boolean
          output?: Json | null
          red_team_score?: number | null
          size_fraction?: number | null
          strategy_key?: string | null
          symbol?: string | null
          trade_context?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      bayesian_updates: {
        Row: {
          id: string
          likelihood: number | null
          market_id: string | null
          posterior_prob: number | null
          prior_prob: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          likelihood?: number | null
          market_id?: string | null
          posterior_prob?: number | null
          prior_prob?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          likelihood?: number | null
          market_id?: string | null
          posterior_prob?: number | null
          prior_prob?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bayesian_updates_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      birth_profiles: {
        Row: {
          birth_date: string
          birth_place_label: string | null
          birth_time: string | null
          created_at: string | null
          full_birth_name: string | null
          house_system: string | null
          id: string
          lat: number | null
          lng: number | null
          time_known: boolean
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birth_date: string
          birth_place_label?: string | null
          birth_time?: string | null
          created_at?: string | null
          full_birth_name?: string | null
          house_system?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          time_known?: boolean
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string
          birth_place_label?: string | null
          birth_time?: string | null
          created_at?: string | null
          full_birth_name?: string | null
          house_system?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          time_known?: boolean
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "birth_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          article_id: string | null
          created_at: string | null
          id: string
          published_at: string | null
          site_id: string | null
          title: string | null
          url: string | null
          wordpress_post_id: number | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          published_at?: string | null
          site_id?: string | null
          title?: string | null
          url?: string | null
          wordpress_post_id?: number | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          published_at?: string | null
          site_id?: string | null
          title?: string | null
          url?: string | null
          wordpress_post_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "mc_seo_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "seo_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprints: {
        Row: {
          astrology: Json | null
          biorhythm_seed: Json | null
          chinese: Json | null
          computed_at: string | null
          human_design: Json | null
          id: string
          numerology: Json | null
          user_id: string
        }
        Insert: {
          astrology?: Json | null
          biorhythm_seed?: Json | null
          chinese?: Json | null
          computed_at?: string | null
          human_design?: Json | null
          id?: string
          numerology?: Json | null
          user_id: string
        }
        Update: {
          astrology?: Json | null
          biorhythm_seed?: Json | null
          chinese?: Json | null
          computed_at?: string | null
          human_design?: Json | null
          id?: string
          numerology?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bond_readings: {
        Row: {
          flow_grow: Json | null
          generated_at: string | null
          id: string
          link_id: string
          reading_date: string
          shared_weather: Json | null
          together_text: string
        }
        Insert: {
          flow_grow?: Json | null
          generated_at?: string | null
          id?: string
          link_id: string
          reading_date: string
          shared_weather?: Json | null
          together_text: string
        }
        Update: {
          flow_grow?: Json | null
          generated_at?: string | null
          id?: string
          link_id?: string
          reading_date?: string
          shared_weather?: Json | null
          together_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "bond_readings_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_config: {
        Row: {
          id: string
          parameter_name: string | null
          parameter_value: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          parameter_name?: string | null
          parameter_value?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          parameter_name?: string | null
          parameter_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          created_at: string | null
          id: string
          month: string
          monthly_limit: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          month: string
          monthly_limit: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          month?: string
          monthly_limit?: number
          user_id?: string
        }
        Relationships: []
      }
      cashclaw_client_profiles: {
        Row: {
          cashclaw_id: string | null
          created_at: string | null
          credits_available: number | null
          credits_spent: number | null
          id: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          cashclaw_id?: string | null
          created_at?: string | null
          credits_available?: number | null
          credits_spent?: number | null
          id?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cashclaw_id?: string | null
          created_at?: string | null
          credits_available?: number | null
          credits_spent?: number | null
          id?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashclaw_client_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cashclaw_daily_earnings: {
        Row: {
          avg_outcome_score: number | null
          avg_rating: number | null
          date: string
          tasks_completed: number | null
          tasks_declined: number | null
          tasks_failed: number | null
          total_earned_eth: number | null
          total_quoted_eth: number | null
          total_tokens: number | null
          unique_clients: number | null
          updated_at: string | null
        }
        Insert: {
          avg_outcome_score?: number | null
          avg_rating?: number | null
          date?: string
          tasks_completed?: number | null
          tasks_declined?: number | null
          tasks_failed?: number | null
          total_earned_eth?: number | null
          total_quoted_eth?: number | null
          total_tokens?: number | null
          unique_clients?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_outcome_score?: number | null
          avg_rating?: number | null
          date?: string
          tasks_completed?: number | null
          tasks_declined?: number | null
          tasks_failed?: number | null
          total_earned_eth?: number | null
          total_quoted_eth?: number | null
          total_tokens?: number | null
          unique_clients?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cashclaw_negative_examples: {
        Row: {
          category: string | null
          created_at: string | null
          failure_annotation: string | null
          failure_description: string
          id: string
          injected_into_prompt: boolean | null
          is_active: boolean | null
          outcome_score: number | null
          prompt_version_injected: string | null
          task_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          failure_annotation?: string | null
          failure_description?: string
          id?: string
          injected_into_prompt?: boolean | null
          is_active?: boolean | null
          outcome_score?: number | null
          prompt_version_injected?: string | null
          task_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          failure_annotation?: string | null
          failure_description?: string
          id?: string
          injected_into_prompt?: boolean | null
          is_active?: boolean | null
          outcome_score?: number | null
          prompt_version_injected?: string | null
          task_id?: string
        }
        Relationships: []
      }
      cashclaw_pricing_records: {
        Row: {
          base_cost: number | null
          created_at: string | null
          id: string
          max_cost: number | null
          min_cost: number | null
          task_type: string | null
        }
        Insert: {
          base_cost?: number | null
          created_at?: string | null
          id?: string
          max_cost?: number | null
          min_cost?: number | null
          task_type?: string | null
        }
        Update: {
          base_cost?: number | null
          created_at?: string | null
          id?: string
          max_cost?: number | null
          min_cost?: number | null
          task_type?: string | null
        }
        Relationships: []
      }
      cashclaw_task_runs: {
        Row: {
          completed_at: string | null
          cost_credits: number | null
          created_at: string | null
          id: string
          result: Json | null
          started_at: string | null
          status: string | null
          task_id: string | null
          worker_id: string | null
        }
        Insert: {
          completed_at?: string | null
          cost_credits?: number | null
          created_at?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string | null
          task_id?: string | null
          worker_id?: string | null
        }
        Update: {
          completed_at?: string | null
          cost_credits?: number | null
          created_at?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string | null
          task_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashclaw_task_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      cashclaw_worker_stats: {
        Row: {
          avg_quality_score: number | null
          created_at: string | null
          id: string
          success_rate: number | null
          tasks_completed: number | null
          updated_at: string | null
          worker_id: string | null
        }
        Insert: {
          avg_quality_score?: number | null
          created_at?: string | null
          id?: string
          success_rate?: number | null
          tasks_completed?: number | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Update: {
          avg_quality_score?: number | null
          created_at?: string | null
          id?: string
          success_rate?: number | null
          tasks_completed?: number | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: []
      }
      cex_latency_arb_paper_trades: {
        Row: {
          detected_at: string
          entry_spread_bps: number
          executed_at: string | null
          exit_reason: string | null
          exit_spread_bps: number | null
          exited_at: string | null
          id: string
          leg_risk_event: boolean | null
          long_venue: string
          metadata: Json | null
          notional_usd: number
          pnl_bps: number | null
          pnl_usd: number | null
          short_venue: string
          symbol: string
        }
        Insert: {
          detected_at: string
          entry_spread_bps: number
          executed_at?: string | null
          exit_reason?: string | null
          exit_spread_bps?: number | null
          exited_at?: string | null
          id?: string
          leg_risk_event?: boolean | null
          long_venue: string
          metadata?: Json | null
          notional_usd: number
          pnl_bps?: number | null
          pnl_usd?: number | null
          short_venue: string
          symbol: string
        }
        Update: {
          detected_at?: string
          entry_spread_bps?: number
          executed_at?: string | null
          exit_reason?: string | null
          exit_spread_bps?: number | null
          exited_at?: string | null
          id?: string
          leg_risk_event?: boolean | null
          long_venue?: string
          metadata?: Json | null
          notional_usd?: number
          pnl_bps?: number | null
          pnl_usd?: number | null
          short_venue?: string
          symbol?: string
        }
        Relationships: []
      }
      clinic_alert_events: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          acknowledgment_notes: string | null
          clinician_id: string
          created_at: string | null
          id: string
          message: string
          patient_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          rule_id: string | null
          severity: string
          snoozed_until: string | null
          status: string | null
          title: string
          trigger_data: Json | null
          trigger_type: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledgment_notes?: string | null
          clinician_id: string
          created_at?: string | null
          id?: string
          message: string
          patient_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string | null
          severity: string
          snoozed_until?: string | null
          status?: string | null
          title: string
          trigger_data?: Json | null
          trigger_type: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledgment_notes?: string | null
          clinician_id?: string
          created_at?: string | null
          id?: string
          message?: string
          patient_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string | null
          severity?: string
          snoozed_until?: string | null
          status?: string | null
          title?: string
          trigger_data?: Json | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_alert_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_alert_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "clinic_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_alert_rules: {
        Row: {
          category: string
          clinician_id: string
          condition: Json
          created_at: string | null
          created_by: string | null
          dedupe_window_minutes: number | null
          description: string | null
          id: string
          is_enabled: boolean | null
          name: string
          notify_channels: string[] | null
          notify_roles: string[] | null
          patient_id: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          scope: string
          severity: string
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          category: string
          clinician_id: string
          condition?: Json
          created_at?: string | null
          created_by?: string | null
          dedupe_window_minutes?: number | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          notify_channels?: string[] | null
          notify_roles?: string[] | null
          patient_id?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          scope: string
          severity: string
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          clinician_id?: string
          condition?: Json
          created_at?: string | null
          created_by?: string | null
          dedupe_window_minutes?: number | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          notify_channels?: string[] | null
          notify_roles?: string[] | null
          patient_id?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          scope?: string
          severity?: string
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_alert_rules_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_biometric_readings: {
        Row: {
          biometric_type_id: string
          clinician_id: string
          context: string | null
          created_at: string | null
          device_name: string | null
          id: string
          notes: string | null
          patient_id: string
          reading_time: string
          source: string | null
          status: string
          unit: string
          value: number
        }
        Insert: {
          biometric_type_id: string
          clinician_id: string
          context?: string | null
          created_at?: string | null
          device_name?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reading_time: string
          source?: string | null
          status: string
          unit: string
          value: number
        }
        Update: {
          biometric_type_id?: string
          clinician_id?: string
          context?: string | null
          created_at?: string | null
          device_name?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reading_time?: string
          source?: string | null
          status?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_biometric_readings_biometric_type_id_fkey"
            columns: ["biometric_type_id"]
            isOneToOne: false
            referencedRelation: "clinic_biometric_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_biometric_readings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_biometric_types: {
        Row: {
          category: string
          code: string
          created_at: string | null
          critical_high: number | null
          critical_low: number | null
          id: string
          is_active: boolean | null
          name: string
          normal_high: number | null
          normal_low: number | null
          unit: string
          warning_high: number | null
          warning_low: number | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          critical_high?: number | null
          critical_low?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          normal_high?: number | null
          normal_low?: number | null
          unit: string
          warning_high?: number | null
          warning_low?: number | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          critical_high?: number | null
          critical_low?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          normal_high?: number | null
          normal_low?: number | null
          unit?: string
          warning_high?: number | null
          warning_low?: number | null
        }
        Relationships: []
      }
      clinic_health_histories: {
        Row: {
          alcohol_use: string | null
          allergies: Json | null
          clinician_id: string
          conditions: string[] | null
          created_at: string | null
          current_medications: Json | null
          diet_type: string | null
          exercise_frequency: string | null
          family_history: string[] | null
          id: string
          menstrual_status: string | null
          nursing: boolean | null
          past_conditions: string[] | null
          past_medications: Json | null
          patient_id: string
          pregnant: boolean | null
          sleep_hours_avg: number | null
          smoking_status: string | null
          stress_level: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          alcohol_use?: string | null
          allergies?: Json | null
          clinician_id: string
          conditions?: string[] | null
          created_at?: string | null
          current_medications?: Json | null
          diet_type?: string | null
          exercise_frequency?: string | null
          family_history?: string[] | null
          id?: string
          menstrual_status?: string | null
          nursing?: boolean | null
          past_conditions?: string[] | null
          past_medications?: Json | null
          patient_id: string
          pregnant?: boolean | null
          sleep_hours_avg?: number | null
          smoking_status?: string | null
          stress_level?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          alcohol_use?: string | null
          allergies?: Json | null
          clinician_id?: string
          conditions?: string[] | null
          created_at?: string | null
          current_medications?: Json | null
          diet_type?: string | null
          exercise_frequency?: string | null
          family_history?: string[] | null
          id?: string
          menstrual_status?: string | null
          nursing?: boolean | null
          past_conditions?: string[] | null
          past_medications?: Json | null
          patient_id?: string
          pregnant?: boolean | null
          sleep_hours_avg?: number | null
          smoking_status?: string | null
          stress_level?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_health_histories_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_lab_documents: {
        Row: {
          clinician_id: string
          created_at: string | null
          file_name: string
          file_size_bytes: number
          file_type: string
          id: string
          lab_company: string | null
          lab_date: string | null
          ordering_provider: string | null
          panel_name: string | null
          parsed_at: string | null
          patient_id: string
          processing_status: string | null
          storage_path: string
          thumbnail_path: string | null
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          clinician_id: string
          created_at?: string | null
          file_name: string
          file_size_bytes: number
          file_type: string
          id?: string
          lab_company?: string | null
          lab_date?: string | null
          ordering_provider?: string | null
          panel_name?: string | null
          parsed_at?: string | null
          patient_id: string
          processing_status?: string | null
          storage_path: string
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          clinician_id?: string
          created_at?: string | null
          file_name?: string
          file_size_bytes?: number
          file_type?: string
          id?: string
          lab_company?: string | null
          lab_date?: string | null
          ordering_provider?: string | null
          panel_name?: string | null
          parsed_at?: string | null
          patient_id?: string
          processing_status?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_lab_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_lab_results: {
        Row: {
          clinician_id: string
          created_at: string | null
          entered_by: string
          entry_method: string | null
          id: string
          lab_document_id: string | null
          lab_test_id: string
          patient_id: string
          ref_range_high: number | null
          ref_range_low: number | null
          result_date: string
          status: string
          unit: string
          value: number
          value_text: string | null
        }
        Insert: {
          clinician_id: string
          created_at?: string | null
          entered_by: string
          entry_method?: string | null
          id?: string
          lab_document_id?: string | null
          lab_test_id: string
          patient_id: string
          ref_range_high?: number | null
          ref_range_low?: number | null
          result_date: string
          status: string
          unit: string
          value: number
          value_text?: string | null
        }
        Update: {
          clinician_id?: string
          created_at?: string | null
          entered_by?: string
          entry_method?: string | null
          id?: string
          lab_document_id?: string | null
          lab_test_id?: string
          patient_id?: string
          ref_range_high?: number | null
          ref_range_low?: number | null
          result_date?: string
          status?: string
          unit?: string
          value?: number
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_lab_results_lab_document_id_fkey"
            columns: ["lab_document_id"]
            isOneToOne: false
            referencedRelation: "clinic_lab_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_lab_results_lab_test_id_fkey"
            columns: ["lab_test_id"]
            isOneToOne: false
            referencedRelation: "clinic_lab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_lab_tests: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          critical_high: number | null
          critical_low: number | null
          description: string | null
          functional_range_high: number | null
          functional_range_low: number | null
          id: string
          is_active: boolean | null
          name: string
          ref_range_high: number | null
          ref_range_low: number | null
          unit: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          critical_high?: number | null
          critical_low?: number | null
          description?: string | null
          functional_range_high?: number | null
          functional_range_low?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          ref_range_high?: number | null
          ref_range_low?: number | null
          unit: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          critical_high?: number | null
          critical_low?: number | null
          description?: string | null
          functional_range_high?: number | null
          functional_range_low?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          ref_range_high?: number | null
          ref_range_low?: number | null
          unit?: string
        }
        Relationships: []
      }
      clinic_patient_thresholds: {
        Row: {
          bp_diastolic_high: number | null
          bp_diastolic_low: number | null
          bp_systolic_high: number | null
          bp_systolic_low: number | null
          clinician_id: string
          created_at: string | null
          glucose_critical_high: number | null
          glucose_critical_low: number | null
          glucose_high: number | null
          glucose_low: number | null
          id: string
          patient_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bp_diastolic_high?: number | null
          bp_diastolic_low?: number | null
          bp_systolic_high?: number | null
          bp_systolic_low?: number | null
          clinician_id: string
          created_at?: string | null
          glucose_critical_high?: number | null
          glucose_critical_low?: number | null
          glucose_high?: number | null
          glucose_low?: number | null
          id?: string
          patient_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bp_diastolic_high?: number | null
          bp_diastolic_low?: number | null
          bp_systolic_high?: number | null
          bp_systolic_low?: number | null
          clinician_id?: string
          created_at?: string | null
          glucose_critical_high?: number | null
          glucose_critical_low?: number | null
          glucose_high?: number | null
          glucose_low?: number | null
          id?: string
          patient_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_patient_thresholds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_patients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          assigned_clinician_id: string | null
          city: string | null
          clinician_id: string
          country: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          id: string
          last_name: string
          linked_auth_user_id: string | null
          phone: string | null
          sex: string
          state: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          assigned_clinician_id?: string | null
          city?: string | null
          clinician_id: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          id?: string
          last_name: string
          linked_auth_user_id?: string | null
          phone?: string | null
          sex: string
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          assigned_clinician_id?: string | null
          city?: string | null
          clinician_id?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          id?: string
          last_name?: string
          linked_auth_user_id?: string | null
          phone?: string | null
          sex?: string
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      clinical_intakes: {
        Row: {
          associated_symptoms_json: Json | null
          chief_complaint_json: Json | null
          created_at: string | null
          digestive_function: number | null
          energy_level: number | null
          id: string
          pain_quality: string | null
          sleep_quality: number | null
          stress_perception: number | null
          temperature_sensitivity: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          associated_symptoms_json?: Json | null
          chief_complaint_json?: Json | null
          created_at?: string | null
          digestive_function?: number | null
          energy_level?: number | null
          id?: string
          pain_quality?: string | null
          sleep_quality?: number | null
          stress_perception?: number | null
          temperature_sensitivity?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          associated_symptoms_json?: Json | null
          chief_complaint_json?: Json | null
          created_at?: string | null
          digestive_function?: number | null
          energy_level?: number | null
          id?: string
          pain_quality?: string | null
          sleep_quality?: number | null
          stress_perception?: number | null
          temperature_sensitivity?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coach_run_logs: {
        Row: {
          context_snapshot: Json
          created_at: string
          daily_recommendation_id: string | null
          date: string
          duration_ms: number | null
          error: string | null
          id: string
          llm_response_raw: Json | null
          model_used: string | null
          safety_gates_triggered: Json
          status: string
          user_id: string
        }
        Insert: {
          context_snapshot: Json
          created_at?: string
          daily_recommendation_id?: string | null
          date: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          llm_response_raw?: Json | null
          model_used?: string | null
          safety_gates_triggered?: Json
          status?: string
          user_id: string
        }
        Update: {
          context_snapshot?: Json
          created_at?: string
          daily_recommendation_id?: string | null
          date?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          llm_response_raw?: Json | null
          model_used?: string | null
          safety_gates_triggered?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_run_logs_daily_recommendation_id_fkey"
            columns: ["daily_recommendation_id"]
            isOneToOne: false
            referencedRelation: "daily_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_reports: {
        Row: {
          body: Json | null
          connection_id: string | null
          created_at: string | null
          id: string
          lens: string | null
          link_id: string | null
          score: number
          user_id: string
        }
        Insert: {
          body?: Json | null
          connection_id?: string | null
          created_at?: string | null
          id?: string
          lens?: string | null
          link_id?: string | null
          score: number
          user_id: string
        }
        Update: {
          body?: Json | null
          connection_id?: string | null
          created_at?: string | null
          id?: string
          lens?: string | null
          link_id?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_reports_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compatibility_reports_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compatibility_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      confluence_signals: {
        Row: {
          created_at: string | null
          direction: string
          from_strategy_key: string
          reasoning: string | null
          strength: number | null
          symbol: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          from_strategy_key: string
          reasoning?: string | null
          strength?: number | null
          symbol: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          from_strategy_key?: string
          reasoning?: string | null
          strength?: number | null
          symbol?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          birth_date: string
          birth_place_label: string | null
          birth_time: string | null
          blueprint: Json | null
          created_at: string | null
          id: string
          lat: number | null
          lens: string | null
          link_status: string | null
          linked_user_id: string | null
          lng: number | null
          name: string
          timezone: string | null
          user_id: string
        }
        Insert: {
          birth_date: string
          birth_place_label?: string | null
          birth_time?: string | null
          blueprint?: Json | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lens?: string | null
          link_status?: string | null
          linked_user_id?: string | null
          lng?: number | null
          name: string
          timezone?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string
          birth_place_label?: string | null
          birth_time?: string | null
          blueprint?: Json | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lens?: string | null
          link_status?: string | null
          linked_user_id?: string | null
          lng?: number | null
          name?: string
          timezone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          angle: string | null
          asset_urls: Json | null
          audience: string | null
          brand_name: string | null
          caption_options: Json | null
          competitor_source: string | null
          created_at: string | null
          cta_options: Json | null
          errors: Json | null
          filming_notes: string | null
          hashtags: Json | null
          heygen_payload: Json | null
          hook_options: Json | null
          id: string
          pexels_links: Json | null
          pexels_queries: Json | null
          platform: string | null
          script: string | null
          shot_list: Json | null
          source_metrics: Json | null
          source_url: string | null
          status: string | null
          tags: string[] | null
          topic: string | null
          updated_at: string | null
          veo_prompts: Json | null
        }
        Insert: {
          angle?: string | null
          asset_urls?: Json | null
          audience?: string | null
          brand_name?: string | null
          caption_options?: Json | null
          competitor_source?: string | null
          created_at?: string | null
          cta_options?: Json | null
          errors?: Json | null
          filming_notes?: string | null
          hashtags?: Json | null
          heygen_payload?: Json | null
          hook_options?: Json | null
          id?: string
          pexels_links?: Json | null
          pexels_queries?: Json | null
          platform?: string | null
          script?: string | null
          shot_list?: Json | null
          source_metrics?: Json | null
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          topic?: string | null
          updated_at?: string | null
          veo_prompts?: Json | null
        }
        Update: {
          angle?: string | null
          asset_urls?: Json | null
          audience?: string | null
          brand_name?: string | null
          caption_options?: Json | null
          competitor_source?: string | null
          created_at?: string | null
          cta_options?: Json | null
          errors?: Json | null
          filming_notes?: string | null
          hashtags?: Json | null
          heygen_payload?: Json | null
          hook_options?: Json | null
          id?: string
          pexels_links?: Json | null
          pexels_queries?: Json | null
          platform?: string | null
          script?: string | null
          shot_list?: Json | null
          source_metrics?: Json | null
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          topic?: string | null
          updated_at?: string | null
          veo_prompts?: Json | null
        }
        Relationships: []
      }
      content_templates: {
        Row: {
          base_copy: string
          created_at: string | null
          id: string
          item_key: string
          system: string
        }
        Insert: {
          base_copy: string
          created_at?: string | null
          id?: string
          item_key: string
          system: string
        }
        Update: {
          base_copy?: string
          created_at?: string | null
          id?: string
          item_key?: string
          system?: string
        }
        Relationships: []
      }
      contraindications: {
        Row: {
          allergies: string[] | null
          conditions: string[] | null
          created_at: string | null
          id: string
          medications: string[] | null
          nursing: boolean | null
          pregnant: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          conditions?: string[] | null
          created_at?: string | null
          id?: string
          medications?: string[] | null
          nursing?: boolean | null
          pregnant?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          conditions?: string[] | null
          created_at?: string | null
          id?: string
          medications?: string[] | null
          nursing?: boolean | null
          pregnant?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      correlations: {
        Row: {
          computed_at: string
          confidence: string
          direction: string
          evidence_json: Json | null
          id: string
          sample_size: number
          strength: string
          summary: string | null
          time_window_days: number
          user_id: string
          variable_a: string
          variable_b: string
        }
        Insert: {
          computed_at?: string
          confidence: string
          direction: string
          evidence_json?: Json | null
          id?: string
          sample_size: number
          strength: string
          summary?: string | null
          time_window_days: number
          user_id: string
          variable_a: string
          variable_b: string
        }
        Update: {
          computed_at?: string
          confidence?: string
          direction?: string
          evidence_json?: Json | null
          id?: string
          sample_size?: number
          strength?: string
          summary?: string | null
          time_window_days?: number
          user_id?: string
          variable_a?: string
          variable_b?: string
        }
        Relationships: []
      }
      cross_modality_contradiction_pairs: {
        Row: {
          created_at: string
          id: string
          note: string | null
          tag_a: string
          tag_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          tag_a: string
          tag_b: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          tag_a?: string
          tag_b?: string
        }
        Relationships: []
      }
      cross_modality_tag_taxonomy: {
        Row: {
          created_at: string
          description: string | null
          id: string
          namespace: string
          tag: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          namespace: string
          tag: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          namespace?: string
          tag?: string
        }
        Relationships: []
      }
      daily_adherence: {
        Row: {
          completed_peptides: string[] | null
          completed_supplements: string[] | null
          completed_tasks: string[] | null
          created_at: string | null
          date: string
          fasting_completed: boolean | null
          id: string
          notes: string | null
          protocol_id: string
          symptoms_json: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_peptides?: string[] | null
          completed_supplements?: string[] | null
          completed_tasks?: string[] | null
          created_at?: string | null
          date: string
          fasting_completed?: boolean | null
          id?: string
          notes?: string | null
          protocol_id: string
          symptoms_json?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_peptides?: string[] | null
          completed_supplements?: string[] | null
          completed_tasks?: string[] | null
          created_at?: string | null
          date?: string
          fasting_completed?: boolean | null
          id?: string
          notes?: string | null
          protocol_id?: string
          symptoms_json?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_adherence_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_baselines: {
        Row: {
          active_minutes_baseline: number | null
          baseline_window_days: number
          bedtime_baseline: string | null
          created_at: string | null
          date: string
          energy_baseline: number | null
          hrv_baseline: number | null
          hydration_baseline: number | null
          id: string
          readiness_baseline: number | null
          respiratory_rate_baseline: number | null
          resting_hr_baseline: number | null
          sleep_duration_baseline: number | null
          sleep_efficiency_baseline: number | null
          sleep_score_baseline: number | null
          soreness_baseline: number | null
          steps_baseline: number | null
          stress_baseline: number | null
          temp_deviation_baseline: number | null
          user_id: string
        }
        Insert: {
          active_minutes_baseline?: number | null
          baseline_window_days?: number
          bedtime_baseline?: string | null
          created_at?: string | null
          date: string
          energy_baseline?: number | null
          hrv_baseline?: number | null
          hydration_baseline?: number | null
          id?: string
          readiness_baseline?: number | null
          respiratory_rate_baseline?: number | null
          resting_hr_baseline?: number | null
          sleep_duration_baseline?: number | null
          sleep_efficiency_baseline?: number | null
          sleep_score_baseline?: number | null
          soreness_baseline?: number | null
          steps_baseline?: number | null
          stress_baseline?: number | null
          temp_deviation_baseline?: number | null
          user_id: string
        }
        Update: {
          active_minutes_baseline?: number | null
          baseline_window_days?: number
          bedtime_baseline?: string | null
          created_at?: string | null
          date?: string
          energy_baseline?: number | null
          hrv_baseline?: number | null
          hydration_baseline?: number | null
          id?: string
          readiness_baseline?: number | null
          respiratory_rate_baseline?: number | null
          resting_hr_baseline?: number | null
          sleep_duration_baseline?: number | null
          sleep_efficiency_baseline?: number | null
          sleep_score_baseline?: number | null
          soreness_baseline?: number | null
          steps_baseline?: number | null
          stress_baseline?: number | null
          temp_deviation_baseline?: number | null
          user_id?: string
        }
        Relationships: []
      }
      daily_biometric_records: {
        Row: {
          active_minutes: number | null
          adherence_score_raw: number | null
          alcohol_units: number | null
          avg_hr: number | null
          awakenings: number | null
          bedtime: string | null
          bedtime_variability_minutes: number | null
          body_fat_percent: number | null
          bowel_score_subjective: number | null
          caffeine_mg: number | null
          calories_burned: number | null
          cravings_score_subjective: number | null
          created_at: string | null
          cycle_phase: string | null
          data_quality_score: number | null
          date: string
          deep_sleep_minutes: number | null
          diastolic_bp: number | null
          distance_meters: number | null
          energy_score_subjective: number | null
          glucose_avg: number | null
          hrv: number | null
          hydration_ml: number | null
          id: string
          libido_score_subjective: number | null
          light_sleep_minutes: number | null
          mood_score_subjective: number | null
          primary_source: string | null
          readiness_score_vendor: number | null
          rem_sleep_minutes: number | null
          respiratory_rate: number | null
          resting_hr: number | null
          sedentary_minutes: number | null
          sleep_duration_minutes: number | null
          sleep_efficiency: number | null
          sleep_latency_minutes: number | null
          sleep_score: number | null
          soreness_score_subjective: number | null
          spo2: number | null
          steps: number | null
          strain_score: number | null
          stress_score_subjective: number | null
          stress_score_vendor: number | null
          symptom_flags_json: Json | null
          systolic_bp: number | null
          temp_deviation: number | null
          time_in_bed_minutes: number | null
          training_load: number | null
          updated_at: string | null
          user_id: string
          vo2max: number | null
          wake_after_sleep_onset_minutes: number | null
          wake_time: string | null
          weight_kg: number | null
          workout_minutes: number | null
        }
        Insert: {
          active_minutes?: number | null
          adherence_score_raw?: number | null
          alcohol_units?: number | null
          avg_hr?: number | null
          awakenings?: number | null
          bedtime?: string | null
          bedtime_variability_minutes?: number | null
          body_fat_percent?: number | null
          bowel_score_subjective?: number | null
          caffeine_mg?: number | null
          calories_burned?: number | null
          cravings_score_subjective?: number | null
          created_at?: string | null
          cycle_phase?: string | null
          data_quality_score?: number | null
          date: string
          deep_sleep_minutes?: number | null
          diastolic_bp?: number | null
          distance_meters?: number | null
          energy_score_subjective?: number | null
          glucose_avg?: number | null
          hrv?: number | null
          hydration_ml?: number | null
          id?: string
          libido_score_subjective?: number | null
          light_sleep_minutes?: number | null
          mood_score_subjective?: number | null
          primary_source?: string | null
          readiness_score_vendor?: number | null
          rem_sleep_minutes?: number | null
          respiratory_rate?: number | null
          resting_hr?: number | null
          sedentary_minutes?: number | null
          sleep_duration_minutes?: number | null
          sleep_efficiency?: number | null
          sleep_latency_minutes?: number | null
          sleep_score?: number | null
          soreness_score_subjective?: number | null
          spo2?: number | null
          steps?: number | null
          strain_score?: number | null
          stress_score_subjective?: number | null
          stress_score_vendor?: number | null
          symptom_flags_json?: Json | null
          systolic_bp?: number | null
          temp_deviation?: number | null
          time_in_bed_minutes?: number | null
          training_load?: number | null
          updated_at?: string | null
          user_id: string
          vo2max?: number | null
          wake_after_sleep_onset_minutes?: number | null
          wake_time?: string | null
          weight_kg?: number | null
          workout_minutes?: number | null
        }
        Update: {
          active_minutes?: number | null
          adherence_score_raw?: number | null
          alcohol_units?: number | null
          avg_hr?: number | null
          awakenings?: number | null
          bedtime?: string | null
          bedtime_variability_minutes?: number | null
          body_fat_percent?: number | null
          bowel_score_subjective?: number | null
          caffeine_mg?: number | null
          calories_burned?: number | null
          cravings_score_subjective?: number | null
          created_at?: string | null
          cycle_phase?: string | null
          data_quality_score?: number | null
          date?: string
          deep_sleep_minutes?: number | null
          diastolic_bp?: number | null
          distance_meters?: number | null
          energy_score_subjective?: number | null
          glucose_avg?: number | null
          hrv?: number | null
          hydration_ml?: number | null
          id?: string
          libido_score_subjective?: number | null
          light_sleep_minutes?: number | null
          mood_score_subjective?: number | null
          primary_source?: string | null
          readiness_score_vendor?: number | null
          rem_sleep_minutes?: number | null
          respiratory_rate?: number | null
          resting_hr?: number | null
          sedentary_minutes?: number | null
          sleep_duration_minutes?: number | null
          sleep_efficiency?: number | null
          sleep_latency_minutes?: number | null
          sleep_score?: number | null
          soreness_score_subjective?: number | null
          spo2?: number | null
          steps?: number | null
          strain_score?: number | null
          stress_score_subjective?: number | null
          stress_score_vendor?: number | null
          symptom_flags_json?: Json | null
          systolic_bp?: number | null
          temp_deviation?: number | null
          time_in_bed_minutes?: number | null
          training_load?: number | null
          updated_at?: string | null
          user_id?: string
          vo2max?: number | null
          wake_after_sleep_onset_minutes?: number | null
          wake_time?: string | null
          weight_kg?: number | null
          workout_minutes?: number | null
        }
        Relationships: []
      }
      daily_nutrition_rollups: {
        Row: {
          alcohol_units: number | null
          caffeine_mg: number | null
          created_at: string | null
          date: string
          eating_window_minutes: number | null
          first_meal_time: string | null
          glycemic_load_total: number | null
          hydration_ml: number | null
          id: string
          inflammatory_load_total: number | null
          last_meal_time: string | null
          meal_count: number | null
          meal_timing_score: number | null
          protein_distribution_score: number | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alcohol_units?: number | null
          caffeine_mg?: number | null
          created_at?: string | null
          date: string
          eating_window_minutes?: number | null
          first_meal_time?: string | null
          glycemic_load_total?: number | null
          hydration_ml?: number | null
          id?: string
          inflammatory_load_total?: number | null
          last_meal_time?: string | null
          meal_count?: number | null
          meal_timing_score?: number | null
          protein_distribution_score?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alcohol_units?: number | null
          caffeine_mg?: number | null
          created_at?: string | null
          date?: string
          eating_window_minutes?: number | null
          first_meal_time?: string | null
          glycemic_load_total?: number | null
          hydration_ml?: number | null
          id?: string
          inflammatory_load_total?: number | null
          last_meal_time?: string | null
          meal_count?: number | null
          meal_timing_score?: number | null
          protein_distribution_score?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_readings: {
        Row: {
          affirmation: string | null
          agreement: Json | null
          chinese_daily: Json | null
          do_embrace_ease: Json | null
          generated_at: string | null
          hero_text: string
          id: string
          personal_day: number | null
          reading_date: string
          tarot_card: Json | null
          transit_context: Json | null
          user_id: string
        }
        Insert: {
          affirmation?: string | null
          agreement?: Json | null
          chinese_daily?: Json | null
          do_embrace_ease?: Json | null
          generated_at?: string | null
          hero_text: string
          id?: string
          personal_day?: number | null
          reading_date: string
          tarot_card?: Json | null
          transit_context?: Json | null
          user_id: string
        }
        Update: {
          affirmation?: string | null
          agreement?: Json | null
          chinese_daily?: Json | null
          do_embrace_ease?: Json | null
          generated_at?: string | null
          hero_text?: string
          id?: string
          personal_day?: number | null
          reading_date?: string
          tarot_card?: Json | null
          transit_context?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_recommendations: {
        Row: {
          ai_summary_json: Json | null
          created_at: string | null
          date: string
          escalation_flag: string | null
          explanation_long: string | null
          explanation_short: string | null
          id: string
          nutrition_guidance: string | null
          recommendation_payload_json: Json | null
          recovery_status: string | null
          sleep_guidance: string | null
          stress_guidance: string | null
          supplement_guidance: string | null
          top_actions_json: Json | null
          training_guidance: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_summary_json?: Json | null
          created_at?: string | null
          date: string
          escalation_flag?: string | null
          explanation_long?: string | null
          explanation_short?: string | null
          id?: string
          nutrition_guidance?: string | null
          recommendation_payload_json?: Json | null
          recovery_status?: string | null
          sleep_guidance?: string | null
          stress_guidance?: string | null
          supplement_guidance?: string | null
          top_actions_json?: Json | null
          training_guidance?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_summary_json?: Json | null
          created_at?: string | null
          date?: string
          escalation_flag?: string | null
          explanation_long?: string | null
          explanation_short?: string | null
          id?: string
          nutrition_guidance?: string | null
          recommendation_payload_json?: Json | null
          recovery_status?: string | null
          sleep_guidance?: string | null
          stress_guidance?: string | null
          supplement_guidance?: string | null
          top_actions_json?: Json | null
          training_guidance?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_scores: {
        Row: {
          adherence_score: number | null
          confidence_score: number | null
          created_at: string | null
          date: string
          id: string
          inflammation_strain_score: number | null
          metabolic_resilience_score: number | null
          nervous_system_balance_score: number | null
          recovery_score: number | null
          recovery_status: string | null
          scoring_inputs_json: Json | null
          sleep_score_computed: number | null
          stress_load_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adherence_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          date: string
          id?: string
          inflammation_strain_score?: number | null
          metabolic_resilience_score?: number | null
          nervous_system_balance_score?: number | null
          recovery_score?: number | null
          recovery_status?: string | null
          scoring_inputs_json?: Json | null
          sleep_score_computed?: number | null
          stress_load_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adherence_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          date?: string
          id?: string
          inflammation_strain_score?: number | null
          metabolic_resilience_score?: number | null
          nervous_system_balance_score?: number | null
          recovery_score?: number | null
          recovery_status?: string | null
          scoring_inputs_json?: Json | null
          sleep_score_computed?: number | null
          stress_load_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_subjective_rollups: {
        Row: {
          bowel_avg: number | null
          checkin_completion_score: number | null
          cravings_avg: number | null
          created_at: string | null
          date: string
          energy_avg: number | null
          id: string
          libido_avg: number | null
          mood_avg: number | null
          soreness_avg: number | null
          stress_avg: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bowel_avg?: number | null
          checkin_completion_score?: number | null
          cravings_avg?: number | null
          created_at?: string | null
          date: string
          energy_avg?: number | null
          id?: string
          libido_avg?: number | null
          mood_avg?: number | null
          soreness_avg?: number | null
          stress_avg?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bowel_avg?: number | null
          checkin_completion_score?: number | null
          cravings_avg?: number | null
          created_at?: string | null
          date?: string
          energy_avg?: number | null
          id?: string
          libido_avg?: number | null
          mood_avg?: number | null
          soreness_avg?: number | null
          stress_avg?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_supplement_rollups: {
        Row: {
          core_stack_adherence_percent: number | null
          created_at: string | null
          date: string
          expected_supplements_count: number | null
          id: string
          metabolic_support_taken: boolean | null
          mitochondrial_support_taken: boolean | null
          recovery_support_taken: boolean | null
          sleep_support_taken: boolean | null
          supplement_adherence_percent: number | null
          supplements_taken_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          core_stack_adherence_percent?: number | null
          created_at?: string | null
          date: string
          expected_supplements_count?: number | null
          id?: string
          metabolic_support_taken?: boolean | null
          mitochondrial_support_taken?: boolean | null
          recovery_support_taken?: boolean | null
          sleep_support_taken?: boolean | null
          supplement_adherence_percent?: number | null
          supplements_taken_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          core_stack_adherence_percent?: number | null
          created_at?: string | null
          date?: string
          expected_supplements_count?: number | null
          id?: string
          metabolic_support_taken?: boolean | null
          mitochondrial_support_taken?: boolean | null
          recovery_support_taken?: boolean | null
          sleep_support_taken?: boolean | null
          supplement_adherence_percent?: number | null
          supplements_taken_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      decision_journal: {
        Row: {
          created_at: string | null
          decision_type: string | null
          fair_probability: number | null
          id: string
          market_id: string
        }
        Insert: {
          created_at?: string | null
          decision_type?: string | null
          fair_probability?: number | null
          id?: string
          market_id: string
        }
        Update: {
          created_at?: string | null
          decision_type?: string | null
          fair_probability?: number | null
          id?: string
          market_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_journal_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_log: {
        Row: {
          asset_class: string | null
          confidence: number
          created_at: string | null
          horizon_days: number
          id: string
          metadata: Json | null
          outcome_graded: boolean
          paper_position_id: string | null
          predicted_direction: number
          predicted_return: number | null
          resolution_due_at: string
          signal_weights: Json | null
          strategy: string
          symbol: string
          user_id: string
        }
        Insert: {
          asset_class?: string | null
          confidence: number
          created_at?: string | null
          horizon_days?: number
          id?: string
          metadata?: Json | null
          outcome_graded?: boolean
          paper_position_id?: string | null
          predicted_direction: number
          predicted_return?: number | null
          resolution_due_at: string
          signal_weights?: Json | null
          strategy: string
          symbol: string
          user_id: string
        }
        Update: {
          asset_class?: string | null
          confidence?: number
          created_at?: string | null
          horizon_days?: number
          id?: string
          metadata?: Json | null
          outcome_graded?: boolean
          paper_position_id?: string | null
          predicted_direction?: number
          predicted_return?: number | null
          resolution_due_at?: string
          signal_weights?: Json | null
          strategy?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      detected_patterns: {
        Row: {
          confidence: string
          created_at: string | null
          date: string
          evidence_json: Json | null
          id: string
          pattern_type: string
          severity: string
          summary: string | null
          title: string
          user_id: string
        }
        Insert: {
          confidence: string
          created_at?: string | null
          date: string
          evidence_json?: Json | null
          id?: string
          pattern_type: string
          severity: string
          summary?: string | null
          title: string
          user_id: string
        }
        Update: {
          confidence?: string
          created_at?: string | null
          date?: string
          evidence_json?: Json | null
          id?: string
          pattern_type?: string
          severity?: string
          summary?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      dexter_research_cache: {
        Row: {
          cached_at: string | null
          expires_at: string
          id: string
          latency_ms: number | null
          model_used: string | null
          query_key: string
          research_type: string
          result: Json
          ticker: string
        }
        Insert: {
          cached_at?: string | null
          expires_at?: string
          id?: string
          latency_ms?: number | null
          model_used?: string | null
          query_key: string
          research_type: string
          result: Json
          ticker: string
        }
        Update: {
          cached_at?: string | null
          expires_at?: string
          id?: string
          latency_ms?: number | null
          model_used?: string | null
          query_key?: string
          research_type?: string
          result?: Json
          ticker?: string
        }
        Relationships: []
      }
      engine_metrics: {
        Row: {
          accuracy: number | null
          engine_name: string | null
          id: string
          latency_ms: number | null
          profitability: number | null
          updated_at: string | null
        }
        Insert: {
          accuracy?: number | null
          engine_name?: string | null
          id?: string
          latency_ms?: number | null
          profitability?: number | null
          updated_at?: string | null
        }
        Update: {
          accuracy?: number | null
          engine_name?: string | null
          id?: string
          latency_ms?: number | null
          profitability?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ev_gaps: {
        Row: {
          gap_direction: string | null
          gap_size: number | null
          id: string
          identified_at: string | null
          market_id: string | null
        }
        Insert: {
          gap_direction?: string | null
          gap_size?: number | null
          id?: string
          identified_at?: string | null
          market_id?: string | null
        }
        Update: {
          gap_direction?: string | null
          gap_size?: number | null
          id?: string
          identified_at?: string | null
          market_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ev_gaps_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_items: {
        Row: {
          description: string | null
          discovered_at: string | null
          id: string
          market_id: string
          source_name: string | null
          title: string | null
        }
        Insert: {
          description?: string | null
          discovered_at?: string | null
          id?: string
          market_id: string
          source_name?: string | null
          title?: string | null
        }
        Update: {
          description?: string | null
          discovered_at?: string | null
          id?: string
          market_id?: string
          source_name?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_items_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          created_at: string | null
          current_amount: number
          id: string
          name: string
          notes: string | null
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          current_amount?: number
          id?: string
          name: string
          notes?: string | null
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          current_amount?: number
          id?: string
          name?: string
          notes?: string | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_goals: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          primary_goal: string | null
          secondary_goals_json: Json | null
          target_body_fat: number | null
          target_weight: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          primary_goal?: string | null
          secondary_goals_json?: Json | null
          target_body_fat?: number | null
          target_weight?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          primary_goal?: string | null
          secondary_goals_json?: Json | null
          target_body_fat?: number | null
          target_weight?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hormone_entries: {
        Row: {
          created_at: string | null
          current_supplements_json: Json | null
          cycle_day: number | null
          date: string
          id: string
          notes: string | null
          symptoms_json: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_supplements_json?: Json | null
          cycle_day?: number | null
          date: string
          id?: string
          notes?: string | null
          symptoms_json?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_supplements_json?: Json | null
          cycle_day?: number | null
          date?: string
          id?: string
          notes?: string | null
          symptoms_json?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ifm_node_visual_tag_weights: {
        Row: {
          created_at: string
          id: string
          ifm_node: string
          notes: string | null
          visual_tag: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          ifm_node: string
          notes?: string | null
          visual_tag: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          ifm_node?: string
          notes?: string | null
          visual_tag?: string
          weight?: number
        }
        Relationships: []
      }
      imbalance_snapshots: {
        Row: {
          decision: string | null
          direction: string
          id: string
          opposes: boolean
          ratio: number
          recorded_at: string | null
          signal: string
          strategy_key: string
          symbol: string
          venue: string
        }
        Insert: {
          decision?: string | null
          direction: string
          id?: string
          opposes?: boolean
          ratio: number
          recorded_at?: string | null
          signal: string
          strategy_key: string
          symbol: string
          venue: string
        }
        Update: {
          decision?: string | null
          direction?: string
          id?: string
          opposes?: boolean
          ratio?: number
          recorded_at?: string | null
          signal?: string
          strategy_key?: string
          symbol?: string
          venue?: string
        }
        Relationships: []
      }
      inbox_messages: {
        Row: {
          action_options: Json | null
          action_taken: string | null
          actioned_at: string | null
          body: string
          created_at: string | null
          from_agent_id: string | null
          id: string
          notion_synced: boolean | null
          requires_action: boolean | null
          status: string | null
          subject: string
          task_id: string | null
          type: string
        }
        Insert: {
          action_options?: Json | null
          action_taken?: string | null
          actioned_at?: string | null
          body: string
          created_at?: string | null
          from_agent_id?: string | null
          id?: string
          notion_synced?: boolean | null
          requires_action?: boolean | null
          status?: string | null
          subject: string
          task_id?: string | null
          type: string
        }
        Update: {
          action_options?: Json | null
          action_taken?: string | null
          actioned_at?: string | null
          body?: string
          created_at?: string | null
          from_agent_id?: string | null
          id?: string
          notion_synced?: boolean | null
          requires_action?: boolean | null
          status?: string | null
          subject?: string
          task_id?: string | null
          type?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          body: string
          cached: boolean | null
          created_at: string | null
          id: string
          item_key: string
          system: string
          user_id: string | null
          why: string | null
        }
        Insert: {
          body: string
          cached?: boolean | null
          created_at?: string | null
          id?: string
          item_key: string
          system: string
          user_id?: string | null
          why?: string | null
        }
        Update: {
          body?: string
          cached?: boolean | null
          created_at?: string | null
          id?: string
          item_key?: string
          system?: string
          user_id?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intakes: {
        Row: {
          advanced_completed: boolean | null
          behavior_to_change: string | null
          body_location: string | null
          connected_to_past_event: string | null
          created_at: string | null
          desired_emotional_shift: string | null
          fears_about_change: string | null
          focus_category: string
          has_inner_conflict: boolean | null
          id: string
          inner_conflict_description: string | null
          interests: string[] | null
          interests_other: string | null
          issue_duration: string | null
          key_affirmations: string | null
          language_to_avoid: string | null
          main_issue: string
          mental_blocks_beliefs: string | null
          negative_beliefs: string | null
          personality_words: string | null
          positive_anchoring_memory: string | null
          post_session_state: string | null
          prior_hypnosis_details: string | null
          prior_hypnosis_experience: boolean | null
          problem_category: string | null
          repeating_thoughts: string | null
          representational_system: string | null
          resistance_protection: string | null
          session_duration_minutes: number | null
          success_vision: string | null
          symptoms: string | null
          triggers: string | null
          user_id: string
          work_life_environment: string | null
        }
        Insert: {
          advanced_completed?: boolean | null
          behavior_to_change?: string | null
          body_location?: string | null
          connected_to_past_event?: string | null
          created_at?: string | null
          desired_emotional_shift?: string | null
          fears_about_change?: string | null
          focus_category: string
          has_inner_conflict?: boolean | null
          id?: string
          inner_conflict_description?: string | null
          interests?: string[] | null
          interests_other?: string | null
          issue_duration?: string | null
          key_affirmations?: string | null
          language_to_avoid?: string | null
          main_issue: string
          mental_blocks_beliefs?: string | null
          negative_beliefs?: string | null
          personality_words?: string | null
          positive_anchoring_memory?: string | null
          post_session_state?: string | null
          prior_hypnosis_details?: string | null
          prior_hypnosis_experience?: boolean | null
          problem_category?: string | null
          repeating_thoughts?: string | null
          representational_system?: string | null
          resistance_protection?: string | null
          session_duration_minutes?: number | null
          success_vision?: string | null
          symptoms?: string | null
          triggers?: string | null
          user_id: string
          work_life_environment?: string | null
        }
        Update: {
          advanced_completed?: boolean | null
          behavior_to_change?: string | null
          body_location?: string | null
          connected_to_past_event?: string | null
          created_at?: string | null
          desired_emotional_shift?: string | null
          fears_about_change?: string | null
          focus_category?: string
          has_inner_conflict?: boolean | null
          id?: string
          inner_conflict_description?: string | null
          interests?: string[] | null
          interests_other?: string | null
          issue_duration?: string | null
          key_affirmations?: string | null
          language_to_avoid?: string | null
          main_issue?: string
          mental_blocks_beliefs?: string | null
          negative_beliefs?: string | null
          personality_words?: string | null
          positive_anchoring_memory?: string | null
          post_session_state?: string | null
          prior_hypnosis_details?: string | null
          prior_hypnosis_experience?: boolean | null
          problem_category?: string | null
          repeating_thoughts?: string | null
          representational_system?: string | null
          resistance_protection?: string | null
          session_duration_minutes?: number | null
          success_vision?: string | null
          symptoms?: string | null
          triggers?: string | null
          user_id?: string
          work_life_environment?: string | null
        }
        Relationships: []
      }
      integration_health_log: {
        Row: {
          checked_at: string | null
          error_message: string | null
          id: string
          integration: string
          latency_ms: number | null
          metadata: Json | null
          status: string
        }
        Insert: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          integration: string
          latency_ms?: number | null
          metadata?: Json | null
          status: string
        }
        Update: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          integration?: string
          latency_ms?: number | null
          metadata?: Json | null
          status?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          body: string
          created_at: string | null
          entry_date: string
          id: string
          mood: number | null
          prompt: string | null
          transit_context: Json | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          entry_date: string
          id?: string
          mood?: number | null
          prompt?: string | null
          transit_context?: Json | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          entry_date?: string
          id?: string
          mood?: number | null
          prompt?: string | null
          transit_context?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kelly_sizing: {
        Row: {
          created_at: string | null
          id: string
          kelly_percentage: number | null
          market_id: string | null
          recommended_size: number | null
          signal_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kelly_percentage?: number | null
          market_id?: string | null
          recommended_size?: number | null
          signal_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kelly_percentage?: number | null
          market_id?: string | null
          recommended_size?: number | null
          signal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelly_sizing_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelly_sizing_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trade_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          blog_post_id: string | null
          created_at: string | null
          id: string
          keyword: string | null
          monthly_traffic: number | null
          ranking_position: number | null
          updated_at: string | null
        }
        Insert: {
          blog_post_id?: string | null
          created_at?: string | null
          id?: string
          keyword?: string | null
          monthly_traffic?: number | null
          ranking_position?: number | null
          updated_at?: string | null
        }
        Update: {
          blog_post_id?: string | null
          created_at?: string | null
          id?: string
          keyword?: string | null
          monthly_traffic?: number | null
          ranking_position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keywords_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      kl_divergence_pairs: {
        Row: {
          divergence_score: number | null
          id: string
          identified_at: string | null
          market_id_1: string | null
          market_id_2: string | null
        }
        Insert: {
          divergence_score?: number | null
          id?: string
          identified_at?: string | null
          market_id_1?: string | null
          market_id_2?: string | null
        }
        Update: {
          divergence_score?: number | null
          id?: string
          identified_at?: string | null
          market_id_1?: string | null
          market_id_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kl_divergence_pairs_market_id_1_fkey"
            columns: ["market_id_1"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kl_divergence_pairs_market_id_2_fkey"
            columns: ["market_id_2"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      kronos_forecasts: {
        Row: {
          confidence_score: number
          created_at: string | null
          expires_at: string
          generated_at: string
          id: string
          p10: number
          p50: number
          p90: number
          skew: string
          skew_strength: number
          strategy_key: string
          symbol: string
          user_id: string
        }
        Insert: {
          confidence_score: number
          created_at?: string | null
          expires_at?: string
          generated_at?: string
          id?: string
          p10: number
          p50: number
          p90: number
          skew: string
          skew_strength?: number
          strategy_key: string
          symbol: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          expires_at?: string
          generated_at?: string
          id?: string
          p10?: number
          p50?: number
          p90?: number
          skew?: string
          skew_strength?: number
          strategy_key?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_analysis_jobs: {
        Row: {
          analysis_text: string | null
          biomarkers_json: Json | null
          clinic_document_id: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          file_name: string
          file_type: string
          herbs_json: Json | null
          id: string
          priority_actions_json: Json | null
          status: string
          storage_path: string
          supplements_json: Json | null
          textract_raw_json: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_text?: string | null
          biomarkers_json?: Json | null
          clinic_document_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          file_name: string
          file_type: string
          herbs_json?: Json | null
          id?: string
          priority_actions_json?: Json | null
          status?: string
          storage_path: string
          supplements_json?: Json | null
          textract_raw_json?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_text?: string | null
          biomarkers_json?: Json | null
          clinic_document_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          file_name?: string
          file_type?: string
          herbs_json?: Json | null
          id?: string
          priority_actions_json?: Json | null
          status?: string
          storage_path?: string
          supplements_json?: Json | null
          textract_raw_json?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_markers: {
        Row: {
          collected_at: string
          created_at: string | null
          id: string
          marker_name: string
          marker_value: number
          optimal_range_high: number | null
          optimal_range_low: number | null
          reference_range_high: number | null
          reference_range_low: number | null
          source: string | null
          unit: string
          user_id: string
        }
        Insert: {
          collected_at: string
          created_at?: string | null
          id?: string
          marker_name: string
          marker_value: number
          optimal_range_high?: number | null
          optimal_range_low?: number | null
          reference_range_high?: number | null
          reference_range_low?: number | null
          source?: string | null
          unit: string
          user_id: string
        }
        Update: {
          collected_at?: string
          created_at?: string | null
          id?: string
          marker_name?: string
          marker_value?: number
          optimal_range_high?: number | null
          optimal_range_low?: number | null
          reference_range_high?: number | null
          reference_range_low?: number | null
          source?: string | null
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_panels: {
        Row: {
          biomarkers_json: Json | null
          created_at: string | null
          date: string
          file_url: string | null
          id: string
          name: string
          notes: string | null
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          biomarkers_json?: Json | null
          created_at?: string | null
          date: string
          file_url?: string | null
          id?: string
          name: string
          notes?: string | null
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          biomarkers_json?: Json | null
          created_at?: string | null
          date?: string
          file_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lab_synthesis_results: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          model_used: string | null
          narrative: string | null
          panel_count: number
          panels_summary_json: Json
          patterns_json: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          model_used?: string | null
          narrative?: string | null
          panel_count?: number
          panels_summary_json?: Json
          patterns_json?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          model_used?: string | null
          narrative?: string | null
          panel_count?: number
          panels_summary_json?: Json
          patterns_json?: Json
          user_id?: string
        }
        Relationships: []
      }
      lab_upload_chunks: {
        Row: {
          base64_data: string
          chunk_index: number
          created_at: string
          file_name: string
          mime_type: string
          total_chunks: number
          upload_id: string
          user_id: string
        }
        Insert: {
          base64_data: string
          chunk_index: number
          created_at?: string
          file_name: string
          mime_type: string
          total_chunks: number
          upload_id: string
          user_id: string
        }
        Update: {
          base64_data?: string
          chunk_index?: number
          created_at?: string
          file_name?: string
          mime_type?: string
          total_chunks?: number
          upload_id?: string
          user_id?: string
        }
        Relationships: []
      }
      lifestyle_profiles: {
        Row: {
          cooking_skill: string | null
          created_at: string | null
          diet_type: string | null
          exercise_frequency: number | null
          exercise_types: string[] | null
          id: string
          shopping_cadence: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          stress_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cooking_skill?: string | null
          created_at?: string | null
          diet_type?: string | null
          exercise_frequency?: number | null
          exercise_types?: string[] | null
          id?: string
          shopping_cadence?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cooking_skill?: string | null
          created_at?: string | null
          diet_type?: string | null
          exercise_frequency?: number | null
          exercise_types?: string[] | null
          id?: string
          shopping_cadence?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lmsr_divergence: {
        Row: {
          divergence_value: number | null
          id: string
          identified_at: string | null
          market_id: string | null
        }
        Insert: {
          divergence_value?: number | null
          id?: string
          identified_at?: string | null
          market_id?: string | null
        }
        Update: {
          divergence_value?: number | null
          id?: string
          identified_at?: string | null
          market_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lmsr_divergence_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_analysis: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          id: string
          market_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          market_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          market_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_analysis_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_outcomes: {
        Row: {
          id: string
          last_price: number | null
          market_id: string
          outcome_text: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          last_price?: number | null
          market_id: string
          outcome_text: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          last_price?: number | null
          market_id?: string
          outcome_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_outcomes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          created_at: string | null
          id: string
          polymarket_id: string
          question: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          polymarket_id: string
          question: string
        }
        Update: {
          created_at?: string | null
          id?: string
          polymarket_id?: string
          question?: string
        }
        Relationships: []
      }
      mc_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          action_needed: string | null
          id: string
          issue: string
          severity: string
          system: string
          timestamp: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          action_needed?: string | null
          id?: string
          issue?: string
          severity?: string
          system?: string
          timestamp?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          action_needed?: string | null
          id?: string
          issue?: string
          severity?: string
          system?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      mc_chat_messages: {
        Row: {
          channel: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read_by: Json | null
          sender: string
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read_by?: Json | null
          sender: string
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read_by?: Json | null
          sender?: string
        }
        Relationships: []
      }
      mc_cost_log: {
        Row: {
          cost_amount: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          project_id: string | null
          service: string | null
        }
        Insert: {
          cost_amount?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          service?: string | null
        }
        Update: {
          cost_amount?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          service?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mc_cost_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mc_notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          recipient: string
          source: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          recipient: string
          source?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          recipient?: string
          source?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      mc_orchestrator_state: {
        Row: {
          state_data: Json
          system: string
          updated_at: string | null
        }
        Insert: {
          state_data?: Json
          system: string
          updated_at?: string | null
        }
        Update: {
          state_data?: Json
          system?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mc_outreach_campaigns: {
        Row: {
          avg_response_time_hours: number | null
          conversion_rate: number | null
          created_at: string | null
          email_template: string | null
          id: string
          name: string | null
          project_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avg_response_time_hours?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          email_template?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avg_response_time_hours?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          email_template?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mc_outreach_campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mc_outreach_domains: {
        Row: {
          bounce_rate: number | null
          created_at: string | null
          domain: string | null
          health_score: number | null
          id: string
          last_checked: string | null
        }
        Insert: {
          bounce_rate?: number | null
          created_at?: string | null
          domain?: string | null
          health_score?: number | null
          id?: string
          last_checked?: string | null
        }
        Update: {
          bounce_rate?: number | null
          created_at?: string | null
          domain?: string | null
          health_score?: number | null
          id?: string
          last_checked?: string | null
        }
        Relationships: []
      }
      mc_outreach_leads: {
        Row: {
          assigned_agent_id: string | null
          campaign: string | null
          city: string | null
          company: string | null
          company_name: string
          contacts: Json | null
          country: string | null
          created_at: string | null
          date_detected: string | null
          deal_value: number | null
          email: string | null
          email_opened: boolean | null
          email_replied: boolean | null
          email_sent: boolean | null
          employee_count: number | null
          enriched_data: Json | null
          estimated_revenue: string | null
          industry: string | null
          last_action: string | null
          last_action_date: string | null
          lead_id: string
          lead_score: number | null
          meeting_booked: boolean | null
          meeting_date: string | null
          name: string | null
          news_summary: string | null
          notes: string | null
          personalization_brief: string | null
          pipeline_stage: string | null
          reply_sentiment: string | null
          review_summary: string | null
          signal_id: string | null
          signal_strength: string | null
          signal_type: string | null
          source: string | null
          state: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          campaign?: string | null
          city?: string | null
          company?: string | null
          company_name?: string
          contacts?: Json | null
          country?: string | null
          created_at?: string | null
          date_detected?: string | null
          deal_value?: number | null
          email?: string | null
          email_opened?: boolean | null
          email_replied?: boolean | null
          email_sent?: boolean | null
          employee_count?: number | null
          enriched_data?: Json | null
          estimated_revenue?: string | null
          industry?: string | null
          last_action?: string | null
          last_action_date?: string | null
          lead_id?: string
          lead_score?: number | null
          meeting_booked?: boolean | null
          meeting_date?: string | null
          name?: string | null
          news_summary?: string | null
          notes?: string | null
          personalization_brief?: string | null
          pipeline_stage?: string | null
          reply_sentiment?: string | null
          review_summary?: string | null
          signal_id?: string | null
          signal_strength?: string | null
          signal_type?: string | null
          source?: string | null
          state?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          campaign?: string | null
          city?: string | null
          company?: string | null
          company_name?: string
          contacts?: Json | null
          country?: string | null
          created_at?: string | null
          date_detected?: string | null
          deal_value?: number | null
          email?: string | null
          email_opened?: boolean | null
          email_replied?: boolean | null
          email_sent?: boolean | null
          employee_count?: number | null
          enriched_data?: Json | null
          estimated_revenue?: string | null
          industry?: string | null
          last_action?: string | null
          last_action_date?: string | null
          lead_id?: string
          lead_score?: number | null
          meeting_booked?: boolean | null
          meeting_date?: string | null
          name?: string | null
          news_summary?: string | null
          notes?: string | null
          personalization_brief?: string | null
          pipeline_stage?: string | null
          reply_sentiment?: string | null
          review_summary?: string | null
          signal_id?: string | null
          signal_strength?: string | null
          signal_type?: string | null
          source?: string | null
          state?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mc_outreach_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mc_outreach_leads_campaign_fkey"
            columns: ["campaign"]
            isOneToOne: false
            referencedRelation: "mc_outreach_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mc_outreach_leads_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "mc_outreach_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      mc_outreach_replies: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          replied_at: string | null
          reply_text: string | null
          sentiment: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          replied_at?: string | null
          reply_text?: string | null
          sentiment?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          replied_at?: string | null
          reply_text?: string | null
          sentiment?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mc_outreach_replies_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mc_outreach_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mc_outreach_replies_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "mc_outreach_leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      mc_outreach_sequences: {
        Row: {
          active_leads_count: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          steps: Json | null
          total_enrolled: number | null
          updated_at: string | null
        }
        Insert: {
          active_leads_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          steps?: Json | null
          total_enrolled?: number | null
          updated_at?: string | null
        }
        Update: {
          active_leads_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          steps?: Json | null
          total_enrolled?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mc_outreach_signals: {
        Row: {
          id: string
          identified_at: string | null
          priority: string | null
          project_id: string | null
          signal_data: Json | null
          source: string | null
        }
        Insert: {
          id?: string
          identified_at?: string | null
          priority?: string | null
          project_id?: string | null
          signal_data?: Json | null
          source?: string | null
        }
        Update: {
          id?: string
          identified_at?: string | null
          priority?: string | null
          project_id?: string | null
          signal_data?: Json | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mc_outreach_signals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mc_outreach_templates: {
        Row: {
          body: string
          campaign: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          subject: string | null
          type: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          body?: string
          campaign?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          subject?: string | null
          type?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          body?: string
          campaign?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          subject?: string | null
          type?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      mc_seo_articles: {
        Row: {
          competitive_advantage: string | null
          content_gaps_filled: string[] | null
          cost_usd: number | null
          created_at: string | null
          day14_traffic: number | null
          day2_indexed: boolean | null
          day30_analysis: string | null
          day7_ranking: number | null
          id: string
          keyword: string
          keyword_id: string | null
          meta_description: string | null
          published_at: string | null
          secondary_keywords: string[] | null
          seo_score: number | null
          slug: string | null
          status: string | null
          title: string
          validation_score: number | null
          word_count: number | null
          wordpress_post_id: string | null
          wordpress_url: string | null
        }
        Insert: {
          competitive_advantage?: string | null
          content_gaps_filled?: string[] | null
          cost_usd?: number | null
          created_at?: string | null
          day14_traffic?: number | null
          day2_indexed?: boolean | null
          day30_analysis?: string | null
          day7_ranking?: number | null
          id?: string
          keyword: string
          keyword_id?: string | null
          meta_description?: string | null
          published_at?: string | null
          secondary_keywords?: string[] | null
          seo_score?: number | null
          slug?: string | null
          status?: string | null
          title: string
          validation_score?: number | null
          word_count?: number | null
          wordpress_post_id?: string | null
          wordpress_url?: string | null
        }
        Update: {
          competitive_advantage?: string | null
          content_gaps_filled?: string[] | null
          cost_usd?: number | null
          created_at?: string | null
          day14_traffic?: number | null
          day2_indexed?: boolean | null
          day30_analysis?: string | null
          day7_ranking?: number | null
          id?: string
          keyword?: string
          keyword_id?: string | null
          meta_description?: string | null
          published_at?: string | null
          secondary_keywords?: string[] | null
          seo_score?: number | null
          slug?: string | null
          status?: string | null
          title?: string
          validation_score?: number | null
          word_count?: number | null
          wordpress_post_id?: string | null
          wordpress_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mc_seo_articles_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "mc_seo_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      mc_seo_daily_snapshots: {
        Row: {
          avg_ctr: number | null
          avg_position: number | null
          clicks_wow_change: number | null
          content_recommendations: Json | null
          created_at: string | null
          ctr_wow_change: number | null
          date: string
          grade: string | null
          grade_score: number | null
          high_impression_low_click: number | null
          id: string
          impressions_wow_change: number | null
          position_wow_change: number | null
          site: string
          striking_distance_keywords: number | null
          total_clicks: number | null
          total_impressions: number | null
          total_pages: number | null
          total_queries: number | null
        }
        Insert: {
          avg_ctr?: number | null
          avg_position?: number | null
          clicks_wow_change?: number | null
          content_recommendations?: Json | null
          created_at?: string | null
          ctr_wow_change?: number | null
          date?: string
          grade?: string | null
          grade_score?: number | null
          high_impression_low_click?: number | null
          id?: string
          impressions_wow_change?: number | null
          position_wow_change?: number | null
          site?: string
          striking_distance_keywords?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_pages?: number | null
          total_queries?: number | null
        }
        Update: {
          avg_ctr?: number | null
          avg_position?: number | null
          clicks_wow_change?: number | null
          content_recommendations?: Json | null
          created_at?: string | null
          ctr_wow_change?: number | null
          date?: string
          grade?: string | null
          grade_score?: number | null
          high_impression_low_click?: number | null
          id?: string
          impressions_wow_change?: number | null
          position_wow_change?: number | null
          site?: string
          striking_distance_keywords?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_pages?: number | null
          total_queries?: number | null
        }
        Relationships: []
      }
      mc_seo_keywords: {
        Row: {
          allintitle_count: number | null
          competition_level: string | null
          content_gaps: string[] | null
          content_strategy: string | null
          created_at: string | null
          id: string
          keyword: string
          priority: string | null
          reddit_engagement_avg: number | null
          reddit_posts: number | null
          search_volume_proxy: number | null
          status: string | null
          topic_id: string | null
          validation_score: number
        }
        Insert: {
          allintitle_count?: number | null
          competition_level?: string | null
          content_gaps?: string[] | null
          content_strategy?: string | null
          created_at?: string | null
          id?: string
          keyword: string
          priority?: string | null
          reddit_engagement_avg?: number | null
          reddit_posts?: number | null
          search_volume_proxy?: number | null
          status?: string | null
          topic_id?: string | null
          validation_score?: number
        }
        Update: {
          allintitle_count?: number | null
          competition_level?: string | null
          content_gaps?: string[] | null
          content_strategy?: string | null
          created_at?: string | null
          id?: string
          keyword?: string
          priority?: string | null
          reddit_engagement_avg?: number | null
          reddit_posts?: number | null
          search_volume_proxy?: number | null
          status?: string | null
          topic_id?: string | null
          validation_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "mc_seo_keywords_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "mc_seo_trends"
            referencedColumns: ["id"]
          },
        ]
      }
      mc_seo_trends: {
        Row: {
          content_angle: string | null
          discovered_at: string | null
          id: string
          longtail_variations: string[] | null
          niche: string | null
          question_formats: string[] | null
          sources: string[] | null
          status: string | null
          topic: string
          trend_score: number
        }
        Insert: {
          content_angle?: string | null
          discovered_at?: string | null
          id?: string
          longtail_variations?: string[] | null
          niche?: string | null
          question_formats?: string[] | null
          sources?: string[] | null
          status?: string | null
          topic: string
          trend_score: number
        }
        Update: {
          content_angle?: string | null
          discovered_at?: string | null
          id?: string
          longtail_variations?: string[] | null
          niche?: string | null
          question_formats?: string[] | null
          sources?: string[] | null
          status?: string | null
          topic?: string
          trend_score?: number
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          fat_g: number | null
          fiber_g: number | null
          food_quality_score: number | null
          glycemic_load_estimate: number | null
          id: string
          inflammatory_load_estimate: number | null
          meal_time: string
          meal_type: string
          notes: string | null
          protein_g: number | null
          tags_json: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_quality_score?: number | null
          glycemic_load_estimate?: number | null
          id?: string
          inflammatory_load_estimate?: number | null
          meal_time: string
          meal_type: string
          notes?: string | null
          protein_g?: number | null
          tags_json?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_quality_score?: number | null
          glycemic_load_estimate?: number | null
          id?: string
          inflammatory_load_estimate?: number | null
          meal_time?: string
          meal_type?: string
          notes?: string | null
          protein_g?: number | null
          tags_json?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string | null
          energy_level: number | null
          id: string
          mood_after: number | null
          mood_before: number | null
          notes: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          energy_level?: number | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          energy_level?: number | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_history: {
        Row: {
          created_at: string | null
          date: string
          id: string
          net_worth: number | null
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          net_worth?: number | null
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          net_worth?: number | null
          total_assets?: number
          total_liabilities?: number
          user_id?: string
        }
        Relationships: []
      }
      news_sentiment: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          mention_count: number | null
          score: number | null
          scraped_at: string
          sentiment: string | null
          source: string
          symbol: string
          title: string | null
          upvotes: number | null
          url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          mention_count?: number | null
          score?: number | null
          scraped_at?: string
          sentiment?: string | null
          source: string
          symbol: string
          title?: string | null
          upvotes?: number | null
          url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          mention_count?: number | null
          score?: number | null
          scraped_at?: string
          sentiment?: string | null
          source?: string
          symbol?: string
          title?: string | null
          upvotes?: number | null
          url?: string | null
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          created_at: string | null
          daily_reading: boolean | null
          daily_time: string | null
          id: string
          moon_alerts: boolean | null
          personal_day: boolean | null
          transit_alerts: boolean | null
          tz: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_reading?: boolean | null
          daily_time?: string | null
          id?: string
          moon_alerts?: boolean | null
          personal_day?: boolean | null
          transit_alerts?: boolean | null
          tz?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_reading?: boolean | null
          daily_time?: string | null
          id?: string
          moon_alerts?: boolean | null
          personal_day?: boolean | null
          transit_alerts?: boolean | null
          tz?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notification_type: string
          payload_json: Json | null
          send_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          notification_type: string
          payload_json?: Json | null
          send_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notification_type?: string
          payload_json?: Json | null
          send_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notion_sync_log: {
        Row: {
          direction: string
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          notion_id: string
          status: string
          synced_at: string | null
        }
        Insert: {
          direction: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          notion_id: string
          status: string
          synced_at?: string | null
        }
        Update: {
          direction?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          notion_id?: string
          status?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      orderbook_snapshots: {
        Row: {
          best_ask: number | null
          best_bid: number | null
          id: string
          market_outcome_id: string
          timestamp: string | null
        }
        Insert: {
          best_ask?: number | null
          best_bid?: number | null
          id?: string
          market_outcome_id: string
          timestamp?: string | null
        }
        Update: {
          best_ask?: number | null
          best_bid?: number | null
          id?: string
          market_outcome_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orderbook_snapshots_market_outcome_id_fkey"
            columns: ["market_outcome_id"]
            isOneToOne: false
            referencedRelation: "market_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      outcome_log: {
        Row: {
          actual_direction: number
          actual_return: number
          alpha_vs_benchmark: number
          brier_score: number
          decision_id: string
          id: string
          metadata: Json | null
          resolved_at: string | null
          user_id: string
        }
        Insert: {
          actual_direction: number
          actual_return: number
          alpha_vs_benchmark: number
          brier_score: number
          decision_id: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          user_id: string
        }
        Update: {
          actual_direction?: number
          actual_return?: number
          alpha_vs_benchmark?: number
          brier_score?: number
          decision_id?: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outcome_log_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decision_log"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_positions: {
        Row: {
          asset_class: string
          closed_at: string | null
          current_price: number | null
          direction: string
          entry_price: number
          exit_price: number | null
          exit_reason: string | null
          id: string
          max_hold_hours: number
          metadata: Json
          notional_usd: number
          opened_at: string
          quantity: number
          realized_pnl_pct: number | null
          realized_pnl_usd: number | null
          status: string
          stop_loss_pct: number
          strategy_key: string
          symbol: string
          take_profit_pct: number
          unrealized_pnl_pct: number | null
          unrealized_pnl_usd: number | null
          user_id: string
        }
        Insert: {
          asset_class: string
          closed_at?: string | null
          current_price?: number | null
          direction: string
          entry_price: number
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          max_hold_hours?: number
          metadata?: Json
          notional_usd: number
          opened_at?: string
          quantity: number
          realized_pnl_pct?: number | null
          realized_pnl_usd?: number | null
          status?: string
          stop_loss_pct?: number
          strategy_key: string
          symbol: string
          take_profit_pct?: number
          unrealized_pnl_pct?: number | null
          unrealized_pnl_usd?: number | null
          user_id: string
        }
        Update: {
          asset_class?: string
          closed_at?: string | null
          current_price?: number | null
          direction?: string
          entry_price?: number
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          max_hold_hours?: number
          metadata?: Json
          notional_usd?: number
          opened_at?: string
          quantity?: number
          realized_pnl_pct?: number | null
          realized_pnl_usd?: number | null
          status?: string
          stop_loss_pct?: number
          strategy_key?: string
          symbol?: string
          take_profit_pct?: number
          unrealized_pnl_pct?: number | null
          unrealized_pnl_usd?: number | null
          user_id?: string
        }
        Relationships: []
      }
      paper_trade_runs: {
        Row: {
          created_at: string | null
          decisions_block: number
          decisions_execute: number
          errors: Json | null
          id: string
          opportunities_found: number
          positions_closed: number
          positions_opened: number
          regime: string | null
          run_at: string
          skipped: Json | null
          skipped_details: Json | null
          strategies_run: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          decisions_block?: number
          decisions_execute?: number
          errors?: Json | null
          id?: string
          opportunities_found?: number
          positions_closed?: number
          positions_opened?: number
          regime?: string | null
          run_at: string
          skipped?: Json | null
          skipped_details?: Json | null
          strategies_run?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          decisions_block?: number
          decisions_execute?: number
          errors?: Json | null
          id?: string
          opportunities_found?: number
          positions_closed?: number
          positions_opened?: number
          regime?: string | null
          run_at?: string
          skipped?: Json | null
          skipped_details?: Json | null
          strategies_run?: number
          user_id?: string
        }
        Relationships: []
      }
      paper_trades: {
        Row: {
          asset_class: string
          created_at: string
          direction: string
          fill_price: number
          id: string
          metadata: Json
          notional_usd: number
          opportunity_id: string | null
          position_id: string | null
          quantity: number
          side: string
          slippage_bps: number
          strategy_key: string
          symbol: string
          user_id: string
        }
        Insert: {
          asset_class: string
          created_at?: string
          direction: string
          fill_price: number
          id?: string
          metadata?: Json
          notional_usd: number
          opportunity_id?: string | null
          position_id?: string | null
          quantity: number
          side: string
          slippage_bps?: number
          strategy_key: string
          symbol: string
          user_id: string
        }
        Update: {
          asset_class?: string
          created_at?: string
          direction?: string
          fill_price?: number
          id?: string
          metadata?: Json
          notional_usd?: number
          opportunity_id?: string | null
          position_id?: string | null
          quantity?: number
          side?: string
          slippage_bps?: number
          strategy_key?: string
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_trades_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "paper_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string | null
          id: string
          invite_code: string
          invitee_email: string | null
          inviter_user_id: string
          lens: string | null
          reward_granted: boolean | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string | null
          id?: string
          invite_code: string
          invitee_email?: string | null
          inviter_user_id: string
          lens?: string | null
          reward_granted?: boolean | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string | null
          id?: string
          invite_code?: string
          invitee_email?: string | null
          inviter_user_id?: string
          lens?: string | null
          reward_granted?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_invites_accepted_user_id_fkey"
            columns: ["accepted_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_invites_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_links: {
        Row: {
          a_share_prefs: Json | null
          b_share_prefs: Json | null
          created_at: string | null
          id: string
          lens: string | null
          status: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          a_share_prefs?: Json | null
          b_share_prefs?: Json | null
          created_at?: string | null
          id?: string
          lens?: string | null
          status?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          a_share_prefs?: Json | null
          b_share_prefs?: Json | null
          created_at?: string | null
          id?: string
          lens?: string | null
          status?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_links_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_links_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_analysis_log: {
        Row: {
          agent_name: string
          analysis_id: string
          analysis_timestamp: string | null
          avg_cost_per_run: number | null
          avg_outcome_score: number | null
          confidence_level: string | null
          cost_delta: number | null
          created_at: string | null
          date_range_end: string | null
          date_range_start: string | null
          executive_summary: string | null
          full_report: Json | null
          id: string
          optimization_warranted: boolean | null
          overall_health_score: number | null
          records_analyzed: number | null
          score_delta: number | null
        }
        Insert: {
          agent_name: string
          analysis_id: string
          analysis_timestamp?: string | null
          avg_cost_per_run?: number | null
          avg_outcome_score?: number | null
          confidence_level?: string | null
          cost_delta?: number | null
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          executive_summary?: string | null
          full_report?: Json | null
          id?: string
          optimization_warranted?: boolean | null
          overall_health_score?: number | null
          records_analyzed?: number | null
          score_delta?: number | null
        }
        Update: {
          agent_name?: string
          analysis_id?: string
          analysis_timestamp?: string | null
          avg_cost_per_run?: number | null
          avg_outcome_score?: number | null
          confidence_level?: string | null
          cost_delta?: number | null
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          executive_summary?: string | null
          full_report?: Json | null
          id?: string
          optimization_warranted?: boolean | null
          overall_health_score?: number | null
          records_analyzed?: number | null
          score_delta?: number | null
        }
        Relationships: []
      }
      placements: {
        Row: {
          blueprint_id: string
          detail: Json | null
          id: string
          key: string
          label: string
          system: string
        }
        Insert: {
          blueprint_id: string
          detail?: Json | null
          id?: string
          key: string
          label: string
          system: string
        }
        Update: {
          blueprint_id?: string
          detail?: Json | null
          id?: string
          key?: string
          label?: string
          system?: string
        }
        Relationships: [
          {
            foreignKeyName: "placements_blueprint_id_fkey"
            columns: ["blueprint_id"]
            isOneToOne: false
            referencedRelation: "blueprints"
            referencedColumns: ["id"]
          },
        ]
      }
      polymarket_engine_fills: {
        Row: {
          condition_id: string
          exit_order_id: string | null
          fee_cents: number
          filled_at: string
          hard_exit: boolean | null
          id: string
          market_id: string
          metadata: Json | null
          order_id: string
          pnl_usdc: number | null
          price: number
          recorded_at: string | null
          side: string
          size: number
          strategy_key: string
          user_id: string | null
        }
        Insert: {
          condition_id: string
          exit_order_id?: string | null
          fee_cents?: number
          filled_at: string
          hard_exit?: boolean | null
          id?: string
          market_id: string
          metadata?: Json | null
          order_id: string
          pnl_usdc?: number | null
          price: number
          recorded_at?: string | null
          side: string
          size: number
          strategy_key?: string
          user_id?: string | null
        }
        Update: {
          condition_id?: string
          exit_order_id?: string | null
          fee_cents?: number
          filled_at?: string
          hard_exit?: boolean | null
          id?: string
          market_id?: string
          metadata?: Json | null
          order_id?: string
          pnl_usdc?: number | null
          price?: number
          recorded_at?: string | null
          side?: string
          size?: number
          strategy_key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio: {
        Row: {
          cash_available: number | null
          id: string
          invested: number | null
          realized_pnl: number | null
          total_value: number | null
          unrealized_pnl: number | null
          updated_at: string | null
        }
        Insert: {
          cash_available?: number | null
          id?: string
          invested?: number | null
          realized_pnl?: number | null
          total_value?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
        }
        Update: {
          cash_available?: number | null
          id?: string
          invested?: number | null
          realized_pnl?: number | null
          total_value?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          closed_at: string | null
          created_at: string | null
          current_price: number | null
          entry_price: number | null
          id: string
          market_id: string | null
          quantity: number | null
          trade_id: string | null
          unrealized_pnl: number | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number | null
          id?: string
          market_id?: string | null
          quantity?: number | null
          trade_id?: string | null
          unrealized_pnl?: number | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number | null
          id?: string
          market_id?: string | null
          quantity?: number | null
          trade_id?: string | null
          unrealized_pnl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_flags: {
        Row: {
          created_at: string | null
          date: string
          evidence_json: Json | null
          flag_type: string
          id: string
          resolved: boolean | null
          severity: string
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          evidence_json?: Json | null
          flag_type: string
          id?: string
          resolved?: boolean | null
          severity: string
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          evidence_json?: Json | null
          flag_type?: string
          id?: string
          resolved?: boolean | null
          severity?: string
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      practitioner_patient_assignments: {
        Row: {
          assigned_at: string | null
          created_at: string | null
          id: string
          patient_id: string
          practitioner_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          patient_id: string
          practitioner_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string
          practitioner_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      probability_forecasts: {
        Row: {
          created_at: string | null
          fair_probability: number
          id: string
          market_outcome_id: string
        }
        Insert: {
          created_at?: string | null
          fair_probability: number
          id?: string
          market_outcome_id: string
        }
        Update: {
          created_at?: string | null
          fair_probability?: number
          id?: string
          market_outcome_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "probability_forecasts_market_outcome_id_fkey"
            columns: ["market_outcome_id"]
            isOneToOne: false
            referencedRelation: "market_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_db_change_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          payload: Json
          request_type: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          payload: Json
          request_type: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          payload?: Json
          request_type?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      product_sources: {
        Row: {
          brand_id: string | null
          brand_name_snapshot: string | null
          created_at: string
          db_version: number
          id: string
          last_verified_at: string | null
          source_url: string
          what_it_supports: string | null
        }
        Insert: {
          brand_id?: string | null
          brand_name_snapshot?: string | null
          created_at?: string
          db_version?: number
          id?: string
          last_verified_at?: string | null
          source_url: string
          what_it_supports?: string | null
        }
        Update: {
          brand_id?: string | null
          brand_name_snapshot?: string | null
          created_at?: string
          db_version?: number
          id?: string
          last_verified_at?: string | null
          source_url?: string
          what_it_supports?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sources_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "approved_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          birth_profile_id: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          goals: string[] | null
          height: number | null
          id: string
          last_active_at: string | null
          last_name: string | null
          minute_credits: number
          onboarding_completed: boolean | null
          phone: string | null
          preferred_name: string | null
          role: string
          sex: string | null
          subscription_tier: string
          timezone: string | null
          updated_at: string | null
          voice_preference: string | null
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          birth_profile_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          goals?: string[] | null
          height?: number | null
          id: string
          last_active_at?: string | null
          last_name?: string | null
          minute_credits?: number
          onboarding_completed?: boolean | null
          phone?: string | null
          preferred_name?: string | null
          role?: string
          sex?: string | null
          subscription_tier?: string
          timezone?: string | null
          updated_at?: string | null
          voice_preference?: string | null
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          birth_profile_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          goals?: string[] | null
          height?: number | null
          id?: string
          last_active_at?: string | null
          last_name?: string | null
          minute_credits?: number
          onboarding_completed?: boolean | null
          phone?: string | null
          preferred_name?: string | null
          role?: string
          sex?: string | null
          subscription_tier?: string
          timezone?: string | null
          updated_at?: string | null
          voice_preference?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      program_enrollments: {
        Row: {
          completed_at: string | null
          current_day: number | null
          id: string
          program_id: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_day?: number | null
          id?: string
          program_id: string
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_day?: number | null
          id?: string
          program_id?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          session_count: number
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean | null
          session_count: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          session_count?: number
          title?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          notion_last_synced_at: string | null
          notion_page_id: string | null
          output_directory: string | null
          root_directory: string | null
          slug: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          notion_last_synced_at?: string | null
          notion_page_id?: string | null
          output_directory?: string | null
          root_directory?: string | null
          slug: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          notion_last_synced_at?: string | null
          notion_page_id?: string | null
          output_directory?: string | null
          root_directory?: string | null
          slug?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          content: string
          id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_version_registry: {
        Row: {
          agent_name: string
          approval_status: string | null
          approval_tier: string | null
          approved_at: string | null
          avg_score: number | null
          change_log: string | null
          change_log_detail: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          run_count: number | null
          system_prompt: string
          version: string
        }
        Insert: {
          agent_name: string
          approval_status?: string | null
          approval_tier?: string | null
          approved_at?: string | null
          avg_score?: number | null
          change_log?: string | null
          change_log_detail?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          run_count?: number | null
          system_prompt: string
          version: string
        }
        Update: {
          agent_name?: string
          approval_status?: string | null
          approval_tier?: string | null
          approved_at?: string | null
          avg_score?: number | null
          change_log?: string | null
          change_log_detail?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          run_count?: number | null
          system_prompt?: string
          version?: string
        }
        Relationships: []
      }
      protocols: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          fasting_plan_json: Json | null
          id: string
          lifestyle_tasks_json: Json | null
          name: string
          peptides_json: Json | null
          start_date: string
          status: string | null
          supplements_json: Json | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          fasting_plan_json?: Json | null
          id?: string
          lifestyle_tasks_json?: Json | null
          name: string
          peptides_json?: Json | null
          start_date: string
          status?: string | null
          supplements_json?: Json | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          fasting_plan_json?: Json | null
          id?: string
          lifestyle_tasks_json?: Json | null
          name?: string
          peptides_json?: Json | null
          start_date?: string
          status?: string | null
          supplements_json?: Json | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          expo_token: string
          id: string
          platform: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expo_token: string
          id?: string
          platform?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expo_token?: string
          id?: string
          platform?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quant_signals: {
        Row: {
          combined_signal: Json | null
          confidence: number | null
          created_at: string | null
          final_recommendation: string | null
          id: string
          market_id: string | null
        }
        Insert: {
          combined_signal?: Json | null
          confidence?: number | null
          created_at?: string | null
          final_recommendation?: string | null
          id?: string
          market_id?: string | null
        }
        Update: {
          combined_signal?: Json | null
          confidence?: number | null
          created_at?: string | null
          final_recommendation?: string | null
          id?: string
          market_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quant_signals_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_responses: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          question_id: string
          severity: number
          timestamp: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          question_id: string
          severity?: number
          timestamp?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          question_id?: string
          severity?: number
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      raw_health_events: {
        Row: {
          id: string
          imported_at: string | null
          payload_json: Json
          provider: string
          provider_record_id: string | null
          record_type: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          id?: string
          imported_at?: string | null
          payload_json?: Json
          provider: string
          provider_record_id?: string | null
          record_type: string
          recorded_at: string
          user_id: string
        }
        Update: {
          id?: string
          imported_at?: string | null
          payload_json?: Json
          provider?: string
          provider_record_id?: string | null
          record_type?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rebalance_suggestions: {
        Row: {
          action: string
          asset_class: string
          blocked_reason: string | null
          created_at: string | null
          current_pct: number | null
          drift_pct: number | null
          executed_at: string | null
          id: string
          status: string | null
          suggested_notional: number | null
          symbol: string | null
          target_pct: number | null
          tax_drag_usd: number | null
          tax_warning: string | null
          user_id: string
        }
        Insert: {
          action: string
          asset_class: string
          blocked_reason?: string | null
          created_at?: string | null
          current_pct?: number | null
          drift_pct?: number | null
          executed_at?: string | null
          id?: string
          status?: string | null
          suggested_notional?: number | null
          symbol?: string | null
          target_pct?: number | null
          tax_drag_usd?: number | null
          tax_warning?: string | null
          user_id: string
        }
        Update: {
          action?: string
          asset_class?: string
          blocked_reason?: string | null
          created_at?: string | null
          current_pct?: number | null
          drift_pct?: number | null
          executed_at?: string | null
          id?: string
          status?: string | null
          suggested_notional?: number | null
          symbol?: string | null
          target_pct?: number | null
          tax_drag_usd?: number | null
          tax_warning?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recommendation_categories: {
        Row: {
          best_use: string | null
          category_name: string
          core_products_summary: string | null
          created_at: string
          db_version: number
          id: string
          when_not_to_use: string | null
        }
        Insert: {
          best_use?: string | null
          category_name: string
          core_products_summary?: string | null
          created_at?: string
          db_version?: number
          id?: string
          when_not_to_use?: string | null
        }
        Update: {
          best_use?: string | null
          category_name?: string
          core_products_summary?: string | null
          created_at?: string
          db_version?: number
          id?: string
          when_not_to_use?: string | null
        }
        Relationships: []
      }
      recommendation_renders: {
        Row: {
          copy_generated: string | null
          db_version_used: number
          exclusions: string[]
          finding_tags: string[]
          id: string
          products_returned: Json
          rendered_at: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          copy_generated?: string | null
          db_version_used: number
          exclusions?: string[]
          finding_tags?: string[]
          id?: string
          products_returned?: Json
          rendered_at?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          copy_generated?: string | null
          db_version_used?: number
          exclusions?: string[]
          finding_tags?: string[]
          id?: string
          products_returned?: Json
          rendered_at?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_renders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visual_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_rules: {
        Row: {
          avoid_caution: string | null
          category_id: string | null
          created_at: string
          db_version: number
          example_copy_template: string | null
          finding_tag: string
          id: string
          preferred_products_summary: string | null
          primary_category: string | null
          threshold_trigger: string | null
        }
        Insert: {
          avoid_caution?: string | null
          category_id?: string | null
          created_at?: string
          db_version?: number
          example_copy_template?: string | null
          finding_tag: string
          id?: string
          preferred_products_summary?: string | null
          primary_category?: string | null
          threshold_trigger?: string | null
        }
        Update: {
          avoid_caution?: string | null
          category_id?: string | null
          created_at?: string
          db_version?: number
          example_copy_template?: string | null
          finding_tag?: string
          id?: string
          preferred_products_summary?: string | null
          primary_category?: string | null
          threshold_trigger?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "recommendation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          invite_id: string | null
          referred_user_id: string
          referrer_user_id: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invite_id?: string | null
          referred_user_id: string
          referrer_user_id: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invite_id?: string | null
          referred_user_id?: string
          referrer_user_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "partner_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_profiles: {
        Row: {
          alloc_crypto: number
          alloc_forex: number
          alloc_multi_asset: number
          alloc_options: number
          alloc_polymarket: number
          alloc_stocks: number
          auto_retirement_brier_threshold: number
          confluence_strength_override: number | null
          confluence_threshold: number
          description: string
          display_name: string
          hedge_sleeve_pct_target: number
          max_concurrent_positions: number
          position_cap_pct: number
          profile_key: string
          sort_order: number
          stop_loss_multiplier: number
        }
        Insert: {
          alloc_crypto?: number
          alloc_forex?: number
          alloc_multi_asset?: number
          alloc_options?: number
          alloc_polymarket?: number
          alloc_stocks?: number
          auto_retirement_brier_threshold?: number
          confluence_strength_override?: number | null
          confluence_threshold?: number
          description: string
          display_name: string
          hedge_sleeve_pct_target?: number
          max_concurrent_positions?: number
          position_cap_pct?: number
          profile_key: string
          sort_order?: number
          stop_loss_multiplier?: number
        }
        Update: {
          alloc_crypto?: number
          alloc_forex?: number
          alloc_multi_asset?: number
          alloc_options?: number
          alloc_polymarket?: number
          alloc_stocks?: number
          auto_retirement_brier_threshold?: number
          confluence_strength_override?: number | null
          confluence_threshold?: number
          description?: string
          display_name?: string
          hedge_sleeve_pct_target?: number
          max_concurrent_positions?: number
          position_cap_pct?: number
          profile_key?: string
          sort_order?: number
          stop_loss_multiplier?: number
        }
        Relationships: []
      }
      rituals: {
        Row: {
          active_window: Json | null
          id: string
          moon_phase: string
          steps: Json | null
          title: string
        }
        Insert: {
          active_window?: Json | null
          id?: string
          moon_phase: string
          steps?: Json | null
          title: string
        }
        Update: {
          active_window?: Json | null
          id?: string
          moon_phase?: string
          steps?: Json | null
          title?: string
        }
        Relationships: []
      }
      run_history: {
        Row: {
          agent_id: string | null
          artifacts: Json | null
          cost_usd: number | null
          duration_ms: number | null
          ended_at: string | null
          error_message: string | null
          id: string
          input_tokens: number | null
          log_output: string | null
          model_used: string | null
          outcome_score: number | null
          output_tokens: number | null
          project_id: string | null
          started_at: string | null
          status: string
          task_id: string | null
        }
        Insert: {
          agent_id?: string | null
          artifacts?: Json | null
          cost_usd?: number | null
          duration_ms?: number | null
          ended_at?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          log_output?: string | null
          model_used?: string | null
          outcome_score?: number | null
          output_tokens?: number | null
          project_id?: string | null
          started_at?: string | null
          status: string
          task_id?: string | null
        }
        Update: {
          agent_id?: string | null
          artifacts?: Json | null
          cost_usd?: number | null
          duration_ms?: number | null
          ended_at?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          log_output?: string | null
          model_used?: string | null
          outcome_score?: number | null
          output_tokens?: number | null
          project_id?: string | null
          started_at?: string | null
          status?: string
          task_id?: string | null
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          ref_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          ref_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          ref_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_jobs: {
        Row: {
          agent_id: string | null
          created_at: string | null
          cron_expression: string
          description: string | null
          enabled: boolean | null
          fail_count: number | null
          id: string
          is_running: boolean | null
          job_type: string
          last_run_at: string | null
          last_run_output: string | null
          last_run_status: string | null
          name: string
          next_run_at: string | null
          prevent_overlap: boolean | null
          project_id: string | null
          run_count: number | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          cron_expression: string
          description?: string | null
          enabled?: boolean | null
          fail_count?: number | null
          id?: string
          is_running?: boolean | null
          job_type: string
          last_run_at?: string | null
          last_run_output?: string | null
          last_run_status?: string | null
          name: string
          next_run_at?: string | null
          prevent_overlap?: boolean | null
          project_id?: string | null
          run_count?: number | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          cron_expression?: string
          description?: string | null
          enabled?: boolean | null
          fail_count?: number | null
          id?: string
          is_running?: boolean | null
          job_type?: string
          last_run_at?: string | null
          last_run_output?: string | null
          last_run_status?: string | null
          name?: string
          next_run_at?: string | null
          prevent_overlap?: boolean | null
          project_id?: string | null
          run_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_jobs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          session_id: string
          updated_at: string | null
          version: number
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          session_id: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          session_id?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "scripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_sites: {
        Row: {
          brand_voice: string | null
          created_at: string | null
          domain: string
          id: string
          name: string
          niche: string | null
          notion_database_id: string | null
          target_audience: string | null
        }
        Insert: {
          brand_voice?: string | null
          created_at?: string | null
          domain: string
          id?: string
          name: string
          niche?: string | null
          notion_database_id?: string | null
          target_audience?: string | null
        }
        Update: {
          brand_voice?: string | null
          created_at?: string | null
          domain?: string
          id?: string
          name?: string
          niche?: string | null
          notion_database_id?: string | null
          target_audience?: string | null
        }
        Relationships: []
      }
      session_feedback: {
        Row: {
          areas_to_adjust: string | null
          created_at: string | null
          effectiveness_rating: number | null
          id: string
          session_id: string
          technique_resonance: string[] | null
          user_id: string
        }
        Insert: {
          areas_to_adjust?: string | null
          created_at?: string | null
          effectiveness_rating?: number | null
          id?: string
          session_id: string
          technique_resonance?: string[] | null
          user_id: string
        }
        Update: {
          areas_to_adjust?: string | null
          created_at?: string | null
          effectiveness_rating?: number | null
          id?: string
          session_id?: string
          technique_resonance?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          focus_category: string
          id: string
          intake_id: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          focus_category: string
          id?: string
          intake_id: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          focus_category?: string
          id?: string
          intake_id?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_positions: {
        Row: {
          asset_class: string
          created_at: string | null
          current_price: number | null
          direction: string
          exit_price: number | null
          exit_reason: string | null
          id: string
          max_hold_hours: number
          realized_pnl_pct: number | null
          realized_pnl_usd: number | null
          resolved_at: string | null
          skip_detail: string | null
          skip_reason: string
          status: string
          stop_loss_pct: number
          strategy_key: string
          symbol: string
          take_profit_pct: number
          unrealized_pnl_pct: number | null
          unrealized_pnl_usd: number | null
          user_id: string
          would_have_notional: number
          would_have_price: number
          would_have_quantity: number
        }
        Insert: {
          asset_class: string
          created_at?: string | null
          current_price?: number | null
          direction?: string
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          max_hold_hours?: number
          realized_pnl_pct?: number | null
          realized_pnl_usd?: number | null
          resolved_at?: string | null
          skip_detail?: string | null
          skip_reason: string
          status?: string
          stop_loss_pct?: number
          strategy_key: string
          symbol: string
          take_profit_pct?: number
          unrealized_pnl_pct?: number | null
          unrealized_pnl_usd?: number | null
          user_id: string
          would_have_notional?: number
          would_have_price: number
          would_have_quantity: number
        }
        Update: {
          asset_class?: string
          created_at?: string | null
          current_price?: number | null
          direction?: string
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          max_hold_hours?: number
          realized_pnl_pct?: number | null
          realized_pnl_usd?: number | null
          resolved_at?: string | null
          skip_detail?: string | null
          skip_reason?: string
          status?: string
          stop_loss_pct?: number
          strategy_key?: string
          symbol?: string
          take_profit_pct?: number
          unrealized_pnl_pct?: number | null
          unrealized_pnl_usd?: number | null
          user_id?: string
          would_have_notional?: number
          would_have_price?: number
          would_have_quantity?: number
        }
        Relationships: []
      }
      skills: {
        Row: {
          agent_ids: string[] | null
          category: string | null
          content: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          usage_count: number | null
        }
        Insert: {
          agent_ids?: string[] | null
          category?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          usage_count?: number | null
        }
        Update: {
          agent_ids?: string[] | null
          category?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      stoikov_orders: {
        Row: {
          created_at: string | null
          execution_strategy: string | null
          id: string
          market_id: string | null
          order_plan: Json | null
          signal_id: string | null
        }
        Insert: {
          created_at?: string | null
          execution_strategy?: string | null
          id?: string
          market_id?: string | null
          order_plan?: Json | null
          signal_id?: string | null
        }
        Update: {
          created_at?: string | null
          execution_strategy?: string | null
          id?: string
          market_id?: string | null
          order_plan?: Json | null
          signal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stoikov_orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stoikov_orders_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trade_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_definitions: {
        Row: {
          asset_class: string
          enabled_in_profiles: string[]
          layman_name: string
          plain_english_description: string
          requires_advanced_warning: boolean
          strategy_key: string
        }
        Insert: {
          asset_class: string
          enabled_in_profiles?: string[]
          layman_name: string
          plain_english_description: string
          requires_advanced_warning?: boolean
          strategy_key: string
        }
        Update: {
          asset_class?: string
          enabled_in_profiles?: string[]
          layman_name?: string
          plain_english_description?: string
          requires_advanced_warning?: boolean
          strategy_key?: string
        }
        Relationships: []
      }
      strategy_weights: {
        Row: {
          id: string
          updated_at: string | null
          user_id: string
          weights: Json
        }
        Insert: {
          id?: string
          updated_at?: string | null
          user_id: string
          weights?: Json
        }
        Update: {
          id?: string
          updated_at?: string | null
          user_id?: string
          weights?: Json
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan_name: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplement_contraindication_rules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          reason: string
          rule_type: string
          rule_value: Json
          severity: string
          supplement_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          reason: string
          rule_type: string
          rule_value?: Json
          severity: string
          supplement_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          reason?: string
          rule_type?: string
          rule_value?: Json
          severity?: string
          supplement_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          adherence_event: boolean | null
          associated_goal: string | null
          category: string | null
          created_at: string | null
          dose: string | null
          id: string
          logged_at: string
          supplement_name: string
          timing: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adherence_event?: boolean | null
          associated_goal?: string | null
          category?: string | null
          created_at?: string | null
          dose?: string | null
          id?: string
          logged_at?: string
          supplement_name: string
          timing?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adherence_event?: boolean | null
          associated_goal?: string | null
          category?: string | null
          created_at?: string | null
          dose?: string | null
          id?: string
          logged_at?: string
          supplement_name?: string
          timing?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      symptom_logs: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          logged_at: string
          notes: string | null
          severity: number | null
          symptom_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          severity?: number | null
          symptom_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          severity?: number | null
          symptom_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tarot_readings: {
        Row: {
          cards: Json | null
          created_at: string | null
          id: string
          interpretation: string | null
          question: string | null
          spread: string
          user_id: string
        }
        Insert: {
          cards?: Json | null
          created_at?: string | null
          id?: string
          interpretation?: string | null
          question?: string | null
          spread: string
          user_id: string
        }
        Update: {
          cards?: Json | null
          created_at?: string | null
          id?: string
          interpretation?: string | null
          question?: string | null
          spread?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarot_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          acceptance_criteria: string[] | null
          activity_log: Json | null
          actual_minutes: number | null
          agent_id: string | null
          ai_plan: string | null
          blocks_task_ids: string[] | null
          collaborator_agent_ids: string[] | null
          completed_at: string | null
          created_at: string | null
          deliverables: string[] | null
          depends_on_task_ids: string[] | null
          description: string | null
          estimated_minutes: number | null
          failure_count: number | null
          id: string
          image_urls: string[] | null
          kanban_status: string
          last_session_cost_usd: number | null
          loop_detected: boolean | null
          notes: string | null
          notion_last_synced_at: string | null
          notion_task_id: string | null
          outcome_score: number | null
          pipeline_id: string | null
          pipeline_position: number | null
          priority: string | null
          project_id: string | null
          quadrant: string | null
          session_count: number | null
          started_at: string | null
          subtasks: Json | null
          title: string
          total_cost_usd: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: string[] | null
          activity_log?: Json | null
          actual_minutes?: number | null
          agent_id?: string | null
          ai_plan?: string | null
          blocks_task_ids?: string[] | null
          collaborator_agent_ids?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          depends_on_task_ids?: string[] | null
          description?: string | null
          estimated_minutes?: number | null
          failure_count?: number | null
          id?: string
          image_urls?: string[] | null
          kanban_status?: string
          last_session_cost_usd?: number | null
          loop_detected?: boolean | null
          notes?: string | null
          notion_last_synced_at?: string | null
          notion_task_id?: string | null
          outcome_score?: number | null
          pipeline_id?: string | null
          pipeline_position?: number | null
          priority?: string | null
          project_id?: string | null
          quadrant?: string | null
          session_count?: number | null
          started_at?: string | null
          subtasks?: Json | null
          title: string
          total_cost_usd?: number | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: string[] | null
          activity_log?: Json | null
          actual_minutes?: number | null
          agent_id?: string | null
          ai_plan?: string | null
          blocks_task_ids?: string[] | null
          collaborator_agent_ids?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          depends_on_task_ids?: string[] | null
          description?: string | null
          estimated_minutes?: number | null
          failure_count?: number | null
          id?: string
          image_urls?: string[] | null
          kanban_status?: string
          last_session_cost_usd?: number | null
          loop_detected?: boolean | null
          notes?: string | null
          notion_last_synced_at?: string | null
          notion_task_id?: string | null
          outcome_score?: number | null
          pipeline_id?: string | null
          pipeline_position?: number | null
          priority?: string | null
          project_id?: string | null
          quadrant?: string | null
          session_count?: number | null
          started_at?: string | null
          subtasks?: Json | null
          title?: string
          total_cost_usd?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_loss_ledger: {
        Row: {
          carryforward_usd: number
          created_at: string | null
          id: string
          long_term_gains_usd: number
          long_term_losses_usd: number
          short_term_gains_usd: number
          short_term_losses_usd: number
          tax_year: number
          updated_at: string | null
          used_against_gains_usd: number
          used_against_income_usd: number
          user_id: string
        }
        Insert: {
          carryforward_usd?: number
          created_at?: string | null
          id?: string
          long_term_gains_usd?: number
          long_term_losses_usd?: number
          short_term_gains_usd?: number
          short_term_losses_usd?: number
          tax_year: number
          updated_at?: string | null
          used_against_gains_usd?: number
          used_against_income_usd?: number
          user_id: string
        }
        Update: {
          carryforward_usd?: number
          created_at?: string | null
          id?: string
          long_term_gains_usd?: number
          long_term_losses_usd?: number
          short_term_gains_usd?: number
          short_term_losses_usd?: number
          tax_year?: number
          updated_at?: string | null
          used_against_gains_usd?: number
          used_against_income_usd?: number
          user_id?: string
        }
        Relationships: []
      }
      theses: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          market_id: string
          summary: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          market_id: string
          summary?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          market_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "theses_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_signals: {
        Row: {
          confidence: number | null
          generated_at: string | null
          id: string
          market_id: string | null
          reasoning: string | null
          signal_type: string | null
        }
        Insert: {
          confidence?: number | null
          generated_at?: string | null
          id?: string
          market_id?: string | null
          reasoning?: string | null
          signal_type?: string | null
        }
        Update: {
          confidence?: number | null
          generated_at?: string | null
          id?: string
          market_id?: string | null
          reasoning?: string | null
          signal_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_signals_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_ticks: {
        Row: {
          id: string
          market_outcome_id: string
          price: number | null
          size: number | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          market_outcome_id: string
          price?: number | null
          size?: number | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          market_outcome_id?: string
          price?: number | null
          size?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_ticks_market_outcome_id_fkey"
            columns: ["market_outcome_id"]
            isOneToOne: false
            referencedRelation: "market_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string | null
          entry_price: number | null
          executed_at: string | null
          id: string
          market_id: string | null
          signal_id: string | null
          size: number | null
          status: string | null
          trade_type: string | null
        }
        Insert: {
          created_at?: string | null
          entry_price?: number | null
          executed_at?: string | null
          id?: string
          market_id?: string | null
          signal_id?: string | null
          size?: number | null
          status?: string | null
          trade_type?: string | null
        }
        Update: {
          created_at?: string | null
          entry_price?: number | null
          executed_at?: string | null
          id?: string
          market_id?: string | null
          signal_id?: string | null
          size?: number | null
          status?: string | null
          trade_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trade_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_journal: {
        Row: {
          created_at: string | null
          id: string
          lessons_learned: string | null
          notes: string | null
          trade_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          trade_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          trade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_journal_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account: string | null
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          account?: string | null
          amount: number
          category: string
          created_at?: string | null
          date?: string
          description: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          account?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted: boolean
          accepted_at: string
          consent_type: string
          created_at: string
          id: string
          metadata_json: Json
          user_id: string
          user_jurisdiction: string | null
          version: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string
          consent_type: string
          created_at?: string
          id?: string
          metadata_json?: Json
          user_id: string
          user_jurisdiction?: string | null
          version: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          consent_type?: string
          created_at?: string
          id?: string
          metadata_json?: Json
          user_id?: string
          user_jurisdiction?: string | null
          version?: string
        }
        Relationships: []
      }
      user_copied_positions: {
        Row: {
          action: string
          asset_class: string
          broker: string | null
          broker_order_id: string | null
          closed_at: string | null
          created_at: string | null
          current_price: number | null
          entry_price: number | null
          error_message: string | null
          id: string
          notional_value: number | null
          opened_at: string | null
          pnl_pct: number | null
          pnl_usd: number | null
          quantity: number | null
          status: string | null
          strategy_id: string | null
          strategy_key: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          action: string
          asset_class: string
          broker?: string | null
          broker_order_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number | null
          error_message?: string | null
          id?: string
          notional_value?: number | null
          opened_at?: string | null
          pnl_pct?: number | null
          pnl_usd?: number | null
          quantity?: number | null
          status?: string | null
          strategy_id?: string | null
          strategy_key?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          action?: string
          asset_class?: string
          broker?: string | null
          broker_order_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number | null
          error_message?: string | null
          id?: string
          notional_value?: number | null
          opened_at?: string | null
          pnl_pct?: number | null
          pnl_usd?: number | null
          quantity?: number | null
          status?: string | null
          strategy_id?: string | null
          strategy_key?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      user_enabled_strategies: {
        Row: {
          created_at: string | null
          enabled: boolean
          enabled_by: string | null
          id: string
          is_enabled: boolean
          live_enabled: boolean
          notes: string | null
          paper_enabled: boolean
          strategy_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean
          live_enabled?: boolean
          notes?: string | null
          paper_enabled?: boolean
          strategy_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean
          live_enabled?: boolean
          notes?: string | null
          paper_enabled?: boolean
          strategy_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_risk_profile: {
        Row: {
          asset_class_overrides: Json
          auto_execute_threshold_usd: number | null
          custom_param_overrides: Json
          custom_strategy_overrides: Json
          last_changed_at: string
          onboarded_at: string | null
          profile_key: string
          ui_mode: string
          user_id: string
        }
        Insert: {
          asset_class_overrides?: Json
          auto_execute_threshold_usd?: number | null
          custom_param_overrides?: Json
          custom_strategy_overrides?: Json
          last_changed_at?: string
          onboarded_at?: string | null
          profile_key?: string
          ui_mode?: string
          user_id: string
        }
        Update: {
          asset_class_overrides?: Json
          auto_execute_threshold_usd?: number | null
          custom_param_overrides?: Json
          custom_strategy_overrides?: Json
          last_changed_at?: string
          onboarded_at?: string | null
          profile_key?: string
          ui_mode?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_risk_profile_profile_key_fkey"
            columns: ["profile_key"]
            isOneToOne: false
            referencedRelation: "risk_profiles"
            referencedColumns: ["profile_key"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_telemetry_events: {
        Row: {
          created_at: string | null
          event: string
          id: string
          properties: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string | null
          id: string
          interval: string | null
          notes: string | null
          strategy_key: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interval?: string | null
          notes?: string | null
          strategy_key?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interval?: string | null
          notes?: string | null
          strategy_key?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      va_tasks: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          notion_task_id: string | null
          priority: string | null
          project_id: string | null
          recurrence_rule: string | null
          recurring: boolean | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          notion_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          recurring?: boolean | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          notion_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          recurring?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      viral_reels: {
        Row: {
          created_at: string | null
          genviral_input: Json | null
          heygen_id: string | null
          id: string
          project_id: string | null
          published_at: string | null
          script: string | null
          status: string | null
          title: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          genviral_input?: Json | null
          heygen_id?: string | null
          id?: string
          project_id?: string | null
          published_at?: string | null
          script?: string | null
          status?: string | null
          title?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          genviral_input?: Json | null
          heygen_id?: string | null
          id?: string
          project_id?: string | null
          published_at?: string | null
          script?: string | null
          status?: string | null
          title?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viral_reels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_convergent_findings: {
        Row: {
          combined_confidence: number
          contributing_modalities: string[]
          created_at: string
          id: string
          prev_session_id: string | null
          session_id: string
          tag: string
          trend: string | null
          user_id: string
        }
        Insert: {
          combined_confidence: number
          contributing_modalities: string[]
          created_at?: string
          id?: string
          prev_session_id?: string | null
          session_id: string
          tag: string
          trend?: string | null
          user_id: string
        }
        Update: {
          combined_confidence?: number
          contributing_modalities?: string[]
          created_at?: string
          id?: string
          prev_session_id?: string | null
          session_id?: string
          tag?: string
          trend?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_convergent_findings_prev_session_id_fkey"
            columns: ["prev_session_id"]
            isOneToOne: false
            referencedRelation: "visual_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_convergent_findings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visual_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_divergent_findings: {
        Row: {
          contributing_modalities: Json
          created_at: string
          id: string
          note: string | null
          session_id: string
          tag_a: string
          tag_b: string
          user_id: string
        }
        Insert: {
          contributing_modalities?: Json
          created_at?: string
          id?: string
          note?: string | null
          session_id: string
          tag_a: string
          tag_b: string
          user_id: string
        }
        Update: {
          contributing_modalities?: Json
          created_at?: string
          id?: string
          note?: string | null
          session_id?: string
          tag_a?: string
          tag_b?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_divergent_findings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visual_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_findings: {
        Row: {
          ai_summary_md_storage_key: string | null
          confidence: number | null
          created_at: string
          cross_modality_tags: string[]
          findings_json_storage_key: string | null
          generation_ms: number | null
          id: string
          modality: string
          model_version: string
          narrative_by_paradigm: Json
          prompt_version: string
          red_flags: Json
          session_id: string
          structured_findings: Json
          summary_text: string | null
          tags_with_confidence: Json
          user_id: string
        }
        Insert: {
          ai_summary_md_storage_key?: string | null
          confidence?: number | null
          created_at?: string
          cross_modality_tags?: string[]
          findings_json_storage_key?: string | null
          generation_ms?: number | null
          id?: string
          modality: string
          model_version: string
          narrative_by_paradigm?: Json
          prompt_version: string
          red_flags?: Json
          session_id: string
          structured_findings: Json
          summary_text?: string | null
          tags_with_confidence?: Json
          user_id: string
        }
        Update: {
          ai_summary_md_storage_key?: string | null
          confidence?: number | null
          created_at?: string
          cross_modality_tags?: string[]
          findings_json_storage_key?: string | null
          generation_ms?: number | null
          id?: string
          modality?: string
          model_version?: string
          narrative_by_paradigm?: Json
          prompt_version?: string
          red_flags?: Json
          session_id?: string
          structured_findings?: Json
          summary_text?: string | null
          tags_with_confidence?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_findings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visual_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_health_index_modality_weights: {
        Row: {
          created_at: string
          modality: string
          notes: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          modality: string
          notes?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          created_at?: string
          modality?: string
          notes?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      visual_red_flag_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          category: string
          clinic_alert_event_id: string | null
          created_at: string
          id: string
          modality: string
          observation: string
          recommended_action: string | null
          session_id: string
          severity: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          category: string
          clinic_alert_event_id?: string | null
          created_at?: string
          id?: string
          modality: string
          observation: string
          recommended_action?: string | null
          session_id: string
          severity: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          category?: string
          clinic_alert_event_id?: string | null
          created_at?: string
          id?: string
          modality?: string
          observation?: string
          recommended_action?: string | null
          session_id?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_red_flag_alerts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visual_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_session_images: {
        Row: {
          angle: string
          captured_at: string
          id: string
          image_quality_flags: string[]
          image_quality_score: number | null
          mime_type: string
          modality: string
          session_id: string
          size_bytes: number | null
          storage_key: string
          user_id: string
        }
        Insert: {
          angle: string
          captured_at?: string
          id?: string
          image_quality_flags?: string[]
          image_quality_score?: number | null
          mime_type: string
          modality: string
          session_id: string
          size_bytes?: number | null
          storage_key: string
          user_id: string
        }
        Update: {
          angle?: string
          captured_at?: string
          id?: string
          image_quality_flags?: string[]
          image_quality_score?: number | null
          mime_type?: string
          modality?: string
          session_id?: string
          size_bytes?: number | null
          storage_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_session_images_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visual_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_sessions: {
        Row: {
          captured_at: string
          created_at: string
          id: string
          is_baseline: boolean
          notes: string | null
          practitioner_review_status: string | null
          review_signed_at: string | null
          review_signed_by: string | null
          reviewer_notes: string | null
          session_inputs_json: Json
          signed_off_at: string | null
          signed_off_by: string | null
          status: string
          updated_at: string
          user_id: string
          visual_health_index: number | null
        }
        Insert: {
          captured_at?: string
          created_at?: string
          id?: string
          is_baseline?: boolean
          notes?: string | null
          practitioner_review_status?: string | null
          review_signed_at?: string | null
          review_signed_by?: string | null
          reviewer_notes?: string | null
          session_inputs_json?: Json
          signed_off_at?: string | null
          signed_off_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          visual_health_index?: number | null
        }
        Update: {
          captured_at?: string
          created_at?: string
          id?: string
          is_baseline?: boolean
          notes?: string | null
          practitioner_review_status?: string | null
          review_signed_at?: string | null
          review_signed_by?: string | null
          reviewer_notes?: string | null
          session_inputs_json?: Json
          signed_off_at?: string | null
          signed_off_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          visual_health_index?: number | null
        }
        Relationships: []
      }
      wash_sale_blocklist: {
        Row: {
          asset_class: string
          blocked_until: string
          created_at: string | null
          harvested_at: string
          id: string
          loss_amount_usd: number
          status: string
          symbol: string
          user_id: string
        }
        Insert: {
          asset_class: string
          blocked_until: string
          created_at?: string | null
          harvested_at?: string
          id?: string
          loss_amount_usd?: number
          status?: string
          symbol: string
          user_id: string
        }
        Update: {
          asset_class?: string
          blocked_until?: string
          created_at?: string | null
          harvested_at?: string
          id?: string
          loss_amount_usd?: number
          status?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      wearable_connections: {
        Row: {
          access_token_encrypted: string | null
          created_at: string | null
          id: string
          last_successful_sync_at: string | null
          last_sync_at: string | null
          provider: string
          provider_user_id: string | null
          refresh_token_encrypted: string | null
          scopes_json: Json | null
          status: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string | null
          id?: string
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          provider: string
          provider_user_id?: string | null
          refresh_token_encrypted?: string | null
          scopes_json?: Json | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string | null
          id?: string
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          provider?: string
          provider_user_id?: string | null
          refresh_token_encrypted?: string | null
          scopes_json?: Json | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zang_fu_visual_tag_map: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organ: string
          score_adjustment: number
          visual_tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organ: string
          score_adjustment: number
          visual_tag: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organ?: string
          score_adjustment?: number
          visual_tag?: string
        }
        Relationships: []
      }
    }
    Views: {
      agent_metrics_summary: {
        Row: {
          agent_name: string | null
          avg_duration_ms: number | null
          avg_outcome_score: number | null
          last_activity: string | null
          successful_runs: number | null
          total_cost_usd: number | null
          total_runs: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
      daily_agent_costs: {
        Row: {
          agent_name: string | null
          avg_score: number | null
          daily_cost: number | null
          date: string | null
          runs: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_monthly_spend: {
        Args: { p_feature_key: string; p_user_id: string }
        Returns: number
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_assigned_patient: {
        Args: { _patient_id: string; _practitioner_id: string }
        Returns: boolean
      }
      is_clinic_role: { Args: never; Returns: boolean }
      is_practitioner: { Args: never; Returns: boolean }
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
