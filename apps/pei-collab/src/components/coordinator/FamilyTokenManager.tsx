import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Shield,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveLayout, ResponsiveCard } from '@/components/shared/ResponsiveLayout';
import { GenerateFamilyTokenDialog } from './GenerateFamilyTokenDialog';

interface FamilyToken {
  id: string;
  student_id: string;
  pei_id: string;
  token_hash: string;
  expires_at: string;
  used: boolean;
  max_uses: number;
  current_uses: number;
  last_accessed_at?: string;
  created_by: string;
  created_at: string;
  student_name?: string;
  creator_name?: string;
}

interface FamilyTokenManagerProps {
  studentId?: string;
  peiId?: string;
  studentName?: string;
}

export function FamilyTokenManager({ studentId, peiId, studentName }: FamilyTokenManagerProps) {
  const [tokens, setTokens] = useState<FamilyToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'used'>('all');

  const loadTokens = async () => {
    try {
      setLoading(true);
      console.log('🔑 FamilyTokenManager: Carregando tokens...');
      console.log('📌 Filtros:', { studentId, peiId });

      let query = supabase
        .from('family_access_tokens')
        .select(`
          id,
          student_id,
          pei_id,
          token_hash,
          expires_at,
          used,
          max_uses,
          current_uses,
          last_accessed_at,
          created_by,
          created_at,
          students:student_id(name),
          profiles:created_by(full_name)
        `)
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (peiId) {
        query = query.eq('pei_id', peiId);
      }

      const { data, error } = await query;

      console.log('📊 Resultado da query:', { data, error });

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }

      const processedTokens: FamilyToken[] = data?.map((token) => {
        const studentRecord = Array.isArray(token.students) ? token.students[0] : token.students;
        const creatorRecord = Array.isArray(token.profiles) ? token.profiles[0] : token.profiles;

        return {
          ...token,
          student_name: studentRecord?.name,
          creator_name: creatorRecord?.full_name,
        };
      }) || [];

      console.log('✅ Tokens processados:', processedTokens.length);
      setTokens(processedTokens);
    } catch (error: any) {
      console.error('💥 Erro ao carregar tokens:', error);
      console.error('Detalhes:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('family_access_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;

      await loadTokens();
    } catch (error) {
      console.error('Erro ao deletar token:', error);
    }
  };

  const getTokenStatus = (token: FamilyToken) => {
    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    
    if (token.used) return 'used';
    if (expiresAt < now) return 'expired';
    if (token.current_uses >= token.max_uses) return 'exhausted';
    return 'active';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'used':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'exhausted':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Key className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'used':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'exhausted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'expired':
        return 'Expirado';
      case 'used':
        return 'Usado';
      case 'exhausted':
        return 'Esgotado';
      default:
        return 'Desconhecido';
    }
  };

  const filteredTokens = tokens.filter(token => {
    const status = getTokenStatus(token);
    const matchesSearch = !searchTerm || 
      token.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.creator_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    loadTokens();
  }, [studentId, peiId]);

  if (loading) {
    return (
      <ResponsiveCard className="flex items-center justify-center h-32">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando tokens...</p>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Key className="h-6 w-6" />
              Tokens de Acesso Familiar
            </h2>
            <p className="text-muted-foreground">
              {tokens.length} token{tokens.length !== 1 ? 's' : ''} encontrado{tokens.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {studentId && peiId && studentName && (
            <GenerateFamilyTokenDialog
              studentId={studentId}
              peiId={peiId}
              studentName={studentName}
              onTokenGenerated={loadTokens}
            />
          )}
        </div>

        {/* Filtros */}
        <ResponsiveCard>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por aluno ou criador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <Label htmlFor="filter">Status</Label>
              <select
                id="filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="expired">Expirados</option>
                <option value="used">Usados</option>
              </select>
            </div>
          </div>
        </ResponsiveCard>

        {/* Lista de Tokens */}
        <div className="space-y-4">
          {filteredTokens.map((token) => {
            const status = getTokenStatus(token);
            return (
              <ResponsiveCard key={token.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 ${getStatusColor(status)}`}
                      >
                        {getStatusIcon(status)}
                        {getStatusLabel(status)}
                      </Badge>
                      
                      <Badge variant="outline" className="font-mono text-xs">
                        {token.token_hash.substring(0, 8)}...
                      </Badge>
                    </div>

                    <h3 className="font-medium mb-1">
                      {token.student_name || 'Aluno não identificado'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Criado por {token.creator_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(token.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Expira em {new Date(token.expires_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Usos: {token.current_uses}/{token.max_uses}</span>
                      {token.last_accessed_at && (
                        <span>Último acesso: {new Date(token.last_accessed_at).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Implementar visualização do token
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Implementar link de acesso
                        const accessUrl = `${window.location.origin}/family/access?token=${token.token_hash}`;
                        navigator.clipboard.writeText(accessUrl);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteToken(token.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </ResponsiveCard>
            );
          })}
        </div>

        {filteredTokens.length === 0 && (
          <ResponsiveCard className="text-center py-8">
            <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum token encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all' 
                ? 'Nenhum token corresponde aos filtros aplicados.'
                : 'Nenhum token de acesso familiar foi criado ainda.'
              }
            </p>
          </ResponsiveCard>
        )}
      </div>
    </ResponsiveLayout>
  );
}