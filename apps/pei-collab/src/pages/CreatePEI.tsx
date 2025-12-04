import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  User,
  Stethoscope,
  Target,
  Send,
  FileText,
  Lightbulb,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import StudentIdentificationSection from "@/components/pei/StudentIdentificationSection";
import StudentContextSection from "@/components/pei/StudentContextSection";
import DiagnosisSection from "@/components/pei/DiagnosisSection";
import PlanningSection from "@/components/pei/PlanningSection";
import ReferralsSection from "@/components/pei/ReferralsSection";
import EvaluationSection from "@/components/pei/EvaluationSection";
import BarrierAdaptationsSection from "@/components/pei/BarrierAdaptationsSection";
import ReportView from "@/components/pei/ReportView";
import { PEIHistoryDialog } from "@/components/pei/PEIHistoryDialog";
import { StudentContextData } from "@/types/pei";
import { UserSelector } from "@/components/shared/UserSelector";

 type Barrier = {
  id?: string;
  barrier_type: string;
  description: string;
  severity?: "leve" | "moderada" | "severa";
};

 type DiagnosisData = {
  interests: string;
  specialNeeds: string;
  barriers: Barrier[];
  history: string;
  cid10?: string;
  description?: string;
};

 type Goal = {
  id?: string;
  barrier_id?: string;
  category?: "academic" | "functional";
  description: string;
  target_date?: string;
  progress_level?: "não iniciada" | "em andamento" | "parcialmente alcançada" | "alcançada";
  progress_score?: number;
  notes?: string;
};

 type AccessibilityResource = {
  id?: string;
  resource_type:
    | "Libras"
    | "Braille"
    | "Tecnologia assistiva"
    | "Material adaptado"
    | "Apoio visual"
    | "Tutor"
    | "Outro";
  description: string;
  usage_frequency?: "Diário" | "Semanal" | "Sob demanda" | "Outro";
};

 type PlanningData = {
  goals: Goal[];
  accessibilityResources: AccessibilityResource[];
};

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

type AIGeneratedInsights = {
  referrals?: Array<{
    service?: string;
    service_type?: string;
    type?: string;
    reason?: string;
    description?: string;
    priority?: string;
    follow_up?: string;
    recommended_professional?: string;
    observations?: string;
  }>;
  generalObservations?: string[];
  communicationGuidelines?: string[];
  crisisStrategies?: string[];
  medicationNotes?: string;
  familyCommunication?: string;
};

type ReviewChecklist = {
  identificationConfirmed: boolean;
  documentsAttached: boolean;
  strategiesAligned: boolean;
  guardiansInformed: boolean;
};

type EvaluationData = {
  observations?: string;
  progress?: string;
  review_date?: string;
  last_review_date?: string;
  next_review_date?: string;
  overall_progress?: "insatisfatório" | "regular" | "bom" | "excelente";
  goals_evaluation?: string;
  family_feedback?: string;
  adjustments_needed?: string;
  evaluation_criteria?: {
    progress_indicators?: string[];
    examples?: string[];
    measurement_methods?: string[];
  };
  progress_recording?: {
    frequency?: "bimestral" | "trimestral" | "semestral" | "anual";
    format?: "descriptive" | "quantitative" | "mixed";
    responsible?: string;
    next_report_date?: string;
    last_report_date?: string;
  };
  pei_review?: {
    review_frequency?: string;
    review_process?: string;
    participants?: string[];
    last_review_meeting?: string;
    next_review_meeting?: string;
    reformulation_needed?: boolean;
    reformulation_reason?: string;
  };
  signatures?: Array<{
    name: string;
    role: string;
    signature_date?: string;
    cpf?: string;
    registration?: string;
  }>;
  review_checklist?: ReviewChecklist;
  final_comments?: string;
  digital_signature?: string;
};

const defaultDiagnosis: DiagnosisData = {
  interests: "",
  specialNeeds: "",
  barriers: [],
  history: "",
};

const defaultPlanning: PlanningData = {
  goals: [],
  accessibilityResources: [],
};

const defaultReferrals: ReferralsData = {
  referrals: [],
  observations: "",
};

const defaultReviewChecklist: ReviewChecklist = {
  identificationConfirmed: false,
  documentsAttached: false,
  strategiesAligned: false,
  guardiansInformed: false,
};

