import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Calendar, User, FileText, ArrowRight, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReportView from "@/components/pei/ReportView";

interface PEIVersion {
  id: string;
  version_number: number;
  status: string;
  is_active_version: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_teacher_id: string;
  diagnosis_data: any;
  planning_data: any;
  evaluation_data: any;
  profiles?: {
    full_name: string;
  };
  assigned_teacher?: {
    full_name: string;
  };
}

interface Props {
  studentId: string;
  studentName: string;
  currentPEIId?: string;
  variant?: "icon" | "button";
}

export default function PEIVersionHistoryDialog({ studentId, studentName, currentPEIId, variant = "button" }: Props) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<PEIVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PEIVersion | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadUserProfile();
      loadVersions();
    }
  }, [open, studentId]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, school_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setTenantId(profile.tenant_id);
        setSchoolId(profile.school_id);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil do usuário:", error);
    }
  };

  const loadVersions = async () => {
    try {
      setLoading(true);

      // Buscar PEIs do aluno
      const { data, error } = await supabase
        .from("peis")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          created_by,
          assigned_teacher_id,
          diagnosis_data,
          planning_data,
          evaluation_data
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro na query de PEIs:", error);
        throw error;
      }

      // Buscar informações dos usuários separadamente
      const creatorIds = [...new Set(data?.map(p => p.created_by).filter(Boolean) || [])];
      const teacherIds = [...new Set(data?.map(p => p.assigned_teacher_id).filter(Boolean) || [])];
      const allUserIds = [...new Set([...creatorIds, ...teacherIds])];

      let usersMap: Record<string, string> = {};
      
      if (allUserIds.length > 0) {
        const { data: usersData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", allUserIds);
        
        if (usersData) {
          usersMap = Object.fromEntries(
            usersData.map(u => [u.id, u.full_name || "Desconhecido"])
          );
        }
      }

      // Mapear dados com informações de usuários e adicionar version_number manualmente
      const versionsWithUsers: PEIVersion[] = (data || []).map((pei, index) => ({
        ...pei,
        version_number: data!.length - index, // Versão baseada na ordem de criação
        is_active_version: index === 0, // Apenas o mais recente é ativo
        profiles: pei.created_by ? { full_name: usersMap[pei.created_by] || "Desconhecido" } : undefined,
        assigned_teacher: pei.assigned_teacher_id ? { full_name: usersMap[pei.assigned_teacher_id] || "Não atribuído" } : undefined,
      }));

      setVersions(versionsWithUsers);
    } catch (error) {
      console.error("Erro ao carregar versões:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de versões. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Arquivado</Badge>;
    }

    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Rascunho", variant: "secondary" },
      pending: { label: "Pendente", variant: "default" },
      approved: { label: "Aprovado", variant: "outline" },
      returned: { label: "Devolvido", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleViewVersion = (version: PEIVersion) => {
    setSelectedVersion(version);
    setViewDialogOpen(true);
  };

  const activeVersion = versions.find(v => v.is_active_version);
  const archivedVersions = versions.filter(v => !v.is_active_version);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {variant === "icon" ? (
            <Button variant="outline" size="icon" className="h-10 w-10" title="Histórico de Versões">
              <History className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              Histórico de Versões
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Versões do PEI
            </DialogTitle>
            <DialogDescription>
              Aluno: <span className="font-semibold text-foreground">{studentName}</span>
              {versions.length > 0 && (
                <span className="ml-2">• {versions.length} versão(ões) encontrada(s)</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma versão encontrada para este aluno.</p>
            </div>
          ) : (
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  Versão Ativa {activeVersion && `(v${activeVersion.version_number})`}
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Versões Arquivadas ({archivedVersions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {activeVersion ? (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle>Versão {activeVersion.version_number}</CardTitle>
                          <Badge variant="default" className="bg-green-600">Ativa</Badge>
                          {getStatusBadge(activeVersion.status, true)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewVersion(activeVersion)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </div>
                      <CardDescription>
                        Esta é a versão atual do PEI
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Criado em:</span>
                        <span className="font-medium">
                          {format(new Date(activeVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Professor:</span>
                        <span className="font-medium">
                          {activeVersion.assigned_teacher?.full_name || "Não atribuído"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Última atualização:</span>
                        <span className="font-medium">
                          {format(new Date(activeVersion.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma versão ativa encontrada.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="archived">
                <ScrollArea className="h-[400px] pr-4">
                  {archivedVersions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhuma versão arquivada.</p>
                      <p className="text-sm mt-2">
                        Versões antigas aparecem aqui quando uma nova versão é criada.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {archivedVersions.map((version, index) => (
                        <Card key={version.id} className="relative">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Versão {version.version_number}</CardTitle>
                                {getStatusBadge(version.status, false)}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewVersion(version)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Button>
                            </div>
                            <CardDescription>
                              {index === 0 && archivedVersions.length > 1 && "Versão anterior mais recente"}
                              {index === archivedVersions.length - 1 && "Primeira versão criada"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Vigente de:</span>
                              <span className="font-medium">
                                {format(new Date(version.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              {archivedVersions[index - 1] && (
                                <>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">
                                    {format(new Date(archivedVersions[index - 1].created_at), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Professor:</span>
                              <span className="font-medium">
                                {version.assigned_teacher?.full_name || "Não atribuído"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Criado por:</span>
                              <span className="font-medium">
                                {version.profiles?.full_name || "Desconhecido"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização da Versão */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PEI - Versão {selectedVersion?.version_number}
              {selectedVersion?.is_active_version && (
                <Badge variant="default" className="bg-green-600 ml-2">Ativa</Badge>
              )}
              {!selectedVersion?.is_active_version && (
                <Badge variant="secondary" className="ml-2">Arquivada</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Aluno: {studentName} • {selectedVersion && format(new Date(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            {selectedVersion && (
              <ReportView
                studentData={{ name: studentName, date_of_birth: "" }}
                diagnosisData={selectedVersion.diagnosis_data || { interests: "", specialNeeds: "", barriers: [], history: "" }}
                planningData={selectedVersion.planning_data || { goals: [], accessibilityResources: [] }}
                referralsData={selectedVersion.evaluation_data || { referrals: [], observations: "" }}
                tenantId={tenantId}
                schoolId={schoolId}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

