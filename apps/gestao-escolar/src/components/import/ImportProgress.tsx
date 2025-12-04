import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Download } from 'lucide-react';
import { Button } from '../ui/button';

interface ImportProgressProps {
  batchId: string;
  totalRecords: number;
  onComplete: (result: ImportResult) => void;
}

interface ImportResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  duplicateCount: number;
  skippedCount: number;
  warningsCount: number;
  errors: Array<{ row: number; message: string }>;
}

export function ImportProgress({ batchId, totalRecords, onComplete }: ImportProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [stats, setStats] = useState({
    success: 0,
    failed: 0,
    duplicates: 0,
    skipped: 0,
    warnings: 0
  });
  const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([]);

  useEffect(() => {
    // Simular progresso (na implementação real, seria via websocket ou polling)
    const interval = setInterval(() => {
      setCurrentRow(prev => {
        if (prev >= totalRecords) {
          clearInterval(interval);
          setStatus('completed');
          onComplete({
            success: true,
            successCount: stats.success,
            failureCount: stats.failed,
            duplicateCount: stats.duplicates,
            skippedCount: stats.skipped,
            warningsCount: stats.warnings,
            errors
          });
          return totalRecords;
        }
        
        const newProgress = ((prev + 1) / totalRecords) * 100;
        setProgress(newProgress);
        
        // Simular resultado aleatório para demo
        const random = Math.random();
        if (random > 0.9) {
          setStats(s => ({ ...s, failed: s.failed + 1 }));
          setErrors(e => [...e, { row: prev + 1, message: 'Erro de validação' }]);
        } else if (random > 0.8) {
          setStats(s => ({ ...s, warnings: s.warnings + 1 }));
        } else if (random > 0.7) {
          setStats(s => ({ ...s, duplicates: s.duplicates + 1 }));
        } else {
          setStats(s => ({ ...s, success: s.success + 1 }));
        }
        
        return prev + 1;
      });
    }, 100); // Processa ~10 registros/segundo (ajustar conforme necessidade)
    
    return () => clearInterval(interval);
  }, [totalRecords]);

  const downloadErrorLog = () => {
    const errorText = errors.map(e => `Linha ${e.row}: ${e.message}`).join('\n');
    const blob = new Blob([errorText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erros-importacao-${batchId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {status === 'processing' && 'Importando Dados...'}
              {status === 'completed' && 'Importação Concluída!'}
              {status === 'failed' && 'Importação Falhada'}
            </CardTitle>
            {status === 'processing' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            {status === 'completed' && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-foreground">
                {currentRow} / {totalRecords} registros
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-900">{stats.success}</p>
              <p className="text-xs text-green-700">Sucesso</p>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-900">{stats.failed}</p>
              <p className="text-xs text-red-700">Falhas</p>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-900">{stats.duplicates}</p>
              <p className="text-xs text-yellow-700">Duplicados</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <XCircle className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{stats.skipped}</p>
              <p className="text-xs text-gray-700">Pulados</p>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-900">{stats.warnings}</p>
              <p className="text-xs text-blue-700">Avisos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors Card */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Erros Encontrados ({errors.length})
              </CardTitle>
              <Button onClick={downloadErrorLog} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Baixar Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {errors.slice(0, 10).map((error, index) => (
                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                  <span className="font-medium text-red-900">Linha {error.row}:</span>{' '}
                  <span className="text-red-700">{error.message}</span>
                </div>
              ))}
              {errors.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  ... e mais {errors.length - 10} erros. Baixe o log completo.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {status === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-green-900 mb-2">
              Importação Concluída!
            </h3>
            <p className="text-sm text-green-700">
              {stats.success} registro(s) importado(s) com sucesso
              {stats.failed > 0 && `, ${stats.failed} falha(s)`}
              {stats.warnings > 0 && `, ${stats.warnings} aviso(s)`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}















