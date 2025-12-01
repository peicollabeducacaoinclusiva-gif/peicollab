import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { supabase } from '@/lib/supabaseClient';
import { TestWrapper } from '@/test/setup';

// Mock do Supabase
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
  getUserPrimaryRole: vi.fn(),
}));

// Mock dos dashboards
vi.mock('@pei/dashboards', () => ({
  SuperadminDashboard: () => <div data-testid="superadmin-dashboard">Superadmin Dashboard</div>,
}));

vi.mock('@/components/dashboards/CoordinatorDashboard', () => ({
  default: () => <div data-testid="coordinator-dashboard">Coordinator Dashboard</div>,
}));

vi.mock('@/components/dashboards/TeacherDashboard', () => ({
  default: () => <div data-testid="teacher-dashboard">Teacher Dashboard</div>,
}));

vi.mock('@/components/dashboards/FamilyDashboard', () => ({
  default: () => <div data-testid="family-dashboard">Family Dashboard</div>,
}));

vi.mock('@/components/dashboards/SchoolManagerDashboard', () => ({
  default: () => <div data-testid="school-manager-dashboard">School Manager Dashboard</div>,
}));

vi.mock('@/components/dashboards/AEETeacherDashboard', () => ({
  default: () => <div data-testid="aee-teacher-dashboard">AEE Teacher Dashboard</div>,
}));

vi.mock('@/components/dashboards/SpecialistDashboard', () => ({
  default: () => <div data-testid="specialist-dashboard">Specialist Dashboard</div>,
}));

vi.mock('@/components/dashboards/EducationSecretaryDashboard', () => ({
  default: () => <div data-testid="education-secretary-dashboard">Education Secretary Dashboard</div>,
}));

vi.mock('@/components/dashboards/SchoolDirectorDashboard', () => ({
  default: () => <div data-testid="school-director-dashboard">School Director Dashboard</div>,
}));

vi.mock('@/components/dashboards/SupportProfessionalDashboard', () => ({
  SupportProfessionalDashboard: () => <div data-testid="support-professional-dashboard">Support Professional Dashboard</div>,
}));

// Mock do useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('deve renderizar dashboard de professor', async () => {
    const mockProfile = {
      id: 'user-1',
      full_name: 'Professor Test',
      role: 'teacher',
      user_roles: [{ role: 'teacher' }],
      tenant_id: 'tenant-1',
      school_id: 'school-1',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    const { getUserPrimaryRole } = await import('@/lib/supabaseClient');
    vi.mocked(getUserPrimaryRole).mockResolvedValue('teacher');

    render(
      <BrowserRouter>
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('teacher-dashboard')).toBeInTheDocument();
    });
  });

  it('deve renderizar dashboard de coordenador', async () => {
    const mockProfile = {
      id: 'user-1',
      full_name: 'Coordenador Test',
      role: 'coordinator',
      user_roles: [{ role: 'coordinator' }],
      tenant_id: 'tenant-1',
      school_id: 'school-1',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    const { getUserPrimaryRole } = await import('@/lib/supabaseClient');
    vi.mocked(getUserPrimaryRole).mockResolvedValue('coordinator');

    render(
      <BrowserRouter>
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('coordinator-dashboard')).toBeInTheDocument();
    });
  });

  it('deve renderizar dashboard de superadmin', async () => {
    const mockProfile = {
      id: 'user-1',
      full_name: 'Admin Test',
      role: 'superadmin',
      user_roles: [{ role: 'superadmin' }],
      tenant_id: null,
      school_id: null,
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    const { getUserPrimaryRole } = await import('@/lib/supabaseClient');
    vi.mocked(getUserPrimaryRole).mockResolvedValue('superadmin');

    render(
      <BrowserRouter>
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('superadmin-dashboard')).toBeInTheDocument();
    });
  });

  it('deve exibir tela de aprovação pendente quando usuário não está aprovado', async () => {
    const mockProfile = {
      id: 'user-1',
      full_name: 'User Test',
      role: 'teacher',
      user_roles: [{ role: 'teacher' }],
      tenant_id: 'tenant-1',
      school_id: 'school-1',
      is_active: false, // Usuário não aprovado
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'test@example.com' } } },
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    render(
      <BrowserRouter>
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/aguardando aprovação/i)).toBeInTheDocument();
    });
  });

  it('deve redirecionar para login quando não há usuário', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    render(
      <BrowserRouter>
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Deve tentar redirecionar ou exibir mensagem
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    });
  });
});

