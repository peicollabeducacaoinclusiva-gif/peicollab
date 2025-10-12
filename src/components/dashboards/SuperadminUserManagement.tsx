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
import { Users, Search, Edit, Trash2, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UserRole = "superadmin" | "coordinator" | "teacher" | "family" | "school_manager" | "aee_teacher";

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
  name: string;
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
        .select("id, name")
        .order("name");

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
        .select("id, full_name, is_active")
        .order("full_name");

      if (profilesError) {
        console.error("Erro ao carregar profiles:", profilesError);
        throw profilesError;
      }

      console.log("Profiles carregados:", profilesData?.length);

      // Buscar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Erro ao carregar roles:", rolesError);
        throw rolesError;
      }

      console.log("Roles carregados:", rolesData?.length);

      // Buscar tenants dos usuários
      const { data: userTenantsData, error: userTenantsError } = await supabase
        .from("user_tenants")
        .select("user_id, tenant_id, tenants(name)");

      if (userTenantsError) {
        console.error("Erro ao carregar user_tenants:", userTenantsError);
        throw userTenantsError;
      }

      console.log("User tenants carregados:", userTenantsData?.length);

      // Buscar emails via RPC (função segura no backend)
      const { data: emailsData, error: emailsError } = await (supabase.rpc as any)('get_users_with_emails');


      if (emailsError) {
        console.warn("Aviso ao carregar emails:", emailsError);
        console.log("Continuando sem emails...");
      }

      console.log("Emails carregados:", emailsData?.length || 0);

      // Mapear dados com tipagem correta
      const emailsMap = new Map<string, string>();
      if (emailsData) {
        emailsData.forEach((item: any) => {
          if (item.user_id && item.email) {
            emailsMap.set(item.user_id, item.email);
          }
        });
      }

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
                name: ut.tenants?.name || "Nome não encontrado"
              });
            }
          }
        });
      }

      // Combinar todos os dados
      const enrichedUsers: UserWithDetails[] = (profilesData || []).map(profile => {
        const userTenants = userTenantsMap.get(profile.id) || [];
        const email = emailsMap.get(profile.id);
        
        return {
          ...profile,
          email: email || undefined,
          role: rolesMap.get(profile.id) || "teacher",
          tenant_ids: userTenants.map(t => t.id),
          tenant_names: userTenants.map(t => t.name),
        };
      });

      console.log("Usuários enriquecidos:", enrichedUsers.length);
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
      // Atualizar profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_active: editFormData.is_active,
        })
        .eq("id", selectedUser.id);

      if (profileError) throw profileError;

      // Atualizar ou inserir role
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: selectedUser.id,
            role: editFormData.role,
          },
          {
            onConflict: "user_id,role",
          }
        );

      if (roleError) throw roleError;

      // Remover associações antigas de tenants
      const { error: deleteError } = await supabase
        .from("user_tenants")
        .delete()
        .eq("user_id", selectedUser.id);

      if (deleteError) throw deleteError;

      // Adicionar novas associações de tenants
      if (editFormData.tenant_ids.length > 0) {
        const tenantAssociations = editFormData.tenant_ids.map(tenantId => ({
          user_id: selectedUser.id,
          tenant_id: tenantId,
        }));

        const { error: insertError } = await supabase
          .from("user_tenants")
          .insert(tenantAssociations);

        if (insertError) throw insertError;
      }

      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso.",
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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido com sucesso.",
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
      superadmin: "bg-purple-500 text-white",
      coordinator: "bg-blue-500 text-white",
      school_manager: "bg-indigo-500 text-white",
      aee_teacher: "bg-green-500 text-white",
      teacher: "bg-yellow-500 text-white",
      family: "bg-pink-500 text-white",
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
    };
    return labels[role] || role;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant_names.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  if (users.length === 0 && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gerenciamento de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Nenhum usuário encontrado</p>
            <p className="text-sm text-muted-foreground">
              Os usuários aparecerão aqui após o primeiro login
            </p>
            <Button 
              onClick={loadUsers} 
              variant="outline" 
              className="mt-4"
            >
              Recarregar
            </Button>
          </div>
        </CardContent>
      </Card>
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
                Gerencie usuários, roles e associe-os a múltiplas instituições
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
        <CardContent className="space-y-4">
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

          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Instituições</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
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
                        <td className="px-4 py-3">
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Ativo" : "Inativo"}
                          </Badge>
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
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere o role, instituições e status de {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: UserRole) =>
                  setEditFormData({ ...editFormData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione o role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="coordinator">Coordenador</SelectItem>
                  <SelectItem value="school_manager">Gestor Escolar</SelectItem>
                  <SelectItem value="aee_teacher">Professor AEE</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                  <SelectItem value="family">Família</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Label>Instituições (selecione uma ou mais)</Label>
              </div>
              <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                {tenants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma instituição cadastrada</p>
                ) : (
                  tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={tenant.id}
                        checked={editFormData.tenant_ids.includes(tenant.id)}
                        onCheckedChange={() => toggleTenantSelection(tenant.id)}
                      />
                      <label
                        htmlFor={tenant.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {tenant.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {editFormData.tenant_ids.length} instituição(ões) selecionada(s)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={editFormData.is_active}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Usuário ativo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminUserManagement;