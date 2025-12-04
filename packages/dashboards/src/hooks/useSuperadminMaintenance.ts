import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "@pei/database";
import { insertAuditLog as insertAuditLogHelper } from "@pei/database/audit";
import type { BackupSchedule } from "../types";

type ToastFunction = (args: { title: string; description: string; variant?: "default" | "destructive" }) => void;

type ProfileInfo = {
  full_name?: string | null;
};

interface UseSuperadminMaintenanceParams {
  profile: ProfileInfo;
  toast: ToastFunction;
  loadAllData: () => Promise<void>;
  setBackupSchedules: Dispatch<SetStateAction<BackupSchedule[]>>;
}

export const useSuperadminMaintenance = ({
  profile,
  toast,
  loadAllData,
  setBackupSchedules,
}: UseSuperadminMaintenanceParams) => {
  // Wrapper para compatibilidade com interface antiga
  const insertAuditLog = useCallback(
    async (action: string, details?: string, severity: "info" | "warning" | "error" = "info") => {
      // Usar helper centralizado que aceita interface antiga
      await insertAuditLogHelper(action, details, severity);
    },
    []
  );

  const refreshMaterializedViews = useCallback(async () => {
    try {
      toast({
        title: "Atualizando Materialized Views...",
        description: "Executando refresh das views materializadas",
      });

      console.log("Simulando refresh de materialized views...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await loadAllData();

      await insertAuditLog("Materialized Views Refresh", "Executado via simulação", "info");

      toast({
        title: "✅ Materialized Views Atualizadas",
        description: "Views atualizadas (simulado)",
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Atualizar Views",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [insertAuditLog, loadAllData, toast]);

  const downloadBlob = (blob: Blob, fileName: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const executeManualBackup = useCallback(
    async (compactMode = false, tenantId?: string) => {
      try {
        const initialScope = tenantId ? "da rede selecionada" : "completo do sistema";
        toast({
          title: "Iniciando Backup Manual...",
          description: compactMode ? `Criando backup compacto ${initialScope}...` : `Coletando dados ${initialScope} para backup`,
        });

        console.log(`🔄 Iniciando backup manual do sistema (${compactMode ? "compacto" : "completo"})${tenantId ? ` para tenant ${tenantId}` : ""}...`);

        const backupData: any = {
          metadata: {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            system: "PEI Collab",
            generated_by: profile.full_name || "Super Admin",
            description: tenantId ? `Backup da rede selecionada` : "Backup completo do sistema PEI Collab",
            tenant_id: tenantId || null,
          },
          statistics: {
            total_tables: 0,
            total_records: 0,
            backup_size_bytes: 0,
          },
          warnings: [] as string[],
          tables: {} as Record<string, unknown>,
        };

        // Tenants - se tenantId fornecido, buscar apenas esse tenant
        const tenantSelect = compactMode ? "id, network_name, is_active, created_at" : "*";
        let tenantsQuery = supabase.from("tenants").select(tenantSelect);
        if (tenantId) {
          tenantsQuery = tenantsQuery.eq("id", tenantId);
        }
        const { data: tenants, error: tenantsError } = await tenantsQuery;
        if (tenantsError) throw tenantsError;
        backupData.tables.tenants = tenants || [];

        // Profiles - filtrar por tenant se fornecido (através de user_tenants)
        const profileSelect = compactMode ? "id, full_name, is_active, created_at" : "*";
        let profilesQuery = supabase.from("profiles").select(profileSelect);
        if (tenantId) {
          // Buscar user_ids relacionados ao tenant
          const { data: userTenantsData } = await supabase
            .from("user_tenants")
            .select("user_id")
            .eq("tenant_id", tenantId);
          const userIds = userTenantsData?.map((ut) => ut.user_id) || [];
          if (userIds.length > 0) {
            profilesQuery = profilesQuery.in("id", userIds);
          } else {
            profilesQuery = profilesQuery.eq("id", "00000000-0000-0000-0000-000000000000"); // Retorna vazio
          }
        }
        const { data: profiles, error: profilesError } = await profilesQuery;
        if (profilesError) throw profilesError;
        backupData.tables.profiles = profiles || [];

        // User Roles - filtrar por profiles do tenant
        let userRolesQuery = supabase.from("user_roles").select("*");
        if (tenantId && backupData.tables.profiles.length > 0) {
          const profileIds = (backupData.tables.profiles as Array<{ id: string }>).map((p) => p.id);
          userRolesQuery = userRolesQuery.in("user_id", profileIds);
        }
        const { data: userRoles, error: userRolesError } = await userRolesQuery;
        if (userRolesError) throw userRolesError;
        backupData.tables.user_roles = userRoles || [];

        // Students - filtrar por tenant
        const studentSelect = compactMode ? "id, name, is_active, created_at" : "*";
        let studentsQuery = supabase.from("students").select(studentSelect);
        if (tenantId) {
          studentsQuery = studentsQuery.eq("tenant_id", tenantId);
        }
        const { data: students, error: studentsError } = await studentsQuery;
        if (studentsError) throw studentsError;
        backupData.tables.students = students || [];

        // PEIs - filtrar por tenant
        const peiSelect = compactMode ? "id, status, created_at, updated_at" : "*";
        let peisQuery = supabase.from("peis").select(peiSelect);
        if (tenantId) {
          peisQuery = peisQuery.eq("tenant_id", tenantId);
        }
        const { data: peis, error: peisError } = await peisQuery;
        if (peisError) throw peisError;
        backupData.tables.peis = peis || [];

        // Schools - filtrar por tenant
        const schoolSelect = compactMode ? "id, school_name, is_active, created_at" : "*";
        let schoolsQuery = supabase.from("schools").select(schoolSelect);
        if (tenantId) {
          schoolsQuery = schoolsQuery.eq("tenant_id", tenantId);
        }
        const { data: schools, error: schoolsError } = await schoolsQuery;
        if (schoolsError) {
          console.warn("⚠️ Tabela schools não encontrada ou sem permissão:", schoolsError.message);
          backupData.tables.schools = [];
          backupData.warnings.push(`Tabela 'schools' não acessível: ${schoolsError.message}`);
        } else {
          backupData.tables.schools = schools || [];
        }

        // User Tenants - filtrar por tenant
        let userTenantsQuery = supabase.from("user_tenants").select("*");
        if (tenantId) {
          userTenantsQuery = userTenantsQuery.eq("tenant_id", tenantId);
        }
        const { data: userTenants, error: userTenantsError } = await userTenantsQuery;
        if (userTenantsError) {
          console.warn("⚠️ Tabela user_tenants não encontrada ou sem permissão:", userTenantsError.message);
          backupData.tables.user_tenants = [];
          backupData.warnings.push(`Tabela 'user_tenants' não acessível: ${userTenantsError.message}`);
        } else {
          backupData.tables.user_tenants = userTenants || [];
        }

        if (!compactMode) {
          // PEI Access Logs - filtrar por PEIs do tenant se fornecido
          let peiAccessLogsQuery = supabase.from("pei_access_logs").select("*");
          if (tenantId && backupData.tables.peis.length > 0) {
            const peiIds = (backupData.tables.peis as Array<{ id: string }>).map((p) => p.id);
            if (peiIds.length > 0) {
              peiAccessLogsQuery = peiAccessLogsQuery.in("pei_id", peiIds);
            } else {
              peiAccessLogsQuery = peiAccessLogsQuery.eq("pei_id", "00000000-0000-0000-0000-000000000000"); // Retorna vazio
            }
          }
          const { data: peiAccessLogs, error: peiAccessLogsError } = await peiAccessLogsQuery;
          if (peiAccessLogsError) {
            console.warn("⚠️ Tabela pei_access_logs não encontrada ou sem permissão:", peiAccessLogsError.message);
            backupData.tables.pei_access_logs = [];
            backupData.warnings.push(`Tabela 'pei_access_logs' não acessível: ${peiAccessLogsError.message}`);
          } else {
            backupData.tables.pei_access_logs = peiAccessLogs || [];
          }
        }

        const totalRecords = Object.values(backupData.tables).reduce((sum: number, table: any) => {
          return sum + (Array.isArray(table) ? table.length : 0);
        }, 0);
        const totalTables = Object.keys(backupData.tables).length;
        const backupSize = JSON.stringify(backupData).length;

        backupData.statistics = {
          total_tables: totalTables,
          total_records: totalRecords,
          backup_size_bytes: backupSize,
        };

        console.log(`✅ Backup concluído: ${totalTables} tabelas, ${totalRecords} registros, ${(backupSize / 1024).toFixed(2)} KB`);

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const modeSuffix = compactMode ? "compact" : "full";
        const tenantSuffix = tenantId ? `-tenant-${tenantId.slice(0, 8)}` : "";
        const fileName = `pei-collab-backup-${modeSuffix}${tenantSuffix}-${timestamp}.json`;

        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
          type: "application/json;charset=utf-8",
        });

        downloadBlob(blob, fileName);

        const backupScope = tenantId ? `da rede ${tenants?.[0]?.network_name || tenantId}` : "completo";
        await insertAuditLog(
          "Backup Manual Executado",
          `Backup ${backupScope}: ${totalTables} tabelas, ${totalRecords} registros, ${(backupSize / 1024).toFixed(2)} KB`,
          "info"
        );

        const warningText =
          backupData.warnings.length > 0
            ? ` (${backupData.warnings.length} avisos: ${backupData.warnings
                .map((warning: string) => warning.split(":")[0])
                .join(", ")})`
            : "";

        toast({
          title: "✅ Backup Executado com Sucesso",
          description: `Arquivo ${fileName} baixado com ${totalTables} tabelas e ${totalRecords} registros${warningText}`,
        });

        console.log("🎉 Backup manual concluído com sucesso!");
      } catch (error: any) {
        console.error("❌ Erro no backup manual:", error);
        toast({
          title: "❌ Erro no Backup",
          description: `Erro ao executar backup: ${error.message}`,
          variant: "destructive",
        });
      }
    },
    [insertAuditLog, profile.full_name, toast]
  );

  const viewAuditLogs = useCallback(async () => {
    try {
      const [peiAccessLogs, userLogs, systemLogs] = await Promise.all([
        supabase.from("pei_access_logs").select("*").order("accessed_at", { ascending: false }).limit(20),
        supabase.from("profiles").select("id, full_name, created_at, updated_at").order("updated_at", { ascending: false }).limit(15),
        supabase.from("tenants").select("id, network_name, created_at, updated_at").order("updated_at", { ascending: false }).limit(15),
      ]);

      const allLogs = [
        ...(peiAccessLogs.data?.map((log: any) => ({
          timestamp: new Date(log.accessed_at).toLocaleString("pt-BR"),
          action: "Acesso ao PEI",
          user: log.user_agent || "Usuário não identificado",
          details: `PEI ID: ${log.pei_id} - ${log.verified ? "Verificado" : "Não verificado"}`,
          ip: log.ip_address || "N/A",
          severity: "info",
        })) || []),
        ...(userLogs.data?.map((user: any) => ({
          timestamp: new Date(user.updated_at).toLocaleString("pt-BR"),
          action: "Atualização de Usuário",
          user: user.full_name || "Usuário",
          details: `Perfil atualizado - ID: ${user.id}`,
          ip: "Sistema",
          severity: "info",
        })) || []),
        ...(systemLogs.data?.map((tenant: any) => ({
          timestamp: new Date(tenant.updated_at).toLocaleString("pt-BR"),
          action: "Atualização de Rede",
          user: "Sistema",
          details: `Rede: ${tenant.network_name} - ID: ${tenant.id}`,
          ip: "Sistema",
          severity: "info",
        })) || []),
      ];

      const logsReport = allLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);

      const reportHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Logs de Auditoria - PEI Collab</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .timestamp { width: 150px; }
    .action { width: 200px; }
    .user { width: 150px; }
    .details { width: 300px; }
  </style>
</head>
<body>
  <h1>Logs de Auditoria - PEI Collab</h1>
  <p>Relatório gerado em: ${new Date().toLocaleString("pt-BR")}</p>
  <table>
    <thead>
      <tr>
        <th class="timestamp">Data/Hora</th>
        <th class="action">Ação</th>
        <th class="user">Usuário</th>
        <th class="details">Detalhes</th>
        <th>IP</th>
        <th>Severidade</th>
      </tr>
    </thead>
    <tbody>
      ${logsReport
        .map(
          (log) => `
      <tr>
        <td>${log.timestamp}</td>
        <td>${log.action}</td>
        <td>${log.user}</td>
        <td>${log.details}</td>
        <td>${log.ip}</td>
        <td><span>${log.severity.toUpperCase()}</span></td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;

      const blob = new Blob([reportHTML], { type: "text/html;charset=utf-8" });
      downloadBlob(blob, `audit-logs-${new Date().toISOString().split("T")[0]}.html`);

      toast({
        title: "📋 Logs de Auditoria Exportados",
        description: "Relatório de logs foi baixado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Buscar Logs",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const toggleBackupSchedule = useCallback(
    (scheduleId: string) => {
      let updatedSchedule: { enabled: boolean; schedule_type: string } | null = null;

      setBackupSchedules((previousSchedules) =>
        previousSchedules.map((schedule) => {
          if (schedule.id === scheduleId) {
            const enabled = !schedule.enabled;
            updatedSchedule = { enabled, schedule_type: schedule.schedule_type };
            console.log(`Atualizando agendamento ${scheduleId} para ${enabled ? "ativado" : "pausado"}`);
            return { ...schedule, enabled };
          }
          return schedule;
        })
      );

      if (updatedSchedule) {
        toast({
          title: updatedSchedule.enabled ? "✅ Agendamento Ativado" : "⏸️ Agendamento Pausado",
          description: `Backup ${updatedSchedule.schedule_type} ${updatedSchedule.enabled ? "ativado" : "pausado"}`,
        });
      }
    },
    [setBackupSchedules, toast]
  );

  const createBackupSchedule = useCallback(
    (scheduleType: "daily" | "weekly" | "monthly", time: string) => {
      const newSchedule: BackupSchedule = {
        id: `${scheduleType}-backup-${Date.now()}`,
        schedule_type: scheduleType,
        time,
        enabled: true,
        last_run: null,
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      console.log(`Criando novo agendamento: ${scheduleType} às ${time}`);

      setBackupSchedules((previous) => [...previous, newSchedule]);

      toast({
        title: "✅ Agendamento Criado",
        description: `Backup ${scheduleType} agendado para ${time}`,
      });
    },
    [setBackupSchedules, toast]
  );

  return {
    insertAuditLog,
    refreshMaterializedViews,
    executeManualBackup,
    viewAuditLogs,
    toggleBackupSchedule,
    createBackupSchedule,
  };
};

