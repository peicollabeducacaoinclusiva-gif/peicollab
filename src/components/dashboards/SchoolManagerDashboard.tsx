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
import { GraduationCap, Users, FileText, Upload, PlusCircle, Activity } from "lucide-react";
import StudentsTable from "@/components/superadmin/StudentsTable";
import PEIsTable from "@/components/superadmin/PEIsTable";
import UsersTable from "@/components/superadmin/UsersTable";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface SchoolManagerDashboardProps {
  profile: {
    id: string;
    full_name: string;
    role: string;
    tenant_id: string | null;
  };
}

const SchoolManagerDashboard = ({ profile }: SchoolManagerDashboardProps) => {
  const [activeTenant, setActiveTenant] = useState<string | null>(profile.tenant_id);
  const [tenants, setTenants] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [peis, setPeis] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddStudent, setOpenAddStudent] = useState(false);
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
      .select("tenant_id, tenants(name)")
      .eq("user_id", profile.id);

    if (error) {
      console.error(error);
      return;
    }

    const tenantList = data?.map((t: any) => ({
      id: t.tenant_id,
      name: t.tenants?.name || "Escola",
    })) || [];

    setTenants(tenantList);

    if (!activeTenant && tenantList.length > 0) {
      setActiveTenant(tenantList[0].id);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [{ data: studentsData }, { data: peisData }, { data: usersData }, { data: logsData }] =
        await Promise.all([
          supabase.from("students").select("*").eq("tenant_id", activeTenant).order("name"),
          supabase.from("peis").select("*, students(name), profiles!peis_assigned_teacher_id_fkey(full_name)").eq("tenant_id", activeTenant),
          supabase.from("profiles").select("*, tenants(name)").eq("tenant_id", activeTenant),
          supabase.from("signup_debug_logs").select("*").order("created_at", { ascending: false }).limit(50),
        ]);

      setStudents(studentsData || []);
      setPeis(peisData || []);
      setUsers(usersData || []);
      setLogs(logsData || []);
    } catch (error) {
      console.error(error);
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
    tenant_id: activeTenant!,
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
          tenant_id: activeTenant,
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
          <PEIsTable peis={peis} onPEIDeleted={loadData} />
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <UsersTable users={users} tenants={tenants} onUserUpdated={loadData} />
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>Últimos eventos e registros</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 max-h-[400px] overflow-y-auto">
                {logs.map((log) => (
                  <li key={log.id} className="border-b pb-1">
                    <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()} — </span>
                    <strong>{log.step}</strong>: {log.message || log.error}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchoolManagerDashboard;
