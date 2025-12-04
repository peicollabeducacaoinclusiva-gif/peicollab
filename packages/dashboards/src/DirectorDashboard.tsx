import { useEffect, useState } from "react";
import { supabase } from "@pei/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@pei/ui";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  FileText,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Profile } from "./types";

interface DirectorDashboardProps {
  profile: Profile;
}

interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalStudentsWithPEI: number;
  activeUsers: number;
}

export function DirectorDashboard({ profile }: DirectorDashboardProps) {
  const [stats, setStats] = useState<SchoolStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalStudentsWithPEI: 0,
    activeUsers: 0,
  });
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadSchoolStats();
  }, [profile.school_id]);

  const loadSchoolStats = async () => {
    if (!profile.school_id) {
      setLoading(false);
      return;
    }

    try {
      const [studentsRes, teachersRes, classesRes, peisRes, usersRes] = await Promise.all([
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id),
        supabase
          .from("professionals")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id),
        supabase
          .from("classes")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id),
        supabase
          .from("peis")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id)
          .eq("is_active", true),
      ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalClasses: classesRes.count || 0,
        totalStudentsWithPEI: peisRes.count || 0,
        activeUsers: usersRes.count || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas da escola:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Dashboard do Diretor
        </h2>
        <p className="text-muted-foreground">
          Visão geral da {profile.school?.school_name || "escola"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStudentsWithPEI} com PEI ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professores</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Profissionais ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Turmas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Acessos habilitados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gestão Escolar</CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades de gestão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/students">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Alunos
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/professionals">
                <GraduationCap className="mr-2 h-4 w-4" />
                Gerenciar Professores
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/classes">
                <BookOpen className="mr-2 h-4 w-4" />
                Gerenciar Turmas
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PEI Collab</CardTitle>
            <CardDescription>
              Acompanhe os Planos Educacionais Individualizados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="http://localhost:5173/peis">
                <FileText className="mr-2 h-4 w-4" />
                Ver Todos os PEIs
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="http://localhost:5173/dashboard">
                <TrendingUp className="mr-2 h-4 w-4" />
                Dashboard PEI Collab
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cobertura de PEI</CardTitle>
          <CardDescription>
            Percentual de alunos com Plano Educacional Individualizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">
                {stats.totalStudents > 0
                  ? Math.round((stats.totalStudentsWithPEI / stats.totalStudents) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${
                    stats.totalStudents > 0
                      ? (stats.totalStudentsWithPEI / stats.totalStudents) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStudentsWithPEI} de {stats.totalStudents} alunos com PEI ativo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

