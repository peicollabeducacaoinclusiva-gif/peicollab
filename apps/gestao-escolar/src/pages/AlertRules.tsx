import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { AlertTriangle, Plus, Trash2, ToggleLeft, ToggleRight, Download } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useToast } from '@/components/ui/use-toast';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';
import { PageHeader } from '@/components/PageHeader';

interface AlertRule {
  id: string;
  rule_name: string;
  rule_description: string;
  rule_code: string;
  entity_type: string;
  condition_type: string;
  condition_config: any;
  alert_type: 'critical' | 'warning' | 'info';
  alert_message_template: string;
  notification_channels: string[];
  target_roles: string[];
  target_schools: string[] | null;
  check_frequency: string;
  is_active: boolean;
  created_at: string;
}

export default function AlertRules() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [_dialogOpen, setDialogOpen] = useState(false);
  const [_editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const { toast } = useToast();

  const loadRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules((data || []) as AlertRule[]);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar regras: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.rule_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
      (filterType === 'active' && rule.is_active) ||
      (filterType === 'inactive' && !rule.is_active);
    return matchesSearch && matchesFilter;
  });

  const handleToggleActive = async (rule: AlertRule) => {
    try {
      const { error } = await supabase
        .from('alert_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Regra ${rule.is_active ? 'desativada' : 'ativada'} com sucesso`,
      });

      loadRules();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar regra: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (rule: AlertRule) => {
    if (!confirm(`Tem certeza que deseja excluir a regra "${rule.rule_name}"?`)) return;

    try {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', rule.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Regra excluída com sucesso',
      });

      loadRules();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir regra: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTestRule = async (rule: AlertRule) => {
    try {
      const { data, error } = await supabase.rpc('check_and_generate_alerts', {
        p_rule_id: rule.id,
      });

      if (error) throw error;

      toast({
        title: 'Teste executado',
        description: `${data || 0} alerta(s) gerado(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao testar regra: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const exportRulesCSV = () => {
    const headers = [
      'Código',
      'Nome',
      'Descrição',
      'Tipo de Entidade',
      'Tipo de Condição',
      'Tipo de Alerta',
      'Canais de Notificação',
      'Roles Alvo',
      'Frequência',
      'Status',
    ];

    const rows = filteredRules.map(rule => [
      rule.rule_code,
      rule.rule_name,
      rule.rule_description,
      rule.entity_type,
      rule.condition_type,
      rule.alert_type,
      rule.notification_channels.join(', '),
      rule.target_roles.join(', '),
      rule.check_frequency,
      rule.is_active ? 'Ativa' : 'Inativa',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const filename = `regras-alertas_${formatTimestampForFilename()}.csv`;
    downloadTextFile(csv, filename, 'text/csv');

    toast({
      title: 'Sucesso',
      description: 'CSV exportado com sucesso',
    });
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'info': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Gerenciar Regras de Alertas"
          description="Configure e gerencie as regras automáticas de alertas do sistema"
          actions={
            <>
              <Button variant="outline" onClick={exportRulesCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button onClick={() => { setEditingRule(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </>
          }
        />

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Regras */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando regras...</p>
          </div>
        ) : filteredRules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma regra encontrada</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                        <Badge className={getAlertTypeColor(rule.alert_type)}>
                          {rule.alert_type}
                        </Badge>
                        {rule.is_active ? (
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inativa</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.rule_description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Código: {rule.rule_code}</span>
                        <span>Entidade: {rule.entity_type}</span>
                        <span>Frequência: {rule.check_frequency}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestRule(rule)}
                        title="Testar regra"
                      >
                        Testar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(rule)}
                        title={rule.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {rule.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Canais</Label>
                      <p>{rule.notification_channels.join(', ')}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Roles Alvo</Label>
                      <p>{rule.target_roles.join(', ')}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tipo de Condição</Label>
                      <p>{rule.condition_type}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Criada em</Label>
                      <p>{new Date(rule.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

