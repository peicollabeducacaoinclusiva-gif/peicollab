import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ThemeToggle } from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';
import { useToast } from '../components/ui/use-toast';

interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  school_id?: string;
  tenant_id?: string;
  is_active: boolean;
  created_at: string;
  school?: {
    school_name: string;
  };
  user_roles?: Array<{ role: string }>;
}

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tenantId !== null) {
      loadUsers();
    }
  }, [tenantId]);

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Tentar buscar tenant_id de profiles primeiro
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id, school_id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.tenant_id) {
          setTenantId(profile.tenant_id);
        } else {
          // Fallback para user_tenants
          const { data: ut } = await supabase
            .from('user_tenants')
            .select('tenant_id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (ut?.tenant_id) setTenantId(ut.tenant_id);
        }
        
        if (profile?.school_id) setSchoolId(profile.school_id);
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    }
  };

  const loadUsers = async () => {
    if (tenantId === null) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Query com filtro por tenant
      // Nota: email não está em profiles, está em auth.users
      // Por enquanto, buscamos apenas os dados disponíveis em profiles
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          school_id,
          tenant_id,
          is_active,
          created_at,
          school:schools!profiles_school_id_fkey(school_name),
          user_roles(role)
        `)
        .eq('tenant_id', tenantId)
        .order('full_name');

      const { data, error } = await query;

      if (error) throw error;

      // Tentar buscar emails via RPC se disponível
      let emailsMap = new Map<string, string>();
      try {
        const { data: emailsData, error: emailsError } = await supabase.rpc('get_users_with_emails');
        if (!emailsError && emailsData) {
          emailsData.forEach((item: any) => {
            if (item.user_id && item.email) {
              emailsMap.set(item.user_id, item.email);
            }
          });
        }
      } catch (err) {
        console.warn('Não foi possível carregar emails:', err);
      }

      // Mapear dados com emails
      const usersWithEmails = (data || []).map((profile: any) => ({
        ...profile,
        email: emailsMap.get(profile.id) || null,
      }));

      setUsers(usersWithEmails);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message || 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });

      loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Não foi possível atualizar o status do usuário.',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = filterRole === 'all' || 
      user.user_roles?.some(r => r.role === filterRole);
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (roles: Array<{ role: string }> | undefined) => {
    if (!roles || roles.length === 0) return <Badge variant="outline">Sem role</Badge>;
    
    const role = roles[0].role;
    const roleLabels: Record<string, string> = {
      'superadmin': 'Super Admin',
      'education_secretary': 'Secretário',
      'coordinator': 'Coordenador',
      'school_director': 'Diretor',
      'aee_teacher': 'Professor AEE',
      'teacher': 'Professor',
      'support_professional': 'Apoio',
      'specialist': 'Especialista',
      'family': 'Família'
    };
    
    const roleColors: Record<string, string> = {
      'superadmin': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
      'education_secretary': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      'coordinator': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
      'school_director': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
      'aee_teacher': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800',
      'teacher': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
      'support_professional': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
      'specialist': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
      'family': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
    };
    
    return (
      <Badge className={roleColors[role] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-800'}>
        <Shield className="h-3 w-3 mr-1" />
        {roleLabels[role] || role}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="text-sm text-primary hover:underline mb-2 block">
                <ArrowLeft className="h-4 w-4 inline mr-1" />
                Voltar ao Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-foreground">
                Gestão de Usuários
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerenciar todos os usuários do sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserMenu />
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filtros */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="all">Todos os Papéis</option>
            <option value="superadmin">Super Admin</option>
            <option value="coordinator">Coordenador</option>
            <option value="school_director">Diretor</option>
            <option value="teacher">Professor</option>
            <option value="aee_teacher">Professor AEE</option>
            <option value="specialist">Especialista</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredUsers.length} usuário(s) encontrado(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">
                        Escola
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-accent">
                        <td className="px-4 py-3 text-sm text-foreground font-medium">
                          {user.full_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {user.email || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {getRoleBadge(user.user_roles)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {user.school?.school_name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {user.is_active ? (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                              <UserX className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              title={user.is_active ? 'Desativar' : 'Ativar'}
                            >
                              {user.is_active ? (
                                <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


