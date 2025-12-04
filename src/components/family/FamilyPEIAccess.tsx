import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { auditMiddleware } from '@pei/database/audit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Heart,
  Shield,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveLayout, ResponsiveCard } from '@/components/shared/ResponsiveLayout';

interface FamilyPEIAccessProps {
  token: string;
}

interface PEIData {
  id: string;
  student_name: string;
  student_date_of_birth: string;
  school_name: string;
  status: string;
  diagnosis_data?: any;
  planning_data?: any;
  evaluation_data?: any;
  family_approved_at?: string;
  family_approved_by?: string;
  created_at: string;
  updated_at: string;
}

export function FamilyPEIAccess({ token }: FamilyPEIAccessProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [peiData, setPeiData] = useState<PEIData | null>(null);
  const [familyFeedback, setFamilyFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateToken = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar token
      const { data: tokenData, error: tokenError } = await supabase
        .from('family_access_tokens')
        .select(`
          id,
          student_id,
          pei_id,
          expires_at,
          used,
          max_uses,
          current_uses,
          students:student_id(
            name,
            date_of_birth,
            schools:school_id(name)
          ),
          peis:pei_id(
            id,
            status,
            diagnosis_data,
            planning_data,
            evaluation_data,
            family_approved_at,
            family_approved_by,
            created_at,
            updated_at
          )
        `)
        .eq('token_hash', token)
        .single();

      if (tokenError) throw tokenError;

      // Verificar se token está válido
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      
      if (tokenData.used) {
        throw new Error('Este token já foi utilizado e não pode ser usado novamente.');
      }
      
      if (expiresAt < now) {
        throw new Error('Este token expirou e não pode ser usado.');
      }
      
      if (tokenData.current_uses >= tokenData.max_uses) {
        throw new Error('Este token atingiu o limite máximo de usos.');
      }

      // Atualizar contador de usos
      await supabase
        .from('family_access_tokens')
        .update({
          current_uses: tokenData.current_uses + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);

      // Processar dados do PEI
      const pei = tokenData.peis;
      const student = tokenData.students;
      
      setPeiData({
        id: pei.id,
        student_name: student.name,
        student_date_of_birth: student.date_of_birth,
        school_name: student.schools?.name || 'Escola não identificada',
        status: pei.status,
        diagnosis_data: pei.diagnosis_data,
        planning_data: pei.planning_data,
        evaluation_data: pei.evaluation_data,
        family_approved_at: pei.family_approved_at,
        family_approved_by: pei.family_approved_by,
        created_at: pei.created_at,
        updated_at: pei.updated_at
      });

      // Gravar auditoria de acesso da família (dados sensíveis)
      if (pei.id && student?.school_id) {
        // Obter tenant_id do estudante
        const { data: studentFull } = await supabase
          .from('students')
          .select('tenant_id')
          .eq('id', tokenData.student_id)
          .single();

        if (studentFull?.tenant_id) {
          await auditMiddleware.logRead(
            studentFull.tenant_id,
            'pei',
            pei.id,
            {
              source: 'family_access',
              access_method: 'token',
              token_id: tokenData.id,
              student_id: tokenData.student_id,
              student_name: student.name,
            }
          ).catch(err => console.error('Erro ao gravar auditoria de acesso da família:', err));
        }
      }

    } catch (err) {
      console.error('Erro ao validar token:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Reportar erro crítico de acesso de família
      if (typeof window !== 'undefined') {
        import('@/lib/errorReporting').then(({ reportSensitiveDataAccessError }) => {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          reportSensitiveDataAccessError(errorObj, {
            operation: 'read',
            entityType: 'pei',
            tenantId: undefined, // Será obtido após validar token
          }).catch(reportErr => console.error('Erro ao reportar erro de acesso de família:', reportErr));
        }).catch(importErr => console.error('Erro ao importar errorReporting:', importErr));
      }
    } finally {
      setLoading(false);
    }
  };

  const submitFamilyFeedback = async () => {
    try {
      setIsSubmitting(true);
      
      // Aqui você implementaria o envio do feedback da família
      // Por enquanto, apenas simular
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular sucesso
      setFamilyFeedback('');
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  if (loading) {
    return (
      <ResponsiveLayout>
        <ResponsiveCard className="flex items-center justify-center h-64">
          <div className="text-center">
            <Key className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Validando acesso...</p>
            <p className="text-sm text-muted-foreground">Aguarde um momento</p>
          </div>
        </ResponsiveCard>
      </ResponsiveLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveLayout>
        <ResponsiveCard className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-red-800">Erro de Acesso</h2>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <p className="text-sm text-red-600">
            Entre em contato com a escola para obter um novo token de acesso.
          </p>
        </ResponsiveCard>
      </ResponsiveLayout>
    );
  }

  if (!peiData) {
    return (
      <ResponsiveLayout>
        <ResponsiveCard className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Dados não encontrados</h3>
          <p className="text-muted-foreground">
            Não foi possível carregar as informações do PEI.
          </p>
        </ResponsiveCard>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">PEI Collab</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Acesso Familiar ao Plano Educacional Individualizado
          </p>
        </div>

        {/* Informações do Aluno */}
        <ResponsiveCard className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <User className="h-5 w-5" />
              Informações do Aluno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-blue-700">Nome</Label>
                <p className="text-lg font-semibold text-blue-900">{peiData.student_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-blue-700">Escola</Label>
                <p className="text-lg font-semibold text-blue-900">{peiData.school_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="bg-green-100 text-green-800 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Acesso Autorizado
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Atualizado em {new Date(peiData.updated_at).toLocaleDateString('pt-BR')}
              </Badge>
            </div>
          </CardContent>
        </ResponsiveCard>

        {/* Status do PEI */}
        <ResponsiveCard>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Status do PEI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800">Aprovado</h3>
                <p className="text-sm text-green-600">PEI em andamento</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-800">Metas Ativas</h3>
                <p className="text-sm text-blue-600">Sendo trabalhadas</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-800">Progresso</h3>
                <p className="text-sm text-purple-600">Acompanhamento contínuo</p>
              </div>
            </div>
          </CardContent>
        </ResponsiveCard>

        {/* Resumo do PEI */}
        <ResponsiveCard>
          <CardHeader>
            <CardTitle className="text-lg">Resumo do PEI</CardTitle>
            <CardDescription>
              Informações sobre o plano educacional do seu filho
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Objetivos Principais</h4>
              <p className="text-sm text-muted-foreground">
                O PEI foi desenvolvido para apoiar o desenvolvimento educacional do seu filho, 
                identificando suas necessidades específicas e criando estratégias personalizadas 
                para maximizar seu potencial de aprendizado.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Estratégias de Apoio</h4>
              <p className="text-sm text-muted-foreground">
                O plano inclui estratégias específicas para o desenvolvimento de habilidades 
                acadêmicas e funcionais, com acompanhamento regular e ajustes conforme necessário.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Participação da Família</h4>
              <p className="text-sm text-muted-foreground">
                Sua participação é fundamental para o sucesso do plano. O acompanhamento em casa 
                e a comunicação com a escola são essenciais para o desenvolvimento do seu filho.
              </p>
            </div>
          </CardContent>
        </ResponsiveCard>

        {/* Feedback da Família */}
        <ResponsiveCard>
          <CardHeader>
            <CardTitle className="text-lg">Seu Feedback</CardTitle>
            <CardDescription>
              Compartilhe suas observações sobre o progresso do seu filho
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="familyFeedback">Observações</Label>
              <textarea
                id="familyFeedback"
                placeholder="Compartilhe suas observações sobre o progresso do seu filho em casa..."
                value={familyFeedback}
                onChange={(e) => setFamilyFeedback(e.target.value)}
                className="w-full min-h-[100px] p-3 border border-input rounded-md resize-none"
              />
            </div>
            
            <Button 
              onClick={submitFamilyFeedback}
              disabled={isSubmitting || !familyFeedback.trim()}
              className="w-full"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </CardContent>
        </ResponsiveCard>

        {/* Informações de Segurança */}
        <ResponsiveCard className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <Shield className="h-5 w-5" />
              Acesso Seguro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Conexão Segura</p>
                <p className="text-xs text-green-700">
                  Sua conexão está protegida com criptografia SSL.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Dados Protegidos</p>
                <p className="text-xs text-green-700">
                  Todas as informações são tratadas com confidencialidade.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Acesso Temporário</p>
                <p className="text-xs text-green-700">
                  Este token expira automaticamente por segurança.
                </p>
              </div>
            </div>
          </CardContent>
        </ResponsiveCard>
      </div>
    </ResponsiveLayout>
  );
}


