// src/components/dashboards/SuperadminUserManagement.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Edit, Trash2, Building2, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type UserRole = "superadmin" | "coordinator" | "teacher" | "family" | "school_manager" | "aee_teacher" | "specialist";

interface UserProfile {
  id: string;
  full_name: string;
  is_active: boolean;
  email?: string;
}

interface UserWithDetails extends UserProfile {
  role: UserRole;
  tenant_ids: string[];
  tenant_names: string[];
}

interface Tenant {
  id: string;
  network_name: string;
}

const SuperadminUserManagement = () => {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    role: "" as UserRole,
    tenant_ids: [] as string[],
    is_active: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadTenants(), loadUsers()]);
  };

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, network_name")
        .order("network_name");

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar tenants:", error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Buscar profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          is_active,
          user_roles(role)
        `)
        .order("full_name");

      if (profilesError) throw profilesError;

      // Mapear roles da nova estrutura
      const rolesData = profilesData?.map(profile => ({
        user_id: profile.id,
        role: profile.user_roles?.[0]?.role || 'teacher'
      })) || [];

      // Buscar tenants dos usuários
      const { data: userTenantsData, error: userTenantsError } = await supabase
        .from("user_tenants")
        .select("user_id, tenant_id, tenants(network_name)");

      if (userTenantsError) throw userTenantsError;

      // Buscar emails via RPC
      let emailsData: any[] = [];
      try {
        const { data, error } = await (supabase.rpc as any)('get_users_with_emails');
        if (!error && data) {
          emailsData = data;
        }
      } catch (error) {
        console.warn("Não foi possível carregar emails:", error);
      }

      // Criar mapas para facilitar o acesso aos dados
      const emailsMap = new Map<string, string>();
      emailsData.forEach((item: any) => {
        if (item.user_id && item.email) {
          emailsMap.set(item.user_id, item.email);
        }
      });

      const rolesMap = new Map<string, UserRole>();
      if (rolesData) {
        rolesData.forEach(r => {
          if (r.user_id && r.role) {
            rolesMap.set(r.user_id, r.role as UserRole);
          }
        });
      }

      // Agrupar tenants por usuário
      const userTenantsMap = new Map<string, Array<{ id: string; name: string }>>();
      if (userTenantsData) {
        userTenantsData.forEach((ut: any) => {
          if (ut.user_id) {
            if (!userTenantsMap.has(ut.user_id)) {
              userTenantsMap.set(ut.user_id, []);
            }
            const tenants = userTenantsMap.get(ut.user_id);
            if (tenants && ut.tenant_id) {
              tenants.push({
                id: ut.tenant_id,
                name: ut.tenants?.network_name || "Nome não encontrado"
              });
            }
          }
        });
      }

      // Combinar todos os dados
      const enrichedUsers: UserWithDetails[] = (profilesData || []).map(profile => {
        const userTenants = userTenantsMap.get(profile.id) || [];
        const email = emailsMap.get(profile.id);
        
        // Tenant_id não existe na tabela profiles, usar apenas user_tenants
        
        return {
          ...profile,
          email: email || undefined,
          role: rolesMap.get(profile.id) || "teacher",
          tenant_ids: userTenants.map(t => t.id),
          tenant_names: userTenants.map(t => t.name),
        };
      });

      setUsers(enrichedUsers);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserWithDetails) => {
    setSelectedUser(user);
    setEditFormData({
      role: user.role,
      tenant_ids: user.tenant_ids,
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      // Atualizar profile (is_active)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_active: editFormData.is_active,
        })
        .eq("id", selectedUser.id);

      if (profileError) throw profileError;

      // Atualizar role na tabela user_roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: selectedUser.id,
          role: editFormData.role,
        }, { onConflict: 'user_id' });

      if (roleError) throw roleError;

      // Remover associações antigas de tenants
      await supabase
        .from("user_tenants")
        .delete()
        .eq("user_id", selectedUser.id);

      // Adicionar novas associações de tenants
      if (editFormData.tenant_ids.length > 0) {
        const tenantAssociations = editFormData.tenant_ids.map(tenantId => ({
          user_id: selectedUser.id,
          tenant_id: tenantId,
        }));

        const { error: insertError } = await supabase
          .from("user_tenants")
          .insert(tenantAssociations as any);

        if (insertError) throw insertError;
      }

      toast({
        title: "Usuário atualizado com sucesso!",
        description: `${selectedUser.full_name} foi atualizado.`,
      });

      setIsEditDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${userName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Primeiro deletar de profiles (CASCADE vai deletar o resto)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: `${userName} foi removido com sucesso.`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleTenantSelection = (tenantId: string) => {
    setEditFormData(prev => {
      const isSelected = prev.tenant_ids.includes(tenantId);
      return {
        ...prev,
        tenant_ids: isSelected
          ? prev.tenant_ids.filter(id => id !== tenantId)
          : [...prev.tenant_ids, tenantId],
      };
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      superadmin: "bg-purple-500 text-white hover:bg-purple-600",
      coordinator: "bg-blue-500 text-white hover:bg-blue-600",
      school_manager: "bg-indigo-500 text-white hover:bg-indigo-600",
      aee_teacher: "bg-green-500 text-white hover:bg-green-600",
      teacher: "bg-yellow-500 text-white hover:bg-yellow-600",
      family: "bg-pink-500 text-white hover:bg-pink-600",
      specialist: "bg-teal-500 text-white hover:bg-teal-600",
    };
    return colors[role] || "bg-gray-500";
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      superadmin: "Superadmin",
      coordinator: "Coordenador",
      school_manager: "Gestor Escolar",
      aee_teacher: "Professor AEE",
      teacher: "Professor",
      family: "Família",
      specialist: "Especialista",
    };
    return labels[role] || role;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant_names.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Separar usuários ativos e inativos
  const activeUsers = filteredUsers.filter(u => u.is_active);
  const inactiveUsers = filteredUsers.filter(u => !u.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie usuários, ative contas e associe a instituições
              </CardDescription>
            </div>
            <Button 
              onClick={loadUsers} 
              variant="outline"
              size="sm"
            >
              Recarregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-primary">{users.length}</div>
              <p className="text-sm text-muted-foreground">Total de usuários</p>
            </div>
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950">
              <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
              <p className="text-sm text-muted-foreground">Usuários ativos</p>
            </div>
            <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-950">
              <div className="text-2xl font-bold text-orange-600">{inactiveUsers.length}</div>
              <p className="text-sm text-muted-foreground">Aguardando ativação</p>
            </div>
          </div>

          {/* Alerta para usuários inativos */}
          {inactiveUsers.length > 0 && (
            <Alert>
              <UserPlus className="h-4 w-4" />
              <AlertDescription>
                Você tem <strong>{inactiveUsers.length}</strong> usuário(s) aguardando ativação. 
                Clique no botão de editar para ativar e associar a uma instituição.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou instituição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Usuários Inativos (Prioridade) */}
          {inactiveUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-orange-500" />
                Aguardando Ativação ({inactiveUsers.length})
              </h3>
              <div className="rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-orange-100 dark:bg-orange-900/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Instituições</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {inactiveUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-orange-100/50 dark:hover:bg-orange-900/20">
                          <td className="px-4 py-3 font-medium">{user.full_name}</td>
                          <td className="px-4 py-3 text-muted-foreground text-sm">
                            {user.email || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {user.tenant_names.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.tenant_names.slice(0, 2).map((name, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {name}
                                  </Badge>
                                ))}
                                {user.tenant_names.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.tenant_names.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-orange-600 text-sm font-medium">
                                ⚠️ Sem instituição
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Ativar
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id, user.full_name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Usuários Ativos */}
          {activeUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Usuários Ativos ({activeUsers.length})
              </h3>
              <div className="rounded-lg border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Instituições</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {activeUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">{user.full_name}</td>
                          <td className="px-4 py-3 text-muted-foreground text-sm">
                            {user.email || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {user.tenant_names.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.tenant_names.slice(0, 2).map((name, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {name}
                                  </Badge>
                                ))}
                                {user.tenant_names.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.tenant_names.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Sem instituição
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id, user.full_name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Nenhum usuário encontrado</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Tente uma busca diferente" : "Os usuários aparecerão aqui após o cadastro"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_active ? "Editar Usuário" : "Ativar Usuário"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_active 
                ? `Altere as configurações de ${selectedUser?.full_name}`
                : `Configure e ative a conta de ${selectedUser?.full_name}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Função (Role)</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: UserRole) =>
                  setEditFormData({ ...editFormData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="coordinator">Coordenador</SelectItem>
                  <SelectItem value="school_manager">Gestor Escolar</SelectItem>
                  <SelectItem value="aee_teacher">Professor AEE</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                  <SelectItem value="specialist">Especialista</SelectItem>
                  <SelectItem value="family">Família</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Label>Instituições (selecione uma ou mais)</Label>
              </div>
              {!selectedUser?.is_active && editFormData.tenant_ids.length === 0 && (
                <Alert>
                  <AlertDescription className="text-sm">
                    ⚠️ É necessário selecionar pelo menos uma instituição para ativar o usuário.
                  </AlertDescription>
                </Alert>
              )}
              <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                {tenants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma instituição cadastrada</p>
                ) : (
                  tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                      <Checkbox
                        id={tenant.id}
                        checked={editFormData.tenant_ids.includes(tenant.id)}
                        onCheckedChange={() => toggleTenantSelection(tenant.id)}
                      />
                      <label
                        htmlFor={tenant.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {tenant.network_name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {editFormData.tenant_ids.length} instituição(ões) selecionada(s)
              </p>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
              <Checkbox
                id="is_active"
                checked={editFormData.is_active}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer flex-1">
                <div className="font-semibold">Usuário ativo</div>
                <div className="text-xs text-muted-foreground">
                  Usuários ativos podem fazer login no sistema
                </div>
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveUser}
              disabled={!editFormData.is_active && editFormData.tenant_ids.length === 0}
            >
              {selectedUser?.is_active ? "Salvar Alterações" : "Ativar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminUserManagement;