import { useState } from 'react';
import { Plus, Route, Edit, Trash2, Clock, MapPin, Users } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';
import { useTransportRoutes, useUpdateTransportRoute } from '../hooks/useTransportRoutes';
import { useUserProfile } from '../hooks/useUserProfile';
import type { TransportRoute } from '../types';
import { RouteForm } from '../components/RouteForm';
import { toast } from 'sonner';

export default function Routes() {
  const [routeFormOpen, setRouteFormOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: routes = [], isLoading: routesLoading } = useTransportRoutes(
    userProfile?.school_id || '',
    false
  );
  const updateRoute = useUpdateTransportRoute();

  const handleDelete = async (routeId: string) => {
    if (!confirm('Tem certeza que deseja desativar esta rota?')) return;

    updateRoute.mutate(
      { routeId, updates: { is_active: false } },
      {
        onSuccess: () => {
          toast.success('Rota desativada com sucesso');
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

  const loading = profileLoading || routesLoading;

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
            <h1 className="text-3xl font-bold text-foreground">Rotas de Transporte</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as rotas de transporte escolar
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedRoute(null);
              setRouteFormOpen(true);
            }}
            aria-label="Criar nova rota"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Nova Rota
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando rotas...</p>
          </div>
        ) : routes.length === 0 ? (
          <Card role="region" aria-label="Lista de rotas vazia">
            <CardContent className="py-12 text-center">
              <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">
                Nenhuma rota cadastrada ainda
              </p>
              <Button
                onClick={() => {
                  setSelectedRoute(null);
                  setRouteFormOpen(true);
                }}
                aria-label="Criar primeira rota"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Criar Primeira Rota
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="Lista de rotas"
          >
            {routes.map((route) => (
              <Card
                key={route.id}
                className="hover:shadow-lg transition-shadow"
                role="listitem"
                aria-label={`Rota ${route.route_name}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{route.route_name}</CardTitle>
                      {route.route_code && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Código: {route.route_code}
                        </p>
                      )}
                      <Badge
                        className={`mt-2 ${route.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                        aria-label={route.is_active ? 'Rota ativa' : 'Rota inativa'}
                      >
                        {route.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="flex gap-2" role="group" aria-label="Ações da rota">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRoute(route);
                          setRouteFormOpen(true);
                        }}
                        aria-label={`Editar rota ${route.route_name}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(route.id)}
                        aria-label={`Desativar rota ${route.route_name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        <span className="sr-only">Desativar</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {route.vehicle_license_plate && (
                      <p className="text-muted-foreground">
                        <strong>Veículo:</strong> {route.vehicle_license_plate}
                      </p>
                    )}
                    {route.stops && route.stops.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        <span>{route.stops.length} parada(s)</span>
                      </div>
                    )}
                    {route.student_count !== undefined && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        <span>{route.student_count} aluno(s)</span>
                      </div>
                    )}
                    {(route.morning_departure_time || route.morning_arrival_time) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <span>
                          Manhã: {route.morning_departure_time || 'N/A'} - {route.morning_arrival_time || 'N/A'}
                        </span>
                      </div>
                    )}
                    {(route.afternoon_departure_time || route.afternoon_arrival_time) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <span>
                          Tarde: {route.afternoon_departure_time || 'N/A'} - {route.afternoon_arrival_time || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <RouteForm
          open={routeFormOpen}
          onOpenChange={setRouteFormOpen}
          route={selectedRoute}
          schoolId={userProfile?.school_id || ''}
          tenantId={userProfile?.tenant_id || ''}
          onSuccess={() => {
            setSelectedRoute(null);
          }}
        />
      </div>
    </div>
  );
}
