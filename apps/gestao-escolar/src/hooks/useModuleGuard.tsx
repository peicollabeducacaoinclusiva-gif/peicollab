import { useModuleEnabled } from './useModuleConfig';
import { ModuleName } from '../config/moduleConfig';

/**
 * Hook para proteger componentes baseado em módulos habilitados
 */
export function useModuleGuard(moduleName: ModuleName) {
  const { data: enabled = false, isLoading } = useModuleEnabled(moduleName);

  return {
    enabled,
    isLoading,
    // Componente de fallback quando módulo está desabilitado
    ModuleDisabled: () => (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Este módulo está desabilitado para sua rede. Entre em contato com o administrador.
        </p>
      </div>
    ),
  };
}

