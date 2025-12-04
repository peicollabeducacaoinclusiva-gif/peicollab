import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home } from 'lucide-react';

/**
 * Página exibida quando usuário tenta acessar módulo não habilitado
 */
export function ModuleNotAvailable() {
  const navigate = useNavigate();
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <CardTitle>Módulo Não Disponível</CardTitle>
          </div>
          <CardDescription>
            Este módulo não está habilitado para sua instituição.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Entre em contato com o administrador do sistema para solicitar 
            a ativação deste módulo para sua instituição.
          </p>
          
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="w-full"
            variant="default"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

