import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  BarChart3,
  UserPlus,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CreateStudentDialog from '@/components/superadmin/CreateStudentDialog';
import CSVUploadDialog from '@/components/superadmin/CSVUploadDialog';
import ClassTeachersSelector from '@/components/coordinator/ClassTeachersSelector';
import UserAvatar from '@/components/shared/UserAvatar';

interface SchoolStats {
  totalTeachers: number;
  totalStudents: number;
  totalPEIs: number;
  peisCompleted: number;
  peisPending: number;
  peisApproved: number;
  averageCreationTime: number;
  teachersWithPEIs: number;
}

interface TeacherData {
  id: string;
  name: string;
  email: string;
  role: string;
  totalPEIs: number;
  completedPEIs: number;
  pendingPEIs: number;
  lastActivity: string;
  performance: 'excellent' | 'good' | 'needs_improvement';
}

interface StudentData {
  id: string;
  name: string;
  grade: string;
  hasPEI: boolean;
  peiStatus?: string;
  teacherName?: string;
  lastUpdate: string;
}

interface Profile {
  full_name: string;
  avatar_emoji?: string;
  avatar_color?: string;
}

export function SchoolDirectorDashboard() {
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const loadSchoolStats = async () => {
    try {
      // Buscar dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Buscar school_id e avatar do profile
      let profileData = null;
      
      try {
        const result = await supabase
          .from('profiles')
          .select('school_id, full_name, avatar_emoji, avatar_color')
          .eq('id', user.id)
          .maybeSingle();
        
        profileData = result.data;
        
        if (result.error) {
          console.warn("⚠️ Erro ao buscar com avatar, tentando sem...", result.error);
          
          // Fallback: buscar sem avatar
          const fallback = await supabase
            .from('profiles')
            .select('school_id, full_name')
            .eq('id', user.id)
            .maybeSingle();
          
          profileData = fallback.data;
        }
      } catch (error) {
        console.error("Erro ao carregar profile:", error);
      }
        
      const userSchoolId = profileData?.school_id;
      if (profileData) {
        setProfile({
          full_name: profileData.full_name || 'Usuário',
          avatar_emoji: profileData.avatar_emoji || undefined,
          avatar_color: profileData.avatar_color || undefined
        });
      }
      if (!userSchoolId) return;
      
      setSchoolId(userSchoolId);

      // Buscar estatísticas da escola
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select(`
          id,
          school_name,
          profiles:profiles(count),
          students:students(count),
          peis:peis(count)
        `)
        .eq('id', userSchoolId)
        .single();

      if (schoolError) throw schoolError;

      // Buscar professores
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          user_roles!inner(role)
        `)
        .eq('school_id', userSchoolId)
        .in('user_roles.role', ['teacher', 'aee_teacher']);

      if (teachersError) throw teachersError;

      // Buscar alunos
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          school_id,
          tenant_id,
          created_at
        `)
        .eq('school_id', userSchoolId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (studentsError) throw studentsError;

      // Processar dados
      const processedStats: SchoolStats = {
        totalTeachers: teachersData?.length || 0,
        totalStudents: schoolData?.students?.[0]?.count || 0,
        totalPEIs: schoolData?.peis?.[0]?.count || 0,
        peisCompleted: 0, // TODO: Calcular baseado em status
        peisPending: 0,
        peisApproved: 0,
        averageCreationTime: 0, // TODO: Calcular baseado em dados históricos
        teachersWithPEIs: 0
      };

      const processedTeachers: TeacherData[] = teachersData?.map(teacher => ({
        id: teacher.id,
        name: teacher.full_name,
        email: teacher.email,
        role: teacher.user_roles?.[0]?.role || 'teacher',
        totalPEIs: 0, // TODO: Calcular baseado em PEIs
        completedPEIs: 0,
        pendingPEIs: 0,
        lastActivity: new Date().toISOString(),
        performance: 'good' as const
      })) || [];

      const processedStudents: StudentData[] = studentsData?.map(student => ({
        id: student.id,
        name: student.name,
        grade: 'N/A', // TODO: Adicionar campo de série
        hasPEI: false, // TODO: Buscar PEIs separadamente se necessário
        peiStatus: undefined,
        teacherName: undefined,
        lastUpdate: student.created_at || new Date().toISOString()
      })) || [];

      setStats(processedStats);
      setTeachers(processedTeachers);
      setStudents(processedStudents);
    } catch (error) {
      console.error('Erro ao carregar estatísticas da escola:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSchoolStats();
    setRefreshing(false);
  };

  const loadTenants = async () => {
    try {
      // Buscar dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Buscar school_id do profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, tenant_id')
        .eq('id', user.id)
        .single();
        
      const userSchoolId = profile?.school_id;
      const tenantId = profile?.tenant_id;
      
      if (!userSchoolId && !tenantId) return;

      // Buscar tenants (redes) que o usuário pode acessar
      let query = supabase.from('tenants').select('id, network_name');
      
      if (tenantId) {
        // Se tem tenant_id, buscar apenas esse tenant
        query = query.eq('id', tenantId);
      }
      
      const { data: tenantsData, error: tenantsError } = await query;
      
      if (tenantsError) throw tenantsError;
      
      setTenants(tenantsData || []);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
    }
  };

  const handleStudentCreated = () => {
    // Recarregar dados após criar aluno
    loadSchoolStats();
  };

  useEffect(() => {
    loadSchoolStats();
    loadTenants();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados da escola...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {profile && (
            <UserAvatar
              emoji={profile.avatar_emoji}
              color={profile.avatar_color}
              fallbackName={profile.full_name}
              size="lg"
              className="shadow-lg"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">
              {profile ? `Olá, ${profile.full_name.split(' ')[0]}!` : 'Dashboard Escolar'}
            </h1>
            <p className="text-muted-foreground">
              Gestão operacional da unidade escolar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {schoolId && (
            <ClassTeachersSelector
              schoolId={schoolId}
              onTeachersUpdated={handleRefresh}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="students">Alunos</TabsTrigger>
          <TabsTrigger value="teachers">Professores</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Equipe pedagógica
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total de estudantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PEIs Ativos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPEIs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Planos em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalPEIs ? Math.round((stats.peisApproved / stats.totalPEIs) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status dos PEIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.peisApproved || 0}
            </div>
            <Progress 
              value={stats?.totalPEIs ? (stats.peisApproved / stats.totalPEIs) * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.peisPending || 0}
            </div>
            <Progress 
              value={stats?.totalPEIs ? (stats.peisPending / stats.totalPEIs) * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {teachers.filter(t => t.performance === 'needs_improvement').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Professores que precisam de suporte
            </p>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        {/* Aba Alunos */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gestão de Alunos</h2>
              <p className="text-muted-foreground">
                Cadastre e gerencie os alunos da escola
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CreateStudentDialog 
                tenants={tenants} 
                onStudentCreated={handleStudentCreated}
                schoolId={schoolId || undefined}
              />
              <CSVUploadDialog 
                schoolId={schoolId || undefined}
                onStudentsCreated={handleStudentCreated}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar Lista
              </Button>
            </div>
          </div>

          {/* Lista de Alunos */}
          <Card>
            <CardHeader>
              <CardTitle>Alunos Cadastrados</CardTitle>
              <CardDescription>
                {students.length} alunos na escola
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum aluno cadastrado ainda</p>
                  <p className="text-sm">Use os botões acima para cadastrar alunos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.slice(0, 10).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.grade} • Cadastrado em {new Date(student.lastUpdate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Sem PEI
                        </Badge>
                        <Button variant="outline" size="sm" disabled>
                          Ver PEI
                        </Button>
                      </div>
                    </div>
                  ))}
                  {students.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground">
                      ... e mais {students.length - 10} alunos
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Professores */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipe Pedagógica</CardTitle>
              <CardDescription>
                Gestão de professores e suas atividades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{teacher.name}</h3>
                        <Badge variant="outline">{teacher.role}</Badge>
                        <Badge 
                          variant={
                            teacher.performance === 'excellent' ? 'default' :
                            teacher.performance === 'good' ? 'secondary' : 'destructive'
                          }
                        >
                          {teacher.performance === 'excellent' ? 'Excelente' :
                           teacher.performance === 'good' ? 'Bom' : 'Precisa melhorar'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{teacher.totalPEIs} PEIs</span>
                        <span>{teacher.completedPEIs} concluídos</span>
                        <span>{teacher.pendingPEIs} pendentes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance</CardTitle>
              <CardDescription>
                Métricas de qualidade e eficiência da escola
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Gráficos de performance serão implementados aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SchoolDirectorDashboard;
