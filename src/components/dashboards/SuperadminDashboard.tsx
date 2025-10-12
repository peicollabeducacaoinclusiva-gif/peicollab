// src/components/dashboards/SuperadminDashboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, School, FileText, GraduationCap, Download, TrendingUp,
  Activity, CheckCircle2, Clock, AlertCircle, BarChart3,
  Target, Award, BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateTenantDialog from "@/components/superadmin/CreateTenantDialog";
import CreateStudentDialog from "@/components/superadmin/CreateStudentDialog";
import TenantsTable from "@/components/superadmin/TenantsTable";
import StudentsTable from "@/components/superadmin/StudentsTable";
import PEIsTable from "@/components/superadmin/PEIsTable";
import ImportCSVDialog from "@/components/superadmin/ImportCSVDialog";
import NetworkInfoCard from "@/components/superadmin/NetworkInfoCard";
//import TestDataManager from "@/components/superadmin/TestDataManager";
import SuperadminUserManagement from "./SuperadminUserManagement";

interface SuperadminDashboardProps {
  profile: {
    id: string;
    full_name: string;
    role: string;
    tenant_id: string | null;
  };
}

interface Stats {
  tenants: number;
  users: number;
  students: number;
  peis: number;
  peisDraft: number;
  peisPending: number;
  peisApproved: number;
  peisReturned: number;
  activeUsers: number;
  teachersCount: number;
  coordinatorsCount: number;
  peisThisMonth: number;
  peisLastMonth: number;
  studentsWithPEI: number;
  studentsWithoutPEI: number;
}

interface SchoolPerformance {
  tenant_id: string;
  tenant_name: string;
  total_students: number;
  students_with_pei: number;
  peis_approved: number;
  peis_pending: number;
  coverage_percentage: number;
  approval_rate: number;
}

interface StudentData {
  id: string;
  name: string;
  date_of_birth: string | null;
  father_name: string | null;
  mother_name: string | null;
  phone: string | null;
  email: string | null;
  tenant_id: string;
  tenants: {
    name: string;
    network_name: string | null;
  } | null;
}

interface PEIData {
  id: string;
  status: string;
  created_at: string;
  student_id: string;
  assigned_teacher_id: string | null;
  students: {
    name: string;
    tenants: {
      name: string;
    } | null;
  } | null;
  assigned_teacher: {
    full_name: string;
  } | null;
}

