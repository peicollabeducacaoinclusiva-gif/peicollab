import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: any;
  new_values: any;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  tenant_id: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  tenant_name: string | null;
}

interface AuditLogsViewerProps {
  tenantId?: string | null;
  limit?: number;
  showFilters?: boolean;
}

export function AuditLogsViewer({ 
  tenantId, 
  limit = 50, 
  showFilters = true 
}: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const { toast } = useToast();

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      // Tentar usar a função RPC primeiro
      let { data, error } = await supabase.rpc("get_audit_logs", {
        p_tenant_id: tenantId,
        p_limit: limit,
        p_offset: 0
      });

      // Se a função RPC falhar, usar consulta direta
      if (error) {
        console.warn("Função RPC não encontrada, usando consulta direta:", error);
        
        let query = supabase
          .from("audit_logs")
          .select(`
            id,
            action,
            resource_type,
            resource_id,
            old_values,
            new_values,
            metadata,
            ip_address,
            user_agent,
            tenant_id,
            created_at,
            profiles!audit_logs_user_id_fkey(full_name),
            tenants!audit_logs_tenant_id_fkey(name)
          `)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (tenantId) {
          query = query.eq("tenant_id", tenantId);
        }

        const result = await query;
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      
      // Transformar dados se necessário
      const transformedData = (data || []).map(log => ({
        ...log,
        user_name: log.profiles?.full_name || 'Sistema',
        user_email: null, // Não disponível na consulta direta
        tenant_name: log.tenants?.name || 'Sistema'
      }));
      
      setLogs(transformedData);
    } catch (error: any) {
      console.error("Erro ao carregar logs:", error);
      toast({
        title: "Erro ao carregar logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [tenantId, limit]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.metadata?.message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesResource = resourceFilter === "all" || log.resource_type === resourceFilter;
    
    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      case 'login': return 'outline';
      default: return 'secondary';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Criado';
      case 'update': return 'Atualizado';
      case 'delete': return 'Excluído';
      case 'delete': return 'Excluído';
      case 'login': return 'Login';
      case 'logout': return 'Logout';
      default: return action;
    }
  };

  const getResourceLabel = (resourceType: string) => {
    switch (resourceType) {
      case 'student': return 'Aluno';
      case 'pei': return 'PEI';
      case 'user': return 'Usuário';
      case 'tenant': return 'Escola';
      case 'family_access': return 'Acesso Familiar';
      default: return resourceType;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>Carregando registros...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logs de Auditoria</CardTitle>
            <CardDescription>
              Registro de todas as ações realizadas no sistema
              {tenantId && " da escola selecionada"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
        
        {showFilters && (
          <div className="flex gap-2 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por usuário, tipo ou mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="create">Criar</SelectItem>
                <SelectItem value="update">Atualizar</SelectItem>
                <SelectItem value="delete">Excluir</SelectItem>
                <SelectItem value="login">Login</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="student">Aluno</SelectItem>
                <SelectItem value="pei">PEI</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="tenant">Escola</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum log de auditoria encontrado</p>
            {searchTerm && (
              <p className="text-sm mt-2">
                Tente ajustar os filtros de busca
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                      <Badge variant="outline">
                        {getResourceLabel(log.resource_type)}
                      </Badge>
                      {log.tenant_name && (
                        <Badge variant="secondary" className="text-xs">
                          {log.tenant_name}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Usuário:</strong> {log.user_name || 'Sistema'}
                        {log.user_email && (
                          <span className="text-muted-foreground ml-2">({log.user_email})</span>
                        )}
                      </p>
                      <p>
                        <strong>Data:</strong> {new Date(log.created_at).toLocaleString('pt-BR')}
                      </p>
                      {log.ip_address && (
                        <p><strong>IP:</strong> {log.ip_address}</p>
                      )}
                      {log.metadata?.message && (
                        <p><strong>Detalhes:</strong> {log.metadata.message}</p>
                      )}
                      {log.resource_id && (
                        <p className="text-xs text-muted-foreground">
                          <strong>ID do Recurso:</strong> {log.resource_id}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground ml-4">
                    {new Date(log.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
