import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos baseados no schema do banco de dados e em CreatePEI.tsx
interface Barrier {
  id?: string;
  barrier_type: string;
  description: string;
  severity?: 'leve' | 'moderada' | 'severa';
}

interface PEIGoal {
  id?: string;
  description: string;
  target_date?: string;
  progress_level?: 'não iniciada' | 'em andamento' | 'parcialmente alcançada' | 'alcançada';
  progress_score?: number;
  notes?: string;
  strategies?: string[];
  evaluationCriteria?: string;
  resources?: string;
}

interface PEIReferral {
  id?: string;
  referred_to: string;
  reason?: string;
  date?: string;
  follow_up?: string;
}

interface DiagnosisData {
  interests: string;
  specialNeeds: string;
  barriers: Barrier[];
  history: string;
  cid10?: string;
  description?: string;
}

interface PlanningData {
  goals: PEIGoal[];
}

interface ReferralsData {
  referrals: PEIReferral[];
  observations: string;
}

interface VersionData {
  version_number: number;
  changed_at: string;
  changed_by_name?: string;
  diagnosis_data: DiagnosisData;
  planning_data: PlanningData;
  evaluation_data: ReferralsData;
  status: string;
  change_summary: string;
}

interface PEIVersionCompareProps {
  version1: VersionData;
  version2: VersionData;
  onBack: () => void;
}