const SuperadminDashboard = ({ profile }: SuperadminDashboardProps) => {
  const [stats, setStats] = useState<Stats>({
    tenants: 0,
    users: 0,
    students: 0,
    peis: 0,
    peisDraft: 0,
    peisPending: 0,
    peisApproved: 0,
    peisReturned: 0,
    activeUsers: 0,
    teachersCount: 0,
    coordinatorsCount: 0,
    peisThisMonth: 0,
    peisLastMonth: 0,
    studentsWithPEI: 0,
    studentsWithoutPEI: 0,
  });
  const [schoolPerformance, setSchoolPerformance] = useState<SchoolPerformance[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [peis, setPeis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadData();

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadData)
      .subscribe();

    const tenantsChannel = supabase
      .channel('tenants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, loadData)
      .subscribe();

    const studentsChannel = supabase
      .channel('students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, loadData)
      .subscribe();

    const peisChannel = supabase
      .channel('peis-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peis' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(tenantsChannel);
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(peisChannel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar dados básicos em paralelo
      const [tenantsRes, usersRes, studentsRes, peisRes, rolesRes] = await Promise.all([
        supabase.from("tenants").select("*"),
        supabase.from("profiles").select("id, is_active"),
        supabase.from("students").select("id, tenant_id"),
        supabase.from("peis").select("status, created_at, student_id"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      // Calcular estatísticas de tempo
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const peisThisMonth = peisRes.data?.filter(p =>
        new Date(p.created_at) >= firstDayThisMonth
      ).length || 0;

      const peisLastMonth = peisRes.data?.filter(p => {
        const date = new Date(p.created_at);
        return date >= firstDayLastMonth && date <= lastDayLastMonth;
      }).length || 0;

      const studentsWithPEI = new Set(peisRes.data?.map(p => p.student_id)).size;
      const studentsWithoutPEI = (studentsRes.data?.length || 0) - studentsWithPEI;

      // Agrupar PEIs por status
      const peisByStatus = {
        draft: peisRes.data?.filter(p => p.status === "draft").length || 0,
        pending: peisRes.data?.filter(p => p.status === "pending").length || 0,
        approved: peisRes.data?.filter(p => p.status === "approved").length || 0,
        returned: peisRes.data?.filter(p => p.status === "returned").length || 0,
      };

      // Estatísticas de usuários
      const activeUsers = usersRes.data?.filter(u => u.is_active).length || 0;

      // Criar Map de roles com tipagem correta
      const rolesMap = new Map<string, string>();
      if (rolesRes.data) {
        rolesRes.data.forEach(r => {
          if (r.user_id && r.role) {
            rolesMap.set(r.user_id, r.role);
          }
        });
      }

      const teachersCount = Array.from(rolesMap.values()).filter(r => r === "teacher").length;
      const coordinatorsCount = Array.from(rolesMap.values()).filter(r => r === "coordinator").length;

      setStats({
        tenants: tenantsRes.data?.length || 0,
        users: usersRes.data?.length || 0,
        students: studentsRes.data?.length || 0,
        peis: peisRes.data?.length || 0,
        peisDraft: peisByStatus.draft,
        peisPending: peisByStatus.pending,
        peisApproved: peisByStatus.approved,
        peisReturned: peisByStatus.returned,
        activeUsers,
        teachersCount,
        coordinatorsCount,
        peisThisMonth,
        peisLastMonth,
        studentsWithPEI,
        studentsWithoutPEI,
      });

      // Calcular performance por escola
      if (tenantsRes.data && studentsRes.data && peisRes.data) {
        const performance = tenantsRes.data.map(tenant => {
          const tenantStudents = studentsRes.data.filter(s => s.tenant_id === tenant.id);
          const tenantPEIs = peisRes.data.filter(p => {
            const student = studentsRes.data.find(s => s.id === p.student_id);
            return student?.tenant_id === tenant.id;
          });

          const studentsWithPEI = new Set(tenantPEIs.map(p => p.student_id)).size;
          const approvedPEIs = tenantPEIs.filter(p => p.status === "approved").length;
          const pendingPEIs = tenantPEIs.filter(p => p.status === "pending").length;

          const coverage = tenantStudents.length > 0
            ? (studentsWithPEI / tenantStudents.length) * 100
            : 0;

          const approvalRate = tenantPEIs.length > 0
            ? (approvedPEIs / tenantPEIs.length) * 100
            : 0;

          return {
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            total_students: tenantStudents.length,
            students_with_pei: studentsWithPEI,
            peis_approved: approvedPEIs,
            peis_pending: pendingPEIs,
            coverage_percentage: coverage,
            approval_rate: approvalRate,
          };
        }).sort((a, b) => b.coverage_percentage - a.coverage_percentage);

        setSchoolPerformance(performance);
      }

      // Carregar dados completos para as tabelas
      const { data: tenantsData } = await supabase.from("tenants").select("*");
      if (tenantsData) {
        const tenantsWithCounts = await Promise.all(
          tenantsData.map(async (tenant) => {
            const [userCount, studentCount] = await Promise.all([
              supabase.from("user_tenants").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
              supabase.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
            ]);
            return {
              ...tenant,
              user_count: userCount.count || 0,
              student_count: studentCount.count || 0,
            };
          })
        );
        setTenants(tenantsWithCounts);
      }

      // Carregar alunos com dados do tenant
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, name, date_of_birth, father_name, mother_name, phone, email, tenant_id, tenants(name, network_name)")
        .order("name");

      const formattedStudents = studentsData?.map((s: StudentData) => ({
        ...s,
        tenant_name: s.tenants?.name,
      })) || [];

      setStudents(formattedStudents);

      // Carregar PEIs
      const { data: peisData } = await supabase
        .from("peis")
        .select(`
          id, 
          status, 
          created_at,
          student_id,
          assigned_teacher_id,
          students(name, tenants(name)),
          assigned_teacher:profiles!peis_assigned_teacher_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      const formattedPEIs = peisData?.map((p: any) => ({
        id: p.id,
        student_name: p.students?.name || "Aluno não identificado",
        teacher_name: p.assigned_teacher?.full_name || "Professor não atribuído",
        tenant_name: p.students?.tenants?.name || "Escola não identificada",
        status: p.status,
        created_at: p.created_at,
      })) || [];

      setPeis(formattedPEIs);

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

  const handleExportReport = () => {
    // Gerar HTML estruturado para o relatório
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório Executivo - Rede Municipal de Educação</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #fff;
          padding: 40px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #6366f1;
        }
        
        .logo-section {
          margin-bottom: 20px;
        }
        
        .logo-placeholder {
          width: 80px;
          height: 80px;
          margin: 0 auto 15px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
          font-weight: bold;
        }
        
        .header h1 {
          color: #1e293b;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .header h2 {
          color: #6366f1;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 15px;
        }
        
        .header .meta {
          color: #64748b;
          font-size: 14px;
          margin-top: 10px;
        }
        
        .header .meta strong {
          color: #475569;
        }
        
        .summary {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 40px;
          border-left: 5px solid #6366f1;
        }
        
        .summary h3 {
          color: #1e293b;
          font-size: 18px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .kpi-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .kpi-card.blue { border-left-color: #3b82f6; }
        .kpi-card.green { border-left-color: #10b981; }
        .kpi-card.purple { border-left-color: #a855f7; }
        .kpi-card.orange { border-left-color: #f59e0b; }
        
        .kpi-card .label {
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .kpi-card .value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .kpi-card.blue .value { color: #3b82f6; }
        .kpi-card.green .value { color: #10b981; }
        .kpi-card.purple .value { color: #a855f7; }
        .kpi-card.orange .value { color: #f59e0b; }
        
        .kpi-card .description {
          color: #64748b;
          font-size: 13px;
        }
        
        .section {
          margin-bottom: 40px;
        }
        
        .section h3 {
          color: #1e293b;
          font-size: 20px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        thead {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }
        
        th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
        }
        
        tbody tr {
          border-bottom: 1px solid #e2e8f0;
        }
        
        tbody tr:last-child {
          border-bottom: none;
        }
        
        tbody tr:hover {
          background: #f8fafc;
        }
        
        td {
          padding: 15px;
          font-size: 14px;
        }
        
        .rank {
          width: 50px;
          text-align: center;
          font-weight: 700;
          color: #6366f1;
          font-size: 18px;
        }
        
        .school-name {
          font-weight: 600;
          color: #1e293b;
        }
        
        .metric {
          text-align: center;
          font-weight: 600;
        }
        
        .metric.excellent { color: #10b981; }
        .metric.good { color: #3b82f6; }
        .metric.warning { color: #f59e0b; }
        .metric.alert { color: #ef4444; }
        
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        
        .footer strong {
          color: #475569;
        }
        
        .insights {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
        }
        
        .insights h4 {
          color: #92400e;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .insights ul {
          list-style: none;
          padding-left: 0;
        }
        
        .insights li {
          color: #78350f;
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }
        
        .insights li:before {
          content: "→";
          position: absolute;
          left: 0;
          color: #f59e0b;
          font-weight: bold;
        }
        
        @media print {
          body {
            padding: 20px;
          }
          
          .kpi-grid {
            page-break-inside: avoid;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      <!-- Cabeçalho -->
      <div class="header">
        <div class="logo-section">
          <div class="logo-placeholder">PEI</div>
        </div>
        <h1>Secretaria Municipal de Educação</h1>
        <h2>Relatório Executivo - Educação Inclusiva</h2>
        <div class="meta">
          <strong>Data de Emissão:</strong> ${reportDate}<br>
          <strong>Gerado por:</strong> ${profile.full_name}<br>
          <strong>Sistema:</strong> PEI Collab - Plataforma de Gestão de PEIs
        </div>
      </div>
      
      <!-- Resumo Executivo -->
      <div class="summary">
        <h3>📊 Resumo Executivo</h3>
        <div class="kpi-grid">
          <div class="kpi-card blue">
            <div class="label">Rede Municipal</div>
            <div class="value">${stats.tenants}</div>
            <div class="description">Escolas conectadas</div>
          </div>
          
          <div class="kpi-card green">
            <div class="label">Cobertura PEI</div>
            <div class="value">${coveragePercentage}%</div>
            <div class="description">${stats.studentsWithPEI} de ${stats.students} alunos</div>
          </div>
          
          <div class="kpi-card purple">
            <div class="label">Taxa de Aprovação</div>
            <div class="value">${approvalRate}%</div>
            <div class="description">${stats.peisApproved} PEIs aprovados</div>
          </div>
          
          <div class="kpi-card orange">
            <div class="label">Crescimento</div>
            <div class="value">${Number(growthPercentage) > 0 ? '+' : ''}${growthPercentage}%</div>
            <div class="description">Comparado ao mês anterior</div>
          </div>
        </div>
      </div>
      
      <!-- Ranking de Performance -->
      <div class="section">
        <h3>🏆 Ranking de Performance das Escolas</h3>
        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Escola</th>
              <th style="text-align: center;">Total Alunos</th>
              <th style="text-align: center;">Alunos com PEI</th>
              <th style="text-align: center;">Cobertura</th>
              <th style="text-align: center;">PEIs Aprovados</th>
              <th style="text-align: center;">Taxa Aprovação</th>
            </tr>
          </thead>
          <tbody>
            ${schoolPerformance.map((school, index) => {
      const coverageClass = school.coverage_percentage >= 80 ? 'excellent' :
        school.coverage_percentage >= 60 ? 'good' :
          school.coverage_percentage >= 40 ? 'warning' : 'alert';

      return `
                <tr>
                  <td class="rank">${index + 1}º</td>
                  <td class="school-name">${school.tenant_name}</td>
                  <td class="metric">${school.total_students}</td>
                  <td class="metric">${school.students_with_pei}</td>
                  <td class="metric ${coverageClass}">${school.coverage_percentage.toFixed(1)}%</td>
                  <td class="metric">${school.peis_approved}</td>
                  <td class="metric">${school.approval_rate.toFixed(1)}%</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Insights e Recomendações -->
      <div class="insights">
        <h4>💡 Insights e Recomendações</h4>
        <ul>
          ${coveragePercentage < 50 ?
        '<li>A cobertura de PEIs está abaixo de 50%. Recomenda-se intensificar o cadastramento de novos planos.</li>' :
        '<li>Boa cobertura de PEIs na rede. Manter o ritmo de cadastramento.</li>'
      }
          ${stats.peisPending > stats.peisApproved ?
        '<li>Número de PEIs pendentes superior aos aprovados. Priorizar análise e aprovação.</li>' :
        '<li>Taxa de aprovação positiva. Processo de revisão funcionando adequadamente.</li>'
      }
          ${Number(growthPercentage) < 0 ?
        '<li>Queda no número de PEIs criados este mês. Investigar possíveis obstáculos.</li>' :
        '<li>Crescimento positivo no cadastramento de PEIs. Tendência favorável.</li>'
      }
          ${stats.studentsWithoutPEI > 0 ?
        `<li>Ainda existem ${stats.studentsWithoutPEI} alunos sem PEI cadastrado. Priorizar atendimento.</li>` :
        '<li>Todos os alunos possuem PEI cadastrado. Meta alcançada!</li>'
      }
        </ul>
      </div>
      
      <!-- Rodapé -->
      <div class="footer">
        <p>
          <strong>PEI Collab</strong> - Sistema de Gestão de Planos Educacionais Individualizados<br>
          Secretaria Municipal de Educação | Relatório gerado automaticamente em ${reportDate}<br>
          <em>Este documento contém informações confidenciais. Uso restrito.</em>
        </p>
      </div>
    </body>
    </html>
  `;

    // Criar blob e fazer download
    const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-executivo-educacao-inclusiva-${new Date().toISOString().split('T')[0]}.html`;
    link.click();

    toast({
      title: "Relatório exportado com sucesso! 📄",
      description: "Abra o arquivo HTML no navegador e use Ctrl+P para imprimir em PDF com layout profissional.",
    });
  };

  // Para exportar diretamente em CSV (mantendo a opção original como backup)
  const handleExportCSV = () => {
    const csvContent = [
      ["Posição", "Escola", "Total Alunos", "Alunos com PEI", "Cobertura (%)", "PEIs Aprovados", "PEIs Pendentes", "Taxa Aprovação (%)"],
      ...schoolPerformance.map((sp, index) => [
        `${index + 1}º`,
        sp.tenant_name,
        sp.total_students.toString(),
        sp.students_with_pei.toString(),
        sp.coverage_percentage.toFixed(1),
        sp.peis_approved.toString(),
        sp.peis_pending.toString(),
        sp.approval_rate.toFixed(1),
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-rede-municipal-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Relatório CSV exportado",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  };

  const growthPercentage = stats.peisLastMonth > 0
    ? ((stats.peisThisMonth - stats.peisLastMonth) / stats.peisLastMonth * 100).toFixed(1)
    : stats.peisThisMonth > 0 ? "100" : "0";

  const coveragePercentage =
  stats.students > 0
    ? Number(((stats.studentsWithPEI / stats.students) * 100).toFixed(1))
    : 0;

  const approvalRate = stats.peis > 0
    ? ((stats.peisApproved / stats.peis) * 100).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="text-lg font-medium text-muted-foreground">Carregando painel estratégico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Premium */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Secretaria Municipal de Educação
          </h1>
          <p className="text-lg text-muted-foreground">
            Olá, {profile.full_name} • Visão estratégica da educação inclusiva
          </p>
        </div>
        <Button onClick={handleExportReport} size="lg" className="shadow-lg">
          <Download className="mr-2 h-5 w-5" />
          Exportar Relatório Executivo
        </Button>
        <Button onClick={handleExportCSV} size="lg" className="shadow-lg">
          <Download className="mr-2 h-5 w-5" />
          Exportar Relatório CSV
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rede Municipal</CardTitle>
            <School className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.tenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Escolas conectadas ao sistema
            </p>
            <div className="mt-3 flex items-center text-xs">
              <Users className="mr-1 h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{stats.students} alunos matriculados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cobertura PEI</CardTitle>
            <Target className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{coveragePercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.studentsWithPEI} de {stats.students} alunos com PEI ativo
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${coveragePercentage}%` }}
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
            <div className="text-3xl font-bold text-purple-600">{approvalRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.peisApproved} PEIs aprovados de {stats.peis} totais
            </p>
            <div className="mt-3 flex gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {stats.peisPending} pendentes
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crescimento Mensal</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {Number(growthPercentage) > 0 ? "+" : ""}{growthPercentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.peisThisMonth} PEIs este mês vs {stats.peisLastMonth} no mês anterior
            </p>
            <div className="mt-3 flex items-center text-xs">
              <Activity className="mr-1 h-3 w-3 text-orange-500" />
              <span className="font-medium text-orange-600">
                {Number(growthPercentage) >= 0 ? "Tendência positiva" : "Tendência negativa"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe Ativa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.teachersCount} professores • {stats.coordinatorsCount} coordenadores
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status dos PEIs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aprovados</span>
              <span className="font-semibold text-green-600">{stats.peisApproved}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pendentes</span>
              <span className="font-semibold text-yellow-600">{stats.peisPending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rascunho</span>
              <span className="font-semibold text-gray-600">{stats.peisDraft}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Prioritários</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.studentsWithoutPEI}</div>
            <p className="text-xs text-muted-foreground">
              Alunos ainda sem PEI cadastrado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Performance das Escolas */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Performance das Escolas da Rede
              </CardTitle>
              <CardDescription className="mt-2">
                Análise comparativa de cobertura e aprovação de PEIs por escola
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schoolPerformance.slice(0, 5).map((school, index) => (
              <div key={school.tenant_id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{school.tenant_name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {school.total_students} alunos • {school.students_with_pei} com PEI
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={school.coverage_percentage >= 80 ? "default" : school.coverage_percentage >= 50 ? "secondary" : "destructive"}>
                      <Target className="mr-1 h-3 w-3" />
                      Cobertura: {school.coverage_percentage.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <CheckCircle2 className="inline mr-1 h-3 w-3 text-green-500" />
                    {school.peis_approved} aprovados • {school.peis_pending} pendentes
                  </div>
                </div>
              </div>
            ))}
          </div>
          {schoolPerformance.length > 5 && (
            <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab("tenants")}>
              Ver todas as {schoolPerformance.length} escolas
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs de Gerenciamento */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            <span className="hidden sm:inline">Escolas</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Alunos</span>
          </TabsTrigger>
          <TabsTrigger value="peis" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">PEIs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Sobre o Sistema PEI Collab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                O <strong>PEI Collab</strong> é uma plataforma integrada para gestão de Planos Educacionais Individualizados,
                desenvolvida especialmente para Secretarias Municipais de Educação que desejam modernizar e otimizar
                o acompanhamento pedagógico de alunos com necessidades especiais.
              </p>

              <div className="grid gap-4 md:grid-cols-2 mt-6">
                <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    Gestão Centralizada
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Visualize toda a rede municipal em um único painel estratégico
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Colaboração em Tempo Real
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Professores, coordenadores e famílias trabalhando juntos
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    Relatórios Inteligentes
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Métricas e indicadores para tomada de decisão baseada em dados
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600" />
                    Conformidade Legal
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Alinhado com as diretrizes da educação inclusiva brasileira
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {//<TestDataManager onDataChanged={loadData} /> 
          }
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <SuperadminUserManagement />
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <NetworkInfoCard tenants={tenants} onUpdate={loadData} />

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestão de Escolas da Rede</CardTitle>
                <CardDescription>
                  Cadastre e gerencie todas as escolas municipais
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <ImportCSVDialog type="tenants" onImportComplete={loadData} />
                <CreateTenantDialog onTenantCreated={loadData} />
              </div>
            </CardHeader>
            <CardContent>
              <TenantsTable tenants={tenants} onTenantUpdated={loadData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestão de Alunos da Rede Municipal</CardTitle>
                <CardDescription>
                  Cadastre alunos e acompanhe a cobertura de PEIs
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <ImportCSVDialog type="students" onImportComplete={loadData} />
                <CreateStudentDialog tenants={tenants} onStudentCreated={loadData} />
              </div>
            </CardHeader>
            <CardContent>
              <StudentsTable students={students} tenants={tenants} onStudentDeleted={loadData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="peis" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{stats.peisApproved}</div>
                <p className="text-xs text-green-600">
                  {approvalRate}% do total
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{stats.peisPending}</div>
                <p className="text-xs text-yellow-600">
                  Aguardando aprovação
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
                <FileText className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-700">{stats.peisDraft}</div>
                <p className="text-xs text-gray-600">
                  Em elaboração
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devolvidos</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{stats.peisReturned}</div>
                <p className="text-xs text-red-600">
                  Precisam revisão
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Todos os PEIs da Rede Municipal</CardTitle>
                <CardDescription>
                  Visualize e acompanhe todos os Planos Educacionais Individualizados
                </CardDescription>
              </div>
              <ImportCSVDialog type="peis" onImportComplete={loadData} />
            </CardHeader>
            <CardContent>
              <PEIsTable peis={peis} onPEIDeleted={loadData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperadminDashboard;