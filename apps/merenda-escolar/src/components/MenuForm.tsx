import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Label } from '@pei/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pei/ui';
import { useCreateMealMenu, useUpdateMealMenu } from '../hooks/useMealMenus';
import type { MealMenu, DailyMenu, MenuItem } from '../types';
import { Plus, Trash2 } from 'lucide-react';

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
};

interface MenuFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu?: MealMenu | null;
  schoolId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export function MenuForm({ open, onOpenChange, menu, schoolId, tenantId, onSuccess }: MenuFormProps) {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [mealType, setMealType] = useState<string>('almoco');
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);

  const createMenu = useCreateMealMenu();
  const updateMenu = useUpdateMealMenu();

  useEffect(() => {
    if (menu) {
      setPeriodStart(menu.period_start);
      setPeriodEnd(menu.period_end);
      setMealType(menu.meal_type);
      setDailyMenus(menu.daily_menus || []);
    } else {
      setPeriodStart('');
      setPeriodEnd('');
      setMealType('almoco');
      setDailyMenus([]);
    }
  }, [menu, open]);

  const addDay = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setDailyMenus([
      ...dailyMenus,
      {
        date: dateStr,
        items: [],
      },
    ]);
  };

  const removeDay = (index: number) => {
    setDailyMenus(dailyMenus.filter((_, i) => i !== index));
  };

  const addItem = (dayIndex: number) => {
    const updated = [...dailyMenus];
    updated[dayIndex].items = [
      ...updated[dayIndex].items,
      { name: '', quantity: '', unit: 'kg' },
    ];
    setDailyMenus(updated);
  };

  const removeItem = (dayIndex: number, itemIndex: number) => {
    const updated = [...dailyMenus];
    updated[dayIndex].items = updated[dayIndex].items.filter((_, i) => i !== itemIndex);
    setDailyMenus(updated);
  };

  const updateItem = (dayIndex: number, itemIndex: number, field: keyof MenuItem, value: string) => {
    const updated = [...dailyMenus];
    updated[dayIndex].items[itemIndex] = {
      ...updated[dayIndex].items[itemIndex],
      [field]: value,
    };
    setDailyMenus(updated);
  };

  const updateDayDate = (dayIndex: number, date: string) => {
    const updated = [...dailyMenus];
    updated[dayIndex].date = date;
    setDailyMenus(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!periodStart || !periodEnd || !mealType) {
      return;
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      return;
    }

    const menuData = {
      schoolId,
      tenantId,
      periodStart,
      periodEnd,
      mealType,
      dailyMenus,
    };

    if (menu) {
      updateMenu.mutate(
        {
          menuId: menu.id,
          updates: {
            period_start: periodStart,
            period_end: periodEnd,
            meal_type: mealType as any,
            daily_menus: dailyMenus,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        }
      );
    } else {
      createMenu.mutate(menuData, {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      });
    }
  };

  const loading = createMenu.isPending || updateMenu.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-labelledby="menu-form-title">
        <DialogHeader>
          <DialogTitle id="menu-form-title">{menu ? 'Editar Cardápio' : 'Novo Cardápio'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulário de cardápio">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="periodStart">Data de Início *</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                aria-required="true"
                aria-label="Data de início do período do cardápio"
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
                aria-required="true"
                aria-label="Data de fim do período do cardápio"
              />
            </div>

            <div>
              <Label htmlFor="mealType">Tipo de Refeição *</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger id="mealType" aria-label="Selecione o tipo de refeição">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div role="region" aria-label="Cardápios diários">
            <div className="flex items-center justify-between mb-4">
              <Label>Cardápios Diários</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDay}
                aria-label="Adicionar novo dia ao cardápio"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Adicionar Dia
              </Button>
            </div>

            <div className="space-y-4" role="list" aria-label="Lista de cardápios diários">
              {dailyMenus.map((dayMenu, dayIndex) => (
                <div
                  key={dayIndex}
                  className="border rounded-lg p-4 space-y-3"
                  role="listitem"
                  aria-label={`Cardápio do dia ${dayMenu.date}`}
                >
                  <div className="flex items-center justify-between">
                    <Input
                      type="date"
                      value={dayMenu.date}
                      onChange={(e) => updateDayDate(dayIndex, e.target.value)}
                      className="w-48"
                      aria-label={`Data do cardápio ${dayIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDay(dayIndex)}
                      aria-label={`Remover cardápio do dia ${dayMenu.date}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </div>

                  <div className="space-y-2" role="list" aria-label={`Itens do cardápio ${dayIndex + 1}`}>
                    {dayMenu.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-2" role="listitem">
                        <Input
                          placeholder="Nome do item"
                          value={item.name}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'name', e.target.value)}
                          className="flex-1"
                          aria-label={`Nome do item ${itemIndex + 1} do cardápio ${dayIndex + 1}`}
                        />
                        <Input
                          placeholder="Quantidade"
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'quantity', e.target.value)}
                          className="w-32"
                          aria-label={`Quantidade do item ${itemIndex + 1}`}
                        />
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(dayIndex, itemIndex, 'unit', value)}
                        >
                          <SelectTrigger className="w-24" aria-label={`Unidade do item ${itemIndex + 1}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="mL">mL</SelectItem>
                            <SelectItem value="un">un</SelectItem>
                            <SelectItem value="cx">cx</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(dayIndex, itemIndex)}
                          aria-label={`Remover item ${itemIndex + 1}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                          <span className="sr-only">Remover item</span>
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addItem(dayIndex)}
                      className="w-full"
                      aria-label={`Adicionar item ao cardápio ${dayIndex + 1}`}
                    >
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                      Adicionar Item
                    </Button>
                  </div>
                </div>
              ))}

              {dailyMenus.length === 0 && (
                <div className="text-center py-8 text-muted-foreground" role="status">
                  <p>Nenhum cardápio diário adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Dia" para começar</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              aria-label="Cancelar criação de cardápio"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} aria-label={menu ? 'Atualizar cardápio' : 'Criar cardápio'}>
              {loading ? 'Salvando...' : menu ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
