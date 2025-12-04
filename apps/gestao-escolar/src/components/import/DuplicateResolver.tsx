import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { AlertTriangle, Check, X, GitMerge, Plus } from 'lucide-react';

interface Duplicate {
  sourceRow: number;
  existing: Record<string, any>;
  new: Record<string, any>;
}

interface DuplicateResolverProps {
  duplicates: Duplicate[];
  onResolved: (decisions: Record<number, 'skip' | 'overwrite' | 'merge' | 'create_new'>) => void;
}

export function DuplicateResolver({ duplicates, onResolved }: DuplicateResolverProps) {
  const [decisions, setDecisions] = useState<Record<number, string>>({});
  const [globalAction, setGlobalAction] = useState<string>('');

  const handleDecision = (rowNumber: number, action: string) => {
    setDecisions(prev => ({ ...prev, [rowNumber]: action }));
  };

  const applyGlobalAction = () => {
    if (!globalAction) return;
    
    const newDecisions: Record<number, string> = {};
    duplicates.forEach(dup => {
      newDecisions[dup.sourceRow] = globalAction;
    });
    setDecisions(newDecisions);
  };

  const handleComplete = () => {
    const finalDecisions: Record<number, any> = {};
    duplicates.forEach(dup => {
      finalDecisions[dup.sourceRow] = decisions[dup.sourceRow] || 'skip';
    });
    onResolved(finalDecisions);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'skip':
        return <X className="h-4 w-4" />;
      case 'overwrite':
        return <Check className="h-4 w-4" />;
      case 'merge':
        return <GitMerge className="h-4 w-4" />;
      case 'create_new':
        return <Plus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getDecisionColor = (action: string) => {
    switch (action) {
      case 'skip':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'overwrite':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'merge':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'create_new':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const decidedCount = Object.keys(decisions).length;
  const pendingCount = duplicates.length - decidedCount;

  if (duplicates.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">
            Nenhum duplicado encontrado!
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Todos os registros são novos e serão importados
          </p>
          <Button onClick={() => onResolved({})} className="mt-6">
            Continuar para Importação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <CardTitle>Duplicados Encontrados</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {duplicates.length} registro(s) duplicado(s) identificado(s)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{decidedCount}/{duplicates.length}</p>
              <p className="text-xs text-muted-foreground">resolvidos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Ação Global */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Aplicar a todos:</Label>
            <select
              value={globalAction}
              onChange={(e) => setGlobalAction(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            >
              <option value="">-- Selecione uma ação --</option>
              <option value="skip">Pular (manter existente)</option>
              <option value="overwrite">Sobrescrever</option>
              <option value="merge">Mesclar dados</option>
              <option value="create_new">Criar como novo</option>
            </select>
            <Button onClick={applyGlobalAction} size="sm" disabled={!globalAction}>
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Duplicados */}
      <div className="space-y-4">
        {duplicates.map((dup) => {
          const decision = decisions[dup.sourceRow];
          
          return (
            <Card key={dup.sourceRow}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Linha {dup.sourceRow} - {dup.new.name || dup.new.full_name || 'Registro'}
                  </CardTitle>
                  {decision && (
                    <Badge className={getDecisionColor(decision)}>
                      {getActionIcon(decision)}
                      <span className="ml-1">
                        {decision === 'skip' && 'Pular'}
                        {decision === 'overwrite' && 'Sobrescrever'}
                        {decision === 'merge' && 'Mesclar'}
                        {decision === 'create_new' && 'Criar Novo'}
                      </span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  {/* Existente */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
                      <span className="h-2 w-2 rounded-full bg-yellow-600 mr-2"></span>
                      Registro Existente no Sistema
                    </h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(dup.existing).slice(0, 8).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-medium text-foreground">
                            {value !== null && value !== undefined ? String(value) : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Novo */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-600 mr-2"></span>
                      Dados do Arquivo
                    </h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(dup.new).slice(0, 8).map(([key, value]: [string, any]) => {
                        const isDifferent = dup.existing[key] !== value;
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className={`font-medium ${
                              isDifferent ? 'text-primary' : 'text-foreground'
                            }`}>
                              {value !== null && value !== undefined ? String(value) : '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    variant={decision === 'skip' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDecision(dup.sourceRow, 'skip')}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Pular
                  </Button>
                  <Button
                    variant={decision === 'overwrite' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDecision(dup.sourceRow, 'overwrite')}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Sobrescrever
                  </Button>
                  <Button
                    variant={decision === 'merge' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDecision(dup.sourceRow, 'merge')}
                    className="flex-1"
                  >
                    <GitMerge className="h-4 w-4 mr-2" />
                    Mesclar
                  </Button>
                  <Button
                    variant={decision === 'create_new' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDecision(dup.sourceRow, 'create_new')}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Novo
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">
            {pendingCount} decisões pendentes
          </p>
          <p className="text-xs text-muted-foreground">
            Resolva todos os duplicados antes de continuar
          </p>
        </div>
        <Button onClick={handleComplete} disabled={pendingCount > 0}>
          Continuar
        </Button>
      </div>
    </div>
  );
}















