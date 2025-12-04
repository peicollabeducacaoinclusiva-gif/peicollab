import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { UtensilsCrossed, Calendar, ShoppingCart, Plus, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';
import { format } from 'date-fns';

interface MealMenu {
  id: string;
  school_name: string;
  period_start: string;
  period_end: string;
  meal_type: string;
  daily_menus: any[];
  created_at: string;
}

interface MealPlan {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_estimated_cost: number;
  created_at: string;
}

export default function Meals() {
  const [menus, setMenus] = useState<MealMenu[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setSchoolId(profile.school_id ?? null);
        setTenantId(profile.tenant_id ?? null);
        await loadData(profile.school_id ?? null, profile.tenant_id ?? null);
      }
    } catch (error: any) {
      console.error('Erro ao inicializar:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function loadData(school_id: string | null, tenant_id: string | null) {
    try {
      // Carregar cardápios
      const { data: menusData, error: menusError } = await supabase.rpc('get_meal_menus', {
        p_school_id: school_id,
        p_tenant_id: tenant_id,
        p_period_start: null,
        p_period_end: null,
        p_meal_type: null,
      });

      if (menusError) throw menusError;
      setMenus(menusData || []);

      // Carregar planejamentos (buscar direto da tabela)
      if (school_id) {
        const { data: plansData, error: plansError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('school_id', school_id)
          .order('created_at', { ascending: false });

        if (plansError) throw plansError;
        setPlans((plansData || []) as MealPlan[]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  async function handleCreateMenu(formData: any) {
    if (!schoolId || !tenantId) return;

    try {
      const { data: _data, error } = await supabase.rpc('create_meal_menu', {
        p_school_id: schoolId,
        p_tenant_id: tenantId,
        p_period_start: formData.period_start,
        p_period_end: formData.period_end,
        p_meal_type: formData.meal_type,
        p_daily_menus: formData.daily_menus ? JSON.parse(formData.daily_menus) : [],
        p_nutritional_info: formData.nutritional_info ? JSON.parse(formData.nutritional_info) : {},
      });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Cardápio criado com sucesso' });
      setCreateMenuOpen(false);
      await loadData(schoolId, tenantId);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  async function handleCreatePlan(formData: any) {
    if (!schoolId || !tenantId) return;

    try {
      const { data: _data, error } = await supabase.rpc('create_meal_plan', {
        p_school_id: schoolId,
        p_tenant_id: tenantId,
        p_period_start: formData.period_start,
        p_period_end: formData.period_end,
        p_items: formData.items ? JSON.parse(formData.items) : [],
        p_total_estimated_cost: formData.total_estimated_cost ? parseFloat(formData.total_estimated_cost) : null,
      });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Planejamento criado com sucesso' });
      setCreatePlanOpen(false);
      await loadData(schoolId, tenantId);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  async function exportCSV() {
    try {
      const csv = [
        ['Período Início', 'Período Fim', 'Tipo', 'Escola'].join(','),
        ...menus.map(m => [
          format(new Date(m.period_start), 'dd/MM/yyyy'),
          format(new Date(m.period_end), 'dd/MM/yyyy'),
          m.meal_type,
          m.school_name || '',
        ].join(','))
      ].join('\n');

      const filename = `merenda_cardapios_${formatTimestampForFilename()}.csv`;
      downloadTextFile(csv, filename);
      toast({ title: 'Sucesso', description: 'Dados exportados com sucesso' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Merenda Escolar" icon={<UtensilsCrossed className="h-6 w-6 text-primary" />} />

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="menus" className="space-y-4">
          <TabsList>
            <TabsTrigger value="menus">
              <Calendar className="h-4 w-4 mr-2" />
              Cardápios
            </TabsTrigger>
            <TabsTrigger value="plans">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Planejamentos
            </TabsTrigger>
          </TabsList>

          {/* Cardápios */}
          <TabsContent value="menus" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cardápios</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button onClick={() => setCreateMenuOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Cardápio
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {menus.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cardápio cadastrado
                  </p>
                ) : (
                  <div className="space-y-4">
                    {menus.map(menu => (
                      <Card key={menu.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{menu.school_name || 'Cardápio'}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(menu.period_start), 'dd/MM/yyyy')} - {format(new Date(menu.period_end), 'dd/MM/yyyy')}
                              </p>
                            </div>
                            <Badge>{menu.meal_type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {menu.daily_menus?.length || 0} dias de cardápio cadastrados
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planejamentos */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Planejamentos de Compras</CardTitle>
                  <Button onClick={() => setCreatePlanOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Planejamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {plans.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum planejamento cadastrado
                  </p>
                ) : (
                  <div className="space-y-4">
                    {plans.map(plan => (
                      <Card key={plan.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {format(new Date(plan.period_start), 'dd/MM/yyyy')} - {format(new Date(plan.period_end), 'dd/MM/yyyy')}
                              </CardTitle>
                            </div>
                            <Badge variant={plan.status === 'approved' ? 'default' : 'secondary'}>
                              {plan.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {plan.total_estimated_cost && (
                            <p className="text-sm">
                              <strong>Custo Estimado:</strong> R$ {plan.total_estimated_cost.toFixed(2)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Criar Cardápio */}
        <Dialog open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cardápio</DialogTitle>
              <DialogDescription>Cadastre um novo cardápio para o período</DialogDescription>
            </DialogHeader>
            <MenuForm onSubmit={handleCreateMenu} onCancel={() => setCreateMenuOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Dialog Criar Planejamento */}
        <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Planejamento</DialogTitle>
              <DialogDescription>Cadastre um novo planejamento de compras</DialogDescription>
            </DialogHeader>
            <PlanForm onSubmit={handleCreatePlan} onCancel={() => setCreatePlanOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function MenuForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    period_start: '',
    period_end: '',
    meal_type: 'almoco',
    daily_menus: '',
    nutritional_info: '',
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="period_start">Data Início</Label>
        <Input
          id="period_start"
          type="date"
          value={formData.period_start}
          onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="period_end">Data Fim</Label>
        <Input
          id="period_end"
          type="date"
          value={formData.period_end}
          onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="meal_type">Tipo de Refeição</Label>
        <Select value={formData.meal_type} onValueChange={(v) => setFormData({ ...formData, meal_type: v })}>
          <SelectTrigger id="meal_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cafe_manha">Café da Manhã</SelectItem>
            <SelectItem value="lanche_manha">Lanche da Manhã</SelectItem>
            <SelectItem value="almoco">Almoço</SelectItem>
            <SelectItem value="lanche_tarde">Lanche da Tarde</SelectItem>
            <SelectItem value="jantar">Jantar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Salvar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function PlanForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    period_start: '',
    period_end: '',
    items: '',
    total_estimated_cost: '',
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="period_start">Data Início</Label>
        <Input
          id="period_start"
          type="date"
          value={formData.period_start}
          onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="period_end">Data Fim</Label>
        <Input
          id="period_end"
          type="date"
          value={formData.period_end}
          onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="total_estimated_cost">Custo Estimado (R$)</Label>
        <Input
          id="total_estimated_cost"
          type="number"
          step="0.01"
          value={formData.total_estimated_cost}
          onChange={(e) => setFormData({ ...formData, total_estimated_cost: e.target.value })}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Salvar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

