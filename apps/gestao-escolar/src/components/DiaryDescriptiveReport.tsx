import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@pei/database';
import { evaluationService, type DescriptiveReport } from '../services/evaluationService';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  enrollment_id: string;
}

interface DiaryDescriptiveReportProps {
  classId: string;
  subjectId: string;
  date: string;
  academicYear: number;
  tenantId: string;
  diaryEntryId?: string;
  userId: string;
}

export function DiaryDescriptiveReport({
  classId,
  subjectId: _subjectId,
  date,
  academicYear,
  tenantId: _tenantId,
  diaryEntryId,
  userId,
}: DiaryDescriptiveReportProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<DescriptiveReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DescriptiveReport | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [reportText, setReportText] = useState('');

  useEffect(() => {
    if (classId && academicYear) {
      loadStudents();
    }
  }, [classId, academicYear]);

  useEffect(() => {
    if (classId && selectedPeriod) {
      loadReports();
    }
  }, [classId, selectedPeriod, diaryEntryId]);

  async function loadStudents() {
    if (!classId || !academicYear) return;

    try {
      setLoading(true);
      const { data: enrollments, error } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student_id,
          students:student_id(name)
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
        }))
      );
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar alunos da turma');
    } finally {
      setLoading(false);
    }
  }

  async function loadReports() {
    if (!classId || !selectedPeriod) return;

    try {
      // Buscar pareceres dos alunos da turma
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('id, student_id')
        .eq('class_id', classId)
        .eq('academic_year', academicYear)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) {
        setReports([]);
        return;
      }

      const enrollmentIds = enrollments.map(e => e.id);

      const { data, error } = await supabase
        .from('descriptive_reports')
        .select(`
          *,
          students:student_id(name)
        `)
        .in('enrollment_id', enrollmentIds)
        .eq('academic_year', academicYear)
        .eq('period', parseInt(selectedPeriod))
        .order('students(name)');

      if (error) throw error;

      // Filtrar apenas pareceres relacionados a este diário (se diaryEntryId existir)
      if (diaryEntryId) {
        const diaryReports = (data || []).filter((r: any) => r.diary_entry_id === diaryEntryId);
        setReports(diaryReports as unknown as DescriptiveReport[]);
      } else {
        setReports((data || []) as unknown as DescriptiveReport[]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar pareceres:', error);
    }
  }

  function handleOpenReportDialog(student?: Student) {
    if (student) {
      const existingReport = reports.find(
        r => r.student_id === student.id && r.period === parseInt(selectedPeriod)
      );
      if (existingReport) {
        setEditingReport(existingReport);
        setSelectedStudent(student.id);
        setReportText(existingReport.report_text);
      } else {
        setEditingReport(null);
        setSelectedStudent(student.id);
        setReportText('');
      }
    } else {
      setEditingReport(null);
      setSelectedStudent('');
      setReportText('');
    }
    setReportDialogOpen(true);
  }

  async function handleSaveReport() {
    if (!selectedStudent || !reportText.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const student = students.find(s => s.id === selectedStudent);
    if (!student) {
      toast.error('Aluno não encontrado');
      return;
    }

    try {
      const reportData: Partial<DescriptiveReport> = {
        student_id: student.id,
        enrollment_id: student.enrollment_id,
        academic_year: academicYear,
        period: parseInt(selectedPeriod),
        report_text: reportText,
        created_by: userId,
        diary_entry_id: diaryEntryId || undefined,
      };

      if (editingReport) {
        const { error } = await supabase
          .from('descriptive_reports')
          .update({
            report_text: reportText,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingReport.id);

        if (error) throw error;
        toast.success('Parecer atualizado com sucesso');
      } else {
        await evaluationService.createDescriptiveReport(reportData);
        toast.success('Parecer criado com sucesso');
      }

      setReportDialogOpen(false);
      setEditingReport(null);
      setSelectedStudent('');
      setReportText('');
      await loadReports();
    } catch (error: any) {
      console.error('Erro ao salvar parecer:', error);
      toast.error(error.message || 'Erro ao salvar parecer');
    }
  }

  async function handleDeleteReport(reportId: string) {
    if (!confirm('Deseja realmente excluir este parecer?')) return;

    try {
      const { error } = await supabase
        .from('descriptive_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      toast.success('Parecer excluído com sucesso');
      await loadReports();
    } catch (error: any) {
      console.error('Erro ao excluir parecer:', error);
      toast.error('Erro ao excluir parecer');
    }
  }

  // Calcular período baseado na data
  const dateObj = new Date(date);
  const month = dateObj.getMonth() + 1;
  const calculatedPeriod = month >= 1 && month <= 3 ? 1 : month >= 4 && month <= 6 ? 2 : month >= 7 && month <= 9 ? 3 : 4;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando alunos...
        </CardContent>
      </Card>
    );
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pareceres Descritivos
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Período: {selectedPeriod}º Bimestre (calculado: {calculatedPeriod}º Bimestre)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="reportPeriod" className="text-sm">Período:</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger id="reportPeriod" className="w-32">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {students.map((student) => {
            const studentReport = reports.find(
              r => r.student_id === student.id && r.period === parseInt(selectedPeriod)
            );

            return (
              <div
                key={student.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{student.name}</p>
                  {studentReport ? (
                    <div className="mt-2">
                      <p className="text-sm text-foreground line-clamp-2">
                        {studentReport.report_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(studentReport.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Sem parecer lançado</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReportDialog(student)}
                  >
                    {studentReport ? (
                      <>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Criar
                      </>
                    )}
                  </Button>
                  {studentReport && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReport(studentReport.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Dialog de Criar/Editar Parecer */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? 'Editar Parecer Descritivo' : 'Criar Parecer Descritivo'}
            </DialogTitle>
            <DialogDescription>
              Descreva o desempenho e desenvolvimento do aluno no período
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reportStudent">Aluno</Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
                disabled={!!editingReport}
              >
                <SelectTrigger id="reportStudent">
                  <SelectValue placeholder="Selecione o aluno" />
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
              <Label htmlFor="reportText">Parecer Descritivo *</Label>
              <Textarea
                id="reportText"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Descreva o desempenho, desenvolvimento, participação e aspectos relevantes do aluno..."
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reportText.length} caracteres
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setReportDialogOpen(false);
                setEditingReport(null);
                setSelectedStudent('');
                setReportText('');
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveReport}>
                {editingReport ? 'Atualizar' : 'Salvar'} Parecer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

