import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Plus, CheckCircle, Clock } from 'lucide-react';
import { familyCommunicationService, FamilyObservation, ObservationType, ObservationPriority } from '@/services/familyCommunicationService';
import { toast } from 'sonner';

interface FamilyObservationsProps {
  studentId: string;
}

export function FamilyObservations({ studentId }: FamilyObservationsProps) {
  const [observations, setObservations] = useState<FamilyObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    observation_type: 'general' as ObservationType,
    title: '',
    observation_text: '',
    priority: 'normal' as ObservationPriority,
  });

  useEffect(() => {
    loadObservations();
  }, [studentId]);

  const loadObservations = async () => {
    try {
      setLoading(true);
      const data = await familyCommunicationService.getObservations(studentId);
      setObservations(data);
    } catch (error) {
      toast.error('Erro ao carregar observações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await familyCommunicationService.createObservation(
        studentId,
        formData.observation_type,
        formData.observation_text,
        formData.title || undefined,
        formData.priority
      );
      toast.success('Observação registrada com sucesso');
      setDialogOpen(false);
      setFormData({
        observation_type: 'general',
        title: '',
        observation_text: '',
        priority: 'normal',
      });
      await loadObservations();
    } catch (error) {
      toast.error('Erro ao registrar observação');
      console.error(error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-600';
      case 'normal':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'general':
        return 'Geral';
      case 'pei':
        return 'PEI';
      case 'aee':
        return 'AEE';
      case 'behavior':
        return 'Comportamento';
      case 'health':
        return 'Saúde';
      case 'homework':
        return 'Tarefas';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Observações da Família
            </CardTitle>
            <CardDescription>
              Registre observações e comunique-se com a escola
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Observação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Observação</DialogTitle>
                <DialogDescription>
                  Registre uma observação sobre o aluno para a escola
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.observation_type}
                    onValueChange={(v) => setFormData({ ...formData, observation_type: v as ObservationType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="pei">PEI</SelectItem>
                      <SelectItem value="aee">AEE</SelectItem>
                      <SelectItem value="behavior">Comportamento</SelectItem>
                      <SelectItem value="health">Saúde</SelectItem>
                      <SelectItem value="homework">Tarefas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título (opcional)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Observação *</Label>
                  <Textarea
                    value={formData.observation_text}
                    onChange={(e) => setFormData({ ...formData, observation_text: e.target.value })}
                    required
                    rows={5}
                  />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v as ObservationPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Enviar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        ) : observations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma observação registrada ainda
          </div>
        ) : (
          <div className="space-y-3">
            {observations.map((observation) => (
              <div key={observation.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {observation.title && (
                        <h4 className="font-medium">{observation.title}</h4>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(observation.observation_type)}
                      </Badge>
                      <Badge className={`${getPriorityColor(observation.priority)} text-xs`}>
                        {observation.priority === 'urgent' ? 'Urgente' : 
                         observation.priority === 'high' ? 'Alta' :
                         observation.priority === 'normal' ? 'Normal' : 'Baixa'}
                      </Badge>
                      {observation.read_by_school ? (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Lida pela escola
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Aguardando leitura
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{observation.observation_text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(observation.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

