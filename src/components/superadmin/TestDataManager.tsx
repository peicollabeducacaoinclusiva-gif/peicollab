import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Trash2, Users, GraduationCap, AlertCircle } from 'lucide-react';

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
      // Primeiro, vamos verificar se temos tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name')
        .limit(1);

      if (tenantsError) {
        console.error('Erro ao buscar tenants:', tenantsError);
        throw new Error('Erro ao buscar tenants: ' + tenantsError.message);
      }

      if (!tenants || tenants.length === 0) {
        toast({
          title: "Nenhum tenant encontrado",
          description: "Crie tenants primeiro antes de criar usuários de teste.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const tenantId = tenants[0].id;
      console.log('Usando tenant:', tenants[0].name, 'ID:', tenantId);

      const testUsers = [
        { email: 'superadmin@teste.com', fullName: 'Admin Sistema', role: 'superadmin', password: 'Teste123' },
        { email: 'coordenador@teste.com', fullName: 'Maria Coordenadora', role: 'coordinator', password: 'Teste123' },
        { email: 'professor@teste.com', fullName: 'João Professor', role: 'teacher', password: 'Teste123' },
        { email: 'aee@teste.com', fullName: 'Ana Professora AEE', role: 'aee_teacher', password: 'Teste123' },
        { email: 'gestor@teste.com', fullName: 'Carlos Gestor Escolar', role: 'school_manager', password: 'Teste123' },
        { email: 'especialista@teste.com', fullName: 'Dr. Pedro Especialista', role: 'specialist', password: 'Teste123' },
        { email: 'familia@teste.com', fullName: 'Pedro Família', role: 'family', password: 'Teste123' },
      ];

      const created = [];
      const errors = [];

      for (const user of testUsers) {
        try {
          console.log(`Criando usuário: ${user.email}`);
          
          // Verificar se usuário já existe
          const { data: existingUser } = await supabase.auth.admin.getUserByEmail(user.email);
          
          if (existingUser?.user) {
            console.log(`Usuário ${user.email} já existe, atualizando...`);
            
            // Atualizar usuário existente
            const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.user.id, {
              password: user.password,
              email_confirm: true,
              user_metadata: {
                full_name: user.fullName,
                role: user.role,
                tenant_id: tenantId,
              },
            });

            if (updateError) {
              console.error(`Erro ao atualizar ${user.email}:`, updateError);
              errors.push({ email: user.email, error: updateError.message });
            } else {
              console.log(`Usuário ${user.email} atualizado com sucesso`);
              
              // Atualizar perfil do usuário
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert([{
                  id: existingUser.user.id,
                  full_name: user.fullName,
                  tenant_id: tenantId,
                  is_active: true
                }]);

              // Inserir/atualizar role na tabela user_roles
              if (!profileError) {
                const { error: roleError } = await supabase
                  .from('user_roles')
                  .upsert([{
                    user_id: existingUser.user.id,
                    role: user.role
                  }], { onConflict: 'user_id' });

                if (roleError) {
                  console.error(`Erro ao atualizar role para ${user.email}:`, roleError);
                  errors.push({ email: user.email, error: `Role: ${roleError.message}` });
                }
              }

              if (profileError) {
                console.error(`Erro ao atualizar perfil para ${user.email}:`, profileError);
                errors.push({ email: user.email, error: `Perfil: ${profileError.message}` });
              } else {
                console.log(`Perfil atualizado para ${user.email}`);
                created.push({ email: user.email, role: user.role, name: user.fullName });
              }
            }
          } else {
            console.log(`Criando novo usuário: ${user.email}`);
            
            // Criar novo usuário
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: user.email,
              password: user.password,
              email_confirm: true,
              user_metadata: {
                full_name: user.fullName,
                role: user.role,
                tenant_id: tenantId,
              },
            });

            if (createError) {
              console.error(`Erro ao criar ${user.email}:`, createError);
              errors.push({ email: user.email, error: createError.message });
            } else {
              console.log(`Usuário ${user.email} criado com sucesso:`, newUser);
              
              // Criar perfil do usuário
              const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                  id: newUser.user.id,
                  full_name: user.fullName,
                  tenant_id: tenantId,
                  is_active: true
                }]);

              // Inserir role na tabela user_roles
              if (!profileError) {
                const { error: roleError } = await supabase
                  .from('user_roles')
                  .insert([{
                    user_id: newUser.user.id,
                    role: user.role
                  }]);

                if (roleError) {
                  console.error(`Erro ao inserir role para ${user.email}:`, roleError);
                  errors.push({ email: user.email, error: `Role: ${roleError.message}` });
                }
              }

              if (profileError) {
                console.error(`Erro ao criar perfil para ${user.email}:`, profileError);
                errors.push({ email: user.email, error: `Perfil: ${profileError.message}` });
              } else {
                console.log(`Perfil criado para ${user.email}`);
                created.push({ email: user.email, role: user.role, name: user.fullName });
              }
            }
          }
        } catch (e) {
          console.error(`Erro geral para ${user.email}:`, e);
          errors.push({ email: user.email, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }

      console.log('Resultado final:', { created, errors });

      if (created.length > 0) {
      toast({
        title: "Usuários de teste criados!",
          description: `${created.length} usuários foram criados/atualizados com sucesso.`,
      });

      // Show details in alert
      setTimeout(() => {
          const usersList = created.map(u => `• ${u.name} (${u.email}) - Senha: Teste123`).join('\n');
          const errorsList = errors.length > 0 ? `\n\nErros:\n${errors.map(e => `• ${e.email}: ${e.error}`).join('\n')}` : '';
          alert(`Usuários criados/atualizados:\n\n${usersList}${errorsList}\n\nUse essas credenciais para testar o sistema.`);
      }, 500);
      }

      if (errors.length > 0) {
        toast({
          title: "Alguns usuários tiveram erro",
          description: `${errors.length} usuários falharam. Verifique o console para detalhes.`,
          variant: "destructive",
        });
      }

      onDataChanged();
    } catch (error: any) {
      console.error('Erro geral:', error);
      toast({
        title: "Erro ao criar usuários de teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestSchools = async () => {
    setLoading(true);
    try {
      const testSchools = [
        { name: 'Escola Municipal ABC', network_name: 'Rede Municipal de Educação', is_active: true },
        { name: 'Escola Estadual XYZ', network_name: 'Rede Estadual de Educação', is_active: true },
        { name: 'Colégio Particular DEF', network_name: 'Rede Particular de Ensino', is_active: true },
        { name: 'Escola Rural GHI', network_name: 'Rede Rural de Educação', is_active: true },
      ];

      const created = [];
      const errors = [];

      for (const school of testSchools) {
        try {
          console.log(`Criando escola: ${school.name}`);
          
          // Check if school already exists
          const { data: existing } = await supabase
            .from('schools')
            .select('id')
            .eq('name', school.name)
            .maybeSingle();

          if (existing) {
            console.log(`Escola ${school.name} já existe, pulando...`);
            continue;
          }

          // Create new school
          const { data: newSchool, error: createError } = await supabase
            .from('schools')
            .insert([school])
            .select()
            .single();

          if (createError) {
            console.error(`Erro ao criar escola ${school.name}:`, createError);
            errors.push({ name: school.name, error: createError.message });
          } else {
            console.log(`Escola ${school.name} criada com sucesso`);
            created.push({ id: newSchool.id, name: newSchool.name, network: newSchool.network_name });
          }
        } catch (e) {
          console.error(`Erro geral para escola ${school.name}:`, e);
          errors.push({ name: school.name, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }

      console.log('Resultado escolas:', { created, errors });

      if (created.length > 0) {
        toast({
          title: "Escolas de teste criadas!",
          description: `${created.length} escolas foram criadas com sucesso.`,
        });

        // Show details in alert
        setTimeout(() => {
          const schoolsList = created.map(s => `• ${s.name} (${s.network})`).join('\n');
          const errorsList = errors.length > 0 ? `\n\nErros:\n${errors.map(e => `• ${e.name}: ${e.error}`).join('\n')}` : '';
          alert(`Escolas criadas:\n\n${schoolsList}${errorsList}\n\nEssas escolas podem ser usadas para testar o isolamento entre redes.`);
        }, 500);
      }

      if (errors.length > 0) {
        toast({
          title: "Algumas escolas tiveram erro",
          description: `${errors.length} escolas falharam. Verifique o console para detalhes.`,
          variant: "destructive",
        });
      }

      onDataChanged();
    } catch (error: any) {
      console.error('Erro geral escolas:', error);
      toast({
        title: "Erro ao criar escolas de teste",
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

          <Button
            onClick={handleCreateTestSchools}
            disabled={loading}
            className="flex-1"
          >
            <GraduationCap className="mr-2 h-4 w-4" />
            Criar Escolas de Teste
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-4">
          <div>
          <p className="font-medium mb-2">Usuários de teste criados:</p>
          <ul className="space-y-1 text-xs">
              <li>• <strong>Superadmin:</strong> superadmin@teste.com (Senha: Teste123)</li>
            <li>• <strong>Coordenador:</strong> coordenador@teste.com (Senha: Teste123)</li>
            <li>• <strong>Professor:</strong> professor@teste.com (Senha: Teste123)</li>
            <li>• <strong>Professor AEE:</strong> aee@teste.com (Senha: Teste123)</li>
            <li>• <strong>Gestor Escolar:</strong> gestor@teste.com (Senha: Teste123)</li>
              <li>• <strong>Especialista:</strong> especialista@teste.com (Senha: Teste123)</li>
            <li>• <strong>Família:</strong> familia@teste.com (Senha: Teste123)</li>
          </ul>
          </div>
          
          <div>
            <p className="font-medium mb-2">Escolas de teste criadas:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Escola Municipal ABC</strong> (Rede Municipal de Educação)</li>
              <li>• <strong>Escola Estadual XYZ</strong> (Rede Estadual de Educação)</li>
              <li>• <strong>Colégio Particular DEF</strong> (Rede Particular de Ensino)</li>
              <li>• <strong>Escola Rural GHI</strong> (Rede Rural de Educação)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDataManager;