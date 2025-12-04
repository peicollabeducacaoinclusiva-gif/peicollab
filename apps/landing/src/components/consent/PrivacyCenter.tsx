import { useState } from 'react';
import { ConsentManager } from './ConsentManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Button } from '@/components/ui';
import { Shield, FileText, Settings, Download } from 'lucide-react';
import { toast } from 'sonner';

export function PrivacyCenter() {
  const [activeTab, setActiveTab] = useState('consents');

  const handleExportData = async () => {
    toast.info('Funcionalidade de exportação de dados em desenvolvimento');
    // TODO: Implementar exportação de dados pessoais
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Shield className="h-8 w-8" />
            <span>Centro de Privacidade</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas preferências de privacidade e dados pessoais
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consents">
              <Shield className="h-4 w-4 mr-2" />
              Consentimentos
            </TabsTrigger>
            <TabsTrigger value="policies">
              <FileText className="h-4 w-4 mr-2" />
              Políticas
            </TabsTrigger>
            <TabsTrigger value="data">
              <Settings className="h-4 w-4 mr-2" />
              Meus Dados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consents" className="space-y-4">
            <ConsentManager />
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Políticas de Privacidade</CardTitle>
                <CardDescription>
                  Leia as políticas de privacidade da sua rede
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  As políticas de privacidade estão sendo carregadas...
                </p>
                {/* TODO: Implementar carregamento de políticas de privacidade */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meus Dados Pessoais</CardTitle>
                <CardDescription>
                  Gerencie e exporte seus dados pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Exportar Dados</h4>
                  <p className="text-sm text-muted-foreground">
                    Você pode solicitar uma cópia de todos os seus dados pessoais armazenados em nosso sistema.
                  </p>
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Solicitar Exportação
                  </Button>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold">Excluir Conta</h4>
                  <p className="text-sm text-muted-foreground">
                    Você pode solicitar a exclusão permanente da sua conta e todos os dados associados.
                  </p>
                  <Button variant="destructive" onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
                    Solicitar Exclusão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

