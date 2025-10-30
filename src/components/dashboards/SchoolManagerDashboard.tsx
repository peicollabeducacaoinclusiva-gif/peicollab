// src/components/dashboards/SchoolManagerDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Button
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Input
} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, FileText, Upload, PlusCircle, Activity, Download } from "lucide-react";
import StudentsTable from "@/components/superadmin/StudentsTable";
import SimplePEIsTable from "@/components/superadmin/SimplePEIsTable";
import UsersTable from "@/components/superadmin/UsersTable";
import { SimpleAuditLogsViewer } from "@/components/shared/SimpleAuditLogsViewer";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface SchoolManagerDashboardProps {
  profile: {
    id: string;
    full_name: string;
    role: string;
    school_id: string | null;
  };
}

const SchoolManagerDashboard = ({ profile }: SchoolManagerDashboardProps) => {
  const [activeTenant, setActiveTenant] = useState<string | null>(profile.school_id);
  const [tenants, setTenants] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [peis, setPeis] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (activeTenant) {
      loadData();
    }
  }, [activeTenant]);

  const loadTenants = async () => {
    const { data, error } = await supabase
      .from("user_tenants")
      .select("school_id, schools(name)")
      .eq("user_id", profile.id);

    if (error) {
      console.error(error);
      return;
    }

    const tenantList = data?.map((t: any) => ({
      id: t.school_id,
      name: t.schools?.name || "Escola",
    })) || [];

    setTenants(tenantList);

    if (!activeTenant && tenantList.length > 0) {
      setActiveTenant(tenantList[0].id);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [{ data: studentsData, error: studentsError }, { data: peisData, error: peisError }, { data: usersData, error: usersError }] =
        await Promise.all([
          supabase.from("students").select("*").eq("school_id", activeTenant).order("name"),
          supabase.from("peis").select(`
            *,
            students(name, date_of_birth)
          `).eq("school_id", activeTenant).order("created_at", { ascending: false }),
          supabase.from("profiles").select("*, schools(name)").eq("school_id", activeTenant),
        ]);

      if (studentsError) {
        console.error("Erro ao carregar alunos:", studentsError);
        toast({
          title: "Erro",
          description: `Falha ao carregar alunos: ${studentsError.message}`,
          variant: "destructive",
        });
      }

      if (peisError) {
        console.error("Erro ao carregar PEIs:", peisError);
        toast({
          title: "Erro",
          description: `Falha ao carregar PEIs: ${peisError.message}`,
          variant: "destructive",
        });
      }

      if (usersError) {
        console.error("Erro ao carregar usuários:", usersError);
        toast({
          title: "Erro",
          description: `Falha ao carregar usuários: ${usersError.message}`,
          variant: "destructive",
        });
      }

      // Buscar nomes dos professores e criadores para os PEIs
      const teacherIds = Array.from(new Set(
        peisData?.map((p: any) => [p.assigned_teacher_id, p.created_by]).flat().filter(Boolean) || []
      ));
      
      let userMap: Record<string, { full_name: string }> = {};
      if (teacherIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", teacherIds);
        
        userMap = (profilesData || []).reduce((acc: Record<string, any>, profile: any) => {
          acc[profile.id] = { full_name: profile.full_name };
          return acc;
        }, {});
      }

      // Adicionar os dados dos professores aos PEIs
      const peisWithTeachers = (peisData || []).map((pei: any) => ({
        ...pei,
        assigned_teacher: pei.assigned_teacher_id ? userMap[pei.assigned_teacher_id] || null : null,
        created_by_profile: pei.created_by ? userMap[pei.created_by] || null : null,
      }));

      setStudents(studentsData || []);
      setPeis(peisWithTeachers);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Erro geral:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
      // converte e tipa manualmente o novo aluno
  const newStudent = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    school_id: activeTenant!,
  };

    const { error } = await supabase
    .from("students")
    .insert([newStudent]); // 👈 IMPORTANTE: sempre como array tipado

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Aluno matriculado com sucesso" });
      setOpenAddStudent(false);
      loadData();
    }
  };

  const handleCSVUpload = async (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }: any) => {
        const formatted = data.map((row: any) => ({
          name: row["Nome"],
          email: row["Email"] || null,
          phone: row["Telefone"] || null,
          school_id: activeTenant,
        }));

        const { error } = await supabase.from("students").insert(formatted);
        if (error)
          toast({
            title: "Erro no upload",
            description: error.message,
            variant: "destructive",
          });
        else toast({ title: "Alunos importados com sucesso" });
        loadData();
      },
    });
  };

  const handleCSVExport = () => {
    if (students.length === 0) {
      toast({
        title: "Nenhum aluno encontrado",
        description: "Não há alunos para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados para exportação com formatação melhorada
    const exportData = students.map(student => ({
      'ID': student.id,
      'Nome': student.name,
      'Email': student.email || '',
      'Telefone': student.phone || '',
      'Data de Nascimento': student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('pt-BR') : '',
      'Escola': student.tenant_name || '',
      'Status': student.status || 'Ativo',
      'Criado em': new Date(student.created_at).toLocaleDateString('pt-BR'),
      'Última atualização': student.updated_at ? new Date(student.updated_at).toLocaleDateString('pt-BR') : '',
    }));

    // Gerar CSV com configurações otimizadas
    const csv = Papa.unparse(exportData, {
      header: true,
      delimiter: ',',
      newline: '\n',
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
    });

    // Adicionar BOM para compatibilidade com Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csv;

    // Criar e baixar arquivo
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Nome do arquivo com timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const schoolName = tenants.find(t => t.id === activeTenant)?.name || 'Escola';
    const fileName = `alunos_${schoolName.replace(/\s+/g, '_')}_${timestamp}.csv`;
    
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpar URL do objeto
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação realizada com sucesso!",
      description: `${students.length} alunos exportados para ${fileName}`,
    });
  };

  const stats = {
    students: students.length,
    peis: peis.length,
    users: users.length,
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Painel do Gestor Escolar</h2>
          <p className="text-muted-foreground">Gestão e controle administrativo das escolas</p>
        </div>

        <Select onValueChange={setActiveTenant} value={activeTenant || ""}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione a escola" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.students}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">PEIs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.peis}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.users}</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="students">Alunos</TabsTrigger>
          <TabsTrigger value="peis">PEIs</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="logs">Auditoria</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Indicadores</CardTitle>
              <CardDescription>Visão geral da escola selecionada</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "Alunos", value: stats.students },
                  { name: "PEIs", value: stats.peis },
                  { name: "Usuários", value: stats.users },
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students */}
        <TabsContent value="students">
          <div className="flex gap-2 mb-3">
            <Button onClick={() => setOpenAddStudent(true)}><PlusCircle className="mr-2 h-4 w-4" /> Novo Aluno</Button>
            <Button asChild variant="secondary">
              <label htmlFor="csv-upload" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" /> Importar CSV</label>
            </Button>
            <Button onClick={() => setOpenExportDialog(true)} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
            <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCSVUpload(e.target.files[0])} />
          </div>

          <StudentsTable students={students} tenants={tenants} onStudentDeleted={loadData} />

          <Dialog open={openAddStudent} onOpenChange={setOpenAddStudent}>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Matrícula</DialogTitle></DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-2">
                <Input name="name" placeholder="Nome do aluno" required />
                <Input name="email" placeholder="Email (opcional)" />
                <Input name="phone" placeholder="Telefone" />
                <Button type="submit" className="w-full mt-3">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* PEIs */}
        <TabsContent value="peis">
          <div className="space-y-4">
            
            {/* Estatísticas dos PEIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Total de PEIs</p>
                      <p className="text-2xl font-bold">{peis.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium">Aprovados</p>
                      <p className="text-2xl font-bold">
                        {peis.filter(p => p.status === 'approved').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                    <div>
                      <p className="text-sm font-medium">Pendentes</p>
                      <p className="text-2xl font-bold">
                        {peis.filter(p => p.status === 'pending_validation').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium">Rascunhos</p>
                      <p className="text-2xl font-bold">
                        {peis.filter(p => p.status === 'draft').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de PEIs */}
            <Card>
              <CardHeader>
                <CardTitle>PEIs da Escola</CardTitle>
                <CardDescription>
                  Lista de todos os PEIs cadastrados na escola selecionada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Total de PEIs: {peis.length}
                  </div>
                  <SimplePEIsTable peis={peis} onPEIDeleted={loadData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <UsersTable users={users} tenants={tenants} onUserUpdated={loadData} />
        </TabsContent>

        {/* Logs de Auditoria */}
        <TabsContent value="logs">
          <SimpleAuditLogsViewer 
            tenantId={activeTenant} 
            limit={100} 
            showFilters={true} 
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de Exportação */}
      <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Alunos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Serão exportados <strong>{students.length}</strong> alunos da escola <strong>{tenants.find(t => t.id === activeTenant)?.name}</strong>.
            </div>
            <div className="text-sm">
              <strong>Campos incluídos:</strong>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• ID, Nome, Email, Telefone</li>
                <li>• Data de Nascimento, Escola, Status</li>
                <li>• Data de criação e última atualização</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenExportDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                handleCSVExport();
                setOpenExportDialog(false);
              }}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolManagerDashboard;
