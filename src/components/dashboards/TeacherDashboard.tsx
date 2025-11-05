// src/components/dashboards/TeacherDashboard.tsx
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Plus, Clock, CheckCircle2, Edit, Trash2, Users,
  TrendingUp, AlertCircle, BookOpen, GraduationCap, Sparkles, Star,
  Award, Zap, Target, Calendar, MessageSquare, Bell, AlertTriangle,
  CheckCircle, ArrowRight, History, Accessibility,
  HeartPulse, BarChart3, Eye, Info
} from "lucide-react";
import InclusionQuote from "@/components/shared/InclusionQuote";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format, differenceInDays, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";
import { usePermissions } from "@/hooks/usePermissions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportView from "@/components/pei/ReportView";
import PEIVersionHistoryDialog from "@/components/pei/PEIVersionHistoryDialog";
import UserAvatar from "@/components/shared/UserAvatar";

interface TeacherDashboardProps {
  profile: {
    id: string;
    full_name: string;
    tenant_id: string | null;
    school_id: string | null;
    user_roles?: Array<{ role: string }>;
    network_name?: string;
    school_name?: string;
    avatar_emoji?: string;
    avatar_color?: string;
  };
}

interface PEI {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  assigned_teacher_id?: string;
  student_id: string;
  students?: { name: string } | null;
  version_number?: number;
  is_active_version?: boolean;
}

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
}

interface Comment {
  id: string;
  pei_id?: string;
  user_id: string;
  content: string;
  created_at: string;
  student_id?: string;
  profiles?: { full_name: string };
}

interface PEIWithComments extends PEI {
  comments?: Comment[];
  unread_comments?: number;
}