const CreatePEI = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const peiId = searchParams.get("pei") || searchParams.get("id");
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
  const [assignedTeacherId, setAssignedTeacherId] = useState<string>("");

  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData>(defaultDiagnosis);
  const [planningData, setPlanningData] = useState<PlanningData>(defaultPlanning);
  const [referralsData, setReferralsData] = useState<ReferralsData>(defaultReferrals);
  const [evaluationData, setEvaluationData] = useState<EvaluationData>({});
  const [studentContextData, setStudentContextData] = useState<StudentContextData>({});
  const [reviewChecklist, setReviewChecklist] =
    useState<ReviewChecklist>(defaultReviewChecklist);
  const [finalComments, setFinalComments] = useState("");
  const [digitalSignature, setDigitalSignature] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [aiChecklistHints, setAiChecklistHints] = useState<Record<keyof ReviewChecklist, string[]>>({
  identificationConfirmed: [],
  documentsAttached: [],
  strategiesAligned: [],
  guardiansInformed: [],
});

  const mergeText = (current?: string, addition?: string) => {
    const currentTrimmed = current?.trim();
    const additionTrimmed = addition?.trim();
    if (!additionTrimmed) return currentTrimmed || "";
    if (!currentTrimmed) return additionTrimmed;
    if (currentTrimmed.includes(additionTrimmed)) return currentTrimmed;
    return `${currentTrimmed}\n\n${additionTrimmed}`;
  };

  const listToText = (entries?: string[]) => {
    if (!entries || entries.length === 0) return "";
    const cleaned = entries
      .map((entry) => entry?.trim())
      .filter((entry): entry is string => Boolean(entry));
    return cleaned.join("\n");
  };

  const handleAIGeneratedInsights = (insights: AIGeneratedInsights) => {
    const mappedReferrals: PEIReferral[] = Array.isArray(insights.referrals)
      ? (insights.referrals
          .map((item) => {
            const referred =
              item.service ||
              item.service_type ||
              item.type ||
              item.recommended_professional ||
              "";
            const reason = item.reason || item.description || "";
            if (!referred && !reason) return undefined;
            return {
              referred_to: referred || "Encaminhamento",
              reason,
              follow_up: item.follow_up || "",
            };
          })
          .filter(Boolean) as PEIReferral[])
      : [];

    const observationsText = listToText(insights.generalObservations);

    if (mappedReferrals.length > 0 || observationsText) {
      setReferralsData((prev) => {
        const combinedReferrals = mappedReferrals.length
          ? [...(prev.referrals || []), ...mappedReferrals]
          : prev.referrals || [];

        const uniqueReferrals: PEIReferral[] = [];
        const seen = new Set<string>();
        combinedReferrals.forEach((referral) => {
          const key = `${(referral.referred_to || "").trim().toLowerCase()}|${(referral.reason || "")
            .trim()
            .toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueReferrals.push(referral);
          }
        });

        const newObservations = mergeText(prev.observations, observationsText);
        const hasReferralsChange = uniqueReferrals.length !== (prev.referrals || []).length;
        const hasObservationChange =
          newObservations.trim() !== (prev.observations || "").trim();

        if (!hasReferralsChange && !hasObservationChange) {
          return prev;
        }

        return {
          referrals: uniqueReferrals,
          observations: newObservations,
        };
      });
    }

    const guidelinesText = listToText(insights.communicationGuidelines);
    const crisisText = listToText(insights.crisisStrategies);
    const adjustmentsSegments: string[] = [];
    if (guidelinesText) {
      adjustmentsSegments.push(
        `Orientações de comunicação:\n${guidelinesText}`,
      );
    }
    if (crisisText) {
      adjustmentsSegments.push(
        `Estratégias para momentos críticos:\n${crisisText}`,
      );
    }
    const adjustmentsText = adjustmentsSegments.join("\n\n");
    const medicationText = insights.medicationNotes
      ? `Observações sobre medicação: ${insights.medicationNotes.trim()}`
      : "";
    const familyText = insights.familyCommunication?.trim() || "";

    if (
      !observationsText &&
      !adjustmentsText &&
      !medicationText &&
      !familyText
    ) {
      return;
    }

    setEvaluationData((prev) => {
      const next = { ...prev };
      let changed = false;

      if (observationsText) {
        const merged = mergeText(prev.observations, observationsText);
        if (merged !== (prev.observations || "").trim()) {
          next.observations = merged;
          changed = true;
        }
      }

      if (adjustmentsText) {
        const merged = mergeText(prev.adjustments_needed, adjustmentsText);
        if (merged !== (prev.adjustments_needed || "").trim()) {
          next.adjustments_needed = merged;
          changed = true;
        }
      }

      if (medicationText) {
        const merged = mergeText(prev.goals_evaluation, medicationText);
        if (merged !== (prev.goals_evaluation || "").trim()) {
          next.goals_evaluation = merged;
          changed = true;
        }
      }

      if (familyText) {
        const merged = mergeText(prev.family_feedback, familyText);
        if (merged !== (prev.family_feedback || "").trim()) {
          next.family_feedback = merged;
          changed = true;
        }
      }

      return changed ? next : prev;
    });

    const addedFlags: Partial<Record<keyof ReviewChecklist, boolean>> = {};

    setAiChecklistHints((prev) => {
      const next: Record<keyof ReviewChecklist, string[]> = {
        identificationConfirmed: [...prev.identificationConfirmed],
        documentsAttached: [...prev.documentsAttached],
        strategiesAligned: [...prev.strategiesAligned],
        guardiansInformed: [...prev.guardiansInformed],
      };

      const addHint = (target: keyof ReviewChecklist, value: string | undefined) => {
        if (!value) return;
        const trimmed = value.trim();
        if (!trimmed) return;
        if (!next[target].includes(trimmed)) {
          next[target].push(trimmed);
          addedFlags[target] = true;
        }
      };

      addHint("identificationConfirmed", observationsText);
      addHint("strategiesAligned", adjustmentsText);
      addHint("strategiesAligned", crisisText);
      addHint("documentsAttached", medicationText);
      addHint("guardiansInformed", guidelinesText);
      addHint("guardiansInformed", familyText);

      return next;
    });

    if (Object.keys(addedFlags).length > 0) {
      setReviewChecklist((prev) => {
        let changed = false;
        const next: ReviewChecklist = { ...prev };
        (Object.keys(addedFlags) as Array<keyof ReviewChecklist>).forEach((key) => {
          if (addedFlags[key] && prev[key]) {
            next[key] = false;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  };

  useEffect(() => {
    loadStudents();
    loadTenantInfo();
    if (peiId) {
      loadPEI();
    }
  }, [peiId]);

  useEffect(() => {
    if (studentIdFromUrl && students.length > 0) {
      const student = students.find((s) => s.id === studentIdFromUrl);
      if (student) {
        setSelectedStudentId(studentIdFromUrl);
        setStudentData(student);
      } else {
        toast({
          title: "Acesso negado",
          description:
            "Você não tem permissão para criar PEI para este aluno. Solicite atribuição à coordenação.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    }
  }, [studentIdFromUrl, students, navigate, toast]);

  const wizardSteps = [
    {
      id: "identification",
      title: "Identificação",
      description: "Dados do aluno, família e contexto escolar",
      icon: <User className="h-5 w-5" />,
    },
    {
      id: "assessment",
      title: "Avaliação",
      description: "Repertório atual, necessidades e barreiras",
      icon: <Stethoscope className="h-5 w-5" />,
    },
    {
      id: "planning",
      title: "Planejamento",
      description: "Metas SMART, estratégias e recursos",
      icon: <Target className="h-5 w-5" />,
    },
    {
      id: "review",
      title: "Revisão",
      description: "Checklist, assinatura e submissão",
      icon: <FileText className="h-5 w-5" />,
    },
  ] as const;

  const identificationComplete = !!selectedStudentId;
  const assessmentComplete = useMemo(
    () =>
      Boolean(
        diagnosisData.history ||
          diagnosisData.interests ||
          diagnosisData.specialNeeds ||
          diagnosisData.barriers.length > 0,
      ),
    [diagnosisData],
  );
  const planningComplete = useMemo(
    () =>
      Boolean(
        planningData.goals.length > 0 ||
          planningData.accessibilityResources.length > 0 ||
          referralsData.referrals.length > 0 ||
          referralsData.observations.trim().length > 0,
      ),
    [planningData, referralsData],
  );
  const reviewComplete = useMemo(
    () =>
      Object.values(reviewChecklist).every(Boolean) && digitalSignature.trim().length > 0,
    [reviewChecklist, digitalSignature],
  );

  const getStepCompletion = (index: number) => {
    switch (index) {
      case 0:
        return identificationComplete;
      case 1:
        return assessmentComplete;
      case 2:
        return planningComplete;
      case 3:
        return reviewComplete;
      default:
        return false;
    }
  };

  const canNavigateTo = (index: number) => {
    if (index <= currentStep) return true;
    return wizardSteps
      .slice(0, index)
      .every((_, stepIndex) => getStepCompletion(stepIndex));
  };

  const handleStepChange = (index: number) => {
    if (canNavigateTo(index)) {
      setCurrentStep(index);
    } else {
      toast({
        title: "Finalize a etapa anterior",
        description:
          "Complete as informações obrigatórias antes de avançar para o próximo passo.",
        variant: "destructive",
      });
    }
  };

  const handleNextStep = () => {
    if (!getStepCompletion(currentStep)) {
      toast({
        title: "Informações incompletas",
        description:
          "Preencha os campos obrigatórios desta etapa antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleChecklistChange = (field: keyof ReviewChecklist, value: boolean) => {
    setReviewChecklist((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAISuggestion = (context: string) => {
    toast({
      title: "Assistente IA",
      description: `Sugestões inteligentes geradas para ${context}. Ajuste conforme necessidade do aluno.`,
    });
  };

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

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      } else {
        setTenantId(null);
      }

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
      } else {
        setSchoolId(null);
      }

      if (profile?.tenant_id) {
        const { data: tenant, error: tenantError } = await supabase
          .from("tenants")
          .select("network_name")
          .eq("id", profile.tenant_id)
          .maybeSingle();
        
        if (!tenantError && tenant?.network_name) {
          setTenantName(tenant.network_name);
        }
      } else if (profile?.school_id) {
        setSchoolId(profile.school_id);
        const { data: school, error: schoolError } = await supabase
          .from("schools")
          .select("school_name, tenants(network_name)")
          .eq("id", profile.school_id)
          .maybeSingle();
        
        if (!schoolError && school) {
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, tenant_id, school_id")
        .eq("id", user.id)
        .single<{ id: string; tenant_id: string; school_id: string | null }>();

      if (profileError || !profile) throw profileError || new Error("Perfil não encontrado");
      
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1);
      
      const primaryRole = userRoles?.[0]?.role || "teacher";
      setUserRole(primaryRole);

      if (primaryRole === "teacher" || primaryRole === "aee_teacher") {
        const { data: accessData, error: accessError } = await supabase
          .from("student_access")
          .select("student_id")
          .eq("user_id", profile.id);

        if (accessError) throw accessError;
        
        let studentIds =
          accessData && accessData.length > 0
            ? accessData.map((item) => item.student_id)
            : [];

        if (studentIds.length === 0) {
          const { data: peiTeachersData, error: peiTeachersError } = await supabase
            .from("pei_teachers")
            .select(
              `
              peis!inner (
                student_id,
                is_active_version
              )
            `,
            )
            .eq("teacher_id", profile.id);
          
          if (peiTeachersError) throw peiTeachersError;
          
          if (peiTeachersData && peiTeachersData.length > 0) {
            const studentSet = new Set<string>();
            peiTeachersData.forEach((pt: any) => {
              const pei = pt.peis;
              if (pei?.is_active_version && pei.student_id) {
                studentSet.add(pei.student_id);
              }
            });
            studentIds = Array.from(studentSet);
          }
          
          if (studentIds.length === 0) {
            toast({
              title: "Nenhum aluno atribuído",
              description: "Você não tem alunos atribuídos. Contate a coordenação.",
              variant: "destructive",
            });
            setStudents([]);
            return;
          }
        }

        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select(
            "id, name, date_of_birth, school_id, tenant_id, mother_name, father_name, phone, email, enrollment, schools:schools(school_name, shift)"
          )
          .in("id", studentIds)
          .order("name");

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);
      } else {
        const query = supabase
          .from("students")
          .select(
            "id, name, date_of_birth, school_id, tenant_id, mother_name, father_name, phone, email, enrollment, schools:schools(school_name, shift)"
          )
          .order("name");
        
        if (profile.school_id) {
          query.eq("school_id", profile.school_id);
        } else if (profile.tenant_id) {
          query.eq("tenant_id", profile.tenant_id);
        }

        const { data, error } = await query;
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
        .select(
          "id, student_id, tenant_id, school_id, assigned_teacher_id, student_context_data, diagnosis_data, planning_data, evaluation_data",
        )
        .eq("id", peiId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("PEI não encontrado");

      setSelectedStudentId(data.student_id);
      if (data.tenant_id) setTenantId(data.tenant_id);
      if (data.school_id) setSchoolId(data.school_id);

      if (data.student_id) {
        const { data: studentRecord } = await supabase
          .from("students")
          .select(
            "id, name, date_of_birth, school_id, tenant_id, mother_name, father_name, phone, email, enrollment, schools:schools(school_name, shift)"
          )
          .eq("id", data.student_id)
          .maybeSingle();

        setStudentData(studentRecord || null);
      } else {
        setStudentData(null);
      }

      if (data.assigned_teacher_id) {
        setAssignedTeacherId(data.assigned_teacher_id);
      }
      
      setStudentContextData((data.student_context_data as StudentContextData) || {});
      setDiagnosisData((data.diagnosis_data as DiagnosisData) || defaultDiagnosis);
      setPlanningData((data.planning_data as PlanningData) || defaultPlanning);

      const evaluationRaw = (data.evaluation_data as EvaluationData) || {};
      setEvaluationData({
        observations: evaluationRaw?.observations || "",
        progress: evaluationRaw?.progress || "",
        review_date: evaluationRaw?.review_date,
        last_review_date: evaluationRaw?.last_review_date,
        next_review_date: evaluationRaw?.next_review_date,
        overall_progress: evaluationRaw?.overall_progress,
        goals_evaluation: evaluationRaw?.goals_evaluation || "",
        family_feedback: evaluationRaw?.family_feedback || "",
        adjustments_needed: evaluationRaw?.adjustments_needed || "",
        evaluation_criteria: evaluationRaw?.evaluation_criteria,
        progress_recording: evaluationRaw?.progress_recording,
        pei_review: evaluationRaw?.pei_review,
        signatures: evaluationRaw?.signatures,
      });
      
      const referralsRaw = evaluationRaw as any;
      setReferralsData({
        referrals: referralsRaw?.referrals || [],
        observations: referralsRaw?.observations || evaluationRaw?.observations || "",
      });

      const reviewRaw = evaluationRaw?.review_checklist as Partial<ReviewChecklist>;
      setReviewChecklist({
        identificationConfirmed: !!reviewRaw?.identificationConfirmed,
        documentsAttached: !!reviewRaw?.documentsAttached,
        strategiesAligned: !!reviewRaw?.strategiesAligned,
        guardiansInformed: !!reviewRaw?.guardiansInformed,
      });
      setFinalComments(evaluationRaw?.final_comments || "");
      setDigitalSignature(evaluationRaw?.digital_signature || "");
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, tenant_id, school_id")
        .eq("id", user.id)
        .single<{ id: string; role: string; tenant_id: string; school_id: string | null }>();

      if (profileError || !profile) throw profileError || new Error("Perfil não encontrado");

      const studentSchoolId = studentData?.school_id || profile.school_id;
      if (!studentSchoolId) throw new Error("Não foi possível determinar a escola do aluno");

      const finalAssignedTeacherId =
        assignedTeacherId || (userRole === "teacher" ? profile.id : null);
      
      const peiData = {
        student_id: selectedStudentId,
        school_id: studentSchoolId,
        tenant_id: profile.tenant_id,
        created_by: user.id,
        assigned_teacher_id: finalAssignedTeacherId,
        student_context_data: studentContextData,
        diagnosis_data: diagnosisData,
        planning_data: planningData,
        evaluation_data: {
          ...evaluationData,
          final_comments: finalComments,
          digital_signature: digitalSignature,
          review_checklist: reviewChecklist,
          referrals: referralsData.referrals,
          observations: evaluationData.observations || referralsData.observations,
        },
        status: shouldSubmit ? ("pending" as const) : ("draft" as const),
        is_active_version: true,
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
        const { error } = await supabase.from("peis").update(peiData).eq("id", peiId);
        if (error) throw error;
      } else {
        const { data: existingActivePEI } = await supabase
          .from("peis")
          .select("id, status, version_number")
          .eq("student_id", selectedStudentId)
          .eq("is_active_version", true)
          .maybeSingle();
        
        if (existingActivePEI) {
          toast({
            title: "PEI já existe",
            description:
              "Este aluno já possui um PEI ativo. Você será redirecionado para editá-lo.",
          });
          setTimeout(() => {
            navigate(`/pei/edit?id=${existingActivePEI.id}`);
          }, 1500);
          return;
        }
        
        const { data: versionData } = await supabase
          .from("peis")
          .select("version_number")
          .eq("student_id", selectedStudentId)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const nextVersion = (versionData?.version_number || 0) + 1;
        
        const { error } = await supabase.from("peis").insert([
          {
            ...peiData,
            version_number: nextVersion,
            is_active_version: true,
          },
        ]);
        if (error) throw error;
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

  const handleSubmit = () => {
    if (!reviewComplete) {
      setCurrentStep(3);
      toast({
        title: "Checklist pendente",
        description:
          "Confirme todos os itens da revisão e registre a assinatura digital antes de enviar.",
        variant: "destructive",
      });
      return;
    }
    handleSave(true);
  };

  const renderSupportResources = (
    resources: Array<{
      emoji: string;
      title: string;
      description: string;
      onAction?: () => void;
      actionLabel?: string;
    }>,
  ) => (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Ferramentas de apoio
        </CardTitle>
        <CardDescription>
          Utilize recursos curados pela rede para acelerar o preenchimento e garantir qualidade pedagógica.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {resources.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border bg-muted/30 p-3 transition hover:border-primary/50"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none">{item.emoji}</span>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {item.onAction && item.actionLabel && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs"
                    onClick={item.onAction}
                  >
                    <Sparkles className="mr-2 h-3 w-3" />
                    {item.actionLabel}
            </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
              <StudentIdentificationSection
                students={students}
                selectedStudentId={selectedStudentId}
                studentData={studentData}
                onStudentChange={handleStudentChange}
                isEditMode={!!peiId}
              onTemplateSelect={(template: {
                diagnosisData: DiagnosisData;
                planningData: { goals: Goal[] };
                referralsData: ReferralsData;
              }) => {
                  setDiagnosisData(template.diagnosisData);
                setPlanningData({
                  goals: template.planningData?.goals || [],
                  accessibilityResources: [],
                });
                  setReferralsData(template.referralsData);
                }}
              />

              {selectedStudentId && studentData && (
                <Card className="p-6">
                <CardHeader className="px-0 pt-0 pb-3">
                  <CardTitle className="text-base">Professor responsável</CardTitle>
                  <CardDescription>
                    Defina quem irá acompanhar o PEI. Professores são atribuídos automaticamente, mas é
                    possível delegar a outro profissional autorizado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-3">
                  <UserSelector
                    value={assignedTeacherId}
                    onChange={(id) => setAssignedTeacherId(id)}
                    roleFilter={["teacher", "aee_teacher"]}
                    schoolFilter={studentData.school_id}
                    label="Professor Responsável (opcional)"
                    required={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    {userRole === "teacher"
                      ? "Como professor, você será atribuído automaticamente se não selecionar outro." 
                      : "Coordenadores podem designar o professor responsável agora ou posteriormente."}
                  </p>
                </CardContent>
                </Card>
              )}

              {selectedStudentId && studentData && (
                <StudentContextSection
                  contextData={studentContextData}
                  onContextChange={setStudentContextData}
                studentAge={
                  studentData.date_of_birth
                    ? Math.floor(
                        (Date.now() - new Date(studentData.date_of_birth).getTime()) /
                          (1000 * 60 * 60 * 24 * 365.25),
                      )
                    : undefined
                }
                studentEnrollment={
                  studentData.enrollment
                    ? {
                    grade: studentData.enrollment.grade,
                    class_name: studentData.enrollment.class_name,
                    enrollment_date: studentData.enrollment.enrollment_date,
                      }
                    : undefined
                }
              />
            )}

            {renderSupportResources([
              {
                emoji: "📋",
                title: "Modelos de identificação",
                description: "Use templates aprovados para garantir consistência e conformidade.",
                onAction: () => handleAISuggestion("dados de identificação"),
                actionLabel: "Aplicar modelo inteligente",
              },
              {
                emoji: "💡",
                title: "Orientações rápidas",
                description:
                  "Dicas sobre campos obrigatórios, LGPD e melhores práticas de preenchimento.",
              },
              {
                emoji: "📚",
                title: "Dados similares",
                description:
                  "Sugestões baseadas em alunos com perfis parecidos na rede para agilizar o cadastro.",
                onAction: () => handleAISuggestion("histórico familiar"),
                actionLabel: "Sugerir com IA",
              },
              {
                emoji: "🕒",
                title: "Auto-save",
                description:
                  "O formulário salva automaticamente a cada alteração importante. Fique atento ao indicador.",
              },
            ])}
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <DiagnosisSection diagnosisData={diagnosisData} onDiagnosisChange={setDiagnosisData} />
            <BarrierAdaptationsSection barriers={diagnosisData.barriers} />

            {renderSupportResources([
              {
                emoji: "🤖",
                title: "IA Diagnóstica",
                description:
                  "Gere sugestões automáticas de repertório e necessidades com base nas informações inseridas.",
                onAction: () => handleAISuggestion("avaliação diagnóstica"),
                actionLabel: "Gerar sugestões",
              },
              {
                emoji: "📋",
                title: "Templates por área",
                description:
                  "Checklists pré-estruturados para comunicação, cognição, motor e socioemocional.",
              },
              {
                emoji: "💬",
                title: "Orientações detalhadas",
                description:
                  "Guias sobre como avaliar cada área e exemplos de registros aceitos pela rede.",
              },
              {
                emoji: "📚",
                title: "Casos da rede",
                description:
                  "Exemplos de avaliações realizadas em alunos com perfis semelhantes para referência.",
              },
            ])}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
              <PlanningSection
                planningData={planningData}
                diagnosisData={diagnosisData}
                barriers={diagnosisData.barriers}
              studentData={studentData}
              studentContextData={studentContextData}
              tenantName={tenantName}
              onReferralsGenerated={handleAIGeneratedInsights}
                onPlanningChange={setPlanningData}
              />
            <ReferralsSection referralsData={referralsData} onReferralsChange={setReferralsData} />

            {renderSupportResources([
              {
                emoji: "🎯",
                title: "Metas SMART",
                description:
                  "Templates por área com descrição, indicadores e prazos alinhados ao diagnóstico.",
                onAction: () => handleAISuggestion("metas SMART"),
                actionLabel: "Sugerir metas",
              },
              {
                emoji: "🧠",
                title: "Estratégias recomendadas",
                description:
                  "Biblioteca curada com estratégias pedagógicas validadas pela rede.",
                onAction: () => handleAISuggestion("estratégias pedagógicas"),
                actionLabel: "Ver recomendações",
              },
              {
                emoji: "🧰",
                title: "Recursos disponíveis",
                description:
                  "Catálogo de recursos assistivos, materiais adaptados e apoios humanos.",
              },
              {
                emoji: "🗂️",
                title: "Histórico da rede",
                description:
                  "Sugestões de metas, estratégias e recursos já utilizados em PEIs anteriores.",
              },
            ])}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Preview completo do PEI
                </CardTitle>
                <CardDescription>
                  Revise todas as seções antes da submissão. Use esta visualização para compartilhar com a equipe.
                </CardDescription>
              </CardHeader>
              <CardContent>
              <ReportView
                studentData={studentData}
                diagnosisData={diagnosisData}
                planningData={planningData}
                referralsData={referralsData}
                evaluationData={evaluationData}
                userRole={userRole}
                tenantId={tenantId}
                schoolId={schoolId}
              />
              </CardContent>
            </Card>

            <EvaluationSection
              evaluationData={evaluationData}
              onEvaluationChange={setEvaluationData}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Checklist de verificação
                </CardTitle>
                <CardDescription>
                  Confirme os itens essenciais antes de enviar o PEI para validação da coordenação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    id: "identificationConfirmed",
                    label: "Identificação conferida",
                    description:
                      "Dados do aluno, responsáveis e contexto revisados e atualizados.",
                  },
                  {
                    id: "documentsAttached",
                    label: "Documentos anexados",
                    description:
                      "Laudos, relatórios e anexos obrigatórios foram adicionados ou referenciados.",
                  },
                  {
                    id: "strategiesAligned",
                    label: "Metas e estratégias alinhadas",
                    description:
                      "Metas SMART e estratégias revisadas de acordo com o diagnóstico e os recursos disponíveis.",
                  },
                  {
                    id: "guardiansInformed",
                    label: "Responsáveis informados",
                    description:
                      "Família alinhada com o plano e orientada sobre os próximos passos.",
                  },
                ].map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                    <Checkbox
                      id={item.id}
                      checked={reviewChecklist[item.id as keyof ReviewChecklist]}
                      onCheckedChange={(checked) =>
                        handleChecklistChange(item.id as keyof ReviewChecklist, Boolean(checked))
                      }
                    />
                    <div>
                      <label htmlFor={item.id} className="text-sm font-medium leading-none">
                        {item.label}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      {aiChecklistHints[item.id as keyof ReviewChecklist]?.length ? (
                        <ul className="mt-2 space-y-1">
                          {aiChecklistHints[item.id as keyof ReviewChecklist].map((hint, index) => (
                            <li key={`${item.id}-hint-${index}`} className="text-xs text-primary-foreground/80 bg-primary/10 rounded px-2 py-1">
                              {hint}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comentários finais e assinatura</CardTitle>
                <CardDescription>
                  Registre observações finais e assine digitalmente antes de enviar o plano para validação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="final_comments">Comentários finais</Label>
                  <Textarea
                    id="final_comments"
                    placeholder="Inclua observações importantes para a coordenação ou orientações adicionais."
                    value={finalComments}
                    onChange={(event) => setFinalComments(event.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="digital_signature">Assinatura digital *</Label>
                  <Input
                    id="digital_signature"
                    placeholder="Nome completo do responsável pelo PEI"
                    value={digitalSignature}
                    onChange={(event) => setDigitalSignature(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ao assinar, você confirma que o PEI foi revisado e está pronto para validação.
                  </p>
                </div>
              </CardContent>
            </Card>

            {renderSupportResources([
              {
                emoji: "✅",
                title: "Checklist automático",
                description:
                  "O sistema marca etapas concluídas e alerta sobre campos obrigatórios antes da submissão.",
              },
              {
                emoji: "🖨️",
                title: "Exportar versão impressa",
                description:
                  "Gere uma cópia em PDF para reunião com a equipe ou registro oficial.",
                onAction: () => handleAISuggestion("geração de PDF"),
                actionLabel: "Gerar PDF com IA",
              },
              {
                emoji: "🤝",
                title: "Compartilhar com a equipe",
                description:
                  "Envie o link do PEI para gestores, professores e família e colabore nos ajustes finais.",
              },
              {
                emoji: "🧾",
                title: "Histórico de versões",
                description:
                  "Visualize alterações anteriores antes de encaminhar a nova versão para validação.",
              },
            ])}
          </div>
        );
      default:
        return null;
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
              <h1 className="text-xl font-bold">{peiId ? "Editar PEI" : "Criar novo PEI"}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {tenantName && <span>{tenantName}</span>}
                {!peiId && selectedStudentId && studentData && (
                  <>
                    {tenantName && <span>•</span>}
                    <span className="text-primary font-medium">Para: {studentData.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {peiId && <PEIHistoryDialog peiId={peiId} />}
            <Button
              onClick={() => handleSave(false)}
              disabled={loading || !selectedStudentId}
              variant="outline"
              size="sm"
            >
              <Save className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !selectedStudentId} size="sm">
              <Send className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Enviar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 print:px-0 print:py-0">
        <Card className="p-6 space-y-8 print:shadow-none print:border-0">
          <div className="space-y-4 print:hidden">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">
                  Fluxo de criação do PEI
                </p>
                <h2 className="text-lg font-semibold mt-1">Wizard em 4 etapas</h2>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {wizardSteps.filter((_, index) => getStepCompletion(index)).length} de{" "}
                {wizardSteps.length} etapas concluídas
              </Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{
                  width: `${
                    (wizardSteps.filter((_, index) => getStepCompletion(index)).length /
                      wizardSteps.length) *
                    100
                  }%`,
                }}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {wizardSteps.map((step, index) => {
                const completed = getStepCompletion(index);
                const active = index === currentStep;
                const disabled = !canNavigateTo(index);
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepChange(index)}
                    disabled={disabled}
                    className={`rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-primary bg-primary/10 shadow-sm"
                        : completed
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-muted bg-muted/40 text-muted-foreground"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-primary/60"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          completed
                            ? "bg-green-500 text-white"
                            : active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted-foreground/10 text-muted-foreground"
                        }`}
                      >
                        {completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-2">
                          {step.icon}
                          {step.title}
                        </p>
                        <p className="text-xs">{step.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-8">{renderStepContent()}</div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <Button variant="outline" onClick={handlePreviousStep} disabled={currentStep === 0}>
              Voltar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={loading || !selectedStudentId}
              >
                Salvar rascunho
              </Button>
              {currentStep < wizardSteps.length - 1 ? (
                <Button onClick={handleNextStep}>Continuar</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || !reviewComplete}>
                  Enviar para validação
                </Button>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default CreatePEI;
