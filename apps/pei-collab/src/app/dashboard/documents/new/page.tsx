'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useStudents';
import { useTemplates } from '@/hooks/useTemplates';

const formatDateInput = (date: Date) => date.toISOString().split('T')[0];

const formatDateDisplay = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

function NewDocumentWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const permissions = usePermissions();
  const { students, loading: studentsLoading } = useStudents({
    search: '',
    categoria: '',
    serie: '',
  });
  const { templates, loading: templatesLoading } = useTemplates();

  const [step, setStep] = useState(1);
  const [studentId, setStudentId] = useState('');
  const [templateId, setTemplateId] = useState('');

  useEffect(() => {
    const prefill = searchParams.get('studentId');
    if (prefill && students.some((s) => s.id === prefill)) {
      setStudentId(prefill);
    }
  }, [searchParams, students]);
  const [documentDate, setDocumentDate] = useState(formatDateInput(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const studentOptions = useMemo(() => students, [students]);
  const templateOptions = useMemo(() => templates, [templates]);

  const selectedStudent = useMemo(
    () => studentOptions.find((s) => s.id === studentId),
    [studentOptions, studentId]
  );
  const selectedTemplate = useMemo(
    () => templateOptions.find((t) => t.id === templateId),
    [templateOptions, templateId]
  );

  const validateStep1 = () => {
    if (!studentId || !templateId || !documentDate) {
      setError('Preencha todos os campos obrigatórios.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step < 2) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
    setError(null);
  };

  const handleCreate = () => {
    if (!validateStep1()) return;
    setCreating(true);
    setError(null);
    router.push(`/dashboard/students/${studentId}/documents/new?templateId=${templateId}`);
  };

  if (permissions.loading) {
    return <p>Carregando...</p>;
  }

  if (!permissions.canCreateDocument()) {
    return <p className="text-sm text-muted-foreground">Sem permissão para criar documentos.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Criar Novo Documento</h1>
        <p className="text-sm text-muted-foreground">
          Siga as etapas abaixo para criar um documento estruturado.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">Passo {step} de 2</p>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações Básicas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Comece preenchendo os dados essenciais do documento.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione o Aluno *</Label>
              <Select value={studentId} onValueChange={setStudentId} disabled={studentsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {studentOptions.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select value={templateId} onValueChange={setTemplateId} disabled={templatesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nome_template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data do Documento *</Label>
              <Input
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Revise os dados e clique em &quot;Criar e abrir editor&quot; para preencher as seções.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Aluno:</span>
                <p className="font-medium">{selectedStudent?.nome ?? '-'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Tipo de documento:</span>
                <p className="font-medium">{selectedTemplate?.nome_template ?? '-'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Data do documento:</span>
                <p className="font-medium">{formatDateDisplay(documentDate)}</p>
              </div>
            </div>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Abrindo editor...' : 'Criar e abrir editor'}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={handlePrev} disabled={step === 1}>
          &lt; Anterior
        </Button>
        {step < 2 ? (
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleNext}>
            Próxima &gt;
          </Button>
        ) : null}
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
        Acessibilidade: Use Tab para navegar entre campos. Enter para confirmar. Todos os campos
        obrigatórios estão marcados com *.
      </div>
    </div>
  );
}

export default function NewDocumentWizardPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <NewDocumentWizardContent />
    </Suspense>
  );
}
