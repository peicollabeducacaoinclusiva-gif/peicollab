// ============================================================================
// COMPONENTE: GradesEntry
// ============================================================================
// Lançamento de notas por disciplina e período
// Gestão Escolar - Fase 7
// ============================================================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';

// Schema de validação
const gradeSchema = z.object({
  nota_valor: z.number().min(0).max(10).optional(),
  nota_conceito: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
  observacoes: z.string().optional(),
}).refine(data => data.nota_valor !== undefined || data.nota_conceito !== undefined, {
  message: 'Informe nota numérica ou conceito',
});

interface GradeRecord {
  student_id: string;
  student_name: string;
  enrollment_id: string;
  nota_valor?: number;
  nota_conceito?: string;
  observacoes?: string;
  grade_id?: string;
}

interface GradesEntryProps {
  classId: string;
  subjectId: string;
  periodo: string;
  tipo_avaliacao: string;
}

const periodos = [
  { value: '1', label: '1º Bimestre' },
  { value: '2', label: '2º Bimestre' },
  { value: '3', label: '3º Bimestre' },
  { value: '4', label: '4º Bimestre' },
  { value: 'final', label: 'Final' },
  { value: 'recuperacao', label: 'Recuperação' },
];

const tiposAvaliacao = [
  { value: 'prova', label: 'Prova' },
  { value: 'trabalho', label: 'Trabalho' },
  { value: 'participacao', label: 'Participação' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'seminario', label: 'Seminário' },
  { value: 'outro', label: 'Outro' },
];

