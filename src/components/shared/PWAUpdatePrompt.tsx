import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PWAUpdatePromptProps {
  className?: string;
}

export function PWAUpdatePrompt({ className = '' }: PWAUpdatePromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    checkIfInstalled();

    // Listener para prompt de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listener para atualizações do service worker
    const handleServiceWorkerUpdate = () => {
      setShowUpdatePrompt(true);
    };

    // Listener para app instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Verificar se há atualizações do service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleServiceWorkerUpdate);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleServiceWorkerUpdate);
      }
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
    } else {
      console.log('Usuário rejeitou a instalação');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  if (isInstalled) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}>
      {showInstallPrompt && (
        <Card className="border-blue-300 bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Download className="h-4 w-4" />
              Instalar PEI Collab
            </CardTitle>
            <CardDescription className="text-xs text-blue-800 dark:text-blue-200">
              Instale o app para acesso offline e notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall} className="flex-1">
                Instalar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDismissInstall}
                aria-label="Fechar prompt de instalação"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showUpdatePrompt && (
        <Alert className="border-green-300 bg-green-100 dark:border-green-600 dark:bg-green-900/30">
          <RefreshCw className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm text-green-900 dark:text-green-100">
              Nova versão disponível!
            </span>
            <div className="flex gap-2 ml-2">
              <Button size="sm" onClick={handleUpdate}>
                Atualizar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDismissUpdate}
                aria-label="Fechar prompt de atualização"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}