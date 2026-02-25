'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { FieldRenderer } from '@/components/documents/FieldRenderer';
import { SectionComments } from '@/components/documents/SectionComments';
import { FamilyComments } from '@/components/family/FamilyComments';
import { FamilyAcknowledgement } from '@/components/family/FamilyAcknowledgement';
import { DocumentRating } from '@/components/documents/DocumentRating';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useDocumentEditor } from '@/hooks/useDocumentEditor';
import { useDocumentComments } from '@/hooks/useDocumentComments';
import { useFamilyComments } from '@/hooks/useFamilyComments';
import { useFamilyAcknowledgement } from '@/hooks/useFamilyAcknowledgement';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DocumentEditorProps = {
  studentId: string;
  templateId?: string; // Obrigatório ao criar; ao editar, o template vem do documento
  documentId?: string;
  readOnly?: boolean;
};

export function DocumentEditor({
  studentId,
  templateId,
  documentId,
  readOnly,
}: DocumentEditorProps) {
  const permissions = usePermissions();
  const router = useRouter();
  const { profile: studentProfile } = useStudentProfile(studentId);
  const {
    template,
    sections,
    values,
    status,
    loading,
    saving,
    error,
    progress,
    updateValue,
    saveValues,
    submitForValidation,
    approveDocument,
    rejectDocument,
    createVersion,
    documentId: currentDocumentId,
  } = useDocumentEditor({ studentId, templateId, documentId });
  const { commentsBySection, addComment, removeComment } = useDocumentComments(currentDocumentId);
  const {
    comments: familyComments,
    loading: familyCommentsLoading,
    error: familyCommentsError,
    addComment: addFamilyComment,
  } = useFamilyComments(currentDocumentId);
  const {
    acknowledgements: familyAcknowledgements,
    loading: familyAckLoading,
    error: familyAckError,
    confirmAcknowledgement,
  } = useFamilyAcknowledgement(currentDocumentId);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    await rejectDocument(rejectReason.trim());
    setRejectReason('');
    setRejectDialogOpen(false);
  };

  const handleExportJson = useCallback(async () => {
    if (!currentDocumentId) return;
    setExporting(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('export_document_json', {
      p_document_id: currentDocumentId,
    });
    setExporting(false);
    if (error) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documento-${currentDocumentId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentDocumentId]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const isReadOnly = useMemo(() => {
    if (readOnly) return true;
    if (!permissions.canEditDocument()) return true;
    return status !== 'rascunho';
  }, [readOnly, status, permissions]);

  const handleCreateVersion = async () => {
    const newId = await createVersion();
    if (newId) {
      router.push(`/dashboard/students/${studentId}/documents/${newId}`);
    }
  };

  useEffect(() => {
    if (status !== 'rascunho') return;
    const handle = window.setInterval(() => {
      saveValues();
    }, 30000);
    return () => window.clearInterval(handle);
  }, [saveValues, status]);

  if (loading) {
    return <p>Carregando documento...</p>;
  }

  if (!template) {
    return <p className="text-sm text-destructive">{error ?? 'Template não encontrado.'}</p>;
  }

  const tipoLabel =
    template.tipo === 'pei'
      ? 'PEI'
      : template.tipo === 'paee'
        ? 'PAEE'
        : template.tipo === 'estudo_caso'
          ? 'Estudo de Caso'
          : String(template.tipo).replace('_', ' ');

  return (
    <div className="space-y-6">
      {studentId && studentProfile ? (
        <nav
          className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
          aria-label="Navegação"
        >
          <Link
            href="/dashboard/students"
            className="hover:text-foreground transition-colors"
          >
            Alunos
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link
            href={`/dashboard/students/${studentId}`}
            className="hover:text-foreground transition-colors"
          >
            {studentProfile.nome}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link
            href={`/dashboard/students/${studentId}`}
            className="hover:text-foreground transition-colors"
          >
            Documentos
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground font-medium">{tipoLabel}</span>
        </nav>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Editor de Documento</h1>
          <p className="text-sm text-muted-foreground">Preencha as seções conforme o template.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {progress.total > 0 ? (
            <div className="flex items-center gap-2 min-w-[200px]">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {progress.filled}/{progress.total}
              </span>
            </div>
          ) : null}
          <DocumentStatusBadge status={status} />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Tabs defaultValue={sections[0]?.id}>
        <TabsList className="flex flex-wrap">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.nome_secao}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <Card>
              <CardHeader>
                <CardTitle>{section.nome_secao}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((field) => (
                    <FieldRenderer
                      key={field.id}
                      id={field.id}
                      label={field.label}
                      type={field.tipo_campo}
                      required={field.required}
                      options={
                        field.options_json
                          ? (() => {
                              try {
                                return JSON.parse(field.options_json);
                              } catch {
                                return null;
                              }
                            })()
                          : null
                      }
                      value={values[field.id] ?? null}
                      onChange={(value) => updateValue(field.id, value)}
                      readOnly={isReadOnly}
                    />
                  ))}
                {currentDocumentId ? (
                  <SectionComments
                    sectionId={section.id}
                    sectionName={section.nome_secao}
                    comments={commentsBySection(section.id)}
                    onAddComment={addComment}
                    onRemoveComment={removeComment}
                    readOnly={isReadOnly}
                  />
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {currentDocumentId ? (
        <div className="space-y-4">
          <FamilyComments
            documentId={currentDocumentId}
            comments={familyComments}
            loading={familyCommentsLoading}
            error={familyCommentsError}
            onAddComment={addFamilyComment}
          />
          <FamilyAcknowledgement
            documentId={currentDocumentId}
            acknowledgements={familyAcknowledgements}
            loading={familyAckLoading}
            error={familyAckError}
            onConfirmAcknowledgement={confirmAcknowledgement}
          />
          {status === 'aprovado' ? (
            <DocumentRating documentId={currentDocumentId} />
          ) : null}
        </div>
      ) : null}

      <div className="sticky top-0 z-10 -mx-6 mt-6 flex flex-wrap items-center gap-3 border-t bg-background px-6 py-4">
        {status === 'rascunho' && permissions.canEditDocument() ? (
          <>
            <Button onClick={saveValues} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={submitForValidation} disabled={saving}>
              Enviar para validação
            </Button>
          </>
        ) : null}

        {status === 'em_validacao' && permissions.canApproveDocument() ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={approveDocument} disabled={saving}>
              Aprovar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRejectDialogOpen(true)}
              disabled={saving}
            >
              Rejeitar
            </Button>
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rejeitar documento</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="reject-motivo">Motivo da rejeição *</Label>
                  <Input
                    id="reject-motivo"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Informe o motivo para o autor"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRejectDialogOpen(false);
                      setRejectReason('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectConfirm}
                    disabled={saving || !rejectReason.trim()}
                  >
                    {saving ? 'Rejeitando...' : 'Confirmar rejeição'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : null}

        {status === 'aprovado' && permissions.canCreateVersion() ? (
          <Button variant="outline" onClick={handleCreateVersion} disabled={saving}>
            Criar nova versão
          </Button>
        ) : null}

        {currentDocumentId ? (
          <>
            <Button variant="outline" size="sm" onClick={handleExportJson} disabled={exporting}>
              {exporting ? 'Exportando...' : 'Exportar JSON'}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              Imprimir / PDF
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
