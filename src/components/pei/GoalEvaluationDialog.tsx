"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { CheckCircle2, TrendingUp } from "lucide-react"

interface GoalEvaluation {
  current_status?: string
  achieved_percentage?: number
  evaluation_date?: string
  evaluator?: string
  evidence?: string
  next_actions?: string
}

interface Goal {
  id?: string
  description: string
  category?: "academic" | "functional"
  target_date?: string
  evaluation?: GoalEvaluation
}

interface GoalEvaluationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal
  goalIndex: number
  onSave: (goalIndex: number, evaluation: GoalEvaluation) => void
}

export function GoalEvaluationDialog({
  open,
  onOpenChange,
  goal,
  goalIndex,
  onSave,
}: GoalEvaluationDialogProps) {
  const [evaluation, setEvaluation] = useState<GoalEvaluation>(
    goal.evaluation || {
      achieved_percentage: 0,
      evaluation_date: new Date().toISOString().split("T")[0],
      evaluator: "",
      current_status: "",
      evidence: "",
      next_actions: "",
    }
  )

  const handleSave = () => {
    onSave(goalIndex, evaluation)
    onOpenChange(false)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600"
    if (percentage >= 50) return "text-blue-600"
    if (percentage >= 25) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressLabel = (percentage: number) => {
    if (percentage >= 75) return "Excelente progresso"
    if (percentage >= 50) return "Bom progresso"
    if (percentage >= 25) return "Progresso moderado"
    return "Necessita maior atenção"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Avaliar Meta
          </DialogTitle>
          <DialogDescription>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {goal.category === "academic" ? "📚 Meta Acadêmica" : "🎯 Meta Funcional"}
              </p>
              <p className="text-sm mt-1">{goal.description}</p>
              {goal.target_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Data alvo: {new Date(goal.target_date).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Percentual de Alcance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Percentual de Alcance</Label>
              <div className="flex items-center gap-2">
                <TrendingUp className={`h-4 w-4 ${getProgressColor(evaluation.achieved_percentage || 0)}`} />
                <span className={`text-2xl font-bold ${getProgressColor(evaluation.achieved_percentage || 0)}`}>
                  {evaluation.achieved_percentage || 0}%
                </span>
              </div>
            </div>
            <Slider
              value={[evaluation.achieved_percentage || 0]}
              onValueChange={(value) =>
                setEvaluation({ ...evaluation, achieved_percentage: value[0] })
              }
              max={100}
              step={5}
              className="w-full"
            />
            <p className={`text-sm ${getProgressColor(evaluation.achieved_percentage || 0)}`}>
              {getProgressLabel(evaluation.achieved_percentage || 0)}
            </p>
          </div>

          {/* Data da Avaliação */}
          <div className="space-y-2">
            <Label>Data da Avaliação *</Label>
            <Input
              type="date"
              value={evaluation.evaluation_date || ""}
              onChange={(e) =>
                setEvaluation({ ...evaluation, evaluation_date: e.target.value })
              }
            />
          </div>

          {/* Avaliador */}
          <div className="space-y-2">
            <Label>Avaliado por</Label>
            <Input
              placeholder="Nome do professor ou profissional que avaliou"
              value={evaluation.evaluator || ""}
              onChange={(e) =>
                setEvaluation({ ...evaluation, evaluator: e.target.value })
              }
            />
          </div>

          {/* Status Atual */}
          <div className="space-y-2">
            <Label>Status Atual da Meta</Label>
            <Textarea
              placeholder="Descreva o status atual da meta (ex: 'O aluno consegue ler palavras simples com apoio visual')"
              value={evaluation.current_status || ""}
              onChange={(e) =>
                setEvaluation({ ...evaluation, current_status: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Evidências */}
          <div className="space-y-2">
            <Label>Evidências do Progresso</Label>
            <Textarea
              placeholder="Descreva as evidências observadas (ex: 'Conseguiu ler 8 de 10 palavras em atividade realizada no dia 15/01', 'Participou de 3 atividades em grupo na última semana')"
              value={evaluation.evidence || ""}
              onChange={(e) =>
                setEvaluation({ ...evaluation, evidence: e.target.value })
              }
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              💡 Seja específico: mencione datas, quantidades, situações observadas
            </p>
          </div>

          {/* Próximas Ações */}
          <div className="space-y-2">
            <Label>Próximas Ações / Ajustes Necessários</Label>
            <Textarea
              placeholder="Descreva o que será feito a partir desta avaliação (ex: 'Aumentar a complexidade dos textos', 'Reduzir o apoio visual gradualmente', 'Manter as mesmas estratégias')"
              value={evaluation.next_actions || ""}
              onChange={(e) =>
                setEvaluation({ ...evaluation, next_actions: e.target.value })
              }
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Salvar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

