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

const CreatePEI = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const peiId = searchParams.get("id");
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [studentData, setStudentData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  const [diagnosisData, setDiagnosisData] = useState({
    interests: "",
    specialNeeds: "",
    barriers: {
      arquitetonica: [] as string[],
      atitudinal: [] as string[],
      pedagogica: [] as string[],
      comunicacional: [] as string[],
      tecnologica: [] as string[],
      metodologica: [] as string[],
    },
    otherBarrier: "",
    history: "",
  });

  const [planningData, setPlanningData] = useState({ goals: [] });
  const [referralsData, setReferralsData] = useState({
    referrals: [] as string[],
    otherReferral: "",
    observations: "",
  });

  useEffect(() => {
    loadStudents();
    loadTenantInfo();
    if (peiId) loadPEI();
  }, [peiId]);

  const loadTenantInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.tenant_id) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("name")
          .eq("id", profile.tenant_id)
          .single();
        if (tenant) setTenantName(tenant.name);
      }
    } catch (error) {
      console.error("Error loading tenant info:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, tenant_id")
        .eq("id", user.id)
        .single<{ id: string; role: string; tenant_id: string }>();

      if (!profile) throw new Error("Perfil não encontrado");
      setUserRole(profile.role);

      if (profile.role === "teacher") {
        const { data, error } = await supabase
          .from("student_access")
          .select("student_id, students(name, id, date_of_birth)")
          .eq("user_id", profile.id);

        if (error) throw error;
        const studentsList = data?.map((item) => item.students).filter(Boolean) || [];
        setStudents(studentsList);
      } else {
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .order("name");

        if (error) throw error;
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

      setSelectedStudentId(data.student_id);
      setStudentData(data.students);
      setDiagnosisData(
        (data.diagnosis_data as any) || {
          interests: "",
          specialNeeds: "",
          barriers: {
            arquitetonica: [],
            atitudinal: [],
            pedagogica: [],
            comunicacional: [],
            tecnologica: [],
            metodologica: [],
          },
          otherBarrier: "",
          history: "",
        }
      );
      setPlanningData((data.planning_data as any) || { goals: [] });
      setReferralsData(
        (data.evaluation_data as any) || {
          referrals: [],
          otherReferral: "",
          observations: "",
        }
      );
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
        .select("id, role, tenant_id")
        .eq("id", user.id)
        .single<{ id: string; role: string; tenant_id: string }>();

      if (profileError) throw profileError;


      if (!profile) throw new Error("Perfil não encontrado");

      const peiData = {
        student_id: selectedStudentId,
        tenant_id: profile.tenant_id,
        created_by: user.id,
        assigned_teacher_id: profile.id,
        diagnosis_data: diagnosisData,
        planning_data: planningData,
        evaluation_data: referralsData,
        status: shouldSubmit ? ("pending" as const) : ("draft" as const),
      };

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
        const { error } = await supabase
          .from("peis")
          .update(peiData)
          .eq("id", peiId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("peis").insert([peiData]);
        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: shouldSubmit
          ? "PEI encaminhado para avaliação da Coordenação!"
          : "PEI salvo com sucesso!",
      });

      if (shouldSubmit) navigate("/dashboard");
    } catch (error) {
      console.error("Error saving PEI:", error);
      toast({
        title: "Erro",
        description: shouldSubmit
          ? "Não foi possível enviar o PEI para coordenação."
          : "Não foi possível salvar o PEI.",
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
              <h1 className="text-xl font-bold">{peiId ? "Editar PEI" : "Novo PEI"}</h1>
              {tenantName && (
                <p className="text-xs text-muted-foreground">{tenantName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {peiId && <PEIHistoryDialog peiId={peiId} />}
            <Button onClick={() => handleSave(false)} disabled={loading} variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
            <Button onClick={() => handleSave(true)} disabled={loading}>
              <Send className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Enviar para Coordenação</span>
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
                !!(diagnosisData.history ||
                  diagnosisData.interests ||
                  diagnosisData.specialNeeds)
              }
              planningFilled={planningData.goals.length > 0}
              referralsFilled={
                !!(
                  referralsData.referrals?.length > 0 ||
                  referralsData.observations
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
                onTemplateSelect={(template) => {
                  setDiagnosisData(template.diagnosisData);
                  setPlanningData(template.planningData);
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
              />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default CreatePEI;
