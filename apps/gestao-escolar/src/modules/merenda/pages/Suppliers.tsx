import { useState } from 'react';
import { Plus, Package, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';
import { useMealSuppliers, useUpdateMealSupplier } from '../hooks/useMealSuppliers';
import { useUserProfile } from '../hooks/useUserProfile';
import type { MealSupplier } from '../types';
import { SupplierForm } from '../components/SupplierForm';
import { toast } from 'sonner';

export default function Suppliers() {
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<MealSupplier | null>(null);

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: suppliers = [], isLoading: suppliersLoading } = useMealSuppliers(
    userProfile?.tenant_id || '',
    false
  );
  const updateSupplier = useUpdateMealSupplier();

  const handleToggleActive = async (supplierId: string, isActive: boolean) => {
    updateSupplier.mutate(
      { supplierId, updates: { is_active: !isActive } },
      {
        onSuccess: () => {
          toast.success('Status do fornecedor atualizado');
        },
      }
    );
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm('Tem certeza que deseja desativar este fornecedor?')) return;
    updateSupplier.mutate(
      { supplierId, updates: { is_active: false } },
      {
        onSuccess: () => {
          toast.success('Fornecedor desativado');
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

  const loading = profileLoading || suppliersLoading;

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
            <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie fornecedores de alimentos
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedSupplier(null);
              setSupplierFormOpen(true);
            }}
            aria-label="Criar novo fornecedor"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Novo Fornecedor
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando fornecedores...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <Card role="region" aria-label="Lista de fornecedores vazia">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">
                Nenhum fornecedor cadastrado ainda
              </p>
              <Button
                onClick={() => {
                  setSelectedSupplier(null);
                  setSupplierFormOpen(true);
                }}
                aria-label="Cadastrar primeiro fornecedor"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Cadastrar Primeiro Fornecedor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="Lista de fornecedores"
          >
            {suppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="hover:shadow-lg transition-shadow"
                role="listitem"
                aria-label={`Fornecedor ${supplier.supplier_name}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{supplier.supplier_name}</CardTitle>
                      <Badge
                        className={`mt-2 ${supplier.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                        aria-label={supplier.is_active ? 'Fornecedor ativo' : 'Fornecedor inativo'}
                      >
                        {supplier.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex gap-2" role="group" aria-label="Ações do fornecedor">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setSupplierFormOpen(true);
                        }}
                        aria-label={`Editar fornecedor ${supplier.supplier_name}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(supplier.id)}
                        aria-label={`Desativar fornecedor ${supplier.supplier_name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        <span className="sr-only">Desativar</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {supplier.cnpj && (
                      <p className="text-muted-foreground">
                        <strong>CNPJ:</strong> {supplier.cnpj}
                      </p>
                    )}
                    {supplier.contact_name && (
                      <p className="text-muted-foreground">
                        <strong>Contato:</strong> {supplier.contact_name}
                      </p>
                    )}
                    {supplier.contact_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" aria-hidden="true" />
                        <span>{supplier.contact_phone}</span>
                      </div>
                    )}
                    {supplier.contact_email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        <span>{supplier.contact_email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                    {supplier.categories && supplier.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2" role="list" aria-label="Categorias do fornecedor">
                        {supplier.categories.map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs" role="listitem">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <SupplierForm
          open={supplierFormOpen}
          onOpenChange={setSupplierFormOpen}
          supplier={selectedSupplier}
          tenantId={userProfile?.tenant_id || ''}
          onSuccess={() => {
            setSelectedSupplier(null);
          }}
        />
      </div>
    </div>
  );
}
