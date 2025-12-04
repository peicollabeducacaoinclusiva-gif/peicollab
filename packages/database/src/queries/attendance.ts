/**
 * Queries relacionadas à entidade Attendance (Frequência)
 */

import { supabase } from '../client';
import type { Attendance, AttendanceStats, AttendanceExpanded } from '@pei/shared-types';

/**
 * Busca frequência de um aluno em um período
 */
export const getStudentAttendance = async (
  studentId: string,
  startDate: string,
  endDate: string
) => {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      subject:subjects (
        id,
        nome,
        codigo
      ),
      class:classes (
        id,
        class_name
      )
    `)
    .eq('student_id', studentId)
    .gte('data', startDate)
    .lte('data', endDate)
    .order('data', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];
  return data as unknown as AttendanceExpanded[];
};

/**
 * Busca frequência de uma turma em uma data
 */
export const getClassAttendanceByDate = async (
  classId: string,
  date: string,
  subjectId?: string
) => {
  let query = supabase
    .from('attendance')
    .select(`
      *,
      student:students (
        id,
        name,
        codigo_identificador
      )
    `)
    .eq('class_id', classId)
    .eq('data', date);
  
  if (subjectId) {
    query = query.eq('subject_id', subjectId);
  } else {
    query = query.is('subject_id', null);
  }
  
  const { data, error } = await query.order('student.name');
  
  if (error) throw error;
  if (!data) return [];
  return data as unknown as AttendanceExpanded[];
};

/**
 * Calcula estatísticas de frequência de um aluno
 */
export const getAttendanceStats = async (
  studentId: string,
  daysBack: number = 30
): Promise<AttendanceStats> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .gte('data', startDate.toISOString().split('T')[0]);
  
  if (error) throw error;
  
  const attendance = data as Attendance[];
  const presencas = attendance.filter(a => a.presenca).length;
  const faltas = attendance.filter(a => !a.presenca).length;
  const atrasos = attendance.filter(a => a.atraso_minutos > 0).length;
  
  // Faltas do mês atual
  const inicioMes = new Date();
  inicioMes.setDate(1);
  const faltasMes = attendance.filter(
    a => !a.presenca && new Date(a.data) >= inicioMes
  ).length;
  
  return {
    total_aulas: attendance.length,
    presencas,
    faltas,
    atrasos,
    taxa_presenca: attendance.length > 0 ? (presencas / attendance.length) * 100 : 100,
    faltas_mes_atual: faltasMes
  };
};

/**
 * Registra frequência de um aluno
 */
export const createAttendance = async (
  attendance: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'is_synced'>
) => {
  const { data, error } = await supabase
    .from('attendance')
    .insert({ ...attendance, is_synced: true })
    .select()
    .single();
  
  if (error) throw error;
  return data as Attendance;
};

/**
 * Registra frequência em lote (diário de classe)
 */
export const createBatchAttendance = async (
  attendances: Array<Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'is_synced'>>
) => {
  const { data, error } = await supabase
    .from('attendance')
    .insert(attendances.map(a => ({ ...a, is_synced: true })))
    .select();
  
  if (error) throw error;
  return data as Attendance[];
};

/**
 * Atualiza registro de frequência
 */
export const updateAttendance = async (
  attendanceId: string,
  updates: Partial<Omit<Attendance, 'id' | 'student_id' | 'data' | 'created_at'>>
) => {
  const { data, error } = await supabase
    .from('attendance')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', attendanceId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Attendance;
};

/**
 * Busca alunos com faltas acumuladas (em risco)
 */
export const getStudentsWithHighAbsence = async (
  schoolId: string,
  minFaltas: number = 5
) => {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      student_id,
      students (
        id,
        name
      ),
      class:classes (
        class_name
      )
    `)
    .eq('students.school_id', schoolId)
    .eq('presenca', false)
    .gte('data', inicioMes.toISOString().split('T')[0]);
  
  if (error) throw error;
  
  // Agrupar por aluno e contar faltas
  if (!data) return [];
  
  const grouped = data.reduce((acc, curr) => {
    const studentId = curr.student_id;
    if (!studentId) return acc;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: curr.students,
        class: curr.class,
        faltas: 0
      };
    }
    acc[studentId].faltas++;
    return acc;
  }, {} as Record<string, any>);
  
  // Filtrar apenas alunos com faltas >= minFaltas
  return Object.values(grouped).filter((item: any) => item.faltas >= minFaltas);
};

