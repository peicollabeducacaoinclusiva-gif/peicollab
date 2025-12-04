import { useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PendingChangesService } from '@/services/pendingChangesService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { WifiOff, Save } from 'lucide-react';

export function OfflineStudentForm() {
  const isOnline = useOnlineStatus();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const studentData = {
      name,
      birth_date: birthDate,
      tenant_id: 'current-tenant-id', // Obtém do contexto
    };

    try {
      if (isOnline) {
        // Se online, salva direto no servidor
        const { error } = await supabase
          .from('students')
          .insert(studentData);

        if (error) throw error;

        toast.success('Estudante criado com sucesso!');
      } else {
        // Se offline, adiciona à fila de mudanças pendentes
        await PendingChangesService.addPendingChange(
          'create',
          'students',
          studentData
        );

        toast.warning('Salvo offline', {
          description: 'Será sincronizado quando você reconectar.',
          icon: <WifiOff className="h-4 w-4" />,
        });
      }

      // Limpa o formulário
      setName('');
      setBirthDate('');
    } catch (error) {
      console.error('Erro ao salvar estudante:', error);
      toast.error('Erro ao salvar estudante');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Você está offline. Os dados serão salvos localmente e sincronizados depois.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Nome do Estudante
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium mb-1">
          Data de Nascimento
        </label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        <Save className="h-4 w-4 mr-2" />
        {isOnline ? 'Salvar' : 'Salvar Offline'}
      </Button>
    </form>
  );
}