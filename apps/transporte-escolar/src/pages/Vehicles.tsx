import { useState } from 'react';
import { Plus, Bus, Edit, Trash2, Phone, User } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';
import { useTransportVehicles, useUpdateTransportVehicle } from '../hooks/useTransportVehicles';
import { useUserProfile } from '../hooks/useUserProfile';
import type { SchoolTransport } from '../types';
import { VehicleForm } from '../components/VehicleForm';
import { toast } from 'sonner';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  onibus: 'Ônibus',
  van: 'Van',
  microonibus: 'Microônibus',
  outro: 'Outro',
};

export default function Vehicles() {
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<SchoolTransport | null>(null);

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useTransportVehicles({
    tenantId: userProfile?.tenant_id,
    schoolId: userProfile?.school_id || undefined,
    activeOnly: false,
  });
  const updateVehicle = useUpdateTransportVehicle();

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Tem certeza que deseja desativar este veículo?')) return;

    updateVehicle.mutate(
      { vehicleId, updates: { is_active: false } },
      {
        onSuccess: () => {
          toast.success('Veículo desativado com sucesso');
        },
      }
    );
  };

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: userProfile.tenant?.network_name,
    school_name: userProfile.school?.school_name,
  } : undefined;

  const loading = profileLoading || vehiclesLoading;

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
            <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie a frota de veículos escolares
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedVehicle(null);
              setVehicleFormOpen(true);
            }}
            aria-label="Criar novo veículo"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Novo Veículo
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando veículos...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <Card role="region" aria-label="Lista de veículos vazia">
            <CardContent className="py-12 text-center">
              <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">
                Nenhum veículo cadastrado ainda
              </p>
              <Button
                onClick={() => {
                  setSelectedVehicle(null);
                  setVehicleFormOpen(true);
                }}
                aria-label="Cadastrar primeiro veículo"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Cadastrar Primeiro Veículo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="Lista de veículos"
          >
            {vehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className="hover:shadow-lg transition-shadow"
                role="listitem"
                aria-label={`Veículo ${vehicle.license_plate} - ${VEHICLE_TYPE_LABELS[vehicle.vehicle_type] || vehicle.vehicle_type}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{vehicle.license_plate}</CardTitle>
                      <Badge
                        className={`mt-2 ${vehicle.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                        aria-label={vehicle.is_active ? 'Veículo ativo' : 'Veículo inativo'}
                      >
                        {VEHICLE_TYPE_LABELS[vehicle.vehicle_type] || vehicle.vehicle_type}
                      </Badge>
                    </div>
                    <div className="flex gap-2" role="group" aria-label="Ações do veículo">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setVehicleFormOpen(true);
                        }}
                        aria-label={`Editar veículo ${vehicle.license_plate}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(vehicle.id)}
                        aria-label={`Desativar veículo ${vehicle.license_plate}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        <span className="sr-only">Desativar</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {vehicle.vehicle_model && (
                      <p className="text-muted-foreground">
                        <strong>Modelo:</strong> {vehicle.vehicle_model}
                        {vehicle.vehicle_year && ` (${vehicle.vehicle_year})`}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      <strong>Capacidade:</strong> {vehicle.capacity} passageiros
                    </p>
                    {vehicle.driver_name && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" aria-hidden="true" />
                          <span>{vehicle.driver_name}</span>
                        </div>
                        {vehicle.driver_phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" aria-hidden="true" />
                            <span>{vehicle.driver_phone}</span>
                          </div>
                        )}
                        {vehicle.driver_license && (
                          <p className="text-muted-foreground text-xs">
                            CNH: {vehicle.driver_license}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <VehicleForm
          open={vehicleFormOpen}
          onOpenChange={setVehicleFormOpen}
          vehicle={selectedVehicle}
          schoolId={userProfile?.school_id || ''}
          tenantId={userProfile?.tenant_id || ''}
          onSuccess={() => {
            setSelectedVehicle(null);
          }}
        />
      </div>
    </div>
  );
}
