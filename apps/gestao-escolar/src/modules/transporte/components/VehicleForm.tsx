import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Label } from '@pei/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pei/ui';
import { transportService } from '../services/transportService';
import { toast } from 'sonner';
import type { SchoolTransport } from '../types';

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: SchoolTransport | null;
  schoolId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export function VehicleForm({ open, onOpenChange, vehicle, schoolId, tenantId, onSuccess }: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>('onibus');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number | undefined>();
  const [capacity, setCapacity] = useState<number>(40);
  const [driverName, setDriverName] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (vehicle) {
      setVehicleType(vehicle.vehicle_type);
      setLicensePlate(vehicle.license_plate);
      setVehicleModel(vehicle.vehicle_model || '');
      setVehicleYear(vehicle.vehicle_year);
      setCapacity(vehicle.capacity);
      setDriverName(vehicle.driver_name || '');
      setDriverLicense(vehicle.driver_license || '');
      setDriverPhone(vehicle.driver_phone || '');
      setIsActive(vehicle.is_active);
    } else {
      setVehicleType('onibus');
      setLicensePlate('');
      setVehicleModel('');
      setVehicleYear(undefined);
      setCapacity(40);
      setDriverName('');
      setDriverLicense('');
      setDriverPhone('');
      setIsActive(true);
    }
  }, [vehicle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licensePlate || !capacity) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      if (vehicle) {
        await transportService.updateVehicle(vehicle.id, {
          vehicle_type: vehicleType as any,
          license_plate: licensePlate,
          vehicle_model: vehicleModel || undefined,
          vehicle_year: vehicleYear,
          capacity,
          driver_name: driverName || undefined,
          driver_license: driverLicense || undefined,
          driver_phone: driverPhone || undefined,
          is_active: isActive,
        });
        toast.success('Veículo atualizado com sucesso');
      } else {
        await transportService.createVehicle({
          schoolId,
          tenantId,
          vehicleType,
          licensePlate,
          capacity,
          vehicleModel: vehicleModel || undefined,
          vehicleYear,
          driverName: driverName || undefined,
          driverLicense: driverLicense || undefined,
          driverPhone: driverPhone || undefined,
        });
        toast.success('Veículo criado com sucesso');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar veículo:', error);
      toast.error(error.message || 'Erro ao salvar veículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleType">Tipo de Veículo *</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger id="vehicleType">
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
              <Label htmlFor="licensePlate">Placa *</Label>
              <Input
                id="licensePlate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="vehicleModel">Modelo</Label>
              <Input
                id="vehicleModel"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Ex: Mercedes-Benz OF-1722"
              />
            </div>

            <div>
              <Label htmlFor="vehicleYear">Ano</Label>
              <Input
                id="vehicleYear"
                type="number"
                value={vehicleYear || ''}
                onChange={(e) => setVehicleYear(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <Label htmlFor="capacity">Capacidade *</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Dados do Motorista</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driverName">Nome do Motorista</Label>
                <Input
                  id="driverName"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label htmlFor="driverLicense">CNH</Label>
                <Input
                  id="driverLicense"
                  value={driverLicense}
                  onChange={(e) => setDriverLicense(e.target.value)}
                  placeholder="Número da CNH"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="driverPhone">Telefone</Label>
                <Input
                  id="driverPhone"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
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
              Veículo ativo
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : vehicle ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

