import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, FileText, CheckCircle, XCircle, Clock, Download, School,
  TrendingUp, AlertTriangle, MessageSquare, Accessibility,
  Calendar, Ambulance, BarChart3, AlertCircle,
  BookOpen, UsersRound, BarChart, GraduationCap, ClipboardList, Handshake, Lightbulb, ShieldCheck, Settings, Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import RequestPEIDialog from "@/components/coordinator/RequestPEIDialog";
import PEIQueueTable from "@/components/coordinator/PEIQueueTable";
import PEIDetailDialog from "@/components/coordinator/PEIDetailDialog";
import InclusionQuote from "@/components/shared/InclusionQuote";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type PEIStatus = "draft" | "pending_validation" | "returned" | "validated" | "pending_family" | "approved";

interface PEIData {
  id: string;
  student_id: string;
  student_name: string;
  teacher_name: string;
  tenant_name: string;
  status: PEIStatus;
  created_at: string;
}

interface CoordinatorDashboardProps {
  profile: {
    id: string;
    full_name: string;
    role: string;
    tenant_id: string | null;
  };
}

interface Tenant {
  id: string;
  name: string;
}

interface Stats {
  students: number;
  peisPending: number;
  peisApproved: number;
  peisReturned: number;
  peisDraft: number;
  peisValidated: number;
  peisPendingFamily: number;
  withComments: number;
  total: number;
}

interface ExtendedStats {
  totalReviews: number;
  upcomingReviews: number;
  lateReviews: number;
  totalBarriers: number;
  barrierCountByType: Record<string, number>;
  goalsInProgress: number;
  goalsPartial: number;
  goalsAchieved: number;
  totalGoals: number;
  avgProgress: number;
  resourceUse: Record<string, number>;
  referralCountByType: Record<string, number>;
}

interface PEIQueueItem {
  id: string;
  student_name: string;
  teacher_name: string;
  status: PEIStatus;
  created_at: string;
}

interface TeacherPerformance {
  teacher_name: string;
  approved_count: number;
  returned_count: number;
  total_count: number;
}

interface PEIStatusHistory {
  date: string;
  pending_validation: number;
  approved: number;
  returned: number;
  draft: number;
  validated: number;
  pending_family: number;
}

interface BarrierTypeData {
  name: string;
  count: number;
}

interface ResourceUseData {
  name: string;
  count: number;
}

interface ReferralData {
  name: string;
  count: number;
}

interface GoalProgressData {
  name: string;
  value: number;
}

interface PEIReviewData {
  date: string;
  count: number;
}

interface PEIReview {
  id: string;
  pei_id: string;
  reviewer_role: string;
  review_date: string;
  next_review_date: string;
  notes: string;
}

interface PEIBarrier {
  id: string;
  pei_id: string;
  barrier_type: string;
  severity: string;
}

interface PEIGoal {
  id: string;
  pei_id: string;
  progress_level: string;
  progress_score: number;
}

interface PEIAccessibilityResource {
  resource_type: string;
  usage_frequency: string;
}

interface PEIReferral {
  referred_to: string;
  reason: string;
  date: string;
}

interface StudentData {
  id: string;
  name: string;
  tenant_id: string;
}

interface ProfileData {
  id: string;
  full_name: string;
}

interface PEI {
  id: string;
  student_id: string;
  status: PEIStatus;
  created_at: string;
  assigned_teacher_id: string;
  students: StudentData;
  profiles: ProfileData;
}

interface PEIComment {
  pei_id: string;
  user_id: string;
}

interface TenantData {
  id: string;
  name: string;
}

interface PEIProgressData {
  date: string;
  count: number;
}

interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
}

const AlertCircleIcon = AlertCircle; // Renomear para evitar conflito com o componente AlertCircle

