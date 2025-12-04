/**
 * Hook para gerenciar subjects (disciplinas)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Subject } from '@pei/shared-types';
import {
  getSubjects,
  getSubjectsByArea,
  getSubjectByCode,
  createSubject
} from '../queries/subjects';

/**
 * Hook para buscar todas as disciplinas
 */
export const useSubjects = (filters?: Parameters<typeof getSubjects>[0]) => {
  return useQuery({
    queryKey: ['subjects', filters],
    queryFn: () => getSubjects(filters)
  });
};

/**
 * Hook para buscar disciplinas por área
 */
export const useSubjectsByArea = (areaConhecimento: string) => {
  return useQuery({
    queryKey: ['subjects', 'area', areaConhecimento],
    queryFn: () => getSubjectsByArea(areaConhecimento),
    enabled: !!areaConhecimento
  });
};

/**
 * Hook para buscar disciplina por código
 */
export const useSubjectByCode = (codigo: string) => {
  return useQuery({
    queryKey: ['subjects', 'code', codigo],
    queryFn: () => getSubjectByCode(codigo),
    enabled: !!codigo
  });
};

/**
 * Hook para criar disciplina
 */
export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    }
  });
};

