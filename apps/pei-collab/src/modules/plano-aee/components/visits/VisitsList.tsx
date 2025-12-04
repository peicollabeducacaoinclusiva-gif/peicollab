// ============================================================================
// COMPONENTE: VisitsList
// ============================================================================
// Lista de visitas escolares com filtros e ações
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSchoolVisits, useDeleteSchoolVisit } from '@/hooks/useSchoolVisits';
import type { SchoolVisit } from '@/types/planoAEE.types';

interface VisitsListProps {
  planId: string;
  onEditVisit?: (visit: SchoolVisit) => void;
  onViewVisit?: (visit: SchoolVisit) => void;
}

export function VisitsList({ planId, onEditVisit, onViewVisit }: VisitsListProps) {
  const { data: visits, isLoading } = useSchoolVisits(planId);
  const deleteVisit = useDeleteSchoolVisit();
  const [filter, setFilter] = useState<'todas' | 'realizadas' | 'pendentes'>('todas');

  const filteredVisits = visits?.filter(visit => {
    if (filter === 'realizadas') return visit.status === 'realizada';
    if (filter === 'pendentes') return visit.status === 'rascunho';
    return true;
  }) || [];

  const handleDelete = async (visitId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta visita?')) return;
    
    try {
      await deleteVisit.mutateAsync({ id: visitId, planId });
    } catch (error) {
      console.error('Erro ao excluir visita:', error);
      alert('Erro ao excluir visita.');
    }
  };

  const getVisitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      diagnostica: 'Diagnóstica',
      acompanhamento: 'Acompanhamento',
      orientacao: 'Orientação',
      avaliacao: 'Avaliação',
      outra: 'Outra',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      rascunho: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      realizada: { bg: 'bg-green-100', text: 'text-green-800', label: 'Realizada' },
      cancelada: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
    };
    const badge = badges[status] || badges.rascunho;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando visitas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === 'todas' ? 'default' : 'outline'}
          onClick={() => setFilter('todas')}
        >
          Todas ({visits?.length || 0})
        </Button>
        <Button
          size="sm"
          variant={filter === 'realizadas' ? 'default' : 'outline'}
          onClick={() => setFilter('realizadas')}
        >
          Realizadas ({visits?.filter(v => v.status === 'realizada').length || 0})
        </Button>
        <Button
          size="sm"
          variant={filter === 'pendentes' ? 'default' : 'outline'}
          onClick={() => setFilter('pendentes')}
        >
          Pendentes ({visits?.filter(v => v.status === 'rascunho').length || 0})
        </Button>
      </div>

      {/* Lista */}
      {filteredVisits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma visita encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVisits.map((visit) => (
            <div
              key={visit.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      {getVisitTypeLabel(visit.visit_type)}
                    </h4>
                    {getStatusBadge(visit.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    📅 {new Date(visit.visit_date).toLocaleDateString('pt-BR')}
                    {visit.visit_time && ` às ${visit.visit_time}`}
                    • ⏱️ {visit.duration_minutes} min
                  </p>
                </div>
                <div className="flex gap-2">
                  {onViewVisit && (
                    <Button size="sm" variant="outline" onClick={() => onViewVisit(visit)}>
                      Ver
                    </Button>
                  )}
                  {visit.status === 'rascunho' && onEditVisit && (
                    <Button size="sm" variant="outline" onClick={() => onEditVisit(visit)}>
                      Editar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(visit.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              {visit.observations && (
                <p className="text-sm text-gray-700 mt-2">
                  {visit.observations.slice(0, 150)}
                  {visit.observations.length > 150 && '...'}
                </p>
              )}

              {visit.orientations_given && visit.orientations_given.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600">
                    💡 {visit.orientations_given.length} orientação(ões) fornecida(s)
                  </p>
                </div>
              )}

              {visit.follow_up_date && (
                <p className="text-xs text-blue-600 mt-2">
                  📌 Follow-up: {new Date(visit.follow_up_date).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


