import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Switch será implementado ou importado do pacote compartilhado
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Save } from 'lucide-react';
import { privacySettingsService, PrivacySettings } from '../services/privacySettingsService';
import { toast } from 'sonner';

interface PrivacySettingsProps {
  studentId: string;
  familyMemberId: string;
}

export function PrivacySettings({ studentId, familyMemberId }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [studentId, familyMemberId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await privacySettingsService.getPrivacySettings(studentId, familyMemberId);
      if (data) {
        setSettings(data);
      } else {
        // Criar configurações padrão
        setSettings({
          id: '',
          student_id: studentId,
          family_member_id: familyMemberId,
          show_diagnosis: false,
          show_medical_info: false,
          show_full_pei: true,
          show_aee_details: true,
          show_evaluations: true,
          show_frequency: true,
          show_behavioral_notes: true,
          notification_preferences: {
            push: true,
            email: true,
            sms: false,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar configurações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await privacySettingsService.updatePrivacySettings(studentId, familyMemberId, settings);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Privacidade</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configurações de Privacidade
        </CardTitle>
        <CardDescription>
          Controle quais informações você deseja visualizar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Informações Visíveis</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-diagnosis">Mostrar Diagnóstico</Label>
              <p className="text-xs text-muted-foreground">
                Exibir informações de diagnóstico médico
              </p>
            </div>
            <input
              type="checkbox"
              id="show-diagnosis"
              checked={settings.show_diagnosis}
              onChange={(e) =>
                setSettings({ ...settings, show_diagnosis: e.target.checked })
              }
              className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-medical">Mostrar Informações Médicas</Label>
              <p className="text-xs text-muted-foreground">
                Exibir informações médicas e de saúde
              </p>
            </div>
            <input
              type="checkbox"
              id="show-medical"
              checked={settings.show_medical_info}
              onChange={(e) =>
                setSettings({ ...settings, show_medical_info: e.target.checked })
              }
              className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-pei">Mostrar PEI Completo</Label>
              <p className="text-xs text-muted-foreground">
                Exibir todas as informações do PEI
              </p>
            </div>
            <input
              type="checkbox"
              id="show-pei"
              checked={settings.show_full_pei}
              onChange={(e) =>
                setSettings({ ...settings, show_full_pei: e.target.checked })
              }
              className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-aee">Mostrar Detalhes do AEE</Label>
              <p className="text-xs text-muted-foreground">
                Exibir informações detalhadas das sessões AEE
              </p>
            </div>
            <input
              type="checkbox"
              id="show-aee"
              checked={settings.show_aee_details}
              onChange={(e) =>
                setSettings({ ...settings, show_aee_details: e.target.checked })
              }
              className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-evaluations">Mostrar Avaliações</Label>
              <p className="text-xs text-muted-foreground">
                Exibir notas e resultados de avaliações
              </p>
            </div>
            <input
              type="checkbox"
              id="show-evaluations"
              checked={settings.show_evaluations}
              onChange={(e) =>
                setSettings({ ...settings, show_evaluations: e.target.checked })
              }
              className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-frequency">Mostrar Frequência</Label>
              <p className="text-xs text-muted-foreground">
                Exibir informações de presença e faltas
              </p>
            </div>
            <input
              type="checkbox"
              id="show-frequency"
              checked={settings.show_frequency}
              onChange={(e) =>
                setSettings({ ...settings, show_frequency: e.target.checked })
              }
              className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notificações</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-push">Notificações Push</Label>
              <p className="text-xs text-muted-foreground">
                Receber notificações no dispositivo
              </p>
            </div>
            <input
              type="checkbox"
              id="notif-push"
              checked={settings.notification_preferences.push ?? true}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notification_preferences: {
                    ...settings.notification_preferences,
                    push: e.target.checked,
                  },
                })
              }
              className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-email">Notificações por E-mail</Label>
              <p className="text-xs text-muted-foreground">
                Receber notificações por e-mail
              </p>
            </div>
            <input
              type="checkbox"
              id="notif-email"
              checked={settings.notification_preferences.email ?? true}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notification_preferences: {
                    ...settings.notification_preferences,
                    email: e.target.checked,
                  },
                })
              }
              className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

