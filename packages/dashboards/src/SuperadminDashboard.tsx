import { useEffect, useState } from "react";
import { supabase } from "@pei/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Input, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from "@pei/ui";
import {
  Users, School, FileText, Download, TrendingUp, Activity, CheckCircle2,
  Clock, BarChart3, Target, Award, BookOpen, Network, Building2, Search,
  RefreshCcw, Database, Shield, Wifi, WifiOff, Server, Eye, Edit, Trash2, Plus,
  Calendar, MapPin, Phone, Mail, UserCog, GraduationCap, UserCheck, AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, useToast } from "@pei/ui";
import ImportCSVDialog from "./components/ImportCSVDialog";
import { useSuperadminUsers } from "../../../apps/pei-collab/src/hooks/useSuperadminUsers";
import { useSuperadminSchools } from "../../../apps/pei-collab/src/hooks/useSuperadminSchools";
import { CreateUserForm } from "./components/users/CreateUserForm";
import { EditUserForm } from "./components/users/EditUserForm";
import { CreateSchoolForm } from "./components/schools/CreateSchoolForm";
import { useSuperadminMaintenance } from "./hooks/useSuperadminMaintenance";
import { useSuperadminDashboardData } from "./hooks/useSuperadminDashboardData";
import type {
  NetworkStats,
  GlobalStats,
  SystemHealth,
  BackupSchedule,
  NetworkDetails,
  SuperadminDashboardProps,
  TenantRow,
  SchoolRow,
} from "./types";

