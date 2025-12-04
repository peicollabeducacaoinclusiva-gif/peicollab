import { useState } from 'react';
import { CheckCircle, XCircle, Clock, FileText, User, School, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { enrollmentService, type EnrollmentRequest } from '../services/enrollmentService';
import { toast } from 'sonner';

interface EnrollmentWorkflowProps {
  request: EnrollmentRequest;
  onStatusChange: () => void;
}

export function EnrollmentWorkflow({ request, onStatusChange }: EnrollmentWorkflowProps) {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionDetails, setRejectionDetails] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>(request.requested_class_id || '');

  async function handleMoveToAnalysis() {
    try {
      setLoading(true);
      await enrollmentService.moveToAnalysis(request.id, analysisNotes);
      toast.success('Solicitação movida para análise');
      setAnalysisDialogOpen(false);
      setAnalysisNotes('');
      onStatusChange();
    } catch (error: any) {
      console.error('Erro ao mover para análise:', error);
      toast.error(error.message || 'Erro ao mover para análise');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!selectedClassId) {
      toast.error('Selecione uma turma');
      return;
    }

    try {
      setLoading(true);
      await enrollmentService.approveEnrollment(request.id, selectedClassId);
      toast.success('Matrícula aprovada e criada com sucesso');
      setApproveDialogOpen(false);
      onStatusChange();
    } catch (error: any) {
      console.error('Erro ao aprovar matrícula:', error);
      toast.error(error.message || 'Erro ao aprovar matrícula');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    try {
      setLoading(true);
      await enrollmentService.rejectEnrollment(request.id, rejectionReason, rejectionDetails);
      toast.success('Solicitação rejeitada');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setRejectionDetails('');
      onStatusChange();
    } catch (error: any) {
      console.error('Erro ao rejeitar matrícula:', error);
      toast.error(error.message || 'Erro ao rejeitar matrícula');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToWaitlist() {
    if (!selectedClassId) {
      toast.error('Selecione uma turma');
      return;
    }

    try {
      setLoading(true);
      const result = await enrollmentService.addToWaitlist(request.id, selectedClassId);
      toast.success(`Adicionado à fila de espera na posição ${result?.position || 'N/A'}`);
      setWaitlistDialogOpen(false);
      onStatusChange();
    } catch (error: any) {
      console.error('Erro ao adicionar à fila de espera:', error);
      toast.error(error.message || 'Erro ao adicionar à fila de espera');
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon() {
    switch (request.status) {
      case 'aprovada':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejeitada':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'em_analise':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  }

  function getStatusBadge() {
    const colors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      em_analise: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      aprovada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejeitada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      cancelada: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };

    return (
      <Badge className={colors[request.status] || 'bg-gray-100'}>
        {getStatusIcon()}
        <span className="ml-1">
          {request.status === 'pendente' ? 'Pendente' :
           request.status === 'em_analise' ? 'Em Análise' :
           request.status === 'aprovada' ? 'Aprovada' :
           request.status === 'rejeitada' ? 'Rejeitada' :
           request.status === 'cancelada' ? 'Cancelada' : request.status}
        </span>
      </Badge>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status da Solicitação</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações da Solicitação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Aluno</p>
                <p className="text-sm text-muted-foreground">{request.student_name || 'Não informado'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <School className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Escola</p>
                <p className="text-sm text-muted-foreground">{request.school_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Tipo</p>
                <p className="text-sm text-muted-foreground">
                  {request.request_type === 'pre_matricula' ? 'Pré-Matrícula' :
                   request.request_type === 'rematricula' ? 'Rematrícula' :
                   request.request_type === 'transferencia' ? 'Transferência' : request.request_type}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Ano Letivo</p>
                <p className="text-sm text-muted-foreground">{request.academic_year}</p>
              </div>
            </div>
          </div>

          {/* Fila de Espera */}
          {request.waitlist_position && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Na fila de espera - Posição {request.waitlist_position}
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          {request.status === 'pendente' && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setAnalysisDialogOpen(true)}
                disabled={loading}
              >
                <Clock className="h-4 w-4 mr-2" />
                Mover para Análise
              </Button>
            </div>
          )}

          {request.status === 'em_analise' && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setApproveDialogOpen(true)}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                variant="outline"
                onClick={() => setWaitlistDialogOpen(true)}
                disabled={loading}
              >
                Adicionar à Fila de Espera
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Mover para Análise */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover para Análise</DialogTitle>
            <DialogDescription>
              Adicione notas sobre a análise desta solicitação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="analysisNotes">Notas de Análise</Label>
              <Textarea
                id="analysisNotes"
                value={analysisNotes}
                onChange={(e) => setAnalysisNotes(e.target.value)}
                placeholder="Observações sobre a solicitação..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAnalysisDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleMoveToAnalysis} disabled={loading}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Aprovar */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Matrícula</DialogTitle>
            <DialogDescription>
              Selecione a turma para matricular o aluno
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="classSelect">Turma *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="classSelect">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {/* Turmas serão carregadas dinamicamente */}
                  <SelectItem value={request.requested_class_id || ''}>
                    {request.requested_class_name || 'Turma Solicitada'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleApprove} disabled={loading || !selectedClassId}>
                Aprovar e Matricular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Rejeitar */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Motivo da Rejeição *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Documentação incompleta..."
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="rejectionDetails">Detalhes (opcional)</Label>
              <Textarea
                id="rejectionDetails"
                value={rejectionDetails}
                onChange={(e) => setRejectionDetails(e.target.value)}
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
              >
                Rejeitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Fila de Espera */}
      <Dialog open={waitlistDialogOpen} onOpenChange={setWaitlistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à Fila de Espera</DialogTitle>
            <DialogDescription>
              Selecione a turma para adicionar à fila de espera
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="waitlistClassSelect">Turma *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="waitlistClassSelect">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={request.requested_class_id || ''}>
                    {request.requested_class_name || 'Turma Solicitada'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWaitlistDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddToWaitlist} disabled={loading || !selectedClassId}>
                Adicionar à Fila
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


