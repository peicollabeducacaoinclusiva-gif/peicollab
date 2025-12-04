import { useState } from 'react';
import { Plus, Users, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';
import { AccessibleTable, AccessibleSelect } from '@pei/ui';
import { useTransportAttendance } from '../hooks/useTransportAttendance';
import { useTransportRoutes } from '../hooks/useTransportRoutes';
import { useUserProfile } from '../hooks/useUserProfile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttendanceForm } from '../components/AttendanceForm';

const ATTENDANCE_TYPE_LABELS: Record<string, string> = {
  boarding: 'Embarque',
  disembarkation: 'Desembarque',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  present: { label: 'Presente', color: 'bg-green-500' },
  absent: { label: 'Ausente', color: 'bg-red-500' },
  late: { label: 'Atrasado', color: 'bg-yellow-500' },
};

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [filterRoute, setFilterRoute] = useState<string>('');
  const [attendanceFormOpen, setAttendanceFormOpen] = useState(false);

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: routes = [] } = useTransportRoutes(
    userProfile?.school_id || '',
    true
  );
  const { data: attendance = [], isLoading: attendanceLoading } = useTransportAttendance({
    routeId: filterRoute || undefined,
    startDate: selectedDate,
    endDate: selectedDate,
  });

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalCount = attendance.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: userProfile.tenant?.network_name,
    school_name: userProfile.school?.school_name,
  } : undefined;

  const loading = profileLoading || attendanceLoading;

  const tableData = attendance.map((record) => {
    const status = STATUS_LABELS[record.status] || STATUS_LABELS.present;
    return {
      student: (record as any).student?.name || 'N/A',
      route: (record as any).route?.route_name || record.route_name || 'N/A',
      type: ATTENDANCE_TYPE_LABELS[record.attendance_type] || record.attendance_type,
      time: (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {record.attendance_time}
        </div>
      ),
      status: (
        <Badge className={`${status.color} text-white`} aria-label={`Status: ${status.label}`}>
          {status.label}
        </Badge>
      ),
    };
  });

  const routeOptions = [
    { value: '', label: 'Todas as rotas' },
    ...routes.map((route) => ({
      value: route.id,
      label: route.route_name,
    })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Transporte Escolar"
        appLogo="/logo.png"
        currentApp="transporte-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Controle de Acesso</h1>
            <p className="text-muted-foreground mt-1">
              Registre e acompanhe o acesso ao transporte
            </p>
          </div>
          <Button
            onClick={() => setAttendanceFormOpen(true)}
            aria-label="Registrar novo acesso"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Registrar Acesso
          </Button>
        </div>

        {/* Filtros e Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card role="region" aria-label="Filtro de data">
            <CardHeader>
              <CardTitle className="text-base">Data</CardTitle>
            </CardHeader>
            <CardContent>
              <label htmlFor="attendance-date" className="sr-only">
                Selecione a data
              </label>
              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                aria-label="Data para visualizar acessos"
              />
            </CardContent>
          </Card>

          <Card role="region" aria-label="Filtro de rota">
            <CardHeader>
              <CardTitle className="text-base">Rota</CardTitle>
            </CardHeader>
            <CardContent>
              <AccessibleSelect
                label=""
                value={filterRoute}
                onValueChange={setFilterRoute}
                options={routeOptions}
                aria-label="Filtrar por rota"
              />
            </CardContent>
          </Card>

          <Card role="region" aria-label="Taxa de presença">
            <CardHeader>
              <CardTitle className="text-base">Taxa de Presença</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" aria-live="polite">
                {attendanceRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {presentCount} de {totalCount} registros
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Presenças */}
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando presenças...</p>
          </div>
        ) : attendance.length === 0 ? (
          <Card role="region" aria-label="Lista de acessos vazia">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">
                Nenhum registro de acesso para esta data
              </p>
              <Button
                onClick={() => setAttendanceFormOpen(true)}
                aria-label="Registrar primeiro acesso"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Registrar Primeiro Acesso
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card role="region" aria-label="Registros de acesso">
            <CardHeader>
              <CardTitle>
                Registros de Acesso - {format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AccessibleTable
                columns={[
                  { key: 'student', label: 'Aluno', 'aria-label': 'Nome do aluno' },
                  { key: 'route', label: 'Rota', 'aria-label': 'Nome da rota' },
                  { key: 'type', label: 'Tipo', 'aria-label': 'Tipo de acesso' },
                  { key: 'time', label: 'Horário', 'aria-label': 'Horário do acesso' },
                  { key: 'status', label: 'Status', 'aria-label': 'Status do acesso' },
                ]}
                data={tableData}
                aria-label="Tabela de registros de acesso ao transporte"
              />
            </CardContent>
          </Card>
        )}

        <AttendanceForm
          open={attendanceFormOpen}
          onOpenChange={setAttendanceFormOpen}
          schoolId={userProfile?.school_id || ''}
          tenantId={userProfile?.tenant_id || ''}
          onSuccess={() => {
            // React Query vai atualizar automaticamente
          }}
        />
      </div>
    </div>
  );
}
