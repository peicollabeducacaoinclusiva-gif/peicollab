import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Bus, Route, Plus, Edit, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';

interface Vehicle {
  id: string;
  vehicle_type: string;
  license_plate: string;
  capacity: number;
  driver_name: string;
  is_active: boolean;
}

interface TransportRoute {
  id: string;
  route_name: string;
  route_code: string;
  stops: any[];
  vehicle_id: string;
  vehicle_license_plate: string;
  student_count: number;
  is_active: boolean;
}

export default function Transport() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createVehicleOpen, setCreateVehicleOpen] = useState(false);
  const [_createRouteOpen, _setCreateRouteOpen] = useState(false);
  const [_editingVehicle, _setEditingVehicle] = useState<Vehicle | null>(null);
  const [_editingRoute, _setEditingRoute] = useState<TransportRoute | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
        await loadData(profile.school_id);
      }
    } catch (error: any) {
      console.error('Erro ao inicializar:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function loadData(school_id: string) {
    try {
      // Carregar veículos
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('school_transport')
        .select('*')
        .eq('school_id', school_id)
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // Carregar rotas
      const { data: routesData, error: routesError } = await supabase.rpc('get_transport_routes', {
        p_school_id: school_id,
        p_is_active: true,
      });

      if (routesError) throw routesError;
      setRoutes(routesData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  async function handleCreateVehicle(formData: any) {
    if (!schoolId) return;

    try {
      const { error } = await supabase.rpc('create_school_transport', {
        p_school_id: schoolId,
        p_tenant_id: null, // Buscar do profile
        p_vehicle_type: formData.vehicle_type,
        p_license_plate: formData.license_plate,
        p_capacity: parseInt(formData.capacity),
        p_vehicle_model: formData.vehicle_model || null,
        p_vehicle_year: formData.vehicle_year ? parseInt(formData.vehicle_year) : null,
        p_driver_name: formData.driver_name || null,
        p_driver_license: formData.driver_license || null,
        p_driver_phone: formData.driver_phone || null,
      });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Veículo criado com sucesso' });
      setCreateVehicleOpen(false);
      await loadData(schoolId);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  async function _handleCreateRoute(_formData: any) {
    if (!schoolId) return;

    try {
      const { error } = await supabase.rpc('create_transport_route', {
        p_school_id: schoolId,
        p_route_name: formData.route_name,
        p_route_code: formData.route_code || null,
        p_stops: formData.stops ? JSON.parse(formData.stops) : [],
        p_morning_departure_time: formData.morning_departure_time || null,
        p_morning_arrival_time: formData.morning_arrival_time || null,
        p_afternoon_departure_time: formData.afternoon_departure_time || null,
        p_afternoon_arrival_time: formData.afternoon_arrival_time || null,
        p_vehicle_id: formData.vehicle_id || null,
      });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Rota criada com sucesso' });
      setCreateRouteOpen(false);
      await loadData(schoolId);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  async function exportCSV() {
    try {
      const csv = [
        ['Tipo', 'Placa', 'Capacidade', 'Motorista', 'Status'].join(','),
        ...vehicles.map(v => [
          v.vehicle_type,
          v.license_plate,
          v.capacity,
          v.driver_name || '',
          v.is_active ? 'Ativo' : 'Inativo',
        ].join(','))
      ].join('\n');

      const filename = `transporte_veiculos_${formatTimestampForFilename()}.csv`;
      downloadTextFile(csv, filename);
      toast({ title: 'Sucesso', description: 'Dados exportados com sucesso' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Transporte Escolar" icon={<Bus className="h-6 w-6 text-primary" />} />

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="vehicles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vehicles">
              <Bus className="h-4 w-4 mr-2" />
              Veículos
            </TabsTrigger>
            <TabsTrigger value="routes">
              <Route className="h-4 w-4 mr-2" />
              Rotas
            </TabsTrigger>
          </TabsList>

          {/* Veículos */}
          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Veículos</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button onClick={() => setCreateVehicleOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Veículo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum veículo cadastrado
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map(vehicle => (
                      <Card key={vehicle.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{vehicle.license_plate}</CardTitle>
                              <p className="text-sm text-muted-foreground">{vehicle.vehicle_type}</p>
                            </div>
                            <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
                              {vehicle.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm"><strong>Capacidade:</strong> {vehicle.capacity} lugares</p>
                            {vehicle.driver_name && (
                              <p className="text-sm"><strong>Motorista:</strong> {vehicle.driver_name}</p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingVehicle(vehicle)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rotas */}
          <TabsContent value="routes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rotas</CardTitle>
                  <Button onClick={() => setCreateRouteOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Rota
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {routes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma rota cadastrada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {routes.map(route => (
                      <Card key={route.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{route.route_name}</CardTitle>
                              {route.route_code && (
                                <p className="text-sm text-muted-foreground">Código: {route.route_code}</p>
                              )}
                            </div>
                            <Badge variant={route.is_active ? 'default' : 'secondary'}>
                              {route.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Veículo</p>
                              <p className="text-sm font-medium">{route.vehicle_license_plate || 'Não atribuído'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Alunos</p>
                              <p className="text-sm font-medium">{route.student_count || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Paradas</p>
                              <p className="text-sm font-medium">{route.stops?.length || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Criar Veículo */}
        <Dialog open={createVehicleOpen} onOpenChange={setCreateVehicleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Veículo</DialogTitle>
              <DialogDescription>Cadastre um novo veículo de transporte escolar</DialogDescription>
            </DialogHeader>
            <VehicleForm onSubmit={handleCreateVehicle} onCancel={() => setCreateVehicleOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function VehicleForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    vehicle_type: 'onibus',
    license_plate: '',
    capacity: '',
    vehicle_model: '',
    vehicle_year: '',
    driver_name: '',
    driver_license: '',
    driver_phone: '',
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
        <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}>
          <SelectTrigger id="vehicle_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="onibus">Ônibus</SelectItem>
            <SelectItem value="van">Van</SelectItem>
            <SelectItem value="microonibus">Microônibus</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="license_plate">Placa</Label>
        <Input
          id="license_plate"
          value={formData.license_plate}
          onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
          required
        />
      </div>

      <div>
        <Label htmlFor="capacity">Capacidade</Label>
        <Input
          id="capacity"
          type="number"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="driver_name">Nome do Motorista</Label>
        <Input
          id="driver_name"
          value={formData.driver_name}
          onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Salvar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

