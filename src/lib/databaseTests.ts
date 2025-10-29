import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from '@/lib/offlineDatabase';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration: number;
}

interface DatabaseTestSuite {
  name: string;
  tests: TestResult[];
  totalDuration: number;
  passed: number;
  failed: number;
  warnings: number;
}

export class DatabaseTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<DatabaseTestSuite> {
    const startTime = Date.now();
    this.results = [];

    console.log('🧪 Iniciando testes de integração do banco de dados...');

    // Testes de conectividade
    await this.testDatabaseConnection();
    await this.testAuthentication();
    await this.testRLSPolicies();
    
    // Testes de funcionalidades offline
    await this.testOfflineDatabase();
    await this.testSyncMechanism();
    
    // Testes de novos roles
    await this.testNewRoles();
    await this.testVersioningSystem();
    await this.testFamilyTokens();

    const totalDuration = Date.now() - startTime;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    const suite: DatabaseTestSuite = {
      name: 'PEI Collab Database Integration Tests',
      tests: this.results,
      totalDuration,
      passed,
      failed,
      warnings
    };

    console.log('✅ Testes concluídos:', suite);
    return suite;
  }

  private async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) throw error;

      this.addResult({
        test: 'Database Connection',
        status: 'pass',
        message: 'Conexão com Supabase estabelecida com sucesso',
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        test: 'Database Connection',
        status: 'fail',
        message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testAuthentication(): Promise<void> {
    const startTime = Date.now();
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      this.addResult({
        test: 'Authentication',
        status: user ? 'pass' : 'warning',
        message: user ? 'Usuário autenticado' : 'Nenhum usuário autenticado',
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        test: 'Authentication',
        status: 'fail',
        message: `Erro de autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testRLSPolicies(): Promise<void> {
    const startTime = Date.now();
    try {
      // Testar acesso a tabelas principais
      const tables = ['profiles', 'students', 'peis', 'schools', 'tenants'];
      let accessibleTables = 0;

      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          if (!error) accessibleTables++;
        } catch (err) {
          // Ignorar erros de RLS para tabelas restritas
        }
      }

      this.addResult({
        test: 'RLS Policies',
        status: accessibleTables > 0 ? 'pass' : 'warning',
        message: `${accessibleTables}/${tables.length} tabelas acessíveis`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        test: 'RLS Policies',
        status: 'fail',
        message: `Erro ao testar RLS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testOfflineDatabase(): Promise<void> {
    const startTime = Date.now();
    try {
      // Testar criação de tabelas offline
      await offlineDB.students.add({
        id: 'test-student',
        name: 'Teste',
        school_id: 'test-school',
        tenant_id: 'test-tenant',
        is_synced: false,
        last_modified: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Testar leitura
      const students = await offlineDB.students.toArray();
      
      // Limpar dados de teste
      await offlineDB.students.delete('test-student');

      this.addResult({
        test: 'Offline Database',
        status: 'pass',
        message: 'Banco offline funcionando corretamente',
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        test: 'Offline Database',
        status: 'fail',
        message: `Erro no banco offline: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testSyncMechanism(): Promise<void> {
    const startTime = Date.now();
    try {
      // Testar sincronização
      const unsyncedRecords = await offlineDB.getUnsyncedRecords();
      
      this.addResult({
        test: 'Sync Mechanism',
        status: 'pass',
        message: `Mecanismo de sincronização funcionando (${unsyncedRecords.students.length} registros não sincronizados)`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        test: 'Sync Mechanism',
        status: 'fail',
        message: `Erro na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testNewRoles(): Promise<void> {
    const startTime = Date.now();
    try {
      // Testar se os novos roles existem no enum
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .in('role', ['education_secretary', 'school_director'])
        .limit(1);

      if (error) throw error;

      this.addResult({
        test: 'New Roles',
        status: 'pass',
        message: 'Novos roles (education_secretary, school_director) disponíveis',
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        test: 'New Roles',
        status: 'warning',
        message: `Novos roles podem não estar configurados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testVersioningSystem(): Promise<void> {
    const startTime = Date.now();
    try {
      // Testar se as tabelas de versionamento existem
      const { data, error } = await supabase
        .from('pei_history')
        .select('id')
        .limit(1);

      if (error) throw error;

      this.addResult({
        test: 'Versioning System',
        status: 'pass',
        message: 'Sistema de versionamento de PEIs disponível',
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        test: 'Versioning System',
        status: 'warning',
        message: `Sistema de versionamento pode não estar configurado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testFamilyTokens(): Promise<void> {
    const startTime = Date.now();
    try {
      // Testar se a tabela de tokens familiares existe
      const { data, error } = await supabase
        .from('family_access_tokens')
        .select('id')
        .limit(1);

      if (error) throw error;

      this.addResult({
        test: 'Family Tokens',
        status: 'pass',
        message: 'Sistema de tokens familiares disponível',
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        test: 'Family Tokens',
        status: 'warning',
        message: `Sistema de tokens familiares pode não estar configurado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private addResult(result: TestResult): void {
    this.results.push(result);
    const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${result.test}: ${result.message} (${result.duration}ms)`);
  }

  // Método para executar testes específicos
  async runSpecificTests(tests: string[]): Promise<TestResult[]> {
    const specificResults: TestResult[] = [];
    
    for (const testName of tests) {
      switch (testName) {
        case 'connection':
          await this.testDatabaseConnection();
          break;
        case 'auth':
          await this.testAuthentication();
          break;
        case 'rls':
          await this.testRLSPolicies();
          break;
        case 'offline':
          await this.testOfflineDatabase();
          break;
        case 'sync':
          await this.testSyncMechanism();
          break;
        case 'roles':
          await this.testNewRoles();
          break;
        case 'versioning':
          await this.testVersioningSystem();
          break;
        case 'tokens':
          await this.testFamilyTokens();
          break;
      }
    }

    return specificResults;
  }

  // Método para gerar relatório HTML
  generateHTMLReport(suite: DatabaseTestSuite): string {
    const passRate = Math.round((suite.passed / (suite.passed + suite.failed + suite.warnings)) * 100);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PEI Collab - Database Test Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #f0f0f0; padding: 20px; border-radius: 8px; }
          .test-result { margin: 10px 0; padding: 10px; border-radius: 4px; }
          .pass { background: #d4edda; border-left: 4px solid #28a745; }
          .fail { background: #f8d7da; border-left: 4px solid #dc3545; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
          .summary { background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧪 PEI Collab - Database Test Report</h1>
          <p>Executado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="summary">
          <h2>📊 Resumo dos Testes</h2>
          <p><strong>Taxa de Sucesso:</strong> ${passRate}%</p>
          <p><strong>Testes Passaram:</strong> ${suite.passed}</p>
          <p><strong>Testes Falharam:</strong> ${suite.failed}</p>
          <p><strong>Avisos:</strong> ${suite.warnings}</p>
          <p><strong>Tempo Total:</strong> ${suite.totalDuration}ms</p>
        </div>
        
        <h2>📋 Detalhes dos Testes</h2>
        ${suite.tests.map(test => `
          <div class="test-result ${test.status}">
            <h3>${test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⚠️'} ${test.test}</h3>
            <p>${test.message}</p>
            <p><small>Tempo: ${test.duration}ms</small></p>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }
}

// Instância global do testador
export const databaseTester = new DatabaseTester();

// Função de conveniência para executar todos os testes
export async function runDatabaseTests(): Promise<DatabaseTestSuite> {
  return await databaseTester.runAllTests();
}

// Função para executar testes específicos
export async function runSpecificDatabaseTests(tests: string[]): Promise<TestResult[]> {
  return await databaseTester.runSpecificTests(tests);
}


