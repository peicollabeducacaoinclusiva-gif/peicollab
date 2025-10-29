import { supabase } from '@/integrations/supabase/client';

export interface UsabilityTest {
  id: string;
  name: string;
  description: string;
  tasks: UsabilityTask[];
  participants: string[];
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface UsabilityTask {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedOutcome: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // em minutos
}

export interface UsabilitySession {
  id: string;
  test_id: string;
  participant_id: string;
  participant_name: string;
  participant_role: string;
  start_time: string;
  end_time?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  tasks_completed: number;
  total_tasks: number;
  feedback: string;
  issues_found: UsabilityIssue[];
  metrics: UsabilityMetrics;
}

export interface UsabilityIssue {
  id: string;
  task_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'navigation' | 'form' | 'performance' | 'accessibility' | 'content' | 'other';
  description: string;
  steps_to_reproduce: string[];
  suggested_fix: string;
  screenshot_url?: string;
  timestamp: string;
}

export interface UsabilityMetrics {
  task_completion_rate: number;
  average_task_time: number;
  error_rate: number;
  satisfaction_score: number; // 1-5
  ease_of_use_score: number; // 1-5
  overall_score: number; // 1-5
}

export class UsabilityTestingService {
  private static instance: UsabilityTestingService;

  private constructor() {}

  public static getInstance(): UsabilityTestingService {
    if (!UsabilityTestingService.instance) {
      UsabilityTestingService.instance = new UsabilityTestingService();
    }
    return UsabilityTestingService.instance;
  }

