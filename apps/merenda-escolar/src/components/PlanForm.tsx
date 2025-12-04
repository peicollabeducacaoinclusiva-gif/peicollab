import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Label } from '@pei/ui';
import { mealService } from '../services/mealService';
import { toast } from 'sonner';
import type { MealPlan, PlanItem } from '../types';
import { Plus, Trash2, DollarSign } from 'lucide-react';

interface PlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: MealPlan | null;
  schoolId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export function PlanForm({ open, onOpenChange, plan, schoolId, tenantId, onSuccess }: PlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [items, setItems] = useState<PlanItem[]>([]);
  const [totalEstimatedCost, setTotalEstimatedCost] = useState<number>(0);

  useEffect(() => {
    if (plan) {
      setPeriodStart(plan.period_start);
      setPeriodEnd(plan.period_end);
      setItems(plan.items || []);
      setTotalEstimatedCost(plan.total_estimated_cost || 0);
    } else {
      setPeriodStart('');
      setPeriodEnd('');
      setItems([]);
      setTotalEstimatedCost(0);
    }
  }, [plan, open]);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    setTotalEstimatedCost(total);
  }, [items]);

  const addItem = () => {
    setItems([
      ...items,
      {
        item: '',
        quantity: 0,
        unit: 'kg',
        estimated_cost: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PlanItem, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    
    // Calcular custo estimado se quantidade ou preço unitário mudar
    if (field === 'quantity' || field === 'estimated_cost') {
      const quantity = field === 'quantity' ? value : updated[index].quantity;
      const cost = field === 'estimated_cost' ? value : updated[index].estimated_cost;
      updated[index].estimated_cost = (quantity || 0) * (cost || 0);
    }
    
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!periodStart || !periodEnd) {
      toast.error('Preencha as datas do período');
      return;
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      toast.error('Data de início deve ser anterior à data de fim');
      return;
    }

    if (items.length === 0) {
      toast.error('Adicione pelo menos um item ao planejamento');
      return;
    }

    setLoading(true);
    try {
      if (plan) {
        await mealService.updatePlan(plan.id, {
          period_start: periodStart,
          period_end: periodEnd,
          items: items,
          total_estimated_cost: totalEstimatedCost,
        });
        toast.success('Planejamento atualizado com sucesso');
      } else {
        await mealService.createPlan({
          schoolId,
          tenantId,
          periodStart,
          periodEnd,
          items,
          totalEstimatedCost,
        });
        toast.success('Planejamento criado com sucesso');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar planejamento:', error);
      toast.error(error.message || 'Erro ao salvar planejamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar Planejamento' : 'Novo Planejamento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="periodStart">Data de Início *</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="periodEnd">Data de Fim *</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Custo Total Estimado</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={totalEstimatedCost.toFixed(2)}
                  readOnly
                  className="font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Itens do Planejamento</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-xs">Item</Label>
                    <Input
                      value={item.item}
                      onChange={(e) => updateItem(index, 'item', e.target.value)}
                      placeholder="Nome do item"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unidade</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      placeholder="kg"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Custo Estimado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.estimated_cost?.toFixed(2) || '0.00'}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 0;
                        updateItem(index, 'estimated_cost', cost);
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : plan ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

