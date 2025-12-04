import { useState, useEffect } from 'react';
import { FileText, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@pei/database';
import { evaluationService, type Grade, type Attendance, type DescriptiveReport } from '../services/evaluationService';
import { StudentReport } from './StudentReport';
import { toast } from 'sonner';

interface DiaryReportCardProps {
  classId: string;
  academicYear: number;
  tenantId: string;
  period?: number;
}

export function DiaryReportCard({
  classId,
  academicYear,
  tenantId,
  period,
}: DiaryReportCardProps) {
  const [students, setStudents] = useState<Array<{
    id: string;
    name: string;
    enrollment_id: string;
    date_of_birth?: string;
    registration_number?: string;
  }>>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(period?.toString() || '1');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<{
    student: any;
    enrollment: any;
    grades: Grade[];
    attendance: Attendance[];
    reports: DescriptiveReport[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classId && academicYear) {
      loadStudents();
    }
  }, [classId, academicYear]);

  async function loadStudents() {
    if (!classId || !academicYear) return;

    try {
      const { data: enrollments, error } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student_id,
          grade,
          shift,
          students:student_id(
            id,
            name,
            date_of_birth,
            student_id
          ),
          classes:class_id(class_name),
          schools:school_id(school_name)
        `)
        .eq('class_id', classId)
        .eq('academic_year', academicYear)
        .eq('status', 'active')
        .order('students(name)');

      if (error) throw error;

      setStudents(
        (enrollments || []).map((e: any) => ({
          id: e.student_id,
          name: e.students?.name || 'N/A',
          enrollment_id: e.id,
          date_of_birth: e.students?.date_of_birth,
          registration_number: e.students?.student_id,
        }))
      );
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar alunos da turma');
    }
  }

  async function generateReport() {
    if (!selectedStudent || !selectedPeriod) {
      toast.error('Selecione um aluno e um período');
      return;
    }

    try {
      setLoading(true);

      const student = students.find(s => s.id === selectedStudent);
      if (!student) {
        toast.error('Aluno não encontrado');
        return;
      }

      // Buscar dados do enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          academic_year,
          grade,
          shift,
          classes:class_id(class_name),
          schools:school_id(school_name)
        `)
        .eq('id', student.enrollment_id)
        .single();

      if (enrollmentError) throw enrollmentError;

      // Buscar notas
      const grades = await evaluationService.getGrades({
        tenantId,
        enrollmentId: student.enrollment_id,
        academicYear,
        period: parseInt(selectedPeriod),
      });

      // Buscar frequência
      const attendance = await evaluationService.getAttendance({
        tenantId,
        enrollmentId: student.enrollment_id,
        academicYear,
        period: parseInt(selectedPeriod),
      });

      // Buscar pareceres
      const reports = await evaluationService.getDescriptiveReports({
        tenantId,
        enrollmentId: student.enrollment_id,
        academicYear,
        period: parseInt(selectedPeriod),
      });

      // Buscar configuração de avaliação
      const { data: _evalConfig } = await supabase
        .from('evaluation_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('academic_year', academicYear)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setReportData({
        student: {
          id: student.id,
          name: student.name,
          date_of_birth: student.date_of_birth,
          registration_number: student.registration_number,
        },
        enrollment: {
          id: enrollment.id,
          academic_year: enrollment.academic_year,
          grade: enrollment.grade,
          shift: enrollment.shift,
          class_name: (enrollment.classes as any)?.class_name,
          school_name: (enrollment.schools as any)?.school_name,
        },
        grades: (grades || []) as unknown as Grade[],
        attendance: (attendance || []) as unknown as Attendance[],
        reports: (reports || []) as unknown as DescriptiveReport[],
      });

      setReportDialogOpen(true);
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast.error(error.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  }

  async function generateClassReport() {
    if (!selectedPeriod) {
      toast.error('Selecione um período');
      return;
    }

    try {
      setLoading(true);

      // Gerar relatório consolidado da turma
      let csvContent = `BOLETIM ESCOLAR - TURMA\n`;
      csvContent += `Período: ${selectedPeriod}º Bimestre\n`;
      csvContent += `Ano Letivo: ${academicYear}\n\n`;

      csvContent += `Aluno,Matrícula,`;
      
      // Buscar disciplinas da turma
      const { data: classSubjects } = await supabase
        .from('class_subjects')
        .select('subjects:subject_id(subject_name)')
        .eq('class_id', classId);

      const subjectNames = (classSubjects || []).map((cs: any) => cs.subjects?.subject_name || '').filter(Boolean);
      csvContent += subjectNames.join(',') + ',Média Geral,Frequência,Status\n';

      // Para cada aluno, gerar linha do relatório
      for (const student of students) {
        const grades = await evaluationService.getGrades({
          tenantId,
          enrollmentId: student.enrollment_id,
          academicYear,
          period: parseInt(selectedPeriod),
        });

        const attendance = await evaluationService.getAttendance({
          tenantId,
          enrollmentId: student.enrollment_id,
          academicYear,
          period: parseInt(selectedPeriod),
        });

        const attendanceAvg = attendance && attendance.length > 0
          ? attendance.reduce((sum, att) => sum + att.attendance_percentage, 0) / attendance.length
          : null;

        const gradesBySubject: Record<string, number> = {};
        grades?.forEach(grade => {
          const subjectName = (grade as any).subjects?.subject_name || '';
          if (subjectName && grade.grade_value !== null) {
            gradesBySubject[subjectName] = grade.grade_value;
          }
        });

        const subjectGrades = subjectNames.map(subj => {
          const grade = gradesBySubject[subj];
          return grade !== undefined ? grade.toFixed(1) : '-';
        }).join(',');

        const numericGrades = grades?.map(g => g.grade_value).filter((v): v is number => v !== null) || [];
        const average = numericGrades.length > 0
          ? numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length
          : null;

        csvContent += `${student.name},${student.registration_number || '-'},${subjectGrades},${average !== null ? average.toFixed(1) : '-'},${attendanceAvg !== null ? attendanceAvg.toFixed(1) + '%' : '-'},${average !== null && average >= 6.0 ? 'APROVADO' : 'REPROVADO'}\n`;
      }

      // Download do CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `boletim_turma_periodo_${selectedPeriod}_${academicYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Relatório da turma exportado com sucesso');
    } catch (error: any) {
      console.error('Erro ao gerar relatório da turma:', error);
      toast.error('Erro ao gerar relatório da turma');
    } finally {
      setLoading(false);
    }
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum aluno encontrado nesta turma
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Emissão de Boletins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportPeriod">Período</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger id="reportPeriod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Bimestre</SelectItem>
                    <SelectItem value="2">2º Bimestre</SelectItem>
                    <SelectItem value="3">3º Bimestre</SelectItem>
                    <SelectItem value="4">4º Bimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reportStudent">Aluno (Individual)</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger id="reportStudent">
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
            </div>

            <div className="flex gap-2">
              <Button
                onClick={generateReport}
                disabled={!selectedStudent || !selectedPeriod || loading}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerar Boletim Individual
              </Button>
              <Button
                onClick={generateClassReport}
                disabled={!selectedPeriod || loading}
                variant="outline"
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Exportar Relatório da Turma (CSV)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Visualização do Boletim */}
      {reportData && (
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Boletim Escolar</DialogTitle>
              <DialogDescription>
                {reportData.student.name} - {selectedPeriod}º Bimestre
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <StudentReport
                student={reportData.student}
                enrollment={reportData.enrollment}
                grades={reportData.grades}
                attendance={reportData.attendance}
                reports={reportData.reports}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

