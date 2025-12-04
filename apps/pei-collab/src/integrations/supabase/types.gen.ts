// Tipos gerados via MCP Supabase - mantidos próximos ao client do app
/* eslint-disable */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {}
    Views: {}
    Functions: {
      get_network_kpis: {
        Args: { period_start: string; tenant_id: string }
        Returns: {
          avg_completion_time: number
          compliance_rate: number
          family_engagement_rate: number
          inclusion_rate: number
          peis_approved: number
          peis_draft: number
          peis_pending: number
          peis_returned: number
          students_with_pei: number
          total_peis: number
          total_schools: number
          total_students: number
        }[]
      }
      get_school_performance: {
        Args: { period_start: string; tenant_id: string }
        Returns: {
          approved_peis: number
          avg_time_to_approval: number
          director: string
          family_engagement: number
          last_activity: string
          pending_peis: number
          returned_peis: number
          school_id: string
          school_name: string
          students_with_pei: number
          total_peis: number
          total_students: number
        }[]
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals["public"]

export type RpcReturn<K extends keyof DefaultSchema["Functions"]> =
  DefaultSchema["Functions"][K] extends { Returns: infer R } ? R : never

export type GetNetworkKpisRow = RpcReturn<"get_network_kpis">[number]
export type GetSchoolPerformanceRow = RpcReturn<"get_school_performance">[number]


