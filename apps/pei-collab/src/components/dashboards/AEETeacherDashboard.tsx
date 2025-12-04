// src/components/dashboards/AEETeacherDashboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AEETeacherDashboardProps {
  profile: {
    id: string;
    full_name: string;
    role: string;
    school_id: string | null;
  };
}

const AEETeacherDashboard = ({ profile }: AEETeacherDashboardProps) => {
  const [peis, setPeis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPEIs();
  }, [profile.school_id]);

  const loadPEIs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("peis")
        .select(`
          *,
          students (name, date_of_birth)
        `)
        .eq("school_id", profile.school_id)
        .eq("is_active_version", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Buscar nomes dos professores atribuídos aos PEIs
      const teacherIds = Array.from(new Set(
        data?.map((p: any) => p.assigned_teacher_id).filter(Boolean) || []
      ));
      
      let teacherMap: Record<string, string> = {};
      if (teacherIds.length > 0) {
        const { data: teachersData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", teacherIds);
        
        teacherMap = (teachersData || []).reduce((acc: Record<string, string>, teacher: any) => {
          acc[teacher.id] = teacher.full_name;
          return acc;
        }, {});
      }

      // Adicionar os dados dos professores aos PEIs
      const peisWithTeachers = (data || []).map((pei: any) => ({
        ...pei,
        assigned_teacher: pei.assigned_teacher_id ? { full_name: teacherMap[pei.assigned_teacher_id] || "Professor não identificado" } : null,
      }));

      setPeis(peisWithTeachers);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os PEIs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      in_progress: "default",
      completed: "outline",
      approved: "default",
    };

    const labels: Record<string, string> = {
      draft: "Rascunho",
      in_progress: "Em Progresso",
      completed: "Concluído",
      approved: "Aprovado",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleViewPEI = (peiId: string, studentId: string) => {
    navigate(`/pei/edit?pei=${peiId}&student=${studentId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Painel do Professor de AEE</h2>
        <p className="text-muted-foreground">
          Visualize PEIs da escola e adicione comentários especializados
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de PEIs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peis.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sua Função</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">Comentar e acompanhar PEIs</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PEIs da Escola</CardTitle>
          <CardDescription>
            Você pode visualizar e comentar nos PEIs criados pelos professores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Professor Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum PEI encontrado
                  </TableCell>
                </TableRow>
              ) : (
                peis.map((pei) => (
                  <TableRow key={pei.id}>
                    <TableCell className="font-medium">
                      {pei.students?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {pei.assigned_teacher?.full_name || "Não atribuído"}
                    </TableCell>
                    <TableCell>{getStatusBadge(pei.status)}</TableCell>
                    <TableCell>
                      {new Date(pei.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPEI(pei.id, pei.student_id)}
                      >
                        Ver e Comentar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AEETeacherDashboard;
