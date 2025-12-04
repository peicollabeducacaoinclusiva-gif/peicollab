import { useEffect, useState } from 'react';
import { getVLibrasService } from '../../services/vlibrasService';
import { Button } from '@pei/ui';
import { Languages } from 'lucide-react';

export interface VLibrasIntegrationProps {
  enabled?: boolean;
  position?: 'left' | 'right';
  color?: string;
  showToggle?: boolean;
}

/**
 * Componente de integração com VLibras
 * Carrega e inicializa o widget VLibras para tradução de conteúdo para Libras
 */
export function VLibrasIntegration({
  enabled = true,
  position = 'right',
  color = '#0066cc',
  showToggle = true,
}: VLibrasIntegrationProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const vlibrasService = getVLibrasService();

  useEffect(() => {
    const initVLibras = async () => {
      try {
        await vlibrasService.initialize({
          enabled: isEnabled,
          widgetPosition: position,
          widgetColor: color,
        });
        setIsInitialized(vlibrasService.isInitialized());
      } catch (error) {
        console.error('Erro ao inicializar VLibras:', error);
      }
    };

    if (isEnabled) {
      initVLibras();
    }

    return () => {
      if (!isEnabled) {
        vlibrasService.destroy();
      }
    };
  }, [isEnabled, position, color]);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    vlibrasService.setEnabled(newEnabled);
  };

  if (!showToggle) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      aria-label={isEnabled ? 'Desativar VLibras' : 'Ativar VLibras'}
      className="fixed bottom-4 right-4 z-50"
    >
      <Languages className="h-4 w-4 mr-2" />
      {isEnabled ? 'Desativar Libras' : 'Ativar Libras'}
    </Button>
  );
}

/**
 * Hook para usar VLibras em componentes
 */
export function useVLibras(enabled: boolean = true) {
  const [isAvailable, setIsAvailable] = useState(false);
  const vlibrasService = getVLibrasService();

  useEffect(() => {
    const checkAvailability = async () => {
      if (enabled) {
        await vlibrasService.initialize({ enabled: true });
        setIsAvailable(vlibrasService.isAvailable());
      }
    };

    checkAvailability();
  }, [enabled]);

  const translate = async (text: string) => {
    if (isAvailable) {
      await vlibrasService.translate(text);
    }
  };

  return {
    isAvailable,
    translate,
    setEnabled: (enabled: boolean) => vlibrasService.setEnabled(enabled),
  };
}