interface TimelineItem {
  id: string;
  type: 'pei_created' | 'comment' | 'status_change' | 'review_due' | 'pending_action' | 'review' | 'referral';
  title: string;
  description: string;
  date: Date;
  pei_id?: string;
  student_name?: string;
  user_name?: string;
  priority: 'low' | 'medium' | 'high';
  icon: any;
  color: string;
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

const TeacherDashboard = ({ profile }: TeacherDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { tenantInfo, schoolInfo } = useTenant();
  const { canManageSchool, primaryRole } = usePermissions();
  const [peis, setPeis] = useState<PEIWithComments[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [peiToDelete, setPeiToDelete] = useState<PEI | null>(null);
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [peiToView, setPeiToView] = useState<any>(null);
  const [peiComments, setPeiComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile.id]);

  const loadData = async (): Promise<void> => {
    try {
      // Load PEIs - APENAS VERSÕES ATIVAS
      const peisResponse = await supabase
        .from("peis")
        .select(`
          id, status, created_at, updated_at, created_by, assigned_teacher_id,
          student_id, students (name)
        `)
        .or(`assigned_teacher_id.eq.${profile.id},created_by.eq.${profile.id}`)
        .eq('is_active_version', true)  // FILTRAR APENAS VERSÕES ATIVAS
        .order("updated_at", { ascending: false });
      
      const peisData: any[] = peisResponse.data || [];
      const peisError = peisResponse.error;

      if (peisError) throw peisError;

      // Load comments for each PEI
      const peisWithComments: PEIWithComments[] = [];
      for (const pei of (peisData as PEI[]) || []) {
        const { data: commentsData } = await supabase
          .from("pei_comments")
          .select(`id, pei_id, user_id, content, created_at, student_id, profiles (full_name)`)
          .eq("pei_id", pei.id)
          .order("created_at", { ascending: false });

        const unreadComments = commentsData?.filter((c: any) => c.user_id !== profile.id).length || 0;
        peisWithComments.push({
          ...pei,
          comments: (commentsData as any) || [],
          unread_comments: unreadComments
        });
      }

      setPeis(peisWithComments);

      // Load student names
      const studentIds = Array.from(
        new Set(peisWithComments.map(p => p.student_id).filter(Boolean))
      );
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from("students")
          .select("id, name, date_of_birth")
          .in("id", studentIds as string[]);

        const map: Record<string, string> = {};
        (studentsData as any[])?.forEach((s) => { map[s.id] = s.name; });
        setStudentNames(map);
      }

      // Load students with access
      let studentsList = [];
      let studentsWithAccessIds: string[] = [];
      
      // SEMPRE verificar student_access para professores, independente de ter school_id
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .limit(1);
      
      const primaryRole = userRoles?.[0]?.role || 'teacher';
      
      if (primaryRole === "teacher" || primaryRole === "aee_teacher") {
        // Professores SEMPRE usam student_access
        const { data: studentsAccessData } = await supabase
          .from("student_access")
          .select(`student_id, students (id, name, date_of_birth)`)
          .eq("user_id", profile.id);

        studentsList = studentsAccessData
          ?.map((item: any) => item.students)
          .filter(Boolean) || [];
        
        // FALLBACK: Se não encontrou em student_access, buscar via pei_teachers
        if (!studentsList || studentsList.length === 0) {
          console.log('⚠️ Nenhum aluno em student_access, buscando via pei_teachers...');
          
          const { data: peiTeachersData } = await supabase
            .from("pei_teachers")
            .select(`
              peis!inner (
                student_id,
                is_active_version,
                students (id, name, date_of_birth)
              )
            `)
            .eq("teacher_id", profile.id);
          
          if (peiTeachersData && peiTeachersData.length > 0) {
            // Extrair alunos únicos dos PEIs ativos
            const studentsMap = new Map();
            peiTeachersData.forEach((pt: any) => {
              const pei = pt.peis;
              if (pei && pei.is_active_version && pei.students) {
                studentsMap.set(pei.students.id, pei.students);
              }
            });
            
            studentsList = Array.from(studentsMap.values());
            console.log('✅ Alunos via pei_teachers:', studentsList.length);
          }
        }
        
        studentsWithAccessIds = studentsList.map((s: any) => s.id);
        
        console.log('👥 Dashboard - Alunos atribuídos ao professor:', studentsList.length);
      } else {
        // Coordenadores e gestores veem todos os alunos da escola/tenant
        if (profile.school_id) {
          const { data: studentsData } = await supabase
            .from("students")
            .select("id, name, date_of_birth")
            .eq("school_id", profile.school_id);
          
          studentsList = studentsData || [];
          studentsWithAccessIds = studentsList.map((s: any) => s.id);
        }
      }
      
      setStudents(studentsList);
      
      // Guardar IDs dos alunos com acesso no state (para validação ao clicar)
      (window as any).__studentAccessIds = studentsWithAccessIds;

      // Load extended data
      const { data: reviewsData } = await supabase
        .from("pei_reviews")
        .select("id, pei_id, reviewer_role, review_date, next_review_date, notes");

      const { data: barriersData } = await supabase
        .from("pei_barriers")
        .select("id, pei_id, barrier_type, severity");

      const { data: goalsData } = await supabase
        .from("pei_goals")
        .select("id, pei_id, progress_level, progress_score");

      const { data: resourcesData } = await supabase
        .from("pei_accessibility_resources")
        .select("resource_type, usage_frequency");

      const { data: referralsData } = await supabase
        .from("pei_referrals")
        .select("referred_to, reason, date");

      // Process extended data
      const now = new Date();
      const upcomingReviews = reviewsData?.filter(r =>
        r.next_review_date && new Date(r.next_review_date) > now
      ) || [];
      const lateReviews = reviewsData?.filter(r =>
        r.next_review_date && new Date(r.next_review_date) < now
      ) || [];

      const barrierCountByType = barriersData?.reduce((acc: Record<string, number>, b) => {
        acc[b.barrier_type] = (acc[b.barrier_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const goalsInProgress = goalsData?.filter(g => g.progress_level === "em andamento").length || 0;
      const goalsPartial = goalsData?.filter(g => g.progress_level === "parcialmente alcançada").length || 0;
      const goalsAchieved = goalsData?.filter(g => g.progress_level === "alcançada").length || 0;
      const totalGoals = goalsData?.length || 0;
      const avgProgress = goalsData && goalsData.length > 0
        ? Math.round(goalsData.reduce((sum, g) => sum + (g.progress_score || 0), 0) / goalsData.length)
        : 0;

      const resourceUse = resourcesData?.reduce((acc: Record<string, number>, r) => {
        acc[r.resource_type] = (acc[r.resource_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const referralCountByType = referralsData?.reduce((acc: Record<string, number>, r) => {
        acc[r.referred_to] = (acc[r.referred_to] || 0) + 1;
        return acc;
      }, {}) || {};

      const stats: ExtendedStats = {
        totalReviews: reviewsData?.length || 0,
        upcomingReviews: upcomingReviews.length,
        lateReviews: lateReviews.length,
        totalBarriers: barriersData?.length || 0,
        barrierCountByType,
        goalsInProgress,
        goalsPartial,
        goalsAchieved,
        totalGoals,
        avgProgress,
        resourceUse,
        referralCountByType,
      };

      setExtendedStats(stats);
      buildTimeline(peisWithComments, reviewsData, referralsData, now);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (peisData: PEIWithComments[], reviewsData: any, referralsData: any, now: Date) => {
    const items: TimelineItem[] = [];

    peisData.forEach(pei => {
      const studentName = studentNames[pei.student_id] || pei.students?.name || "Aluno";

      if (pei.status === 'returned') {
        items.push({
          id: `returned-${pei.id}`,
          type: 'pending_action',
          title: 'PEI Retornado para Revisão',
          description: `${studentName} - Necessita ajustes`,
          date: parseISO(pei.updated_at),
          pei_id: pei.id,
          student_name: studentName,
          priority: 'high',
          icon: AlertTriangle,
          color: 'text-orange-600'
        });
      }

      if (pei.unread_comments && pei.unread_comments > 0) {
        const lastComment = pei.comments?.[0];
        items.push({
          id: `comment-${pei.id}`,
          type: 'comment',
          title: `${pei.unread_comments} novo${pei.unread_comments > 1 ? 's' : ''} comentário`,
          description: `${studentName} - ${lastComment?.profiles?.full_name || 'Colaborador'}`,
          date: lastComment ? parseISO(lastComment.created_at) : now,
          pei_id: pei.id,
          student_name: studentName,
          user_name: lastComment?.profiles?.full_name,
          priority: 'medium',
          icon: MessageSquare,
          color: 'text-blue-600'
        });
      }

      const daysSinceUpdate = differenceInDays(now, parseISO(pei.updated_at));
      if (daysSinceUpdate >= 75 && daysSinceUpdate < 90 && pei.status === 'approved') {
        items.push({
          id: `review-${pei.id}`,
          type: 'review_due',
          title: 'Revisão Programada',
          description: `${studentName} - Revisar em ${90 - daysSinceUpdate} dias`,
          date: addDays(parseISO(pei.updated_at), 90),
          pei_id: pei.id,
          student_name: studentName,
          priority: 'low',
          icon: Calendar,
          color: 'text-purple-600'
        });
      } else if (daysSinceUpdate >= 90 && pei.status === 'approved') {
        items.push({
          id: `review-late-${pei.id}`,
          type: 'review_due',
          title: 'Revisão Atrasada',
          description: `${studentName} - Revisar urgentemente`,
          date: addDays(parseISO(pei.updated_at), 90),
          pei_id: pei.id,
          student_name: studentName,
          priority: 'high',
          icon: AlertCircle,
          color: 'text-red-600'
        });
      }
    });

    reviewsData?.forEach((r: any) => {
      const pei = peisData.find(p => p.id === r.pei_id);
      if (!pei) return;

      const studentName = studentNames[pei.student_id] || pei.students?.name || "Aluno";
      const reviewDate = parseISO(r.review_date);
      const nextDate = r.next_review_date ? parseISO(r.next_review_date) : null;
      const overdue = nextDate && nextDate < now;

      items.push({
        id: `review-${r.id}`,
        type: 'review',
        title: `Revisão ${overdue ? 'Atrasada' : 'Realizada'}`,
        description: `${studentName} - ${r.reviewer_role}`,
        date: reviewDate,
        pei_id: r.pei_id,
        student_name: studentName,
        priority: overdue ? 'high' : 'low',
        icon: Calendar,
        color: overdue ? 'text-red-600' : 'text-green-600',
      });
    });

    referralsData?.forEach((ref: any) => {
      items.push({
        id: `referral-${ref.referred_to}-${Math.random()}`,
        type: 'referral',
        title: `Encaminhamento: ${ref.referred_to}`,
        description: ref.reason || "Encaminhamento realizado",
        date: parseISO(ref.date),
        priority: 'medium',
        icon: HeartPulse,
        color: 'text-purple-600',
      });
    });

    items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.date.getTime() - a.date.getTime();
    });

    setTimeline(items.slice(0, 10));
  };

  const handleDeleteClick = (pei: PEI) => {
    setPeiToDelete(pei);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!peiToDelete) return;

    try {
      const { error } = await supabase
        .from("peis")
        .delete()
        .eq("id", peiToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "PEI excluído com sucesso!",
      });

      loadData();
    } catch (error) {
      console.error("Erro ao excluir PEI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o PEI.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPeiToDelete(null);
    }
  };

  const handleViewClick = async (peiId: string) => {
    try {
      const { data, error } = await supabase
        .from("peis")
        .select("*, students(*)")
        .eq("id", peiId)
        .single();

      if (error) throw error;

      if (data) {
        setPeiToView(data);
        setViewDialogOpen(true);
        // Carregar comentários
        loadPEIComments(peiId);
      }
    } catch (error) {
      console.error("Erro ao carregar PEI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o PEI.",
        variant: "destructive",
      });
    }
  };

  const loadPEIComments = async (peiId: string) => {
    try {
      const { data, error } = await supabase
        .from("pei_comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (full_name)
        `)
        .eq("pei_id", peiId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPeiComments((data as any) || []);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !peiToView) return;

    try {
      setSendingComment(true);

      const { error } = await supabase.from("pei_comments").insert({
        pei_id: peiToView.id,
        student_id: peiToView.student_id,
        user_id: profile.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!",
      });

      setNewComment("");
      // Recarregar comentários
      loadPEIComments(peiToView.id);
      // Recarregar dados para atualizar contador de não lidos
      loadData();
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
    } finally {
      setSendingComment(false);
    }
  };

  const handleCreatePEIForStudent = async (studentId: string, studentName: string) => {
    try {
      // Verificar se o professor tem acesso a este aluno
      const { data: hasAccess } = await supabase
        .from("student_access")
        .select("id")
        .eq("user_id", profile.id)
        .eq("student_id", studentId)
        .maybeSingle();
      
      if (!hasAccess) {
        toast({
          title: "Aluno não atribuído",
          description: `Você não tem permissão para criar PEI para ${studentName}. Entre em contato com a coordenação para solicitar atribuição.`,
          variant: "destructive",
        });
        return;
      }
      
      // Se tem acesso, navegar para criar PEI
      navigate(`/pei/new?studentId=${studentId}`);
      
    } catch (error: any) {
      console.error("Erro ao verificar acesso:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar permissões.",
        variant: "destructive",
      });
    }
  };

  const getPEINumber = (pei: PEI) => {
    const studentPEIs = peis
      .filter(p => p.student_id === pei.student_id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const index = studentPEIs.findIndex(p => p.id === pei.id);
    return String(index + 1).padStart(2, '0');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      draft: { label: "Rascunho", color: "bg-gray-100 text-gray-700 border-gray-300" },
      pending_validation: { label: "Em Análise", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
      returned: { label: "Retornado", color: "bg-orange-100 text-orange-700 border-orange-300" },
      validated: { label: "Validado", color: "bg-blue-100 text-blue-700 border-blue-300" },
      pending_family: { label: "Aguardando Família", color: "bg-purple-100 text-purple-700 border-purple-300" },
      approved: { label: "Aprovado", color: "bg-green-100 text-green-700 border-green-300" },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant="outline" className={`${config.color} font-medium border-2`}>
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: peis.length,
    inProgress: peis.filter(p => p.status === "draft").length,
    pending: peis.filter(p => p.status === "pending" || p.status === "pending_validation" || p.status === "pending_family").length,
    completed: peis.filter(p => p.status === "validated" || p.status === "approved").length,
    returned: peis.filter(p => p.status === "returned").length,
    withComments: peis.filter(p => p.unread_comments && p.unread_comments > 0).length,
    students: students.length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const calculateScore = () => {
    const basePoints = stats.completed * 10;
    const totalPoints = stats.total * 10;
    const bonusPoints = stats.completed >= 5 ? 50 : 0;
    return { current: basePoints + bonusPoints, max: totalPoints + 100 };
  };

  const score = calculateScore();
  const scorePercentage = score.max > 0 ? Math.round((score.current / score.max) * 100) : 0;
  const stars = Math.min(5, Math.floor(scorePercentage / 20));

  const achievements = [
    {
      id: 'first_pei',
      title: 'Primeiro PEI',
      description: 'Criou seu primeiro PEI',
      earned: stats.total >= 1,
      icon: Award,
      color: 'text-blue-500'
    },
    {
      id: 'five_peis',
      title: 'Dedicado',
      description: '5 PEIs criados',
      earned: stats.total >= 5,
      icon: Target,
      color: 'text-purple-500'
    },
    {
      id: 'ten_approved',
      title: 'Mestre',
      description: '10 PEIs aprovados',
      earned: stats.completed >= 10,
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      id: 'perfect_rate',
      title: 'Perfeição',
      description: '100% de aprovação',
      earned: completionRate === 100 && stats.total >= 3,
      icon: Zap,
      color: 'text-orange-500'
    },
    {
      id: 'inclusive_practices',
      title: 'Prática Inclusiva',
      description: 'Usou 3+ recursos de acessibilidade',
      earned: extendedStats ? Object.keys(extendedStats.resourceUse).length >= 3 : false,
      icon: Accessibility,
      color: 'text-green-500'
    },
    {
      id: 'team_collaboration',
      title: 'Colaboração Multiprofissional',
      description: '3+ revisões com papéis diferentes',
      earned: extendedStats ? extendedStats.totalReviews >= 3 : false,
      icon: Users,
      color: 'text-blue-500'
    },
  ];

  const earnedAchievements = achievements.filter(a => a.earned);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 dark:from-primary/90 dark:via-primary/80 dark:to-purple-700 p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span className="text-sm font-medium text-white/90">Painel do Professor</span>
                </div>
                <div className="flex items-center gap-4">
                  <UserAvatar
                    emoji={profile.avatar_emoji}
                    color={profile.avatar_color}
                    fallbackName={profile.full_name}
                    size="lg"
                    className="border-4 border-white/30 shadow-2xl"
                  />
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">
                      Olá, {profile.full_name.split(' ')[0]}! 👋
                    </h1>
                  </div>
                </div>
                <p className="text-white/80 text-sm md:text-base max-w-2xl">
                  Gerencie seus PEIs de forma simples e acompanhe o progresso dos seus alunos
                </p>
              </div>

              <Button 
                onClick={() => {
                  if (students.length === 0) {
                    toast({
                      title: "Nenhum aluno atribuído",
                      description: "Você precisa ter alunos atribuídos pela coordenação para criar PEIs.",
                      variant: "destructive",
                    });
                    setActiveTab('alunos');
                  } else {
                    navigate("/pei/new");
                  }
                }}
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all h-14 px-8 text-base font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Novo PEI
                {students.length > 0 && (
                  <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">
                    {students.length} aluno{students.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          
          <div className="absolute right-0 bottom-0 opacity-10">
            <GraduationCap className="h-48 w-48" />
          </div>
        </div>

        {/* Alertas Urgentes */}
        {(stats.returned > 0 || stats.withComments > 0 || (extendedStats?.lateReviews || 0) > 0) && (
          <Card className="border-2 border-orange-400 dark:border-orange-600 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-xl text-orange-900">⚠️ Atenção Necessária</CardTitle>
                  <CardDescription className="text-orange-700">
                    Você tem {stats.returned + stats.withComments + (extendedStats?.lateReviews || 0)} ação(ões) pendente(s)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.returned > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-4 border-2 border-orange-300 bg-white hover:bg-orange-50 hover:border-orange-400 transition-all"
                  onClick={() => {
                    const firstReturned = peis.find(p => p.status === 'returned');
                    if (firstReturned) navigate(`/pei/edit?id=${firstReturned.id}`);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">{stats.returned} PEI{stats.returned > 1 ? 's' : ''} retornado{stats.returned > 1 ? 's' : ''}</div>
                      <div className="text-sm text-muted-foreground">Necessita revisão urgente</div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-orange-600" />
                </Button>
              )}
              
              {stats.withComments > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-4 border-2 border-blue-300 bg-white hover:bg-blue-50 hover:border-blue-400 transition-all"
                  onClick={() => {
                    const firstWithComments = peis.find(p => p.unread_comments && p.unread_comments > 0);
                    if (firstWithComments) navigate(`/pei/edit?id=${firstWithComments.id}`);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">{stats.withComments} novo{stats.withComments > 1 ? 's' : ''} comentário{stats.withComments > 1 ? 's' : ''}</div>
                      <div className="text-sm text-muted-foreground">Responda à equipe multidisciplinar</div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                </Button>
              )}
              
              {extendedStats && extendedStats.lateReviews > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-4 border-2 border-red-300 bg-white hover:bg-red-50 hover:border-red-400 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">{extendedStats.lateReviews} revisão{extendedStats.lateReviews > 1 ? 'ões' : ''} atrasada{extendedStats.lateReviews > 1 ? 's' : ''}</div>
                      <div className="text-sm text-muted-foreground">Agende uma revisão</div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-red-600" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informação: PEIs Aguardando Aprovação */}
        {stats.pending > 0 && (
          <Card className="border-2 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-xl text-purple-900 dark:text-purple-100">
                    📬 PEIs Encaminhados para Coordenação
                  </CardTitle>
                  <CardDescription className="text-purple-700 dark:text-purple-300">
                    {stats.pending} PEI{stats.pending > 1 ? 's' : ''} aguardando aprovação
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-4 border-2 border-purple-300 bg-white dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-400 transition-all"
                onClick={() => {
                  const firstPending = peis.find(p => p.status === 'pending');
                  if (firstPending) navigate(`/pei/edit?id=${firstPending.id}`);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-base">
                      {stats.pending} PEI{stats.pending > 1 ? 's' : ''} em análise
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Aguardando aprovação da coordenação
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cards de Estatísticas Principais */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card 
            className="border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900 cursor-pointer"
            onClick={() => setActiveTab('meus-peis')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600">{stats.total}</div>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1">📋 Total de PEIs</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{stats.completed} aprovados</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>{stats.inProgress} em progresso</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-blue-600 font-medium">
                <span>Ver meus PEIs</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-900 cursor-pointer"
            onClick={() => setActiveTab('alunos')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-purple-600">{stats.students}</div>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1">👨‍🎓 Meus Alunos</h3>
              <p className="text-sm text-muted-foreground">
                Alunos sob sua responsabilidade
              </p>
              <div className="mt-3 flex items-center gap-1 text-sm text-purple-600 font-medium">
                <span>Ver alunos</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-slate-900 cursor-pointer"
            onClick={() => setActiveTab('estatisticas')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-green-600">{completionRate}%</div>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">📈 Taxa de Sucesso</h3>
              <Progress value={completionRate} className="h-2.5 bg-green-100" />
              <div className="mt-3 flex items-center gap-1 text-sm text-green-600 font-medium">
                <span>Ver estatísticas</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conquistas */}
        {earnedAchievements.length > 0 && (
          <Card className="border-2 border-yellow-300 dark:border-yellow-600 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100">🏆 Conquistas Desbloqueadas</h3>
                  <p className="text-sm text-muted-foreground">Você conquistou {earnedAchievements.length} de {achievements.length} troféus!</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {earnedAchievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-yellow-300 dark:border-yellow-600 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                      title={achievement.description}
                    >
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 flex items-center justify-center ${achievement.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navegação por Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-full min-w-max lg:grid lg:grid-cols-5 h-auto gap-2 bg-transparent">
              <TabsTrigger 
                value="visao-geral" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white h-12 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap px-3 sm:px-4"
              >
                <BookOpen className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Visão Geral</span>
                <span className="sm:hidden">Visão</span>
              </TabsTrigger>
              <TabsTrigger 
                value="meus-peis" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white h-12 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap px-3 sm:px-4"
              >
                <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                PEIs
                {stats.total > 0 && (
                  <Badge className="ml-1 sm:ml-2 bg-white text-primary text-xs px-1.5">{stats.total}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="alunos" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white h-12 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap px-3 sm:px-4"
              >
                <Users className="h-4 w-4 mr-1 sm:mr-2" />
                Alunos
                {stats.students > 0 && (
                  <Badge className="ml-1 sm:ml-2 bg-white text-primary text-xs px-1.5">{stats.students}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="estatisticas" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white h-12 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap px-3 sm:px-4"
              >
                <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Estatísticas</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger 
                value="atividades" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white h-12 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap px-3 sm:px-4"
              >
                <History className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Atividades</span>
                <span className="sm:hidden">Ativ.</span>
                {timeline.length > 0 && (
                  <Badge className="ml-1 sm:ml-2 bg-white text-primary text-xs px-1.5">{timeline.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Visão Geral */}
          <TabsContent value="visao-geral" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Resumo de Status */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    📊 Resumo de Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <span className="font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Rascunhos
                    </span>
                    <Badge className="bg-gray-600 dark:bg-gray-500">{stats.inProgress}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <span className="font-medium flex items-center gap-2 text-yellow-900 dark:text-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      Em Análise
                    </span>
                    <Badge className="bg-yellow-600 dark:bg-yellow-500">{stats.pending}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <span className="font-medium flex items-center gap-2 text-orange-900 dark:text-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                      Retornados
                    </span>
                    <Badge className="bg-orange-600 dark:bg-orange-500">{stats.returned}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <span className="font-medium flex items-center gap-2 text-green-900 dark:text-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                      Aprovados
                    </span>
                    <Badge className="bg-green-600 dark:bg-green-500">{stats.completed}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Comentários Recentes */}
              {peis.some(p => p.comments && p.comments.length > 0) && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      💬 Comentários Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {peis
                      .filter(p => p.comments && p.comments.length > 0)
                      .slice(0, 3)
                      .map((pei) => {
                        const lastComment = pei.comments?.[0];
                        if (!lastComment) return null;

                        return (
                          <div
                            key={lastComment.id}
                            className="flex gap-3 p-3 rounded-lg border-2 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => navigate(`/pei/edit?id=${pei.id}`)}
                          >
                            <Avatar className="h-10 w-10 border-2 border-primary/20">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 dark:from-primary/40 dark:to-purple-500/40 text-primary dark:text-primary font-bold">
                                {lastComment.profiles?.full_name?.charAt(0).toUpperCase() || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm truncate">
                                  {lastComment.profiles?.full_name || 'Colaborador'}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(lastComment.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {lastComment.content}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab: Meus PEIs */}
          <TabsContent value="meus-peis" className="mt-6">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">📋 Meus PEIs</CardTitle>
                    <CardDescription className="mt-1">
                      {peis.length === 0 
                        ? "Comece criando PEIs para seus alunos atribuídos" 
                        : "Visualize, edite ou crie novos PEIs"}
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      if (students.length === 0) {
                        toast({
                          title: "Nenhum aluno atribuído",
                          description: "Você precisa ter alunos atribuídos pela coordenação para criar PEIs.",
                          variant: "destructive",
                        });
                        setActiveTab('alunos');
                      } else {
                        navigate("/pei/new");
                      }
                    }} 
                    size="lg"
                    disabled={students.length === 0}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Novo PEI
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {peis.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 dark:from-primary/40 dark:to-purple-500/40 flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-16 w-16 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Nenhum PEI criado ainda</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                      {students.length > 0 
                        ? "Comece criando seu primeiro Plano Educacional Individualizado para acompanhar o desenvolvimento dos seus alunos"
                        : "Você precisa ter alunos atribuídos pela coordenação antes de criar PEIs"
                      }
                    </p>
                    {students.length > 0 ? (
                      <Button onClick={() => navigate("/pei/new")} size="lg" className="h-14 px-8 text-base">
                        <Plus className="h-6 w-6 mr-2" />
                        Criar Meu Primeiro PEI
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => setActiveTab('alunos')} 
                        variant="outline"
                        size="lg" 
                        className="h-14 px-8 text-base"
                      >
                        <Users className="h-6 w-6 mr-2" />
                        Ver Meus Alunos
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {peis.map((pei) => {
                      const isUrgent = pei.status === 'returned';
                      const isPending = pei.status === 'pending';
                      const hasNotification = (pei.unread_comments || 0) > 0;
                      
                      return (
                        <div
                          key={pei.id}
                          className={`relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                            isUrgent 
                              ? 'border-orange-400/80 bg-orange-50 dark:bg-orange-950/20 hover:shadow-lg hover:border-orange-500' 
                              : isPending
                              ? 'border-purple-400/80 bg-purple-50 dark:bg-purple-950/20 hover:shadow-lg hover:border-purple-500'
                              : hasNotification
                              ? 'border-blue-300/80 bg-blue-50 dark:bg-blue-950/20 hover:shadow-lg hover:border-blue-400'
                              : 'border-border hover:shadow-lg hover:border-primary/60 hover:bg-accent/50'
                          }`}
                          onClick={() => navigate(`/pei/edit?id=${pei.id}`)}
                        >
                          {/* Avatar do Aluno */}
                          <div className="relative flex-shrink-0">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 dark:from-primary/50 dark:to-purple-500/50 flex items-center justify-center font-bold text-2xl text-primary dark:text-primary shadow-md">
                              {(studentNames[pei.student_id] || pei.students?.name || "A").charAt(0).toUpperCase()}
                            </div>
                            {hasNotification && (
                              <div className="absolute -top-2 -right-2 h-7 w-7 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                                <span className="text-xs text-white font-bold">{pei.unread_comments}</span>
                              </div>
                            )}
                          </div>

                          {/* Informações */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <p className="font-bold text-lg truncate">
                                {studentNames[pei.student_id] || pei.students?.name || "Aluno"}
                              </p>
                              {getStatusBadge(pei.status)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span className="font-medium">PEI #{getPEINumber(pei)}</span>
                              <span>•</span>
                              <span>{format(new Date(pei.updated_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                              {pei.comments && pei.comments.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-medium">
                                    <MessageSquare className="h-4 w-4" />
                                    {pei.comments.length} comentário{pei.comments.length > 1 ? 's' : ''}
                                  </span>
                                </>
                              )}
                            </div>

                            {isUrgent && (
                              <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400 bg-orange-200 dark:bg-orange-900/30 px-3 py-1.5 rounded-lg">
                                <AlertTriangle className="h-4 w-4" />
                                Necessita revisão urgente
                              </div>
                            )}
                            
                            {isPending && (
                              <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-400 bg-purple-200 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg">
                                <Clock className="h-4 w-4 animate-pulse" />
                                Encaminhado para coordenação - Aguardando aprovação
                              </div>
                            )}
                          </div>

                          {/* Ações */}
                          <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => handleViewClick(pei.id)}
                              title="Visualizar"
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                            <div onClick={(e) => e.stopPropagation()}>
                              <PEIVersionHistoryDialog
                                studentId={pei.student_id}
                                studentName={studentNames[pei.student_id] || pei.students?.name || "Aluno"}
                                currentPEIId={pei.id}
                                variant="icon"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => navigate(`/pei/edit?id=${pei.id}`)}
                              title="Editar"
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                            {pei.created_by === profile.id && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 hover:bg-destructive hover:text-white"
                                onClick={() => handleDeleteClick(pei)}
                                title="Excluir"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Alunos */}
          <TabsContent value="alunos" className="mt-6">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Users className="h-6 w-6" />
                      👨‍🎓 Meus Alunos
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {students.length > 0 
                        ? `${students.length} aluno${students.length > 1 ? 's' : ''} atribuído${students.length > 1 ? 's' : ''} à sua responsabilidade`
                        : "Alunos atribuídos pela coordenação aparecerão aqui"
                      }
                    </CardDescription>
                  </div>
                  {students.length > 0 && (
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {students.length} aluno{students.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-12 w-12 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Nenhum aluno atribuído</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Você ainda não tem alunos atribuídos à sua responsabilidade. 
                      Entre em contato com a coordenação para solicitar atribuição de alunos.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💡 <strong>Dica:</strong> A coordenação precisa atribuir alunos para você através do Dashboard de Coordenação.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Como criar um PEI?
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Clique em um aluno abaixo para criar um novo PEI ou continuar editando um existente. 
                            Você também pode usar o botão "Criar Novo PEI" no topo para escolher o aluno.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {students.map((student) => {
                        // Verificar se aluno já tem PEI
                        const studentPEI = peis.find(p => p.student_id === student.id);
                        const hasPEI = !!studentPEI;
                        const peiStatus = studentPEI?.status;
                        
                        return (
                          <div
                            key={student.id}
                            className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                              hasPEI 
                                ? 'border-primary/40 bg-primary/5 hover:border-primary hover:shadow-xl' 
                                : 'border-border hover:border-primary/60 hover:bg-accent/50 hover:shadow-lg'
                            }`}
                            onClick={() => hasPEI ? navigate(`/pei/edit?id=${studentPEI.id}`) : handleCreatePEIForStudent(student.id, student.name)}
                          >
                            {/* Header com Avatar e Nome */}
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 dark:from-primary/50 dark:to-purple-500/50 flex items-center justify-center font-bold text-xl text-primary dark:text-primary group-hover:scale-110 transition-transform flex-shrink-0 shadow-md">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-base truncate group-hover:text-primary transition-colors">
                                  {student.name}
                                </p>
                                {student.date_of_birth && (
                                  <p className="text-xs text-muted-foreground">
                                    {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()} anos
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Status do PEI */}
                            {hasPEI ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <span className="text-xs font-medium">PEI Ativo</span>
                                </div>
                                {getStatusBadge(peiStatus)}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs">Sem PEI</span>
                              </div>
                            )}
                            
                            {/* Botão de Ação */}
                            <Button 
                              variant={hasPEI ? "default" : "outline"}
                              size="sm" 
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                hasPEI ? navigate(`/pei/edit?id=${studentPEI.id}`) : handleCreatePEIForStudent(student.id, student.name);
                              }}
                            >
                              {hasPEI ? (
                                <>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar PEI
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Criar PEI
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Estatísticas */}
          <TabsContent value="estatisticas" className="mt-6 space-y-6">
            {extendedStats && (extendedStats.totalGoals > 0 || extendedStats.totalBarriers > 0) ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Progresso das Metas */}
                {extendedStats.totalGoals > 0 && (
                  <Card className="border-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-lg">🎯 Metas</h3>
                      </div>
                      <div className="text-4xl font-bold text-indigo-600 mb-3">
                        {extendedStats.avgProgress}%
                      </div>
                      <Progress value={extendedStats.avgProgress} className="h-3 mb-4 bg-indigo-100" />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center p-2 rounded bg-white/50">
                          <span className="text-muted-foreground">Alcançadas:</span>
                          <Badge className="bg-green-600">{extendedStats.goalsAchieved}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-white/50">
                          <span className="text-muted-foreground">Em andamento:</span>
                          <Badge className="bg-blue-600">{extendedStats.goalsInProgress}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-white/50">
                          <span className="text-muted-foreground">Total:</span>
                          <Badge variant="outline">{extendedStats.totalGoals}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Barreiras */}
                {extendedStats.totalBarriers > 0 && (
                  <Card className="border-2 bg-gradient-to-br from-pink-50 to-red-50 dark:from-pink-950/30 dark:to-red-950/30 hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-pink-600 flex items-center justify-center shadow-lg">
                          <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-lg">🚧 Barreiras</h3>
                      </div>
                      <div className="text-4xl font-bold text-pink-600 mb-4">
                        {extendedStats.totalBarriers}
                      </div>
                      <div className="space-y-2">
                        {Object.entries(extendedStats.barrierCountByType).slice(0, 4).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center p-2 rounded bg-white/50 text-sm">
                            <span className="text-muted-foreground truncate flex-1">{type}</span>
                            <Badge variant="secondary" className="ml-2">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recursos de Acessibilidade */}
                {Object.keys(extendedStats.resourceUse).length > 0 && (
                  <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-green-600 flex items-center justify-center shadow-lg">
                          <Accessibility className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-lg">♿ Recursos</h3>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(extendedStats.resourceUse).slice(0, 5).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center p-2 rounded bg-white/50 text-sm">
                            <span className="text-muted-foreground truncate flex-1">{type}</span>
                            <Badge variant="outline" className="ml-2">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Revisões */}
                {extendedStats.totalReviews > 0 && (
                  <Card className="border-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-lg">📅 Revisões</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 rounded-lg bg-white/50">
                          <div className="text-3xl font-bold text-blue-600">{extendedStats.upcomingReviews}</div>
                          <p className="text-xs text-muted-foreground mt-1">Próximas</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white/50">
                          <div className="text-3xl font-bold text-red-600">{extendedStats.lateReviews}</div>
                          <p className="text-xs text-muted-foreground mt-1">Atrasadas</p>
                        </div>
                      </div>
                      <p className="text-sm text-center text-muted-foreground">
                        Total: <strong>{extendedStats.totalReviews}</strong> revisões
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Encaminhamentos */}
                {Object.keys(extendedStats.referralCountByType).length > 0 && (
                  <Card className="border-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg">
                          <HeartPulse className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-lg">🏥 Encaminhamentos</h3>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(extendedStats.referralCountByType).slice(0, 5).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center p-2 rounded bg-white/50 text-sm">
                            <span className="text-muted-foreground truncate flex-1">{type}</span>
                            <Badge variant="outline" className="ml-2">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-2">
                <CardContent className="text-center py-16">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma estatística disponível</h3>
                  <p className="text-muted-foreground">
                    As estatísticas aparecerão aqui quando você adicionar metas, barreiras e recursos aos seus PEIs
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Atividades (Timeline) */}
          <TabsContent value="atividades" className="mt-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <History className="h-6 w-6" />
                  ⏰ Linha do Tempo
                </CardTitle>
                <CardDescription>
                  Acompanhe todas as atividades e eventos recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <div className="text-center py-16">
                    <History className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg">Nenhuma atividade recente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className={`relative flex gap-4 ${
                            item.pei_id 
                              ? 'cursor-pointer hover:bg-accent/50 p-4 rounded-xl transition-all' 
                              : 'p-4'
                          }`}
                          onClick={() => item.pei_id && navigate(`/pei/edit?id=${item.pei_id}`)}
                        >
                          {/* Linha conectora */}
                          {index < timeline.length - 1 && (
                            <div className="absolute left-[25px] top-[60px] w-0.5 h-[calc(100%-20px)] bg-gradient-to-b from-gray-300 to-transparent" />
                          )}

                          {/* Ícone */}
                          <div className={`relative z-10 h-12 w-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0 shadow-md ${
                            item.priority === 'high' ? 'border-red-500 bg-red-50' :
                            item.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                            'border-blue-500 bg-blue-50'
                          }`}>
                            <Icon className={`h-6 w-6 ${item.color}`} />
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-base">{item.title}</p>
                              {item.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs">Urgente</Badge>
                              )}
                              {item.priority === 'medium' && (
                                <Badge className="bg-yellow-500 text-xs">Importante</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {format(item.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>

                          {item.pei_id && (
                            <ArrowRight className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 self-center" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">⚠️ Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Tem certeza que deseja excluir o PEI de{" "}
                <strong className="text-foreground">
                  {peiToDelete ? (studentNames[peiToDelete.student_id] || peiToDelete.students?.name || "Aluno") : "Aluno"}
                </strong>
                ?<br/><br/>
                <span className="text-destructive font-semibold">Esta ação não pode ser desfeita.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-base">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-base"
              >
                Excluir Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Visualização Rápida */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Eye className="h-6 w-6" />
                Visualização do PEI
              </DialogTitle>
              <DialogDescription>
                Visualização completa com comentários
              </DialogDescription>
            </DialogHeader>
            {peiToView && (
              <div className="mt-4 space-y-6">
                <ReportView
                  studentData={peiToView.students}
                  diagnosisData={peiToView.diagnosis_data || {}}
                  planningData={peiToView.planning_data || {}}
                  referralsData={peiToView.evaluation_data || {}}
                  userRole={primaryRole}
                  tenantId={profile.tenant_id}
                  schoolId={profile.school_id}
                />

                <Separator />

                {/* Seção de Comentários */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comentários e Colaboração
                    </h3>
                    <Badge variant="secondary">{peiComments.length}</Badge>
                  </div>

                  {/* Adicionar Comentário */}
                  <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Adicionar Comentário</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        placeholder="Compartilhe suas observações, sugestões ou dúvidas sobre este PEI..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        disabled={sendingComment}
                        className="resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || sendingComment}
                          size="sm"
                        >
                          {sendingComment ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Enviar Comentário
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Comentários */}
                  {peiComments.length > 0 ? (
                    <div className="space-y-3">
                      {peiComments.map((comment: any) => (
                        <Card key={comment.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {comment.profiles?.full_name?.substring(0, 2).toUpperCase() || comment.user_id ? 'US' : 'FM'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {comment.profiles?.full_name || (comment.user_id ? 'Usuário' : 'Família')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap pl-10">{comment.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Ainda não há comentários. Seja o primeiro a comentar!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setViewDialogOpen(false);
                    setNewComment("");
                    setPeiComments([]);
                  }}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setViewDialogOpen(false);
                    setNewComment("");
                    setPeiComments([]);
                    navigate(`/pei/edit?id=${peiToView.id}`);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar PEI
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Citação de Inclusão */}
        <InclusionQuote />
      </div>
    </div>
  );
};

export default TeacherDashboard;