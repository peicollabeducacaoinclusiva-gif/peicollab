import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function PWAUpdatePrompt() {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setShowReload(true);
                  setWaitingWorker(newWorker);
                  toast({
                    title: "Nova versão disponível!",
                    description: "Uma atualização está pronta para ser instalada.",
                  });
                }
              });
            }
          });
        }
      });
    }
  }, [toast]);

  const reloadPage = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setShowReload(false);
    window.location.reload();
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card p-4 rounded-lg shadow-lg border">
      <p className="text-sm mb-2">Nova versão disponível!</p>
      <Button onClick={reloadPage} size="sm">
        Atualizar agora
      </Button>
    </div>
  );
}