/**
 * Queries relacionadas à entidade Enrollment (Matrículas)
 */

import { supabase } from '../client';
import type { Enrollment, EnrollmentExpanded } from '@pei/shared-types';

/**
 * Busca todas as matrículas de uma escola
 */
export const getEnrollmentsBySchool = async (
  schoolId: string,
  filters?: {
    anoLetivo?: number;
    status?: Enrollment['status'];
  }
) => {
  let query = supabase
    .from('enrollments')
    .select(`
      *,
      student:students (
        id,
        name,
        codigo_identificador
      ),
      class:classes (
        id,
        class_name,
        education_level,
        grade
      )
    `)
    .eq('school_id', schoolId);
  
  if (filters?.anoLetivo) {
    query = query.eq('ano_letivo', filters.anoLetivo);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];
  return data as unknown as EnrollmentExpanded[];
};

/**
 * Busca matrícula ativa de um aluno
 */
export const getActiveEnrollment = async (studentId: string) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      class:classes (
        id,
        class_name,
        education_level,
        grade,
        shift
      )
    `)
    .eq('student_id', studentId)
    .eq('status', 'Matriculado')
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Não encontrado
    throw error;
  }
  if (!data) return null;
  return data as unknown as EnrollmentExpanded;
};

/**
 * Busca alunos matriculados em uma turma
 */
export const getEnrollmentsByClass = async (classId: string) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:students (
        id,
        name,
        codigo_identificador,
        necessidades_especiais,
        tipo_necessidade
      )
    `)
    .eq('class_id', classId)
    .eq('status', 'Matriculado')
    .order('student.name');
  
  if (error) throw error;
  if (!data) return [];
  return data as unknown as EnrollmentExpanded[];
};

/**
 * Cria uma nova matrícula
 */
export const createEnrollment = async (
  enrollment: Omit<Enrollment, 'id' | 'created_at' | 'updated_at'>
) => {
  const { data, error } = await supabase
    .from('enrollments')
    .insert(enrollment)
    .select()
    .single();
  
  if (error) throw error;
  return data as Enrollment;
};

/**
 * Atualiza status de uma matrícula
 */
export const updateEnrollmentStatus = async (
  enrollmentId: string,
  status: Enrollment['status'],
  motivoSaida?: string
) => {
  const updates: Partial<Enrollment> = {
    status,
    updated_at: new Date().toISOString()
  };
  
  if (status !== 'Matriculado') {
    updates.data_saida = new Date().toISOString();
    if (motivoSaida) {
      updates.motivo_saida = motivoSaida;
    }
  }
  
  const { data, error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Enrollment;
};

/**
 * Transferir aluno para outra turma
 */
export const transferStudent = async (
  studentId: string,
  newClassId: string,
  anoLetivo: number
) => {
  // 1. Finalizar matrícula atual
  const currentEnrollment = await getActiveEnrollment(studentId);
  if (currentEnrollment) {
    await updateEnrollmentStatus(currentEnrollment.id, 'Transferido', 'Transferência interna');
  }
  
  // 2. Criar nova matrícula
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('school_id')
    .eq('id', newClassId)
    .single();

  if (classError || !classData) throw new Error('Turma não encontrada');
  
  const schoolId = classData.school_id;
  if (!schoolId) throw new Error('Turma sem escola associada');
  
  return await createEnrollment({
    student_id: studentId,
    class_id: newClassId,
    school_id: schoolId.school_id,
    ano_letivo: anoLetivo,
    data_matricula: new Date().toISOString(),
    modalidade: 'Transferência',
    status: 'Matriculado'
  });
};

