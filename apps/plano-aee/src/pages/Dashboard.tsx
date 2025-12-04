import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Plus, FileText, Clock, CheckCircle, TrendingUp, Users, BookOpen, Sparkles } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { AppHeader } from '@pei/ui';

interface PlanoAEE {
  id: string;
  student: {
    full_name: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  cycle_1_evaluation?: any;
  cycle_2_evaluation?: any;
  cycle_3_evaluation?: any;
}

export default function Dashboard() {
  const [planos, setPlanos] = useState<PlanoAEE[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    approved: 0,
    pending: 0,
  });

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('plano_aee')
        .select(`
          *,
          student:students(full_name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setPlanos(data || []);

      // Calculate stats
      const stats = {
        total: data?.length || 0,
        draft: data?.filter((p) => p.status === 'draft').length || 0,
        approved: data?.filter((p) => p.status === 'approved').length || 0,
        pending: data?.filter((p) => p.status === 'pending').length || 0,
      };
      setStats(stats);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    pending: 'Em Revisão',
    approved: 'Aprovado',
    returned: 'Devolvido',
    archived: 'Arquivado',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    returned: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    archived: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  };

  const statCards = [
    {
      title: 'Total de Planos',
      value: stats.total,
      icon: FileText,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
    },
    {
      title: 'Rascunhos',
      value: stats.draft,
      icon: Clock,
      gradient: 'from-gray-500 to-slate-500',
      bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20',
    },
    {
      title: 'Em Revisão',
      value: stats.pending,
      icon: TrendingUp,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
    },
    {
      title: 'Aprovados',
      value: stats.approved,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-50/30 dark:to-purple-950/10">
      <AppHeader
        appName="Plano de AEE"
        appLogo="/logo.png"
        currentApp="plano-aee"
        customActions={
          <Link to="/create">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano de AEE
            </Button>
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">Dashboard AEE</h1>
                  <p className="text-purple-100">Gerencie seus planos de atendimento educacional especializado</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={`stat-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${stat.bgGradient} animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.value === 1 ? 'plano' : 'planos'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* List of Planos */}
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Planos de AEE Cadastrados
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie e acompanhe todos os seus planos
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-muted-foreground">Carregando planos...</p>
              </div>
            ) : planos.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mb-6">
                  <FileText className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhum Plano de AEE cadastrado ainda
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Comece criando seu primeiro plano de atendimento educacional especializado
                </p>
                <Link to="/create">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Plano
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {planos.map((plano, index) => (
                  <div
                    key={plano.id}
                    className="group card-hover bg-card border-2 border-border rounded-xl p-5 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {plano.student.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Atualizado em {new Date(plano.updated_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Ciclos */}
                        <div className="flex gap-2 mt-3">
                          {plano.cycle_1_evaluation && (
                            <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                              I Ciclo
                            </span>
                          )}
                          {plano.cycle_2_evaluation && (
                            <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                              II Ciclo
                            </span>
                          )}
                          {plano.cycle_3_evaluation && (
                            <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                              III Ciclo
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`px-4 py-2 text-sm font-semibold rounded-full border-2 ${statusColors[plano.status]} transition-all`}
                        >
                          {statusLabels[plano.status]}
                        </span>

                        <div className="flex gap-2">
                          <Link to={`/edit/${plano.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                            >
                              Editar
                            </Button>
                          </Link>

                          <Link to={`/view/${plano.id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                            >
                              Visualizar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

