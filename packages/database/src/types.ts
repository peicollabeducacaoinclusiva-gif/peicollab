export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole =
  | "superadmin"
  | "coordinator"
  | "school_manager"
  | "aee_teacher"
  | "teacher"
  | "family"
  | "specialist"
  | "education_secretary"
  | "school_director"
  | "support_professional"

export type PeiStatus =
  | "draft"
  | "pending"
  | "pending_validation"
  | "pending_family"
  | "returned"
  | "approved"
  | "validated"

type TableDef<Row = Record<string, any>> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: never[]
}

export interface ProfilesRow {
  id: string
  full_name: string
  email?: string | null
  role?: AppRole | null
  tenant_id?: string | null
  school_id?: string | null
  is_active?: boolean | null
  avatar_emoji?: string | null
  avatar_color?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UserRolesRow {
  id: string
  user_id: string
  role: AppRole
  created_at?: string | null
}

export interface SchoolsRow {
  id: string
  school_name?: string | null
  tenant_id: string
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface TenantsRow {
  id: string
  network_name?: string | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface StudentsRow {
  id: string
  name: string
  student_id?: string | null
  class_name?: string | null
  school_id?: string | null
  tenant_id?: string | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface PeiRow {
  id: string
  status: PeiStatus
  student_id: string
  school_id?: string | null
  tenant_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  assigned_teacher_id?: string | null
  diagnosis_data?: Json | null
  evaluation_data?: Json | null
  planning_data?: Json | null
  family_approved_at?: string | null
  family_approved_by?: string | null
}

type PublicTables = {
  profiles: TableDef<ProfilesRow>
  user_roles: TableDef<UserRolesRow>
  schools: TableDef<SchoolsRow>
  tenants: TableDef<TenantsRow>
  students: TableDef<StudentsRow>
  peis: TableDef<PeiRow>
} & {
  [table: string]: TableDef
}

type PublicFunctions = {
  get_user_primary_role: {
    Args: { _user_id: string }
    Returns: AppRole | null
  }
  has_role: {
    Args: { _user_id: string; _role: AppRole }
    Returns: boolean
  }
} & {
  [fn: string]: { Args: Record<string, any>; Returns: any }
}

export interface Database {
  public: {
    Tables: PublicTables
    Views: {
      [view: string]: TableDef
    }
    Functions: PublicFunctions
    Enums: {
      app_role: AppRole
      user_role: AppRole
      pei_status: PeiStatus
      [key: string]: string
    }
    CompositeTypes: {
      [name: string]: Record<string, any>
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
