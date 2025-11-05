import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  User,
  Stethoscope,
  Target,
  Send,
  FileText,
} from "lucide-react";
import StudentIdentificationSection from "@/components/pei/StudentIdentificationSection";
import DiagnosisSection from "@/components/pei/DiagnosisSection";
import PlanningSection from "@/components/pei/PlanningSection";
import ReferralsSection from "@/components/pei/ReferralsSection";
import ReportView from "@/components/pei/ReportView";
import { PEIHistoryDialog } from "@/components/pei/PEIHistoryDialog";
import ProgressIndicator from "@/components/pei/ProgressIndicator";

// Tipos locais alinhados aos componentes
// DiagnosisSection
 type Barrier = {
  id?: string;
  barrier_type: string;
  description: string;
  severity?: 'leve' | 'moderada' | 'severa';
};

 type DiagnosisData = {
  interests: string;
  specialNeeds: string;
  barriers: Barrier[];
  history: string;
  cid10?: string;
  description?: string;
};

// PlanningSection
 type Goal = {
  id?: string;
  barrier_id?: string;
  category?: 'academic' | 'functional';
  description: string;
  target_date?: string;
  progress_level?: 'não iniciada' | 'em andamento' | 'parcialmente alcançada' | 'alcançada';
  progress_score?: number;
  notes?: string;
};

 type AccessibilityResource = {
  id?: string;
  resource_type: 'Libras' | 'Braille' | 'Tecnologia assistiva' | 'Material adaptado' | 'Apoio visual' | 'Tutor' | 'Outro';
  description: string;
  usage_frequency?: 'Diário' | 'Semanal' | 'Sob demanda' | 'Outro';
};

 type PlanningData = {
  goals: Goal[];
  accessibilityResources: AccessibilityResource[];
};

