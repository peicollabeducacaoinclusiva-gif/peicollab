import { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@pei/database';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  enrollment_id: string;
}

interface AttendanceRecord {
  student_id: string;
  enrollment_id: string;
  is_present: boolean;
  justification?: string;
}

interface DiaryAttendanceEntryProps {
  classId: string;
  subjectId: string;
  date: string;
  academicYear: number;
  tenantId: string;
  diaryEntryId?: string;
  onSave?: (records: AttendanceRecord[]) => void;
}

export function DiaryAttendanceEntry({
  classId,
  subjectId,
  date,
  academicYear,
  tenantId,
  diaryEntryId,
  onSave,
}: DiaryAttendanceEntryProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (classId && academicYear) {
      loadStudents();
    }
  }, [classId, academicYear]);

  useEffect(() => {
    if (diaryEntryId) {
      loadExistingAttendance();
    }
  }, [diaryEntryId]);

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

      const studentsList = (enrollments || []).map((e: any) => ({
        id: e.student_id,
        name: e.students?.name || 'N/A',
        enrollment_id: e.id,
      }));

      setStudents(studentsList);

      // Inicializar todos como presentes
      const initialAttendance: Record<string, AttendanceRecord> = {};
      studentsList.forEach((student) => {
        initialAttendance[student.id] = {
          student_id: student.id,
          enrollment_id: student.enrollment_id,
          is_present: true,
        };
      });
      setAttendance(initialAttendance);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar alunos da turma');
    } finally {
      setLoading(false);
    }
  }

  async function loadExistingAttendance() {
    if (!diaryEntryId || !classId || !date) return;

    try {
      const { data, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('diary_entry_id', diaryEntryId)
        .eq('date', date);

      if (error) throw error;

      const attendanceMap: Record<string, AttendanceRecord> = {};
      const justificationsMap: Record<string, string> = {};

      (data || []).forEach((att: any) => {
        attendanceMap[att.student_id] = {
          student_id: att.student_id,
          enrollment_id: att.enrollment_id || '',
          is_present: att.is_present,
          justification: att.justification,
        };
        if (att.justification) {
          justificationsMap[att.student_id] = att.justification;
        }
      });

      setAttendance(attendanceMap);
      setJustifications(justificationsMap);
    } catch (error: any) {
      console.error('Erro ao carregar frequência existente:', error);
    }
  }

  function handleToggleAttendance(studentId: string) {
    setAttendance((prev) => {
      const current = prev[studentId];
      const newRecord: AttendanceRecord = {
        student_id: studentId,
        enrollment_id: current?.enrollment_id || '',
        is_present: current ? !current.is_present : false,
        justification: current?.justification,
      };
      return {
        ...prev,
        [studentId]: newRecord,
      };
    });
  }

  async function handleSaveAttendance() {
    if (!classId || !subjectId || !date || !tenantId) {
      toast.error('Dados incompletos para salvar frequência');
      return;
    }

    try {
      setSaving(true);

      const records: AttendanceRecord[] = Object.values(attendance).map((att) => ({
        ...att,
        justification: justifications[att.student_id] || undefined,
      }));

        // Salvar frequência diária para cada aluno
        for (const record of records) {
          const attendanceData = {
            tenant_id: tenantId,
            student_id: record.student_id,
            enrollment_id: record.enrollment_id,
            class_id: classId,
            subject_id: subjectId || null,
            academic_year: academicYear,
            date: date,
            is_present: record.is_present,
            justification: record.justification || null,
            diary_entry_id: diaryEntryId || null,
          };

          if (diaryEntryId) {
            // Atualizar ou criar na tabela daily_attendance
            const { data: existing } = await supabase
              .from('daily_attendance')
              .select('id')
              .eq('diary_entry_id', diaryEntryId)
              .eq('student_id', record.student_id)
              .eq('date', date)
              .maybeSingle();

            if (existing) {
              await supabase
                .from('daily_attendance')
                .update({
                  is_present: record.is_present,
                  justification: record.justification || null,
                })
                .eq('id', existing.id);
            } else {
              await supabase.from('daily_attendance').insert(attendanceData);
            }
          } else {
            // Criar novo (será vinculado quando o diário for salvo)
            await supabase.from('daily_attendance').insert(attendanceData);
          }
        }

      toast.success('Frequência registrada com sucesso');
      if (onSave) {
        onSave(records);
      }
    } catch (error: any) {
      console.error('Erro ao salvar frequência:', error);
      toast.error(error.message || 'Erro ao salvar frequência');
    } finally {
      setSaving(false);
    }
  }

  const presentCount = Object.values(attendance).filter((a) => a.is_present).length;
  const absentCount = Object.values(attendance).filter((a) => !a.is_present).length;
  const totalCount = students.length;

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
              <Users className="h-5 w-5" />
              Registro de Frequência
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Data: {new Date(date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{totalCount}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-600">Presentes</p>
              <p className="text-lg font-semibold text-green-600">{presentCount}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-600">Faltas</p>
              <p className="text-lg font-semibold text-red-600">{absentCount}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {students.map((student) => {
            const isPresent = attendance[student.id]?.is_present ?? true;
            return (
              <div
                key={student.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <Checkbox
                  checked={isPresent}
                  onCheckedChange={() => handleToggleAttendance(student.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`student-${student.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {student.name}
                    </Label>
                    {isPresent ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Presente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Falta
                      </Badge>
                    )}
                  </div>
                  {!isPresent && (
                    <div className="mt-2">
                      <Textarea
                        placeholder="Justificativa da falta (opcional)"
                        value={justifications[student.id] || ''}
                        onChange={(e) =>
                          setJustifications((prev) => ({
                            ...prev,
                            [student.id]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t">
          <Button onClick={handleSaveAttendance} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Frequência'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

