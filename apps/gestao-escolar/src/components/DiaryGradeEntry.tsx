import { useState, useEffect } from 'react';
import { Award, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@pei/database';
import { evaluationService, type Grade } from '../services/evaluationService';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  enrollment_id: string;
}

interface GradeFormData {
  student_id: string;
  enrollment_id: string;
  grade_value: string;
  conceptual_grade: string;
  descriptive_grade: string;
  period: string;
}

interface DiaryGradeEntryProps {
  classId: string;
  subjectId: string;
  date: string;
  academicYear: number;
  tenantId: string;
  diaryEntryId?: string;
  evaluationType?: 'numeric' | 'conceptual' | 'descriptive';
}

export function DiaryGradeEntry({
  classId,
  subjectId,
  date,
  academicYear,
  tenantId,
  diaryEntryId,
  evaluationType = 'numeric',
}: DiaryGradeEntryProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1');

  const [formData, setFormData] = useState<GradeFormData>({
    student_id: '',
    enrollment_id: '',
    grade_value: '',
    conceptual_grade: '',
    descriptive_grade: '',
    period: '1',
  });

  useEffect(() => {
    if (classId && academicYear) {
      loadStudents();
    }
  }, [classId, academicYear]);

  useEffect(() => {
    if (classId && subjectId && selectedPeriod) {
      loadGrades();
    }
  }, [classId, subjectId, selectedPeriod, diaryEntryId]);

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

  async function loadGrades() {
    if (!classId || !subjectId || !selectedPeriod) return;

    try {
      const gradesData = await evaluationService.getGradesByClassSubjectPeriod(
        classId,
        subjectId,
        academicYear,
        selectedPeriod
      );

      // Filtrar apenas notas relacionadas a este diário (se diaryEntryId existir)
      if (diaryEntryId) {
        const filtered = (gradesData || []).filter((g: any) => g.diary_entry_id === diaryEntryId);
        setGrades(filtered as unknown as Grade[]);
      } else {
        setGrades((gradesData || []) as unknown as Grade[]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar notas:', error);
    }
  }

  function handleOpenGradeDialog(student?: Student) {
    if (student) {
      const existingGrade = grades.find(g => g.student_id === student.id && g.period === parseInt(selectedPeriod));
      if (existingGrade) {
        setEditingGrade(existingGrade);
        setFormData({
          student_id: student.id,
          enrollment_id: student.enrollment_id,
          grade_value: existingGrade.grade_value?.toString() || '',
          conceptual_grade: existingGrade.conceptual_grade || '',
          descriptive_grade: existingGrade.descriptive_grade || '',
          period: existingGrade.period.toString(),
        });
      } else {
        setEditingGrade(null);
        setFormData({
          student_id: student.id,
          enrollment_id: student.enrollment_id,
          grade_value: '',
          conceptual_grade: '',
          descriptive_grade: '',
          period: selectedPeriod,
        });
      }
    } else {
      setEditingGrade(null);
      setFormData({
        student_id: '',
        enrollment_id: '',
        grade_value: '',
        conceptual_grade: '',
        descriptive_grade: '',
        period: selectedPeriod,
      });
    }
    setGradeDialogOpen(true);
  }

  async function handleSaveGrade() {
    if (!formData.student_id || !formData.enrollment_id || !tenantId) {
      toast.error('Dados incompletos para salvar nota');
      return;
    }

    try {
      // Buscar tenant_id e class_id do enrollment
      const { data: enrollment } = await supabase
        .from('student_enrollments')
        .select('tenant_id, school_id, class_id')
        .eq('id', formData.enrollment_id)
        .single();

      const gradeData: Partial<Grade> = {
        student_id: formData.student_id,
        enrollment_id: formData.enrollment_id,
        subject_id: subjectId,
        academic_year: academicYear,
        period: parseInt(formData.period),
        evaluation_type: evaluationType,
        diary_entry_id: diaryEntryId || undefined,
        tenant_id: enrollment?.tenant_id || tenantId,
        school_id: enrollment?.school_id,
        class_id: classId,
      };

      if (evaluationType === 'numeric') {
        if (!formData.grade_value) {
          toast.error('Informe a nota');
          return;
        }
        gradeData.grade_value = parseFloat(formData.grade_value);
      } else if (evaluationType === 'conceptual') {
        if (!formData.conceptual_grade) {
          toast.error('Informe o conceito');
          return;
        }
        gradeData.conceptual_grade = formData.conceptual_grade;
      } else if (evaluationType === 'descriptive') {
        if (!formData.descriptive_grade) {
          toast.error('Informe a avaliação descritiva');
          return;
        }
        gradeData.descriptive_grade = formData.descriptive_grade;
      }

      if (editingGrade) {
        await evaluationService.updateGrade(editingGrade.id, gradeData);
        toast.success('Nota atualizada com sucesso');
      } else {
        // Verificar se já existe nota para este aluno/período
        const existing = grades.find(
          g => g.student_id === formData.student_id && 
               g.period === parseInt(formData.period)
        );
        
        if (existing) {
          await evaluationService.updateGrade(existing.id, gradeData);
          toast.success('Nota atualizada com sucesso');
        } else {
          await evaluationService.submitGrade(gradeData);
          toast.success('Nota lançada com sucesso');
        }
      }

      setGradeDialogOpen(false);
      setEditingGrade(null);
      await loadGrades();
    } catch (error: any) {
      console.error('Erro ao salvar nota:', error);
      toast.error(error.message || 'Erro ao salvar nota');
    }
  }

  async function handleDeleteGrade(gradeId: string) {
    if (!confirm('Deseja realmente excluir esta nota?')) return;

    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId);

      if (error) throw error;
      toast.success('Nota excluída com sucesso');
      await loadGrades();
    } catch (error: any) {
      console.error('Erro ao excluir nota:', error);
      toast.error('Erro ao excluir nota');
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
              <Award className="h-5 w-5" />
              Lançamento de Notas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Período: {selectedPeriod}º Bimestre (calculado: {calculatedPeriod}º Bimestre)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="period" className="text-sm">Período:</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger id="period" className="w-32">
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
            const studentGrade = grades.find(
              g => g.student_id === student.id && g.period === parseInt(selectedPeriod)
            );

            return (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{student.name}</p>
                  {studentGrade ? (
                    <div className="flex items-center gap-2 mt-1">
                      {evaluationType === 'numeric' && studentGrade.grade_value !== null && (
                        <Badge variant="outline" className="text-lg">
                          {studentGrade.grade_value.toFixed(1)}
                        </Badge>
                      )}
                      {evaluationType === 'conceptual' && studentGrade.conceptual_grade && (
                        <Badge variant="outline">{studentGrade.conceptual_grade}</Badge>
                      )}
                      {evaluationType === 'descriptive' && studentGrade.descriptive_grade && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {studentGrade.descriptive_grade}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Sem nota lançada</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenGradeDialog(student)}
                  >
                    {studentGrade ? (
                      <>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Lançar
                      </>
                    )}
                  </Button>
                  {studentGrade && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGrade(studentGrade.id)}
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

      {/* Dialog de Lançamento/Edição de Nota */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? 'Editar Nota' : 'Lançar Nota'}
            </DialogTitle>
            <DialogDescription>
              {evaluationType === 'numeric' && 'Informe a nota numérica'}
              {evaluationType === 'conceptual' && 'Selecione o conceito'}
              {evaluationType === 'descriptive' && 'Descreva a avaliação'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="student">Aluno</Label>
              <Select
                value={formData.student_id}
                onValueChange={(value) => {
                  const student = students.find(s => s.id === value);
                  if (student) {
                    setFormData({
                      ...formData,
                      student_id: student.id,
                      enrollment_id: student.enrollment_id,
                    });
                  }
                }}
                disabled={!!editingGrade}
              >
                <SelectTrigger id="student">
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
              <Label htmlFor="period">Período</Label>
              <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
                <SelectTrigger id="period">
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

            {evaluationType === 'numeric' && (
              <div>
                <Label htmlFor="gradeValue">Nota *</Label>
                <Input
                  id="gradeValue"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.grade_value}
                  onChange={(e) => setFormData({ ...formData, grade_value: e.target.value })}
                  placeholder="Ex: 8.5"
                />
              </div>
            )}

            {evaluationType === 'conceptual' && (
              <div>
                <Label htmlFor="conceptualGrade">Conceito *</Label>
                <Select
                  value={formData.conceptual_grade}
                  onValueChange={(value) => setFormData({ ...formData, conceptual_grade: value })}
                >
                  <SelectTrigger id="conceptualGrade">
                    <SelectValue placeholder="Selecione o conceito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Excelente</SelectItem>
                    <SelectItem value="B">B - Bom</SelectItem>
                    <SelectItem value="C">C - Regular</SelectItem>
                    <SelectItem value="D">D - Insuficiente</SelectItem>
                    <SelectItem value="E">E - Muito Insuficiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {evaluationType === 'descriptive' && (
              <div>
                <Label htmlFor="descriptiveGrade">Avaliação Descritiva *</Label>
                <Textarea
                  id="descriptiveGrade"
                  value={formData.descriptive_grade}
                  onChange={(e) => setFormData({ ...formData, descriptive_grade: e.target.value })}
                  placeholder="Descreva o desempenho do aluno..."
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveGrade}>
                {editingGrade ? 'Atualizar' : 'Salvar'} Nota
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