// ReferralsSection
 type PEIReferral = {
  id?: string;
  referred_to: string;
  reason?: string;
  date?: string;
  follow_up?: string;
};

 type ReferralsData = {
  referrals: PEIReferral[];
  observations: string;
};
const CreatePEI = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Aceita tanto 'pei' quanto 'id' para compatibilidade
  const peiId = searchParams.get("pei") || searchParams.get("id");
  // Aceita tanto 'student' quanto 'studentId' para compatibilidade
  const studentIdFromUrl = searchParams.get("student") || searchParams.get("studentId");
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [studentData, setStudentData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData>({
    interests: "",
    specialNeeds: "",
    barriers: [],
    history: "",
  });

  const [planningData, setPlanningData] = useState<PlanningData>({ goals: [], accessibilityResources: [] });
  const [referralsData, setReferralsData] = useState<ReferralsData>({
    referrals: [],
    observations: "",
  });

  useEffect(() => {
    loadStudents();
    loadTenantInfo();
    if (peiId) {
      loadPEI();
    }
  }, [peiId]);

  // Separar useEffect para lidar com studentId da URL após carregar os alunos
  useEffect(() => {
    if (studentIdFromUrl && students.length > 0) {
      console.log('🔍 Tentando selecionar aluno da URL:', {
        studentIdFromUrl,
        totalStudents: students.length,
        studentIds: students.map(s => s.id)
      });
      
      const student = students.find((s) => s.id === studentIdFromUrl);
      
      if (student) {
        console.log('✅ Aluno encontrado e selecionado:', student.name);
        setSelectedStudentId(studentIdFromUrl);
        setStudentData(student);
      } else {
        console.warn('⚠️ Aluno não encontrado na lista:', studentIdFromUrl);
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para criar PEI para este aluno. Solicite atribuição à coordenação.",
          variant: "destructive",
        });
        
        // Redirecionar para o dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    }
  }, [studentIdFromUrl, students, navigate, toast]);

  const loadTenantInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("tenant_id, school_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        return;
      }

      // Armazenar os IDs para passar ao ReportView
      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      }
      if (profile?.school_id) {
        setSchoolId(profile.school_id);
      }

      if (profile?.tenant_id) {
        const { data: tenant, error: tenantError } = await supabase
          .from("tenants")
          .select("network_name")
          .eq("id", profile.tenant_id)
          .maybeSingle();
        
        if (tenantError) {
          console.error("Error loading tenant:", tenantError);
          return;
        }
        
        if (tenant?.network_name) {
          setTenantName(tenant.network_name);
        }
      } else if (profile?.school_id) {
        // Se não tem tenant_id direto, buscar via escola
        const { data: school, error: schoolError } = await supabase
          .from("schools")
          .select("school_name, tenants(network_name)")
          .eq("id", profile.school_id)
          .maybeSingle();
        
        if (schoolError) {
          console.error("Error loading school:", schoolError);
          return;
        }
        
        if (school) {
          setTenantName(school.school_name);
        }
      }
    } catch (error) {
      console.error("Error loading tenant info:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar perfil sem user_roles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, tenant_id, school_id")
        .eq("id", user.id)
        .single<{ id: string; tenant_id: string; school_id: string | null }>();

      if (!profile) throw new Error("Perfil não encontrado");
      
      // Buscar role separadamente
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1);
      
      const primaryRole = userRoles?.[0]?.role || 'teacher';
      setUserRole(primaryRole);

      console.log('📚 Carregando alunos para role:', primaryRole);

      if (primaryRole === "teacher" || primaryRole === "aee_teacher") {
        // Buscar os IDs dos alunos com acesso
        const { data: accessData, error: accessError } = await supabase
          .from("student_access")
          .select("student_id")
          .eq("user_id", profile.id);

        if (accessError) throw accessError;
        
        console.log('👥 Alunos com acesso (student_access):', accessData?.length || 0);
        
        let studentIds: string[] = [];
        
        if (!accessData || accessData.length === 0) {
          console.warn('⚠️ Nenhum aluno em student_access, tentando via pei_teachers...');
          
          // FALLBACK: Buscar via pei_teachers
          const { data: peiTeachersData, error: peiTeachersError } = await supabase
            .from("pei_teachers")
            .select(`
              peis!inner (
                student_id,
                is_active_version
              )
            `)
            .eq("teacher_id", profile.id);
          
          if (peiTeachersError) throw peiTeachersError;
          
          if (peiTeachersData && peiTeachersData.length > 0) {
            // Extrair IDs únicos de alunos de PEIs ativos
            const studentIdsSet = new Set<string>();
            peiTeachersData.forEach((pt: any) => {
              const pei = pt.peis;
              if (pei && pei.is_active_version && pei.student_id) {
                studentIdsSet.add(pei.student_id);
              }
            });
            
            studentIds = Array.from(studentIdsSet);
            console.log('✅ Alunos encontrados via pei_teachers:', studentIds.length);
          }
          
          if (studentIds.length === 0) {
            console.warn('⚠️ Nenhum aluno atribuído ao professor (nem em student_access nem em pei_teachers)');
            toast({
              title: "Nenhum aluno atribuído",
              description: "Você não tem alunos atribuídos. Contate a coordenação.",
              variant: "destructive",
            });
            setStudents([]);
            return;
          }
        } else {
          studentIds = accessData.map(item => item.student_id);
        }

        // Buscar os dados completos dos alunos
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("id, name, date_of_birth, school_id, mother_name, father_name, phone, email")
          .in("id", studentIds)
          .order("name");

        if (studentsError) throw studentsError;
        
        console.log('✅ Alunos carregados:', studentsData?.length || 0, studentsData?.map(s => ({ id: s.id, name: s.name })));
        setStudents(studentsData || []);
      } else {
        // Para outros roles (coordinator, aee_teacher, etc), buscar alunos do tenant/escola
        const query = supabase
          .from("students")
          .select("*")
          .order("name");
        
        if (profile.school_id) {
          query.eq("school_id", profile.school_id);
        } else if (profile.tenant_id) {
          query.eq("tenant_id", profile.tenant_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        console.log('✅ Alunos carregados (gestor):', data?.length || 0);
        setStudents(data || []);
      }
    } catch (error) {
      console.error("Error loading students:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os alunos.",
        variant: "destructive",
      });
    }
  };

  const loadPEI = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("peis")
        .select("*, students(*)")
        .eq("id", peiId)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("PEI não encontrado");
      }

      setSelectedStudentId(data.student_id);
      setStudentData(data.students);
      
      // Diagnóstico com validação
      const diagnosisRaw = data.diagnosis_data as DiagnosisData | null;
      setDiagnosisData({
        interests: diagnosisRaw?.interests || "",
        specialNeeds: diagnosisRaw?.specialNeeds || "",
        barriers: diagnosisRaw?.barriers || [],
        history: diagnosisRaw?.history || "",
        cid10: diagnosisRaw?.cid10,
        description: diagnosisRaw?.description,
      });
      
      // Planejamento com validação
      const planningRaw = data.planning_data as PlanningData | null;
      setPlanningData({
        goals: planningRaw?.goals || [],
        accessibilityResources: planningRaw?.accessibilityResources || [],
      });
      
      // Encaminhamentos com validação
      const referralsRaw = data.evaluation_data as ReferralsData | null;
      setReferralsData({
        referrals: referralsRaw?.referrals || [],
        observations: referralsRaw?.observations || "",
      });
    } catch (error) {
      console.error("Error loading PEI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o PEI.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    const student = students.find((s) => s.id === studentId);
    setStudentData(student);
  };

  const handleSave = async (shouldSubmit: boolean = false) => {
    if (!selectedStudentId) {
      toast({
        title: "Atenção",
        description: "Selecione um aluno para continuar.",
        variant: "destructive",
      });
      return;
    }

    const isOnline = navigator.onLine;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar tenant e id do profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, tenant_id, school_id")
        .eq("id", user.id)
        .single<{ id: string; role: string; tenant_id: string; school_id: string | null }>();

      if (profileError) throw profileError;

      if (!profile) throw new Error("Perfil não encontrado");

      // Buscar school_id do aluno se não tiver no profile
      const studentSchoolId = studentData?.school_id || profile.school_id;
      
      if (!studentSchoolId) {
        throw new Error("Não foi possível determinar a escola do aluno");
      }

      // Coordenadores podem criar PEI sem professor atribuído (situações especiais)
      // Professores sempre são atribuídos a si mesmos
      const assignedTeacherId = (primaryRole === "coordinator" || primaryRole === "education_secretary") 
        ? null  // Coordenador pode criar sem atribuir professor
        : profile.id;  // Professor se auto-atribui
      
      console.log('🔧 Dados para salvar PEI:', {
        primaryRole,
        assignedTeacherId,
        studentSchoolId,
        profileTenantId: profile.tenant_id,
        userId: user.id,
        peiId
      });
      
      const peiData = {
        student_id: selectedStudentId,
        school_id: studentSchoolId,
        tenant_id: profile.tenant_id,
        created_by: user.id,
        assigned_teacher_id: assignedTeacherId,
        diagnosis_data: diagnosisData,
        planning_data: planningData,
        evaluation_data: referralsData,
        status: shouldSubmit ? ("pending" as const) : ("draft" as const),
        is_active_version: true,  // Marcar como versão ativa
      };
      
      console.log('📝 PEI Data completo:', peiData);

      if (!isOnline && !shouldSubmit) {
        const offlineKey = peiId
          ? `pei_offline_${peiId}`
          : `pei_offline_new_${selectedStudentId}`;
        localStorage.setItem(offlineKey, JSON.stringify(peiData));

        toast({
          title: "Salvo temporariamente",
          description:
            "PEI salvo localmente. Será sincronizado quando você estiver online.",
        });
        return;
      }

      if (peiId) {
        // Atualizar PEI existente
        const { error } = await supabase
          .from("peis")
          .update(peiData)
          .eq("id", peiId);
        if (error) throw error;
      } else {
        // ANTES DE CRIAR NOVO, verificar se aluno já tem PEI ativo
        const { data: existingActivePEI } = await supabase
          .from("peis")
          .select("id, status, version_number")
          .eq("student_id", selectedStudentId)
          .eq("is_active_version", true)
          .maybeSingle();
        
        if (existingActivePEI) {
          // Aluno já tem PEI ativo - redirecionar para editar
          toast({
            title: "PEI já existe",
            description: `Este aluno já possui um PEI ativo. Você será redirecionado para editá-lo.`,
          });
          
          setTimeout(() => {
            navigate(`/pei/edit?id=${existingActivePEI.id}`);
          }, 1500);
          return;
        }
        
        // Buscar próximo número de versão
        const { data: versionData } = await supabase
          .from("peis")
          .select("version_number")
          .eq("student_id", selectedStudentId)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const nextVersion = (versionData?.version_number || 0) + 1;
        
        // Criar novo PEI com versão correta
        const { error } = await supabase
          .from("peis")
          .insert([{
            ...peiData,
            version_number: nextVersion,
            is_active_version: true
          }]);
        
        if (error) throw error;
        
        console.log(`✅ PEI v${nextVersion} criado para o aluno`);
      }

      toast({
        title: "Sucesso",
        description: shouldSubmit
          ? "PEI encaminhado para avaliação da Coordenação!"
          : "PEI salvo com sucesso!",
      });

      if (shouldSubmit) navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving PEI:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast({
        title: "Erro",
        description: shouldSubmit
          ? `Não foi possível enviar o PEI: ${error.message}`
          : `Não foi possível salvar o PEI: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && peiId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{peiId ? "Editar PEI" : "Criar Novo PEI"}</h1>
              <div className="flex items-center gap-2">
                {tenantName && (
                  <p className="text-xs text-muted-foreground">{tenantName}</p>
                )}
                {!peiId && selectedStudentId && studentData && (
                  <>
                    {tenantName && <span className="text-xs text-muted-foreground">•</span>}
                    <p className="text-xs text-primary font-medium">
                      Para: {studentData.name}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {peiId && <PEIHistoryDialog peiId={peiId} />}
            <Button onClick={() => handleSave(false)} disabled={loading || !selectedStudentId} variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
            <Button onClick={() => handleSave(true)} disabled={loading || !selectedStudentId} size="sm">
              <Send className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Enviar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 print:px-0 print:py-0">
        <Card className="p-6 print:shadow-none print:border-0">
          <div className="sticky top-[73px] z-20 bg-card pb-4 -mt-6 -mx-6 px-6 pt-6 mb-4 border-b print:hidden">
            <ProgressIndicator
              studentSelected={!!selectedStudentId}
              diagnosisFilled={
                !!(diagnosisData?.history ||
                  diagnosisData?.interests ||
                  diagnosisData?.specialNeeds)
              }
              planningFilled={!!(planningData?.goals?.length > 0)}
              referralsFilled={
                !!(
                  referralsData?.referrals?.length > 0 ||
                  referralsData?.observations
                )
              }
            />
          </div>

          <Tabs defaultValue="identification" className="w-full">
            <div className="sticky top-[185px] z-20 bg-card -mx-6 px-6 mb-6 print:hidden">
              <TabsList className="grid w-full grid-cols-5 h-auto gap-0.5 bg-muted/50 p-1.5">
                <TabsTrigger value="identification">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline text-xs">Identificação</span>
                </TabsTrigger>
                <TabsTrigger value="diagnosis">
                  <Stethoscope className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline text-xs">Diagnóstico</span>
                </TabsTrigger>
                <TabsTrigger value="planning">
                  <Target className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline text-xs">Planejamento</span>
                </TabsTrigger>
                <TabsTrigger value="referrals">
                  <Send className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline text-xs">Encaminhamentos</span>
                </TabsTrigger>
                <TabsTrigger value="report">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline text-xs">Relatório</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="identification" className="mt-6">
              <StudentIdentificationSection
                students={students}
                selectedStudentId={selectedStudentId}
                studentData={studentData}
                onStudentChange={handleStudentChange}
                isEditMode={!!peiId}
                onTemplateSelect={(template: { diagnosisData: DiagnosisData; planningData: { goals: Goal[] }; referralsData: ReferralsData }) => {
                  setDiagnosisData(template.diagnosisData);
                  setPlanningData({ goals: template.planningData?.goals || [], accessibilityResources: [] });
                  setReferralsData(template.referralsData);
                }}
              />
            </TabsContent>

            <TabsContent value="diagnosis" className="mt-6">
              <DiagnosisSection
                diagnosisData={diagnosisData}
                onDiagnosisChange={setDiagnosisData}
              />
            </TabsContent>

            <TabsContent value="planning" className="mt-6">
              <PlanningSection
                planningData={planningData}
                diagnosisData={diagnosisData}
                barriers={diagnosisData.barriers}
                onPlanningChange={setPlanningData}
              />
            </TabsContent>

            <TabsContent value="referrals" className="mt-6">
              <ReferralsSection
                referralsData={referralsData}
                onReferralsChange={setReferralsData}
              />
            </TabsContent>

            <TabsContent value="report" className="mt-6">
              <ReportView
                studentData={studentData}
                diagnosisData={diagnosisData}
                planningData={planningData}
                referralsData={referralsData}
                userRole={userRole}
                tenantId={tenantId}
                schoolId={schoolId}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default CreatePEI;
