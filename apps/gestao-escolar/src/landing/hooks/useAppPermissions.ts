import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppId = 
  | 'pei-collab'
  | 'gestao-escolar'
  | 'plano-aee'
  | 'planejamento'
  | 'blog'
  | 'atividades'
  | 'portal-responsavel'
  | 'transporte-escolar'
  | 'merenda-escolar';

// Mapeamento de roles para apps permitidos
const APP_PERMISSIONS: Record<AppId, string[]> = {
  'pei-collab': ['superadmin', 'education_secretary', 'coordinator', 'school_manager', 'aee_teacher', 'teacher', 'specialist'],
  'gestao-escolar': ['superadmin', 'education_secretary', 'coordinator', 'school_manager', 'teacher'],
  'plano-aee': ['superadmin', 'education_secretary', 'coordinator', 'school_manager', 'aee_teacher', 'specialist'],
  'planejamento': ['superadmin', 'education_secretary', 'coordinator', 'school_manager', 'teacher', 'aee_teacher'],
  'blog': ['superadmin', 'education_secretary', 'coordinator', 'school_manager', 'teacher', 'aee_teacher', 'family'],
  'atividades': ['superadmin', 'education_secretary', 'coordinator', 'school_manager', 'teacher', 'aee_teacher'],
  'portal-responsavel': ['family'],
  'transporte-escolar': ['superadmin', 'education_secretary', 'coordinator', 'school_manager'],
  'merenda-escolar': ['superadmin', 'education_secretary', 'coordinator', 'school_manager'],
};

export function useAppPermissions(userId: string | undefined) {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (error) {
          console.error('Erro ao buscar roles:', error);
          setUserRoles([]);
        } else {
          setUserRoles(data?.map(r => r.role) || []);
        }
      } catch (error) {
        console.error('Erro ao buscar roles:', error);
        setUserRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [userId]);

  const hasAccessToApp = (appId: AppId): boolean => {
    if (!userId || userRoles.length === 0) return false;
    
    // Superadmin tem acesso a tudo
    if (userRoles.includes('superadmin')) return true;
    
    const allowedRoles = APP_PERMISSIONS[appId];
    return userRoles.some(role => allowedRoles.includes(role));
  };

  const getAccessibleApps = <T extends { id: string }>(allApps: T[]): T[] => {
    return allApps.filter(app => hasAccessToApp(app.id as AppId));
  };

  return {
    userRoles,
    loading,
    hasAccessToApp,
    getAccessibleApps,
  };
}

