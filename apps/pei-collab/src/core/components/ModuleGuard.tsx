import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useModules } from '../hooks/useModules';
import { Loader2 } from 'lucide-react';

interface ModuleGuardProps {
  module: string;
  children: ReactNode;
  fallbackPath?: string;
}

/**
 * Componente que protege rotas de módulos
 * Redireciona se o módulo não estiver habilitado para o tenant
 */
export function ModuleGuard({ 
  module, 
  children, 
  fallbackPath = '/modulo-nao-disponivel' 
}: ModuleGuardProps) {
  const { isModuleEnabled, isLoading } = useModules();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isModuleEnabled(module)) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <>{children}</>;
}

