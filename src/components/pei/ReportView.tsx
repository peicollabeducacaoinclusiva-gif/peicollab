import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload } from "lucide-react";
import { useState } from "react";
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

interface AccessibilityResource {
  id?: string;
  resource_type: 'Libras' | 'Braille' | 'Tecnologia assistiva' | 'Material adaptado' | 'Apoio visual' | 'Tutor' | 'Outro';
  description: string;
  usage_frequency?: 'Diário' | 'Semanal' | 'Sob demanda' | 'Outro';
}

interface PEIReferral {
  id?: string;
  referred_to: string;
  reason?: string;
  date?: string;
  follow_up?: string;
}

interface StudentData {
  name: string;
  date_of_birth: string;
  father_name?: string;
  mother_name?: string;
  phone?: string;
  email?: string;
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
  accessibilityResources: AccessibilityResource[];
}

interface ReferralsData {
  referrals: PEIReferral[];
  observations: string;
}

interface ReportViewProps {
  studentData: StudentData | null;
  diagnosisData: DiagnosisData;
  planningData: PlanningData;
  referralsData: ReferralsData;
  userRole?: string | null;
}

interface ReportIdentification {
  networkName: string;
  schoolName: string;
  logoUrl: string;
}

const ReportView = ({
  studentData,
  diagnosisData,
  planningData,
  referralsData,
  userRole,
}: ReportViewProps) => {
  const [identification, setIdentification] = useState<ReportIdentification>({
    networkName: "",
    schoolName: "",
    logoUrl: ""
  });

  const handlePrint = () => {
    window.print();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdentification({ ...identification, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const shouldShowWatermark = userRole !== 'coordinator' && userRole !== 'superadmin';

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6 relative">
      {/* Marca d'água RASCUNHO */}
      {shouldShowWatermark && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 print:block md:block">
          <div className="text-[200px] font-bold text-gray-300/20 rotate-[-45deg] select-none print:text-gray-400/30">
            RASCUNHO
          </div>
        </div>
      )}
      
      {/* Cabeçalho e botão - oculto na impressão */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h3 className="text-lg font-semibold">Relatório Completo do PEI</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Visualização consolidada de todas as seções
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Card de identificação institucional - oculto na impressão */}
      <Card className="print:hidden">
        <CardHeader className="print:pb-6">
          <CardTitle>Identificação Institucional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="networkName">Nome da Rede</Label>
              <Input
                id="networkName"
                placeholder="Ex: Rede Municipal de Ensino"
                value={identification.networkName}
                onChange={(e) => setIdentification({ ...identification, networkName: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="schoolName">Nome da Escola</Label>
              <Input
                id="schoolName"
                placeholder="Ex: Escola Municipal Dom Pedro II"
                value={identification.schoolName}
                onChange={(e) => setIdentification({ ...identification, schoolName: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="logo">Logo da Instituição</Label>
            <div className="mt-2 flex items-center gap-4">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="flex-1"
              />
              {identification.logoUrl && (
                <img src={identification.logoUrl} alt="Logo" className="h-16 w-16 object-contain border rounded" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Identificação do Aluno */}
      <Card className="print:border print:border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl print:text-lg">1. Identificação do Aluno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Nome Completo:</strong> {studentData?.name || "Não informado"}</p>
          <p><strong>Data de Nascimento:</strong> {studentData?.date_of_birth ? format(new Date(studentData.date_of_birth), "dd/MM/yyyy", { locale: ptBR }) : "Não informado"}</p>
          <p><strong>Idade:</strong> {studentData?.date_of_birth ? `${calculateAge(studentData.date_of_birth)} anos` : "Não informado"}</p>
          <p><strong>Nome do Pai:</strong> {studentData?.father_name || "Não informado"}</p>
          <p><strong>Nome da Mãe:</strong> {studentData?.mother_name || "Não informado"}</p>
          <p><strong>Telefone:</strong> {studentData?.phone || "Não informado"}</p>
          <p><strong>Email:</strong> {studentData?.email || "Não informado"}</p>
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      {/* Seção de Diagnóstico */}
      <Card className="print:border print:border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl print:text-lg">2. Diagnóstico e Necessidades Educacionais Especiais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-1">Histórico do Estudante:</p>
            <p className="whitespace-pre-wrap">{diagnosisData.history || "Não informado"}</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Interesses do Aluno:</p>
            <p className="whitespace-pre-wrap">{diagnosisData.interests || "Não informado"}</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Necessidades Educacionais Especiais:</p>
            <p className="whitespace-pre-wrap">{diagnosisData.specialNeeds || "Não informado"}</p>
          </div>
          {diagnosisData.cid10 && (
            <div>
              <p className="font-semibold mb-1">CID-10:</p>
              <p className="whitespace-pre-wrap">{diagnosisData.cid10}</p>
            </div>
          )}
          {diagnosisData.description && (
            <div>
              <p className="font-semibold mb-1">Descrição Detalhada do Diagnóstico:</p>
              <p className="whitespace-pre-wrap">{diagnosisData.description}</p>
            </div>
          )}
          <div>
            <p className="font-semibold mb-1">Barreiras Identificadas:</p>
            {diagnosisData.barriers && diagnosisData.barriers.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {diagnosisData.barriers.map((barrier, index) => (
                  <li key={index}>{barrier.barrier_type}: {barrier.description} ({barrier.severity})</li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma barreira identificada.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      {/* Seção de Planejamento */}
      <Card className="print:border print:border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl print:text-lg">3. Planejamento de Acessibilidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-1">Metas Educacionais:</p>
            {planningData.goals && planningData.goals.length > 0 ? (
              <ul className="list-decimal pl-5 space-y-2">
                {planningData.goals.map((goal, index) => (
                  <li key={index}>
                    <p className="font-medium">{goal.description}</p>
                    {goal.target_date && <p className="text-xs text-muted-foreground">Data Alvo: {format(new Date(goal.target_date), "dd/MM/yyyy", { locale: ptBR })}</p>}
                    {goal.notes && <p className="text-xs text-muted-foreground whitespace-pre-wrap">Observações/Estratégias: {goal.notes}</p>}
                    {goal.progress_level && <p className="text-xs text-muted-foreground">Progresso: {goal.progress_level} ({goal.progress_score || 0}%)</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma meta de planejamento definida.</p>
            )}
          </div>
          <div>
            <p className="font-semibold mb-1">Recursos de Acessibilidade:</p>
            {planningData.accessibilityResources && planningData.accessibilityResources.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {planningData.accessibilityResources.map((resource, index) => (
                  <li key={index}>{resource.resource_type}: {resource.description} (Frequência: {resource.usage_frequency})</li>
                ))}
              </ul>
            ) : (
              <p>Nenhum recurso de acessibilidade especificado.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      {/* Seção de Encaminhamentos e Observações */}
      <Card className="print:border print:border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl print:text-lg">4. Encaminhamentos e Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-1">Encaminhamentos Profissionais:</p>
            {referralsData.referrals && referralsData.referrals.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {referralsData.referrals.map((referral, index) => (
                  <li key={index}>
                    <p className="font-medium">Para: {referral.referred_to}</p>
                    {referral.reason && <p className="text-xs text-muted-foreground">Motivo: {referral.reason}</p>}
                    {referral.date && <p className="text-xs text-muted-foreground">Data: {format(new Date(referral.date), "dd/MM/yyyy", { locale: ptBR })}</p>}
                    {referral.follow_up && <p className="text-xs text-muted-foreground whitespace-pre-wrap">Acompanhamento: {referral.follow_up}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum encaminhamento profissional registrado.</p>
            )}
          </div>
          <div>
            <p className="font-semibold mb-1">Observações Gerais:</p>
            <p className="whitespace-pre-wrap">{referralsData.observations || "Nenhuma observação geral."}</p>
          </div>
        </CardContent>
      </Card>

      {/* Assinaturas */}
      <Card className="print:border-2 print:border-gray-800 print:page-break-before-always">
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
            <div className="space-y-2">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-center text-sm font-medium">Professor(a) Responsável</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-center text-sm font-medium">Coordenador(a) Pedagógico(a)</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-center text-sm font-medium">Diretor(a) Escolar</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-center text-sm font-medium">Responsável Legal / Família</p>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>Data: _____/_____/__________</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportView;