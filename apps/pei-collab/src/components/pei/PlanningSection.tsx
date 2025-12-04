"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Plus, Trash2, Lightbulb, Info, CheckCircle2, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GoalEvaluationDialog } from "./GoalEvaluationDialog"
import { StudentContextData } from "@/types/pei"

// Tipos baseados no schema do banco
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
  barrier_id?: string
  category?: "academic" | "functional"
  description: string
  target_date?: string
  timeline?: "short_term" | "medium_term" | "long_term"
  progress_level?: "não iniciada" | "em andamento" | "parcialmente alcançada" | "alcançada"
  progress_score?: number
  notes?: string
  specific_objectives?: string[]
  measurement_criteria?: string
  expected_outcomes?: string
  evaluation?: GoalEvaluation
}

interface AccessibilityResource {
  id?: string
  resource_type:
    | "Libras"
    | "Braille"
    | "Tecnologia assistiva"
    | "Material adaptado"
    | "Apoio visual"
    | "Tutor"
    | "Outro"
  description: string
  usage_frequency?: "Diário" | "Semanal" | "Sob demanda" | "Outro"
}

interface PlanningData {
  goals: Goal[]
  accessibilityResources: AccessibilityResource[]
  curriculum_adaptations?: {
    priority_contents?: string[]
    priority_competencies?: string[]
    differentiated_methodologies?: string[]
    adapted_assessments?: string[]
    content_flexibilization?: string
    sequence_reorganization?: string
  }
  specific_resources?: {
    pedagogical_games?: string[]
    communication_boards?: string[]
    assistive_technologies?: string[]
    visual_supports?: string[]
    images?: string[]
    other_materials?: string[]
  }
  support_services?: Array<{
    service_type: string
    frequency: string
    duration?: string
    provider?: string
    location?: string
    observations?: string
  }>
  intervention_schedule?: Array<{
    period: string
    actions: string[]
    responsible: string
    expected_results?: string
  }>
  methodological_strategies?: {
    content_presentation?: string
    assessment?: string
    engagement?: string
    challenge_management?: string
  }
  general_observations?: string[]
  referrals?: Array<{
    service: string
    reason: string
    priority?: string
    follow_up?: string
    recommended_professional?: string
  }>
  communication_guidelines?: string[]
  crisis_strategies?: string[]
  medication_notes?: string
  family_communication?: string
}

interface AIGeneratedInsights {
  referrals?: Array<{
    service?: string
    service_type?: string
    type?: string
    reason?: string
    description?: string
    priority?: string
    follow_up?: string
    recommended_professional?: string
    observations?: string
  }>
  generalObservations?: string[]
  communicationGuidelines?: string[]
  crisisStrategies?: string[]
  medicationNotes?: string
  familyCommunication?: string
}

interface PlanningSectionProps {
  planningData: PlanningData
  diagnosisData: any
  barriers: any[]
  onPlanningChange: (data: PlanningData) => void
  studentData?: any
  studentContextData?: StudentContextData
  tenantName?: string | null
  onReferralsGenerated?: (insights: AIGeneratedInsights) => void
}

const PlanningSection = ({
  planningData,
  diagnosisData,
  barriers = [],
  onPlanningChange,
  studentData,
  studentContextData,
  tenantName,
  onReferralsGenerated,
}: PlanningSectionProps) => {
  const [generatingAI, setGeneratingAI] = useState(false)
  const [evaluatingGoalIndex, setEvaluatingGoalIndex] = useState<number | null>(null)
  const { toast } = useToast()

  // Garantir que os arrays existem
  const safeGoals = planningData?.goals || []
  const safeResources = planningData?.accessibilityResources || []

  const handleGenerateWithAI = async () => {
    if (!diagnosisData.interests && !diagnosisData.specialNeeds && (!barriers || barriers.length === 0)) {
      toast({
        title: "Atenção",
        description: "Preencha pelo menos um campo da seção de diagnóstico antes de gerar o planejamento.",
        variant: "destructive",
      })
      return
    }

    try {
      setGeneratingAI(true)
      const schoolRelation = studentData?.school || studentData?.schools
      const aiContext = {
        student: {
          name: studentData?.name || "",
          school:
            schoolRelation?.school_name ||
            tenantName ||
            studentContextData?.school_address ||
            "",
          grade: studentContextData?.grade || studentData?.grade || "",
          class: studentContextData?.class || "",
          shift: schoolRelation?.shift || studentContextData?.teaching_modality || "",
          tenant: tenantName || "",
          pei_period: studentContextData?.pei_period || "",
          review_date: studentContextData?.pei_review_date || "",
        },
        diagnosis: {
          history: diagnosisData?.history || "",
          interests: diagnosisData?.interests || "",
          aversions: diagnosisData?.aversions || diagnosisData?.challenges || "",
          abilities: diagnosisData?.abilities || diagnosisData?.strengths || "",
          specialNeeds: diagnosisData?.specialNeeds || "",
          barriers: Array.isArray(diagnosisData?.barriers)
            ? diagnosisData.barriers.map((barrier: any) => ({
                barrier_type: barrier?.barrier_type || barrier?.type || "",
                description: barrier?.description || "",
                severity: barrier?.severity || "",
              }))
            : [],
          barriersComments: diagnosisData?.barriersComments || "",
          circumstantial_report: diagnosisData?.circumstantial_report,
          development_level: diagnosisData?.development_level,
          health_info: diagnosisData?.health_info,
        },
        family: {
          needs: diagnosisData?.familyNeeds || "",
          expectedActions: diagnosisData?.familyExpectations || "",
          dynamics: studentContextData?.family?.family_dynamics || "",
        },
        context: {
          professionals: studentContextData?.professionals,
          schooling_history: studentContextData?.schooling_history,
        },
      }

      const { data, error } = await supabase.functions.invoke("generate-pei-planning", {
        body: { diagnosisData, barriers, aiContext },
      })

      if (error) throw error

      onPlanningChange(data.planningData)
      onReferralsGenerated?.({
        referrals: data.planningData?.referrals,
        generalObservations: data.planningData?.general_observations,
        communicationGuidelines: data.planningData?.communication_guidelines,
        crisisStrategies: data.planningData?.crisis_strategies,
        medicationNotes: data.planningData?.medication_notes,
        familyCommunication: data.planningData?.family_communication,
      })
      toast({
        title: "Sucesso",
        description: "Planejamento gerado com IA!",
      })
    } catch (error: any) {
      console.error("Error generating planning:", error)
      console.error("Error details:", {
        message: error?.message,
        data: error?.data,
        status: error?.status,
        details: error?.details
      })
      toast({
        title: "Erro ao gerar planejamento",
        description: error?.message || error?.data?.error || "Não foi possível gerar o planejamento. Verifique o console (F12) para mais detalhes.",
        variant: "destructive",
      })
    } finally {
      setGeneratingAI(false)
    }
  }

  const addGoal = () => {
    onPlanningChange({
      ...planningData,
      goals: [
        ...(planningData?.goals || []),
        {
          description: "",
          progress_level: "não iniciada",
          progress_score: 0,
        },
      ],
    })
  }

  const removeGoal = (index: number) => {
    const newGoals = (planningData?.goals || []).filter((_, i) => i !== index)
    onPlanningChange({ ...planningData, goals: newGoals })
  }

  const updateGoal = (index: number, field: keyof Goal, value: any) => {
    const newGoals = [...(planningData?.goals || [])]
    newGoals[index] = { ...newGoals[index], [field]: value }
    onPlanningChange({ ...planningData, goals: newGoals })
  }

  const addResource = () => {
    onPlanningChange({
      ...planningData,
      accessibilityResources: [
        ...(planningData?.accessibilityResources || []),
        {
          resource_type: "Material adaptado",
          description: "",
          usage_frequency: "Diário",
        },
      ],
    })
  }

  const removeResource = (index: number) => {
    const newResources = (planningData?.accessibilityResources || []).filter((_, i) => i !== index)
    onPlanningChange({ ...planningData, accessibilityResources: newResources })
  }

  const updateResource = (index: number, field: keyof AccessibilityResource, value: any) => {
    const newResources = [...(planningData?.accessibilityResources || [])]
    newResources[index] = { ...newResources[index], [field]: value }
    onPlanningChange({ ...planningData, accessibilityResources: newResources })
  }

  const saveGoalEvaluation = (goalIndex: number, evaluation: GoalEvaluation) => {
    const newGoals = [...(planningData?.goals || [])]
    newGoals[goalIndex] = { ...newGoals[goalIndex], evaluation }
    onPlanningChange({ ...planningData, goals: newGoals })
    toast({
      title: "Avaliação salva",
      description: "A avaliação da meta foi registrada com sucesso.",
    })
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600"
    if (percentage >= 50) return "text-blue-600"
    if (percentage >= 25) return "text-yellow-600"
    return "text-red-600"
  }

  const ExampleTooltip = ({ title, examples }: { title: string; examples: string[] }) => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button type="button" className="ml-2 inline-flex items-center text-primary hover:text-primary/80">
          <Lightbulb className="h-4 w-4" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{title}</h4>
          <ul className="text-xs space-y-1 list-disc pl-4">
            {examples.map((example, idx) => (
              <li key={idx}>{example}</li>
            ))}
          </ul>
        </div>
      </HoverCardContent>
    </HoverCard>
  )

  const resourceTypes = [
    { value: "Libras", label: "🤟 Libras" },
    { value: "Braille", label: "⠃ Braille" },
    { value: "Tecnologia assistiva", label: "💻 Tecnologia assistiva" },
    { value: "Material adaptado", label: "📚 Material adaptado" },
    { value: "Apoio visual", label: "👁️ Apoio visual" },
    { value: "Tutor", label: "👨‍🏫 Tutor" },
    { value: "Outro", label: "🔧 Outro" },
  ]

  const usageFrequencies = [
    { value: "Diário", label: "Diário" },
    { value: "Semanal", label: "Semanal" },
    { value: "Sob demanda", label: "Sob demanda" },
    { value: "Outro", label: "Outro" },
  ]

  return (
    <div className="space-y-6">
      <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
        <Info className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <AlertDescription className="text-sm text-purple-800 dark:text-purple-300">
          <strong>Dica:</strong> Use o botão "Gerar com IA" para criar um planejamento baseado no diagnóstico, ou
          preencha manualmente as metas.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planejamento de Acessibilidade</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Defina metas e recursos para promover a acessibilidade educacional
          </p>
        </div>
        <Button onClick={handleGenerateWithAI} disabled={generatingAI} variant="secondary">
          <Sparkles className="mr-2 h-4 w-4" />
          {generatingAI ? "Gerando..." : "Gerar com IA"}
        </Button>
      </div>

      {/* Metas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">🎯 Metas Educacionais</h4>
          <Button onClick={addGoal} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Meta
          </Button>
        </div>

        {safeGoals.map((goal, goalIndex) => (
          <Card key={goalIndex}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  Meta {goalIndex + 1}
                  {goal.category && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {goal.category === "academic" ? "📚 Acadêmica" : "🎯 Funcional"}
                    </span>
                  )}
                  {goal.evaluation?.achieved_percentage !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getProgressColor(goal.evaluation.achieved_percentage)} bg-current/10`}>
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      {goal.evaluation.achieved_percentage}%
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEvaluatingGoalIndex(goalIndex)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {goal.evaluation ? "Ver Avaliação" : "Avaliar Meta"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeGoal(goalIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Categoria da Meta *</Label>
                <Select
                  value={goal.category || ""}
                  onValueChange={(value) => updateGoal(goalIndex, "category", value as "academic" | "functional")}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione a categoria da meta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Acadêmica</SelectItem>
                    <SelectItem value="functional">Funcional</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Acadêmica: relacionada ao currículo escolar. Funcional: habilidades para vida diária.
                </p>
              </div>

              <div>
                <div className="flex items-center">
                  <Label>Descrição da Meta</Label>
                  <ExampleTooltip
                    title="💡 Exemplos de Metas:"
                    examples={[
                      "Aumentar a autonomia do aluno nas atividades de leitura, conseguindo ler textos curtos com apoio visual até o final do semestre",
                      "Desenvolver habilidades de interação social, participando de atividades em grupo pelo menos 3 vezes por semana",
                      "Melhorar a coordenação motora fina para escrita, conseguindo escrever o próprio nome de forma legível",
                    ]}
                  />
                </div>
                <Textarea
                  placeholder="Descreva a meta de forma específica, mensurável e com prazo..."
                  value={goal.description}
                  onChange={(e) => updateGoal(goalIndex, "description", e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>

              {barriers && barriers.length > 0 && (
                <div>
                  <Label>Barreira Relacionada (Opcional)</Label>
                  <Select
                    value={goal.barrier_id || ""}
                    onValueChange={(value) => updateGoal(goalIndex, "barrier_id", value || null)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione uma barreira relacionada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma barreira específica</SelectItem>
                      {barriers.map((barrier) => (
                        <SelectItem key={barrier.id} value={barrier.id}>
                          {barrier.barrier_type}: {barrier.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Data Alvo *</Label>
                <input
                  type="date"
                  value={goal.target_date || ""}
                  onChange={(e) => updateGoal(goalIndex, "target_date", e.target.value)}
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <Label>Prazo da Meta</Label>
                <Select
                  value={goal.timeline || ""}
                  onValueChange={(value) => updateGoal(goalIndex, "timeline", value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione o prazo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_term">Curto Prazo (1-3 meses)</SelectItem>
                    <SelectItem value="medium_term">Médio Prazo (4-6 meses)</SelectItem>
                    <SelectItem value="long_term">Longo Prazo (7-12 meses)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Classifique a meta por prazo de alcance
                </p>
              </div>

              <div>
                <Label>Objetivos Específicos e Mensuráveis</Label>
                <Textarea
                  placeholder="Liste objetivos específicos e mensuráveis desta meta (um por linha)..."
                  value={(goal.specific_objectives || []).join('\n')}
                  onChange={(e) => updateGoal(goalIndex, "specific_objectives", e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: Reconhecer todas as letras do alfabeto em palavras simples
                </p>
              </div>

              <div>
                <Label>Critérios de Mensuração</Label>
                <Textarea
                  placeholder="Como será medido o progresso desta meta? Quais indicadores serão observados?"
                  value={goal.measurement_criteria || ""}
                  onChange={(e) => updateGoal(goalIndex, "measurement_criteria", e.target.value)}
                  rows={2}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Resultados Esperados</Label>
                <Textarea
                  placeholder="Descreva os resultados esperados ao alcançar esta meta..."
                  value={goal.expected_outcomes || ""}
                  onChange={(e) => updateGoal(goalIndex, "expected_outcomes", e.target.value)}
                  rows={2}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Observações / Estratégias</Label>
                <Textarea
                  placeholder="Adicione observações sobre como alcançar esta meta, estratégias específicas, etc..."
                  value={goal.notes || ""}
                  onChange={(e) => updateGoal(goalIndex, "notes", e.target.value)}
                  rows={2}
                  className="mt-2"
                />
              </div>

              {/* Mostrar resumo da avaliação se existir */}
              {goal.evaluation && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Última Avaliação
                  </h5>
                  <div className="space-y-2 text-sm">
                    {goal.evaluation.evaluation_date && (
                      <p className="text-muted-foreground">
                        📅 {new Date(goal.evaluation.evaluation_date).toLocaleDateString("pt-BR")}
                        {goal.evaluation.evaluator && ` • Por: ${goal.evaluation.evaluator}`}
                      </p>
                    )}
                    {goal.evaluation.current_status && (
                      <p>
                        <strong>Status:</strong> {goal.evaluation.current_status}
                      </p>
                    )}
                    {goal.evaluation.evidence && (
                      <p>
                        <strong>Evidências:</strong> {goal.evaluation.evidence.substring(0, 100)}
                        {goal.evaluation.evidence.length > 100 && "..."}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {safeGoals.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Nenhuma meta adicionada ainda</p>
            <Button onClick={addGoal} variant="outline" className="mt-4 bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar primeira meta
            </Button>
          </div>
        )}
      </div>

      {/* Recursos de Acessibilidade */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">♿ Recursos de Acessibilidade</h4>
          <Button onClick={addResource} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Recurso
          </Button>
        </div>

        {safeResources.map((resource, resourceIndex) => (
          <Card key={resourceIndex}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tipo de Recurso</Label>
                <Button variant="ghost" size="icon" onClick={() => removeResource(resourceIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Select
                value={resource.resource_type}
                onValueChange={(value) => updateResource(resourceIndex, "resource_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <Label>Descrição do Recurso</Label>
                <Textarea
                  placeholder="Descreva detalhadamente o recurso, como será utilizado, adaptações necessárias..."
                  value={resource.description}
                  onChange={(e) => updateResource(resourceIndex, "description", e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Frequência de Uso</Label>
                <Select
                  value={resource.usage_frequency || "Diário"}
                  onValueChange={(value) => updateResource(resourceIndex, "usage_frequency", value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {usageFrequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}

        {safeResources.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Nenhum recurso de acessibilidade adicionado ainda</p>
            <Button onClick={addResource} variant="outline" className="mt-4 bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar primeiro recurso
            </Button>
          </div>
        )}
      </div>

      {/* 🆕 ADEQUAÇÕES CURRICULARES DETALHADAS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📚 Adequações Curriculares</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Conteúdos Prioritários</Label>
            <Textarea
              placeholder="Liste os conteúdos que serão priorizados (um por linha)..."
              value={(planningData.curriculum_adaptations?.priority_contents || []).join('\n')}
              onChange={(e) => {
                const ca = planningData.curriculum_adaptations || {}
                onPlanningChange({
                  ...planningData,
                  curriculum_adaptations: {
                    ...ca,
                    priority_contents: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Competências Prioritárias</Label>
            <Textarea
              placeholder="Liste as competências que serão priorizadas (uma por linha)..."
              value={(planningData.curriculum_adaptations?.priority_competencies || []).join('\n')}
              onChange={(e) => {
                const ca = planningData.curriculum_adaptations || {}
                onPlanningChange({
                  ...planningData,
                  curriculum_adaptations: {
                    ...ca,
                    priority_competencies: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Metodologias Diferenciadas</Label>
            <Textarea
              placeholder="Liste as metodologias diferenciadas que serão utilizadas (uma por linha)..."
              value={(planningData.curriculum_adaptations?.differentiated_methodologies || []).join('\n')}
              onChange={(e) => {
                const ca = planningData.curriculum_adaptations || {}
                onPlanningChange({
                  ...planningData,
                  curriculum_adaptations: {
                    ...ca,
                    differentiated_methodologies: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Avaliações Adaptadas</Label>
            <Textarea
              placeholder="Liste as formas de avaliação adaptadas (uma por linha)..."
              value={(planningData.curriculum_adaptations?.adapted_assessments || []).join('\n')}
              onChange={(e) => {
                const ca = planningData.curriculum_adaptations || {}
                onPlanningChange({
                  ...planningData,
                  curriculum_adaptations: {
                    ...ca,
                    adapted_assessments: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Flexibilização de Conteúdos</Label>
            <Textarea
              placeholder="Descreva como os conteúdos serão flexibilizados sem alterar os essenciais..."
              value={planningData.curriculum_adaptations?.content_flexibilization || ''}
              onChange={(e) => {
                const ca = planningData.curriculum_adaptations || {}
                onPlanningChange({
                  ...planningData,
                  curriculum_adaptations: {
                    ...ca,
                    content_flexibilization: e.target.value,
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Reorganização da Sequência Didática</Label>
            <Textarea
              placeholder="Descreva como a sequência didática será reorganizada..."
              value={planningData.curriculum_adaptations?.sequence_reorganization || ''}
              onChange={(e) => {
                const ca = planningData.curriculum_adaptations || {}
                onPlanningChange({
                  ...planningData,
                  curriculum_adaptations: {
                    ...ca,
                    sequence_reorganization: e.target.value,
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* 🆕 RECURSOS E MATERIAIS ESPECÍFICOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🛠️ Recursos e Materiais Específicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Jogos Pedagógicos</Label>
            <Textarea
              placeholder="Liste os jogos pedagógicos que serão utilizados (um por linha)..."
              value={(planningData.specific_resources?.pedagogical_games || []).join('\n')}
              onChange={(e) => {
                const sr = planningData.specific_resources || {}
                onPlanningChange({
                  ...planningData,
                  specific_resources: {
                    ...sr,
                    pedagogical_games: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Pranchas de Comunicação</Label>
            <Textarea
              placeholder="Liste as pranchas de comunicação (CAA) que serão utilizadas..."
              value={(planningData.specific_resources?.communication_boards || []).join('\n')}
              onChange={(e) => {
                const sr = planningData.specific_resources || {}
                onPlanningChange({
                  ...planningData,
                  specific_resources: {
                    ...sr,
                    communication_boards: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Tecnologias Assistivas</Label>
            <Textarea
              placeholder="Liste as tecnologias assistivas (softwares, apps, dispositivos)..."
              value={(planningData.specific_resources?.assistive_technologies || []).join('\n')}
              onChange={(e) => {
                const sr = planningData.specific_resources || {}
                onPlanningChange({
                  ...planningData,
                  specific_resources: {
                    ...sr,
                    assistive_technologies: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Apoios Visuais</Label>
            <Textarea
              placeholder="Liste os apoios visuais (cartazes, esquemas, imagens)..."
              value={(planningData.specific_resources?.visual_supports || []).join('\n')}
              onChange={(e) => {
                const sr = planningData.specific_resources || {}
                onPlanningChange({
                  ...planningData,
                  specific_resources: {
                    ...sr,
                    visual_supports: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Uso de Imagens</Label>
            <Textarea
              placeholder="Descreva como as imagens serão utilizadas..."
              value={(planningData.specific_resources?.images || []).join('\n')}
              onChange={(e) => {
                const sr = planningData.specific_resources || {}
                onPlanningChange({
                  ...planningData,
                  specific_resources: {
                    ...sr,
                    images: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Outros Materiais</Label>
            <Textarea
              placeholder="Liste outros materiais específicos necessários..."
              value={(planningData.specific_resources?.other_materials || []).join('\n')}
              onChange={(e) => {
                const sr = planningData.specific_resources || {}
                onPlanningChange({
                  ...planningData,
                  specific_resources: {
                    ...sr,
                    other_materials: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={2}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* 🆕 SERVIÇOS E SUPORTE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">🏥 Serviços e Suporte</CardTitle>
            <Button onClick={() => {
              const services = planningData.support_services || []
              onPlanningChange({
                ...planningData,
                support_services: [...services, { service_type: '', frequency: '' }],
              })
            }} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(planningData.support_services || []).map((service, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Serviço {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const services = planningData.support_services || []
                      onPlanningChange({
                        ...planningData,
                        support_services: services.filter((_, i) => i !== index),
                      })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo de Serviço *</Label>
                    <Input
                      placeholder="Ex: AEE, psicológico, fonoaudiológico"
                      value={service.service_type}
                      onChange={(e) => {
                        const services = [...(planningData.support_services || [])]
                        services[index] = { ...services[index], service_type: e.target.value }
                        onPlanningChange({ ...planningData, support_services: services })
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Frequência *</Label>
                    <Select
                      value={service.frequency}
                      onValueChange={(value) => {
                        const services = [...(planningData.support_services || [])]
                        services[index] = { ...services[index], frequency: value }
                        onPlanningChange({ ...planningData, support_services: services })
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diária">Diária</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="quando necessário">Quando necessário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Duração da Sessão</Label>
                    <Input
                      placeholder="Ex: 50 minutos"
                      value={service.duration || ''}
                      onChange={(e) => {
                        const services = [...(planningData.support_services || [])]
                        services[index] = { ...services[index], duration: e.target.value }
                        onPlanningChange({ ...planningData, support_services: services })
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Prestador do Serviço</Label>
                    <Input
                      placeholder="Nome do profissional"
                      value={service.provider || ''}
                      onChange={(e) => {
                        const services = [...(planningData.support_services || [])]
                        services[index] = { ...services[index], provider: e.target.value }
                        onPlanningChange({ ...planningData, support_services: services })
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Local</Label>
                    <Input
                      placeholder="Ex: Escola, clínica"
                      value={service.location || ''}
                      onChange={(e) => {
                        const services = [...(planningData.support_services || [])]
                        services[index] = { ...services[index], location: e.target.value }
                        onPlanningChange({ ...planningData, support_services: services })
                      }}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Observações sobre este serviço..."
                    value={service.observations || ''}
                    onChange={(e) => {
                      const services = [...(planningData.support_services || [])]
                      services[index] = { ...services[index], observations: e.target.value }
                      onPlanningChange({ ...planningData, support_services: services })
                    }}
                    rows={2}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {(planningData.support_services || []).length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhum serviço adicionado ainda</p>
              <Button
                onClick={() => {
                  onPlanningChange({
                    ...planningData,
                    support_services: [{ service_type: '', frequency: '' }],
                  })
                }}
                variant="outline"
                className="mt-4 bg-transparent"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro serviço
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🆕 CRONOGRAMA DE INTERVENÇÃO */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">📅 Cronograma de Intervenção</CardTitle>
            <Button onClick={() => {
              const schedule = planningData.intervention_schedule || []
              onPlanningChange({
                ...planningData,
                intervention_schedule: [...schedule, { period: '', actions: [], responsible: '' }],
              })
            }} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Período
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(planningData.intervention_schedule || []).map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Período {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const schedule = planningData.intervention_schedule || []
                      onPlanningChange({
                        ...planningData,
                        intervention_schedule: schedule.filter((_, i) => i !== index),
                      })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label>Período *</Label>
                  <Input
                    placeholder="Ex: Janeiro-Março 2025"
                    value={item.period}
                    onChange={(e) => {
                      const schedule = [...(planningData.intervention_schedule || [])]
                      schedule[index] = { ...schedule[index], period: e.target.value }
                      onPlanningChange({ ...planningData, intervention_schedule: schedule })
                    }}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Ações a Serem Realizadas *</Label>
                  <Textarea
                    placeholder="Liste as ações que serão realizadas neste período (uma por linha)..."
                    value={item.actions.join('\n')}
                    onChange={(e) => {
                      const schedule = [...(planningData.intervention_schedule || [])]
                      schedule[index] = {
                        ...schedule[index],
                        actions: e.target.value.split('\n').filter(Boolean),
                      }
                      onPlanningChange({ ...planningData, intervention_schedule: schedule })
                    }}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Responsável *</Label>
                  <Input
                    placeholder="Ex: Professor regente, AEE, família"
                    value={item.responsible}
                    onChange={(e) => {
                      const schedule = [...(planningData.intervention_schedule || [])]
                      schedule[index] = { ...schedule[index], responsible: e.target.value }
                      onPlanningChange({ ...planningData, intervention_schedule: schedule })
                    }}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Resultados Esperados</Label>
                  <Textarea
                    placeholder="Descreva os resultados esperados para este período..."
                    value={item.expected_results || ''}
                    onChange={(e) => {
                      const schedule = [...(planningData.intervention_schedule || [])]
                      schedule[index] = { ...schedule[index], expected_results: e.target.value }
                      onPlanningChange({ ...planningData, intervention_schedule: schedule })
                    }}
                    rows={2}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {(planningData.intervention_schedule || []).length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhum período adicionado ainda</p>
              <Button
                onClick={() => {
                  onPlanningChange({
                    ...planningData,
                    intervention_schedule: [{ period: '', actions: [], responsible: '' }],
                  })
                }}
                variant="outline"
                className="mt-4 bg-transparent"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro período
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Avaliação */}
      {evaluatingGoalIndex !== null && safeGoals[evaluatingGoalIndex] && (
        <GoalEvaluationDialog
          open={evaluatingGoalIndex !== null}
          onOpenChange={(open) => !open && setEvaluatingGoalIndex(null)}
          goal={safeGoals[evaluatingGoalIndex]}
          goalIndex={evaluatingGoalIndex}
          onSave={saveGoalEvaluation}
        />
      )}
    </div>
  )
}

export default PlanningSection
