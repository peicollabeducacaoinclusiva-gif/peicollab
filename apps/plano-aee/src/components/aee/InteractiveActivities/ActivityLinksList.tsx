// ============================================================================
// COMPONENTE: ActivityLinksList
// ============================================================================
// Lista de atividades interativas vinculadas do App Atividades
// Data: 2025-02-20
// ============================================================================

import { useState } from 'react';
import { useActivityLinks } from '../../../hooks/useInteractiveActivities';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, Plus, Star, Edit, Trash2 } from 'lucide-react';
import type { ActivityType, ActivityUsageContext } from '../../../types/interactiveResources.types';
import { ActivityLinkForm } from './ActivityLinkForm';

interface ActivityLinksListProps {
  planId: string;
  studentId?: string;
}

export function ActivityLinksList({
  planId,
  studentId,
}: ActivityLinksListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);

  const filters = {
    student_id: studentId,
  };

  const {
    links,
    isLoading,
    deleteLink,
    isDeleting,
  } = useActivityLinks(planId, filters);

  const handleEdit = (linkId: string) => {
    setEditingLink(linkId);
    setShowForm(true);
  };

  const handleDelete = async (linkId: string) => {
    if (confirm('Tem certeza que deseja remover este vínculo de atividade?')) {
      deleteLink.mutate(linkId);
    }
  };

  const getTypeLabel = (type?: ActivityType) => {
    if (!type) return 'N/A';
    const labels: Record<ActivityType, string> = {
      game: 'Jogo',
      quiz: 'Quiz',
      simulation: 'Simulação',
      story: 'História',
      exercise: 'Exercício',
      other: 'Outro',
    };
    return labels[type] || type;
  };

  const getContextLabel = (context?: ActivityUsageContext) => {
    if (!context) return 'N/A';
    const labels: Record<ActivityUsageContext, string> = {
      individual_aee: 'AEE Individual',
      group_aee: 'AEE em Grupo',
      co_teaching: 'Co-ensino',
      homework: 'Tarefa de Casa',
      assessment: 'Avaliação',
    };
    return labels[context] || context;
  };

  if (showForm) {
    return (
      <ActivityLinkForm
        planId={planId}
        studentId={studentId}
        linkId={editingLink || undefined}
        onClose={() => {
          setShowForm(false);
          setEditingLink(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setEditingLink(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Atividades Interativas Vinculadas</CardTitle>
            <CardDescription>
              Atividades do App Atividades adaptadas para uso no AEE
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Vincular Atividade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando atividades...
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade vinculada.
            <br />
            <Button
              variant="link"
              onClick={() => setShowForm(true)}
              className="mt-2"
            >
              Vincular primeira atividade
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contexto</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Eficácia</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{link.activity_name}</span>
                        {link.activity_url && (
                          <a
                            href={link.activity_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(link.activity_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getContextLabel(link.used_in_context)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {link.usage_count}x usado
                      </span>
                    </TableCell>
                    <TableCell>
                      {link.effectiveness_rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{link.effectiveness_rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(link.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(link.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

