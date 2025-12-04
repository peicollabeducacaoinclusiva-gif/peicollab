import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, CheckCircle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge, Textarea, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Budget {
  id: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  description: string | null;
}

interface FinancialTransaction {
  id: string;
  transaction_type: string;
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
  status: string;
  approved_by_name: string | null;
  approved_at: string | null;
  document_url: string | null;
}

interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  balance: number;
  budget_allocated: number;
  budget_spent: number;
  budget_remaining: number;
}

const categoryLabels: Record<string, string> = {
  merenda: 'Merenda Escolar',
  transporte: 'Transporte Escolar',
  manutencao: 'Manutenção',
  material_didatico: 'Material Didático',
  recursos_humanos: 'Recursos Humanos',
  infraestrutura: 'Infraestrutura',
  tecnologia: 'Tecnologia',
  outros: 'Outros',
};

export default function Finance() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  
  // Filtros
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  
  // Dialog states
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Form states
  const [budgetCategory, setBudgetCategory] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState<string>('');
  const [budgetDescription, setBudgetDescription] = useState<string>('');
  
  const [transactionType, setTransactionType] = useState<string>('despesa');
  const [transactionCategory, setTransactionCategory] = useState<string>('');
  const [transactionDescription, setTransactionDescription] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    return dateStr || '';
  });
  const [transactionBudgetId, setTransactionBudgetId] = useState<string>('');
  const [transactionNotes, setTransactionNotes] = useState<string>('');
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tenantId || schoolId) {
      loadData();
    }
  }, [tenantId, schoolId, academicYear, transactionTypeFilter, statusFilter, dateStart, dateEnd]);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, school_id, id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      } else {
        const { data: userTenant } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (userTenant) {
          setTenantId(userTenant.tenant_id);
        }
      }

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
      }

      if (profile?.id) {
        setUserId(profile.id);
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      if (!tenantId && !schoolId) return;

      // Carregar resumo financeiro
      const { data: summaryData, error: summaryError } = await supabase.rpc('get_financial_summary', {
        p_school_id: schoolId || null,
        p_tenant_id: tenantId || null,
        p_academic_year: academicYear,
        p_date_start: dateStart || null,
        p_date_end: dateEnd || null,
      });

      if (summaryError) throw summaryError;
      if (summaryData && summaryData.length > 0) {
        setSummary(summaryData[0]);
      }

      // Carregar orçamentos
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('academic_year', academicYear)
        .eq(schoolId ? 'school_id' : 'tenant_id', schoolId || tenantId)
        .order('category');

      if (budgetsError) throw budgetsError;
      setBudgets((budgetsData || []) as Budget[]);

      // Carregar transações
      const { data: transactionsData, error: transactionsError } = await supabase.rpc('get_financial_transactions', {
        p_school_id: schoolId || null,
        p_tenant_id: tenantId || null,
        p_transaction_type: transactionTypeFilter === 'all' ? null : transactionTypeFilter,
        p_category: null,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_date_start: dateStart || null,
        p_date_end: dateEnd || null,
        p_limit: 100,
        p_offset: 0,
      });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados financeiros',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBudget() {
    if (!budgetCategory || !budgetAmount || !tenantId) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('create_budget', {
        p_tenant_id: tenantId,
        p_school_id: schoolId,
        p_academic_year: academicYear,
        p_category: budgetCategory,
        p_allocated_amount: parseFloat(budgetAmount),
        p_description: budgetDescription || null,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Orçamento criado com sucesso',
      });

      setBudgetDialogOpen(false);
      setBudgetCategory('');
      setBudgetAmount('');
      setBudgetDescription('');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar orçamento:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar orçamento',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleCreateTransaction() {
    if (!transactionCategory || !transactionDescription || !transactionAmount || !transactionDate || !schoolId || !tenantId) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('create_financial_transaction', {
        p_budget_id: transactionBudgetId || null,
        p_school_id: schoolId,
        p_tenant_id: tenantId,
        p_transaction_type: transactionType,
        p_category: transactionCategory,
        p_description: transactionDescription,
        p_amount: parseFloat(transactionAmount),
        p_transaction_date: transactionDate,
        p_document_url: null,
        p_document_type: null,
        p_notes: transactionNotes || null,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Transação criada com sucesso',
      });

      setTransactionDialogOpen(false);
      resetTransactionForm();
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar transação',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  function resetTransactionForm() {
    setTransactionType('despesa');
    setTransactionCategory('');
    setTransactionDescription('');
    setTransactionAmount('');
    const dateStr = new Date().toISOString().split('T')[0];
    setTransactionDate(dateStr || '');
    setTransactionBudgetId('');
    setTransactionNotes('');
  }

  async function handleApproveTransaction(transactionId: string) {
    try {
      const { error } = await supabase.rpc('approve_financial_transaction', {
        p_transaction_id: transactionId,
        p_approved_by: userId,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Transação aprovada',
      });

      await loadData();
    } catch (error: any) {
      console.error('Erro ao aprovar transação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aprovar transação',
        variant: 'destructive',
      });
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DollarSign className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Gestão Financeira</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Receitas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(summary.total_revenue)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Despesas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(summary.total_expenses)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Saldo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className={`text-2xl font-bold ${
                        summary.balance >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(summary.balance)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Orçamento Restante
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(summary.budget_remaining)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(summary.budget_spent)} de {formatCurrency(summary.budget_allocated)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Orçamentos por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Orçamentos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {budgets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum orçamento cadastrado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {budgets.map(budget => {
                      const percentage = budget.allocated_amount > 0 
                        ? (budget.spent_amount / budget.allocated_amount) * 100 
                        : 0;
                      
                      return (
                        <div key={budget.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground">
                                {categoryLabels[budget.category] || budget.category}
                              </p>
                              {budget.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {budget.description}
                                </p>
                              )}
                            </div>
                            <Badge variant={percentage > 90 ? 'destructive' : percentage > 70 ? 'default' : 'outline'}>
                              {percentage.toFixed(0)}% utilizado
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Alocado:</span>
                              <span className="font-medium text-foreground">{formatCurrency(budget.allocated_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Gasto:</span>
                              <span className="font-medium text-foreground">{formatCurrency(budget.spent_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Restante:</span>
                              <span className={`font-medium ${
                                budget.remaining_amount < 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-foreground'
                              }`}>
                                {formatCurrency(budget.remaining_amount)}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div
                                className={`h-2 rounded-full ${
                                  percentage > 90 ? 'bg-red-600' :
                                  percentage > 70 ? 'bg-yellow-600' :
                                  'bg-green-600'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orçamentos */}
          <TabsContent value="budgets" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Orçamentos</h2>
              <Button onClick={() => setBudgetDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div>
                <Label htmlFor="academicYear">Ano Letivo:</Label>
                <Input
                  id="academicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-24"
                />
              </div>
            </div>

            {budgets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum orçamento encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {budgets.map(budget => (
                  <Card key={budget.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{categoryLabels[budget.category] || budget.category}</CardTitle>
                          {budget.description && (
                            <p className="text-sm text-muted-foreground mt-1">{budget.description}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Alocado</p>
                          <p className="text-lg font-bold text-foreground">{formatCurrency(budget.allocated_amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Gasto</p>
                          <p className="text-lg font-bold text-foreground">{formatCurrency(budget.spent_amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Restante</p>
                          <p className={`text-lg font-bold ${
                            budget.remaining_amount < 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-foreground'
                          }`}>
                            {formatCurrency(budget.remaining_amount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Transações */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Transações Financeiras</h2>
              <Button onClick={() => setTransactionDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </div>

            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="transactionType">Tipo</Label>
                    <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                      <SelectTrigger id="transactionType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="receita">Receitas</SelectItem>
                        <SelectItem value="despesa">Despesas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aprovada">Aprovada</SelectItem>
                        <SelectItem value="rejeitada">Rejeitada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateStart">Data Inicial</Label>
                    <Input
                      id="dateStart"
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateEnd">Data Final</Label>
                    <Input
                      id="dateEnd"
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {transactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma transação encontrada
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {transactions.map(transaction => (
                  <Card key={transaction.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{transaction.description}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {categoryLabels[transaction.category] || transaction.category} • {format(new Date(transaction.transaction_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            transaction.transaction_type === 'receita'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.transaction_type === 'receita' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <Badge className="mt-2">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          {transaction.approved_at && (
                            <p className="text-xs text-muted-foreground">
                              Aprovado por {transaction.approved_by_name} em {format(new Date(transaction.approved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        {transaction.status === 'pendente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveTransaction(transaction.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Funcionalidade de relatórios em desenvolvimento
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Criar Orçamento */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
            <DialogDescription>
              Crie um orçamento para o ano letivo {academicYear}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="budgetCategory">Categoria *</Label>
              <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                <SelectTrigger id="budgetCategory">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budgetAmount">Valor Alocado (R$) *</Label>
              <Input
                id="budgetAmount"
                type="number"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="budgetDescription">Descrição</Label>
              <Textarea
                id="budgetDescription"
                value={budgetDescription}
                onChange={(e) => setBudgetDescription(e.target.value)}
                placeholder="Descrição do orçamento..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setBudgetDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateBudget} disabled={processing}>
                {processing ? 'Criando...' : 'Criar Orçamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criar Transação */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Transação Financeira</DialogTitle>
            <DialogDescription>
              Registre uma receita ou despesa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionType">Tipo *</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger id="transactionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transactionCategory">Categoria *</Label>
                <Select value={transactionCategory} onValueChange={setTransactionCategory}>
                  <SelectTrigger id="transactionCategory">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="transactionDescription">Descrição *</Label>
              <Input
                id="transactionDescription"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                placeholder="Descrição da transação..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionAmount">Valor (R$) *</Label>
                <Input
                  id="transactionAmount"
                  type="number"
                  step="0.01"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="transactionDate">Data *</Label>
                <Input
                  id="transactionDate"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {transactionType === 'despesa' && budgets.length > 0 && (
              <div>
                <Label htmlFor="transactionBudget">Orçamento (opcional)</Label>
                <Select value={transactionBudgetId} onValueChange={setTransactionBudgetId}>
                  <SelectTrigger id="transactionBudget">
                    <SelectValue placeholder="Selecione o orçamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {budgets.map(budget => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {categoryLabels[budget.category]} - {formatCurrency(budget.remaining_amount)} restante
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="transactionNotes">Observações</Label>
              <Textarea
                id="transactionNotes"
                value={transactionNotes}
                onChange={(e) => setTransactionNotes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setTransactionDialogOpen(false);
                resetTransactionForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTransaction} disabled={processing}>
                {processing ? 'Criando...' : 'Criar Transação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

