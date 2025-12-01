import { describe, it, expect, vi, beforeEach } from 'vitest';
import { peiCollaborationService } from '../peiCollaborationService';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('peiCollaborationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addComment', () => {
    it('deve adicionar comentário com sucesso', async () => {
      const mockComment = {
        id: 'comment-1',
        pei_id: 'pei-1',
        user_id: 'user-1',
        comment: 'Comentário de teste',
        section: 'diagnosis',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockComment,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await peiCollaborationService.addComment({
        peiId: 'pei-1',
        comment: 'Comentário de teste',
        section: 'diagnosis',
      });

      expect(result).toEqual(mockComment);
      expect(mockSupabase.from).toHaveBeenCalledWith('pei_comments');
    });

    it('deve lançar erro quando inserção falha', async () => {
      const mockError = { message: 'Erro ao adicionar comentário' };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      await expect(
        peiCollaborationService.addComment({
          peiId: 'pei-1',
          comment: 'Test',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('getComments', () => {
    it('deve buscar todos os comentários de um PEI', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          pei_id: 'pei-1',
          comment: 'Comentário 1',
        },
        {
          id: 'comment-2',
          pei_id: 'pei-1',
          comment: 'Comentário 2',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockComments,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await peiCollaborationService.getComments('pei-1');

      expect(result).toEqual(mockComments);
      expect(mockSupabase.from).toHaveBeenCalledWith('pei_comments');
    });
  });

  describe('addCollaborator', () => {
    it('deve adicionar colaborador com sucesso', async () => {
      const mockCollaborator = {
        id: 'collab-1',
        pei_id: 'pei-1',
        user_id: 'user-2',
        role: 'editor',
        permissions: {},
        invited_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCollaborator,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await peiCollaborationService.addCollaborator({
        peiId: 'pei-1',
        userId: 'user-2',
        role: 'editor',
      });

      expect(result).toEqual(mockCollaborator);
    });
  });
});

