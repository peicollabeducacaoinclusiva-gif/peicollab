// src/components/dashboards/TeacherDashboard.tsx
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Plus, Clock, CheckCircle2, Edit, Trash2, Users,
  TrendingUp, AlertCircle, BookOpen, GraduationCap, Sparkles, Star,
  Award, Zap, Target, Calendar, MessageSquare, Bell, AlertTriangle,
  CheckCircle, ArrowRight, History, Accessibility,
  Ambulance, BarChart3
} from "lucide-react";
import InclusionQuote from "@/components/shared/InclusionQuote";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format, differenceInDays, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TeacherDashboardProps {
  profile: {
    id: string;
    full_name: string;
    role: string;
    tenant_id: string | null;
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
}

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
}

interface Comment {
  id: string;
  pei_id: string;
  user_id: string;
  content: string;
  created_at: string;
  student_id: string;
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
  const [peis, setPeis] = useState<PEIWithComments[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [peiToDelete, setPeiToDelete] = useState<PEI | null>(null);

  useEffect(() => {
    loadData();
  }, [profile.id]);

  const loadData = async () => {
    try {
      // Load PEIs
      const { data: peisData, error: peisError } = await supabase
        .from("peis")
        .select(`
          id, status, created_at, updated_at, created_by, assigned_teacher_id,
          student_id, students (name)
        `)
        .or(`assigned_teacher_id.eq.${profile.id},created_by.eq.${profile.id}`)
        .order("updated_at", { ascending: false });

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
          comments: commentsData as Comment[],
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
      const { data: studentsAccessData } = await supabase
        .from("student_access")
        .select(`student_id, students (id, name, date_of_birth)`)
        .eq("user_id", profile.id);

      const studentsList = studentsAccessData
        ?.map((item: any) => item.students)
        .filter(Boolean) || [];
      setStudents(studentsList);

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
        icon: Ambulance,
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

  const getPEINumber = (pei: PEI) => {
    const studentPEIs = peis
      .filter(p => p.student_id === pei.student_id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const index = studentPEIs.findIndex(p => p.id === pei.id);
    return String(index + 1).padStart(2, '0');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, any> = {
      draft: { label: "Rascunho", color: "bg-gray-500/10 text-gray-700 border-gray-200" },
      pending_validation: { label: "Em Análise", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
      returned: { label: "Retornado", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
      validated: { label: "Validado", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
      pending_family: { label: "Aguardando Família", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
      approved: { label: "Aprovado", color: "bg-green-500/10 text-green-700 border-green-200" },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant="outline" className={`${config.color} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
    const config = {
      high: { label: "Urgente", color: "bg-red-100 text-red-700 border-red-200" },
      medium: { label: "Importante", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      low: { label: "Baixa", color: "bg-blue-100 text-blue-700 border-blue-200" },
    };
    return (
      <Badge variant="outline" className={`${config[priority].color} text-xs`}>
        {config[priority].label}
      </Badge>
    );
  };

  const stats = {
    total: peis.length,
    inProgress: peis.filter(p => p.status === "draft").length,
    pending: peis.filter(p => p.status === "pending_validation" || p.status === "pending_family").length,
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
      description: 'Usou 3 ou mais recursos de acessibilidade',
      earned: extendedStats ? Object.keys(extendedStats.resourceUse).length >= 3 : false,
      icon: Accessibility,
      color: 'text-green-500'
    },
    {
      id: 'team_collaboration',
      title: 'Colaboração Multiprofissional',
      description: '3 ou mais revisões com papéis diferentes',
      earned: extendedStats ? extendedStats.totalReviews >= 3 : false,
      icon: Users,
      color: 'text-blue-500'
    },
  ];

  const earnedAchievements = achievements.filter(a => a.earned);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/5 p-8 border border-primary/20">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4 flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Bem-vindo de volta!</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Olá, {profile.full_name}!</h1>
              <p className="text-muted-foreground max-w-2xl">
                Colabore, revise e acompanhe o desenvolvimento dos seus PEIs em tempo real.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-primary/20 shadow-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < stars
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                        } transition-all duration-300`}
                    />
                  ))}
                </div>
                <div className="text-2xl font-bold text-primary">{score.current}</div>
                <div className="text-xs text-muted-foreground">pontos</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <GraduationCap className="h-full w-full text-primary" />
        </div>
      </div>
      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>Comece agora mesmo!</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={() => navigate("/pei/new")}
            className="h-auto py-4 justify-start gap-3"
            variant="default"
          >
            <Plus className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Novo PEI</div>
              <div className="text-xs opacity-80">Criar plano educacional</div>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/peis")}
            className="h-auto py-4 justify-start gap-3"
            variant="outline"
          >
            <FileText className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Ver Todos os PEIs</div>
              <div className="text-xs opacity-80">Acessar lista completa</div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Alerts */}
      {(stats.returned > 0 || stats.withComments > 0 || (extendedStats?.lateReviews || 0) > 0) && (
        <Card className="border-2 border-orange-500/20 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Bell className="h-5 w-5 animate-pulse" />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.returned > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span><strong>{stats.returned}</strong> PEI{stats.returned > 1 ? 's' : ''} retornado{stats.returned > 1 ? 's' : ''}</span>
              </div>
            )}
            {stats.withComments > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span><strong>{stats.withComments}</strong> PEI{stats.withComments > 1 ? 's' : ''} com novos comentários</span>
              </div>
            )}
            {extendedStats && extendedStats.lateReviews > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span><strong>{extendedStats.lateReviews}</strong> revisão{extendedStats.lateReviews > 1 ? 's' : ''} atrasada{extendedStats.lateReviews > 1 ? 's' : ''}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {earnedAchievements.length > 0 && (
        <Card className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Conquistas Desbloqueadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {earnedAchievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-yellow-200/50 hover:shadow-md transition-all"
                  >
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center ${achievement.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de PEIs</CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Todos os seus planos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">{completionRate}% de conclusão</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Necessitam Ação</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.returned + stats.withComments}</div>
            <p className="text-xs text-muted-foreground mt-1">PEIs retornados ou com comentários</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboração</CardTitle>
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.withComments}</div>
            <p className="text-xs text-muted-foreground mt-1">Com novos comentários</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Extended Stats - Metas, Barreiras, Recursos */}
      {extendedStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progresso Médio das Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{extendedStats.avgProgress}%</div>
              <Progress value={extendedStats.avgProgress} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-3">
                <strong>{extendedStats.goalsAchieved}</strong> alcançadas
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>{extendedStats.goalsPartial}</strong> parciais,
                <strong className="ml-1">{extendedStats.goalsInProgress}</strong> em andamento
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Total: <strong>{extendedStats.totalGoals}</strong> metas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-pink-500 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Barreiras Identificadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">{extendedStats.totalBarriers}</div>
              <div className="mt-3 space-y-2">
                {Object.entries(extendedStats.barrierCountByType).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground truncate">{type}:</span>
                    <Badge variant="secondary" className="ml-2">{count}</Badge>
                  </div>
                ))}
                {Object.keys(extendedStats.barrierCountByType).length > 3 && (
                  <p className="text-xs text-muted-foreground italic">
                    +{Object.keys(extendedStats.barrierCountByType).length - 3} outros
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                Recursos de Acessibilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(extendedStats.resourceUse).length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum recurso registrado</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(extendedStats.resourceUse).slice(0, 3).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground truncate">{type}:</span>
                      <Badge variant="outline" className="ml-2">{count}</Badge>
                    </div>
                  ))}
                  {Object.keys(extendedStats.resourceUse).length > 3 && (
                    <p className="text-xs text-muted-foreground italic">
                      +{Object.keys(extendedStats.resourceUse).length - 3} outros
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Revisões Programadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{extendedStats.upcomingReviews}</div>
                  <p className="text-xs text-muted-foreground mt-1">Próximas</p>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{extendedStats.lateReviews}</div>
                  <p className="text-xs text-muted-foreground mt-1">Atrasadas</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Total: <strong>{extendedStats.totalReviews}</strong>
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ambulance className="h-4 w-4" />
                Encaminhamentos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(extendedStats.referralCountByType).length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum encaminhamento</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(extendedStats.referralCountByType).slice(0, 3).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground truncate">{type}:</span>
                      <Badge variant="outline" className="ml-2">{count}</Badge>
                    </div>
                  ))}
                  {Object.keys(extendedStats.referralCountByType).length > 3 && (
                    <p className="text-xs text-muted-foreground italic">
                      +{Object.keys(extendedStats.referralCountByType).length - 3} outros
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metas totais:</span>
                  <strong>{extendedStats.totalGoals}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de êxito:</span>
                  <strong>{extendedStats.avgProgress}%</strong>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barreiras:</span>
                  <strong>{extendedStats.totalBarriers}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revisões ativas:</span>
                  <strong>{extendedStats.totalReviews}</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-col md:flex-row gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Linha do Tempo
                </CardTitle>
                <CardDescription className="mt-1">
                  Acompanhe ações, revisões programadas e encaminhamentos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full bg-white border-2 flex items-center justify-center ${item.priority === 'high' ? 'border-red-500' :
                          item.priority === 'medium' ? 'border-yellow-500' :
                            'border-blue-500'
                        }`}>
                        <Icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gradient-to-b from-gray-300 to-transparent mt-2" />
                      )}
                    </div>
                    <div
                      className="flex-1 pb-4 cursor-pointer hover:bg-accent/50 p-3 rounded-lg transition-all group"
                      onClick={() => item.pei_id && navigate(`/pei/edit?id=${item.pei_id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium group-hover:text-primary transition-colors">
                              {item.title}
                            </p>
                            {getPriorityBadge(item.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(item.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        {item.pei_id && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      {stats.total > 0 && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-col md:flex-row gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Progresso Geral
                </CardTitle>
                <CardDescription className="mt-1">
                  Acompanhe o status de todos os seus PEIs
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{completionRate}%</div>
                <div className="text-xs text-muted-foreground">Concluído</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={completionRate} className="h-3" />
            <div className="grid grid-cols-4 gap-4 text-center pt-2">
              <div>
                <div className="text-2xl font-bold text-gray-600">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground">Rascunhos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Em Análise</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.returned}</div>
                <div className="text-xs text-muted-foreground">Retornados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Aprovados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Recent PEIs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-col md:flex-row gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                PEIs Recentes
              </CardTitle>
              <CardDescription className="mt-1">
                Com informações de colaboração em tempo real
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {peis.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                Você ainda não tem nenhum PEI cadastrado
              </p>
              <Button onClick={() => navigate("/pei/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro PEI
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {peis.slice(0, 5).map((pei) => (
                <div
                  key={pei.id}
                  className={`flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer group ${pei.status === 'returned' ? 'bg-orange-50/50 border-orange-200' :
                      pei.unread_comments && pei.unread_comments > 0 ? 'bg-blue-50/50 border-blue-200' :
                        'hover:bg-accent/50'
                    }`}
                  onClick={() => navigate(`/pei/edit?id=${pei.id}`)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      {pei.unread_comments && pei.unread_comments > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{pei.unread_comments}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium group-hover:text-primary transition-colors truncate">
                          {studentNames[pei.student_id] || pei.students?.name || "Aluno"}
                        </p>
                        {getStatusBadge(pei.status)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span className="truncate">PEI #{getPEINumber(pei)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{format(new Date(pei.updated_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        {pei.comments && pei.comments.length > 0 && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {pei.comments.length}
                            </span>
                          </>
                        )}
                      </div>
                      {pei.status === 'returned' && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-md w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          Revisão urgente
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/pei/edit?id=${pei.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {pei.created_by === profile.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(pei)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Summary */}
      {peis.some(p => p.comments && p.comments.length > 0) && (
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Colaboração Recente
            </CardTitle>
            <CardDescription>Últimos comentários da equipe multidisciplinar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peis
                .filter(p => p.comments && p.comments.length > 0)
                .slice(0, 3)
                .map((pei) => {
                  const lastComment = pei.comments?.[0];
                  if (!lastComment) return null;

                  return (
                    <div
                      key={lastComment.id}
                      className="flex gap-3 p-3 rounded-lg border bg-white/60 hover:bg-white/80 transition-all cursor-pointer"
                      onClick={() => navigate(`/pei/edit?id=${pei.id}`)}
                    >
                      <Avatar className="h-10 w-10 border-2 border-primary/20 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
                          {lastComment.profiles?.full_name?.charAt(0).toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm truncate">
                            {lastComment.profiles?.full_name || 'Colaborador'}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(lastComment.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lastComment.content}
                        </p>
                        <p className="text-xs text-primary mt-1 font-medium">
                          {studentNames[pei.student_id] || pei.students?.name || "Aluno"}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-col md:flex-row gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Meus Alunos
                </CardTitle>
                <CardDescription className="mt-1">
                  Alunos sob sua responsabilidade
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {students.slice(0, 6).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 hover:shadow transition-all cursor-pointer group"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {student.name}
                    </p>
                    {student.date_of_birth && (
                      <p className="text-xs text-muted-foreground">
                        {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()} anos
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o PEI de{" "}
              <strong>
                {peiToDelete ? (studentNames[peiToDelete.student_id] || peiToDelete.students?.name || "Aluno") : "Aluno"}
              </strong>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <InclusionQuote />

    </div>
  );
};

export default TeacherDashboard;
