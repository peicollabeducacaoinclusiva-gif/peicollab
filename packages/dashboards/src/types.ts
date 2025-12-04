// Tipos compartilhados entre os dashboards

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  role?: string;
  tenant_id?: string | null;
  school_id?: string | null;
  is_active?: boolean;
  avatar_emoji?: string;
  avatar_color?: string;
  school?: {
    school_name: string;
  };
  tenant?: {
    network_name: string;
  };
}

export interface DashboardStats {
  students: number;
  professionals: number;
  classes: number;
  subjects: number;
  users?: number;
  schools?: number;
  networks?: number;
  peis?: number;
}

export type UserRole = 
  | "superadmin" 
  | "coordinator" 
  | "teacher" 
  | "family" 
  | "school_manager" 
  | "aee_teacher" 
  | "specialist" 
  | "education_secretary" 
  | "school_director" 
  | "support_professional";

export interface NetworkStats {
  tenant_id: string;
  network_name: string;
  total_schools: number;
  total_students: number;
  total_active_peis: number;
  peis_draft: number;
  peis_pending: number;
  peis_approved: number;
  total_users: number;
  last_pei_update: string;
}

export interface GlobalStats {
  totalNetworks: number;
  totalSchools: number;
  totalStudents: number;
  totalPEIs: number;
  totalUsers: number;
  activeUsers: number;
  studentsWithPEI: number;
  studentsWithoutPEI: number;
  coveragePercentage: number;
  approvalRate: number;
  peisThisMonth: number;
  peisLastMonth: number;
  growthPercentage: string;
}

export interface SystemHealth {
  databaseStatus: "online" | "offline";
  lastSync: string;
  pendingSyncs: number;
  activeConnections: number;
  avgResponseTime: number;
}

export interface BackupSchedule {
  id: string;
  schedule_type: "daily" | "weekly" | "monthly";
  time: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
}

export interface NetworkDetails {
  tenant_id: string;
  network_name: string;
  network_address: string | null;
  network_phone: string | null;
  network_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  users: Array<{
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
  }>;
  students: Array<{
    id: string;
    name: string;
    student_id: string | null;
    class_name: string | null;
    is_active: boolean;
    created_at: string;
  }>;
  peis: Array<{
    id: string;
    status: string;
    version_number: number;
    created_at: string;
    updated_at: string;
    student_name: string;
  }>;
  schools: Array<{
    id: string;
    school_name: string;
    school_address: string | null;
    school_phone: string | null;
    school_email: string | null;
    is_active: boolean;
  }>;
}

export interface SuperadminDashboardProps {
  profile: {
    id: string;
    full_name: string;
    role: string;
    school_id: string | null;
  };
}

export type TenantRow = {
  id: string;
  network_name: string | null;
  name?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SchoolRow = {
  id: string;
  school_name: string;
  tenant_id: string;
  school_address?: string | null;
  school_phone?: string | null;
  school_email?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PeiRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  student_id: string;
  tenant_id?: string;
  school_id?: string;
  version_number?: number;
};

export type StudentRow = {
  id: string;
  name: string;
  student_id?: string | null;
  class_name?: string | null;
  is_active?: boolean;
  created_at?: string;
  tenant_id?: string;
  school_id?: string;
};

export type UserTenantRow = {
  user_id: string;
  tenant_id: string;
  school_id?: string | null;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

