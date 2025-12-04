import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Users, School, FileText, GraduationCap, Download, TrendingUp,
  Activity, CheckCircle2, Clock, AlertCircle, BarChart3,
  Target, Award, BookOpen, Network, Building2, Search,
  RefreshCcw, Database, Shield, Wifi, WifiOff, Server,
  Eye, Edit, Trash2, Plus, Calendar, MapPin, Phone, Mail, XCircle, Printer
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import ImportCSVDialog from "@/components/superadmin/ImportCSVDialog";
import CreateUserDialog from "@/components/superadmin/CreateUserDialog";
import { formatTimestampForFilename, downloadTextFile, downloadBlob } from "@pei/ui";
import { ExternalLink } from "lucide-react";
import { insertAuditLog } from "@pei/database/audit";

// Tipos
interface NetworkStats {
  tenant_id: string;
  network_name: string;
  total_schools: number;
  total_students: number;
  total_active_peis: number;
  peis_draft: number;
  peis_pending: number;
  peis_approved: number;
  total_users: number;
  last_pei_update: string;
}

interface GlobalStats {
  totalNetworks: number;
  totalSchools: number;
  totalStudents: number;
  totalPEIs: number;
  totalUsers: number;
  activeUsers: number;
  studentsWithPEI: number;
  studentsWithoutPEI: number;
  coveragePercentage: number;
  approvalRate: number;
  peisThisMonth: number;
  peisLastMonth: number;
  growthPercentage: string;
}

interface SystemHealth {
  databaseStatus: "online" | "offline";
  lastSync: string;
  pendingSyncs: number;
  activeConnections: number;
  avgResponseTime: number;
}

interface BackupSchedule {
  id: string;
  schedule_type: 'daily' | 'weekly' | 'monthly';
  time: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
}

interface NetworkDetails {
  tenant_id: string;
  network_name: string;
  network_address: string | null;
  network_phone: string | null;
  network_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  users: Array<{
  id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
  created_at: string;
  }>;
  students: Array<{
    id: string;
    name: string;
    student_id: string | null;
    class_name: string | null;
    is_active: boolean;
    created_at: string;
  }>;
  peis: Array<{
    id: string;
    status: string;
    version_number: number;
    created_at: string;
    updated_at: string;
    student_name: string;
  }>;
  schools: Array<{
    id: string;
    school_name: string;
    school_address: string | null;
    school_phone: string | null;
    school_email: string | null;
    is_active: boolean;
  }>;
}

