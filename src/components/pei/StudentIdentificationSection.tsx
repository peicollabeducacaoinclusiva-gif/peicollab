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
}

const StudentIdentificationSection = ({
  students,
  selectedStudentId,
  studentData,
  onStudentChange,
  onTemplateSelect,
}: StudentIdentificationSectionProps) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Bem-vindo ao Plano Educacional Individualizado!</strong><br />
          Siga as abas acima para preencher todas as seções. Use as dicas 💡 ao longo do formulário para orientação.
        </AlertDescription>
      </Alert>

      <div>
        <h3 className="text-lg font-semibold mb-4">Identificação do Aluno</h3>
        <div className="space-y-4">
          {onTemplateSelect && (
            <div>
              <PEITemplateSelector onTemplateSelect={onTemplateSelect} />
            </div>
          )}
          <div>
            <Label htmlFor="student">Selecione o Aluno *</Label>
            <Select value={selectedStudentId} onValueChange={onStudentChange}>
              <SelectTrigger id="student">
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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