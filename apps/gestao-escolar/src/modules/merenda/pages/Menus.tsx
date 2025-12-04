import { useState, useEffect } from 'react';
import { Plus, Calendar, ChefHat, Edit, Trash2 } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';
import { useMealMenus, useDeleteMealMenu } from '../hooks/useMealMenus';
import { useUserProfile } from '../hooks/useUserProfile';
import type { MealMenu } from '../types';
import { MenuForm } from '../components/MenuForm';

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
};

export default function Menus() {
  const [menuFormOpen, setMenuFormOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MealMenu | null>(null);
  const [filterMealType, setFilterMealType] = useState<string>('');

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: menus = [], isLoading: menusLoading, refetch } = useMealMenus({
    tenantId: userProfile?.tenant_id,
    schoolId: userProfile?.school_id || undefined,
    mealType: filterMealType || undefined,
  });
  const deleteMenu = useDeleteMealMenu();

  const handleDelete = async (menuId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cardápio?')) return;
    deleteMenu.mutate(menuId);
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

  const loading = profileLoading || menusLoading;

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
            <h1 className="text-3xl font-bold text-foreground">Cardápios</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os cardápios semanais e mensais
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedMenu(null);
              setMenuFormOpen(true);
            }}
            aria-label="Criar novo cardápio"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Novo Cardápio
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6" role="region" aria-label="Filtros de cardápios">
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <label htmlFor="filter-meal-type" className="sr-only">
                Filtrar por tipo de refeição
              </label>
              <select
                id="filter-meal-type"
                value={filterMealType}
                onChange={(e) => setFilterMealType(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
                aria-label="Tipo de refeição"
              >
                <option value="">Todos os tipos</option>
                {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cardápios */}
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando cardápios...</p>
          </div>
        ) : menus.length === 0 ? (
          <Card role="region" aria-label="Lista de cardápios vazia">
            <CardContent className="py-12 text-center">
              <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">
                Nenhum cardápio cadastrado ainda
              </p>
              <Button
                onClick={() => {
                  setSelectedMenu(null);
                  setMenuFormOpen(true);
                }}
                aria-label="Criar primeiro cardápio"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Criar Primeiro Cardápio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="Lista de cardápios"
          >
            {menus.map((menu) => (
              <Card
                key={menu.id}
                className="hover:shadow-lg transition-shadow"
                role="listitem"
                aria-label={`Cardápio ${menu.meal_type} de ${new Date(menu.period_start).toLocaleDateString('pt-BR')} a ${new Date(menu.period_end).toLocaleDateString('pt-BR')}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {menu.school_name || 'Rede'}
                      </CardTitle>
                      <Badge className="mt-2" aria-label={`Tipo: ${MEAL_TYPE_LABELS[menu.meal_type] || menu.meal_type}`}>
                        {MEAL_TYPE_LABELS[menu.meal_type] || menu.meal_type}
                      </Badge>
                    </div>
                    <div className="flex gap-2" role="group" aria-label="Ações do cardápio">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMenu(menu);
                          setMenuFormOpen(true);
                        }}
                        aria-label={`Editar cardápio ${menu.meal_type}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(menu.id)}
                        aria-label={`Excluir cardápio ${menu.meal_type}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {new Date(menu.period_start).toLocaleDateString('pt-BR')} -{' '}
                        {new Date(menu.period_end).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {menu.daily_menus && menu.daily_menus.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">
                          {menu.daily_menus.length} dia(s) de cardápio
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <MenuForm
          open={menuFormOpen}
          onOpenChange={setMenuFormOpen}
          menu={selectedMenu}
          schoolId={userProfile?.school_id || ''}
          tenantId={userProfile?.tenant_id || ''}
          onSuccess={() => {
            refetch();
            setSelectedMenu(null);
          }}
        />
      </div>
    </div>
  );
}
