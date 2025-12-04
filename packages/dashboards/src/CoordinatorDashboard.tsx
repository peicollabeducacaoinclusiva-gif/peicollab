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
  BookOpen,
  Users,
  ClipboardList,
  TrendingUp,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Profile } from "./types";

interface CoordinatorDashboardProps {
  profile: Profile;
}

interface PedagogicalStats {
  totalClasses: number;
  totalSubjects: number;
  totalStudents: number;
  totalTeachers: number;
  studentsWithPEI: number;
}

export function CoordinatorDashboard({ profile }: CoordinatorDashboardProps) {
  const [stats, setStats] = useState<PedagogicalStats>({
    totalClasses: 0,
    totalSubjects: 0,
    totalStudents: 0,
    totalTeachers: 0,
    studentsWithPEI: 0,
  });
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadPedagogicalStats();
  }, [profile.school_id]);

  const loadPedagogicalStats = async () => {
    if (!profile.school_id) {
      setLoading(false);
      return;
    }

    try {
      const [classesRes, subjectsRes, studentsRes, teachersRes, peisRes] = await Promise.all([
        supabase
          .from("classes")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id),
        supabase
          .from("subjects")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id),
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id),
        supabase
          .from("professionals")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id),
        supabase
          .from("peis")
          .select("id", { count: "exact", head: true })
          .eq("school_id", profile.school_id)
          .eq("status", "approved"),
      ]);

      setStats({
        totalClasses: classesRes.count || 0,
        totalSubjects: subjectsRes.count || 0,
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        studentsWithPEI: peisRes.count || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas pedagógicas:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Dashboard do Coordenador
        </h2>
        <p className="text-muted-foreground">
          Gestão pedagógica da {profile.school?.school_name || "escola"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Turmas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">
              Disciplinas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.studentsWithPEI} com PEI
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
              Corpo docente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Turmas e Disciplinas</CardTitle>
            <CardDescription>
              Organize a estrutura pedagógica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/classes">
                <BookOpen className="mr-2 h-4 w-4" />
                Gerenciar Turmas
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/subjects">
                <ClipboardList className="mr-2 h-4 w-4" />
                Gerenciar Disciplinas
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professores</CardTitle>
            <CardDescription>
              Gerencie o corpo docente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/professionals">
                <GraduationCap className="mr-2 h-4 w-4" />
                Ver Professores
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/students">
                <Users className="mr-2 h-4 w-4" />
                Ver Alunos
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PEI Collab</CardTitle>
            <CardDescription>
              Acompanhamento pedagógico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="http://localhost:5173/peis">
                <FileText className="mr-2 h-4 w-4" />
                Acompanhar PEIs
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="http://localhost:5173/dashboard">
                <TrendingUp className="mr-2 h-4 w-4" />
                Dashboard PEI
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pedagogical Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acompanhamento PEI</CardTitle>
            <CardDescription>
              Alunos com necessidades educacionais especiais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cobertura</span>
                <span className="text-sm text-muted-foreground">
                  {stats.totalStudents > 0
                    ? Math.round((stats.studentsWithPEI / stats.totalStudents) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: `${
                      stats.totalStudents > 0
                        ? (stats.studentsWithPEI / stats.totalStudents) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.studentsWithPEI} de {stats.totalStudents} alunos com PEI aprovado
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estrutura Pedagógica</CardTitle>
            <CardDescription>
              Organização da escola
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Média de alunos por turma</span>
                <span className="text-sm font-bold">
                  {stats.totalClasses > 0
                    ? Math.round(stats.totalStudents / stats.totalClasses)
                    : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Média de turmas por professor</span>
                <span className="text-sm font-bold">
                  {stats.totalTeachers > 0
                    ? (stats.totalClasses / stats.totalTeachers).toFixed(1)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

