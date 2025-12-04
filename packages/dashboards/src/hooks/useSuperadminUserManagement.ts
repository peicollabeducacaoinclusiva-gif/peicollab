import { useCallback, useMemo, useState } from "react";
import { supabase } from "@pei/database";

type ToastArgs = {
  title: string;
  description: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
};

type ToastFunction = (args: ToastArgs) => void;

type TenantOption = {
  id: string;
  network_name?: string | null;
  name?: string | null;
};

type SchoolOption = {
  id: string;
  school_name?: string | null;
  name?: string | null;
  tenant_id?: string | null;
  is_active?: boolean | null;
};

type UserRoleRow = {
  user_id: string;
  role: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
};

export type ManagedUser = {
  id: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenant_id: string | null;
  school_id: string | null;
  tenant_name: string;
  school_name: string;
  roles: string[];
  primary_role: string;
};

interface UseSuperadminUserManagementParams {
  toast: ToastFunction;
}

export const useSuperadminUserManagement = ({ toast }: UseSuperadminUserManagementParams) => {
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all");
  const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
  const [availableSchools, setAvailableSchools] = useState<SchoolOption[]>([]);

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [availableSchoolsForUser, setAvailableSchoolsForUser] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<ManagedUser | null>(null);
  const [availableSchoolsForEdit, setAvailableSchoolsForEdit] = useState<SchoolOption[]>([]);
  const [loadingSchoolsForEdit, setLoadingSchoolsForEdit] = useState(false);

  const clearSchoolsForUser = useCallback(() => {
    setAvailableSchoolsForUser([]);
    setLoadingSchools(false);
  }, []);

  const clearSchoolsForEdit = useCallback(() => {
    setAvailableSchoolsForEdit([]);
    setLoadingSchoolsForEdit(false);
    setSelectedUserForEdit(null);
  }, []);

  const loadSchoolsForTenant = useCallback(
    async (tenantId: string) => {
      setLoadingSchools(true);
      try {
        const { data: schools, error } = await supabase
          .from("schools")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("school_name", { ascending: true });

        if (error) {
          throw error;
        }

        const tenant = availableTenants.find((item) => item.id === tenantId);
        const networkName = tenant?.network_name || tenant?.name || "Rede";

        console.log(`📊 Encontradas ${schools?.length || 0} escolas para a rede ${networkName}:`, schools);

        setAvailableSchoolsForUser(schools || []);
      } catch (error) {
        console.error("❌ Erro ao carregar escolas:", error);
        setAvailableSchoolsForUser([]);
        toast({
          title: "Erro ao carregar escolas",
          description: "Não foi possível carregar as escolas desta rede",
          variant: "destructive",
        });
      } finally {
        setLoadingSchools(false);
      }
    },
    [availableTenants, toast]
  );

  const loadSchoolsForEdit = useCallback(
    async (tenantId: string) => {
      setLoadingSchoolsForEdit(true);
      try {
        const { data: schools, error } = await supabase
          .from("schools")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("school_name", { ascending: true });

        if (error) {
          throw error;
        }

        const tenant = availableTenants.find((item) => item.id === tenantId);
        const networkName = tenant?.network_name || tenant?.name || "Rede";

        console.log(`📊 Encontradas ${schools?.length || 0} escolas para edição da rede ${networkName}:`, schools);

        setAvailableSchoolsForEdit(schools || []);
      } catch (error) {
        console.error("❌ Erro ao carregar escolas para edição:", error);
        setAvailableSchoolsForEdit([]);
        toast({
          title: "Erro ao carregar escolas",
          description: "Não foi possível carregar as escolas desta rede",
          variant: "destructive",
        });
      } finally {
        setLoadingSchoolsForEdit(false);
      }
    },
    [availableTenants, toast]
  );

  const loadAllUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      console.log("🔍 Carregando todos os usuários do sistema...");

      const { data: tenantsData, error: tenantsError } = await supabase.from("tenants").select("id, network_name, name");

      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, is_active, created_at, updated_at")
        .order("created_at", { ascending: false });

      const { data: userRolesData, error: rolesError } = await supabase.from("user_roles").select("user_id, role");

      const { data: schoolsData, error: schoolsError } = await supabase
        .from("schools")
        .select("*")
        .eq("is_active", true)
        .order("school_name", { ascending: true });

      if (usersError) throw usersError;
      if (tenantsError) console.warn("Erro ao buscar tenants:", tenantsError);
      if (rolesError) console.warn("Erro ao buscar roles:", rolesError);
      if (schoolsError) console.warn("Erro ao buscar escolas:", schoolsError);

      const tenants = (tenantsData as TenantOption[]) || [];
      const userRoles = (userRolesData as UserRoleRow[]) || [];
      const schools = (schoolsData as SchoolOption[]) || [];

      const processedUsers: ManagedUser[] =
        (usersData as ProfileRow[] | null)?.map((user, index) => {
          const rolesForUser = userRoles.filter((role) => role.user_id === user.id).map((role) => role.role);
          const primaryRole = rolesForUser[0] || "teacher";

          let assignedTenant: TenantOption | undefined;
          if (tenants.length > 0) {
            if (primaryRole === "superadmin") {
              assignedTenant = tenants[0];
            } else if (primaryRole === "coordinator") {
              assignedTenant = tenants[index % tenants.length];
            } else {
              const hash = user.id.split("").reduce((acc, char) => {
                acc = (acc << 5) - acc + char.charCodeAt(0);
                return acc & acc;
              }, 0);
              assignedTenant = tenants[Math.abs(hash) % tenants.length];
            }
          }

          let assignedSchool: SchoolOption | undefined;
          if (schools.length > 0) {
            if (assignedTenant) {
              const tenantSchools = schools.filter((school) => school.tenant_id === assignedTenant?.id);
              if (tenantSchools.length > 0) {
                assignedSchool = tenantSchools[index % tenantSchools.length];
              } else {
                assignedSchool = schools[index % schools.length];
              }
            } else {
              assignedSchool = schools[index % schools.length];
            }
          }

          return {
            id: user.id,
            full_name: user.full_name || "Usuário",
            is_active: Boolean(user.is_active),
            created_at: user.created_at,
            updated_at: user.updated_at,
            tenant_id: assignedTenant?.id || null,
            school_id: assignedSchool?.id || null,
            tenant_name: assignedTenant?.network_name || assignedTenant?.name || "Não definido",
            school_name: assignedSchool?.school_name || assignedSchool?.name || "Não definido",
            roles: rolesForUser,
            primary_role: primaryRole,
          };
        }) || [];

      console.log("📊 Dados carregados:", { tenants, processedUsers, schools });

      setAvailableTenants(tenants);
      setAvailableSchools(schools);
      setAllUsers(processedUsers);
      setUserManagementOpen(true);
    } catch (error: any) {
      console.error("❌ Erro ao carregar usuários:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchesSearch = user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase());
      const matchesTenant = selectedTenantFilter === "all" || user.tenant_id === selectedTenantFilter;
      const matchesSchool = selectedSchoolFilter === "all" || user.school_id === selectedSchoolFilter;

      return matchesSearch && matchesTenant && matchesSchool;
    });
  }, [allUsers, selectedSchoolFilter, selectedTenantFilter, userSearchTerm]);

  const openEditUser = useCallback(
    (user: ManagedUser) => {
      setSelectedUserForEdit(user);
      if (user?.tenant_id) {
        loadSchoolsForEdit(user.tenant_id);
      } else {
        setAvailableSchoolsForEdit([]);
      }
      setEditUserOpen(true);
    },
    [loadSchoolsForEdit]
  );

  const updateAvailableTenants = useCallback((tenants: TenantOption[]) => {
    setAvailableTenants(tenants);
  }, []);

  return {
    // state
    userManagementOpen,
    setUserManagementOpen,
    allUsers,
    loadingUsers,
    userSearchTerm,
    setUserSearchTerm,
    selectedTenantFilter,
    setSelectedTenantFilter,
    selectedSchoolFilter,
    setSelectedSchoolFilter,
    availableTenants,
    updateAvailableTenants,
    availableSchools,
    createUserOpen,
    setCreateUserOpen,
    creatingUser,
    setCreatingUser,
    availableSchoolsForUser,
    loadingSchools,
    editUserOpen,
    setEditUserOpen,
    editingUser,
    setEditingUser,
    selectedUserForEdit,
    availableSchoolsForEdit,
    loadingSchoolsForEdit,
    setAvailableSchoolsForUser,
    setAvailableSchoolsForEdit,
    setLoadingSchools,
    setLoadingSchoolsForEdit,
    setSelectedUserForEdit,
    // derived
    filteredUsers,
    // actions
    loadAllUsers,
    clearSchoolsForUser,
    clearSchoolsForEdit,
    loadSchoolsForTenant,
    loadSchoolsForEdit,
    openEditUser,
  };
};










