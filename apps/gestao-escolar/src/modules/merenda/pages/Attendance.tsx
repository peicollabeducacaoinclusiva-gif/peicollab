import { useState } from 'react';
import { Plus, Users, CheckCircle2, XCircle } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';
import { AccessibleTable, AccessibleSelect } from '@pei/ui';
import { useMealAttendance } from '../hooks/useMealAttendance';
import { useUserProfile } from '../hooks/useUserProfile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttendanceForm } from '../components/AttendanceForm';

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
};

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [filterMealType, setFilterMealType] = useState<string>('');
  const [attendanceFormOpen, setAttendanceFormOpen] = useState(false);

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: attendance = [], isLoading: attendanceLoading } = useMealAttendance({
    schoolId: userProfile?.school_id || undefined,
    startDate: selectedDate,
    endDate: selectedDate,
    mealType: filterMealType || undefined,
  });

  const consumedCount = attendance.filter(a => a.consumed).length;
  const totalCount = attendance.length;
  const attendanceRate = totalCount > 0 ? Math.round((consumedCount / totalCount) * 100) : 0;

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

  const tableData = attendance.map((record) => ({
    student: (record as any).student?.name || 'N/A',
    mealType: MEAL_TYPE_LABELS[record.meal_type] || record.meal_type,
    status: record.consumed ? (
      <Badge className="bg-green-500 text-white">
        <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
        Consumido
      </Badge>
    ) : (
      <Badge className="bg-red-500 text-white">
        <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
        Não Consumido
      </Badge>
    ),
    quantity: record.quantity_served || '-',
    observations: record.observations || '-',
  }));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Merenda Escolar"
        appLogo="/logo.png"
        currentApp="merenda-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Controle de Consumo</h1>
            <p className="text-muted-foreground mt-1">
              Registre e acompanhe o consumo de refeições
            </p>
          </div>
          <Button
            onClick={() => setAttendanceFormOpen(true)}
            aria-label="Registrar novo consumo"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Registrar Consumo
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
                aria-label="Data para visualizar consumo"
              />
            </CardContent>
          </Card>

          <Card role="region" aria-label="Filtro de tipo de refeição">
            <CardHeader>
              <CardTitle className="text-base">Tipo de Refeição</CardTitle>
            </CardHeader>
            <CardContent>
              <AccessibleSelect
                label=""
                value={filterMealType}
                onValueChange={setFilterMealType}
                options={[
                  { value: '', label: 'Todos' },
                  ...Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
                aria-label="Filtrar por tipo de refeição"
              />
            </CardContent>
          </Card>

          <Card role="region" aria-label="Taxa de comparecimento">
            <CardHeader>
              <CardTitle className="text-base">Taxa de Comparecimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" aria-live="polite">
                {attendanceRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {consumedCount} de {totalCount} refeições
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Consumo */}
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando consumo...</p>
          </div>
        ) : attendance.length === 0 ? (
          <Card role="region" aria-label="Lista de consumo vazia">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">
                Nenhum registro de consumo para esta data
              </p>
              <Button
                onClick={() => setAttendanceFormOpen(true)}
                aria-label="Registrar primeiro consumo"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Registrar Primeiro Consumo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card role="region" aria-label="Registros de consumo">
            <CardHeader>
              <CardTitle>
                Registros de Consumo - {format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AccessibleTable
                columns={[
                  { key: 'student', label: 'Aluno', 'aria-label': 'Nome do aluno' },
                  { key: 'mealType', label: 'Tipo', 'aria-label': 'Tipo de refeição' },
                  { key: 'status', label: 'Status', 'aria-label': 'Status do consumo' },
                  { key: 'quantity', label: 'Quantidade', 'aria-label': 'Quantidade servida' },
                  { key: 'observations', label: 'Observações', 'aria-label': 'Observações' },
                ]}
                data={tableData}
                aria-label="Tabela de registros de consumo de refeições"
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
