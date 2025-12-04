import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Label } from '@pei/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pei/ui';
import { transportService } from '../services/transportService';
import { toast } from 'sonner';
import type { TransportRoute, RouteStop } from '../types';
import { Plus, Trash2, Clock } from 'lucide-react';

interface RouteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route?: TransportRoute | null;
  schoolId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export function RouteForm({ open, onOpenChange, route, schoolId, tenantId, onSuccess }: RouteFormProps) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routeName, setRouteName] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [morningDepartureTime, setMorningDepartureTime] = useState('');
  const [morningArrivalTime, setMorningArrivalTime] = useState('');
  const [afternoonDepartureTime, setAfternoonDepartureTime] = useState('');
  const [afternoonArrivalTime, setAfternoonArrivalTime] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      loadVehicles();
    }
  }, [open, tenantId]);

  useEffect(() => {
    if (route) {
      setRouteName(route.route_name);
      setRouteCode(route.route_code || '');
      setSelectedVehicleId(route.vehicle_id || '');
      setStops(route.stops || []);
      setMorningDepartureTime(route.morning_departure_time || '');
      setMorningArrivalTime(route.morning_arrival_time || '');
      setAfternoonDepartureTime(route.afternoon_departure_time || '');
      setAfternoonArrivalTime(route.afternoon_arrival_time || '');
      setIsActive(route.is_active);
    } else {
      setRouteName('');
      setRouteCode('');
      setSelectedVehicleId('');
      setStops([]);
      setMorningDepartureTime('');
      setMorningArrivalTime('');
      setAfternoonDepartureTime('');
      setAfternoonArrivalTime('');
      setIsActive(true);
    }
  }, [route, open]);

  const loadVehicles = async () => {
    try {
      const data = await transportService.getVehicles({
        tenantId,
        schoolId,
        activeOnly: true,
      });
      setVehicles(data);
    } catch (error: any) {
      console.error('Erro ao carregar veículos:', error);
    }
  };

  const addStop = () => {
    setStops([
      ...stops,
      {
        name: '',
        address: '',
        order: stops.length + 1,
        time: '',
      },
    ]);
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index).map((stop, i) => ({ ...stop, order: i + 1 })));
  };

  const updateStop = (index: number, field: keyof RouteStop, value: any) => {
    const updated = [...stops];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setStops(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!routeName) {
      toast.error('Nome da rota é obrigatório');
      return;
    }

    setLoading(true);
    try {
      if (route) {
        await transportService.updateRoute(route.id, {
          route_name: routeName,
          route_code: routeCode || undefined,
          stops,
          morning_departure_time: morningDepartureTime || undefined,
          morning_arrival_time: morningArrivalTime || undefined,
          afternoon_departure_time: afternoonDepartureTime || undefined,
          afternoon_arrival_time: afternoonArrivalTime || undefined,
          vehicle_id: selectedVehicleId || undefined,
          is_active: isActive,
        });
        toast.success('Rota atualizada com sucesso');
      } else {
        await transportService.createRoute({
          schoolId,
          routeName,
          routeCode: routeCode || undefined,
          stops,
          morningDepartureTime: morningDepartureTime || undefined,
          morningArrivalTime: morningArrivalTime || undefined,
          afternoonDepartureTime: afternoonDepartureTime || undefined,
          afternoonArrivalTime: afternoonArrivalTime || undefined,
          vehicleId: selectedVehicleId || undefined,
        });
        toast.success('Rota criada com sucesso');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar rota:', error);
      toast.error(error.message || 'Erro ao salvar rota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{route ? 'Editar Rota' : 'Nova Rota'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="routeName">Nome da Rota *</Label>
              <Input
                id="routeName"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="routeCode">Código da Rota</Label>
              <Input
                id="routeCode"
                value={routeCode}
                onChange={(e) => setRouteCode(e.target.value)}
                placeholder="Ex: R001"
              />
            </div>

            <div>
              <Label htmlFor="vehicle">Veículo</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.vehicle_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="morningDeparture">Saída Manhã</Label>
              <Input
                id="morningDeparture"
                type="time"
                value={morningDepartureTime}
                onChange={(e) => setMorningDepartureTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="morningArrival">Chegada Manhã</Label>
              <Input
                id="morningArrival"
                type="time"
                value={morningArrivalTime}
                onChange={(e) => setMorningArrivalTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="afternoonDeparture">Saída Tarde</Label>
              <Input
                id="afternoonDeparture"
                type="time"
                value={afternoonDepartureTime}
                onChange={(e) => setAfternoonDepartureTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="afternoonArrival">Chegada Tarde</Label>
              <Input
                id="afternoonArrival"
                type="time"
                value={afternoonArrivalTime}
                onChange={(e) => setAfternoonArrivalTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Paradas da Rota</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStop}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Parada
              </Button>
            </div>

            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div key={index} className="border rounded-lg p-4 grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-1 text-sm text-muted-foreground">
                    #{stop.order}
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      value={stop.name}
                      onChange={(e) => updateStop(index, 'name', e.target.value)}
                      placeholder="Nome da parada"
                    />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs">Endereço</Label>
                    <Input
                      value={stop.address || ''}
                      onChange={(e) => updateStop(index, 'address', e.target.value)}
                      placeholder="Endereço"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Horário</Label>
                    <Input
                      type="time"
                      value={stop.time || ''}
                      onChange={(e) => updateStop(index, 'time', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStop(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {stops.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma parada adicionada</p>
                  <p className="text-sm">Clique em "Adicionar Parada" para começar</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Rota ativa
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : route ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

