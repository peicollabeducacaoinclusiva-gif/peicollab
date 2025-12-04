import { useCallback, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type CreateUserPayload = {
  full_name: string;
  email: string;
  role: string;
  tenant_id: string;
  school_id?: string;
  cpf?: string;
};

type UpdateUserPayload = {
  full_name?: string;
  email?: string;
  role?: string;
  school_id?: string | null;
  is_active?: boolean;
  cpf?: string;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  tenant_id: string;
  school_id?: string | null;
  is_active?: boolean;
  cpf?: string;
  school?: {
    school_name: string;
  } | null;
  created_at?: string;
  updated_at?: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export function useSuperadminUsers(tenantId: string) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const serviceClient: SupabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const getUsers = useCallback(async (): Promise<UserRow[]> => {
    try {
      setLoading(true);

      const { data, error } = await serviceClient
        .from('user_profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          tenant_id,
          school_id,
          is_active,
          cpf,
          created_at,
          updated_at,
          school:schools (
            school_name
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar usuários",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  const createUser = useCallback(async (payload: CreateUserPayload): Promise<{ success: boolean; userId?: string; error?: string }> => {
    try {
      setLoading(true);

      // 1. Criar usuário no Auth (via Edge Function)
      const { data: authData, error: authError } = await serviceClient.functions.invoke('create-user', {
        body: {
          email: payload.email,
          password: 'Temp123!', // Senha temporária
          user_metadata: {
            full_name: payload.full_name,
            role: payload.role,
            tenant_id: payload.tenant_id,
            school_id: payload.school_id || null,
            cpf: payload.cpf || null,
          }
        }
      });

      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error('Usuário não foi criado no Auth');

      const userId = authData.user.id;

      // 2. Criar perfil no user_profiles
      const { error: profileError } = await serviceClient
        .from('user_profiles')
        .insert({
          id: userId,
          full_name: payload.full_name,
          email: payload.email,
          role: payload.role,
          tenant_id: payload.tenant_id,
          school_id: payload.school_id || null,
          cpf: payload.cpf || null,
          is_active: true,
        });

      if (profileError) throw profileError;

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });

      return { success: true, userId };
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateUser = useCallback(async (userId: string, payload: UpdateUserPayload): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // Atualizar perfil no user_profiles
      const { error: profileError } = await serviceClient
        .from('user_profiles')
        .update({
          full_name: payload.full_name,
          email: payload.email,
          role: payload.role,
          school_id: payload.school_id !== undefined ? payload.school_id : undefined,
          is_active: payload.is_active,
          cpf: payload.cpf,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Se o email mudou, atualizar no Auth também (via Edge Function)
      if (payload.email) {
        const { error: authError } = await serviceClient.functions.invoke('update-user', {
          body: {
            userId,
            email: payload.email,
            user_metadata: {
              full_name: payload.full_name,
              role: payload.role,
              school_id: payload.school_id,
              cpf: payload.cpf,
            }
          }
        });

        if (authError) {
          console.warn('Erro ao atualizar email no Auth:', authError);
        }
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteUser = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // Desativar usuário (soft delete)
      const { error: profileError } = await serviceClient
        .from('user_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast({
        title: "Sucesso",
        description: "Usuário desativado com sucesso",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao desativar usuário",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // Resetar senha via Edge Function
      const { error: resetError } = await serviceClient.functions.invoke('reset-user-password', {
        body: { userId }
      });

      if (resetError) throw resetError;

      toast({
        title: "Sucesso",
        description: "Senha resetada com sucesso. Email enviado ao usuário.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao resetar senha",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const impersonateUser = useCallback(async (userId: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    try {
      setLoading(true);

      // Criar token de impersonação via Edge Function
      const { data, error } = await serviceClient.functions.invoke('impersonate-user', {
        body: { userId }
      });

      if (error) throw error;
      if (!data?.token) throw new Error('Token não foi gerado');

      return { success: true, token: data.token };
    } catch (error: any) {
      console.error('Erro ao impersonar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao impersonar usuário",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const bulkImportUsers = useCallback(async (users: CreateUserPayload[]): Promise<{ success: boolean; imported: number; failed: number; errors: string[] }> => {
    try {
      setLoading(true);

      const results = {
        imported: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const user of users) {
        const result = await createUser(user);
        if (result.success) {
          results.imported++;
        } else {
          results.failed++;
          results.errors.push(`${user.email}: ${result.error || 'Erro desconhecido'}`);
        }
      }

      toast({
        title: "Importação concluída",
        description: `${results.imported} usuários importados, ${results.failed} falharam`,
        variant: results.failed > 0 ? "destructive" : "default",
      });

      return { success: true, ...results };
    } catch (error: any) {
      console.error('Erro na importação em lote:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro na importação em lote",
        variant: "destructive",
      });
      return { success: false, imported: 0, failed: users.length, errors: [error.message] };
    } finally {
      setLoading(false);
    }
  }, [createUser, toast]);

  return {
    loading,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    impersonateUser,
    bulkImportUsers,
  };
}

