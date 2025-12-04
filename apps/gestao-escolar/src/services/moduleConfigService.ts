import { supabase } from '@pei/database';
import { ModuleConfig, ModuleName } from '../config/moduleConfig';

export const moduleConfigService = {
  /**
   * Verifica se um módulo está habilitado para um tenant
   */
  async isModuleEnabled(tenantId: string, moduleName: ModuleName): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_module_enabled', {
      p_tenant_id: tenantId,
      p_module_name: moduleName,
    });

    if (error) {
      console.error('Erro ao verificar módulo:', error);
      // Retornar true para módulos core por padrão
      return ['students', 'classes', 'professionals'].includes(moduleName);
    }

    return data ?? false;
  },

  /**
   * Busca todas as configurações de módulos de um tenant
   */
  async getModuleConfigs(tenantId: string): Promise<ModuleConfig[]> {
    const { data, error } = await supabase
      .from('tenant_module_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('module_name', { ascending: true });

    if (error) throw error;
    return (data || []) as ModuleConfig[];
  },

  /**
   * Atualiza configuração de um módulo
   */
  async updateModuleConfig(
    tenantId: string,
    moduleName: ModuleName,
    enabled: boolean,
    config?: Record<string, any>
  ): Promise<ModuleConfig> {
    const { data, error } = await supabase
      .from('tenant_module_config')
      .upsert(
        {
          tenant_id: tenantId,
          module_name: moduleName,
          enabled,
          config: config || {},
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'tenant_id,module_name',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as ModuleConfig;
  },

  /**
   * Habilita um módulo
   */
  async enableModule(tenantId: string, moduleName: ModuleName): Promise<void> {
    await this.updateModuleConfig(tenantId, moduleName, true);
  },

  /**
   * Desabilita um módulo
   */
  async disableModule(tenantId: string, moduleName: ModuleName): Promise<void> {
    await this.updateModuleConfig(tenantId, moduleName, false);
  },

  /**
   * Inicializa módulos padrão para um tenant
   */
  async initializeDefaultModules(tenantId: string): Promise<void> {
    const { MODULE_INFO } = await import('../config/moduleConfig');

    const modules = Object.values(MODULE_INFO);

    for (const module of modules) {
      await this.updateModuleConfig(
        tenantId,
        module.name,
        module.defaultEnabled
      );
    }
  },
};

