import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function OfflineIndicator() {
  const { isOnline, isReconnecting } = useOnlineStatus();
  const { isSyncing, pendingChanges, syncError, syncData } = useOfflineSync();

  const getStatusIcon = () => {
    if (syncError) return <AlertCircle className="h-3 w-3 text-red-500" />;
    if (isSyncing) return <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />;
    if (isOnline && pendingChanges === 0) return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (isOnline && pendingChanges > 0) return <RefreshCw className="h-3 w-3 text-yellow-500" />;
    if (isReconnecting) return <RefreshCw className="h-3 w-3 text-orange-500 animate-spin" />;
    return <WifiOff className="h-3 w-3 text-red-500" />;
  };

  const getStatusText = () => {
    if (syncError) return 'Erro na sincronização';
    if (isSyncing) return 'Sincronizando...';
    if (isOnline && pendingChanges === 0) return 'Sincronizado';
    if (isOnline && pendingChanges > 0) return `${pendingChanges} alterações pendentes`;
    if (isReconnecting) return 'Reconectando...';
    return 'Modo offline';
  };

  const getStatusColor = () => {
    if (syncError) return 'bg-red-100 text-red-800 border-red-200';
    if (isSyncing) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (isOnline && pendingChanges === 0) return 'bg-green-100 text-green-800 border-green-200';
    if (isOnline && pendingChanges > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (isReconnecting) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 text-xs ${getStatusColor()}`}
            >
              {getStatusIcon()}
              <span className="hidden sm:inline text-xs">{getStatusText()}</span>
            </Badge>
            
            {pendingChanges > 0 && isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={syncData}
                disabled={isSyncing}
                className="h-5 px-2 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sincronizar</span>
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Status da Conexão</p>
            <p className="text-sm">
              {isOnline ? 'Conectado' : 'Desconectado'}
            </p>
            {pendingChanges > 0 && (
              <p className="text-sm text-yellow-600">
                {pendingChanges} alterações aguardando sincronização
              </p>
            )}
            {syncError && (
              <p className="text-sm text-red-600">
                Erro: {syncError}
              </p>
            )}
            {!isOnline && (
              <p className="text-sm text-gray-600">
                Os dados serão sincronizados quando a conexão for restabelecida
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}