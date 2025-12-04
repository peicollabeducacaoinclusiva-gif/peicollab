import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Label } from '@pei/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pei/ui';
import { transportService } from '../services/transportService';
import { toast } from 'sonner';
import type { StudentTransport } from '../types';
import { supabase } from '@pei/database';
import { format } from 'date-fns';

interface StudentAssignmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: StudentTransport | null;
  schoolId: string;
  tenantId: string;
  academicYear: number;
  onSuccess?: () => void;
}

export function StudentAssignmentForm({ open, onOpenChange, assignment, schoolId, tenantId, academicYear, onSuccess }: StudentAssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [routes, setRoutes] = useState<Array<{ id: string; route_name: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [boardingStop, setBoardingStop] = useState('');
  const [disembarkationStop, setDisembarkationStop] = useState('');
  const [shift, setShift] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (open) {
      loadStudents();
      loadRoutes();
    }
  }, [open, schoolId, tenantId]);

  useEffect(() => {
    if (assignment) {
      setSelectedStudentId(assignment.student_id);
      setSelectedRouteId(assignment.route_id);
      setBoardingStop(assignment.boarding_stop || '');
      setDisembarkationStop(assignment.disembarkation_stop || '');
      setShift(assignment.shift || '');
      setStartDate(assignment.start_date || format(new Date(), 'yyyy-MM-dd'));
    } else {
      setSelectedStudentId('');
      setSelectedRouteId('');
      setBoardingStop('');
      setDisembarkationStop('');
      setShift('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [assignment, open]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar lista de alunos');
    }
  };

  const loadRoutes = async () => {
    try {
      const data = await transportService.getRoutes(schoolId, true);
      setRoutes(data.map(r => ({ id: r.id, route_name: r.route_name })));
    } catch (error: any) {
      console.error('Erro ao carregar rotas:', error);
      toast.error('Erro ao carregar lista de rotas');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId || !selectedRouteId) {
      toast.error('Selecione aluno e rota');
      return;
    }

    setLoading(true);
    try {
      if (assignment) {
        await transportService.updateStudentAssignment(assignment.id, {
          student_id: selectedStudentId,
          route_id: selectedRouteId,
          academic_year: academicYear,
          boarding_stop: boardingStop || undefined,
          disembarkation_stop: disembarkationStop || undefined,
          shift: shift as any || undefined,
          start_date: startDate,
        });
        toast.success('Vínculo atualizado com sucesso');
      } else {
        await transportService.assignStudentToRoute({
          studentId: selectedStudentId,
          routeId: selectedRouteId,
          academicYear,
          boardingStop: boardingStop || undefined,
          disembarkationStop: disembarkationStop || undefined,
          shift: shift || undefined,
          startDate,
        });
        toast.success('Aluno vinculado à rota com sucesso');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar vínculo:', error);
      toast.error(error.message || 'Erro ao salvar vínculo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{assignment ? 'Editar Vínculo' : 'Novo Vínculo Aluno-Rota'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student">Aluno *</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="route">Rota *</Label>
              <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                <SelectTrigger id="route">
                  <SelectValue placeholder="Selecione uma rota" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.route_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="boardingStop">Parada de Embarque</Label>
              <Input
                id="boardingStop"
                value={boardingStop}
                onChange={(e) => setBoardingStop(e.target.value)}
                placeholder="Nome da parada de embarque"
              />
            </div>

            <div>
              <Label htmlFor="disembarkationStop">Parada de Desembarque</Label>
              <Input
                id="disembarkationStop"
                value={disembarkationStop}
                onChange={(e) => setDisembarkationStop(e.target.value)}
                placeholder="Nome da parada de desembarque"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shift">Turno</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger id="shift">
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manha">Manhã</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
                  <SelectItem value="integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : assignment ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

