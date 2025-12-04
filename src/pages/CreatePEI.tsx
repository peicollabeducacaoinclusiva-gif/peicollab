import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { peiService } from "@/services/peiService";
import { auditMiddleware } from "@pei/database/audit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  Target,
  Lightbulb,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos
interface Student {
  id: string;
  name: string;
  date_of_birth?: string;
  school_id: string;
  tenant_id: string;
  mother_name?: string;
  father_name?: string;
  phone?: string;
  email?: string;
}

interface PEIData {
  student_id: string;
  school_id: string;
  tenant_id: string;
  assigned_teacher_id?: string;
  status: "draft" | "pending" | "approved" | "returned";
  diagnosis_data?: {
    interests?: string;
    specialNeeds?: string;
    barriers?: Array<{
      barrier_type: string;
      description: string;
      severity?: "leve" | "moderada" | "severa";
    }>;
    history?: string;
  };
  planning_data?: {
    goals?: Array<{
      description: string;
      category?: "academic" | "functional";
      target_date?: string;
      progress_level?: string;
    }>;
    accessibilityResources?: Array<{
      resource_type: string;
      description: string;
      usage_frequency?: string;
    }>;
  };
  evaluation_data?: Record<string, any>;
}

const CreatePEI = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const peiId = searchParams.get("pei") || searchParams.get("id");
  const studentIdFromUrl = searchParams.get("student") || searchParams.get("studentId");
  const { toast } = useToast();

  // Definir STEPS com tradução
  const STEPS = [
    { id: "student", label: t("pei.student"), icon: User },
    { id: "diagnosis", label: t("pei.diagnosis"), icon: FileText },
    { id: "planning", label: t("pei.planning"), icon: Target },
    { id: "review", label: t("pei.review"), icon: CheckCircle2 },
  ] as const;

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ tenant_id?: string; school_id?: string } | null>(null);
  
  // Dados do PEI
  const [peiData, setPeiData] = useState<PEIData>({
    student_id: "",
    school_id: "",
    tenant_id: "",
    status: "draft",
    diagnosis_data: {},
    planning_data: {},
  });

  // Verificar autenticação e carregar dados
  useEffect(() => {
    let subscription: any = null;
    let isMounted = true;

    const initialize = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          toast({
            title: "Autenticação necessária",
            description: "Você precisa estar autenticado para criar um PEI.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/auth"), 2000);
          return;
        }

        // Carregar perfil e role
        const [profileRes, rolesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, tenant_id, school_id")
            .eq("id", session.user.id)
            .single(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .limit(1),
        ]);

        if (profileRes.data) {
          setUserProfile(profileRes.data);
          setPeiData((prev) => ({
            ...prev,
            tenant_id: profileRes.data.tenant_id || "",
            school_id: profileRes.data.school_id || "",
          }));
        }

        if (rolesRes.data?.[0]) {
          setUserRole(rolesRes.data[0].role);
        }

        // Carregar alunos
        await loadStudents(session.user.id, profileRes.data, rolesRes.data?.[0]?.role);

        // Se há PEI ID, carregar dados existentes
        if (peiId) {
          await loadPEI(peiId);
        }
      } catch (error: any) {
        console.error("Erro ao inicializar:", error);
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro ao carregar os dados.",
          variant: "destructive",
        });
      }
    };

    initialize();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && isMounted) {
        navigate("/auth");
      }
    });
    subscription = authSub;

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [peiId, navigate, toast]);

  // Carregar alunos baseado no role
  const loadStudents = async (
    userId: string,
    profile: { tenant_id?: string; school_id?: string } | null,
    role?: string
  ) => {
    try {
      if (!profile) return;

      let query = supabase
        .from("students")
        .select("id, name, date_of_birth, school_id, tenant_id, mother_name, father_name, phone, email")
        .eq("is_active", true)
        .order("name");

      // Professores veem apenas alunos atribuídos
      if (role === "teacher" || role === "aee_teacher") {
        const { data: accessData } = await supabase
          .from("student_access")
          .select("student_id")
          .eq("user_id", userId);

        if (accessData && accessData.length > 0) {
          const studentIds = accessData.map((a) => a.student_id);
          query = query.in("id", studentIds);
        } else {
          // Fallback: buscar via pei_teachers
          const { data: peiTeachers } = await supabase
            .from("pei_teachers")
            .select("peis!inner(student_id, is_active_version)")
            .eq("teacher_id", userId);

          if (peiTeachers && peiTeachers.length > 0) {
            const studentIds = new Set<string>();
            peiTeachers.forEach((pt: any) => {
              if (pt.peis?.is_active_version && pt.peis?.student_id) {
                studentIds.add(pt.peis.student_id);
              }
            });
            if (studentIds.size > 0) {
              query = query.in("id", Array.from(studentIds));
            } else {
              setStudents([]);
              return;
            }
          } else {
            setStudents([]);
            return;
          }
        }
      } else {
        // Coordenador e outros: ver por tenant/escola
        if (profile.school_id) {
          query = query.eq("school_id", profile.school_id);
        } else if (profile.tenant_id) {
          query = query.eq("tenant_id", profile.tenant_id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setStudents(data || []);

      // Se há studentId na URL, selecionar automaticamente
      if (studentIdFromUrl && data?.some((s) => s.id === studentIdFromUrl)) {
        setPeiData((prev) => ({ ...prev, student_id: studentIdFromUrl }));
        const student = data.find((s) => s.id === studentIdFromUrl);
        if (student) {
          setPeiData((prev) => ({
            ...prev,
            school_id: student.school_id,
            tenant_id: student.tenant_id,
          }));
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar alunos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os alunos.",
        variant: "destructive",
      });
    }
  };

  // Carregar PEI existente
  const loadPEI = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("peis")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setPeiData({
          student_id: data.student_id,
          school_id: data.school_id,
          tenant_id: data.tenant_id,
          assigned_teacher_id: data.assigned_teacher_id,
          status: data.status,
          diagnosis_data: (data.diagnosis_data as any) || {},
          planning_data: (data.planning_data as any) || {},
          evaluation_data: (data.evaluation_data as any) || {},
        });

        // Gravar auditoria de leitura de PEI (dados sensíveis)
        if (data.tenant_id) {
          await auditMiddleware.logRead(
            data.tenant_id,
            'pei',
            id,
            {
              source: 'create_pei_page',
              action: 'view',
            }
          ).catch(err => console.error('Erro ao gravar auditoria de leitura de PEI:', err));
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar PEI:", error);
      
      // Reportar erro crítico ao carregar PEI
      if (typeof window !== 'undefined') {
        import('@/lib/errorReporting').then(({ reportPEIError }) => {
          const errorObj = error instanceof Error ? error : new Error(error?.message || 'Erro desconhecido');
          reportPEIError(errorObj, {
            operation: 'load',
            peiId: id,
          }).catch(err => console.error('Erro ao reportar erro de carregamento de PEI:', err));
        }).catch(err => console.error('Erro ao importar errorReporting:', err));
      }
      
      toast({
        title: "Erro",
        description: "Não foi possível carregar o PEI.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar rascunho
  const saveDraft = useCallback(async () => {
    if (!peiData.student_id || !peiData.school_id || !peiData.tenant_id) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um aluno antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const payload: any = {
        student_id: peiData.student_id,
        school_id: peiData.school_id,
        tenant_id: peiData.tenant_id,
        created_by: user.id,
        status: "draft",
        diagnosis_data: peiData.diagnosis_data,
        planning_data: peiData.planning_data,
        evaluation_data: peiData.evaluation_data,
      };

      if (peiData.assigned_teacher_id) {
        payload.assigned_teacher_id = peiData.assigned_teacher_id;
      }

      // Usar peiService para criar ou atualizar PEI
      let peiResult;
      if (peiId) {
        // Atualizar PEI existente usando peiService
        peiResult = await peiService.updatePEI(peiId, {
          status: payload.status,
          diagnosis_data: payload.diagnosis_data,
          planning_data: payload.planning_data,
          evaluation_data: payload.evaluation_data,
          assigned_teacher_id: payload.assigned_teacher_id,
        });
      } else {
        // Criar novo PEI usando peiService
        peiResult = await peiService.createPEI({
          student_id: payload.student_id,
          school_id: payload.school_id,
          tenant_id: payload.tenant_id,
          assigned_teacher_id: payload.assigned_teacher_id,
          status: payload.status,
          diagnosis_data: payload.diagnosis_data,
          planning_data: payload.planning_data,
          evaluation_data: payload.evaluation_data,
        });
      }

      toast({
        title: "Rascunho salvo",
        description: "Seu progresso foi salvo com sucesso.",
      });

      if (!peiId && peiResult) {
        navigate(`/pei/new?pei=${peiResult.id}`, { replace: true });
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o rascunho.",
        variant: "destructive",
      });
      
      // Reportar erro crítico (tentativa de salvar PEI)
      if (typeof window !== 'undefined') {
        import('@/lib/errorReporting').then(({ reportPEIError }) => {
          const errorObj = error instanceof Error ? error : new Error(error?.message || 'Erro desconhecido');
          reportPEIError(errorObj, {
            operation: peiId ? 'update' : 'create',
            peiId: peiId || undefined,
            studentId: peiData.student_id,
            tenantId: peiData.tenant_id,
          }).catch(err => console.error('Erro ao reportar erro de PEI:', err));
        }).catch(err => console.error('Erro ao importar errorReporting:', err));
      }
    } finally {
      setSaving(false);
    }
  }, [peiData, peiId, navigate, toast]);

  // Auto-save a cada 30 segundos
  useEffect(() => {
    if (!peiData.student_id) return;

    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [peiData.student_id, saveDraft]);

  // Calcular progresso
  const progress = (() => {
    let completed = 0;
    if (peiData.student_id) completed++;
    if (peiData.diagnosis_data?.interests || peiData.diagnosis_data?.specialNeeds) completed++;
    if (peiData.planning_data?.goals && peiData.planning_data.goals.length > 0) completed++;
    return (completed / 3) * 100;
  })();

  // Renderizar step atual
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StudentStep students={students} peiData={peiData} setPeiData={setPeiData} />;
      case 1:
        return <DiagnosisStep peiData={peiData} setPeiData={setPeiData} />;
      case 2:
        return <PlanningStep peiData={peiData} setPeiData={setPeiData} />;
      case 3:
        return <ReviewStep peiData={peiData} students={students} onSave={saveDraft} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                aria-label="Voltar para o dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Criar PEI</h1>
                <p className="text-sm text-muted-foreground">
                  {peiId ? "Editando PEI existente" : "Novo Plano Educacional Individualizado"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={saving || !peiData.student_id}
                aria-label="Salvar rascunho"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar rascunho
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 py-4" aria-label="Navegação de etapas">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isAccessible = index === 0 || (index === 1 && peiData.student_id) || 
                                   (index === 2 && peiData.diagnosis_data?.interests) ||
                                   (index === 3 && peiData.planning_data?.goals?.length);

              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && setCurrentStep(index)}
                  disabled={!isAccessible}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isActive && "bg-primary text-primary-foreground",
                    !isActive && isAccessible && "hover:bg-accent",
                    !isAccessible && "opacity-50 cursor-not-allowed"
                  )}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Etapa ${index + 1}: ${step.label}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{step.label}</span>
                  {isCompleted && <CheckCircle2 className="h-4 w-4 ml-1" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              aria-label="Etapa anterior"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              onClick={() => {
                if (currentStep < STEPS.length - 1) {
                  setCurrentStep(currentStep + 1);
                } else {
                  // Enviar para aprovação
                  // TODO: Implementar envio
                }
              }}
              disabled={
                (currentStep === 0 && !peiData.student_id) ||
                (currentStep === 1 && !peiData.diagnosis_data?.interests) ||
                (currentStep === 2 && !peiData.planning_data?.goals?.length)
              }
              aria-label={currentStep === STEPS.length - 1 ? "Enviar para aprovação" : "Próxima etapa"}
            >
              {currentStep === STEPS.length - 1 ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para aprovação
                </>
              ) : (
                <>
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente: Seleção de Aluno
const StudentStep = ({
  students,
  peiData,
  setPeiData,
}: {
  students: Student[];
  peiData: PEIData;
  setPeiData: (data: PEIData | ((prev: PEIData) => PEIData)) => void;
}) => {
  const selectedStudent = students.find((s) => s.id === peiData.student_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecionar Aluno</CardTitle>
        <CardDescription>
          Escolha o aluno para o qual você está criando o Plano Educacional Individualizado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {students.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum aluno disponível. Entre em contato com a coordenação para atribuir alunos.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="student-select">Aluno *</Label>
              <Select
                value={peiData.student_id}
                onValueChange={(value) => {
                  const student = students.find((s) => s.id === value);
                  if (student) {
                    setPeiData({
                      ...peiData,
                      student_id: value,
                      school_id: student.school_id,
                      tenant_id: student.tenant_id,
                    });
                  }
                }}
              >
                <SelectTrigger id="student-select" aria-label="Selecionar aluno">
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                      {student.date_of_birth && (
                        <span className="text-muted-foreground ml-2">
                          ({new Date(student.date_of_birth).getFullYear()})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Informações do Aluno</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Nome:</span> {selectedStudent.name}
                    </div>
                    {selectedStudent.date_of_birth && (
                      <div>
                        <span className="font-medium">Data de Nascimento:</span>{" "}
                        {new Date(selectedStudent.date_of_birth).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                    {selectedStudent.mother_name && (
                      <div>
                        <span className="font-medium">Mãe:</span> {selectedStudent.mother_name}
                      </div>
                    )}
                    {selectedStudent.father_name && (
                      <div>
                        <span className="font-medium">Pai:</span> {selectedStudent.father_name}
                      </div>
                    )}
                    {selectedStudent.phone && (
                      <div>
                        <span className="font-medium">Telefone:</span> {selectedStudent.phone}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Componente: Diagnóstico
const DiagnosisStep = ({
  peiData,
  setPeiData,
}: {
  peiData: PEIData;
  setPeiData: (data: PEIData | ((prev: PEIData) => PEIData)) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnóstico</CardTitle>
        <CardDescription>
          Descreva os interesses, necessidades especiais e barreiras identificadas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="interests">Interesses do Aluno *</Label>
          <Textarea
            id="interests"
            placeholder="Descreva os principais interesses do aluno..."
            value={peiData.diagnosis_data?.interests || ""}
            onChange={(e) =>
              setPeiData({
                ...peiData,
                diagnosis_data: {
                  ...peiData.diagnosis_data,
                  interests: e.target.value,
                },
              })
            }
            rows={4}
            aria-describedby="interests-help"
          />
          <p id="interests-help" className="text-sm text-muted-foreground">
            Quais são os principais interesses e motivações do aluno?
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialNeeds">Necessidades Especiais *</Label>
          <Textarea
            id="specialNeeds"
            placeholder="Descreva as necessidades especiais identificadas..."
            value={peiData.diagnosis_data?.specialNeeds || ""}
            onChange={(e) =>
              setPeiData({
                ...peiData,
                diagnosis_data: {
                  ...peiData.diagnosis_data,
                  specialNeeds: e.target.value,
                },
              })
            }
            rows={4}
            aria-describedby="specialNeeds-help"
          />
          <p id="specialNeeds-help" className="text-sm text-muted-foreground">
            Quais necessidades especiais foram identificadas?
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="history">Histórico</Label>
          <Textarea
            id="history"
            placeholder="Descreva o histórico relevante do aluno..."
            value={peiData.diagnosis_data?.history || ""}
            onChange={(e) =>
              setPeiData({
                ...peiData,
                diagnosis_data: {
                  ...peiData.diagnosis_data,
                  history: e.target.value,
                },
              })
            }
            rows={4}
            aria-describedby="history-help"
          />
          <p id="history-help" className="text-sm text-muted-foreground">
            Informações relevantes sobre o histórico do aluno.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente: Planejamento
const PlanningStep = ({
  peiData,
  setPeiData,
}: {
  peiData: PEIData;
  setPeiData: (data: PEIData | ((prev: PEIData) => PEIData)) => void;
}) => {
  const [newGoal, setNewGoal] = useState("");

  const addGoal = () => {
    if (!newGoal.trim()) return;

    setPeiData({
      ...peiData,
      planning_data: {
        ...peiData.planning_data,
        goals: [
          ...(peiData.planning_data?.goals || []),
          {
            description: newGoal,
            category: "academic" as const,
            progress_level: "não iniciada",
          },
        ],
      },
    });
    setNewGoal("");
  };

  const removeGoal = (index: number) => {
    const goals = peiData.planning_data?.goals || [];
    setPeiData({
      ...peiData,
      planning_data: {
        ...peiData.planning_data,
        goals: goals.filter((_, i) => i !== index),
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planejamento</CardTitle>
        <CardDescription>
          Defina as metas e objetivos para o aluno.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="new-goal">Nova Meta</Label>
          <div className="flex gap-2">
            <Input
              id="new-goal"
              placeholder="Descreva uma meta..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              aria-label="Adicionar nova meta"
            />
            <Button onClick={addGoal} aria-label="Adicionar meta">
              Adicionar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Metas Definidas</Label>
          {peiData.planning_data?.goals && peiData.planning_data.goals.length > 0 ? (
            <div className="space-y-2">
              {peiData.planning_data.goals.map((goal, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <p className="flex-1">{goal.description}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGoal(index)}
                        aria-label={`Remover meta ${index + 1}`}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma meta definida ainda. Adicione pelo menos uma meta para continuar.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente: Revisão
const ReviewStep = ({
  peiData,
  students,
  onSave,
}: {
  peiData: PEIData;
  students: Student[];
  onSave: () => void;
}) => {
  const selectedStudent = students.find((s) => s.id === peiData.student_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisão Final</CardTitle>
        <CardDescription>
          Revise todas as informações antes de enviar para aprovação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Aluno Selecionado</h3>
          <p>{selectedStudent?.name || "Não selecionado"}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Diagnóstico</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Interesses:</span>{" "}
              {peiData.diagnosis_data?.interests || "Não preenchido"}
            </p>
            <p>
              <span className="font-medium">Necessidades:</span>{" "}
              {peiData.diagnosis_data?.specialNeeds || "Não preenchido"}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Metas</h3>
          {peiData.planning_data?.goals && peiData.planning_data.goals.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {peiData.planning_data.goals.map((goal, index) => (
                <li key={index}>{goal.description}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nenhuma meta definida</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePEI;