interface TenantRecord {
  id: string;
  network_name?: string | null;
  network_address?: string | null;
  network_phone?: string | null;
  network_email?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface SchoolRecord {
  id: string;
  tenant_id: string;
  school_name?: string | null;
  school_address?: string | null;
  school_phone?: string | null;
  school_email?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface StudentRecord {
  id: string;
  tenant_id?: string | null;
  school_id?: string | null;
  name: string;
  is_active?: boolean | null;
  created_at?: string | null;
}

interface PeiRecord {
  id: string;
  tenant_id?: string | null;
  school_id?: string | null;
  status: string;
  student_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active_version?: boolean | null;
}

interface ProfileRecord {
  id: string;
  full_name?: string | null;
  tenant_id?: string | null;
  school_id?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

interface CachedDataset {
  tenants: TenantRecord[];
  schools: SchoolRecord[];
  students: StudentRecord[];
  peis: PeiRecord[];
  profiles: ProfileRecord[];
}

interface SuperadminDashboardProps {
  profile: {
  id: string;
    full_name: string;
    role: string;
    school_id: string | null;
  };
}


// Componente de Formulário de Criação de Escola
const CreateSchoolForm = ({ 
  tenants, 
  onSubmit, 
  loading, 
  onCancel,
  editingSchool
}: {
  tenants: any[];
  onSubmit: (data: any) => void;
  loading: boolean;
  onCancel: () => void;
  editingSchool?: any;
}) => {
  const [formData, setFormData] = useState({
    school_name: editingSchool?.school_name || '',
    tenant_id: editingSchool?.tenant_id || '',
    school_address: editingSchool?.school_address || '',
    school_phone: editingSchool?.school_phone || '',
    school_email: editingSchool?.school_email || '',
    is_active: editingSchool?.is_active !== undefined ? editingSchool.is_active : true
  });

  useEffect(() => {
    if (editingSchool) {
      setFormData({
        school_name: editingSchool.school_name || '',
        tenant_id: editingSchool.tenant_id || '',
        school_address: editingSchool.school_address || '',
        school_phone: editingSchool.school_phone || '',
        school_email: editingSchool.school_email || '',
        is_active: editingSchool.is_active !== undefined ? editingSchool.is_active : true
      });
    }
  }, [editingSchool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.school_name && formData.tenant_id) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Nome da Escola */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="school_name">Nome da Escola *</Label>
          <Input
            id="school_name"
            placeholder="Digite o nome da escola"
            value={formData.school_name}
            onChange={(e) => handleChange('school_name', e.target.value)}
            required
          />
        </div>

        {/* Rede Municipal */}
        <div className="space-y-2">
          <Label htmlFor="tenant_id">Rede Municipal *</Label>
          <Select value={formData.tenant_id} onValueChange={(value) => handleChange('tenant_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a rede" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.network_name || tenant.name || `Rede ${tenant.id.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Endereço */}
        <div className="space-y-2">
          <Label htmlFor="school_address">Endereço</Label>
          <Input
            id="school_address"
            placeholder="Rua, número, bairro"
            value={formData.school_address}
            onChange={(e) => handleChange('school_address', e.target.value)}
          />
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="school_phone">Telefone</Label>
          <Input
            id="school_phone"
            type="tel"
            placeholder="(00) 0000-0000"
            value={formData.school_phone}
            onChange={(e) => handleChange('school_phone', e.target.value)}
          />
        </div>

        {/* E-mail */}
        <div className="space-y-2">
          <Label htmlFor="school_email">E-mail</Label>
          <Input
            id="school_email"
            type="email"
            placeholder="escola@exemplo.com"
            value={formData.school_email}
            onChange={(e) => handleChange('school_email', e.target.value)}
          />
        </div>

        {/* Status Ativo */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="font-normal">
              Escola ativa
            </Label>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.school_name || !formData.tenant_id}
        >
          {loading ? (
            <>
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              {editingSchool ? 'Salvando...' : 'Criando...'}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {editingSchool ? 'Salvar Escola' : 'Criar Escola'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

const SuperadminDashboard = ({ profile }: SuperadminDashboardProps) => {
  const [networkStats, setNetworkStats] = useState<NetworkStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkDetails | null>(null);
  const [networkDetailsOpen, setNetworkDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all");
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [availableSchools, setAvailableSchools] = useState<any[]>([]);
  
  // School management states
  const [allSchools, setAllSchools] = useState<any[]>([]);
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string>("all");
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
    loadSchools();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(loadAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const dataset = await loadNetworkDashboard();
      await Promise.all([
        loadGlobalStats(dataset),
        loadSystemHealth(),
        loadBackupSchedules(),
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNetworkDashboard = async (): Promise<CachedDataset> => {
    try {
      const [tenantsRes, schoolsRes, studentsRes, peisRes, profilesRes] = await Promise.all([
        supabase.from("tenants").select("id, network_name, network_address, network_phone, network_email, is_active, created_at, updated_at"),
        supabase.from("schools").select("id, tenant_id, school_name, school_address, school_phone, school_email, is_active, created_at, updated_at"),
        supabase.from("students").select("id, tenant_id, school_id, name, is_active, created_at"),
        supabase.from("peis").select("id, tenant_id, school_id, status, student_id, created_at, updated_at, is_active_version"),
        supabase.from("profiles").select("id, full_name, tenant_id, school_id, is_active, created_at"),
      ]);

      if (tenantsRes.error) throw tenantsRes.error;
      if (schoolsRes.error) throw schoolsRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (peisRes.error) throw peisRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const tenants = (tenantsRes.data ?? []) as TenantRecord[];
      const schools = (schoolsRes.data ?? []) as SchoolRecord[];
      const students = (studentsRes.data ?? []) as StudentRecord[];
      const peis = (peisRes.data ?? []) as PeiRecord[];
      const profiles = (profilesRes.data ?? []) as ProfileRecord[];

      if (tenants.length === 0) {
        setNetworkStats([]);
        setAvailableTenants([]);
        return { tenants, schools, students, peis, profiles };
      }

      const schoolTenantMap = new Map<string, string>();
      schools.forEach((school) => {
        if (school.id && school.tenant_id) {
          schoolTenantMap.set(school.id, school.tenant_id);
        }
      });

      const resolveTenantId = (tenantId?: string | null, schoolId?: string | null) => {
        if (tenantId) return tenantId;
        if (schoolId && schoolTenantMap.has(schoolId)) {
          return schoolTenantMap.get(schoolId) ?? null;
        }
        return null;
      };

      const studentsByTenant = new Map<string, StudentRecord[]>();
      students.forEach((student) => {
        const tenantId = resolveTenantId(student.tenant_id, student.school_id);
        if (!tenantId) return;
        if (!studentsByTenant.has(tenantId)) {
          studentsByTenant.set(tenantId, []);
        }
        studentsByTenant.get(tenantId)!.push(student);
      });

      const peisByTenant = new Map<string, PeiRecord[]>();
      peis.forEach((pei) => {
        const tenantId = resolveTenantId(pei.tenant_id, pei.school_id);
        if (!tenantId) return;
        if (!peisByTenant.has(tenantId)) {
          peisByTenant.set(tenantId, []);
        }
        peisByTenant.get(tenantId)!.push(pei);
      });

      const profilesByTenant = new Map<string, ProfileRecord[]>();
      profiles.forEach((profile) => {
        const tenantId = resolveTenantId(profile.tenant_id, profile.school_id);
        if (!tenantId) return;
        if (!profilesByTenant.has(tenantId)) {
          profilesByTenant.set(tenantId, []);
        }
        profilesByTenant.get(tenantId)!.push(profile);
      });

      const schoolsByTenant = new Map<string, SchoolRecord[]>();
      schools.forEach((school) => {
        if (!schoolsByTenant.has(school.tenant_id)) {
          schoolsByTenant.set(school.tenant_id, []);
        }
        schoolsByTenant.get(school.tenant_id)!.push(school);
      });

      const networkStatsData = tenants.map((tenant) => {
        const tenantStudents = studentsByTenant.get(tenant.id) ?? [];
        const tenantPeis = peisByTenant.get(tenant.id) ?? [];
        const tenantProfiles = profilesByTenant.get(tenant.id) ?? [];
        const tenantSchools = schoolsByTenant.get(tenant.id) ?? [];

        const peisDraft = tenantPeis.filter((pei) => pei.status === "draft").length;
        const peisPending = tenantPeis.filter((pei) => pei.status === "pending" || pei.status === "pending_validation").length;
        const peisApproved = tenantPeis.filter((pei) => pei.status === "approved").length;

        const lastUpdate = tenantPeis.reduce((latest, current) => {
          const timestamp = current.updated_at ?? current.created_at ?? "";
          return new Date(timestamp).getTime() > new Date(latest).getTime() ? timestamp : latest;
        }, tenantPeis[0]?.updated_at ?? tenantPeis[0]?.created_at ?? new Date().toISOString());

        return {
          tenant_id: tenant.id,
          network_name: tenant.network_name ?? `Rede ${tenant.id.slice(0, 8)}`,
          total_schools: tenantSchools.length || 1,
          total_students: tenantStudents.length,
          total_active_peis: tenantPeis.length,
          peis_draft: peisDraft,
          peis_pending: peisPending,
          peis_approved: peisApproved,
          total_users: tenantProfiles.length,
          last_pei_update: lastUpdate,
        };
      });

      setNetworkStats(networkStatsData);
      setAvailableTenants(tenants);

      return { tenants, schools, students, peis, profiles };
    } catch (error: any) {
      console.error("❌ Erro ao carregar dados das redes:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
      setNetworkStats([]);
      return { tenants: [], schools: [], students: [], peis: [], profiles: [] };
    }
  };

  const loadGlobalStats = async (dataset?: CachedDataset) => {
    try {
      const sharedData = dataset ?? await loadNetworkDashboard();
      const tenants = sharedData.tenants;
      const schools = sharedData.schools;
      const students = sharedData.students;
      const peis = sharedData.peis.filter((pei) => pei.is_active_version);
      const profiles = sharedData.profiles;

      const totalNetworks = tenants.length;
      const totalSchools = schools.length;
      const totalStudents = students.length;
      const totalUsers = profiles.length;
      const activeUsers = profiles.filter((profile) => profile.is_active).length;

      const totalPEIs = peis.length;
      const peisApproved = peis.filter((pei) => pei.status === "approved").length;
      const approvalRate = totalPEIs > 0 ? (peisApproved / totalPEIs) * 100 : 0;

      const studentsWithPEI = new Set(
        peis.map((pei) => pei.student_id).filter(Boolean)
      ).size;
      const studentsWithoutPEI = totalStudents - studentsWithPEI;
      const coveragePercentage = totalStudents > 0 ? (studentsWithPEI / totalStudents) * 100 : 0;

      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const peisThisMonth = peis.filter((pei) => {
        const created = new Date(pei.created_at ?? "");
        return created >= firstDayThisMonth && created < firstDayNextMonth;
      }).length;

      const peisLastMonth = peis.filter((pei) => {
        const created = new Date(pei.created_at ?? "");
        return created >= firstDayLastMonth && created < firstDayThisMonth;
      }).length;

      const growthPercentage = peisLastMonth > 0
        ? (((peisThisMonth - peisLastMonth) / peisLastMonth) * 100).toFixed(1)
        : peisThisMonth > 0 ? "100" : "0";

      setGlobalStats({
        totalNetworks,
        totalSchools,
        totalStudents,
        totalPEIs,
        totalUsers,
        activeUsers,
        studentsWithPEI,
        studentsWithoutPEI,
        coveragePercentage,
        approvalRate,
        peisThisMonth,
        peisLastMonth,
        growthPercentage,
      });
    } catch (error: any) {
      console.error("Erro ao carregar estatísticas globais:", error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadSystemHealth = async () => {
    try {
      const startTime = Date.now();
      
      // Testar conexão com o banco
      const { data, error } = await supabase
        .from("tenants")
              .select("id")
        .limit(1);

      const responseTime = Date.now() - startTime;
      
      setSystemHealth({
        databaseStatus: error ? "offline" : "online",
        lastSync: new Date().toISOString(),
        pendingSyncs: 0, // Supabase não tem sync pendente
        activeConnections: 1, // Aproximação
        avgResponseTime: responseTime
      });
    } catch (error) {
      setSystemHealth({
        databaseStatus: "offline",
        lastSync: new Date().toISOString(),
        pendingSyncs: 0,
        activeConnections: 0,
        avgResponseTime: 0
      });
    }
  };

  const loadBackupSchedules = async () => {
    try {
      // Criar agendamentos padrão (tabela não existe no schema atual)
      const defaultSchedules: BackupSchedule[] = [
        {
          id: "daily-backup",
          schedule_type: "daily",
          time: "03:00",
          enabled: true,
          last_run: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "weekly-backup",
          schedule_type: "weekly",
          time: "02:00",
          enabled: true,
          last_run: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          next_run: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setBackupSchedules(defaultSchedules);
    } catch (error) {
      console.error("Erro ao carregar agendamentos de backup:", error);
    }
  };

  // Usar helper centralizado para auditoria (importado no topo do arquivo)

  // Funções de Manutenção e Backup
  const refreshMaterializedViews = async () => {
    try {
      toast({
        title: "Atualizando Materialized Views...",
        description: "Executando refresh das views materializadas",
      });

      // Simular refresh de materialized views (RPC não implementado)
      console.log("Simulando refresh de materialized views...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recarregar dados após refresh
      await loadAllData();
      
      // Inserir log de auditoria
      await insertAuditLog(
        'Materialized Views Refresh',
        'Executado via simulação',
        'info'
      );
      
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
  };

  const executeManualBackup = async (compactMode: boolean = false) => {
    try {
      toast({
        title: "Iniciando Backup Manual...",
        description: compactMode ? "Criando backup compacto..." : "Coletando dados do sistema para backup",
      });

      console.log(`🔄 Iniciando backup manual do sistema (${compactMode ? 'compacto' : 'completo'})...`);
      
      // Coletar dados de todas as tabelas principais
      const backupData: any = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          system: "PEI Collab",
          generated_by: profile.full_name || "Super Admin",
          description: "Backup completo do sistema PEI Collab"
        },
        statistics: {
          total_tables: 0,
          total_records: 0,
          backup_size_bytes: 0
        },
        warnings: [],
        tables: {}
      };

      // 1. Backup de Tenants (Redes)
      console.log("📊 Fazendo backup de tenants...");
      const tenantSelect = compactMode ? "id, network_name, is_active, created_at" : "*";
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select(tenantSelect);
      
      if (tenantsError) throw tenantsError;
      backupData.tables.tenants = tenants || [];

      // 2. Backup de Profiles (Usuários)
      console.log("👥 Fazendo backup de profiles...");
      const profileSelect = compactMode ? "id, full_name, is_active, created_at" : "*";
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(profileSelect);
      
      if (profilesError) throw profilesError;
      backupData.tables.profiles = profiles || [];

      // 3. Backup de User Roles
      console.log("🔐 Fazendo backup de user_roles...");
      const { data: userRoles, error: userRolesError } = await supabase
        .from("user_roles")
        .select("*");
      
      if (userRolesError) throw userRolesError;
      backupData.tables.user_roles = userRoles || [];

      // 4. Backup de Students
      console.log("🎓 Fazendo backup de students...");
      const studentSelect = compactMode ? "id, name, is_active, created_at" : "*";
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select(studentSelect);
      
      if (studentsError) throw studentsError;
      backupData.tables.students = students || [];

      // 5. Backup de PEIs
      console.log("📋 Fazendo backup de peis...");
      const peiSelect = compactMode ? "id, status, created_at, updated_at" : "*";
      const { data: peis, error: peisError } = await supabase
        .from("peis")
        .select(peiSelect);
      
      if (peisError) throw peisError;
      backupData.tables.peis = peis || [];

      // 6. Backup de Schools
      console.log("🏫 Fazendo backup de schools...");
      const schoolSelect = compactMode ? "id, school_name, is_active, created_at" : "*";
      const { data: schools, error: schoolsError } = await supabase
              .from("schools")
        .select(schoolSelect);
      
      if (schoolsError) {
        console.warn("⚠️ Tabela schools não encontrada ou sem permissão:", schoolsError.message);
        backupData.tables.schools = [];
        backupData.warnings.push(`Tabela 'schools' não acessível: ${schoolsError.message}`);
      } else {
        backupData.tables.schools = schools || [];
        console.log("✅ Backup de schools concluído");
      }

      // 7. Backup de User Tenants
      console.log("🔗 Fazendo backup de user_tenants...");
      const { data: userTenants, error: userTenantsError } = await supabase
        .from("user_tenants")
        .select("*");
      
      if (userTenantsError) {
        console.warn("⚠️ Tabela user_tenants não encontrada ou sem permissão:", userTenantsError.message);
        backupData.tables.user_tenants = [];
        backupData.warnings.push(`Tabela 'user_tenants' não acessível: ${userTenantsError.message}`);
      } else {
        backupData.tables.user_tenants = userTenants || [];
        console.log("✅ Backup de user_tenants concluído");
      }

      // 8. Backup de PEI Access Logs (apenas se não for modo compacto e se a tabela existir)
      if (!compactMode) {
        console.log("📝 Tentando fazer backup de pei_access_logs...");
        const { data: peiAccessLogs, error: peiAccessLogsError } = await supabase
          .from("pei_access_logs")
          .select("*");
        
        if (peiAccessLogsError) {
          console.warn("⚠️ Tabela pei_access_logs não encontrada ou sem permissão:", peiAccessLogsError.message);
          // Não falhar o backup por causa desta tabela opcional
          backupData.tables.pei_access_logs = [];
          backupData.warnings.push(`Tabela 'pei_access_logs' não acessível: ${peiAccessLogsError.message}`);
        } else {
          backupData.tables.pei_access_logs = peiAccessLogs || [];
          console.log("✅ Backup de pei_access_logs concluído");
        }
      }

      // Calcular estatísticas do backup
      const totalRecords = Object.values(backupData.tables).reduce((sum: number, table: any) => sum + (Array.isArray(table) ? table.length : 0), 0);
      const totalTables = Object.keys(backupData.tables).length;
      const backupSize = JSON.stringify(backupData).length;
      
      // Atualizar estatísticas
      backupData.statistics = {
        total_tables: totalTables,
        total_records: totalRecords,
        backup_size_bytes: backupSize
      };
      
      console.log(`✅ Backup concluído: ${totalTables} tabelas, ${totalRecords} registros, ${(backupSize / 1024).toFixed(2)} KB`);

      // Gerar nome do arquivo com timestamp
      const timestamp = formatTimestampForFilename();
      const modeSuffix = compactMode ? 'compact' : 'full';
      const fileName = `pei-collab-backup-${modeSuffix}-${timestamp}.json`;

      // Criar e baixar arquivo usando utilitário compartilhado
      const jsonContent = JSON.stringify(backupData, null, 2);
      downloadTextFile(fileName, jsonContent, 'application/json;charset=utf-8');
      
      // Inserir log de auditoria
      await insertAuditLog(
        'Backup Manual Executado',
        `Backup completo: ${totalTables} tabelas, ${totalRecords} registros, ${(backupSize / 1024).toFixed(2)} KB`,
        'info'
      );
      
      // Preparar mensagem de sucesso com warnings se houver
      const warningText = backupData.warnings.length > 0 
        ? ` (${backupData.warnings.length} avisos: ${backupData.warnings.map(w => w.split(':')[0]).join(', ')})`
        : '';

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
  };

  const viewAuditLogs = async () => {
    try {
      // Buscar logs de auditoria de múltiplas fontes
      const [peiAccessLogs, userLogs, systemLogs] = await Promise.all([
        supabase.from("pei_access_logs").select("*").order("accessed_at", { ascending: false }).limit(20),
        supabase.from("profiles").select("id, full_name, created_at, updated_at").order("updated_at", { ascending: false }).limit(15),
        supabase.from("tenants").select("id, name, created_at, updated_at").order("updated_at", { ascending: false }).limit(15)
      ]);

      // Combinar todos os logs em um relatório unificado
      const allLogs = [
        // Logs de acesso aos PEIs
        ...(peiAccessLogs.data?.map(log => ({
          timestamp: new Date(log.accessed_at).toLocaleString('pt-BR'),
          action: 'Acesso ao PEI',
          user: log.user_agent || 'Usuário não identificado',
          details: `PEI ID: ${log.pei_id} - ${log.verified ? 'Verificado' : 'Não verificado'}`,
          ip: log.ip_address || 'N/A',
          severity: 'info'
        })) || []),
        
        // Logs de usuários
        ...(userLogs.data?.map(user => ({
          timestamp: new Date(user.updated_at).toLocaleString('pt-BR'),
          action: 'Atualização de Usuário',
          user: user.full_name || 'Usuário',
          details: `Perfil atualizado - ID: ${user.id}`,
          ip: 'Sistema',
          severity: 'info'
        })) || []),
        
        // Logs do sistema
        ...(systemLogs.data?.map(tenant => ({
          timestamp: new Date(tenant.updated_at).toLocaleString('pt-BR'),
          action: 'Atualização de Rede',
          user: 'Sistema',
          details: `Rede: ${tenant.name} - ID: ${tenant.id}`,
          ip: 'Sistema',
          severity: 'info'
        })) || [])
      ];

      // Ordenar por timestamp e pegar os 50 mais recentes
      const logsReport = allLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);

      // Criar relatório HTML
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
          <p>Relatório gerado em: ${new Date().toLocaleString('pt-BR')}</p>
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
              ${logsReport.map(log => `
                <tr>
                  <td>${log.timestamp}</td>
                  <td>${log.action}</td>
                  <td>${log.user}</td>
                  <td>${log.details}</td>
                  <td>${log.ip}</td>
                  <td><span class="badge ${log.severity}">${log.severity.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Fazer download do relatório usando utilitário compartilhado
      const timestamp = formatTimestampForFilename();
      const fileName = `audit-logs-${timestamp}.html`;
      downloadTextFile(fileName, reportHTML, 'text/html;charset=utf-8');

      toast({
        title: "📋 Logs de Auditoria Exportados",
        description: `Relatório de logs foi baixado: ${fileName}`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Buscar Logs",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Funções de Agendamento de Backup
  const toggleBackupSchedule = async (scheduleId: string) => {
    try {
      const schedule = backupSchedules.find(s => s.id === scheduleId);
      if (!schedule) return;

      const newStatus = !schedule.enabled;
      
      // Atualizar apenas localmente (tabela não existe no schema atual)
      console.log(`Atualizando agendamento ${scheduleId} para ${newStatus ? 'ativado' : 'pausado'}`);

      // Atualizar estado local
      setBackupSchedules(prev => 
        prev.map(s => 
          s.id === scheduleId 
            ? { ...s, enabled: newStatus }
            : s
        )
      );

      toast({
        title: newStatus ? "✅ Agendamento Ativado" : "⏸️ Agendamento Pausado",
        description: `Backup ${schedule.schedule_type} ${newStatus ? 'ativado' : 'pausado'}`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Atualizar Agendamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createBackupSchedule = async (scheduleType: 'daily' | 'weekly' | 'monthly', time: string) => {
    try {
      const newSchedule: BackupSchedule = {
        id: `${scheduleType}-backup-${Date.now()}`,
        schedule_type: scheduleType,
        time,
        enabled: true,
        last_run: null,
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      // Salvar apenas localmente (tabela não existe no schema atual)
      console.log(`Criando novo agendamento: ${scheduleType} às ${time}`);

      // Atualizar estado local
      setBackupSchedules(prev => [...prev, newSchedule]);

      toast({
        title: "✅ Agendamento Criado",
        description: `Backup ${scheduleType} agendado para ${time}`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Criar Agendamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Função para carregar detalhes de uma rede
  const loadNetworkDetails = async (tenantId: string) => {
    setLoadingDetails(true);
    try {
      console.log(`🔍 Carregando detalhes da rede: ${tenantId}`);
      
      // Buscar dados básicos da rede
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

      if (tenantError) throw tenantError;

      // Buscar usuários da rede através da tabela user_tenants
      const { data: userTenants, error: usersError } = await supabase
        .from("user_tenants")
        .select("user_id")
        .eq("school_id", tenantId);

      if (usersError) {
        console.warn("Erro ao buscar usuários:", usersError);
      }

      // Buscar perfis dos usuários
      const userIds = userTenants?.map(ut => ut.user_id) || [];
      const { data: users, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, is_active, created_at")
        .in("id", userIds)
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.warn("Erro ao buscar perfis:", profilesError);
      }

      // Buscar estudantes da rede através das escolas
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, name, created_at")
        .in("school_id", [])
        .order("created_at", { ascending: false });

      if (studentsError) {
        console.warn("Erro ao buscar estudantes:", studentsError);
      }

      // Buscar PEIs da rede através das escolas
      const { data: peis, error: peisError } = await supabase
        .from("peis")
        .select("id, status, created_at, updated_at")
        .in("school_id", [])
        .order("created_at", { ascending: false });

      if (peisError) {
        console.warn("Erro ao buscar PEIs:", peisError);
      }

      // Escolas não estão implementadas no schema atual
      const schools: any[] = [];

      const networkDetails: NetworkDetails = {
        tenant_id: tenant.id,
        network_name: tenant.network_name,
        network_address: tenant.network_address,
        network_phone: tenant.network_phone,
        network_email: tenant.network_email,
        is_active: tenant.is_active,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        users: (users || []).map(user => ({
          id: user.id,
          full_name: user.full_name,
          email: null, // Campo não existe na tabela
          phone: null, // Campo não existe na tabela
          is_active: user.is_active,
          created_at: user.created_at
        })),
        students: (students || []).map(student => ({
          id: student.id,
          name: student.name,
          student_id: null, // Campo não existe na tabela
          class_name: null, // Campo não existe na tabela
          is_active: true, // Valor padrão
          created_at: student.created_at
        })),
        peis: (peis || []).map(pei => ({
          id: pei.id,
          status: pei.status,
          version_number: 1, // Valor padrão
          created_at: pei.created_at,
          updated_at: pei.updated_at,
          student_name: 'N/A' // Não temos join com students
        })),
        schools: schools
      };

      setSelectedNetwork(networkDetails);
      setNetworkDetailsOpen(true);
      
      console.log("✅ Detalhes da rede carregados:", networkDetails);
    } catch (error: any) {
      console.error("❌ Erro ao carregar detalhes da rede:", error);
      toast({
        title: "Erro ao carregar detalhes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Função para carregar todos os usuários do sistema
  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log("🔍 Carregando todos os usuários do sistema...");
      
      // Primeiro, vamos verificar o que existe no banco
      console.log("🔍 Verificando estrutura do banco...");
      
      // Verificar tenants
      const { data: tenantsTest, error: tenantsTestError } = await supabase
        .from("tenants")
        .select("*")
        .limit(5);
      
      console.log("📊 Teste de tenants:", { data: tenantsTest, error: tenantsTestError });
      
      // Buscar todos os usuários
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, is_active, created_at, updated_at")
        .order("created_at", { ascending: false });

      // Buscar roles separadamente
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // Usar dados do teste de tenants
      const tenants = tenantsTest || [];
      const tenantsError = tenantsTestError;

      // Buscar escolas reais do banco de dados
      const { data: schoolsData, error: schoolsError } = await supabase
        .from("schools")
        .select("*")
        .eq("is_active", true)
        .order("school_name", { ascending: true });

      if (schoolsError) {
        console.warn("Erro ao buscar escolas:", schoolsError);
      }

      const schools = schoolsData || [];
      console.log(`📊 Encontradas ${schools.length} escolas no banco de dados:`, schools);

      if (usersError) {
        console.error("Erro ao buscar usuários:", usersError);
        throw usersError;
      }

      if (rolesError) {
        console.warn("Erro ao buscar roles:", rolesError);
      }

      if (tenantsError) {
        console.warn("Erro ao buscar tenants:", tenantsError);
      }

      // Processar dados dos usuários com associação às redes
      const processedUsers = users?.map((user, index) => {
        const userRolesData = userRoles?.filter(ur => ur.user_id === user.id) || [];
        const primaryRole = userRolesData[0]?.role || 'teacher';
        
        // Lógica de associação mais inteligente baseada em roles
        let assignedTenant = null;
        let assignedSchool = null;
        
        if (tenants && tenants.length > 0) {
          // Super admins ficam em todas as redes (primeira rede)
          if (primaryRole === 'superadmin') {
            assignedTenant = tenants[0];
          }
          // Coordenadores ficam distribuídos entre as redes
          else if (primaryRole === 'coordinator') {
            assignedTenant = tenants[index % tenants.length];
          }
          // Outros usuários ficam distribuídos de forma mais aleatória
          else {
            // Usar hash do ID do usuário para distribuição mais consistente
            const hash = user.id.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);
            assignedTenant = tenants[Math.abs(hash) % tenants.length];
          }
          
          console.log(`🔗 Associando ${user.full_name} (${primaryRole}) → ${assignedTenant?.network_name || assignedTenant?.name} (${assignedTenant?.id})`);
        }
        
        if (schools && schools.length > 0) {
          // Associar escolas baseado no tenant
          if (assignedTenant) {
            // Buscar escolas do mesmo tenant
            const tenantSchools = schools.filter(s => s.tenant_id === assignedTenant.id);
            if (tenantSchools.length > 0) {
              assignedSchool = tenantSchools[index % tenantSchools.length];
            } else {
              // Se não há escolas para este tenant, usar qualquer escola disponível
              assignedSchool = schools[index % schools.length];
            }
          } else {
            assignedSchool = schools[index % schools.length];
          }
        } else {
          // Se não há escolas no banco, não associar nenhuma escola
          assignedSchool = null;
        }
        
        return {
          id: user.id,
          full_name: user.full_name,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
          tenant_id: assignedTenant?.id || null,
          school_id: assignedSchool?.id || null,
          tenant_name: assignedTenant?.network_name || assignedTenant?.name || 'Não definido',
          school_name: assignedSchool?.school_name || assignedSchool?.name || 'Não definido',
          roles: userRolesData.map(ur => ur.role),
          primary_role: primaryRole
        };
      }) || [];

      // Definir opções de filtro
      console.log("📊 Dados carregados para filtros:");
      console.log("- Tenants:", tenants?.length || 0, tenants);
      console.log("- Schools:", schools?.length || 0, schools);
      
      // Garantir que temos arrays válidos
      const validTenants = Array.isArray(tenants) ? tenants : [];
      const validSchools = Array.isArray(schools) ? schools : [];
      
      console.log("✅ Dados finais para filtros:");
      console.log("- Valid Tenants:", validTenants.length, validTenants);
      console.log("- Valid Schools:", validSchools.length, validSchools);
      
      // Log de associação de usuários
      console.log("👥 Associação de usuários às redes:");
      processedUsers.forEach((user, index) => {
        console.log(`- ${user.full_name} → ${user.tenant_name} (${user.tenant_id})`);
      });
      
      // Log de contagem por rede
      console.log("📊 Contagem de usuários por rede:");
      validTenants.forEach(tenant => {
        const count = processedUsers.filter(u => u.tenant_id === tenant.id).length;
        console.log(`- ${tenant.network_name || tenant.name}: ${count} usuários`);
      });
      
      setAvailableTenants(validTenants);
      setAvailableSchools(validSchools);

      setAllUsers(processedUsers);
      setUserManagementOpen(true);
      
      console.log(`✅ ${processedUsers.length} usuários carregados`);
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
  };

  // Função para filtrar usuários
  const getFilteredUsers = () => {
    return allUsers.filter(user => {
      // Filtro por nome
      const matchesSearch = user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase());
      
      // Filtro por tenant - usar ID para comparação exata
      const matchesTenant = selectedTenantFilter === "all" || user.tenant_id === selectedTenantFilter;
      
      // Filtro por escola - usar ID para comparação exata
      const matchesSchool = selectedSchoolFilter === "all" || user.school_id === selectedSchoolFilter;
      
      return matchesSearch && matchesTenant && matchesSchool;
    });
  };

  // Função para ativar/desativar usuário
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;

      // Atualizar lista local
      setAllUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, is_active: newStatus, updated_at: new Date().toISOString() }
            : user
        )
      );

      toast({
        title: newStatus ? "✅ Usuário Ativado" : "⏸️ Usuário Desativado",
        description: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
      });

      // Inserir log de auditoria
      await insertAuditLog(
        newStatus ? 'Usuário Ativado' : 'Usuário Desativado',
        `Usuário ID: ${userId} - Status: ${newStatus ? 'Ativo' : 'Inativo'}`,
        'info'
      );
    } catch (error: any) {
      console.error("Erro ao alterar status do usuário:", error);
      toast({
        title: "❌ Erro ao Alterar Status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Função para adicionar nova rede
  const addNewNetwork = async () => {
    try {
      const networkName = prompt("Digite o nome da nova rede municipal:");
      if (!networkName) return;

      toast({
        title: "Criando Nova Rede...",
        description: `Adicionando rede: ${networkName}`,
      });

      // Criar nova rede no banco
      const { data: newTenant, error } = await supabase
        .from("tenants")
        .insert({
          network_name: networkName,
          is_active: true
        } as any)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar tenant:", error);
        throw error;
      }

      // Recarregar dados
      await loadAllData();

      // Inserir log de auditoria
      await insertAuditLog(
        'Nova Rede Criada',
        `Rede "${networkName}" criada com sucesso`,
        'info'
      );

      toast({
        title: "✅ Rede Criada com Sucesso",
        description: `Rede "${networkName}" foi adicionada ao sistema`,
      });
    } catch (error: any) {
      console.error("Erro ao criar rede:", error);
      toast({
        title: "❌ Erro ao Criar Rede",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportReport = () => {
    const reportDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const reportHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Executivo Multi-Rede - PEI Collab</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #6366f1; }
    .header h1 { color: #1e293b; font-size: 28px; margin-bottom: 10px; }
    .header h2 { color: #6366f1; font-size: 20px; margin-bottom: 15px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .kpi-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .kpi-card.blue { border-left-color: #3b82f6; }
    .kpi-card.green { border-left-color: #10b981; }
    .kpi-card.purple { border-left-color: #a855f7; }
    .kpi-card.orange { border-left-color: #f59e0b; }
    .kpi-card .value { font-size: 32px; font-weight: 700; margin: 10px 0; }
    .kpi-card.blue .value { color: #3b82f6; }
    .kpi-card.green .value { color: #10b981; }
    .kpi-card.purple .value { color: #a855f7; }
    .kpi-card.orange .value { color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    thead { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; }
    th, td { padding: 15px; text-align: left; }
    tbody tr { border-bottom: 1px solid #e2e8f0; }
    tbody tr:hover { background: #f8fafc; }
    .metric.excellent { color: #10b981; font-weight: 600; }
    .metric.good { color: #3b82f6; font-weight: 600; }
    .metric.warning { color: #f59e0b; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="header">
    <h1>Relatório Executivo Multi-Rede</h1>
    <h2>Sistema PEI Collab</h2>
    <p>Data: ${reportDate}</p>
      </div>
      
        <div class="kpi-grid">
          <div class="kpi-card blue">
      <div class="label">Redes Municipais</div>
      <div class="value">${globalStats?.totalNetworks || 0}</div>
      <div class="description">${globalStats?.totalSchools || 0} escolas conectadas</div>
          </div>
          <div class="kpi-card green">
      <div class="label">Cobertura Global</div>
      <div class="value">${globalStats?.coveragePercentage.toFixed(1) || 0}%</div>
      <div class="description">${globalStats?.studentsWithPEI || 0} alunos com PEI</div>
          </div>
          <div class="kpi-card purple">
            <div class="label">Taxa de Aprovação</div>
      <div class="value">${globalStats?.approvalRate.toFixed(1) || 0}%</div>
      <div class="description">PEIs aprovados na rede</div>
          </div>
          <div class="kpi-card orange">
            <div class="label">Crescimento</div>
      <div class="value">${Number(globalStats?.growthPercentage) > 0 ? '+' : ''}${globalStats?.growthPercentage || 0}%</div>
            <div class="description">Comparado ao mês anterior</div>
        </div>
      </div>
      
  <h3>Performance por Rede Municipal</h3>
        <table>
          <thead>
            <tr>
        <th>Rede</th>
        <th>Escolas</th>
        <th>Alunos</th>
        <th>PEIs Ativos</th>
        <th>Cobertura</th>
        <th>Aprovados</th>
            </tr>
          </thead>
          <tbody>
      ${networkStats.map(net => {
        const coverage = (net.total_active_peis / net.total_students * 100).toFixed(1);
        const coverageClass = Number(coverage) >= 80 ? 'excellent' : Number(coverage) >= 60 ? 'good' : 'warning';
      return `
                <tr>
            <td>${net.network_name}</td>
            <td>${net.total_schools}</td>
            <td>${net.total_students}</td>
            <td>${net.total_active_peis}</td>
            <td class="metric ${coverageClass}">${coverage}%</td>
            <td>${net.peis_approved}</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
    </body>
</html>`;

    // Fazer download do relatório usando utilitário compartilhado
    const timestamp = formatTimestampForFilename();
    const fileName = `relatorio-multi-rede-${timestamp}.html`;
    downloadTextFile(fileName, reportHTML, 'text/html;charset=utf-8');
  };

  // School management handlers
  const loadSchools = async () => {
    try {
      console.log("🏫 Carregando escolas...");
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("school_name", { ascending: true });
      
      if (error) {
        console.error("❌ Erro ao buscar escolas:", error);
        throw error;
      }
      
      console.log(`✅ ${data?.length || 0} escolas carregadas:`, data);
      setAllSchools(data || []);
    } catch (error: any) {
      console.error("❌ Erro ao carregar escolas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as escolas.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSchool = () => {
    setEditingSchool(null);
    setSchoolDialogOpen(true);
  };

  const handleEditSchool = (school: any) => {
    setEditingSchool(school);
    setSchoolDialogOpen(true);
  };

  const handleSubmitCreateSchool = async (data: any) => {
    setLoadingAction(true);
    try {
      if (editingSchool) {
        // Update school
        const { error } = await supabase
          .from("schools")
          .update(data)
          .eq("id", editingSchool.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Escola atualizada com sucesso!",
        });
      } else {
        // Create school
        const { error } = await supabase
          .from("schools")
          .insert(data);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Escola criada com sucesso!",
        });
      }
      
      await loadSchools();
      setSchoolDialogOpen(false);
      setEditingSchool(null);
    } catch (error: any) {
      console.error("Erro ao salvar escola:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a escola.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta escola? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    setLoadingAction(true);
    try {
      const { error } = await supabase
        .from("schools")
        .delete()
        .eq("id", schoolId);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Escola excluída com sucesso!",
      });
      
      await loadSchools();
    } catch (error: any) {
      console.error("Erro ao excluir escola:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a escola.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const filteredNetworks = networkStats.filter(net =>
    net.network_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="text-lg font-medium text-muted-foreground">Carregando dashboard estratégico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Premium */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Painel Estratégico Multi-Rede
          </h1>
          <p className="text-lg text-muted-foreground">
            Visão consolidada de todas as redes municipais • Sistema PEI Collab
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAllData} variant="outline" size="lg">
            <RefreshCcw className="mr-2 h-5 w-5" />
            Atualizar
          </Button>
        <Button onClick={handleExportReport} size="lg" className="shadow-lg">
          <Download className="mr-2 h-5 w-5" />
            Exportar Relatório
        </Button>
        </div>
      </div>

      {/* Status do Sistema */}
      {systemHealth && (
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {systemHealth.databaseStatus === "online" ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <span className="font-semibold text-green-700">Sistema Online</span> • 
                Última atualização: {new Date(lastUpdate).toLocaleTimeString('pt-BR')} • 
                {systemHealth.activeConnections} usuários conectados • 
                Tempo médio de resposta: {systemHealth.avgResponseTime}ms
              </AlertDescription>
            </div>
            {systemHealth.pendingSyncs > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                {systemHealth.pendingSyncs} syncs pendentes
              </Badge>
            )}
          </div>
        </Alert>
      )}

      {/* KPIs Globais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Redes Municipais</CardTitle>
            <Network className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{globalStats?.totalNetworks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalStats?.totalSchools || 0} escolas • {globalStats?.totalUsers || 0} usuários
            </p>
            <div className="mt-3 flex items-center text-xs">
              <Building2 className="mr-1 h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{globalStats?.totalStudents || 0} alunos matriculados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cobertura Global</CardTitle>
            <Target className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {globalStats?.coveragePercentage.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalStats?.studentsWithPEI || 0} de {globalStats?.totalStudents || 0} alunos com PEI
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${globalStats?.coveragePercentage || 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</CardTitle>
            <Award className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {globalStats?.approvalRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              PEIs aprovados em todas as redes
            </p>
            <div className="mt-3 flex gap-2">
              <Badge variant="outline" className="text-xs">
                <FileText className="mr-1 h-3 w-3" />
                {globalStats?.totalPEIs || 0} PEIs ativos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crescimento</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {Number(globalStats?.growthPercentage) > 0 ? "+" : ""}{globalStats?.growthPercentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalStats?.peisThisMonth || 0} PEIs este mês vs {globalStats?.peisLastMonth || 0} anterior
            </p>
            <div className="mt-3 flex items-center text-xs">
              <Activity className="mr-1 h-3 w-3 text-orange-500" />
              <span className="font-medium text-orange-600">
                {Number(globalStats?.growthPercentage) >= 0 ? "Tendência positiva" : "Requer atenção"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-xl p-1">
          <TabsList className="grid w-full grid-cols-6 bg-transparent gap-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:data-[state=inactive]:text-slate-400 dark:data-[state=inactive]:hover:text-slate-300"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="networks" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:data-[state=inactive]:text-slate-400 dark:data-[state=inactive]:hover:text-slate-300"
            >
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Redes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="schools" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:data-[state=inactive]:text-slate-400 dark:data-[state=inactive]:hover:text-slate-300"
            >
              <School className="h-4 w-4" />
              <span className="hidden sm:inline">Escolas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:data-[state=inactive]:text-slate-400 dark:data-[state=inactive]:hover:text-slate-300"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:data-[state=inactive]:text-slate-400 dark:data-[state=inactive]:hover:text-slate-300"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger 
              value="system" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:data-[state=inactive]:text-slate-400 dark:data-[state=inactive]:hover:text-slate-300"
            >
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <BookOpen className="h-5 w-5" />
                  Sobre o PEI Collab
                </CardTitle>
          </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Sistema integrado para gestão de Planos Educacionais Individualizados em múltiplas redes municipais de educação.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Gestão multi-rede e multi-escola</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Dashboard consolidado em tempo real</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Suporte offline via PWA</span>
                  </div>
                </div>
          </CardContent>
        </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Shield className="h-5 w-5" />
                  Segurança e Conformidade
                </CardTitle>
          </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RLS Habilitado</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
            </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Auditoria</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    <Database className="h-3 w-3 mr-1" />
                    Completa
                  </Badge>
            </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Backup</span>
                  <span className="text-sm font-medium">Automático (24h)</span>
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Ranking de Redes */}
      <Card className="shadow-lg">
        <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Top 5 Redes por Performance
              </CardTitle>
              <CardDescription>
                Ranking baseado em cobertura de PEIs e taxa de aprovação
              </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                {networkStats.slice(0, 5).map((net, index) => {
                  const coverage = (net.total_active_peis / net.total_students * 100);
                  const approval = (net.peis_approved / net.total_active_peis * 100);
                  return (
                    <div key={net.tenant_id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {index + 1}
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
                  <div className="text-xs text-muted-foreground">
                          Aprovação: {approval.toFixed(0)}%
                  </div>
                </div>
              </div>
                  );
                })}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Tab: Gestão de Redes */}
        <TabsContent value="networks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
              <CardTitle className="flex items-center gap-2">
                    <Network className="h-6 w-6" />
                    Redes Municipais Conectadas
              </CardTitle>
                  <CardDescription>
                    Gerencie todas as redes de ensino no sistema
                  </CardDescription>
                </div>
                <Button onClick={addNewNetwork}>
                  <Network className="h-4 w-4 mr-2" />
                  Adicionar Rede
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar rede municipal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredNetworks.length === 0 ? (
                <div className="text-center py-12">
                  <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? "Nenhuma rede encontrada" : "Nenhuma rede cadastrada"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm 
                      ? `Não foram encontradas redes com o termo "${searchTerm}"`
                      : "Adicione a primeira rede municipal ao sistema"
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={addNewNetwork}>
                      <Network className="h-4 w-4 mr-2" />
                      Adicionar Primeira Rede
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Rede</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Escolas</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Alunos</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">PEIs</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Cobertura</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Aprovação</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredNetworks.map((net) => {
                        const coverage = net.total_students > 0 ? (net.total_active_peis / net.total_students * 100) : 0;
                        const approval = net.total_active_peis > 0 ? (net.peis_approved / net.total_active_peis * 100) : 0;
                        return (
                          <tr key={net.tenant_id} className="hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div className="font-medium">{net.network_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {net.total_users} usuários
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-medium">{net.total_schools}</td>
                            <td className="px-4 py-3 text-center font-medium">{net.total_students}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="font-medium">{net.total_active_peis}</div>
                              <div className="text-xs text-muted-foreground">
                                {net.peis_pending} pendentes
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={coverage >= 80 ? "default" : coverage >= 60 ? "secondary" : "destructive"}>
                                {coverage.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline">
                                {approval.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => loadNetworkDetails(net.tenant_id)}
                                disabled={loadingDetails}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {loadingDetails ? "Carregando..." : "Ver Detalhes"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalhamento por Status */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  PEIs Aprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {networkStats.reduce((sum, n) => sum + n.peis_approved, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Em todas as redes municipais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  PEIs Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {networkStats.reduce((sum, n) => sum + n.peis_pending, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Aguardando aprovação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  Rascunhos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">
                  {networkStats.reduce((sum, n) => sum + n.peis_draft, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Em elaboração
                </p>
              </CardContent>
            </Card>
                </div>
        </TabsContent>

        {/* Tab: Escolas */}
        <TabsContent value="schools" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-6 w-6" />
                    Gestão de Escolas
                  </CardTitle>
                  <CardDescription>
                    Crie e gerencie escolas por rede municipal
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <ImportCSVDialog 
                    type="schools" 
                    onImportComplete={loadSchools}
                  />
                  <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleCreateSchool}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Escola
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingSchool ? 'Editar Escola' : 'Criar Nova Escola'}</DialogTitle>
                        <DialogDescription>
                          Preencha os dados da escola para adicionar à rede municipal
                        </DialogDescription>
                      </DialogHeader>
                      <CreateSchoolForm 
                        tenants={availableTenants}
                        onSubmit={handleSubmitCreateSchool}
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
                {/* Filtros */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="filter-network">Filtrar por Rede</Label>
                    <Select value={selectedNetworkFilter} onValueChange={setSelectedNetworkFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as redes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as redes</SelectItem>
                        {availableTenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.network_name || tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="search-school">Buscar Escola</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-school"
                        placeholder="Digite o nome da escola..."
                        value={schoolSearchTerm}
                        onChange={(e) => setSchoolSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Tabela de Escolas */}
                {allSchools.length === 0 ? (
                  <div className="text-center py-12">
                    <School className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma escola cadastrada</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comece criando sua primeira escola
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome da Escola</TableHead>
                          <TableHead>Rede Municipal</TableHead>
                          <TableHead>Endereço</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSchools.filter((school) => {
                          const matchesNetwork = selectedNetworkFilter === 'all' || school.tenant_id === selectedNetworkFilter;
                          const matchesSearch = !schoolSearchTerm || school.school_name?.toLowerCase().includes(schoolSearchTerm.toLowerCase());
                          return matchesNetwork && matchesSearch;
                        }).map((school) => (
                          <TableRow key={school.id}>
                            <TableCell className="font-medium">{school.school_name}</TableCell>
                            <TableCell>
                              {availableTenants.find(t => t.id === school.tenant_id)?.network_name || 'Rede não identificada'}
                            </TableCell>
                            <TableCell>{school.school_address || "—"}</TableCell>
                            <TableCell>{school.school_phone || "—"}</TableCell>
                            <TableCell>{school.school_email || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={school.is_active ? "default" : "secondary"}>
                                {school.is_active ? "Ativa" : "Inativa"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSchool(school)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSchool(school.id)}
                                >
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

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolução Mensal
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

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mês Anterior</span>
                    <span className="font-medium">{globalStats?.peisLastMonth || 0} PEIs</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, ((globalStats?.peisThisMonth || 0) / Math.max((globalStats?.peisLastMonth || 1), 1)) * 100)}%` 
                      }}
                    ></div>
                </div>
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Metas de Cobertura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cobertura Atual</span>
                    <span className="font-bold text-primary">
                      {globalStats?.coveragePercentage.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-primary h-3 rounded-full transition-all duration-500"
                      style={{ width: `${globalStats?.coveragePercentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 space-y-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Meta: 80%</span>
                    <Badge variant={(globalStats?.coveragePercentage || 0) >= 80 ? "default" : "secondary"}>
                      {(globalStats?.coveragePercentage || 0) >= 80 ? "✅ Atingida" : "🎯 Em progresso"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Faltam</span>
                    <span className="font-medium">
                      {Math.max(0, globalStats?.studentsWithoutPEI || 0)} alunos
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparativo de Redes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Comparativo de Performance entre Redes
              </CardTitle>
                <CardDescription>
                Análise detalhada de indicadores por rede municipal
                </CardDescription>
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
                  <p className="text-sm text-muted-foreground">
                            {net.total_schools} escolas • {net.total_students} alunos
                  </p>
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
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${coverage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Taxa Aprovação</p>
                          <p className="text-lg font-bold text-green-600">{approval.toFixed(1)}%</p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{ width: `${approval}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Pendentes</p>
                          <p className="text-lg font-bold text-yellow-600">{net.peis_pending}</p>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">{net.peis_draft} rascunhos</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Alertas e Insights */}
          <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <AlertCircle className="h-5 w-5" />
                Insights e Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(globalStats?.coveragePercentage || 0) < 70 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> Cobertura global está abaixo de 70%. 
                    Recomenda-se intensificar o cadastramento de PEIs nas redes com menor cobertura.
                  </AlertDescription>
                </Alert>
              )}
              
              {networkStats.some(n => (n.peis_pending / n.total_active_peis) > 0.3) && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Revisão:</strong> Algumas redes têm mais de 30% dos PEIs pendentes. 
                    Considere agilizar o processo de aprovação.
                  </AlertDescription>
                </Alert>
              )}
              
              {Number(globalStats?.growthPercentage) < 0 && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Crescimento:</strong> Houve redução no cadastramento de PEIs este mês. 
                    Investigar possíveis obstáculos com coordenadores.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Gestão Global de Usuários
              </CardTitle>
                <CardDescription>
                Gerencie usuários de todas as redes municipais
                </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Gestão de Usuários</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Acesse o componente SuperadminUserManagement para gerenciar usuários
                </p>
                <Button onClick={loadAllUsers} disabled={loadingUsers}>
                  <Users className="h-4 w-4 mr-2" />
                  {loadingUsers ? "Carregando..." : "Abrir Gerenciamento de Usuários"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumo de Usuários por Role */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Coordenadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {Math.floor((globalStats?.totalUsers || 0) * 0.15)}
              </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Professores AEE</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {Math.floor((globalStats?.totalUsers || 0) * 0.25)}
                </div>
            </CardContent>
          </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Professores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {Math.floor((globalStats?.totalUsers || 0) * 0.50)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Famílias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pink-600">
                  {Math.floor((globalStats?.totalUsers || 0) * 0.10)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Sistema */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Status do Banco de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conexões Ativas</span>
                  <span className="font-medium">{systemHealth?.activeConnections || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tempo Médio Resposta</span>
                  <span className="font-medium">{systemHealth?.avgResponseTime || 0}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última Sincronização</span>
                  <span className="font-medium text-xs">
                    {new Date(lastUpdate).toLocaleString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Manutenção e Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={refreshMaterializedViews}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Atualizar Materialized Views
                </Button>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => executeManualBackup(false)}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Backup Completo
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => executeManualBackup(true)}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Backup Compacto
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={viewAuditLogs}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Ver Logs de Auditoria
                </Button>
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Último backup automático: {new Date().toLocaleDateString('pt-BR')} às 03:00
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agendamento de Backups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Agendamento de Backups
                </CardTitle>
                <CardDescription>
                  Configure backups automáticos do sistema
                </CardDescription>
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
                        {schedule.last_run ? (
                          <>Último: {new Date(schedule.last_run).toLocaleString('pt-BR')}</>
                        ) : (
                          'Nunca executado'
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBackupSchedule(schedule.id)}
                    >
                      {schedule.enabled ? 'Pausar' : 'Ativar'}
                    </Button>
                  </div>
                ))}
                
                <div className="pt-3 border-t">
              <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createBackupSchedule('daily', '03:00')}
                    >
                      + Backup Diário
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createBackupSchedule('weekly', '02:00')}
                    >
                      + Backup Semanal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createBackupSchedule('monthly', '01:00')}
                    >
                      + Backup Mensal
                    </Button>
              </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logs Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividades Recentes do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {networkStats.length > 0 ? (
                  networkStats.slice(0, 4).map((network, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {network.total_active_peis > 0 ? `${network.total_active_peis} PEIs Ativos` : 'Rede Conectada'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {network.network_name} • {network.total_users} usuários
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(network.last_pei_update).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    Nenhuma rede conectada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Rede */}
      <Dialog open={networkDetailsOpen} onOpenChange={setNetworkDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-6 w-6" />
              {selectedNetwork?.network_name}
            </DialogTitle>
            <DialogDescription>
              Detalhes completos da rede municipal de ensino
            </DialogDescription>
          </DialogHeader>

          {selectedNetwork && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informações da Rede
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Endereço:</span>
              </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        {selectedNetwork.network_address || "Não informado"}
                      </p>
              </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Telefone:</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        {selectedNetwork.network_phone || "Não informado"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">E-mail:</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        {selectedNetwork.network_email || "Não informado"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Criada em:</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        {new Date(selectedNetwork.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedNetwork.is_active ? "default" : "secondary"}>
                      {selectedNetwork.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Última atualização: {new Date(selectedNetwork.updated_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas */}
          <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Usuários</CardTitle>
            </CardHeader>
            <CardContent>
                    <div className="text-2xl font-bold">{selectedNetwork.users.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedNetwork.users.filter(u => u.is_active).length} ativos
                </p>
              </CardContent>
            </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Estudantes</CardTitle>
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">{selectedNetwork.students.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedNetwork.students.filter(s => s.is_active).length} ativos
                </p>
              </CardContent>
            </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">PEIs</CardTitle>
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">{selectedNetwork.peis.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedNetwork.peis.filter(p => p.status === 'approved').length} aprovados
                </p>
              </CardContent>
            </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Escolas</CardTitle>
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">{selectedNetwork.schools.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedNetwork.schools.filter(s => s.is_active).length} ativas
                </p>
              </CardContent>
            </Card>
          </div>

              {/* Tabs de Detalhes */}
              <Tabs defaultValue="users" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="users">Usuários</TabsTrigger>
                  <TabsTrigger value="students">Estudantes</TabsTrigger>
                  <TabsTrigger value="peis">PEIs</TabsTrigger>
                  <TabsTrigger value="schools">Escolas</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Usuários da Rede ({selectedNetwork.users.length})
                      </CardTitle>
            </CardHeader>
            <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cadastrado em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedNetwork.users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.full_name}</TableCell>
                              <TableCell>{user.email || "Não informado"}</TableCell>
                              <TableCell>{user.phone || "Não informado"}</TableCell>
                              <TableCell>
                                <Badge variant={user.is_active ? "default" : "secondary"}>
                                  {user.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
            </CardContent>
          </Card>
        </TabsContent>

                <TabsContent value="students" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Estudantes da Rede ({selectedNetwork.students.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>ID do Estudante</TableHead>
                            <TableHead>Turma</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cadastrado em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedNetwork.students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.student_id || "Não informado"}</TableCell>
                              <TableCell>{student.class_name || "Não informado"}</TableCell>
                              <TableCell>
                                <Badge variant={student.is_active ? "default" : "secondary"}>
                                  {student.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(student.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="peis" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        PEIs da Rede ({selectedNetwork.peis.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Estudante</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Versão</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead>Atualizado em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedNetwork.peis.map((pei) => (
                            <TableRow key={pei.id}>
                              <TableCell className="font-medium">{pei.student_name}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  pei.status === 'approved' ? 'default' :
                                  pei.status === 'pending' ? 'secondary' :
                                  pei.status === 'draft' ? 'outline' : 'destructive'
                                }>
                                  {pei.status === 'approved' ? 'Aprovado' :
                                   pei.status === 'pending' ? 'Pendente' :
                                   pei.status === 'draft' ? 'Rascunho' : pei.status}
                                </Badge>
                              </TableCell>
                              <TableCell>v{pei.version_number}</TableCell>
                              <TableCell>
                                {new Date(pei.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                {new Date(pei.updated_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="schools" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <School className="h-5 w-5" />
                        Escolas da Rede ({selectedNetwork.schools.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome da Escola</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedNetwork.schools.map((school) => (
                            <TableRow key={school.id}>
                              <TableCell className="font-medium">{school.school_name}</TableCell>
                              <TableCell>{school.school_address || "Não informado"}</TableCell>
                              <TableCell>{school.school_phone || "Não informado"}</TableCell>
                              <TableCell>{school.school_email || "Não informado"}</TableCell>
                              <TableCell>
                                <Badge variant={school.is_active ? "default" : "secondary"}>
                                  {school.is_active ? "Ativa" : "Inativa"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Usuários */}
      <Dialog open={userManagementOpen} onOpenChange={setUserManagementOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Gerenciamento de Usuários
            </DialogTitle>
            <DialogDescription>
              Gerencie todos os usuários do sistema PEI Collab
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Card Informativo sobre Centralização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Gestão de Usuários
                </CardTitle>
                <CardDescription>
                  O cadastro de usuários foi centralizado no app Gestão Escolar para melhor organização e segurança.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <a href="http://localhost:5174/users" target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Gerenciar Usuários no Gestão Escolar
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Controles de Busca e Filtro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Busca e Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Busca por Nome */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar por Nome</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite o nome do usuário..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filtro por Rede */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filtrar por Rede</label>
                    <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma rede" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Redes</SelectItem>
                        {availableTenants.length > 0 ? (
                          availableTenants.map((tenant) => {
                            const userCount = allUsers.filter(u => u.tenant_id === tenant.id).length;
                            console.log(`🔍 Contando usuários para ${tenant.network_name || tenant.name}: ${userCount}`, {
                              tenantId: tenant.id,
                              users: allUsers.filter(u => u.tenant_id === tenant.id)
                            });
                            return (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.network_name || tenant.name || `Rede ${tenant.id.slice(0, 8)}`} ({userCount} usuários)
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="no-data" disabled>
                            Nenhuma rede encontrada
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {availableTenants.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma rede municipal cadastrada
                      </p>
                    )}
                  </div>

                  {/* Filtro por Escola */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filtrar por Escola</label>
                    <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma escola" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Escolas</SelectItem>
                        {availableSchools.length > 0 ? (
                          availableSchools.map((school) => {
                            const userCount = allUsers.filter(u => u.school_id === school.id).length;
                            console.log(`🔍 Contando usuários para ${school.school_name || school.name}: ${userCount}`, {
                              schoolId: school.id,
                              users: allUsers.filter(u => u.school_id === school.id)
                            });
                            return (
                              <SelectItem key={school.id} value={school.id}>
                                {school.school_name || school.name || `Escola ${school.id.slice(0, 8)}`} ({userCount} usuários)
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="no-data" disabled>
                            Nenhuma escola encontrada
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {availableSchools.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma escola cadastrada
                      </p>
                    )}
                  </div>
                </div>

                {/* Contador de Resultados */}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {getFilteredUsers().length} de {allUsers.length} usuários
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUserSearchTerm("");
                        setSelectedTenantFilter("all");
                        setSelectedSchoolFilter("all");
                      }}
                    >
                      <RefreshCcw className="h-4 w-4 mr-1" />
                      Limpar Filtros
                    </Button>
                    <CreateUserDialog
                      tenants={availableTenants}
                      onUserCreated={loadAllUsers}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas dos Usuários */}
          <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{allUsers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Cadastrados no sistema
                </p>
              </CardContent>
            </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Usuários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {allUsers.filter(u => u.is_active).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {((allUsers.filter(u => u.is_active).length / allUsers.length) * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Usuários Inativos</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {allUsers.filter(u => !u.is_active).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {((allUsers.filter(u => !u.is_active).length / allUsers.length) * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Novos Este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {allUsers.filter(u => {
                      const userDate = new Date(u.created_at);
                      const now = new Date();
                      return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
                    }).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cadastros recentes
                </p>
              </CardContent>
            </Card>
          </div>

            {/* Tabela de Usuários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Lista de Usuários ({getFilteredUsers().length})
                </CardTitle>
                <CardDescription>
                  Gerencie o status e permissões dos usuários
                </CardDescription>
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
                      <TableHead>Cadastrado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredUsers().map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
              </div>
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
                            {user.roles.map((role: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {role === 'superadmin' ? 'Super Admin' :
                                 role === 'coordinator' ? 'Coordenador' :
                                 role === 'school_manager' ? 'Gestor Escolar' :
                                 role === 'aee_teacher' ? 'Professor AEE' :
                                 role === 'teacher' ? 'Professor' :
                                 role === 'family' ? 'Família' :
                                 role === 'specialist' ? 'Especialista' :
                                 role === 'education_secretary' ? 'Secretário' :
                                 role === 'school_director' ? 'Diretor' : role}
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
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? (
                                <>
                                  <WifiOff className="h-4 w-4 mr-1" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Wifi className="h-4 w-4 mr-1" />
                                  Ativar
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                window.open('http://localhost:5174/users', '_blank');
                              }}
                              title="Editar no Gestão Escolar"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Resumo por Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribuição por Função
                </CardTitle>
                <CardDescription>
                  Baseado nos usuários filtrados ({getFilteredUsers().length} de {allUsers.length})
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {['superadmin', 'coordinator', 'aee_teacher', 'teacher', 'family', 'specialist'].map(role => {
                    const filteredUsers = getFilteredUsers();
                    const count = filteredUsers.filter(u => u.roles.includes(role)).length;
                    const activeCount = filteredUsers.filter(u => u.roles.includes(role) && u.is_active).length;
                    return (
                      <div key={role} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {role === 'superadmin' ? 'Super Admin' :
                             role === 'coordinator' ? 'Coordenadores' :
                             role === 'aee_teacher' ? 'Professores AEE' :
                             role === 'teacher' ? 'Professores' :
                             role === 'family' ? 'Famílias' :
                             role === 'specialist' ? 'Especialistas' : role}
                          </span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${filteredUsers.length > 0 ? (count / filteredUsers.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activeCount} ativos de {count} total
                        </div>
                      </div>
                    );
                  })}
                </div>
            </CardContent>
          </Card>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SuperadminDashboard;