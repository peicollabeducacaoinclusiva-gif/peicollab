/**
 * Queries relacionadas à entidade Student
 */

import { supabase } from '../client';
import type { Student } from '@pei/shared-types';

/**
 * Busca todos os alunos de uma escola
 */
export const getStudentsBySchool = async (
  schoolId: string,
  filters?: {
    status?: Student['status_matricula'];
    necessidadesEspeciais?: boolean;
    search?: string;
  }
) => {
  let query = supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId);
  
  if (filters?.status) {
    query = query.eq('status_matricula', filters.status);
  }
  
  if (filters?.necessidadesEspeciais !== undefined) {
    query = query.eq('necessidades_especiais', filters.necessidadesEspeciais);
  }
  
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,codigo_identificador.ilike.%${filters.search}%`);
  }
  
  const { data, error } = await query.order('name');
  
  if (error) throw error;
  return data as Student[];
};

/**
 * Busca um aluno por ID
 */
export const getStudentById = async (studentId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
  
  if (error) throw error;
  return data as Student;
};

/**
 * Busca aluno com contexto acadêmico completo (matrícula, turma, etc)
 */
export const getStudentWithAcademic = async (studentId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      enrollments!inner (
        id,
        class_id,
        ano_letivo,
        status,
        classes (
          id,
          class_name,
          education_level,
          grade,
          shift
        )
      )
    `)
    .eq('id', studentId)
    .eq('enrollments.status', 'Matriculado')
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Busca alunos elegíveis para criar PEI (com necessidades especiais)
 */
export const getStudentsForPEI = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      enrollments!left (
        id,
        class_id,
        classes (
          class_name
        )
      ),
      peis!left (
        id,
        is_active_version
      )
    `)
    .eq('school_id', schoolId)
    .eq('necessidades_especiais', true)
    .eq('status_matricula', 'Ativo')
    .order('name');
  
  if (error) throw error;
  return data;
};

/**
 * Cria um novo aluno
 */
export const createStudent = async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();
  
  if (error) throw error;
  return data as Student;
};

/**
 * Atualiza um aluno
 */
export const updateStudent = async (
  studentId: string,
  updates: Partial<Omit<Student, 'id' | 'created_at'>>
) => {
  const { data, error } = await supabase
    .from('students')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', studentId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Student;
};

/**
 * Busca contexto acadêmico do aluno (via função SQL)
 */
export const getStudentAcademicContext = async (studentId: string) => {
  const { data, error } = await supabase
    .rpc('get_student_academic_context', {
      _student_id: studentId
    });
  
  if (error) throw error;
  return data as {
    turma: string;
    nivel: string;
    frequencia_percentual: number;
    media_geral: number;
    disciplinas_abaixo_media: number;
    faltas_mes_atual: number;
    em_risco: boolean;
  };
};

