import { useCallback, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type CreateUserPayload = {
  full_name: string;
  email: string;
  role: string;
  tenant_id: string;
  school_id?: string;
};

type EditUserPayload = {
  full_name: string;
  role: string;
  tenant_id?: string | null;
  school_id?: string | null;
};

type UseSuperadminUsersParams = {
  loadAllUsers: () => Promise<void>;
  insertAuditLog: (action: string, details?: string, severity?: "info" | "warning" | "error") => Promise<void>;
  onUserCreated?: (info: { fullName: string; email: string; role: string }) => void;
  onUserEdited?: (info: { fullName: string; role: string }) => void;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[useSuperadminUsers] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados. " +
      "Operações de administração de usuários podem falhar."
  );
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export function useSuperadminUsers({
  loadAllUsers,
  insertAuditLog,
  onUserCreated,
  onUserEdited,
}: UseSuperadminUsersParams) {
  const { toast } = useToast();
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(false);

  const validateTenantAndSchool = useCallback(async (tenantId?: string, schoolId?: string) => {
    // Normalizar strings vazias para undefined
    const normalizedTenantId = tenantId?.trim() || undefined;
    const normalizedSchoolId = schoolId?.trim() || undefined;

    if (normalizedTenantId) {
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("id")
        .eq("id", normalizedTenantId)
        .maybeSingle();

      if (tenantError || !tenant) {
        throw new Error(`Rede não encontrada (ID: ${normalizedTenantId})`);
      }
    }

    if (normalizedSchoolId) {
      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .select("id")
        .eq("id", normalizedSchoolId)
        .maybeSingle();

      if (schoolError || !school) {
        throw new Error(`Escola não encontrada (ID: ${normalizedSchoolId})`);
      }
    }
  }, []);

  const createUser = useCallback(
    async (payload: CreateUserPayload) => {
      setCreatingUser(true);

      try {
        // Normalizar school_id: converter string vazia para null/undefined
        const normalizedSchoolId = payload.school_id?.trim() || undefined;
        const normalizedTenantId = payload.tenant_id?.trim() || undefined;

        await validateTenantAndSchool(normalizedTenantId, normalizedSchoolId);

        const roleMapping = {
          superadmin: "superadmin",
          coordinator: "coordinator",
          school_manager: "school_manager",
          aee_teacher: "aee_teacher",
          teacher: "teacher",
          family: "family",
          specialist: "specialist",
          education_secretary: "education_secretary",
          support_professional: "support_professional",
        } as const;

        const mappedRole = roleMapping[payload.role as keyof typeof roleMapping] ?? "teacher";
        const email =
          payload.email?.trim() ||
          `${payload.full_name.toLowerCase().replace(/\s+/g, ".")}@temp.pei.collab`;

        // Obter sessão atual para autenticação na Edge Function
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Você precisa estar autenticado para criar usuários');
        }

        // Usar Edge Function create-user que usa Admin API com email_confirm: true
        const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user', {
          body: {
            email,
            fullName: payload.full_name,
            role: mappedRole,
            tenantId: normalizedTenantId || null,
          },
        });

        if (functionError) {
          throw new Error(functionError.message || "Falha ao criar usuário via Edge Function.");
        }

        if (!functionData?.user) {
          throw new Error("Falha ao criar usuário: resposta inválida da Edge Function.");
        }

        const userId = functionData.user.id;

        // A Edge Function já cria o profile, mas precisamos associar a escola se necessário
        if (normalizedSchoolId) {
          const { error: schoolError } = await supabase
            .from("user_schools")
            .insert({
              user_id: userId,
              school_id: normalizedSchoolId,
            });

          if (schoolError) {
            console.warn("Falha ao associar usuário à escola:", schoolError);
            // Não falhar completamente, apenas avisar
          }
        }

        // Verificar se há aviso sobre email (rate limit, etc)
        if (functionData.warning) {
          console.warn("Aviso ao criar usuário:", functionData.warning);
        }

        await loadAllUsers();
        await insertAuditLog(
          "Usuário Criado",
          `Novo usuário: ${payload.full_name} (${payload.role})`,
          "info",
        );

        toast({
          title: "Usuário criado com sucesso",
          description: `Conta ${payload.full_name} adicionada. E-mail: ${email}`,
        });

        onUserCreated?.({ fullName: payload.full_name, email, role: payload.role });
      } catch (error: any) {
        console.error("Erro ao criar usuário:", error);
        toast({
          title: "Erro ao criar usuário",
          description: error?.message || "Não foi possível concluir a operação.",
          variant: "destructive",
        });
      } finally {
        setCreatingUser(false);
      }
    },
    [insertAuditLog, loadAllUsers, onUserCreated, toast, validateTenantAndSchool],
  );

  const toggleUserStatus = useCallback(
    async (userId: string, currentStatus: boolean) => {
      try {
        const newStatus = !currentStatus;

        const { error } = await supabase
          .from("profiles")
          .update({
            is_active: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          throw error;
        }

        await loadAllUsers();
        await insertAuditLog(
          newStatus ? "Usuário Ativado" : "Usuário Desativado",
          `Usuário ID: ${userId}`,
          "info",
        );

        toast({
          title: newStatus ? "Usuário ativado" : "Usuário desativado",
          description: `O usuário foi ${newStatus ? "reativado" : "desativado"} com sucesso.`,
        });
      } catch (error: any) {
        console.error("Erro ao alterar status do usuário:", error);
        toast({
          title: "Erro ao alterar status",
          description: error?.message || "Não foi possível atualizar o usuário.",
          variant: "destructive",
        });
      }
    },
    [insertAuditLog, loadAllUsers, toast],
  );

  const editUser = useCallback(
    async (userId: string, payload: EditUserPayload) => {
      setEditingUser(true);

      try {
        await validateTenantAndSchool(payload.tenant_id ?? undefined, payload.school_id ?? undefined);

        const roleMapping = {
          superadmin: "superadmin",
          coordinator: "coordinator",
          school_manager: "school_manager",
          aee_teacher: "aee_teacher",
          teacher: "teacher",
          family: "family",
          specialist: "specialist",
          education_secretary: "education_secretary",
          support_professional: "support_professional",
        } as const;

        const mappedRole =
          roleMapping[payload.role as keyof typeof roleMapping] ?? "teacher";

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: payload.full_name,
            tenant_id: payload.tenant_id ?? null,
            school_id: payload.school_id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (profileError) {
          throw profileError;
        }

        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({ user_id: userId, role: mappedRole }, { onConflict: "user_id" });

        if (roleError) {
          throw roleError;
        }

        // Atualizar associação com tenant
        // IMPORTANTE: user_tenants não tem school_id, apenas user_id e tenant_id
        if (payload.tenant_id) {
          // Remover associações antigas
          await supabase.from("user_tenants").delete().eq("user_id", userId);

          // Inserir nova associação usando upsert para evitar conflitos
          const { error: tenantError } = await supabase
            .from("user_tenants")
            .upsert({
              user_id: userId,
              tenant_id: payload.tenant_id,
            }, {
              onConflict: "user_id,tenant_id",
            });

          if (tenantError) {
            console.error("❌ Erro ao atualizar associação com tenant:", tenantError);
            throw new Error(
              `Falha ao associar usuário à rede: ${tenantError.message}`
            );
          }
        } else {
          // Se não há tenant_id, remover todas as associações
          await supabase.from("user_tenants").delete().eq("user_id", userId);
        }

        // Atualizar associação com escola (user_schools)
        if (payload.school_id) {
          // Remover associações antigas
          await supabase.from("user_schools").delete().eq("user_id", userId);

          // Inserir nova associação usando upsert para evitar conflitos
          const { error: schoolError } = await supabase
            .from("user_schools")
            .upsert({
              user_id: userId,
              school_id: payload.school_id,
            }, {
              onConflict: "user_id,school_id",
            });

          if (schoolError) {
            console.error("❌ Erro ao atualizar associação com escola:", schoolError);
            throw new Error(
              `Falha ao associar usuário à escola: ${schoolError.message}`
            );
          }
        } else {
          // Se não há school_id, remover todas as associações
          await supabase.from("user_schools").delete().eq("user_id", userId);
        }

        await loadAllUsers();
        await insertAuditLog(
          "Usuário Editado",
          `Usuário editado: ${payload.full_name} (${payload.role})`,
          "info",
        );

        toast({
          title: "Usuário atualizado",
          description: `${payload.full_name} foi atualizado com sucesso.`,
        });

        onUserEdited?.({ fullName: payload.full_name, role: payload.role });
      } catch (error: any) {
        console.error("Erro ao editar usuário:", error);
        toast({
          title: "Erro ao editar usuário",
          description: error?.message || "Não foi possível atualizar os dados do usuário.",
          variant: "destructive",
        });
      } finally {
        setEditingUser(false);
      }
    },
    [insertAuditLog, loadAllUsers, onUserEdited, toast, validateTenantAndSchool],
  );

  return {
    creatingUser,
    editingUser,
    createUser,
    editUser,
    toggleUserStatus,
  };
}




