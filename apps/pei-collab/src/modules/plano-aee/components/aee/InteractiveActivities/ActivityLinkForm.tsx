// ============================================================================
// COMPONENTE: ActivityLinkForm
// ============================================================================
// Formulário para vincular atividade do App Atividades ao Plano AEE
// Data: 2025-02-20
// ============================================================================

import { useState, useEffect } from 'react';
import { useActivityLinks } from '../../../hooks/useInteractiveActivities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  CreateActivityLinkInput,
  ActivityType,
  ActivityUsageContext,
} from '../../../types/interactiveResources.types';

interface ActivityLinkFormProps {
  planId: string;
  studentId?: string;
  linkId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActivityLinkForm({
  planId,
  studentId,
  linkId,
  onClose,
  onSuccess,
}: ActivityLinkFormProps) {
  const { links, createLink, updateLink } = useActivityLinks(planId);

  const [formData, setFormData] = useState<CreateActivityLinkInput>({
    plan_id: planId,
    activity_id: '',
    activity_name: '',
    activity_type: 'game',
    activity_url: '',
    adaptations_made: [],
    target_disabilities: [],
    target_skills: [],
    accessibility_adaptations: [],
    used_in_context: 'individual_aee',
    student_id: studentId,
  });

  // Carregar dados do link se estiver editando
  useEffect(() => {
    if (linkId) {
      const link = links.find((l) => l.id === linkId);
      if (link) {
        setFormData({
          plan_id: link.plan_id,
          activity_id: link.activity_id,
          activity_name: link.activity_name,
          activity_type: link.activity_type,
          activity_url: link.activity_url || undefined,
          adaptations_made: link.adaptations_made,
          target_disabilities: link.target_disabilities,
          target_skills: link.target_skills,
          accessibility_adaptations: link.accessibility_adaptations,
          used_in_context: link.used_in_context,
          student_id: link.student_id || undefined,
        });
      }
    }
  }, [linkId, links]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (linkId) {
      updateLink.mutate(
        {
          id: linkId,
          input: {
            adaptations_made: formData.adaptations_made,
            target_disabilities: formData.target_disabilities,
            target_skills: formData.target_skills,
            accessibility_adaptations: formData.accessibility_adaptations,
            used_in_context: formData.used_in_context,
            effectiveness_rating: formData.effectiveness_rating,
            student_response: formData.student_response,
            effectiveness_feedback: formData.effectiveness_feedback,
          },
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } else {
      createLink.mutate(formData, {
        onSuccess: () => {
          onSuccess();
        },
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {linkId ? 'Editar Vínculo de Atividade' : 'Vincular Atividade do App Atividades'}
          </DialogTitle>
          <DialogDescription>
            Vincule uma atividade do App Atividades ao Plano AEE com adaptações específicas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity_id">ID da Atividade no App Atividades *</Label>
            <Input
              id="activity_id"
              value={formData.activity_id}
              onChange={(e) =>
                setFormData({ ...formData, activity_id: e.target.value })
              }
              required
              placeholder="UUID ou ID da atividade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_name">Nome da Atividade *</Label>
            <Input
              id="activity_name"
              value={formData.activity_name}
              onChange={(e) =>
                setFormData({ ...formData, activity_name: e.target.value })
              }
              required
              placeholder="Ex: Jogo de Matemática Adaptado"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity_type">Tipo de Atividade</Label>
              <Select
                value={formData.activity_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, activity_type: value as ActivityType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="game">Jogo</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="simulation">Simulação</SelectItem>
                  <SelectItem value="story">História</SelectItem>
                  <SelectItem value="exercise">Exercício</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="used_in_context">Contexto de Uso</Label>
              <Select
                value={formData.used_in_context}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    used_in_context: value as ActivityUsageContext,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual_aee">AEE Individual</SelectItem>
                  <SelectItem value="group_aee">AEE em Grupo</SelectItem>
                  <SelectItem value="co_teaching">Co-ensino</SelectItem>
                  <SelectItem value="homework">Tarefa de Casa</SelectItem>
                  <SelectItem value="assessment">Avaliação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_url">URL da Atividade (Opcional)</Label>
            <Input
              id="activity_url"
              type="url"
              value={formData.activity_url || ''}
              onChange={(e) =>
                setFormData({ ...formData, activity_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_disabilities">Deficiências Alvo (separadas por vírgula)</Label>
            <Input
              id="target_disabilities"
              value={formData.target_disabilities?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  target_disabilities: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Ex: TEA, Deficiência Visual, TDAH"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createLink.isPending || updateLink.isPending}>
              {linkId ? 'Atualizar' : 'Vincular'} Atividade
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


