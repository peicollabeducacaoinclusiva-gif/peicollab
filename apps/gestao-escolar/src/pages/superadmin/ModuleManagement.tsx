import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Switch, Label } from '@pei/ui';
import { supabase } from '@pei/database';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Settings, Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@pei/ui';

interface AvailableModule {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  app: string;
  is_public: boolean;
}

interface TenantModule {
  tenant_id: string;
  module_name: string;
  is_enabled: boolean;
  enabled_at: string;
}

interface Tenant {
  id: string;
  network_name: string;
}

/**
 * Painel de Administração de Módulos
 * Permite superadmin habilitar/desabilitar módulos por tenant
 */
export default function ModuleManagement() {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<AvailableModule[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar módulos disponíveis
  useEffect(() => {
    loadModules();
    loadTenants();
  }, []);

  // Carregar módulos do tenant selecionado
  useEffect(() => {
    if (selectedTenantId) {
      loadTenantModules(selectedTenantId);
    }
  }, [selectedTenantId]);

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('available_modules')
        .select('*')
        .order('app', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar módulos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar módulos disponíveis',
        variant: 'destructive',
      });
    }
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('id, network_name')
        .eq('is_active', true)
        .order('network_name', { ascending: true });

      if (error) throw error;
      setTenants(data || []);
      
      if (data && data.length > 0 && !selectedTenantId) {
        setSelectedTenantId(data[0].id);
      }
    } catch (error: any) {
      console.error('Erro ao carregar tenants:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar instituições',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTenantModules = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenant_modules')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      setTenantModules(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar módulos do tenant:', error);
    }
  };

  const isModuleEnabled = (moduleName: string): boolean => {
    return tenantModules.some(tm => tm.module_name === moduleName && tm.is_enabled);
  };

  const toggleModule = async (moduleName: string, currentlyEnabled: boolean) => {
    if (!selectedTenantId) return;

    try {
      setUpdating(moduleName);

      // Buscar ID do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (currentlyEnabled) {
        // Desabilitar
        const { error } = await supabase.rpc('disable_module_for_tenant', {
          p_tenant_id: selectedTenantId,
          p_module_name: moduleName,
        });

        if (error) throw error;

        toast({
          title: 'Módulo Desabilitado',
          description: `O módulo foi desabilitado com sucesso`,
        });
      } else {
        // Habilitar
        const { error } = await supabase.rpc('enable_module_for_tenant', {
          p_tenant_id: selectedTenantId,
          p_module_name: moduleName,
          p_enabled_by: user.id,
          p_settings: {},
        });

        if (error) throw error;

        toast({
          title: 'Módulo Habilitado',
          description: `O módulo foi habilitado com sucesso`,
        });
      }

      // Recarregar módulos do tenant
      await loadTenantModules(selectedTenantId);
    } catch (error: any) {
      console.error('Erro ao alternar módulo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível alterar o módulo',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const enableAllModules = async () => {
    if (!selectedTenantId) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      for (const module of modules) {
        if (!isModuleEnabled(module.name)) {
          await supabase.rpc('enable_module_for_tenant', {
            p_tenant_id: selectedTenantId,
            p_module_name: module.name,
            p_enabled_by: user.id,
            p_settings: {},
          });
        }
      }

      await loadTenantModules(selectedTenantId);

      toast({
        title: 'Sucesso',
        description: 'Todos os módulos foram habilitados',
      });
    } catch (error: any) {
      console.error('Erro ao habilitar todos:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const disableAllModules = async () => {
    if (!selectedTenantId) return;

    try {
      setLoading(true);

      for (const module of modules) {
        if (isModuleEnabled(module.name)) {
          await supabase.rpc('disable_module_for_tenant', {
            p_tenant_id: selectedTenantId,
            p_module_name: module.name,
          });
        }
      }

      await loadTenantModules(selectedTenantId);

      toast({
        title: 'Sucesso',
        description: 'Todos os módulos foram desabilitados',
      });
    } catch (error: any) {
      console.error('Erro ao desabilitar todos:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      clipboard: Package,
      newspaper: Package,
      utensils: Package,
      calendar: Package,
      bus: Package,
      accessibility: Package,
    };
    return icons[iconName] || Package;
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Gerenciamento de Módulos
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure quais módulos estão disponíveis para cada instituição
          </p>
        </div>
      </div>

      {/* Seletor de Tenant */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Instituição</CardTitle>
          <CardDescription>
            Escolha a instituição para gerenciar seus módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            >
              <option value="">Selecione uma instituição</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.network_name}
                </option>
              ))}
            </select>

            {selectedTenantId && (
              <div className="flex gap-2">
                <Button onClick={enableAllModules} variant="outline" size="sm">
                  <Check className="w-4 h-4 mr-2" />
                  Habilitar Todos
                </Button>
                <Button onClick={disableAllModules} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Desabilitar Todos
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Módulos */}
      {selectedTenantId && selectedTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Módulos Disponíveis</CardTitle>
            <CardDescription>
              Ative ou desative módulos para {selectedTenant.network_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>App</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Público</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => {
                  const enabled = isModuleEnabled(module.name);
                  const Icon = getIconComponent(module.icon);

                  return (
                    <TableRow key={module.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{module.display_name}</div>
                            <div className="text-xs text-muted-foreground">{module.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {module.app === 'gestao-escolar' ? 'Gestão' : 'PEI'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {module.description}
                      </TableCell>
                      <TableCell className="text-center">
                        {module.is_public ? (
                          <Badge variant="secondary">Sim</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {enabled ? (
                          <Badge variant="default" className="bg-green-500">
                            <Check className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <X className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Label htmlFor={`toggle-${module.name}`} className="text-sm">
                            {enabled ? 'Desabilitar' : 'Habilitar'}
                          </Label>
                          <Switch
                            id={`toggle-${module.name}`}
                            checked={enabled}
                            onCheckedChange={() => toggleModule(module.name, enabled)}
                            disabled={updating === module.name}
                          />
                          {updating === module.name && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      {selectedTenantId && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {modules.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Módulos Disponíveis
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {tenantModules.filter(tm => tm.is_enabled).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Módulos Ativos
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">
                  {modules.length - tenantModules.filter(tm => tm.is_enabled).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Módulos Inativos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Sistema de Módulos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Módulos Públicos</strong>: Têm componentes acessíveis sem autenticação (ex: blog na landing)
          </p>
          <p>
            • <strong>Gestão Escolar</strong>: Módulos administrativos integrados ao sistema de gestão
          </p>
          <p>
            • <strong>PEI Collab</strong>: Módulos relacionados a educação inclusiva e PEI
          </p>
          <p>
            • Os módulos habilitados aparecem automaticamente no menu dos usuários da instituição
          </p>
          <p>
            • A ativação/desativação é instantânea e não requer reinicialização
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


