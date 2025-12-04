import { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { documentService, type OfficialDocument, type DocumentType } from '../services/documentService';
import { toast } from 'sonner';

interface DocumentGeneratorProps {
  studentId: string;
  enrollmentId?: string;
  schoolId: string;
  tenantId: string;
  onDocumentGenerated?: (document: OfficialDocument) => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  { value: 'declaracao_escolar', label: 'Declaração Escolar', description: 'Declaração de vínculo escolar' },
  { value: 'historico_escolar', label: 'Histórico Escolar', description: 'Histórico completo do aluno' },
  { value: 'certificado_conclusao', label: 'Certificado de Conclusão', description: 'Certificado de conclusão de curso' },
  { value: 'diploma', label: 'Diploma', description: 'Diploma de conclusão' },
  { value: 'atestado_frequencia', label: 'Atestado de Frequência', description: 'Comprovação de frequência escolar' },
  { value: 'declaracao_transferencia', label: 'Declaração de Transferência', description: 'Documento para transferência' },
  { value: 'declaracao_vinculo', label: 'Declaração de Vínculo', description: 'Comprovação de vínculo com a escola' },
];

export function DocumentGenerator({
  studentId,
  enrollmentId,
  schoolId,
  tenantId,
  onDocumentGenerated,
}: DocumentGeneratorProps) {
  const [documentType, setDocumentType] = useState<DocumentType>('declaracao_escolar');
  const [templateId, setTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [customData, setCustomData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<OfficialDocument | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [documentType, tenantId, schoolId]);

  async function loadTemplates() {
    try {
      const data = await documentService.getTemplates(tenantId, schoolId);
      setTemplates(data.filter(t => t.document_type === documentType));
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error);
    }
  }

  async function handleGenerate() {
    try {
      setLoading(true);
      const document = await documentService.generateDocument(
        studentId,
        documentType,
        templateId || undefined,
        {
          enrollment_id: enrollmentId,
          academic_year: new Date().getFullYear(),
          ...customData,
        }
      );

      setGeneratedDocument(document);
      toast.success('Documento gerado com sucesso');
      onDocumentGenerated?.(document);
      setPreviewDialogOpen(true);
    } catch (error: any) {
      console.error('Erro ao gerar documento:', error);
      toast.error(error.message || 'Erro ao gerar documento');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(documentId: string) {
    try {
      await documentService.approveDocument(documentId);
      toast.success('Documento aprovado');
      if (generatedDocument?.id === documentId) {
        setGeneratedDocument({ ...generatedDocument, status: 'approved' });
      }
    } catch (error: any) {
      console.error('Erro ao aprovar documento:', error);
      toast.error(error.message || 'Erro ao aprovar documento');
    }
  }

  async function handleIssue(documentId: string) {
    try {
      const result = await documentService.issueDocument(documentId);
      toast.success(`Documento emitido! Código de verificação: ${result.verificationCode}`);
      if (generatedDocument?.id === documentId) {
        setGeneratedDocument({ ...generatedDocument, status: 'issued', verification_code: result.verificationCode });
      }
    } catch (error: any) {
      console.error('Erro ao emitir documento:', error);
      toast.error(error.message || 'Erro ao emitir documento');
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    };

    const icons: Record<string, any> = {
      draft: FileText,
      pending_approval: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      issued: CheckCircle,
    };

    const Icon = icons[status] || FileText;

    return (
      <Badge className={colors[status] || 'bg-gray-100'}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'draft' ? 'Rascunho' :
         status === 'pending_approval' ? 'Aguardando Aprovação' :
         status === 'approved' ? 'Aprovado' :
         status === 'rejected' ? 'Rejeitado' :
         status === 'issued' ? 'Emitido' : status}
      </Badge>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Documento Oficial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="documentType">Tipo de Documento *</Label>
            <Select value={documentType} onValueChange={(value: DocumentType) => {
              setDocumentType(value);
              setTemplateId('');
            }}>
              <SelectTrigger id="documentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {templates.length > 0 && (
            <div>
              <Label htmlFor="templateId">Template (opcional)</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="templateId">
                  <SelectValue placeholder="Usar template padrão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Template Padrão</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="customData">Dados Adicionais (JSON)</Label>
            <Textarea
              id="customData"
              value={JSON.stringify(customData, null, 2)}
              onChange={(e) => {
                try {
                  setCustomData(JSON.parse(e.target.value));
                } catch {
                  // Ignorar JSON inválido
                }
              }}
              placeholder='{"purpose": "Declaração para...", "period": "2024"}'
              rows={4}
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            {loading ? 'Gerando...' : 'Gerar Documento'}
          </Button>
        </CardContent>
      </Card>

      {generatedDocument && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documento Gerado</CardTitle>
              {getStatusBadge(generatedDocument.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {DOCUMENT_TYPES.find(t => t.value === generatedDocument.document_type)?.label}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{generatedDocument.status}</p>
              </div>
              {generatedDocument.verification_code && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Código de Verificação</p>
                  <p className="font-mono font-medium">{generatedDocument.verification_code}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewDialogOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              {generatedDocument.status === 'pending_approval' && (
                <Button
                  onClick={() => handleApprove(generatedDocument.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              )}
              {generatedDocument.status === 'approved' && (
                <Button
                  onClick={() => handleIssue(generatedDocument.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Emitir
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Preview */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Documento</DialogTitle>
            <DialogDescription>
              {generatedDocument && DOCUMENT_TYPES.find(t => t.value === generatedDocument.document_type)?.label}
            </DialogDescription>
          </DialogHeader>
          {generatedDocument && (
            <div className="space-y-4">
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                {JSON.stringify(generatedDocument.content, null, 2)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


