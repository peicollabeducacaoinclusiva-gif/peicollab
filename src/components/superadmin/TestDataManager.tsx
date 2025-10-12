import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Trash2, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TestDataManagerProps {
  onDataChanged: () => void;
}

const TestDataManager = ({ onDataChanged }: TestDataManagerProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeleteAllUsers = async () => {
    if (!confirm("ATENÇÃO: Isso irá deletar TODOS os usuários exceto o superadmin atual. Continuar?")) {
      return;
    }

    setLoading(true);
    try {
      // Get all users except current superadmin
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Usuário não autenticado");

      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id")
        .neq("id", currentUser.id);

      if (!allProfiles || allProfiles.length === 0) {
        toast({
          title: "Nenhum usuário para deletar",
          description: "Apenas o superadmin existe no sistema.",
        });
        setLoading(false);
        return;
      }

      const userIds = allProfiles.map(p => p.id);

      // Call batch delete function
      const { data, error } = await supabase.functions.invoke('batch-delete-users', {
        body: { userIds },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Usuários deletados!",
        description: `${data.deleted} usuários foram removidos do sistema.`,
      });

      onDataChanged();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-users');

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Show created users info
      const createdUsers = data.created || [];
      const usersList = createdUsers.map((u: any) => 
        `• ${u.name} (${u.email}) - Senha: ${u.password}`
      ).join('\n');

      toast({
        title: "Usuários de teste criados!",
        description: `${createdUsers.length} usuários foram criados com sucesso.`,
      });

      // Show details in alert
      setTimeout(() => {
        alert(`Usuários criados:\n\n${usersList}\n\nUse essas credenciais para testar o sistema.`);
      }, 500);

      onDataChanged();
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuários de teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          Gerenciar Dados de Teste
        </CardTitle>
        <CardDescription>
          Ferramentas para gerenciar usuários de teste do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Estas ações são irreversíveis e devem ser usadas apenas em ambiente de testes.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="destructive"
            onClick={handleDeleteAllUsers}
            disabled={loading}
            className="flex-1"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar Todos Usuários
          </Button>
          
          <Button
            onClick={handleCreateTestUsers}
            disabled={loading}
            className="flex-1"
          >
            <Users className="mr-2 h-4 w-4" />
            Criar Usuários de Teste
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Usuários de teste criados:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Coordenador:</strong> coordenador@teste.com (Senha: Teste123)</li>
            <li>• <strong>Professor:</strong> professor@teste.com (Senha: Teste123)</li>
            <li>• <strong>Professor AEE:</strong> aee@teste.com (Senha: Teste123)</li>
            <li>• <strong>Gestor Escolar:</strong> gestor@teste.com (Senha: Teste123)</li>
            <li>• <strong>Família:</strong> familia@teste.com (Senha: Teste123)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDataManager;
