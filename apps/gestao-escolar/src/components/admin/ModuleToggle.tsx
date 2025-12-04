import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useModuleConfigs, useUpdateModuleConfig } from '@/hooks/useModuleConfig';
import { MODULE_INFO, SECRETARY_MODULES, CORE_MODULES, ModuleName } from '@/config/moduleConfig';
import { toast } from 'sonner';
import { Settings, Lock } from 'lucide-react';

export function ModuleToggle() {
  const { data: configs = [], isLoading } = useModuleConfigs();
  const updateModule = useUpdateModuleConfig();

  const handleToggle = async (moduleName: ModuleName, enabled: boolean) => {
    try {
      await updateModule.mutateAsync({ moduleName, enabled });
      toast.success(`Módulo ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao atualizar módulo');
      console.error(error);
    }
  };

  const getModuleConfig = (moduleName: ModuleName) => {
    return configs.find((c) => c.module_name === moduleName);
  };

  const isModuleEnabled = (moduleName: ModuleName) => {
    const config = getModuleConfig(moduleName);
    return config?.enabled ?? MODULE_INFO[moduleName].defaultEnabled;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração de Módulos
        </CardTitle>
        <CardDescription>
          Habilite ou desabilite módulos da secretaria conforme as necessidades da sua rede
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Módulos Core */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              Módulos Core
              <Badge variant="outline" className="text-xs">
                Obrigatórios
              </Badge>
            </h3>
            <div className="space-y-3">
              {CORE_MODULES.map((moduleName) => {
                const info = MODULE_INFO[moduleName];
                const enabled = isModuleEnabled(moduleName);

                return (
                  <div
                    key={moduleName}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor={`module-${moduleName}`} className="font-medium cursor-pointer">
                          {info.label}
                        </Label>
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                    <Switch
                      id={`module-${moduleName}`}
                      checked={enabled}
                      disabled={true}
                      className="ml-4"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Módulos de Secretaria */}
          <div>
            <h3 className="text-sm font-medium mb-3">Módulos de Secretaria</h3>
            <div className="space-y-3">
              {SECRETARY_MODULES.map((moduleName) => {
                const info = MODULE_INFO[moduleName];
                const enabled = isModuleEnabled(moduleName);

                return (
                  <div
                    key={moduleName}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <Label htmlFor={`module-${moduleName}`} className="font-medium cursor-pointer">
                        {info.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                    <Switch
                      id={`module-${moduleName}`}
                      checked={enabled}
                      onCheckedChange={(checked) => handleToggle(moduleName, checked)}
                      disabled={updateModule.isPending}
                      className="ml-4"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