// ==================== COMPONENTES AUXILIARES ====================
const KPICard = ({ title, value, description, icon: Icon, color, trend }: any) => (
  <Card className={`border-l-4 border-l-${color}-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 text-${color}-500`} />
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold text-${color}-600`}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      {trend && (
        <div className="mt-3 flex items-center text-xs">
          {trend.icon && <trend.icon className="mr-1 h-3 w-3 text-muted-foreground" />}
          <span className="text-muted-foreground">{trend.text}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const StatusAlert = ({ systemHealth, lastUpdate }: any) => (
  <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200">
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {systemHealth.databaseStatus === "online" ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
        <AlertDescription>
          <span className="font-semibold text-green-700">Sistema Online</span> • 
          Última atualização: {new Date(lastUpdate).toLocaleTimeString('pt-BR')} • 
          {systemHealth.activeConnections} usuários • Tempo: {systemHealth.avgResponseTime}ms
        </AlertDescription>
      </div>
      {systemHealth.pendingSyncs > 0 && (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
          {systemHealth.pendingSyncs} syncs pendentes
        </Badge>
      )}
    </div>
  </Alert>
);

const NetworkTable = ({ networks, onViewDetails, onToggleStatus, onDelete, loading }: any) => (
  <div className="rounded-lg border">
    <table className="w-full">
      <thead className="bg-muted/50">
        <tr>
          {['Rede', 'Escolas', 'Alunos', 'PEIs', 'Cobertura', 'Aprovação', 'Status', 'Ações'].map(h => (
            <th key={h} className={`px-4 py-3 text-${h === 'Ações' ? 'right' : h === 'Rede' ? 'left' : 'center'} text-sm font-medium`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y">
        {networks.map((net: NetworkStats & { is_active?: boolean }) => {
          const coverage = net.total_students > 0 ? (net.total_active_peis / net.total_students * 100) : 0;
          const approval = net.total_active_peis > 0 ? (net.peis_approved / net.total_active_peis * 100) : 0;
          const isActive = net.is_active !== false; // Default true se não especificado
          return (
            <tr key={net.tenant_id} className="hover:bg-muted/50">
              <td className="px-4 py-3">
                <div className="font-medium">{net.network_name}</div>
                <div className="text-xs text-muted-foreground">{net.total_users} usuários</div>
              </td>
              <td className="px-4 py-3 text-center font-medium">{net.total_schools}</td>
              <td className="px-4 py-3 text-center font-medium">{net.total_students}</td>
              <td className="px-4 py-3 text-center">
                <div className="font-medium">{net.total_active_peis}</div>
                <div className="text-xs text-muted-foreground">{net.peis_pending} pendentes</div>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={coverage >= 80 ? "default" : coverage >= 60 ? "secondary" : "destructive"}>
                  {coverage.toFixed(1)}%
                </Badge>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant="outline">{approval.toFixed(1)}%</Badge>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Ativa" : "Inativa"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(net.tenant_id)} disabled={loading}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onToggleStatus(net.tenant_id, isActive)}
                    disabled={loading}
                    title={isActive ? "Inativar rede" : "Ativar rede"}
                  >
                    {isActive ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDelete(net.tenant_id, net.network_name)}
                    disabled={loading}
                    className="text-destructive hover:text-destructive"
                    title="Excluir rede"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
      </div>
);

// CreateSchoolForm extraído para components/schools/CreateSchoolForm

// ==================== COMPONENTE PRINCIPAL ====================
const SuperadminDashboard = ({ profile }: SuperadminDashboardProps) => {
  // Estados
  const [networkStats, setNetworkStats] = useState<NetworkStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProfileView, setSelectedProfileView] = useState<string>("education_secretary");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkDetails | null>(null);
  const [networkDetailsOpen, setNetworkDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedTenantFilter, setSelectedTenantFilter] = useState("all");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState("all");
  const [availableTenants, setAvailableTenants] = useState<TenantRow[]>([]);
  const [availableSchools, setAvailableSchools] = useState<any[]>([]);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState("all");
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [selectedTenantForBackup, setSelectedTenantForBackup] = useState<string>("all");
  
  const { toast } = useToast();

  // Funções de carregamento de dados extraídas para hooks/useSuperadminDashboardData

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const [usersResult, userRolesResult, tenantsResult, schoolsResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name, is_active, created_at, updated_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("tenants").select("*"),
        supabase.from("schools").select("*").eq("is_active", true),
      ]);

      const users = (usersResult.data || []) as Array<{ id: string; full_name: string; is_active?: boolean; created_at?: string; updated_at?: string }>;
      const userRoles = (userRolesResult.data || []) as Array<{ user_id: string; role: string }>;
      const tenants = (tenantsResult.data || []) as TenantRow[];
      const schools = (schoolsResult.data || []) as Array<{ id: string; school_name: string; tenant_id: string }>;

      const processedUsers = users.map((user, i: number) => {
        const roles = userRoles.filter((ur) => ur.user_id === user.id).map((ur) => ur.role);
        const hash = user.id.split('').reduce((a: number, b: string) => ((a << 5) - a) + b.charCodeAt(0) & a, 0);
        const assignedTenant = tenants[Math.abs(hash) % tenants.length];
        const tenantSchools = schools.filter((s) => s.tenant_id === assignedTenant?.id);
        const assignedSchool = tenantSchools.length ? tenantSchools[i % tenantSchools.length] : schools[i % schools.length];
        
        return {
          ...user,
          tenant_id: assignedTenant?.id || null,
          school_id: assignedSchool?.id || null,
          tenant_name: assignedTenant?.network_name || 'Não definido',
          school_name: assignedSchool?.school_name || 'Não definido',
          roles,
          primary_role: roles[0] || 'teacher'
        };
      });

      setAvailableTenants(tenants);
      setAvailableSchools(schools);
      setAllUsers(processedUsers);
      setUserManagementOpen(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ title: "Erro ao carregar usuários", description: errorMessage, variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  };

  const getFilteredUsers = () => allUsers.filter(u => 
    u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) &&
    (selectedTenantFilter === "all" || u.tenant_id === selectedTenantFilter) &&
    (selectedSchoolFilter === "all" || u.school_id === selectedSchoolFilter)
  );

  const addNewNetwork = async () => {
    const name = prompt("Digite o nome da nova rede:");
    if (!name) return;
    try {
      await supabase.from("tenants").insert({ network_name: name, is_active: true });
      await loadAllData();
      await insertAuditLog('Nova Rede Criada', `"${name}" criada`, 'info');
      toast({ title: "✅ Rede Criada", description: `"${name}" adicionada` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ title: "❌ Erro", description: errorMessage, variant: "destructive" });
    }
  };

  const toggleNetworkStatus = async (tenantId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "ativar" : "inativar";
    const confirmMessage = newStatus 
      ? "Deseja realmente ativar esta rede? Isso permitirá que usuários acessem novamente."
      : "Deseja realmente inativar esta rede? Isso impedirá que usuários acessem os dados desta rede.";

    if (!window.confirm(confirmMessage)) return;

    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("network_name")
        .eq("id", tenantId)
        .single();

      const { error } = await supabase
        .from("tenants")
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq("id", tenantId);

      if (error) throw error;

      await loadAllData();
      await insertAuditLog(
        `Rede ${newStatus ? 'Ativada' : 'Inativada'}`,
        `Rede "${tenant?.network_name || tenantId}" ${action}da`,
        'warning'
      );
      toast({
        title: `✅ Rede ${newStatus ? 'Ativada' : 'Inativada'}`,
        description: `A rede foi ${action}da com sucesso`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "❌ Erro",
        description: `Erro ao ${action} rede: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const deleteNetwork = async (tenantId: string, networkName: string) => {
    // Verificar se há dados associados
    try {
      const [schoolsResult, studentsResult, peisResult, usersResult] = await Promise.all([
        supabase.from("schools").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("students").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("peis").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("user_tenants").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
      ]);

      const schoolsCount = schoolsResult.count ?? 0;
      const studentsCount = studentsResult.count ?? 0;
      const peisCount = peisResult.count ?? 0;
      const usersCount = usersResult.count ?? 0;

      const hasData = schoolsCount > 0 || studentsCount > 0 || peisCount > 0 || usersCount > 0;

      if (hasData) {
        const details = [
          schoolsCount > 0 && `${schoolsCount} escola(s)`,
          studentsCount > 0 && `${studentsCount} aluno(s)`,
          peisCount > 0 && `${peisCount} PEI(s)`,
          usersCount > 0 && `${usersCount} usuário(s)`,
        ].filter(Boolean).join(", ");

        const confirmMessage = `⚠️ ATENÇÃO: Esta rede possui dados associados:\n${details}\n\nA exclusão irá REMOVER PERMANENTEMENTE todos esses dados em cascata.\n\nEsta ação NÃO PODE ser desfeita!\n\nDeseja realmente excluir a rede "${networkName}"?`;

        if (!window.confirm(confirmMessage)) return;

        // Segunda confirmação com validação
        const confirmation = window.prompt(
          `CONFIRMAÇÃO FINAL:\n\nVocê está prestes a EXCLUIR PERMANENTEMENTE a rede "${networkName}" e TODOS os seus dados associados.\n\nDigite "EXCLUIR" para confirmar:`
        );
        if (confirmation !== "EXCLUIR") {
          toast({
            title: "Exclusão cancelada",
            description: "A rede não foi excluída. A confirmação não foi digitada corretamente.",
          });
          return;
        }
      } else {
        if (!window.confirm(`Deseja realmente excluir a rede "${networkName}"?\n\nEsta ação não pode ser desfeita.`)) {
          return;
        }
      }

      // Executar exclusão
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantId);

      if (error) throw error;

      await loadAllData();
      await insertAuditLog(
        'Rede Excluída',
        `Rede "${networkName}" (${tenantId}) excluída permanentemente`,
        'error'
      );
      toast({
        title: "✅ Rede Excluída",
        description: `A rede "${networkName}" foi excluída permanentemente`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "❌ Erro ao Excluir Rede",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleExportReport = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório PEI</title><style>body{font-family:sans-serif;padding:40px}h1{color:#6366f1}</style></head><body><h1>Relatório Multi-Rede</h1><p>Data: ${date}</p><p>Redes: ${globalStats?.totalNetworks}</p><p>Estudantes: ${globalStats?.totalStudents}</p><p>Cobertura: ${globalStats?.coveragePercentage.toFixed(1)}%</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
  };

  // Hooks
  const {
    loadNetworkDetails: loadNetworkDetailsFromHook,
    loadAllData,
  } = useSuperadminDashboardData({
    toast,
    setNetworkStats,
    setGlobalStats,
    setSystemHealth,
    setBackupSchedules,
    setAvailableTenants,
    setLastUpdate,
    setLoading,
  });

  const { insertAuditLog, refreshMaterializedViews, executeManualBackup, viewAuditLogs, toggleBackupSchedule } = useSuperadminMaintenance({ profile, toast, loadAllData, setBackupSchedules });
  const { availableSchoolsForUser, availableSchoolsForEdit, allSchools, loadingSchools, loadingSchoolsForEdit, loadingAction, loadSchoolsForTenant, loadSchoolsForEdit, refreshAllSchools, saveSchool, deleteSchool, setAvailableSchoolsForUser, setAvailableSchoolsForEdit } = useSuperadminSchools({ insertAuditLog });
  const { creatingUser, editingUser, createUser, editUser, toggleUserStatus } = useSuperadminUsers({ 
    loadAllUsers, 
    insertAuditLog, 
    onUserCreated: () => { setCreateUserOpen(false); setAvailableSchoolsForUser([]); }, 
    onUserEdited: () => { setEditUserOpen(false); setSelectedUserForEdit(null); setAvailableSchoolsForEdit([]); } 
  });

  // Wrapper para loadNetworkDetails que atualiza o estado
  const loadNetworkDetails = async (tenantId: string) => {
    setLoadingDetails(true);
    try {
      const details = await loadNetworkDetailsFromHook(tenantId);
      if (details) {
        setSelectedNetwork(details);
        setNetworkDetailsOpen(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ title: "Erro ao carregar detalhes", description: errorMessage, variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadAllData();
    refreshAllSchools();
    const interval = setInterval(loadAllData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto" />
          <p className="text-lg font-medium text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredNetworks = networkStats.filter(n => n.network_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Painel Estratégico Multi-Rede
          </h1>
          <p className="text-lg text-muted-foreground">Visão consolidada • Sistema PEI Collab</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAllData} variant="outline" size="lg">
            <RefreshCcw className="mr-2 h-5 w-5" />Atualizar
          </Button>
          <Button onClick={handleExportReport} size="lg" className="shadow-lg">
            <Download className="mr-2 h-5 w-5" />Exportar
          </Button>
        </div>
      </div>

      {/* Status */}
      {systemHealth && <StatusAlert systemHealth={systemHealth} lastUpdate={lastUpdate} />}

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Redes Municipais" value={globalStats?.totalNetworks || 0} description={`${globalStats?.totalSchools || 0} escolas • ${globalStats?.totalUsers || 0} usuários`} icon={Network} color="blue" trend={{ icon: Building2, text: `${globalStats?.totalStudents || 0} alunos` }} />
        <KPICard title="Cobertura Global" value={`${globalStats?.coveragePercentage.toFixed(1) || 0}%`} description={`${globalStats?.studentsWithPEI || 0} de ${globalStats?.totalStudents || 0} com PEI`} icon={Target} color="green" />
        <KPICard title="Taxa de Aprovação" value={`${globalStats?.approvalRate.toFixed(1) || 0}%`} description="PEIs aprovados" icon={Award} color="purple" />
        <KPICard title="Crescimento" value={`${Number(globalStats?.growthPercentage) > 0 ? '+' : ''}${globalStats?.growthPercentage || 0}%`} description={`${globalStats?.peisThisMonth || 0} este mês vs ${globalStats?.peisLastMonth || 0}`} icon={TrendingUp} color="orange" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-xl p-2">
          <TabsList className="flex w-full flex-wrap gap-2 bg-transparent">
            {[
              { value: "overview", icon: BarChart3, label: "Visão" },
              { value: "networks", icon: Network, label: "Redes" },
              { value: "schools", icon: School, label: "Escolas" },
              { value: "analytics", icon: TrendingUp, label: "Analytics" },
              { value: "users", icon: Users, label: "Usuários" },
              { value: "profiles", icon: UserCog, label: "Visão por Perfil" },
              { value: "system", icon: Server, label: "Sistema" }
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-1 min-w-[100px] flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* TAB: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <BookOpen className="h-5 w-5" />Sobre o PEI Collab
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Sistema integrado para gestão de Planos Educacionais Individualizados em múltiplas redes municipais.
                </p>
                <div className="space-y-2">
                  {['Gestão multi-rede e multi-escola', 'Dashboard consolidado em tempo real', 'Suporte offline via PWA'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-blue-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Shield className="h-5 w-5" />Segurança e Conformidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'RLS Habilitado', icon: CheckCircle2, status: 'Ativo' },
                  { label: 'Auditoria', icon: Database, status: 'Completa' },
                  { label: 'Backup', icon: null, status: 'Automático (24h)' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    {item.icon ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        <item.icon className="h-3 w-3 mr-1" />{item.status}
                      </Badge>
                    ) : (
                      <span className="text-sm font-medium">{item.status}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Ranking */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />Top 5 Redes por Performance
              </CardTitle>
              <CardDescription>Ranking baseado em cobertura e aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkStats.slice(0, 5).map((net, idx) => {
                  const coverage = (net.total_active_peis / net.total_students * 100);
                  const approval = (net.peis_approved / net.total_active_peis * 100);
                  return (
                    <div key={net.tenant_id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{net.network_name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {net.total_schools} escolas • {net.total_students} alunos • {net.total_users} usuários
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={coverage >= 80 ? "default" : coverage >= 60 ? "secondary" : "destructive"}>
                          Cobertura: {coverage.toFixed(0)}%
                        </Badge>
                        <div className="text-xs text-muted-foreground">Aprovação: {approval.toFixed(0)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Redes */}
        <TabsContent value="networks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Network className="h-6 w-6" />Redes Conectadas</CardTitle>
                  <CardDescription>Gerencie todas as redes municipais</CardDescription>
                </div>
                <Button onClick={addNewNetwork}><Network className="h-4 w-4 mr-2" />Adicionar</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar rede..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              {filteredNetworks.length === 0 ? (
                <div className="text-center py-12">
                  <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma rede encontrada</h3>
                  <Button onClick={addNewNetwork}><Network className="h-4 w-4 mr-2" />Adicionar Primeira Rede</Button>
                </div>
              ) : (
                <NetworkTable 
                  networks={filteredNetworks} 
                  onViewDetails={loadNetworkDetails}
                  onToggleStatus={toggleNetworkStatus}
                  onDelete={deleteNetwork}
                  loading={loadingDetails} 
                />
              )}
            </CardContent>
          </Card>

          {/* Status PEIs */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'PEIs Aprovados', value: networkStats.reduce((s, n) => s + n.peis_approved, 0), color: 'green', icon: CheckCircle2 },
              { title: 'PEIs Pendentes', value: networkStats.reduce((s, n) => s + n.peis_pending, 0), color: 'yellow', icon: Clock },
              { title: 'Rascunhos', value: networkStats.reduce((s, n) => s + n.peis_draft, 0), color: 'gray', icon: FileText }
            ].map((item, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <item.icon className={`h-5 w-5 text-${item.color}-500`} />{item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold text-${item.color}-600`}>{item.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {i === 0 ? 'Em todas as redes' : i === 1 ? 'Aguardando aprovação' : 'Em elaboração'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: Escolas */}
        <TabsContent value="schools" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><School className="h-6 w-6" />Gestão de Escolas</CardTitle>
                  <CardDescription>Crie e gerencie escolas por rede</CardDescription>
                </div>
                <div className="flex gap-2">
                  <ImportCSVDialog type="schools" onImportComplete={refreshAllSchools} />
                  <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingSchool(null); setSchoolDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />Nova Escola
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingSchool ? 'Editar' : 'Criar'} Escola</DialogTitle>
                        <DialogDescription>Preencha os dados da escola</DialogDescription>
                      </DialogHeader>
                      <CreateSchoolForm 
                        tenants={availableTenants}
                        onSubmit={async (data: any) => {
                          await saveSchool({ id: editingSchool?.id, ...data });
                          setSchoolDialogOpen(false);
                          setEditingSchool(null);
                        }}
                        loading={loadingAction}
                        onCancel={() => setSchoolDialogOpen(false)}
                        editingSchool={editingSchool}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Filtrar por Rede</Label>
                    <Select value={selectedNetworkFilter} onValueChange={setSelectedNetworkFilter}>
                      <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {availableTenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.network_name || t.name || `Rede ${t.id.slice(0, 8)}`}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Buscar Escola</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Digite o nome..." value={schoolSearchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchoolSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                </div>

                {allSchools.length === 0 ? (
                  <div className="text-center py-12">
                    <School className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma escola cadastrada</h3>
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Rede</TableHead>
                          <TableHead>Endereço</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSchools.filter((s: SchoolRow) => {
                          const matchesNetwork = selectedNetworkFilter === 'all' || s.tenant_id === selectedNetworkFilter;
                          const matchesSearch = !schoolSearchTerm || s.school_name?.toLowerCase().includes(schoolSearchTerm.toLowerCase());
                          return matchesNetwork && matchesSearch;
                        }).map((school: SchoolRow) => (
                          <TableRow key={school.id}>
                            <TableCell className="font-medium">{school.school_name}</TableCell>
                            <TableCell>{availableTenants.find(t => t.id === school.tenant_id)?.network_name || '—'}</TableCell>
                            <TableCell>{school.school_address || "—"}</TableCell>
                            <TableCell>{school.school_phone || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={school.is_active ? "default" : "secondary"}>
                                {school.is_active ? "Ativa" : "Inativa"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { setEditingSchool(school); setSchoolDialogOpen(true); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={async () => {
                                  if (window.confirm("Tem certeza?")) await deleteSchool(school.id);
                                }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />Evolução Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Este Mês</p>
                    <p className="text-2xl font-bold text-green-600">{globalStats?.peisThisMonth || 0} PEIs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">
                      {Number(globalStats?.growthPercentage) > 0 ? '+' : ''}{globalStats?.growthPercentage || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">vs mês anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />Metas de Cobertura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cobertura Atual</span>
                    <span className="font-bold text-primary">{globalStats?.coveragePercentage.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-primary h-3 rounded-full transition-all" style={{ width: `${globalStats?.coveragePercentage || 0}%` }} />
                  </div>
                </div>
                <div className="pt-4 space-y-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Meta: 80%</span>
                    <Badge variant={(globalStats?.coveragePercentage || 0) >= 80 ? "default" : "secondary"}>
                      {(globalStats?.coveragePercentage || 0) >= 80 ? "✅ Atingida" : "🎯 Em progresso"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparativo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />Comparativo entre Redes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {networkStats.map((net) => {
                  const coverage = (net.total_active_peis / net.total_students * 100);
                  const approval = (net.peis_approved / net.total_active_peis * 100);
                  return (
                    <div key={net.tenant_id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{net.network_name}</h4>
                          <p className="text-sm text-muted-foreground">{net.total_schools} escolas • {net.total_students} alunos</p>
                        </div>
                        <Badge variant={coverage >= 80 ? "default" : coverage >= 60 ? "secondary" : "destructive"}>
                          {coverage.toFixed(1)}% cobertura
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">PEIs Ativos</p>
                          <p className="text-lg font-bold">{net.total_active_peis}</p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${coverage}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Aprovação</p>
                          <p className="text-lg font-bold text-green-600">{approval.toFixed(1)}%</p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${approval}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Pendentes</p>
                          <p className="text-lg font-bold text-yellow-600">{net.peis_pending}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Usuários */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />Gestão Global de Usuários
              </CardTitle>
              <CardDescription>Gerencie usuários de todas as redes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Gestão de Usuários</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualize e gerencie todos os usuários do sistema
                </p>
                <Button onClick={loadAllUsers} disabled={loadingUsers}>
                  <Users className="h-4 w-4 mr-2" />
                  {loadingUsers ? "Carregando..." : "Abrir Gerenciamento"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumo por Role */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { role: 'Coordenadores', pct: 0.15, color: 'blue' },
              { role: 'Professores AEE', pct: 0.25, color: 'green' },
              { role: 'Professores', pct: 0.50, color: 'purple' },
              { role: 'Famílias', pct: 0.10, color: 'pink' }
            ].map((item, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{item.role}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold text-${item.color}-600`}>
                    {Math.floor((globalStats?.totalUsers || 0) * item.pct)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: Visão por Perfil */}
        <TabsContent value="profiles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-6 w-6" />Visão por Perfil
              </CardTitle>
              <CardDescription>
                Visualize como cada perfil de usuário vê o sistema para melhor controle e visão estratégica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seletor de Perfil */}
              <div className="flex items-center gap-4">
                <Label htmlFor="profile-select" className="text-sm font-medium">
                  Selecione o perfil para visualizar:
                </Label>
                <Select value={selectedProfileView} onValueChange={setSelectedProfileView}>
                  <SelectTrigger id="profile-select" className="w-[250px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education_secretary">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Secretário de Educação
                      </div>
                    </SelectItem>
                    <SelectItem value="coordinator">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Coordenador
                      </div>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Professor
                      </div>
                    </SelectItem>
                    <SelectItem value="school_manager">
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        Gestor Escolar
                      </div>
                    </SelectItem>
                    <SelectItem value="school_director">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Diretor Escolar
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Informações do Perfil Selecionado */}
              <div className="grid gap-4 md:grid-cols-2">
                {selectedProfileView === "education_secretary" && (
                  <>
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserCheck className="h-5 w-5" />Secretário de Educação
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>Visão:</strong> Visão estratégica de toda a rede municipal
                        </p>
                        <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                          <li>Estatísticas gerais da rede</li>
                          <li>Performance de escolas</li>
                          <li>Métricas de inclusão</li>
                          <li>Taxa de cobertura de PEIs</li>
                          <li>Engajamento familiar</li>
                          <li>Relatórios executivos</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Acesso e Permissões</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Badge variant="default" className="mr-2">Visualização completa</Badge>
                        <Badge variant="outline" className="mr-2">Relatórios</Badge>
                        <Badge variant="outline" className="mr-2">Exportação</Badge>
                        <p className="text-xs text-muted-foreground mt-3">
                          O secretário tem acesso a todas as escolas da sua rede municipal e pode visualizar métricas agregadas.
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}

                {selectedProfileView === "coordinator" && (
                  <>
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />Coordenador
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>Visão:</strong> Gestão de PEIs e coordenação pedagógica
                        </p>
                        <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                          <li>Fila de PEIs pendentes</li>
                          <li>Validação e aprovação de PEIs</li>
                          <li>Gestão de professores e turmas</li>
                          <li>Histórico de versões</li>
                          <li>Geração de tokens familiares</li>
                          <li>Impressão em lote</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Acesso e Permissões</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Badge variant="default" className="mr-2">Validação de PEIs</Badge>
                        <Badge variant="outline" className="mr-2">Gestão de professores</Badge>
                        <Badge variant="outline" className="mr-2">Aprovação</Badge>
                        <p className="text-xs text-muted-foreground mt-3">
                          O coordenador gerencia o fluxo de PEIs, valida documentos e coordena o trabalho dos professores.
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}

                {selectedProfileView === "teacher" && (
                  <>
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <GraduationCap className="h-5 w-5" />Professor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>Visão:</strong> Criação e gestão de PEIs dos seus alunos
                        </p>
                        <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                          <li>Lista de alunos com PEI</li>
                          <li>Criação e edição de PEIs</li>
                          <li>Status de aprovação</li>
                          <li>Comentários e feedback</li>
                          <li>Histórico de versões</li>
                          <li>Visualização de relatórios</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Acesso e Permissões</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Badge variant="default" className="mr-2">Criação de PEIs</Badge>
                        <Badge variant="outline" className="mr-2">Edição</Badge>
                        <Badge variant="outline" className="mr-2">Visualização</Badge>
                        <p className="text-xs text-muted-foreground mt-3">
                          O professor cria e gerencia PEIs dos alunos atribuídos a ele, podendo editar enquanto estiver em rascunho.
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}

                {selectedProfileView === "school_manager" && (
                  <>
                    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <School className="h-5 w-5" />Gestor Escolar
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>Visão:</strong> Gestão administrativa da escola
                        </p>
                        <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                          <li>Gestão de alunos</li>
                          <li>Gestão de usuários da escola</li>
                          <li>Visualização de PEIs</li>
                          <li>Relatórios escolares</li>
                          <li>Importação de dados</li>
                          <li>Logs de auditoria</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Acesso e Permissões</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Badge variant="default" className="mr-2">Gestão de alunos</Badge>
                        <Badge variant="outline" className="mr-2">Gestão de usuários</Badge>
                        <Badge variant="outline" className="mr-2">Visualização</Badge>
                        <p className="text-xs text-muted-foreground mt-3">
                          O gestor escolar administra os dados da escola, alunos e usuários vinculados.
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}

                {selectedProfileView === "school_director" && (
                  <>
                    <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="h-5 w-5" />Diretor Escolar
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>Visão:</strong> Visão estratégica da escola
                        </p>
                        <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                          <li>Estatísticas da escola</li>
                          <li>Performance de professores</li>
                          <li>Alunos com PEI</li>
                          <li>Taxa de conclusão</li>
                          <li>Gestão de turmas</li>
                          <li>Relatórios escolares</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Acesso e Permissões</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Badge variant="default" className="mr-2">Visualização completa</Badge>
                        <Badge variant="outline" className="mr-2">Relatórios</Badge>
                        <Badge variant="outline" className="mr-2">Gestão de turmas</Badge>
                        <p className="text-xs text-muted-foreground mt-3">
                          O diretor tem visão completa da escola, professores e alunos, com foco em métricas e performance.
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Aviso sobre Visualização */}
              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <strong>Nota:</strong> Esta é uma visão resumida do que cada perfil vê. Para visualizar o dashboard completo de cada perfil, 
                    você pode criar um usuário de teste com o perfil desejado ou acessar diretamente através do sistema de autenticação.
                    Como superadmin, você tem acesso total a todos os dados através das outras abas deste painel.
                  </AlertDescription>
                </div>
              </Alert>

              {/* Estatísticas Rápidas do Perfil */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
                  <CardDescription>
                    Dados relevantes para o perfil selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    {selectedProfileView === "education_secretary" && (
                      <>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{globalStats?.totalNetworks || 0}</div>
                          <div className="text-sm text-muted-foreground">Redes</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{globalStats?.totalSchools || 0}</div>
                          <div className="text-sm text-muted-foreground">Escolas</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{globalStats?.coveragePercentage.toFixed(1) || 0}%</div>
                          <div className="text-sm text-muted-foreground">Cobertura</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{globalStats?.approvalRate.toFixed(1) || 0}%</div>
                          <div className="text-sm text-muted-foreground">Aprovação</div>
                        </div>
                      </>
                    )}
                    {selectedProfileView === "coordinator" && (
                      <>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{networkStats.reduce((s, n) => s + n.peis_pending, 0)}</div>
                          <div className="text-sm text-muted-foreground">PEIs Pendentes</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{networkStats.reduce((s, n) => s + n.peis_approved, 0)}</div>
                          <div className="text-sm text-muted-foreground">PEIs Aprovados</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{networkStats.reduce((s, n) => s + n.total_students, 0)}</div>
                          <div className="text-sm text-muted-foreground">Alunos</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{allUsers.filter((u: any) => u.roles?.includes('teacher')).length}</div>
                          <div className="text-sm text-muted-foreground">Professores</div>
                        </div>
                      </>
                    )}
                    {selectedProfileView === "teacher" && (
                      <>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{networkStats.reduce((s, n) => s + n.total_active_peis, 0)}</div>
                          <div className="text-sm text-muted-foreground">PEIs Ativos</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{networkStats.reduce((s, n) => s + n.peis_approved, 0)}</div>
                          <div className="text-sm text-muted-foreground">Aprovados</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{networkStats.reduce((s, n) => s + n.peis_draft, 0)}</div>
                          <div className="text-sm text-muted-foreground">Rascunhos</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{networkStats.reduce((s, n) => s + n.peis_pending, 0)}</div>
                          <div className="text-sm text-muted-foreground">Pendentes</div>
                        </div>
                      </>
                    )}
                    {(selectedProfileView === "school_manager" || selectedProfileView === "school_director") && (
                      <>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{globalStats?.totalSchools || 0}</div>
                          <div className="text-sm text-muted-foreground">Escolas</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{globalStats?.totalStudents || 0}</div>
                          <div className="text-sm text-muted-foreground">Alunos</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{globalStats?.studentsWithPEI || 0}</div>
                          <div className="text-sm text-muted-foreground">Com PEI</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{globalStats?.coveragePercentage.toFixed(1) || 0}%</div>
                          <div className="text-sm text-muted-foreground">Cobertura</div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Sistema */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />Status do Banco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Status', value: <Badge variant="outline" className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Online</Badge> },
                  { label: 'Conexões Ativas', value: systemHealth?.activeConnections || 0 },
                  { label: 'Tempo Médio', value: `${systemHealth?.avgResponseTime || 0}ms` },
                  { label: 'Última Sync', value: new Date(lastUpdate).toLocaleString('pt-BR') }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-xs">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={refreshMaterializedViews}>
                  <RefreshCcw className="h-4 w-4 mr-2" />Atualizar Views
                </Button>
                <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />Backup Completo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Selecionar Escopo do Backup</DialogTitle>
                      <DialogDescription>
                        Escolha se deseja fazer backup de todas as redes ou de uma rede específica
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Escopo do Backup</Label>
                        <Select value={selectedTenantForBackup} onValueChange={setSelectedTenantForBackup}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o escopo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as Redes (Backup Completo)</SelectItem>
                            {availableTenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.network_name || tenant.name || `Rede ${tenant.id.slice(0, 8)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setBackupDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => {
                            const tenantId = selectedTenantForBackup === "all" ? undefined : selectedTenantForBackup;
                            executeManualBackup(false, tenantId);
                            setBackupDialogOpen(false);
                          }}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          {selectedTenantForBackup === "all" ? "Fazer Backup Completo" : "Fazer Backup da Rede"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="w-full justify-start" onClick={viewAuditLogs}>
                  <Activity className="h-4 w-4 mr-2" />Ver Logs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Backups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />Agendamento de Backups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {backupSchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.enabled ? "default" : "secondary"}>
                        {schedule.schedule_type.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{schedule.time}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Último: {schedule.last_run ? new Date(schedule.last_run).toLocaleString('pt-BR') : 'Nunca executado'}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleBackupSchedule(schedule.id)}>
                    {schedule.enabled ? 'Pausar' : 'Ativar'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Detalhes da Rede */}
      <Dialog open={networkDetailsOpen} onOpenChange={setNetworkDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-6 w-6" />{selectedNetwork?.network_name}
            </DialogTitle>
            <DialogDescription>Detalhes completos da rede</DialogDescription>
          </DialogHeader>
          {selectedNetwork && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />Informações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { icon: MapPin, label: 'Endereço', value: selectedNetwork.network_address },
                      { icon: Phone, label: 'Telefone', value: selectedNetwork.network_phone },
                      { icon: Mail, label: 'E-mail', value: selectedNetwork.network_email },
                      { icon: Calendar, label: 'Criada em', value: new Date(selectedNetwork.created_at).toLocaleDateString('pt-BR') }
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.label}:</span>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">{item.value || "Não informado"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { title: 'Usuários', value: selectedNetwork.users.length, detail: `${selectedNetwork.users.filter(u => u.is_active).length} ativos` },
                  { title: 'Estudantes', value: selectedNetwork.students.length, detail: `${selectedNetwork.students.filter(s => s.is_active).length} ativos` },
                  { title: 'PEIs', value: selectedNetwork.peis.length, detail: `${selectedNetwork.peis.filter(p => p.status === 'approved').length} aprovados` },
                  { title: 'Escolas', value: selectedNetwork.schools.length, detail: `${selectedNetwork.schools.filter(s => s.is_active).length} ativas` }
                ].map((item, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{item.value}</div>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Gerenciamento de Usuários */}
      <Dialog open={userManagementOpen} onOpenChange={setUserManagementOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />Gerenciamento de Usuários
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Buscar por Nome</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Digite o nome..." value={userSearchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Filtrar por Rede</Label>
                    <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                      <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Redes</SelectItem>
                        {availableTenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.network_name} ({allUsers.filter(u => u.tenant_id === t.id).length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Filtrar por Escola</Label>
                    <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
                      <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Escolas</SelectItem>
                        {availableSchools.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.school_name} ({allUsers.filter(u => u.school_id === s.id).length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {getFilteredUsers().length} de {allUsers.length} usuários
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setUserSearchTerm("");
                      setSelectedTenantFilter("all");
                      setSelectedSchoolFilter("all");
                    }}>
                      <RefreshCcw className="h-4 w-4 mr-1" />Limpar
                    </Button>
                    <Button size="sm" onClick={() => setCreateUserOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />Criar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              {[
                { title: 'Total', value: allUsers.length, desc: 'Cadastrados' },
                { title: 'Ativos', value: allUsers.filter(u => u.is_active).length, desc: `${((allUsers.filter(u => u.is_active).length / allUsers.length) * 100).toFixed(1)}%`, color: 'green' },
                { title: 'Inativos', value: allUsers.filter(u => !u.is_active).length, desc: `${((allUsers.filter(u => !u.is_active).length / allUsers.length) * 100).toFixed(1)}%`, color: 'red' },
                { title: 'Novos', value: allUsers.filter(u => {
                  const d = new Date(u.created_at);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length, desc: 'Este mês', color: 'blue' }
              ].map((item, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${item.color ? `text-${item.color}-600` : ''}`}>{item.value}</div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />Lista de Usuários ({getFilteredUsers().length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Rede</TableHead>
                      <TableHead>Escola</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredUsers().map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Network className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{user.tenant_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <School className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{user.school_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {role === 'superadmin' ? 'Admin' :
                                 role === 'coordinator' ? 'Coord' :
                                 role === 'aee_teacher' ? 'AEE' :
                                 role === 'teacher' ? 'Prof' :
                                 role === 'family' ? 'Fam' : role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleUserStatus(user.id, user.is_active)}>
                              {user.is_active ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedUserForEdit(user);
                              if (user?.tenant_id) loadSchoolsForEdit(user.tenant_id);
                              setEditUserOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />Distribuição por Função
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {['superadmin', 'coordinator', 'aee_teacher', 'teacher', 'family', 'specialist'].map(role => {
                    const filtered = getFilteredUsers();
                    const count = filtered.filter(u => u.roles.includes(role)).length;
                    const active = filtered.filter(u => u.roles.includes(role) && u.is_active).length;
                    return (
                      <div key={role} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {role === 'superadmin' ? 'Admin' :
                             role === 'coordinator' ? 'Coordenadores' :
                             role === 'aee_teacher' ? 'Prof. AEE' :
                             role === 'teacher' ? 'Professores' :
                             role === 'family' ? 'Famílias' : 'Especialistas'}
                          </span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${filtered.length > 0 ? (count / filtered.length) * 100 : 0}%` }} />
                        </div>
                        <div className="text-xs text-muted-foreground">{active} ativos</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Criar Usuário */}
      <Dialog open={createUserOpen} onOpenChange={(open: boolean) => {
        setCreateUserOpen(open);
        if (!open) setAvailableSchoolsForUser([]);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-6 w-6" />Criar Novo Usuário
            </DialogTitle>
          </DialogHeader>
          <CreateUserForm 
            tenants={availableTenants}
            availableSchoolsForUser={availableSchoolsForUser}
            loadingSchools={loadingSchools}
            onTenantChange={loadSchoolsForTenant}
            onSubmit={createUser}
            loading={creatingUser}
            onCancel={() => setCreateUserOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Usuário */}
      <Dialog open={editUserOpen} onOpenChange={(open: boolean) => {
        setEditUserOpen(open);
        if (!open) {
          setAvailableSchoolsForEdit([]);
          setSelectedUserForEdit(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-6 w-6" />Editar Usuário
            </DialogTitle>
          </DialogHeader>
          {selectedUserForEdit && (
            <EditUserForm 
              user={selectedUserForEdit}
              tenants={availableTenants}
              availableSchoolsForEdit={availableSchoolsForEdit}
              loadingSchoolsForEdit={loadingSchoolsForEdit}
              onTenantChange={loadSchoolsForEdit}
              onSubmit={(formData) => editUser(selectedUserForEdit.id, formData)}
              loading={editingUser}
              onCancel={() => setEditUserOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminDashboard;
export { SuperadminDashboard };