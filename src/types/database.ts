/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Produced from the live Supabase project by the Supabase MCP type generator. To
 * regenerate after a schema change:
 *
 *   npx supabase gen types typescript --project-id utncrpncpehtscbuygvp > src/types/database.ts
 *
 * or regenerate through the Supabase MCP `generate_typescript_types` tool and replace this
 * file with the result.
 *
 * Why it is generated rather than hand-written: a hand-written copy of the database types
 * would silently drift from the real schema, and the drift would only surface later as a
 * confusing error somewhere unrelated. Generating the file removes that entire class of
 * bug.
 *
 * Application code should not import `Row` shapes from here directly. Use the names in
 * `src/types/entities.ts`, and map between the two inside `src/services`.
 */

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
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      about_sections: {
        Row: {
          content: string
          created_at: string
          id: string
          image_path: string | null
          is_published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          field: string
          id: string
          image_path: string | null
          is_published: boolean
          issued_on: string | null
          issuer: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          field?: string
          id?: string
          image_path?: string | null
          is_published?: boolean
          issued_on?: string | null
          issuer?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          field?: string
          id?: string
          image_path?: string | null
          is_published?: boolean
          issued_on?: string | null
          issuer?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_archived: boolean
          is_read: boolean
          message: string
          name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message: string
          name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message?: string
          name?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      educations: {
        Row: {
          created_at: string
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string | null
          grade: string | null
          id: string
          institution: string
          is_published: boolean
          logo_path: string | null
          sort_order: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution: string
          is_published?: boolean
          logo_path?: string | null
          sort_order?: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string
          is_published?: boolean
          logo_path?: string | null
          sort_order?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          company: string
          created_at: string
          description: string | null
          employment_type: string | null
          end_date: string | null
          field: string
          id: string
          is_current: boolean
          is_published: boolean
          location: string | null
          sort_order: number
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          field?: string
          id?: string
          is_current?: boolean
          is_published?: boolean
          location?: string | null
          sort_order?: number
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          field?: string
          id?: string
          is_current?: boolean
          is_published?: boolean
          location?: string | null
          sort_order?: number
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          alt_text: string | null
          bucket: string
          created_at: string
          created_by: string | null
          file_name: string
          height: number | null
          id: string
          mime_type: string
          path: string
          size_bytes: number
          updated_at: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          created_at?: string
          created_by?: string | null
          file_name: string
          height?: number | null
          id?: string
          mime_type: string
          path: string
          size_bytes: number
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          height?: number | null
          id?: string
          mime_type?: string
          path?: string
          size_bytes?: number
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      profile: {
        Row: {
          availability_status: string | null
          avatar_path: string | null
          bio: string | null
          cover_path: string | null
          email: string | null
          full_name: string
          headline: string | null
          id: string
          location: string | null
          phone: string | null
          resume_elv_path: string | null
          resume_path: string | null
          short_bio: string | null
          updated_at: string
          years_of_experience: number | null
        }
        Insert: {
          availability_status?: string | null
          avatar_path?: string | null
          bio?: string | null
          cover_path?: string | null
          email?: string | null
          full_name: string
          headline?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          resume_elv_path?: string | null
          resume_path?: string | null
          short_bio?: string | null
          updated_at?: string
          years_of_experience?: number | null
        }
        Update: {
          availability_status?: string | null
          avatar_path?: string | null
          bio?: string | null
          cover_path?: string | null
          email?: string | null
          full_name?: string
          headline?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          resume_elv_path?: string | null
          resume_path?: string | null
          short_bio?: string | null
          updated_at?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      project_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          path: string
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          path: string
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          path?: string
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_images_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      project_technologies: {
        Row: {
          created_at: string
          project_id: string
          technology_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          technology_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          technology_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_technologies_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_technologies_technology_id_fkey'
            columns: ['technology_id']
            isOneToOne: false
            referencedRelation: 'technologies'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          client_name: string | null
          cover_image_path: string | null
          created_at: string
          description: string | null
          ended_at: string | null
          field: string
          id: string
          is_featured: boolean
          is_published: boolean
          live_url: string | null
          repository_url: string | null
          role: string | null
          slug: string
          sort_order: number
          started_at: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          field?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          live_url?: string | null
          repository_url?: string | null
          role?: string | null
          slug: string
          sort_order?: number
          started_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          field?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          live_url?: string | null
          repository_url?: string | null
          role?: string | null
          slug?: string
          sort_order?: number
          started_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          icon_path: string | null
          id: string
          is_published: boolean
          price_hint: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_path?: string | null
          id?: string
          is_published?: boolean
          price_hint?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_path?: string | null
          id?: string
          is_published?: boolean
          price_hint?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          copyright_text: string | null
          default_theme: string
          footer_text: string | null
          id: string
          meta_description: string | null
          og_image_path: string | null
          show_availability_badge: boolean
          site_title: string
          updated_at: string
        }
        Insert: {
          copyright_text?: string | null
          default_theme?: string
          footer_text?: string | null
          id?: string
          meta_description?: string | null
          og_image_path?: string | null
          show_availability_badge?: boolean
          site_title: string
          updated_at?: string
        }
        Update: {
          copyright_text?: string | null
          default_theme?: string
          footer_text?: string | null
          id?: string
          meta_description?: string | null
          og_image_path?: string | null
          show_availability_badge?: boolean
          site_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          created_at: string
          field: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          field?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          field?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category_id: string | null
          created_at: string
          field: string
          icon_path: string | null
          id: string
          is_published: boolean
          name: string
          proficiency: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          field?: string
          icon_path?: string | null
          id?: string
          is_published?: boolean
          name: string
          proficiency?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          field?: string
          icon_path?: string | null
          id?: string
          is_published?: boolean
          name?: string
          proficiency?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'skills_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'skill_categories'
            referencedColumns: ['id']
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          icon_path: string | null
          id: string
          is_published: boolean
          label: string
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon_path?: string | null
          id?: string
          is_published?: boolean
          label: string
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          icon_path?: string | null
          id?: string
          is_published?: boolean
          label?: string
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      technologies: {
        Row: {
          created_at: string
          icon_path: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_path?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_path?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // Intentionally empty. `is_admin()` moved to the `private` schema, which PostgREST
      // does not serve, so there is no RPC endpoint reachable from the client. The client
      // learns admin status by reading its own `admin_users` row through RLS instead.
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const