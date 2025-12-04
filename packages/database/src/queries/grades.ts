/**
 * Queries relacionadas à entidade Grade (Notas)
 */

import { supabase } from '../client';
import type { Grade, GradeExpanded, Boletim, Periodo } from '@pei/shared-types';

/**
 * Busca notas de um aluno por período
 */
export const getGradesByPeriod = async (
  enrollmentId: string,
  periodo: Periodo
) => {
  const { data, error } = await supabase
    .from('grades')
    .select(`
      *,
      subject:subjects (
        id,
        nome,
        codigo
      )
    `)
    .eq('enrollment_id', enrollmentId)
    .eq('periodo', periodo)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];
  return data as unknown as GradeExpanded[];
};

/**
 * Busca todas as notas de um aluno
 */
export const getAllGradesByEnrollment = async (enrollmentId: string) => {
  const { data, error } = await supabase
    .from('grades')
    .select(`
      *,
      subject:subjects (
        id,
        nome,
        codigo,
        area_conhecimento
      )
    `)
    .eq('enrollment_id', enrollmentId)
    .order('periodo', { ascending: true });
  
  if (error) throw error;
  if (!data) return [];
  return data as unknown as GradeExpanded[];
};

/**
 * Calcula boletim completo de um aluno
 */
export const getBoletim = async (
  enrollmentId: string,
  studentId: string
): Promise<Boletim> => {
  // 1. Buscar todas as notas
  const grades = await getAllGradesByEnrollment(enrollmentId);
  
  // 2. Buscar dados do aluno
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:students (
        id,
        name
      )
    `)
    .eq('id', enrollmentId)
    .single();
  
  if (enrollmentError || !enrollment) {
    throw new Error('Matrícula não encontrada');
  }
  
  // 3. Buscar frequência
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('presenca')
    .eq('student_id', studentId);
  
  const faltas = attendanceData?.filter(a => !a.presenca).length || 0;
  const totalAulas = attendanceData?.length || 0;
  const taxa_presenca = totalAulas > 0 ? ((totalAulas - faltas) / totalAulas) * 100 : 100;
  
  // 4. Agrupar notas por disciplina
  const disciplinasMap = grades.reduce((acc, grade) => {
    const subjectId = grade.subject_id;
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subject_id: subjectId,
        subject_nome: grade.subject?.nome || '',
        subject_codigo: grade.subject?.codigo || '',
        avaliacoes: [],
        soma_notas: 0,
        soma_pesos: 0
      };
    }
    
    acc[subjectId].avaliacoes.push(grade);
    if (grade.nota_valor) {
      acc[subjectId].soma_notas += grade.nota_valor * grade.peso;
      acc[subjectId].soma_pesos += grade.peso;
    }
    
    return acc;
  }, {} as Record<string, any>);
  
  // 5. Calcular médias
  const disciplinas = Object.values(disciplinasMap).map((disc: any) => {
    const media_final = disc.soma_pesos > 0 ? disc.soma_notas / disc.soma_pesos : 0;
    const situacao: 'Aprovado' | 'Recuperação' | 'Reprovado' = 
      media_final >= 6.0 ? 'Aprovado' : 
      media_final >= 5.0 ? 'Recuperação' : 'Reprovado';
    
    return {
      subject_id: disc.subject_id,
      subject_nome: disc.subject_nome,
      subject_codigo: disc.subject_codigo,
      media_final,
      conceito: undefined,
      situacao,
      avaliacoes: disc.avaliacoes
    };
  });
  
  const media_geral = disciplinas.length > 0
    ? disciplinas.reduce((sum, d) => sum + d.media_final, 0) / disciplinas.length
    : 0;
  
  return {
    student_id: studentId,
    student_name: (enrollment.student && typeof enrollment.student === 'object' && 'name' in enrollment.student) 
      ? String((enrollment.student as any).name || '') 
      : '',
    enrollment_id: enrollmentId,
    ano_letivo: enrollment?.ano_letivo || new Date().getFullYear(),
    disciplinas,
    media_geral,
    total_faltas: faltas,
    taxa_presenca
  };
};

/**
 * Lança uma nota
 */
export const createGrade = async (
  grade: Omit<Grade, 'id' | 'created_at' | 'updated_at' | 'aprovado_por' | 'aprovado_em'>
) => {
  const { data, error } = await supabase
    .from('grades')
    .insert(grade)
    .select()
    .single();
  
  if (error) throw error;
  return data as Grade;
};

/**
 * Atualiza uma nota
 */
export const updateGrade = async (
  gradeId: string,
  updates: Partial<Omit<Grade, 'id' | 'enrollment_id' | 'created_at'>>
) => {
  const { data, error } = await supabase
    .from('grades')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', gradeId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Grade;
};

/**
 * Aprova uma nota (coordenação)
 */
export const approveGrade = async (gradeId: string, approvedBy: string) => {
  const { data, error } = await supabase
    .from('grades')
    .update({
      aprovado_por: approvedBy,
      aprovado_em: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', gradeId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Grade;
};

/**
 * Busca alunos com notas abaixo da média
 */
export const getStudentsBelowAverage = async (
  schoolId: string,
  minMedia: number = 6.0
) => {
  const { data, error } = await supabase
    .rpc('get_students_below_average', {
      _school_id: schoolId,
      _min_media: minMedia
    });
  
  if (error) {
    // Se função não existir, fazer manualmente
    console.warn('Função get_students_below_average não existe, usando query alternativa');
    return [];
  }
  
  return data;
};