export function GradesEntry({
  classId,
  subjectId,
  periodo,
  tipo_avaliacao,
}: GradesEntryProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usaConceito, setUsaConceito] = useState(false);
  const [peso, setPeso] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, [classId]);

  useEffect(() => {
    if (students.length > 0) {
      loadGrades();
    }
  }, [students, subjectId, periodo, tipo_avaliacao]);

  const loadStudents = async () => {
    try {
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          students (
            id,
            name,
            codigo_identificador
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'Matriculado')
        .order('students(name)');

      if (error) throw error;

      const studentsList = enrollments?.map((e: any) => ({
        enrollment_id: e.id,
        student_id: e.student_id,
        name: e.students.name,
        codigo_identificador: e.students.codigo_identificador,
      })) || [];

      setStudents(studentsList);

      // Inicializar registros de notas
      setGradeRecords(
        studentsList.map((s: any) => ({
          student_id: s.student_id,
          student_name: s.name,
          enrollment_id: s.enrollment_id,
          nota_valor: undefined,
          nota_conceito: undefined,
          observacoes: '',
        }))
      );
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast({
        title: 'Erro ao carregar alunos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('periodo', periodo)
        .eq('tipo_avaliacao', tipo_avaliacao);

      if (error) throw error;

      if (data && data.length > 0) {
        const updatedRecords = gradeRecords.map((record) => {
          const existing = data.find((g) => g.enrollment_id === record.enrollment_id);
          if (existing) {
            return {
              ...record,
              nota_valor: existing.nota_valor,
              nota_conceito: existing.nota_conceito,
              observacoes: existing.observacoes || '',
              grade_id: existing.id,
            };
          }
          return record;
        });
        setGradeRecords(updatedRecords);
        
        // Detectar se usa conceito
        if (data[0]?.nota_conceito) {
          setUsaConceito(true);
        }
        
        // Pegar peso existente
        if (data[0]?.peso) {
          setPeso(data[0].peso);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar notas:', error);
    }
  };

  const updateNotaValor = (studentId: string, valor: string) => {
    const nota = valor === '' ? undefined : parseFloat(valor);
    setGradeRecords((prev) =>
      prev.map((record) =>
        record.student_id === studentId
          ? { ...record, nota_valor: nota }
          : record
      )
    );
  };

  const updateNotaConceito = (studentId: string, conceito: string) => {
    setGradeRecords((prev) =>
      prev.map((record) =>
        record.student_id === studentId
          ? { ...record, nota_conceito: conceito }
          : record
      )
    );
  };

  const updateObservacao = (studentId: string, obs: string) => {
    setGradeRecords((prev) =>
      prev.map((record) =>
        record.student_id === studentId
          ? { ...record, observacoes: obs }
          : record
      )
    );
  };

  const getStatusNota = (nota?: number) => {
    if (nota === undefined) return null;
    if (nota >= 7) return { color: 'text-green-600', icon: <TrendingUp className="h-4 w-4" /> };
    if (nota >= 6) return { color: 'text-blue-600', icon: <Award className="h-4 w-4" /> };
    if (nota >= 5) return { color: 'text-yellow-600', icon: <AlertCircle className="h-4 w-4" /> };
    return { color: 'text-red-600', icon: <TrendingDown className="h-4 w-4" /> };
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const gradesData = gradeRecords
        .filter((record) => record.nota_valor !== undefined || record.nota_conceito !== undefined)
        .map((record) => ({
          enrollment_id: record.enrollment_id,
          subject_id: subjectId,
          periodo,
          tipo_avaliacao,
          nota_valor: record.nota_valor || null,
          nota_conceito: record.nota_conceito || null,
          observacoes: record.observacoes || null,
          peso,
          lancado_por: (window as any).currentUserId, // ID do usuário logado
        }));

      if (gradesData.length === 0) {
        toast({
          title: 'Nenhuma nota para salvar',
          description: 'Lance pelo menos uma nota antes de salvar',
          variant: 'destructive',
        });
        return;
      }

      // Usar upsert para inserir ou atualizar
      const { error } = await supabase
        .from('grades')
        .upsert(gradesData, {
          onConflict: 'enrollment_id,subject_id,periodo,tipo_avaliacao',
        });

      if (error) throw error;

      toast({
        title: '✅ Notas salvas!',
        description: `${gradesData.length} nota(s) lançada(s) com sucesso`,
      });

      // Recarregar notas
      await loadGrades();
    } catch (error: any) {
      console.error('Erro ao salvar notas:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const mediaGeral = gradeRecords.length > 0
    ? gradeRecords.reduce((sum, r) => sum + (r.nota_valor || 0), 0) / gradeRecords.filter(r => r.nota_valor !== undefined).length
    : 0;

  const aprovados = gradeRecords.filter((r) => (r.nota_valor || 0) >= 6).length;
  const recuperacao = gradeRecords.filter((r) => (r.nota_valor || 0) >= 5 && (r.nota_valor || 0) < 6).length;
  const reprovados = gradeRecords.filter((r) => r.nota_valor !== undefined && (r.nota_valor || 0) < 5).length;

  if (loading) {
    return <div className="text-center py-8">Carregando diário de notas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Lançamento de Notas</h3>
          <p className="text-sm text-gray-600">
            {periodos.find(p => p.value === periodo)?.label} - {tiposAvaliacao.find(t => t.value === tipo_avaliacao)?.label}
          </p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="peso">Peso:</Label>
            <Input
              id="peso"
              type="number"
              min="0.5"
              max="5"
              step="0.5"
              value={peso}
              onChange={(e) => setPeso(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="tipo">Tipo:</Label>
            <Select value={usaConceito ? 'conceito' : 'nota'} onValueChange={(v) => setUsaConceito(v === 'conceito')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nota">Nota (0-10)</SelectItem>
                <SelectItem value="conceito">Conceito (A-E)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-blue-50">
          <p className="text-sm text-gray-600">Média Geral</p>
          <p className="text-3xl font-bold text-blue-600">
            {mediaGeral.toFixed(1)}
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <p className="text-sm text-gray-600">Aprovados (≥6)</p>
          <p className="text-3xl font-bold text-green-600">{aprovados}</p>
        </div>
        <div className="border rounded-lg p-4 bg-yellow-50">
          <p className="text-sm text-gray-600">Recuperação (5-6)</p>
          <p className="text-3xl font-bold text-yellow-600">{recuperacao}</p>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <p className="text-sm text-gray-600">Reprovados (&lt;5)</p>
          <p className="text-3xl font-bold text-red-600">{reprovados}</p>
        </div>
      </div>

      {/* Tabela de notas */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead className="w-32 text-center">
                {usaConceito ? 'Conceito' : 'Nota'}
              </TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gradeRecords.map((record, index) => {
              const status = getStatusNota(record.nota_valor);
              
              return (
                <TableRow key={record.student_id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.student_name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {usaConceito ? (
                      <Select
                        value={record.nota_conceito}
                        onValueChange={(value) => updateNotaConceito(record.student_id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A (Excelente)</SelectItem>
                          <SelectItem value="B">B (Bom)</SelectItem>
                          <SelectItem value="C">C (Regular)</SelectItem>
                          <SelectItem value="D">D (Insuficiente)</SelectItem>
                          <SelectItem value="E">E (Muito Insuficiente)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={record.nota_valor ?? ''}
                        onChange={(e) => updateNotaValor(record.student_id, e.target.value)}
                        className="text-center text-lg font-bold"
                        placeholder="-"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Observações..."
                      value={record.observacoes || ''}
                      onChange={(e) => updateObservacao(record.student_id, e.target.value)}
                      className="text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    {status && (
                      <div className={`flex items-center gap-1 ${status.color}`}>
                        {status.icon}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Ação de salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Notas'}
        </Button>
      </div>
    </div>
  );
}

