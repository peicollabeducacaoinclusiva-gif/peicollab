import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  BarChart3,
  FileText,
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { useUsabilityTesting } from '@/lib/usabilityTesting';
import { ResponsiveLayout } from '@/components/shared/ResponsiveLayout';

interface UsabilityTestingManagerProps {
  className?: string;
}

export function UsabilityTestingManager({ className = '' }: UsabilityTestingManagerProps) {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tests');

  const {
    createTest,
    getTests,
    getTest,
    startSession,
    completeSession,
    getTestReport,
    getTestTemplates
  } = useUsabilityTesting();

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const testsData = await getTests();
      setTests(testsData);
    } catch (error) {
      console.error('Erro ao carregar testes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTest = async (template: any) => {
    setIsLoading(true);
    try {
      const newTest = await createTest({
        name: template.name,
        description: template.description,
        tasks: template.tasks,
        participants: [],
        status: 'draft'
      });
      setTests(prev => [newTest, ...prev]);
    } catch (error) {
      console.error('Erro ao criar teste:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (testId: string) => {
    const participantName = prompt('Nome do participante:');
    const participantRole = prompt('Função do participante:');
    
    if (participantName && participantRole) {
      try {
        const session = await startSession(testId, {
          name: participantName,
          role: participantRole
        });
        console.log('Sessão iniciada:', session);
      } catch (error) {
        console.error('Erro ao iniciar sessão:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ResponsiveLayout className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Testes de Usabilidade
            </h2>
            <p className="text-muted-foreground">
              Gerencie e execute testes de usabilidade com usuários reais
            </p>
          </div>
          
          <Button onClick={loadTests} disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            {isLoading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tests">Testes</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Tab: Testes */}
          <TabsContent value="tests" className="space-y-4">
            <div className="grid gap-4">
              {tests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <CardDescription>{test.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTest(test)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartSession(test.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{test.tasks?.length || 0} tarefas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{test.participants?.length || 0} participantes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {test.tasks?.reduce((acc: number, task: any) => acc + task.estimatedTime, 0) || 0} min
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Sessões */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sessões de Teste</CardTitle>
                <CardDescription>
                  Acompanhe as sessões de teste em andamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma sessão de teste encontrada
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Relatórios */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Usabilidade</CardTitle>
                <CardDescription>
                  Visualize e exporte relatórios de testes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum relatório disponível
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Templates */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4">
              {getTestTemplates().map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                      <Button
                        onClick={() => handleCreateTest(template)}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Usar Template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Tarefas:</h4>
                      {template.tasks.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(task.difficulty)}>
                              {task.difficulty}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {task.estimatedTime} min
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de Detalhes do Teste */}
        {selectedTest && (
          <Card className="fixed inset-0 z-50 m-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedTest.name}</CardTitle>
                  <CardDescription>{selectedTest.description}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTest(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Tarefas do Teste:</h3>
                  {selectedTest.tasks?.map((task: any) => (
                    <div key={task.id} className="p-3 border rounded mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge className={getDifficultyColor(task.difficulty)}>
                          {task.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="text-sm">
                        <p><strong>Passos:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          {task.steps.map((step: string, index: number) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p><strong>Resultado esperado:</strong> {task.expectedOutcome}</p>
                        <p><strong>Tempo estimado:</strong> {task.estimatedTime} minutos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsiveLayout>
  );
}
