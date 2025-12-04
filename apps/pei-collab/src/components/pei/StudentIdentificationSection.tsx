import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { PEITemplateSelector } from "@/components/pei/PEITemplateSelector";

interface Student {
  id: string;
  name: string;
  date_of_birth: string;
  father_name?: string;
  mother_name?: string;
  phone?: string;
  email?: string;
}

interface StudentIdentificationSectionProps {
  students: Student[];
  selectedStudentId: string;
  studentData: Student | null;
  onStudentChange: (studentId: string) => void;
  onTemplateSelect?: (template: any) => void;
  isEditMode?: boolean;
}

const StudentIdentificationSection = ({
  students,
  selectedStudentId,
  studentData,
  onStudentChange,
  onTemplateSelect,
  isEditMode = false,
}: StudentIdentificationSectionProps) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
          <strong>{isEditMode ? 'Editando Plano Educacional Individualizado' : 'Bem-vindo ao Plano Educacional Individualizado!'}</strong><br />
          {isEditMode 
            ? 'Você está editando um PEI existente. Revise e atualize as informações conforme necessário.'
            : 'Siga as abas acima para preencher todas as seções. Use as dicas 💡 ao longo do formulário para orientação.'
          }
        </AlertDescription>
      </Alert>

      <div>
        <h3 className="text-lg font-semibold mb-4">Identificação do Aluno</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="student">
              {isEditMode ? 'Aluno do PEI' : 'Selecione o Aluno *'}
            </Label>
            <Select 
              value={selectedStudentId} 
              onValueChange={onStudentChange}
              disabled={isEditMode}
            >
              <SelectTrigger id="student" disabled={isEditMode}>
                <SelectValue placeholder={
                  students.length === 0 
                    ? "Nenhum aluno disponível" 
                    : "Selecione um aluno"
                } />
              </SelectTrigger>
              <SelectContent>
                {students.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum aluno atribuído.<br/>
                    Contate a coordenação.
                  </div>
                ) : (
                  students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {isEditMode ? (
              <p className="text-xs text-muted-foreground mt-1">
                O aluno não pode ser alterado durante a edição do PEI
              </p>
            ) : students.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                ⚠️ Você não tem alunos atribuídos. Entre em contato com a coordenação.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Apenas alunos atribuídos a você aparecem na lista
              </p>
            )}
          </div>
          
          {onTemplateSelect && (
            <div>
              <PEITemplateSelector onTemplateSelect={onTemplateSelect} />
              {isEditMode && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Usar um modelo irá substituir os dados atuais do PEI
                </p>
              )}
            </div>
          )}

          {studentData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do Aluno</CardTitle>
                <CardDescription>Informações cadastradas no sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome</p>
                  <p className="text-base">{studentData.name}</p>
                </div>
                {studentData.date_of_birth && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                    <p className="text-base">
                      {new Date(studentData.date_of_birth).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {studentData.mother_name && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome da Mãe</p>
                    <p className="text-base">{studentData.mother_name}</p>
                  </div>
                )}
                {studentData.father_name && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome do Pai</p>
                    <p className="text-base">{studentData.father_name}</p>
                  </div>
                )}
                {studentData.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                    <p className="text-base">{studentData.phone}</p>
                  </div>
                )}
                {studentData.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                    <p className="text-base">{studentData.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentIdentificationSection;