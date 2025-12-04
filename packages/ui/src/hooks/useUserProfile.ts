import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  tenant_id?: string | null;
  school_id?: string | null;
  network_name?: string;
  school_name?: string;
  is_active?: boolean;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar perfil com tenant e school
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          tenant_id,
          school_id,
          is_active,
          tenants(id, network_name),
          school:schools!profiles_school_id_fkey(id, school_name, tenant_id)
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Buscar role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .limit(1);

      const role = userRoles?.[0]?.role || 'teacher';

      if (profileData) {
        const school = (profileData as any).school;
        const profile: UserProfile = {
          id: profileData.id,
          full_name: profileData.full_name,
          email: user.email,
          role: role,
          tenant_id: profileData.tenant_id,
          school_id: profileData.school_id,
          network_name: (profileData.tenants as any)?.network_name || 
                        school?.tenants?.network_name,
          school_name: school?.school_name,
          is_active: profileData.is_active,
        };

        setProfile(profile);
      }
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err);
      setError(err.message || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, refetch: loadProfile };
}

