import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@pei/ui';
import { useUnifiedStudent, useStudentHistory, useStudentNEE, useStudentDocuments, useStudentAccessibility } from '../hooks/useUnifiedStudent';
import { UnifiedStudentCard } from '../components/student/UnifiedStudentCard';
import { StudentPersonalData } from '../components/student/StudentPersonalData';
import { StudentAcademicHistory } from '../components/student/StudentAcademicHistory';
import { StudentNEE } from '../components/student/StudentNEE';
import { StudentDocuments } from '../components/student/StudentDocuments';
import { StudentAccessibility } from '../components/student/StudentAccessibility';
import { QuickPEIAccess } from '../components/student/QuickPEIAccess';
import { QuickAEEAccess } from '../components/student/QuickAEEAccess';
import { toast } from 'sonner';

export default function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const { data: unifiedData, isLoading: unifiedLoading, error: unifiedError } = useUnifiedStudent(studentId || null);
  const { data: history, isLoading: historyLoading } = useStudentHistory(studentId || null);
  const { data: nee, isLoading: neeLoading } = useStudentNEE(studentId || null);
  const { data: documents, isLoading: documentsLoading } = useStudentDocuments(studentId || null);
  const { data: accessibility, isLoading: accessibilityLoading } = useStudentAccessibility(studentId || null);

  if (!studentId) {
    toast.error('ID do estudante não fornecido');
    navigate('/students');
    return null;
  }

  if (unifiedLoading || historyLoading || neeLoading || documentsLoading || accessibilityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando ficha do estudante...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (unifiedError || !unifiedData) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-destructive mb-4">Erro ao carregar dados do estudante</p>
              <Button onClick={() => navigate('/students')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Lista
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/students')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista de Estudantes
          </Button>
        </div>

        <div className="mb-6">
          <UnifiedStudentCard data={unifiedData} />
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="history">Histórico Escolar</TabsTrigger>
            <TabsTrigger value="nee">Necessidades Especiais</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="accessibility">Acessibilidade</TabsTrigger>
            <TabsTrigger value="pei">PEI</TabsTrigger>
            <TabsTrigger value="aee">AEE</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <StudentPersonalData data={unifiedData} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <StudentAcademicHistory history={history || []} />
          </TabsContent>

          <TabsContent value="nee" className="space-y-4">
            {nee && <StudentNEE nee={nee} />}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <StudentDocuments documents={documents || []} />
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-4">
            {accessibility && <StudentAccessibility accessibility={accessibility} />}
          </TabsContent>

          <TabsContent value="pei" className="space-y-4">
            <QuickPEIAccess data={unifiedData} studentId={studentId} />
          </TabsContent>

          <TabsContent value="aee" className="space-y-4">
            <QuickAEEAccess data={unifiedData} studentId={studentId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

