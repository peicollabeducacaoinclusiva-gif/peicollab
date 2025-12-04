import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Download,
  RefreshCw,
  Database,
  Shield,
  Zap
} from 'lucide-react';
import { runDatabaseTests, runSpecificDatabaseTests } from '@/lib/databaseTests';
import { ResponsiveLayout, ResponsiveCard } from '@/components/shared/ResponsiveLayout';

interface DatabaseTestRunnerProps {
  className?: string;
}

export function DatabaseTestRunner({ className = '' }: DatabaseTestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const availableTests = [
    { id: 'connection', name: 'Conexão com Banco', description: 'Testa conectividade com Supabase' },
    { id: 'auth', name: 'Autenticação', description: 'Verifica sistema de autenticação' },
    { id: 'rls', name: 'RLS Policies', description: 'Testa políticas de segurança' },
    { id: 'offline', name: 'Banco Offline', description: 'Testa funcionalidade offline' },
    { id: 'sync', name: 'Sincronização', description: 'Testa mecanismo de sync' },
    { id: 'roles', name: 'Novos Roles', description: 'Verifica novos perfis de usuário' },
    { id: 'versioning', name: 'Versionamento', description: 'Testa sistema de versões' },
    { id: 'tokens', name: 'Tokens Familiares', description: 'Testa sistema de tokens' }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      const results = await runDatabaseTests();
      setTestResults(results);
    } catch (error) {
      console.error('Erro ao executar testes:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runSelectedTests = async () => {
    if (selectedTests.length === 0) return;
    
    setIsRunning(true);
    try {
      const results = await runSpecificDatabaseTests(selectedTests);
      // Converter resultados para formato compatível
      const mockSuite = {
        name: 'Testes Específicos',
        tests: results,
        totalDuration: results.reduce((acc, r) => acc + r.duration, 0),
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        warnings: results.filter(r => r.status === 'warning').length
      };
      setTestResults(mockSuite);
    } catch (error) {
      console.error('Erro ao executar testes selecionados:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!testResults) return;
    
    const htmlReport = generateHTMLReport(testResults);
    const blob = new Blob([htmlReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database-test-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateHTMLReport = (suite: any) => {
    const passRate = Math.round((suite.passed / (suite.passed + suite.failed + suite.warnings)) * 100);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PEI Collab - Database Test Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; }
          .test-result { margin: 15px 0; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .pass { background: #d4edda; border-left: 4px solid #28a745; }
          .fail { background: #f8d7da; border-left: 4px solid #dc3545; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
          .summary { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .metric { display: inline-block; margin: 10px 20px 10px 0; }
          .metric-value { font-size: 24px; font-weight: bold; color: #495057; }
          .metric-label { font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧪 PEI Collab - Database Test Report</h1>
          <p>Executado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="summary">
          <h2>📊 Resumo dos Testes</h2>
          <div class="metric">
            <div class="metric-value">${passRate}%</div>
            <div class="metric-label">Taxa de Sucesso</div>
          </div>
          <div class="metric">
            <div class="metric-value">${suite.passed}</div>
            <div class="metric-label">Testes Passaram</div>
          </div>
          <div class="metric">
            <div class="metric-value">${suite.failed}</div>
            <div class="metric-label">Testes Falharam</div>
          </div>
          <div class="metric">
            <div class="metric-value">${suite.warnings}</div>
            <div class="metric-label">Avisos</div>
          </div>
          <div class="metric">
            <div class="metric-value">${suite.totalDuration}ms</div>
            <div class="metric-label">Tempo Total</div>
          </div>
        </div>
        
        <h2>📋 Detalhes dos Testes</h2>
        ${suite.tests.map((test: any) => `
          <div class="test-result ${test.status}">
            <h3>${test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⚠️'} ${test.test}</h3>
            <p>${test.message}</p>
            <p><small>Tempo: ${test.duration}ms</small></p>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <ResponsiveLayout className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6" />
              Testes de Integração
            </h2>
            <p className="text-muted-foreground">
              Validação da integração com banco de dados
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={runAllTests}
              disabled={isRunning}
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Executando...' : 'Executar Todos'}
            </Button>
            
            {testResults && (
              <Button
                variant="outline"
                onClick={downloadReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Relatório
              </Button>
            )}
          </div>
        </div>

        {/* Testes Disponíveis */}
        <ResponsiveCard>
          <CardHeader>
            <CardTitle className="text-lg">Testes Disponíveis</CardTitle>
            <CardDescription>
              Selecione os testes específicos para executar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTests.map((test) => (
                <div 
                  key={test.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTests.includes(test.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (selectedTests.includes(test.id)) {
                      setSelectedTests(prev => prev.filter(t => t !== test.id));
                    } else {
                      setSelectedTests(prev => [...prev, test.id]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <Button
                onClick={runSelectedTests}
                disabled={isRunning || selectedTests.length === 0}
                className="flex-1"
              >
                <Zap className="h-4 w-4 mr-2" />
                Executar Selecionados ({selectedTests.length})
              </Button>
            </div>
          </CardContent>
        </ResponsiveCard>

        {/* Resultados dos Testes */}
        {testResults && (
          <ResponsiveCard>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Resultados dos Testes</CardTitle>
                  <CardDescription>
                    Executado em {new Date().toLocaleString('pt-BR')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {testResults.passed} Passaram
                  </Badge>
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    {testResults.failed} Falharam
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {testResults.warnings} Avisos
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((testResults.passed / (testResults.passed + testResults.failed + testResults.warnings)) * 100)}%
                  </div>
                  <div className="text-sm text-blue-600">Taxa de Sucesso</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{testResults.passed}</div>
                  <div className="text-sm text-green-600">Passaram</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{testResults.failed}</div>
                  <div className="text-sm text-red-600">Falharam</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{testResults.warnings}</div>
                  <div className="text-sm text-yellow-600">Avisos</div>
                </div>
              </div>

              {/* Detalhes dos Testes */}
              <div className="space-y-3">
                {testResults.tests.map((test: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h3 className="font-medium">{test.test}</h3>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(test.status)}
                      >
                        {test.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{test.duration}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </ResponsiveCard>
        )}

        {/* Status de Execução */}
        {isRunning && (
          <ResponsiveCard className="border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-800">Executando Testes...</h3>
                <p className="text-sm text-blue-600">
                  Aguarde enquanto os testes são executados
                </p>
              </div>
            </div>
          </ResponsiveCard>
        )}
      </div>
    </ResponsiveLayout>
  );
}


