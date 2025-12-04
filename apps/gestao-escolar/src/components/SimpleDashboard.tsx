import { Link } from 'react-router-dom';
import { Users, GraduationCap, FileText, School, Upload, Download, UserCog } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

// URL do app PEI Collab (pode ser configurada via variável de ambiente)
const PEI_COLLAB_URL = import.meta.env.VITE_PEI_COLLAB_URL || 'http://localhost:8080';

interface SimpleDashboardProps {
  stats: {
    students: number;
    professionals: number;
    classes: number;
    peis: number;
  };
  loading: boolean;
}

export default function SimpleDashboard({ stats, loading }: SimpleDashboardProps) {
  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alunos
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.students}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/professionals">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profissionais
              </CardTitle>
              <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.professionals}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/classes">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Turmas
              </CardTitle>
              <School className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.classes}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={`${PEI_COLLAB_URL}/peis`} target="_blank" rel="noopener noreferrer">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                PEIs
              </CardTitle>
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.peis}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Planos Educacionais Individualizados
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Administração do Sistema */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Administração do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-indigo-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Usuários
                </CardTitle>
                <UserCog className="h-5 w-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-foreground">
                  Gerenciar Usuários
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hub central de cadastro de usuários
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/import">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Importação
                </CardTitle>
                <Upload className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-foreground">
                  Importar em Lote
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV, Excel, JSON - E-grafite
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/export">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-cyan-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Exportação
                </CardTitle>
                <Download className="h-5 w-5 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-foreground">
                  Exportar Dados
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Censo escolar, MEC, relatórios
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              to="/students" 
              className="p-4 border border-border rounded-lg hover:bg-accent transition"
            >
              <h3 className="font-medium text-foreground">Cadastrar Aluno</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Adicionar novo estudante à rede
              </p>
            </Link>

            <Link 
              to="/professionals" 
              className="p-4 border border-border rounded-lg hover:bg-accent transition"
            >
              <h3 className="font-medium text-foreground">Cadastrar Profissional</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Adicionar novo colaborador
              </p>
            </Link>

            <Link 
              to="/users" 
              className="p-4 border border-border rounded-lg hover:bg-accent transition"
            >
              <h3 className="font-medium text-foreground">Cadastrar Usuário</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Criar novo usuário do sistema
              </p>
            </Link>

            <Link 
              to="/import" 
              className="p-4 border border-border rounded-lg hover:bg-accent transition"
            >
              <h3 className="font-medium text-foreground">Importar Dados</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Importar dados em lote de outros sistemas
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