  // Criar um novo teste de usabilidade
  public async createTest(test: Omit<UsabilityTest, 'id' | 'created_at' | 'updated_at'>): Promise<UsabilityTest> {
    try {
      const { data, error } = await supabase
        .from('usability_tests')
        .insert({
          name: test.name,
          description: test.description,
          tasks: test.tasks,
          participants: test.participants,
          status: test.status
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar teste de usabilidade:', error);
      throw error;
    }
  }

  // Obter todos os testes
  public async getTests(): Promise<UsabilityTest[]> {
    try {
      const { data, error } = await supabase
        .from('usability_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter testes de usabilidade:', error);
      return [];
    }
  }

  // Obter um teste específico
  public async getTest(testId: string): Promise<UsabilityTest | null> {
    try {
      const { data, error } = await supabase
        .from('usability_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter teste de usabilidade:', error);
      return null;
    }
  }

  // Iniciar uma sessão de teste
  public async startSession(testId: string, participant: {
    name: string;
    role: string;
    email?: string;
  }): Promise<UsabilitySession> {
    try {
      const test = await this.getTest(testId);
      if (!test) throw new Error('Teste não encontrado');

      const { data, error } = await supabase
        .from('usability_sessions')
        .insert({
          test_id: testId,
          participant_name: participant.name,
          participant_role: participant.role,
          start_time: new Date().toISOString(),
          status: 'in_progress',
          tasks_completed: 0,
          total_tasks: test.tasks.length,
          metrics: {
            task_completion_rate: 0,
            average_task_time: 0,
            error_rate: 0,
            satisfaction_score: 0,
            ease_of_use_score: 0,
            overall_score: 0
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao iniciar sessão de teste:', error);
      throw error;
    }
  }

  // Finalizar uma sessão de teste
  public async completeSession(sessionId: string, feedback: {
    satisfaction_score: number;
    ease_of_use_score: number;
    overall_score: number;
    feedback: string;
    issues: Omit<UsabilityIssue, 'id' | 'session_id' | 'timestamp'>[];
  }): Promise<UsabilitySession> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('usability_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Calcular métricas
      const metrics: UsabilityMetrics = {
        task_completion_rate: (session.tasks_completed / session.total_tasks) * 100,
        average_task_time: this.calculateAverageTaskTime(session),
        error_rate: this.calculateErrorRate(session),
        satisfaction_score: feedback.satisfaction_score,
        ease_of_use_score: feedback.ease_of_use_score,
        overall_score: feedback.overall_score
      };

      // Atualizar sessão
      const { data, error } = await supabase
        .from('usability_sessions')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed',
          feedback: feedback.feedback,
          metrics: metrics
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // Salvar issues encontrados
      if (feedback.issues.length > 0) {
        await this.saveIssues(sessionId, feedback.issues);
      }

      return data;
    } catch (error) {
      console.error('Erro ao finalizar sessão de teste:', error);
      throw error;
    }
  }

  // Salvar issues encontrados
  private async saveIssues(sessionId: string, issues: Omit<UsabilityIssue, 'id' | 'session_id' | 'timestamp'>[]): Promise<void> {
    try {
      const issuesWithTimestamp = issues.map(issue => ({
        ...issue,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('usability_issues')
        .insert(issuesWithTimestamp);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar issues:', error);
    }
  }

  // Calcular tempo médio das tarefas
  private calculateAverageTaskTime(session: UsabilitySession): number {
    if (!session.start_time || !session.end_time) return 0;
    
    const startTime = new Date(session.start_time).getTime();
    const endTime = new Date(session.end_time).getTime();
    const totalTime = (endTime - startTime) / 1000 / 60; // em minutos
    
    return totalTime / session.total_tasks;
  }

  // Calcular taxa de erro
  private calculateErrorRate(session: UsabilitySession): number {
    // Implementar lógica para calcular taxa de erro
    // Por enquanto, retornar 0
    return 0;
  }

  // Obter relatório de um teste
  public async getTestReport(testId: string): Promise<{
    test: UsabilityTest;
    sessions: UsabilitySession[];
    summary: {
      total_participants: number;
      completion_rate: number;
      average_satisfaction: number;
      average_ease_of_use: number;
      total_issues: number;
      critical_issues: number;
    };
  }> {
    try {
      const test = await this.getTest(testId);
      if (!test) throw new Error('Teste não encontrado');

      const { data: sessions, error } = await supabase
        .from('usability_sessions')
        .select('*')
        .eq('test_id', testId);

      if (error) throw error;

      const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
      
      const summary = {
        total_participants: sessions?.length || 0,
        completion_rate: completedSessions.length / (sessions?.length || 1) * 100,
        average_satisfaction: this.calculateAverage(completedSessions.map(s => s.metrics.satisfaction_score)),
        average_ease_of_use: this.calculateAverage(completedSessions.map(s => s.metrics.ease_of_use_score)),
        total_issues: 0, // Implementar contagem de issues
        critical_issues: 0 // Implementar contagem de issues críticas
      };

      return {
        test,
        sessions: sessions || [],
        summary
      };
    } catch (error) {
      console.error('Erro ao obter relatório do teste:', error);
      throw error;
    }
  }

  // Calcular média
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  // Templates de testes pré-definidos
  public getTestTemplates(): UsabilityTest[] {
    return [
      {
        id: 'template-1',
        name: 'Teste de Navegação Mobile',
        description: 'Avaliar a facilidade de navegação em dispositivos móveis',
        tasks: [
          {
            id: 'task-1',
            title: 'Acessar Dashboard',
            description: 'Navegar até o dashboard principal',
            steps: ['Abrir o app', 'Fazer login', 'Acessar dashboard'],
            expectedOutcome: 'Dashboard carregado com sucesso',
            difficulty: 'easy',
            estimatedTime: 2
          },
          {
            id: 'task-2',
            title: 'Criar Novo PEI',
            description: 'Criar um novo Plano Educacional Individualizado',
            steps: ['Clicar em "Novo PEI"', 'Preencher dados do aluno', 'Salvar PEI'],
            expectedOutcome: 'PEI criado e salvo',
            difficulty: 'medium',
            estimatedTime: 10
          }
        ],
        participants: [],
        status: 'draft'
      },
      {
        id: 'template-2',
        name: 'Teste de Acessibilidade',
        description: 'Avaliar a acessibilidade do sistema',
        tasks: [
          {
            id: 'task-3',
            title: 'Navegação por Teclado',
            description: 'Navegar pelo sistema usando apenas o teclado',
            steps: ['Usar Tab para navegar', 'Usar Enter para ativar', 'Usar Escape para fechar'],
            expectedOutcome: 'Navegação fluida por teclado',
            difficulty: 'medium',
            estimatedTime: 5
          }
        ],
        participants: [],
        status: 'draft'
      }
    ];
  }
}

// Instância global do serviço
export const usabilityTestingService = UsabilityTestingService.getInstance();

// Hook para usar testes de usabilidade em componentes React
export const useUsabilityTesting = () => {
  const createTest = (test: Omit<UsabilityTest, 'id' | 'created_at' | 'updated_at'>) => 
    usabilityTestingService.createTest(test);
  
  const getTests = () => usabilityTestingService.getTests();
  const getTest = (testId: string) => usabilityTestingService.getTest(testId);
  const startSession = (testId: string, participant: { name: string; role: string; email?: string }) => 
    usabilityTestingService.startSession(testId, participant);
  const completeSession = (sessionId: string, feedback: any) => 
    usabilityTestingService.completeSession(sessionId, feedback);
  const getTestReport = (testId: string) => usabilityTestingService.getTestReport(testId);
  const getTestTemplates = () => usabilityTestingService.getTestTemplates();

  return {
    createTest,
    getTests,
    getTest,
    startSession,
    completeSession,
    getTestReport,
    getTestTemplates
  };
};


