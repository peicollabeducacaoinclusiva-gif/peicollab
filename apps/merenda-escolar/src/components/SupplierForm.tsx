import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Label } from '@pei/ui';
import { mealService } from '../services/mealService';
import { toast } from 'sonner';
import type { MealSupplier } from '../types';
import { Plus, X } from 'lucide-react';

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: MealSupplier | null;
  tenantId: string;
  onSuccess?: () => void;
}

export function SupplierForm({ open, onOpenChange, supplier, tenantId, onSuccess }: SupplierFormProps) {
  const [loading, setLoading] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (supplier) {
      setSupplierName(supplier.supplier_name);
      setCnpj(supplier.cnpj || '');
      setContactName(supplier.contact_name || '');
      setContactPhone(supplier.contact_phone || '');
      setContactEmail(supplier.contact_email || '');
      setAddress(supplier.address || '');
      setCategories(supplier.categories || []);
      setIsActive(supplier.is_active);
    } else {
      setSupplierName('');
      setCnpj('');
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setAddress('');
      setCategories([]);
      setIsActive(true);
    }
  }, [supplier, open]);

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplierName) {
      toast.error('Nome do fornecedor é obrigatório');
      return;
    }

    setLoading(true);
    try {
      if (supplier) {
        await mealService.updateSupplier(supplier.id, {
          supplier_name: supplierName,
          cnpj: cnpj || undefined,
          contact_name: contactName || undefined,
          contact_phone: contactPhone || undefined,
          contact_email: contactEmail || undefined,
          address: address || undefined,
          categories,
          is_active: isActive,
        });
        toast.success('Fornecedor atualizado com sucesso');
      } else {
        await mealService.createSupplier({
          tenant_id: tenantId,
          supplier_name: supplierName,
          cnpj: cnpj || undefined,
          contact_name: contactName || undefined,
          contact_phone: contactPhone || undefined,
          contact_email: contactEmail || undefined,
          address: address || undefined,
          categories,
          is_active: isActive,
        });
        toast.success('Fornecedor criado com sucesso');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error(error.message || 'Erro ao salvar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="supplierName">Nome do Fornecedor *</Label>
            <Input
              id="supplierName"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <Label htmlFor="contactName">Nome do Contato</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPhone">Telefone</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">E-mail</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contato@fornecedor.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div>
            <Label>Categorias</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCategory();
                  }
                }}
                placeholder="Ex: Hortifruti, Carnes, Laticínios"
              />
              <Button type="button" variant="outline" onClick={addCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
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
              Fornecedor ativo
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : supplier ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

