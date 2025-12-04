/**
 * Queries relacionadas à entidade GradeLevel (Níveis de Ensino)
 */

import { supabase } from '../client';
import type { GradeLevel, Modalidade } from '@pei/shared-types';

/**
 * Busca todos os níveis de ensino ativos
 */
export const getGradeLevels = async (filters?: { 
  modalidade?: Modalidade;
  isActive?: boolean;
}) => {
  let query = supabase
    .from('grade_levels')
    .select('*')
    .order('codigo');
  
  if (filters?.modalidade) {
    query = query.eq('modalidade', filters.modalidade);
  }
  
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as GradeLevel[];
};

/**
 * Busca um nível de ensino por código
 */
export const getGradeLevelByCode = async (codigo: string) => {
  const { data, error } = await supabase
    .from('grade_levels')
    .select('*')
    .eq('codigo', codigo)
    .single();
  
  if (error) throw error;
  return data as GradeLevel;
};

/**
 * Cria um novo nível de ensino
 */
export const createGradeLevel = async (
  gradeLevel: Omit<GradeLevel, 'id' | 'created_at' | 'updated_at'>
) => {
  const { data, error } = await supabase
    .from('grade_levels')
    .insert(gradeLevel)
    .select()
    .single();
  
  if (error) throw error;
  return data as GradeLevel;
};

