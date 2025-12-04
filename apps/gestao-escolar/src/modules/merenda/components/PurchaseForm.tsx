import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Label } from '@pei/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pei/ui';
import { mealService } from '../services/mealService';
import { toast } from 'sonner';
import type { MealPurchase, PurchaseItem, MealSupplier } from '../types';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface PurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase?: MealPurchase | null;
  schoolId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export function PurchaseForm({ open, onOpenChange, purchase, schoolId, tenantId, onSuccess }: PurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<MealSupplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    if (open) {
      loadSuppliers();
    }
  }, [open, tenantId]);

  useEffect(() => {
    if (purchase) {
      setSelectedSupplierId(purchase.supplier_id || '');
      setPurchaseDate(purchase.purchase_date);
      setInvoiceNumber(purchase.invoice_number || '');
      setItems(purchase.items || []);
      setTotalAmount(purchase.total_amount || 0);
    } else {
      setSelectedSupplierId('');
      setPurchaseDate(format(new Date(), 'yyyy-MM-dd'));
      setInvoiceNumber('');
      setItems([]);
      setTotalAmount(0);
    }
  }, [purchase, open]);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    setTotalAmount(total);
  }, [items]);

  const loadSuppliers = async () => {
    try {
      const data = await mealService.getSuppliers(tenantId, false);
      setSuppliers(data);
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item: '',
        quantity: 0,
        unit: 'kg',
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    
    // Calcular preço total se quantidade ou preço unitário mudar
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : updated[index].quantity;
      const unitPrice = field === 'unit_price' ? value : updated[index].unit_price;
      updated[index].total_price = (quantity || 0) * (unitPrice || 0);
    }
    
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!purchaseDate) {
      toast.error('Selecione a data da compra');
      return;
    }

    if (items.length === 0) {
      toast.error('Adicione pelo menos um item à compra');
      return;
    }

    setLoading(true);
    try {
      if (purchase) {
        // Atualizar compra (se necessário)
        toast.error('Edição de compras ainda não implementada');
      } else {
        await mealService.createPurchase({
          meal_plan_id: undefined,
          supplier_id: selectedSupplierId || undefined,
          school_id: schoolId,
          tenant_id: tenantId,
          purchase_date: purchaseDate,
          items,
          total_amount: totalAmount,
          invoice_number: invoiceNumber || undefined,
        });
        toast.success('Compra registrada com sucesso');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar compra:', error);
      toast.error(error.message || 'Erro ao salvar compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{purchase ? 'Editar Compra' : 'Nova Compra'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="purchaseDate">Data da Compra *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoiceNumber">Número da Nota Fiscal</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="000000"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Itens da Compra</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
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
                  <div className="col-span-2">
                    <Label className="text-xs">Preço Unit. (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price?.toFixed(2) || '0.00'}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0;
                        updateItem(index, 'unit_price', price);
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.total_price?.toFixed(2) || '0.00'}
                      readOnly
                      className="font-semibold"
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

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Total da Compra</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : purchase ? 'Atualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

