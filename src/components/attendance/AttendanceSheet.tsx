// ============================================================================
// COMPONENTE: AttendanceSheet
// ============================================================================
// Diário de classe com suporte offline (PWA)
// Gestão Escolar - Fase 6
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { 
  Save, 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  codigo_identificador?: string;
  presenca: boolean;
  justificativa?: string;
  observacao?: string;
}

interface AttendanceSheetProps {
  classId: string;
  date: string;
  subjectId?: string;
}

export function AttendanceSheet({ classId, date, subjectId }: AttendanceSheetProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  // Carregar alunos da turma
  useEffect(() => {
    loadStudents();
  }, [classId]);

  // Carregar registros de frequência existentes
  useEffect(() => {
    if (students.length > 0) {
      loadAttendanceRecords();
    }
  }, [students, date, subjectId]);

  // Auto-save quando offline
  useEffect(() => {
    if (pendingChanges && !isOnline) {
      saveToLocalStorage();
    }
  }, [pendingChanges, attendanceRecords]);

  // Sincronizar quando voltar online
  useEffect(() => {
    if (isOnline && hasLocalData()) {
      syncFromLocalStorage();
    }
  }, [isOnline]);

  const loadStudents = async () => {
    try {
      // Buscar alunos matriculados na turma
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
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
        id: e.student_id,
        name: e.students.name,
        codigo_identificador: e.students.codigo_identificador,
      })) || [];

      setStudents(studentsList);

      // Inicializar registros de presença
      setAttendanceRecords(
        studentsList.map((s: any) => ({
          student_id: s.id,
          student_name: s.name,
          codigo_identificador: s.codigo_identificador,
          presenca: true, // Default: presente
          justificativa: '',
          observacao: '',
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

  const loadAttendanceRecords = async () => {
    try {
      const query = supabase
        .from('attendance')
        .select('*')
        .eq('class_id', classId)
        .eq('data', date);

      if (subjectId) {
        query.eq('subject_id', subjectId);
      } else {
        query.is('subject_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Se há registros existentes, atualizar o estado
      if (data && data.length > 0) {
        const updatedRecords = attendanceRecords.map((record) => {
          const existing = data.find((d) => d.student_id === record.student_id);
          if (existing) {
            return {
              ...record,
              presenca: existing.presenca,
              justificativa: existing.justificativa || '',
              observacao: existing.observacao || '',
            };
          }
          return record;
        });
        setAttendanceRecords(updatedRecords);
        setLastSaved(new Date());
      }
    } catch (error: any) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const togglePresenca = (studentId: string) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.student_id === studentId
          ? { ...record, presenca: !record.presenca }
          : record
      )
    );
    setPendingChanges(true);
  };

  const updateJustificativa = (studentId: string, justificativa: string) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.student_id === studentId ? { ...record, justificativa } : record
      )
    );
    setPendingChanges(true);
  };

  const updateObservacao = (studentId: string, observacao: string) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.student_id === studentId ? { ...record, observacao } : record
      )
    );
    setPendingChanges(true);
  };

  const marcarTodosPresentes = () => {
    setAttendanceRecords((prev) =>
      prev.map((record) => ({ ...record, presenca: true }))
    );
    setPendingChanges(true);
  };

  const marcarTodosFaltosos = () => {
    setAttendanceRecords((prev) =>
      prev.map((record) => ({ ...record, presenca: false }))
    );
    setPendingChanges(true);
  };

  const saveToLocalStorage = () => {
    const key = `attendance_${classId}_${date}_${subjectId || 'geral'}`;
    localStorage.setItem(key, JSON.stringify(attendanceRecords));
    toast({
      title: '💾 Salvo localmente',
      description: 'Os dados foram salvos no seu dispositivo',
    });
  };

  const hasLocalData = (): boolean => {
    const key = `attendance_${classId}_${date}_${subjectId || 'geral'}`;
    return localStorage.getItem(key) !== null;
  };

  const syncFromLocalStorage = async () => {
    const key = `attendance_${classId}_${date}_${subjectId || 'geral'}`;
    const localData = localStorage.getItem(key);

    if (!localData) return;

    try {
      const records: AttendanceRecord[] = JSON.parse(localData);
      setAttendanceRecords(records);
      
      toast({
        title: '🔄 Sincronizando dados locais...',
        description: 'Enviando dados salvos offline',
      });

      await saveToDatabase(records);
      localStorage.removeItem(key);
      
      toast({
        title: '✅ Sincronizado!',
        description: 'Dados offline foram enviados com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error);
      toast({
        title: 'Erro ao sincronizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const saveToDatabase = async (records?: AttendanceRecord[]) => {
    setSaving(true);
    const recordsToSave = records || attendanceRecords;

    try {
      // Preparar dados para inserção/atualização
      const attendanceData = recordsToSave.map((record) => ({
        class_id: classId,
        student_id: record.student_id,
        subject_id: subjectId || null,
        data: date,
        presenca: record.presenca,
        justificativa: record.justificativa || null,
        observacao: record.observacao || null,
        tenant_id: (students[0] as any)?.tenant_id, // Assumir tenant_id do primeiro aluno
      }));

      // Usar upsert para inserir ou atualizar
      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceData, {
          onConflict: 'student_id,data,class_id', // Unique constraint
        });

      if (error) throw error;

      setLastSaved(new Date());
      setPendingChanges(false);

      toast({
        title: '✅ Frequência salva!',
        description: 'Os registros foram salvos com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      
      if (!isOnline) {
        saveToLocalStorage();
      } else {
        toast({
          title: 'Erro ao salvar',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (isOnline) {
      saveToDatabase();
    } else {
      saveToLocalStorage();
    }
  };

  const presentes = attendanceRecords.filter((r) => r.presenca).length;
  const ausentes = attendanceRecords.filter((r) => !r.presenca).length;
  const percentualPresenca = students.length > 0
    ? ((presentes / students.length) * 100).toFixed(1)
    : '0';

  if (loading) {
    return <div className="text-center py-8">Carregando diário de classe...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com status */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Diário de Frequência</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(date).toLocaleDateString('pt-BR')}
            </span>
            {lastSaved && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Salvo às {lastSaved.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status de conexão */}
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>

          {pendingChanges && (
            <Badge variant="outline" className="text-yellow-600">
              Alterações não salvas
            </Badge>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-blue-50">
          <p className="text-sm text-gray-600">Total de Alunos</p>
          <p className="text-3xl font-bold text-blue-600">{students.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <p className="text-sm text-gray-600">Presentes</p>
          <p className="text-3xl font-bold text-green-600">{presentes}</p>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <p className="text-sm text-gray-600">Ausentes</p>
          <p className="text-3xl font-bold text-red-600">{ausentes}</p>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={marcarTodosPresentes}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Marcar Todos Presentes
        </Button>
        <Button variant="outline" size="sm" onClick={marcarTodosFaltosos}>
          <XCircle className="h-4 w-4 mr-2" />
          Marcar Todos Ausentes
        </Button>
      </div>

      {/* Tabela de frequência */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead className="w-32 text-center">Presença</TableHead>
              <TableHead>Justificativa (se ausente)</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceRecords.map((record, index) => (
              <TableRow key={record.student_id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{record.student_name}</p>
                    {record.codigo_identificador && (
                      <p className="text-xs text-gray-500">
                        {record.codigo_identificador}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => togglePresenca(record.student_id)}
                    className={`inline-flex items-center justify-center w-24 px-3 py-2 rounded-md font-semibold transition-colors ${
                      record.presenca
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {record.presenca ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        P
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        F
                      </>
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  {!record.presenca && (
                    <Input
                      placeholder="Justificativa..."
                      value={record.justificativa || ''}
                      onChange={(e) =>
                        updateJustificativa(record.student_id, e.target.value)
                      }
                      className="text-sm"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Observações..."
                    value={record.observacao || ''}
                    onChange={(e) =>
                      updateObservacao(record.student_id, e.target.value)
                    }
                    className="text-sm"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Resumo e ação de salvar */}
      <div className="flex justify-between items-center border-t pt-6">
        <div className="text-sm text-gray-600">
          <p>
            Taxa de presença: <strong className="text-lg">{percentualPresenca}%</strong>
          </p>
          <p>
            {presentes} presente{presentes !== 1 ? 's' : ''} de {students.length} aluno
            {students.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || !pendingChanges}
          size="lg"
          className="min-w-[200px]"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isOnline ? 'Salvar Frequência' : 'Salvar Localmente'}
            </>
          )}
        </Button>
      </div>

      {/* Aviso offline */}
      {!isOnline && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start">
            <WifiOff className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800">Modo Offline</p>
              <p className="text-yellow-700">
                Você está sem conexão. Os dados serão salvos localmente e sincronizados
                automaticamente quando você reconectar.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






























