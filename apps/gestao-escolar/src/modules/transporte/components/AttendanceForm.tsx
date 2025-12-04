import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Label } from '@pei/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pei/ui';
import { transportService } from '../services/transportService';
import { toast } from 'sonner';
import { supabase } from '@pei/database';
import { format } from 'date-fns';

interface AttendanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export function AttendanceForm({ open, onOpenChange, schoolId, tenantId, onSuccess }: AttendanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [routes, setRoutes] = useState<Array<{ id: string; route_name: string }>>([]);
  const [vehicles, setVehicles] = useState<Array<{ id: string; license_plate: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceTime, setAttendanceTime] = useState(format(new Date(), 'HH:mm'));
  const [attendanceType, setAttendanceType] = useState<string>('boarding');
  const [verificationMethod, setVerificationMethod] = useState<string>('manual');
  const [status, setStatus] = useState<string>('present');

  useEffect(() => {
    if (open) {
      loadStudents();
      loadRoutes();
      loadVehicles();
    }
  }, [open, schoolId, tenantId]);

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
    }
  };

  const loadVehicles = async () => {
    try {
      const data = await transportService.getVehicles({
        schoolId,
        tenantId,
        activeOnly: true,
      });
      setVehicles(data.map(v => ({ id: v.id, license_plate: v.license_plate })));
    } catch (error: any) {
      console.error('Erro ao carregar veículos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId || !selectedRouteId) {
      toast.error('Selecione aluno e rota');
      return;
    }

    if (!attendanceDate || !attendanceTime) {
      toast.error('Preencha data e horário');
      return;
    }

    setLoading(true);
    try {
      await transportService.recordAttendance({
        studentId: selectedStudentId,
        routeId: selectedRouteId,
        attendanceDate,
        attendanceTime,
        attendanceType,
        vehicleId: selectedVehicleId || undefined,
        verificationMethod,
      });
      toast.success('Acesso registrado com sucesso');
      onOpenChange(false);
      // Reset form
      setSelectedStudentId('');
      setSelectedRouteId('');
      setSelectedVehicleId('');
      setAttendanceDate(format(new Date(), 'yyyy-MM-dd'));
      setAttendanceTime(format(new Date(), 'HH:mm'));
      setAttendanceType('boarding');
      setVerificationMethod('manual');
      setStatus('present');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao registrar acesso:', error);
      toast.error(error.message || 'Erro ao registrar acesso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Acesso ao Transporte</DialogTitle>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="attendanceDate">Data *</Label>
              <Input
                id="attendanceDate"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="attendanceTime">Horário *</Label>
              <Input
                id="attendanceTime"
                type="time"
                value={attendanceTime}
                onChange={(e) => setAttendanceTime(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="attendanceType">Tipo *</Label>
              <Select value={attendanceType} onValueChange={setAttendanceType}>
                <SelectTrigger id="attendanceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boarding">Embarque</SelectItem>
                  <SelectItem value="disembarkation">Desembarque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle">Veículo</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Selecione um veículo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="verificationMethod">Método de Verificação</Label>
              <Select value={verificationMethod} onValueChange={setVerificationMethod}>
                <SelectTrigger id="verificationMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="qr_code">QR Code</SelectItem>
                  <SelectItem value="biometric">Biométrico</SelectItem>
                  <SelectItem value="rfid">RFID</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