const CoordinatorDashboard = ({ profile }: CoordinatorDashboardProps) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [stats, setStats] = useState<Stats>({
    students: 0,
    peisPending: 0,
    peisApproved: 0,
    peisReturned: 0,
    peisDraft: 0,
    peisValidated: 0,
    peisPendingFamily: 0,
    withComments: 0,
    total: 0,
  });
  const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);
  const [peis, setPeis] = useState<PEIData[]>([]);
  const [selectedPeiId, setSelectedPeiId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformance[]>([]);
  const [peiStatusHistory, setPeiStatusHistory] = useState<PEIStatusHistory[]>([]);
  const [barrierTypeData, setBarrierTypeData] = useState<BarrierTypeData[]>([]);
  const [resourceUseData, setResourceUseData] = useState<ResourceUseData[]>([]);
  const [referralData, setReferralData] = useState<ReferralData[]>([]);
  const [goalProgressData, setGoalProgressData] = useState<GoalProgressData[]>([]);
  const [peiReviewData, setPeiReviewData] = useState<PEIReviewData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCoordinatorTenants();
  }, [profile.id]);

  useEffect(() => {
    if (selectedTenantId) {
      loadTenantData();
      loadTeacherPerformance();
      loadPeiStatusHistory();
      loadBarrierTypeData();
      loadResourceUseData();
      loadReferralData();
      loadGoalProgressData();
      loadPeiReviewData();
      loadNotifications();
    }
  }, [selectedTenantId, dateRange]);

  const loadCoordinatorTenants = async () => {
    try {
      setLoading(true);

      const { data: userTenants, error: userTenantsError } = await supabase
        .from("user_tenants")
        .select(`
          tenant_id,
          tenants!inner (
            id,
            name
          )
        `)
        .eq("user_id", profile.id);

      if (userTenantsError) throw userTenantsError;

      const tenantsData = userTenants
        ?.map((ut: any) => ut.tenants)
        .filter((t: any): t is Tenant => t !== null && typeof t === 'object') || [];

      setTenants(tenantsData);

      if (tenantsData.length > 0) {
        setSelectedTenantId(tenantsData[0].id);
      } else {
        toast({
          title: "Aviso",
          description: "Você não está associado a nenhuma escola.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar escolas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTenantData = async () => {
    if (!selectedTenantId) return;

    try {
      setLoading(true);

      const [studentsCount, peisData, commentsData] = await Promise.all([
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", selectedTenantId),

        supabase
          .from("peis")
          .select(`
            id,
            student_id,
            status,
            created_at,
            assigned_teacher_id,
            students!inner (
              name,
              tenant_id
            ),
            profiles!assigned_teacher_id (
              full_name
            )
          `)
          .eq("tenant_id", selectedTenantId)
          .order("created_at", { ascending: false }),

        supabase
          .from("pei_comments")
          .select("pei_id, user_id")
      ]);

      if (studentsCount.error) throw studentsCount.error;
      if (peisData.error) throw peisData.error;

      const peisWithComments = new Set<string>();
      if (commentsData.data) {
        commentsData.data.forEach((comment: any) => {
          if (comment.user_id !== profile.id) {
            peisWithComments.add(comment.pei_id);
          }
        });
      }

      const peisByStatus = {
        pending: 0,
        approved: 0,
        returned: 0,
        draft: 0,
        validated: 0,
        pending_family: 0,
      };

      peisData.data?.forEach((pei: any) => {
        const status = pei.status;
        if (status === "pending_validation") {
          peisByStatus.pending++;
        } else if (status === "approved") {
          peisByStatus.approved++;
        } else if (status === "returned") {
          peisByStatus.returned++;
        } else if (status === "draft") {
          peisByStatus.draft++;
        } else if (status === "validated") {
          peisByStatus.validated++;
        } else if (status === "pending_family") {
          peisByStatus.pending_family++;
        }
      });

      setStats({
        students: studentsCount.count || 0,
        peisPending: peisByStatus.pending,
        peisApproved: peisByStatus.approved,
        peisReturned: peisByStatus.returned,
        peisDraft: peisByStatus.draft,
        peisValidated: peisByStatus.validated,
        peisPendingFamily: peisByStatus.pending_family,
        withComments: peisWithComments.size,
        total: peisData.data?.length || 0,
      });

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("name")
        .eq("id", selectedTenantId)
        .single();

      const formattedPEIs: PEIData[] = peisData.data?.map((p: any) => ({
        id: p.id,
        student_id: p.student_id,
        student_name: p.students?.name || "Aluno não identificado",
        teacher_name: p.profiles?.full_name || "Não atribuído",
        tenant_name: tenantData?.name || "Escola não identificada",
        status: p.status,
        created_at: p.created_at,
      })) || [];

      setPeis(formattedPEIs);

      await loadExtendedStats(selectedTenantId);

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExtendedStats = async (tenantId: string) => {
    try {
      const [reviewsData, barriersData, goalsData, resourcesData, referralsData] = await Promise.all([
        supabase.from("pei_reviews").select("id, pei_id, reviewer_role, review_date, next_review_date, notes"),
        supabase.from("pei_barriers").select("id, pei_id, barrier_type, severity"),
        supabase.from("pei_goals").select("id, pei_id, progress_level, progress_score"),
        supabase.from("pei_accessibility_resources").select("resource_type, usage_frequency"),
        supabase.from("pei_referrals").select("referred_to, reason, date"),
      ]);

      const now = new Date();
      const upcomingReviews = reviewsData.data?.filter(r =>
        r.next_review_date && new Date(r.next_review_date) > now
      ) || [];
      const lateReviews = reviewsData.data?.filter(r =>
        r.next_review_date && new Date(r.next_review_date) < now
      ) || [];

      const barrierCountByType = barriersData.data?.reduce((acc: Record<string, number>, b) => {
        acc[b.barrier_type] = (acc[b.barrier_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const goalsInProgress = goalsData.data?.filter(g => g.progress_level === "em andamento").length || 0;
      const goalsPartial = goalsData.data?.filter(g => g.progress_level === "parcialmente alcançada").length || 0;
      const goalsAchieved = goalsData.data?.filter(g => g.progress_level === "alcançada").length || 0;
      const totalGoals = goalsData.data?.length || 0;
      const avgProgress = goalsData.data && goalsData.data.length > 0
        ? Math.round(goalsData.data.reduce((sum, g) => sum + (g.progress_score || 0), 0) / goalsData.data.length)
        : 0;

      const resourceUse = resourcesData.data?.reduce((acc: Record<string, number>, r) => {
        acc[r.resource_type] = (acc[r.resource_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const referralCountByType = referralsData.data?.reduce((acc: Record<string, number>, r) => {
        acc[r.referred_to] = (acc[r.referred_to] || 0) + 1;
        return acc;
      }, {}) || {};

      setExtendedStats({
        totalReviews: reviewsData.data?.length || 0,
        upcomingReviews: upcomingReviews.length,
        lateReviews: lateReviews.length,
        totalBarriers: barriersData.data?.length || 0,
        barrierCountByType,
        goalsInProgress,
        goalsPartial,
        goalsAchieved,
        totalGoals,
        avgProgress,
        resourceUse,
        referralCountByType,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas estendidas:", error);
    }
  };

  const loadTeacherPerformance = async () => {
    if (!selectedTenantId) return;
    try {
      const { data, error } = await supabase
        .from("peis")
        .select(`
          status,
          profiles!assigned_teacher_id (full_name)
        `)
        .eq("tenant_id", selectedTenantId);

      if (error) throw error;

      const performanceMap = new Map<string, { approved: number; returned: number; total: number }>();

      data.forEach((pei: any) => {
        const teacherName = pei.profiles?.full_name || "Não Atribuído";
        if (!performanceMap.has(teacherName)) {
          performanceMap.set(teacherName, { approved: 0, returned: 0, total: 0 });
        }
        const teacherStats = performanceMap.get(teacherName)!;
        teacherStats.total++;
        if (pei.status === "approved") {
          teacherStats.approved++;
        } else if (pei.status === "returned") {
          teacherStats.returned++;
        }
      });

      const formattedPerformance: TeacherPerformance[] = Array.from(performanceMap.entries()).map(([name, stats]) => ({
        teacher_name: name,
        approved_count: stats.approved,
        returned_count: stats.returned,
        total_count: stats.total,
      }));

      setTeacherPerformance(formattedPerformance);
    } catch (error) {
      console.error("Erro ao carregar desempenho dos professores:", error);
    }
  };

  const loadPeiStatusHistory = async () => {
    if (!selectedTenantId || !dateRange?.from || !dateRange?.to) return;

    try {
      const { data, error } = await supabase
        .from("peis")
        .select("created_at, status")
        .eq("tenant_id", selectedTenantId)
        .gte("created_at", format(dateRange.from, "yyyy-MM-dd"))
        .lte("created_at", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;

      const historyMap = new Map<string, PEIStatusHistory>();
      const allDates = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to,
      });

      allDates.forEach(date => {
        const formattedDate = format(date, "yyyy-MM-dd");
        historyMap.set(formattedDate, {
          date: formattedDate,
          pending_validation: 0,
          approved: 0,
          returned: 0,
          draft: 0,
          validated: 0,
          pending_family: 0,
        });
      });

      data.forEach((pei: any) => {
        const date = format(new Date(pei.created_at), "yyyy-MM-dd");
        const entry = historyMap.get(date);
        if (entry) {
          if (pei.status === "pending_validation") entry.pending_validation++;
          else if (pei.status === "approved") entry.approved++;
          else if (pei.status === "returned") entry.returned++;
          else if (pei.status === "draft") entry.draft++;
          else if (pei.status === "validated") entry.validated++;
          else if (pei.status === "pending_family") entry.pending_family++;
        }
      });

      setPeiStatusHistory(Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error("Erro ao carregar histórico de status de PEI:", error);
    }
  };

  const loadBarrierTypeData = async () => {
    if (!selectedTenantId) return;
    try {
      const { data, error } = await supabase
        .from("pei_barriers")
        .select("barrier_type, peis!inner(tenant_id)")
        .eq("peis.tenant_id", selectedTenantId);

      if (error) throw error;

      const counts = data.reduce((acc: Record<string, number>, item: any) => {
        acc[item.barrier_type] = (acc[item.barrier_type] || 0) + 1;
        return acc;
      }, {});

      setBarrierTypeData(Object.entries(counts).map(([name, count]) => ({ name, count: count as number })));
    } catch (error) {
      console.error("Erro ao carregar dados de tipo de barreira:", error);
    }
  };

  const loadResourceUseData = async () => {
    if (!selectedTenantId) return;
    try {
      const { data, error } = await supabase
        .from("pei_accessibility_resources")
        .select("resource_type, peis!inner(tenant_id)")
        .eq("peis.tenant_id", selectedTenantId);

      if (error) throw error;

      const counts = data.reduce((acc: Record<string, number>, item: any) => {
        acc[item.resource_type] = (acc[item.resource_type] || 0) + 1;
        return acc;
      }, {});

      setResourceUseData(Object.entries(counts).map(([name, count]) => ({ name, count: count as number })));
    } catch (error) {
      console.error("Erro ao carregar dados de uso de recursos:", error);
    }
  };

  const loadReferralData = async () => {
    if (!selectedTenantId) return;
    try {
      const { data, error } = await supabase
        .from("pei_referrals")
        .select("referred_to, peis!inner(tenant_id)")
        .eq("peis.tenant_id", selectedTenantId);

      if (error) throw error;

      const counts = data.reduce((acc: Record<string, number>, item: any) => {
        acc[item.referred_to] = (acc[item.referred_to] || 0) + 1;
        return acc;
      }, {});

      setReferralData(Object.entries(counts).map(([name, count]) => ({ name, count: count as number })));
    } catch (error) {
      console.error("Erro ao carregar dados de encaminhamento:", error);
    }
  };

  const loadGoalProgressData = async () => {
    if (!selectedTenantId) return;
    try {
      const { data, error } = await supabase
        .from("pei_goals")
        .select("progress_level, peis!inner(tenant_id)")
        .eq("peis.tenant_id", selectedTenantId);

      if (error) throw error;

      const counts = data.reduce((acc: Record<string, number>, item: any) => {
        acc[item.progress_level] = (acc[item.progress_level] || 0) + 1;
        return acc;
      }, {});

      setGoalProgressData(Object.entries(counts).map(([name, count]) => ({ name, value: count as number })));
    } catch (error) {
      console.error("Erro ao carregar dados de progresso de metas:", error);
    }
  };

  const loadPeiReviewData = async () => {
    if (!selectedTenantId) return;
    try {
      const { data, error } = await supabase
        .from("pei_reviews")
        .select("review_date, peis!inner(tenant_id)")
        .eq("peis.tenant_id", selectedTenantId);

      if (error) throw error;

      const dailyCounts = data.reduce((acc: Record<string, number>, item: any) => {
        const date = format(new Date(item.review_date), "yyyy-MM-dd");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      setPeiReviewData(Object.entries(dailyCounts).map(([date, count]) => ({ date, count: count as number })).sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error("Erro ao carregar dados de revisão de PEI:", error);
    }
  };

  const loadNotifications = async () => {
    if (!profile.id) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
      setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const handleViewPEI = (peiId: string) => {
    setSelectedPeiId(peiId);
    setDetailDialogOpen(true);
  };

  const handleApprovePEI = async (peiId: string) => {
    try {
      const { error } = await supabase
        .from("peis")
        .update({ status: "approved" })
        .eq("id", peiId);

      if (error) throw error;

      toast({ title: "PEI aprovado com sucesso!" });
      loadTenantData();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar PEI",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReturnPEI = async (peiId: string) => {
    try {
      const { error } = await supabase
        .from("peis")
        .update({ status: "returned" })
        .eq("id", peiId);

      if (error) throw error;

      toast({ title: "PEI devolvido ao professor" });
      loadTenantData();
    } catch (error: any) {
      toast({
        title: "Erro ao devolver PEI",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportReport = async () => {
    try {
      const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
      const doc = new jsPDF();

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("PEI Colaborativo", 105, 15, { align: "center" });
      doc.setFontSize(12);
      doc.text("Sistema de Gestão de Planos Educacionais Individualizados", 105, 22, { align: "center" });

      doc.setTextColor(0, 0, 0);

      // Informações do relatório
      doc.setFontSize(18);
      doc.text("Relatório de PEIs", 20, 45);

      doc.setFontSize(11);
      doc.text(`Coordenador(a): ${profile.full_name}`, 20, 55);
      doc.text(`Escola: ${selectedTenant?.name || "N/A"}`, 20, 62);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`, 20, 69);
      doc.text(`Horário: ${new Date().toLocaleTimeString("pt-BR")}`, 20, 76);

      doc.setLineWidth(0.5);
      doc.line(20, 80, 190, 80);

      // Estatísticas Gerais
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Estatísticas Gerais", 20, 90);
      doc.setFont(undefined, 'normal');
      
      doc.setFontSize(10);
      let yPos = 98;
      
      const statsData = [
        { label: "Total de Alunos", value: stats.students },
        { label: "Total de PEIs", value: stats.total },
        { label: "PEIs em Rascunho", value: stats.peisDraft },
        { label: "PEIs Pendentes de Validação", value: stats.peisPending },
        { label: "PEIs Validados", value: stats.peisValidated },
        { label: "PEIs Aguardando Família", value: stats.peisPendingFamily },
        { label: "PEIs Aprovados", value: stats.peisApproved },
        { label: "PEIs Devolvidos", value: stats.peisReturned },
        { label: "PEIs com Novos Comentários", value: stats.withComments },
      ];

      statsData.forEach((stat) => {
        doc.text(`• ${stat.label}: ${stat.value}`, 25, yPos);
        yPos += 7;
      });

      // Estatísticas Estendidas
      if (extendedStats) {
        yPos += 5;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Análise Pedagógica", 20, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 8;

        doc.setFontSize(10);
        const extendedData = [
          { label: "Total de Metas", value: extendedStats.totalGoals },
          { label: "Progresso Médio", value: `${extendedStats.avgProgress}%` },
          { label: "Metas Alcançadas", value: extendedStats.goalsAchieved },
          { label: "Metas Parcialmente Alcançadas", value: extendedStats.goalsPartial },
          { label: "Metas em Andamento", value: extendedStats.goalsInProgress },
          { label: "Total de Barreiras Identificadas", value: extendedStats.totalBarriers },
          { label: "Total de Revisões", value: extendedStats.totalReviews },
          { label: "Revisões Futuras", value: extendedStats.upcomingReviews },
          { label: "Revisões Atrasadas", value: extendedStats.lateReviews },
        ];

        extendedData.forEach((stat) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`• ${stat.label}: ${stat.value}`, 25, yPos);
          yPos += 7;
        });
      }

      // Lista de PEIs
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 10;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Lista Detalhada de PEIs", 20, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 8;

      doc.setFontSize(9);
      peis.forEach((pei, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${pei.student_name}`, 25, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 5;
        
        doc.text(`   Professor: ${pei.teacher_name}`, 30, yPos);
        yPos += 5;
        doc.text(`   Status: ${getStatusLabel(pei.status)}`, 30, yPos);
        yPos += 5;
        doc.text(`   Criado em: ${new Date(pei.created_at).toLocaleDateString("pt-BR")}`, 30, yPos);
        yPos += 8;
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${pageCount} - Gerado por ${profile.full_name} em ${new Date().toLocaleDateString("pt-BR")}`,
          105,
          290,
          { align: "center" }
        );
      }

      const fileName = `relatorio-peis-${selectedTenant?.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Relatório exportado!",
        description: "O PDF foi gerado e baixado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar relatório",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: PEIStatus): string => {
    const labels: Record<PEIStatus, string> = {
      draft: "Rascunho",
      pending_validation: "Pendente de Validação",
      returned: "Devolvido",
      validated: "Validado",
      pending_family: "Aguardando Família",
      approved: "Aprovado",
    };
    return labels[status] || status;
  };

  const selectedTenantName = useMemo(() => {
    return tenants.find((t) => t.id === selectedTenantId)?.name || "";
  }, [tenants, selectedTenantId]);

  const completionRate = stats.total > 0 ? Math.round((stats.peisApproved / stats.total) * 100) : 0;

  if (tenants.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você precisa estar vinculado a pelo menos uma escola para acessar este painel.
              Entre em contato com o administrador do sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Olá, {profile.full_name}!
          </h2>
          <p className="text-muted-foreground">
            Painel de coordenação pedagógica para {selectedTenantName}
          </p>
        </div>
        <div className="flex gap-2">
          <RequestPEIDialog 
            tenantId={selectedTenantId} 
            coordinatorId={profile.id} 
            onPEICreated={loadTenantData} 
          />
          <Button
            variant="outline"
            onClick={handleExportReport}
            disabled={!selectedTenantId || loading}
          >
            <Download className="mr-2 h-4 w-4" />
            Relatório
          </Button>
        </div>
      </div>

      {tenants.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <School className="h-5 w-5" />
              Selecione a Escola
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Escolha uma escola" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p>Carregando dados da escola...</p>
          <Progress value={50} className="w-1/2 mx-auto mt-2" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alunos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.students}</div>
                <p className="text-xs text-muted-foreground">Total de alunos na escola</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PEIs Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.peisPending}</div>
                <p className="text-xs text-muted-foreground">Aguardando sua validação</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PEIs Aprovados</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.peisApproved}</div>
                <p className="text-xs text-muted-foreground">PEIs finalizados e aprovados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
                <p className="text-xs text-muted-foreground">De PEIs aprovados</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Progresso Geral dos PEIs</CardTitle>
                <CardDescription>
                  Visão geral do status de todos os PEIs na escola.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Badge className="mr-2 w-28 justify-center" variant="secondary">Rascunho</Badge>
                    <Progress value={(stats.peisDraft / stats.total) * 100} />
                    <span className="ml-2 text-sm font-medium">{stats.peisDraft}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-2 w-28 justify-center" variant="yellow">Pendente</Badge>
                    <Progress value={(stats.peisPending / stats.total) * 100} />
                    <span className="ml-2 text-sm font-medium">{stats.peisPending}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-2 w-28 justify-center" variant="blue">Validado</Badge>
                    <Progress value={(stats.peisValidated / stats.total) * 100} />
                    <span className="ml-2 text-sm font-medium">{stats.peisValidated}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-2 w-28 justify-center" variant="orange">Aguard. Família</Badge>
                    <Progress value={(stats.peisPendingFamily / stats.total) * 100} />
                    <span className="ml-2 text-sm font-medium">{stats.peisPendingFamily}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-2 w-28 justify-center" variant="green">Aprovado</Badge>
                    <Progress value={(stats.peisApproved / stats.total) * 100} />
                    <span className="ml-2 text-sm font-medium">{stats.peisApproved}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-2 w-28 justify-center" variant="destructive">Devolvido</Badge>
                    <Progress value={(stats.peisReturned / stats.total) * 100} />
                    <span className="ml-2 text-sm font-medium">{stats.peisReturned}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                  Pontos de Atenção
                </CardTitle>
                <CardDescription>
                  Itens que requerem sua atenção imediata.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">PEIs Devolvidos</p>
                    <p className="text-sm text-muted-foreground">Professores precisam revisar</p>
                  </div>
                  <Badge variant="destructive" className="text-lg">{stats.peisReturned}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">PEIs com Novos Comentários</p>
                    <p className="text-sm text-muted-foreground">Interações para verificar</p>
                  </div>
                  <Badge variant="yellow" className="text-lg">{stats.withComments}</Badge>
                </div>
                {extendedStats && extendedStats.lateReviews > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium">Reuniões Atrasadas</p>
                      <p className="text-sm text-muted-foreground">Reuniões de acompanhamento de PEI</p>
                    </div>
                    <Badge variant="destructive" className="text-lg">{extendedStats.lateReviews}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          <Tabs defaultValue="overview" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="analytics">Análises</TabsTrigger>
                <TabsTrigger value="notifications">Notificações</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>{format(dateRange.from, "LLL dd, y", { locale: ptBR })} - {format(dateRange.to, "LLL dd, y", { locale: ptBR })}</>
                        ) : (
                          format(dateRange.from, "LLL dd, y", { locale: ptBR })
                        )
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fila de Validação de PEIs</CardTitle>
                  <CardDescription>
                    Estes são os PEIs que foram submetidos pelos professores e aguardam sua validação.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PEIQueueTable 
                    peis={peis.filter(p => p.status === 'pending_validation')}
                    onViewPEI={handleViewPEI}
                    onApprovePEI={handleApprovePEI}
                    onReturnPEI={handleReturnPEI}
                  />
                </CardContent>
              </Card>
              <InclusionQuote />
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Histórico de Status de PEIs</CardTitle>
                    <CardDescription>Evolução dos status dos PEIs ao longo do tempo.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={peiStatusHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'dd/MM', { locale: ptBR })} />
                        <YAxis />
                        <Tooltip formatter={(value: number, name: string) => [`${value} PEIs`, name]} />
                        <Legend />
                        <Line type="monotone" dataKey="pending_validation" stroke="#FFC107" name="Pendente" />
                        <Line type="monotone" dataKey="approved" stroke="#28A745" name="Aprovado" />
                        <Line type="monotone" dataKey="returned" stroke="#DC3545" name="Devolvido" />
                        <Line type="monotone" dataKey="draft" stroke="#6C757D" name="Rascunho" />
                        <Line type="monotone" dataKey="validated" stroke="#007BFF" name="Validado" />
                        <Line type="monotone" dataKey="pending_family" stroke="#FD7E14" name="Aguardando Família" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Desempenho dos Professores</CardTitle>
                    <CardDescription>PEIs aprovados e devolvidos por professor.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={teacherPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="teacher_name" />
                        <YAxis />
                        <Tooltip formatter={(value: number, name: string) => [`${value} PEIs`, name]} />
                        <Legend />
                        <Bar dataKey="approved_count" fill="#28A745" name="Aprovados" />
                        <Bar dataKey="returned_count" fill="#DC3545" name="Devolvidos" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Barreiras Mais Comuns</CardTitle>
                    <CardDescription>Tipos de barreiras mais frequentemente identificadas.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={barrierTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value} ocorrências`]} />
                        <Legend />
                        <Bar dataKey="count" fill="#FFC107" name="Ocorrências" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Uso de Recursos de Acessibilidade</CardTitle>
                    <CardDescription>Frequência de uso de diferentes recursos.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={resourceUseData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value} usos`]} />
                        <Legend />
                        <Bar dataKey="count" fill="#007BFF" name="Usos" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Encaminhamentos Comuns</CardTitle>
                    <CardDescription>Tipos de encaminhamentos mais realizados.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={referralData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value} encaminhamentos`]} />
                        <Legend />
                        <Bar dataKey="count" fill="#17A2B8" name="Encaminhamentos" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Progresso das Metas</CardTitle>
                    <CardDescription>Distribuição do progresso das metas dos PEIs.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={goalProgressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value} metas`]} />
                        <Legend />
                        <Bar dataKey="value" fill="#28A745" name="Metas" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Revisões de PEI por Data</CardTitle>
                    <CardDescription>Número de revisões de PEI realizadas por dia.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={peiReviewData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'dd/MM', { locale: ptBR })} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value} revisões`]} />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#6F42C1" name="Revisões" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Suas Notificações</CardTitle>
                  <CardDescription>Mantenha-se atualizado com as últimas atividades.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {notifications.length === 0 ? (
                        <p className="text-muted-foreground">Nenhuma notificação.</p>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg",
                              notification.read ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-800 font-medium"
                            )}
                          >
                            <div>
                              <p>{notification.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkNotificationAsRead(notification.id)}
                              >
                                Marcar como lida
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {selectedPeiId && (
        <PEIDetailDialog
          peiId={selectedPeiId}
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          onStatusChange={loadTenantData}
          currentUserId={profile.id}
        />
      )}
    </div>
  );
};

export default CoordinatorDashboard;