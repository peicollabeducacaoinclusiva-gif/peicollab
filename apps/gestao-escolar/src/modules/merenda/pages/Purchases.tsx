import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Calendar, DollarSign } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { useMealPurchases } from '../hooks/useMealPurchases';
import { useUserProfile } from '../hooks/useUserProfile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PurchaseForm } from '../components/PurchaseForm';
import { Pagination } from '@pei/ui';

const ITEMS_PER_PAGE = 10;

export default function Purchases() {
  const [startDate, setStartDate] = useState<string>(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: purchases = [], isLoading: purchasesLoading } = useMealPurchases({
    tenantId: userProfile?.tenant_id,
    schoolId: userProfile?.school_id || undefined,
    startDate,
    endDate,
  });

  const totalAmount = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const totalPages = Math.ceil(purchases.length / ITEMS_PER_PAGE);
  const paginatedPurchases = purchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: userProfile.tenant?.network_name,
    school_name: userProfile.school?.school_name,
  } : undefined;

  const loading = profileLoading || purchasesLoading;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

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
            <h1 className="text-3xl font-bold text-foreground">Compras</h1>
            <p className="text-muted-foreground mt-1">
              Histórico e controle de compras realizadas
            </p>
          </div>
          <Button
            onClick={() => setPurchaseFormOpen(true)}
            aria-label="Registrar nova compra"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Nova Compra
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6" role="region" aria-label="Filtros de compras">
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="start-date" className="text-sm font-medium mb-2 block">
                  Data Inicial
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  aria-label="Data inicial do período"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="text-sm font-medium mb-2 block">
                  Data Final
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  aria-label="Data final do período"
                />
              </div>
              <div className="flex items-end">
                <Card className="w-full" role="region" aria-label="Total no período">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total no Período</div>
                    <div className="text-2xl font-bold text-foreground" aria-live="polite">
                      R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Compras */}
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando compras...</p>
          </div>
        ) : purchases.length === 0 ? (
          <Card role="region" aria-label="Lista de compras vazia">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">
                Nenhuma compra registrada neste período
              </p>
              <Button
                onClick={() => setPurchaseFormOpen(true)}
                aria-label="Registrar primeira compra"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Registrar Primeira Compra
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6" role="list" aria-label="Lista de compras">
              {paginatedPurchases.map((purchase) => (
                <Card
                  key={purchase.id}
                  className="hover:shadow-lg transition-shadow"
                  role="listitem"
                  aria-label={`Compra de ${(purchase as any).supplier?.supplier_name || 'Fornecedor não informado'} em ${format(new Date(purchase.purchase_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {(purchase as any).supplier?.supplier_name || 'Fornecedor não informado'}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" aria-hidden="true" />
                            {format(new Date(purchase.purchase_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                          {(purchase as any).school?.school_name && (
                            <span>{(purchase as any).school.school_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          R$ {Number(purchase.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        {purchase.invoice_number && (
                          <div className="text-sm text-muted-foreground mt-1">
                            NF: {purchase.invoice_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {purchase.items && purchase.items.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Itens:</p>
                        <div className="space-y-1" role="list" aria-label="Itens da compra">
                          {purchase.items.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm text-muted-foreground" role="listitem">
                              {item.item} - {item.quantity} {item.unit} - R$ {Number(item.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={ITEMS_PER_PAGE}
                totalItems={purchases.length}
                aria-label="Navegação de páginas de compras"
              />
            )}
          </>
        )}

        <PurchaseForm
          open={purchaseFormOpen}
          onOpenChange={setPurchaseFormOpen}
          schoolId={userProfile?.school_id || ''}
          tenantId={userProfile?.tenant_id || ''}
          onSuccess={() => {
            // React Query vai atualizar automaticamente
          }}
        />
      </div>
    </div>
  );
}
