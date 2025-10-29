import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PendingChangesIndicatorProps {
  className?: string;
  showButton?: boolean;
}

export function PendingChangesIndicator({ 
  className = '', 
  showButton = true 
}: PendingChangesIndicatorProps) {
  const { pendingChanges, isSyncing, syncError, syncData } = useOfflineSync();

  // Só mostra o indicador quando há mudanças pendentes ou erro
  if (pendingChanges === 0 && !syncError) {
    return null;
  }

  if (pendingChanges === 0 && syncError) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${className}`}>
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 hidden sm:inline">Sincronizado</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Tudo sincronizado</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 ${className}`}>
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${
                syncError 
                  ? 'bg-red-100 text-red-800 border-red-200' 
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}
            >
              {syncError ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span className="text-xs">
                {pendingChanges} pendente{pendingChanges > 1 ? 's' : ''}
              </span>
            </Badge>
            
            {showButton && (
              <Button
                size="sm"
                variant="outline"
                onClick={syncData}
                disabled={isSyncing}
                className="h-5 px-2 text-xs"
              >
                <span className="hidden sm:inline">
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </span>
                <span className="sm:hidden">
                  {isSyncing ? '...' : 'Sync'}
                </span>
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {syncError ? 'Erro na Sincronização' : 'Alterações Pendentes'}
            </p>
            <p className="text-sm">
              {syncError 
                ? `Erro: ${syncError}` 
                : `${pendingChanges} alteração${pendingChanges > 1 ? 'ões' : ''} aguardando sincronização`
              }
            </p>
            {!syncError && (
              <p className="text-sm text-gray-600">
                As alterações serão sincronizadas automaticamente quando a conexão for restabelecida
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}