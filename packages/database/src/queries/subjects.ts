/**
 * Queries relacionadas à entidade Subject (Disciplinas)
 */

import { supabase } from '../client';
import type { Subject } from '@pei/shared-types';

/**
 * Busca todas as disciplinas ativas de um tenant
 */
export const getSubjects = async (filters?: { isActive?: boolean }) => {
  let query = supabase
    .from('subjects')
    .select('*')
    .order('nome');
  
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as Subject[];
};

/**
 * Busca disciplinas por área de conhecimento
 */
export const getSubjectsByArea = async (areaConhecimento: string) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('area_conhecimento', areaConhecimento)
    .eq('is_active', true)
    .order('nome');
  
  if (error) throw error;
  return data as Subject[];
};

/**
 * Busca uma disciplina por código
 */
export const getSubjectByCode = async (codigo: string) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('codigo', codigo)
    .single();
  
  if (error) throw error;
  return data as Subject;
};

/**
 * Cria uma nova disciplina
 */
export const createSubject = async (
  subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>
) => {
  const { data, error } = await supabase
    .from('subjects')
    .insert(subject)
    .select()
    .single();
  
  if (error) throw error;
  return data as Subject;
};

