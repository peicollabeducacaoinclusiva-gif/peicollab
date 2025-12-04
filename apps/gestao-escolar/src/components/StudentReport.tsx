import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Grade, Attendance, DescriptiveReport } from '../services/evaluationService';

interface StudentReportProps {
  student: {
    id: string;
    name: string;
    date_of_birth?: string;
    registration_number?: string;
  };
  enrollment: {
    id: string;
    academic_year: number;
    grade: string;
    shift: string;
    class_name?: string;
    school_name?: string;
  };
  grades: Grade[];
  attendance: Attendance[];
  reports: DescriptiveReport[];
  evaluationConfig?: {
    passing_grade: number;
    max_grade: number;
  };
}

export function StudentReport({
  student,
  enrollment,
  grades,
  attendance,
  reports,
  evaluationConfig,
}: StudentReportProps) {
  const average = useMemo(() => {
    const numericGrades = grades
      .map(g => g.grade_value)
      .filter((v): v is number => v !== null);
    if (numericGrades.length === 0) return null;
    return numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length;
  }, [grades]);

  const attendanceAverage = useMemo(() => {
    if (attendance.length === 0) return null;
    return attendance.reduce((sum, att) => sum + att.attendance_percentage, 0) / attendance.length;
  }, [attendance]);

  const gradesBySubject = useMemo(() => {
    const grouped: Record<string, Grade[]> = {};
    grades.forEach(grade => {
      const subjectName = (grade as any).subjects?.subject_name || 'Disciplina';
      if (!grouped[subjectName]) {
        grouped[subjectName] = [];
      }
      grouped[subjectName].push(grade);
    });
    return grouped;
  }, [grades]);

  const handleExportPDF = () => {
    // TODO: Implementar geração de PDF
    window.print();
  };

  const handleExportText = () => {
    let text = `RELATÓRIO ESCOLAR\n`;
    text += `================================\n\n`;
    text += `ALUNO: ${student.name}\n`;
    if (student.registration_number) {
      text += `MATRÍCULA: ${student.registration_number}\n`;
    }
    if (student.date_of_birth) {
      text += `DATA DE NASCIMENTO: ${format(new Date(student.date_of_birth), "dd/MM/yyyy", { locale: ptBR })}\n`;
    }
    text += `\n`;
    text += `ANO LETIVO: ${enrollment.academic_year}\n`;
    text += `TURMA: ${enrollment.class_name || '-'}\n`;
    text += `SÉRIE/ANO: ${enrollment.grade}\n`;
    text += `TURNO: ${enrollment.shift}\n`;
    text += `\n`;
    text += `================================\n`;
    text += `DESEMPENHO ACADÊMICO\n`;
    text += `================================\n\n`;

    if (average !== null) {
      text += `MÉDIA GERAL: ${average.toFixed(1)}\n`;
      text += `STATUS: ${average >= (evaluationConfig?.passing_grade || 6.0) ? 'APROVADO' : 'REPROVADO'}\n\n`;
    }

    Object.entries(gradesBySubject).forEach(([subject, subjectGrades]) => {
      text += `${subject}:\n`;
      subjectGrades.forEach(grade => {
        if (grade.grade_value !== null) {
          text += `  ${grade.period}º Bimestre: ${grade.grade_value.toFixed(1)}\n`;
        } else if (grade.conceptual_grade) {
          text += `  ${grade.period}º Bimestre: ${grade.conceptual_grade}\n`;
        }
      });
      text += `\n`;
    });

    text += `================================\n`;
    text += `FREQUÊNCIA\n`;
    text += `================================\n\n`;

    if (attendanceAverage !== null) {
      text += `FREQUÊNCIA MÉDIA: ${attendanceAverage.toFixed(1)}%\n\n`;
    }

    attendance.forEach(att => {
      const subjectName = (att as any).subjects?.subject_name || 'Frequência Geral';
      text += `${subjectName} - ${att.period}º Bimestre:\n`;
      text += `  Presentes: ${att.present_classes}/${att.total_classes} aulas\n`;
      text += `  Frequência: ${att.attendance_percentage.toFixed(1)}%\n\n`;
    });

    if (reports.length > 0) {
      text += `================================\n`;
      text += `PARECERES DESCRITIVOS\n`;
      text += `================================\n\n`;

      reports.forEach(report => {
        text += `${report.period}º Bimestre:\n`;
        text += `${report.report_text}\n\n`;
      });
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${student.name.replace(/\s+/g, '-')}-${enrollment.academic_year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Cabeçalho */}
      <Card className="print:border-none print:shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Relatório Escolar</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ano Letivo {enrollment.academic_year}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handleExportText}>
                <Download className="h-4 w-4 mr-2" />
                Exportar TXT
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Aluno</p>
              <p className="font-semibold text-lg">{student.name}</p>
              {student.registration_number && (
                <p className="text-sm text-muted-foreground">
                  Matrícula: {student.registration_number}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Turma</p>
              <p className="font-semibold">{enrollment.class_name || '-'}</p>
              <p className="text-sm text-muted-foreground">
                {enrollment.grade} - {enrollment.shift}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desempenho Acadêmico */}
      <Card className="print:border-none print:shadow-none">
        <CardHeader>
          <CardTitle>Desempenho Acadêmico</CardTitle>
        </CardHeader>
        <CardContent>
          {average !== null && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Média Geral</p>
                  <p className="text-3xl font-bold">{average.toFixed(1)}</p>
                </div>
                <Badge
                  className={
                    average >= (evaluationConfig?.passing_grade || 6.0)
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-lg px-4 py-2'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-lg px-4 py-2'
                  }
                >
                  {average >= (evaluationConfig?.passing_grade || 6.0) ? 'APROVADO' : 'REPROVADO'}
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => {
              const subjectAverage = subjectGrades
                .map(g => g.grade_value)
                .filter((v): v is number => v !== null);
              const avg = subjectAverage.length > 0
                ? subjectAverage.reduce((sum, grade) => sum + grade, 0) / subjectAverage.length
                : null;

              return (
                <div key={subject} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{subject}</h3>
                    {avg !== null && (
                      <Badge variant="outline" className="text-lg">
                        Média: {avg.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(period => {
                      const periodGrade = subjectGrades.find(g => g.period === period);
                      return (
                        <div key={period} className="text-center">
                          <p className="text-xs text-muted-foreground">{period}º Bimestre</p>
                          {periodGrade ? (
                            periodGrade.grade_value !== null ? (
                              <p className="font-bold text-lg">{periodGrade.grade_value.toFixed(1)}</p>
                            ) : periodGrade.conceptual_grade ? (
                              <Badge>{periodGrade.conceptual_grade}</Badge>
                            ) : (
                              <p className="text-muted-foreground">-</p>
                            )
                          ) : (
                            <p className="text-muted-foreground">-</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Frequência */}
      <Card className="print:border-none print:shadow-none">
        <CardHeader>
          <CardTitle>Frequência</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceAverage !== null && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Frequência Média</p>
                  <p className="text-2xl font-bold">{attendanceAverage.toFixed(1)}%</p>
                </div>
                <Badge
                  className={
                    attendanceAverage >= 75
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }
                >
                  {attendanceAverage >= 75 ? 'ADEQUADA' : 'INADEQUADA'}
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {attendance.map((att) => {
              const subjectName = (att as any).subjects?.subject_name || 'Frequência Geral';
              return (
                <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{subjectName}</p>
                    <p className="text-sm text-muted-foreground">
                      {att.period}º Bimestre • {att.present_classes}/{att.total_classes} aulas
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        att.attendance_percentage >= 75
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {att.attendance_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pareceres Descritivos */}
      {reports.length > 0 && (
        <Card className="print:border-none print:shadow-none">
          <CardHeader>
            <CardTitle>Pareceres Descritivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{report.period}º Bimestre</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(report.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{report.report_text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

