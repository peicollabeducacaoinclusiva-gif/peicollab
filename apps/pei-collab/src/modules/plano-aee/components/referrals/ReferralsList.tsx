// ============================================================================
// COMPONENTE: ReferralsList
// ============================================================================
// Lista de encaminhamentos com filtros por status e urgência
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useReferrals, useDeleteReferral } from '@/hooks/useReferrals';
import type { Referral } from '@/types/planoAEE.types';

interface ReferralsListProps {
  planId: string;
  onEditReferral?: (referral: Referral) => void;
  onViewReferral?: (referral: Referral) => void;
}

export function ReferralsList({ planId, onEditReferral, onViewReferral }: ReferralsListProps) {
  const { data: referrals, isLoading } = useReferrals(planId);
  const deleteReferral = useDeleteReferral();
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'concluidos'>('todos');

  const filteredReferrals = referrals?.filter(ref => {
    if (filter === 'pendentes') return ['rascunho', 'enviado', 'agendado', 'em_atendimento'].includes(ref.status);
    if (filter === 'concluidos') return ref.status === 'concluido';
    return true;
  }) || [];

  const handleDelete = async (referralId: string) => {
    if (!confirm('Tem certeza que deseja excluir este encaminhamento?')) return;
    
    try {
      await deleteReferral.mutateAsync({ id: referralId, planId });
    } catch (error) {
      console.error('Erro ao excluir encaminhamento:', error);
      alert('Erro ao excluir encaminhamento.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      rascunho: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rascunho' },
      enviado: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Enviado' },
      agendado: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Agendado' },
      em_atendimento: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Em Atendimento' },
      concluido: { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluído' },
      cancelado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
      sem_resposta: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Sem Resposta' },
    };
    const badge = badges[status] || badges.rascunho;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      baixa: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '🔵' },
      media: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '🟡' },
      alta: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '🟠' },
      urgente: { bg: 'bg-red-50', text: 'text-red-700', icon: '🔴' },
    };
    const badge = badges[urgency] || badges.media;
    return (
      <span className={`px-2 py-1 text-xs rounded ${badge.bg} ${badge.text}`}>
        {badge.icon} {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando encaminhamentos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === 'todos' ? 'default' : 'outline'}
          onClick={() => setFilter('todos')}
        >
          Todos ({referrals?.length || 0})
        </Button>
        <Button
          size="sm"
          variant={filter === 'pendentes' ? 'default' : 'outline'}
          onClick={() => setFilter('pendentes')}
        >
          Pendentes ({referrals?.filter(r => 
            ['rascunho', 'enviado', 'agendado', 'em_atendimento'].includes(r.status)
          ).length || 0})
        </Button>
        <Button
          size="sm"
          variant={filter === 'concluidos' ? 'default' : 'outline'}
          onClick={() => setFilter('concluidos')}
        >
          Concluídos ({referrals?.filter(r => r.status === 'concluido').length || 0})
        </Button>
      </div>

      {/* Lista */}
      {filteredReferrals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum encaminhamento encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReferrals.map((referral) => (
            <div
              key={referral.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">
                      {referral.specialist_type}
                    </h4>
                    {getStatusBadge(referral.status)}
                    {getUrgencyBadge(referral.urgency_level)}
                  </div>
                  
                  {referral.specialist_name && (
                    <p className="text-sm text-gray-600">
                      👨‍⚕️ {referral.specialist_name}
                      {referral.institution && ` - ${referral.institution}`}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-600">
                    📅 Encaminhado em: {new Date(referral.referral_date).toLocaleDateString('pt-BR')}
                  </p>
                  
                  {referral.appointment_date && (
                    <p className="text-sm text-blue-600">
                      📌 Consulta: {new Date(referral.appointment_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {onViewReferral && (
                    <Button size="sm" variant="outline" onClick={() => onViewReferral(referral)}>
                      Ver
                    </Button>
                  )}
                  {['rascunho', 'enviado'].includes(referral.status) && onEditReferral && (
                    <Button size="sm" variant="outline" onClick={() => onEditReferral(referral)}>
                      Editar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(referral.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              {/* Motivo */}
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Motivo:</strong> {referral.reason.slice(0, 150)}
                  {referral.reason.length > 150 && '...'}
                </p>
              </div>

              {/* Feedback do Especialista */}
              {referral.specialist_feedback && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                  <p className="text-xs font-semibold text-green-800 mb-1">
                    ✅ Retorno do Especialista
                  </p>
                  <p className="text-sm text-gray-700">
                    {referral.specialist_feedback.slice(0, 150)}
                    {referral.specialist_feedback.length > 150 && '...'}
                  </p>
                  {referral.feedback_received_date && (
                    <p className="text-xs text-gray-600 mt-1">
                      Recebido em: {new Date(referral.feedback_received_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )}

              {/* Status de Integração */}
              {referral.integrated_to_plan && (
                <div className="mt-2">
                  <p className="text-xs text-green-600">
                    ✅ Recomendações integradas ao plano de AEE
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}































