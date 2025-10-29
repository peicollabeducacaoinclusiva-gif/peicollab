import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, 
  Eye, 
  Download, 
  Compare, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveLayout, ResponsiveCard } from '@/components/shared/ResponsiveLayout';

interface PEIVersion {
  id: string;
  version_number: number;
  status: string;
  changed_by: string;
  changed_at: string;
  change_type: string;
  change_summary: string;
  is_active_version: boolean;
  diagnosis_data?: any;
  planning_data?: any;
  evaluation_data?: any;
}

interface PEIVersionHistoryProps {
  peiId: string;
  onVersionSelect?: (version: PEIVersion) => void;
  onCompare?: (version1: PEIVersion, version2: PEIVersion) => void;
}

export function PEIVersionHistory({ peiId, onVersionSelect, onCompare }: PEIVersionHistoryProps) {
  const [versions, setVersions] = useState<PEIVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<PEIVersion[]>([]);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('pei_history')
        .select(`
          id,
          version_number,
          changed_by,
          changed_at,
          change_type,
          change_summary,
          status,
          diagnosis_data,
          planning_data,
          evaluation_data
        `)
        .eq('pei_id', peiId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      // Buscar informações dos usuários que fizeram as alterações
      const userIds = [...new Set(data?.map(v => v.changed_by) || [])];
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      const userMap = new Map(users?.map(u => [u.id, u.full_name]) || []);

      const processedVersions: PEIVersion[] = data?.map(version => ({
        ...version,
        changed_by: userMap.get(version.changed_by) || 'Usuário desconhecido',
        is_active_version: version.status === 'approved'
      })) || [];

      setVersions(processedVersions);
    } catch (error) {
      console.error('Erro ao carregar histórico de versões:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [peiId]);

  const handleVersionSelect = (version: PEIVersion) => {
    if (selectedVersions.length === 0) {
      setSelectedVersions([version]);
    } else if (selectedVersions.length === 1) {
      if (selectedVersions[0].id === version.id) {
        setSelectedVersions([]);
      } else {
        setSelectedVersions([...selectedVersions, version]);
      }
    } else {
      setSelectedVersions([version]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      onCompare?.(selectedVersions[0], selectedVersions[1]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'returned':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'returned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <ResponsiveCard className="flex items-center justify-center h-32">
        <div className="text-center">
          <History className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando histórico...</p>
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
              <History className="h-6 w-6" />
              Histórico de Versões
            </h2>
            <p className="text-muted-foreground">
              {versions.length} versão{versions.length !== 1 ? 'ões' : ''} encontrada{versions.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {selectedVersions.length === 2 && (
            <Button onClick={handleCompare} className="flex items-center gap-2">
              <Compare className="h-4 w-4" />
              Comparar Versões
            </Button>
          )}
        </div>

        {/* Lista de versões */}
        <div className="space-y-4">
          {versions.map((version) => (
            <ResponsiveCard 
              key={version.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedVersions.some(v => v.id === version.id) 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : ''
              }`}
              onClick={() => handleVersionSelect(version)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      v{version.version_number}
                    </Badge>
                    
                    <Badge 
                      variant="outline" 
                      className={`flex items-center gap-1 ${getStatusColor(version.status)}`}
                    >
                      {getStatusIcon(version.status)}
                      {version.status === 'approved' ? 'Aprovado' :
                       version.status === 'pending' ? 'Pendente' :
                       version.status === 'returned' ? 'Devolvido' : version.status}
                    </Badge>

                    {version.is_active_version && (
                      <Badge variant="default" className="bg-green-600">
                        Ativa
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-medium mb-1">
                    {version.change_summary || `Versão ${version.version_number}`}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {version.changed_by}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(version.changed_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVersionSelect?.(version);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Implementar download
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </ResponsiveCard>
          ))}
        </div>

        {versions.length === 0 && (
          <ResponsiveCard className="text-center py-8">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma versão encontrada</h3>
            <p className="text-muted-foreground">
              O histórico de versões será exibido aqui quando houver alterações no PEI.
            </p>
          </ResponsiveCard>
        )}
      </div>
    </ResponsiveLayout>
  );
}


