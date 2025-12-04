import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';
import { Info, Lightbulb } from 'lucide-react';

interface KPITooltipProps {
  kpiName: string;
  description: string;
  calculation?: string;
  suggestedActions?: string[];
  threshold?: {
    excellent: number;
    good: number;
    attention: number;
    critical: number;
  };
  currentValue?: number;
  children: React.ReactNode;
}

export function KPITooltip({
  kpiName,
  description,
  calculation,
  suggestedActions,
  threshold,
  currentValue,
  children,
}: KPITooltipProps) {
  const getStatus = () => {
    if (!threshold || currentValue === undefined) return null;
    if (currentValue >= threshold.excellent) return { label: 'Excelente', color: 'text-green-600 dark:text-green-400' };
    if (currentValue >= threshold.good) return { label: 'Bom', color: 'text-blue-600 dark:text-blue-400' };
    if (currentValue >= threshold.attention) return { label: 'Atenção', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Crítico', color: 'text-red-600 dark:text-red-400' };
  };

  const status = getStatus();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-md p-4" side="top">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">{kpiName}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            
            {calculation && (
              <div>
                <p className="text-xs font-medium mb-1">Como é calculado:</p>
                <p className="text-xs text-muted-foreground">{calculation}</p>
              </div>
            )}

            {status && currentValue !== undefined && (
              <div>
                <p className="text-xs font-medium mb-1">Status atual:</p>
                <p className={`text-xs font-semibold ${status.color}`}>
                  {status.label} ({currentValue.toFixed(1)}%)
                </p>
              </div>
            )}

            {threshold && (
              <div>
                <p className="text-xs font-medium mb-1">Referências:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Excelente: ≥ {threshold.excellent}%</li>
                  <li>• Bom: {threshold.good}% - {threshold.excellent - 1}%</li>
                  <li>• Atenção: {threshold.attention}% - {threshold.good - 1}%</li>
                  <li>• Crítico: &lt; {threshold.attention}%</li>
                </ul>
              </div>
            )}

            {suggestedActions && suggestedActions.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Lightbulb className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-xs font-medium">Ações sugeridas:</p>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  {suggestedActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

