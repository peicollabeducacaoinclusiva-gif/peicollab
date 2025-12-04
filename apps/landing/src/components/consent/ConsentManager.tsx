import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, Alert, AlertDescription } from '@/components/ui';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ConsentType, ConsentTemplate } from '@pei/database';

// Importar serviço de consentimento
// Nota: Se o app landing não tiver @pei/database, criar uma versão local do serviço
// Por enquanto, vamos usar uma implementação direta com Supabase
import { supabase } from '@/integrations/supabase/client';

interface ConsentManagerProps {
  onConsentChange?: (consents: Record<ConsentType, boolean>) => void;
}

export function ConsentManager({ onConsentChange }: ConsentManagerProps) {
  const { user, isAuthenticated } = useAuth();
  const { tenantInfo, loading: tenantLoading } = useTenant();
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({} as Record<ConsentType, boolean>);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isAuthenticated && user && tenantInfo) {
      loadConsents();
    }
  }, [isAuthenticated, user, tenantInfo]);

  const loadConsents = async () => {
    if (!tenantInfo || !user) return;

    try {
      setLoading(true);

      // Carregar templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('tenant_id', tenantInfo.id)
        .eq('is_active', true)
        .order('consent_type');

      if (templatesError) throw templatesError;
      setTemplates((templatesData || []) as ConsentTemplate[]);

      // Carregar consentimentos do usuário
      const { data: consentsData, error: consentsError } = await supabase.rpc('get_user_consents', {
        p_tenant_id: tenantInfo.id,
        p_user_id: user.id,
      });

      if (consentsError) throw consentsError;

      // Mapear consentimentos
      const consentsMap: Record<ConsentType, boolean> = {} as Record<ConsentType, boolean>;
      (consentsData || []).forEach((consent: any) => {
        consentsMap[consent.consent_type as ConsentType] = consent.granted && !consent.revoked_at;
      });

      setConsents(consentsMap);
      onConsentChange?.(consentsMap);
    } catch (error) {
      console.error('Erro ao carregar consentimentos:', error);
      toast.error('Erro ao carregar consentimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (consentType: ConsentType, granted: boolean) => {
    if (!tenantInfo || !user) return;

    try {
      setSaving(prev => ({ ...prev, [consentType]: true }));

      if (granted) {
        const { error } = await supabase.rpc('grant_consent', {
          p_tenant_id: tenantInfo.id,
          p_consent_type: consentType,
          p_user_id: user.id,
        });

        if (error) throw error;
        toast.success('Consentimento concedido');
      } else {
        const { error } = await supabase.rpc('revoke_consent', {
          p_tenant_id: tenantInfo.id,
          p_consent_type: consentType,
          p_user_id: user.id,
          p_reason: 'Revogado pelo usuário',
        });

        if (error) throw error;
        toast.success('Consentimento revogado');
      }

      // Atualizar estado local
      setConsents(prev => ({ ...prev, [consentType]: granted }));
      onConsentChange?.({ ...consents, [consentType]: granted });
    } catch (error) {
      console.error('Erro ao atualizar consentimento:', error);
      toast.error('Erro ao atualizar consentimento');
    } finally {
      setSaving(prev => ({ ...prev, [consentType]: false }));
    }
  };

  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertDescription>
          Você precisa estar autenticado para gerenciar seus consentimentos.
        </AlertDescription>
      </Alert>
    );
  }

  if (tenantLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Nenhum template de consentimento configurado para sua rede.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Consentimentos</CardTitle>
          <CardDescription>
            Controle como seus dados pessoais são utilizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {templates.map((template) => {
            const isGranted = consents[template.consent_type] || false;
            const isSaving = saving[template.consent_type] || false;

            return (
              <div key={template.id} className="flex items-start justify-between space-x-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{template.title}</h4>
                    {template.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {isGranted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Concedido</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Não concedido</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isGranted}
                    onCheckedChange={(checked) => handleConsentChange(template.consent_type, checked)}
                    disabled={isSaving || template.required}
                  />
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

