import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePermissionDebug } from '@/hooks/usePermissionDebug';
import { X, Bug, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Painel de DEBUG para visualizar bloqueios de permissão
 */
export function PermissionDebugPanel() {
  const { isEnabled, logs, currentRole, toggle, clearLogs } = usePermissionDebug();
  const [isOpen, setIsOpen] = useState(false);

  if (!isEnabled && !isOpen) {
    return (
      <button
        onClick={() => {
          toggle();
          setIsOpen(true);
        }}
        className="fixed bottom-4 right-4 z-50 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Ativar DEBUG de Permissões"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  const deniedLogs = logs.filter((log) => log.allowed === false);
  const allowedLogs = logs.filter((log) => log.allowed === true);

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[500px] max-h-[600px] shadow-2xl border-purple-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-purple-600" />
              DEBUG de Permissões
            </CardTitle>
            <CardDescription>
              {currentRole && <span className="text-sm">Role: {currentRole}</span>}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-2xl font-bold">{logs.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {allowedLogs.length}
              </div>
              <div className="text-xs text-muted-foreground">Permitidas</div>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {deniedLogs.length}
              </div>
              <div className="text-xs text-muted-foreground">Negadas</div>
            </div>
          </div>

          {/* Logs */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma verificação de permissão registrada ainda
                </p>
              ) : (
                [...logs].reverse().map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border text-sm ${
                      log.allowed === false
                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                        : log.allowed === true
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={log.allowed === false ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {log.action}
                          </Badge>
                          <span className="font-medium">{log.resource}</span>
                          {log.allowed !== null && (
                            <Badge variant={log.allowed ? 'default' : 'destructive'} className="text-xs">
                              {log.allowed ? '✓ Permitido' : '✗ Negado'}
                            </Badge>
                          )}
                        </div>
                        {log.resourceId && (
                          <p className="text-xs text-muted-foreground">ID: {log.resourceId}</p>
                        )}
                        {log.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{log.reason}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(log.timestamp, 'HH:mm:ss', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
