import type { User } from '@supabase/supabase-js';

export type UserRole = 
  | 'superadmin'
  | 'education_secretary'
  | 'coordinator'
  | 'school_manager'
  | 'aee_teacher'
  | 'teacher'
  | 'family'
  | 'specialist'
  | 'support_professional';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  tenant_id: string | null;
  school_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  user: User;
  profile: UserProfile;
  roles: UserRole[];
  primaryRole: UserRole;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}































