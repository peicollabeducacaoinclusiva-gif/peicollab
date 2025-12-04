import { useState } from 'react';
import { Plus, ShoppingCart, Calendar, DollarSign } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';
import { useMealPlans, useCreateMealPlan } from '../hooks/useMealPlans';
import { useUserProfile } from '../hooks/useUserProfile';
import type { MealPlan } from '../types';
import { PlanForm } from '../components/PlanForm';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-500' },
  approved: { label: 'Aprovado', color: 'bg-blue-500' },
  purchased: { label: 'Comprado', color: 'bg-green-500' },
  completed: { label: 'Concluído', color: 'bg-purple-500' },
};

export default function Planning() {
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: plans = [], isLoading: plansLoading } = useMealPlans({
    tenantId: userProfile?.tenant_id,
    schoolId: userProfile?.school_id || undefined,
  });

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: userProfile.tenant?.network_name,
    school_name: userProfile.school?.school_name,
  } : undefined;

  const loading = profileLoading || plansLoading;

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
            <h1 className="text-3xl font-bold text-foreground">Planejamento de Compras</h1>
            <p className="text-muted-foreground mt-1">
              Planeje compras e controle de estoque
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedPlan(null);
              setPlanFormOpen(true);
            }}
            aria-label="Criar novo planejamento"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Novo Planejamento
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando planejamentos...</p>
          </div>
        ) : plans.length === 0 ? (
          <Card role="region" aria-label="Lista de planejamentos vazia">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">
                Nenhum planejamento cadastrado ainda
              </p>
              <Button
                onClick={() => {
                  setSelectedPlan(null);
                  setPlanFormOpen(true);
                }}
                aria-label="Criar primeiro planejamento"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Criar Primeiro Planejamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="Lista de planejamentos"
          >
            {plans.map((plan) => {
              const status = STATUS_LABELS[plan.status] || STATUS_LABELS.draft;
              return (
                <Card
                  key={plan.id}
                  className="hover:shadow-lg transition-shadow"
                  role="listitem"
                  aria-label={`Planejamento de ${new Date(plan.period_start).toLocaleDateString('pt-BR')} a ${new Date(plan.period_end).toLocaleDateString('pt-BR')}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {(plan as any).school?.school_name || 'Rede'}
                        </CardTitle>
                        <Badge className={`mt-2 ${status.color} text-white`} aria-label={`Status: ${status.label}`}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        <span>
                          {new Date(plan.period_start).toLocaleDateString('pt-BR')} -{' '}
                          {new Date(plan.period_end).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {plan.items && plan.items.length > 0 && (
                        <div>
                          <p className="text-muted-foreground">
                            {plan.items.length} item(ns) planejado(s)
                          </p>
                        </div>
                      )}
                      {plan.total_estimated_cost && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" aria-hidden="true" />
                          <span className="font-semibold text-foreground">
                            R$ {plan.total_estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <PlanForm
          open={planFormOpen}
          onOpenChange={setPlanFormOpen}
          plan={selectedPlan}
          schoolId={userProfile?.school_id || ''}
          tenantId={userProfile?.tenant_id || ''}
          onSuccess={() => {
            setSelectedPlan(null);
          }}
        />
      </div>
    </div>
  );
}