export function PEIVersionCompare({ version1, version2, onBack }: PEIVersionCompareProps) {
  const renderDiagnosisComparison = () => {
    const diag1 = version1.diagnosis_data || { interests: "", specialNeeds: "", barriers: [], history: "", cid10: "", description: "" };
    const diag2 = version2.diagnosis_data || { interests: "", specialNeeds: "", barriers: [], history: "", cid10: "", description: "" };

    const getBarrierDescription = (barrier: Barrier) => `${barrier.barrier_type}: ${barrier.description}`;

    const getDiffClass = (val1: any, val2: any) => (val1 !== val2 ? "bg-yellow-50 p-2 rounded" : "p-2");

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Interesses</h4>
          <div className={getDiffClass(diag1.interests, diag2.interests)}>
            {diag1.interests || "Não informado"}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Interesses</h4>
          <div className={getDiffClass(diag1.interests, diag2.interests)}>
            {diag2.interests || "Não informado"}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Necessidades Educacionais Especiais</h4>
          <div className={getDiffClass(diag1.specialNeeds, diag2.specialNeeds)}>
            {diag1.specialNeeds || "Não informado"}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Necessidades Educacionais Especiais</h4>
          <div className={getDiffClass(diag1.specialNeeds, diag2.specialNeeds)}>
            {diag2.specialNeeds || "Não informado"}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Histórico</h4>
          <div className={getDiffClass(diag1.history, diag2.history)}>
            {diag1.history || "Não informado"}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Histórico</h4>
          <div className={getDiffClass(diag1.history, diag2.history)}>
            {diag2.history || "Não informado"}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">CID-10</h4>
          <div className={getDiffClass(diag1.cid10, diag2.cid10)}>
            {diag1.cid10 || "Não informado"}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">CID-10</h4>
          <div className={getDiffClass(diag1.cid10, diag2.cid10)}>
            {diag2.cid10 || "Não informado"}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Descrição do Diagnóstico</h4>
          <div className={getDiffClass(diag1.description, diag2.description)}>
            {diag1.description || "Não informado"}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Descrição do Diagnóstico</h4>
          <div className={getDiffClass(diag1.description, diag2.description)}>
            {diag2.description || "Não informado"}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Barreiras ({diag1.barriers?.length || 0})</h4>
          <div className="space-y-1">
            {diag1.barriers?.map((barrier, idx) => (
              <div key={idx} className={getDiffClass(getBarrierDescription(barrier), getBarrierDescription(diag2.barriers[idx]))}>
                {getBarrierDescription(barrier)}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Barreiras ({diag2.barriers?.length || 0})</h4>
          <div className="space-y-1">
            {diag2.barriers?.map((barrier, idx) => (
              <div key={idx} className={getDiffClass(getBarrierDescription(diag1.barriers[idx]), getBarrierDescription(barrier))}>
                {getBarrierDescription(barrier)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPlanningComparison = () => {
    const plan1 = version1.planning_data || { goals: [] };
    const plan2 = version2.planning_data || { goals: [] };

    const getGoalDescription = (goal: PEIGoal) => `${goal.description} (${goal.progress_level || 'não iniciado'})`;

    const getDiffClass = (val1: any, val2: any) => (val1 !== val2 ? "bg-yellow-50 p-2 rounded" : "p-2");

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Metas ({plan1.goals?.length || 0})</h4>
          <div className="space-y-2">
            {plan1.goals?.map((goal: PEIGoal, idx: number) => (
              <div key={idx} className={getDiffClass(getGoalDescription(goal), getGoalDescription(plan2.goals[idx]))}>
                <div className="font-medium">{goal.description || "Meta sem descrição"}</div>
                {goal.strategies && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Estratégias: {goal.strategies.join(", ")}
                  </div>
                )}
                {goal.evaluationCriteria && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Critérios de Avaliação: {goal.evaluationCriteria}
                  </div>
                )}
                {goal.resources && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Recursos: {goal.resources}
                  </div>
                )}
                {goal.progress_level && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Progresso: {goal.progress_level} ({goal.progress_score}%)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Metas ({plan2.goals?.length || 0})</h4>
          <div className="space-y-2">
            {plan2.goals?.map((goal: PEIGoal, idx: number) => (
              <div key={idx} className={getDiffClass(getGoalDescription(plan1.goals[idx]), getGoalDescription(goal))}>
                <div className="font-medium">{goal.description || "Meta sem descrição"}</div>
                {goal.strategies && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Estratégias: {goal.strategies.join(", ")}
                  </div>
                )}
                {goal.evaluationCriteria && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Critérios de Avaliação: {goal.evaluationCriteria}
                  </div>
                )}
                {goal.resources && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Recursos: {goal.resources}
                  </div>
                )}
                {goal.progress_level && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Progresso: {goal.progress_level} ({goal.progress_score}%)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReferralsComparison = () => {
    const ref1 = version1.evaluation_data || { referrals: [], observations: "" };
    const ref2 = version2.evaluation_data || { referrals: [], observations: "" };

    const getReferralDescription = (referral: PEIReferral) => `${referral.referred_to} (${referral.reason || 'sem razão'})`;

    const getDiffClass = (val1: any, val2: any) => (val1 !== val2 ? "bg-yellow-50 p-2 rounded" : "p-2");

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Encaminhamentos ({ref1.referrals?.length || 0})</h4>
          <div className="space-y-1">
            {ref1.referrals?.map((referral, idx) => (
              <div key={idx} className={getDiffClass(getReferralDescription(referral), getReferralDescription(ref2.referrals[idx]))}>
                {getReferralDescription(referral)}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Encaminhamentos ({ref2.referrals?.length || 0})</h4>
          <div className="space-y-1">
            {ref2.referrals?.map((referral, idx) => (
              <div key={idx} className={getDiffClass(getReferralDescription(ref1.referrals[idx]), getReferralDescription(referral))}>
                {getReferralDescription(referral)}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Observações</h4>
          <div className={getDiffClass(ref1.observations, ref2.observations)}>
            {ref1.observations || "Não informado"}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Observações</h4>
          <div className={getDiffClass(ref1.observations, ref2.observations)}>
            {ref2.observations || "Não informado"}
          </div>
        </div>
      </div>
    );
  };

  const olderVersion = version1.version_number < version2.version_number ? version1 : version2;
  const newerVersion = version1.version_number > version2.version_number ? version1 : version2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Versão {olderVersion.version_number}
            <span className="text-xs ml-1">
              ({format(new Date(olderVersion.changed_at), "dd/MM/yy HH:mm", { locale: ptBR })})
            </span>
          </Badge>
          <ArrowRight className="h-4 w-4" />
          <Badge variant="default">
            Versão {newerVersion.version_number}
            <span className="text-xs ml-1">
              ({format(new Date(newerVersion.changed_at), "dd/MM/yy HH:mm", { locale: ptBR })})
            </span>
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[450px]">
        <div className="space-y-4 pr-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Badge variant="outline">{olderVersion.status}</Badge>
                </div>
                <div>
                  <Badge variant={olderVersion.status !== newerVersion.status ? "default" : "outline"}>
                    {newerVersion.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              {renderDiagnosisComparison()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Planejamento</CardTitle>
            </CardHeader>
            <CardContent>
              {renderPlanningComparison()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Encaminhamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {renderReferralsComparison()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Alteração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Alterado por</div>
                  <div>{olderVersion.changed_by_name}</div>
                  <div className="text-muted-foreground mt-2 mb-1">Resumo</div>
                  <div>{olderVersion.change_summary}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Alterado por</div>
                  <div>{newerVersion.changed_by_name}</div>
                  <div className="text-muted-foreground mt-2 mb-1">Resumo</div>
                  <div>{newerVersion.change_summary}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
            💡 Áreas destacadas em amarelo indicam diferenças entre as versões
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}