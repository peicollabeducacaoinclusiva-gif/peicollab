import { useCallback } from "react";
import { supabase } from "@pei/database";
import type {
  NetworkStats,
  GlobalStats,
  SystemHealth,
  BackupSchedule,
  NetworkDetails,
  TenantRow,
  SchoolRow,
  PeiRow,
  StudentRow,
  UserTenantRow,
  ProfileRow,
} from "../types";

type ToastFunction = (args: { title: string; description: string; variant?: "default" | "destructive" }) => void;

interface UseSuperadminDashboardDataParams {
  toast: ToastFunction;
  setNetworkStats: React.Dispatch<React.SetStateAction<NetworkStats[]>>;
  setGlobalStats: React.Dispatch<React.SetStateAction<GlobalStats | null>>;
  setSystemHealth: React.Dispatch<React.SetStateAction<SystemHealth | null>>;
  setBackupSchedules: React.Dispatch<React.SetStateAction<BackupSchedule[]>>;
  setAvailableTenants: React.Dispatch<React.SetStateAction<TenantRow[]>>;
  setLastUpdate: React.Dispatch<React.SetStateAction<Date>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const fetchTable = async <T = unknown>(
  table: string,
  select = "*",
  filters?: Record<string, unknown>
): Promise<T[]> => {
  let query = supabase.from(table).select(select);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }
  const { data, error } = await query;
  if (error) {
    console.error(`Erro ao carregar ${table}:`, error);
    return [];
  }
  return (data as T[]) || [];
};

