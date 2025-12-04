import { useCallback, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type SchoolRow = {
  id: string;
  school_name: string;
  tenant_id: string;
  is_active?: boolean;
};

type UseSuperadminSchoolsParams = {
  insertAuditLog: (action: string, details?: string, severity?: "info" | "warning" | "error") => Promise<void>;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[useSuperadminSchools] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados. " +
      "Operações de administração de escolas podem falhar."
  );
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export function useSuperadminSchools({ insertAuditLog }: UseSuperadminSchoolsParams) {
  const { toast } = useToast();

  const [availableSchoolsForUser, setAvailableSchoolsForUser] = useState<SchoolRow[]>([]);
  const [availableSchoolsForEdit, setAvailableSchoolsForEdit] = useState<SchoolRow[]>([]);
  const [allSchools, setAllSchools] = useState<SchoolRow[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingSchoolsForEdit, setLoadingSchoolsForEdit] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const loadSchoolsByTenant = useCallback(async (tenantId: string, setter: (schools: SchoolRow[]) => void) => {
    const { data, error } = await supabase
      .from("schools")
      .select("id, school_name, tenant_id, is_active")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("school_name", { ascending: true });

    if (error) {
      throw error;
    }

    setter((data as SchoolRow[]) || []);
  }, []);

  const loadSchoolsForTenant = useCallback(
    async (tenantId: string) => {
      setLoadingSchools(true);
      try {
        await loadSchoolsByTenant(tenantId, setAvailableSchoolsForUser);
      } catch (error: any) {
        console.error("Erro ao carregar escolas:", error);
        setAvailableSchoolsForUser([]);
        toast({
          title: "Erro ao carregar escolas",
          description: error?.message || "Não foi possível listar as escolas desta rede.",
          variant: "destructive",
        });
      } finally {
        setLoadingSchools(false);
      }
    },
    [loadSchoolsByTenant, toast],
  );

  const loadSchoolsForEdit = useCallback(
    async (tenantId: string) => {
      setLoadingSchoolsForEdit(true);
      try {
        await loadSchoolsByTenant(tenantId, setAvailableSchoolsForEdit);
      } catch (error: any) {
        console.error("Erro ao carregar escolas para edição:", error);
        setAvailableSchoolsForEdit([]);
        toast({
          title: "Erro ao carregar escolas",
          description: error?.message || "Não foi possível listar as escolas desta rede.",
          variant: "destructive",
        });
      } finally {
        setLoadingSchoolsForEdit(false);
      }
    },
    [loadSchoolsByTenant, toast],
  );

  const refreshAllSchools = useCallback(async () => {
    setLoadingAction(true);
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, school_name, tenant_id, is_active")
        .order("school_name", { ascending: true });

      if (error) {
        throw error;
      }

      setAllSchools((data as SchoolRow[]) || []);
    } catch (error: any) {
      console.error("Erro ao carregar escolas:", error);
      toast({
        title: "Erro ao carregar escolas",
        description: error?.message || "Não foi possível carregar a lista de escolas.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  }, [toast]);

  const saveSchool = useCallback(
    async (payload: { id?: string; school_name: string; tenant_id: string }) => {
      setLoadingAction(true);
      try {
        if (!payload.school_name || !payload.tenant_id) {
          throw new Error("Nome da escola e rede são obrigatórios.");
        }

        if (payload.id) {
          const { error } = await supabase
            .from("schools")
            .update({
              school_name: payload.school_name,
              tenant_id: payload.tenant_id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", payload.id);

          if (error) {
            throw error;
          }

          toast({
            title: "Escola atualizada",
            description: "As informações da escola foram salvas com sucesso.",
          });

          await insertAuditLog(
            "Escola Atualizada",
            `Escola ${payload.school_name} atualizada para a rede ${payload.tenant_id}`,
            "info",
          );
        } else {
          const { error } = await supabase
            .from("schools")
            .insert({ school_name: payload.school_name, tenant_id: payload.tenant_id });

          if (error) {
            throw error;
          }

          toast({
            title: "Escola criada",
            description: "A nova escola foi cadastrada com sucesso.",
          });

          await insertAuditLog(
            "Escola Criada",
            `Escola ${payload.school_name} adicionada à rede ${payload.tenant_id}`,
            "info",
          );
        }

        await refreshAllSchools();
      } catch (error: any) {
        console.error("Erro ao salvar escola:", error);
        toast({
          title: "Erro ao salvar escola",
          description: error?.message || "Não foi possível concluir a operação.",
          variant: "destructive",
        });
      } finally {
        setLoadingAction(false);
      }
    },
    [insertAuditLog, refreshAllSchools, toast],
  );

  const deleteSchool = useCallback(
    async (schoolId: string) => {
      if (!schoolId) return;

      setLoadingAction(true);
      try {
        const { error } = await supabase.from("schools").delete().eq("id", schoolId);
        if (error) {
          throw error;
        }

        toast({
          title: "Escola excluída",
          description: "A escola foi removida do sistema.",
        });

        await insertAuditLog("Escola Excluída", `Escola removida (ID: ${schoolId})`, "warning");
        await refreshAllSchools();
      } catch (error: any) {
        console.error("Erro ao excluir escola:", error);
        toast({
          title: "Erro ao excluir escola",
          description: error?.message || "Não foi possível remover a escola.",
          variant: "destructive",
        });
      } finally {
        setLoadingAction(false);
      }
    },
    [insertAuditLog, refreshAllSchools, toast],
  );

  return {
    availableSchoolsForUser,
    availableSchoolsForEdit,
    allSchools,
    loadingSchools,
    loadingSchoolsForEdit,
    loadingAction,
    loadSchoolsForTenant,
    loadSchoolsForEdit,
    refreshAllSchools,
    saveSchool,
    deleteSchool,
    setAvailableSchoolsForUser,
    setAvailableSchoolsForEdit,
    setAllSchools,
  };
}








