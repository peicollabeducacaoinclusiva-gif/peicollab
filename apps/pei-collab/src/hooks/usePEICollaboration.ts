import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  peiCollaborationService,
  PEIComment,
  PEICollaborator,
  PEISuggestion,
  AddCommentParams,
  AddCollaboratorParams,
} from '../services/peiCollaborationService';
import { useAuth } from './useAuth';

export function usePEIComments(peiId: string | null) {
  return useQuery<PEIComment[]>({
    queryKey: ['peiComments', peiId],
    queryFn: () => peiCollaborationService.getComments(peiId!),
    enabled: !!peiId,
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: 1000 * 30, // Refetch a cada 30 segundos para ver novos comentários
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddCommentParams) => peiCollaborationService.addComment(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peiComments', variables.peiId] });
    },
  });
}

export function useResolveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, peiId }: { commentId: string; peiId: string }) =>
      peiCollaborationService.resolveComment(commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peiComments', variables.peiId] });
    },
  });
}

export function useUnresolveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, peiId }: { commentId: string; peiId: string }) =>
      peiCollaborationService.unresolveComment(commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peiComments', variables.peiId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, peiId }: { commentId: string; peiId: string }) =>
      peiCollaborationService.deleteComment(commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peiComments', variables.peiId] });
    },
  });
}

export function usePEICollaborators(peiId: string | null) {
  return useQuery<PEICollaborator[]>({
    queryKey: ['peiCollaborators', peiId],
    queryFn: () => peiCollaborationService.getCollaborators(peiId!),
    enabled: !!peiId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useAddCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddCollaboratorParams) => peiCollaborationService.addCollaborator(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peiCollaborators', variables.peiId] });
    },
  });
}

export function useUpdateCollaboratorRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collaboratorId,
      role,
      peiId,
    }: {
      collaboratorId: string;
      role: 'owner' | 'editor' | 'reviewer' | 'viewer';
      peiId: string;
    }) => peiCollaborationService.updateCollaboratorRole(collaboratorId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peiCollaborators', variables.peiId] });
    },
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collaboratorId, peiId }: { collaboratorId: string; peiId: string }) =>
      peiCollaborationService.removeCollaborator(collaboratorId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peiCollaborators', variables.peiId] });
    },
  });
}

export function useUpdateLastActive() {
  return useMutation({
    mutationFn: ({ peiId, userId }: { peiId: string; userId: string }) =>
      peiCollaborationService.updateLastActive(peiId, userId),
  });
}

export function usePEISuggestions(peiId: string | null) {
  return useQuery<PEISuggestion[]>({
    queryKey: ['peiSuggestions', peiId],
    queryFn: () => peiCollaborationService.getSuggestions(peiId!),
    enabled: !!peiId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useAddSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestion: Omit<PEISuggestion, 'id' | 'created_at' | 'updated_at'>) =>
      peiCollaborationService.addSuggestion(suggestion),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peiSuggestions', variables.pei_id] });
    },
  });
}

export function useReviewSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      suggestionId,
      status,
      peiId,
    }: {
      suggestionId: string;
      status: 'accepted' | 'rejected';
      peiId: string;
    }) => peiCollaborationService.reviewSuggestion(suggestionId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['peiSuggestions', variables.peiId] });
    },
  });
}

