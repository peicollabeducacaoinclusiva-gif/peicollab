// ============================================================================
// COMPONENTE: TeacherMessages
// ============================================================================
// Sistema de mensagens entre professores AEE e regulares
// Data: 2025-02-20
// ============================================================================

import { useState } from 'react';
import { useTeacherCommunication } from '../../../hooks/useCommunication';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Send, Bell, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CommunicationType, CommunicationPriority } from '../../../types/communication.types';

interface TeacherMessagesProps {
  planId: string;
}

export function TeacherMessages({ planId }: TeacherMessagesProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<CommunicationType>('message');
  const [priority, setPriority] = useState<CommunicationPriority>('medium');

  const {
    messages,
    isLoading,
    createMessage,
    unreadCount,
  } = useTeacherCommunication(planId);

  // Buscar professores disponíveis para comunicação
  const { data: availableTeachers } = useQuery({
    queryKey: ['available-teachers', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['teacher', 'aee_teacher', 'coordinator'])
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !messageText.trim()) return;

    createMessage.mutate(
      {
        plan_id: planId,
        to_user_id: selectedUser,
        communication_type: messageType,
        message_text: messageText,
        priority,
      },
      {
        onSuccess: () => {
          setMessageText('');
          setSelectedUser('');
        },
      }
    );
  };

  const getTypeLabel = (type: CommunicationType) => {
    const labels: Record<CommunicationType, string> = {
      message: 'Mensagem',
      meeting_request: 'Solicitação de Reunião',
      feedback: 'Feedback',
      alert: 'Alerta',
      question: 'Pergunta',
      suggestion: 'Sugestão',
      update: 'Atualização',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: CommunicationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comunicação entre Professores
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  <Bell className="h-3 w-3 mr-1" />
                  {unreadCount} não lidas
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Troque mensagens com outros professores sobre o plano AEE
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário de Nova Mensagem */}
        <form onSubmit={handleSendMessage} className="space-y-4 p-4 border rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="to_user">Para</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destinatário" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message_type">Tipo</Label>
              <Select
                value={messageType}
                onValueChange={(value) => setMessageType(value as CommunicationType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Mensagem</SelectItem>
                  <SelectItem value="meeting_request">Solicitação de Reunião</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="alert">Alerta</SelectItem>
                  <SelectItem value="question">Pergunta</SelectItem>
                  <SelectItem value="suggestion">Sugestão</SelectItem>
                  <SelectItem value="update">Atualização</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as CommunicationPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message_text">Mensagem *</Label>
            <Textarea
              id="message_text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
              placeholder="Digite sua mensagem..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={createMessage.isPending || !selectedUser}>
            <Send className="h-4 w-4 mr-2" />
            {createMessage.isPending ? 'Enviando...' : 'Enviar Mensagem'}
          </Button>
        </form>

        {/* Lista de Mensagens */}
        <div className="space-y-4">
          <h3 className="font-semibold">Mensagens</h3>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando mensagens...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma mensagem ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg ${
                    !message.read_status ? 'bg-muted/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{message.from_user_name}</span>
                      <Badge variant={getPriorityColor(message.priority)}>
                        {message.priority}
                      </Badge>
                      <Badge variant="outline">{getTypeLabel(message.communication_type)}</Badge>
                      {message.read_status && (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{message.message_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

