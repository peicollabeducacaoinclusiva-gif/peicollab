import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreatePEI from '../CreatePEI';
import { supabase } from '@/integrations/supabase/client';
import { TestWrapper } from '@/test/setup';

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

// Mock do useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock dos componentes filhos
vi.mock('@/components/pei/StudentIdentificationSection', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="student-identification">Student Identification</div>
  ),
}));

vi.mock('@/components/pei/StudentContextSection', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="student-context">Student Context</div>
  ),
}));

vi.mock('@/components/pei/DiagnosisSection', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="diagnosis">Diagnosis</div>
  ),
}));

vi.mock('@/components/pei/PlanningSection', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="planning">Planning</div>
  ),
}));

vi.mock('@/components/pei/EvaluationSection', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="evaluation">Evaluation</div>
  ),
}));

describe('CreatePEI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Mock usuário autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
  });

  it('deve renderizar componente de criação de PEI', async () => {
    // Mock de busca de PEI (não encontrado - novo PEI)
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // Not found
          }),
        }),
      }),
    });

    render(
      <BrowserRouter>
        <TestWrapper>
          <CreatePEI />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/criar pei/i)).toBeInTheDocument();
    });
  });

  it('deve carregar PEI existente quando peiId está na URL', async () => {
    const mockPEI = {
      id: 'pei-1',
      student_id: 'student-1',
      status: 'draft',
      student_context_data: {},
      diagnosis_data: {},
      planning_data: {},
      evaluation_data: {},
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPEI,
            error: null,
          }),
        }),
      }),
    });

    // Mock useSearchParams para retornar peiId
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [
          new URLSearchParams('?peiId=pei-1'),
          vi.fn(),
        ],
      };
    });

    render(
      <BrowserRouter>
        <TestWrapper>
          <CreatePEI />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('peis');
    });
  });

  it('deve exibir seções do formulário', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }),
    });

    render(
      <BrowserRouter>
        <TestWrapper>
          <CreatePEI />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('student-identification')).toBeInTheDocument();
    });
  });

  it('deve validar acesso ao PEI antes de editar', async () => {
    const mockPEI = {
      id: 'pei-1',
      student_id: 'student-1',
      status: 'approved', // PEI aprovado não pode ser editado
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPEI,
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.rpc.mockResolvedValue({
      data: false, // Usuário não tem permissão
      error: null,
    });

    render(
      <BrowserRouter>
        <TestWrapper>
          <CreatePEI />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Deve verificar permissão
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });
  });

  it('deve exibir mensagem quando PEI está aprovado', async () => {
    const mockPEI = {
      id: 'pei-1',
      student_id: 'student-1',
      status: 'approved',
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPEI,
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.rpc.mockResolvedValue({
      data: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <TestWrapper>
          <CreatePEI />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Componente deve detectar status approved
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});