export const useSuperadminDashboardData = ({
  toast,
  setNetworkStats,
  setGlobalStats,
  setSystemHealth,
  setBackupSchedules,
  setAvailableTenants,
  setLastUpdate,
  setLoading,
}: UseSuperadminDashboardDataParams) => {
  const loadNetworkDashboard = useCallback(async () => {
    try {
      const tenants = await fetchTable<TenantRow>("tenants");
      if (!tenants.length) {
        setNetworkStats([]);
        return;
      }

      const networkData = await Promise.all(
        tenants.map(async (tenant) => {
          const [schools, userTenants, students, peis] = await Promise.all([
            fetchTable<SchoolRow>("schools", "id", { tenant_id: tenant.id }),
            fetchTable<UserTenantRow>("user_tenants", "user_id", { tenant_id: tenant.id }),
            fetchTable<StudentRow>("students", "id", { tenant_id: tenant.id }),
            fetchTable<PeiRow>("peis", "status, created_at, student_id", { tenant_id: tenant.id }),
          ]);

          const peisByStatus = {
            draft: peis.filter((p) => p.status === "draft").length,
            pending: peis.filter((p) => p.status === "pending").length,
            approved: peis.filter((p) => p.status === "approved").length,
          };

          return {
            tenant_id: tenant.id,
            network_name: tenant.network_name || "",
            total_schools: schools.length,
            total_students: students.length,
            total_active_peis: peis.length,
            peis_draft: peisByStatus.draft,
            peis_pending: peisByStatus.pending,
            peis_approved: peisByStatus.approved,
            total_users: userTenants.length,
            is_active: tenant.is_active ?? true,
            last_pei_update:
              peis.length > 0
                ? (() => {
                    const sorted = peis.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    return sorted[0]?.created_at || new Date().toISOString();
                  })()
                : new Date().toISOString(),
          } satisfies NetworkStats & { is_active?: boolean };
        })
      );

      setNetworkStats(networkData);
      setAvailableTenants(tenants);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao carregar dados",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast, setNetworkStats, setAvailableTenants]);

  const loadGlobalStats = useCallback(async () => {
    try {
      const [tenants, users, students, peis] = await Promise.all([
        fetchTable<TenantRow>("tenants"),
        fetchTable<ProfileRow>("profiles", "id, is_active"),
        fetchTable<StudentRow>("students", "id"),
        fetchTable<PeiRow>("peis", "status, created_at, student_id", { is_active_version: true }),
      ]);

      const totalPEIs = peis.length;
      const peisApproved = peis.filter((p) => p.status === "approved").length;
      const studentsWithPEI = new Set(peis.map((p) => p.student_id)).size;

      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const peisThisMonth = peis.filter((p) => new Date(p.created_at) >= firstDayThisMonth).length;
      const peisLastMonth = peis.filter((p) => {
        const date = new Date(p.created_at);
        return (
          date >= new Date(now.getFullYear(), now.getMonth() - 1, 1) && date < firstDayThisMonth
        );
      }).length;

      setGlobalStats({
        totalNetworks: tenants.length,
        totalSchools: tenants.length,
        totalStudents: students.length,
        totalPEIs,
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.is_active).length,
        studentsWithPEI,
        studentsWithoutPEI: students.length - studentsWithPEI,
        coveragePercentage: students.length > 0 ? (studentsWithPEI / students.length) * 100 : 0,
        approvalRate: totalPEIs > 0 ? (peisApproved / totalPEIs) * 100 : 0,
        peisThisMonth,
        peisLastMonth,
        growthPercentage:
          peisLastMonth > 0
            ? ((peisThisMonth - peisLastMonth) / peisLastMonth * 100).toFixed(1)
            : peisThisMonth > 0
              ? "100"
              : "0",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao carregar estatísticas",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast, setGlobalStats]);

  const loadSystemHealth = useCallback(async () => {
    try {
      const start = Date.now();
      const { error } = await supabase.from("tenants").select("id").limit(1);
      setSystemHealth({
        databaseStatus: error ? "offline" : "online",
        lastSync: new Date().toISOString(),
        pendingSyncs: 0,
        activeConnections: 1,
        avgResponseTime: Date.now() - start,
      });
    } catch {
      setSystemHealth({
        databaseStatus: "offline",
        lastSync: new Date().toISOString(),
        pendingSyncs: 0,
        activeConnections: 0,
        avgResponseTime: 0,
      });
    }
  }, [setSystemHealth]);

  const loadBackupSchedules = useCallback(async () => {
    setBackupSchedules([
      {
        id: "daily",
        schedule_type: "daily",
        time: "03:00",
        enabled: true,
        last_run: new Date(Date.now() - 86400000).toISOString(),
        next_run: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        id: "weekly",
        schedule_type: "weekly",
        time: "02:00",
        enabled: true,
        last_run: new Date(Date.now() - 604800000).toISOString(),
        next_run: new Date(Date.now() + 604800000).toISOString(),
      },
    ]);
  }, [setBackupSchedules]);

  const loadNetworkDetails = useCallback(
    async (tenantId: string): Promise<NetworkDetails | null> => {
      try {
        const tenants = await fetchTable<TenantRow>("tenants", "*", { id: tenantId });
        if (!tenants.length) return null;

        const tenant = tenants[0];
        const [schools, userTenants, students, peis] = await Promise.all([
          fetchTable<SchoolRow>(
            "schools",
            "id, school_name, school_address, school_phone, school_email, is_active, created_at, updated_at, tenant_id",
            { tenant_id: tenantId }
          ),
          fetchTable<UserTenantRow>("user_tenants", "user_id, tenant_id, school_id", {
            tenant_id: tenantId,
          }),
          fetchTable<StudentRow>(
            "students",
            "id, name, student_id, class_name, is_active, created_at, tenant_id, school_id",
            { tenant_id: tenantId }
          ),
          fetchTable<PeiRow>(
            "peis",
            "id, status, created_at, updated_at, version_number, student_id, tenant_id, school_id",
            { tenant_id: tenantId }
          ),
        ]);

        const userIds = userTenants.map((ut) => ut.user_id);
        const { data: users } = await supabase
          .from("profiles")
          .select("id, full_name, is_active, created_at")
          .in("id", userIds);

        const studentMap = new Map(students.map((s) => [s.id, s.name]));

        if (!tenant) {
          throw new Error('Tenant não encontrado');
        }
        
        return {
          ...tenant,
          network_name: tenant.network_name || "",
          network_address: null,
          network_phone: null,
          network_email: null,
          is_active: tenant.is_active ?? true,
          created_at: tenant.created_at || new Date().toISOString(),
          updated_at: tenant.updated_at || new Date().toISOString(),
          users: (users || []).map((u) => ({
            ...u,
            email: null,
            phone: null,
            is_active: u.is_active ?? true,
            created_at: u.created_at || new Date().toISOString(),
          })),
          students: students.map((s) => ({
            id: s.id,
            name: s.name || '',
            student_id: s.student_id ?? null,
            class_name: s.class_name ?? null,
            is_active: s.is_active ?? true,
            created_at: s.created_at || new Date().toISOString(),
          })),
          peis: peis.map((p) => ({
            ...p,
            version_number: p.version_number || 1,
            student_name: studentMap.get(p.student_id) || "N/A",
            updated_at: p.updated_at || p.created_at,
          })),
          schools: schools.map((s) => ({
            id: s.id,
            school_name: s.school_name || '',
            school_address: s.school_address ?? null,
            school_phone: s.school_phone ?? null,
            school_email: s.school_email ?? null,
            is_active: s.is_active ?? true,
          })),
        } satisfies NetworkDetails;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        toast({
          title: "Erro ao carregar detalhes",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      }
    },
    [toast]
  );

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadNetworkDashboard(),
      loadGlobalStats(),
      loadSystemHealth(),
      loadBackupSchedules(),
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  }, [loadNetworkDashboard, loadGlobalStats, loadSystemHealth, loadBackupSchedules, setLastUpdate, setLoading]);

  return {
    loadNetworkDashboard,
    loadGlobalStats,
    loadSystemHealth,
    loadBackupSchedules,
    loadNetworkDetails,
    loadAllData,
  };
};

