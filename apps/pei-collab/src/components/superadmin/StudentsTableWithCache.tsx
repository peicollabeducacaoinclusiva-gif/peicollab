import { useEffect } from 'react';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { CacheService } from '@/services/cacheService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export function StudentsTableWithCache() {
  const isOnline = useOnlineStatus();

  const { 
    data: students, 
    isLoading, 
    error,
    refetch 
  } = useOfflineQuery({
    queryKey: ['students'],
    queryFn: async () => {
      // Tenta buscar do servidor
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Salva no cache se online
      if (navigator.onLine) {
        await CacheService.cacheStudents(data);
      }
      
      return data;
    },
  });

  // Carrega do cache se offline e não tem dados
  useEffect(() => {
    if (!isOnline && !students) {
      loadFromCache();
    }
  }, [isOnline]);

  async function loadFromCache() {
    const cached = await CacheService.getCachedStudents();
    // Você precisaria de um setState ou outra forma de atualizar a UI
    console.log('Dados carregados do cache:', cached);
  }

  const handleRefresh = () => {
    if (!isOnline) {
      toast.warning('Você está offline', {
        description: 'Não é possível atualizar os dados sem conexão.',
      });
      return;
    }
    refetch();
  };

  // Indicador de cache desatualizado
  const showStaleWarning = !isOnline && students;

  return (
    <div className="space-y-4">
      {/* Alerta de dados em cache */}
      {showStaleWarning && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Exibindo dados em cache. Conecte-se para ver dados atualizados.
          </AlertDescription>
        </Alert>
      )}

      {/* Botão de atualizar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Estudantes</h2>
        <Button 
          onClick={handleRefresh} 
          disabled={!isOnline || isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Conteúdo da tabela */}
      {isLoading && <div>Carregando estudantes...</div>}
      
      {error && !students && (
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar estudantes. Tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {students && (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Data de Nascimento</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b">
                  <td className="p-2">{student.name}</td>
                  <td className="p-2">{student.birth_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}