"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Plus, Trash2, Lightbulb, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Tipos baseados no schema do banco
interface Goal {
  id?: string
  barrier_id?: string
  category?: "academic" | "functional"
  description: string
  target_date?: string
  progress_level?: "não iniciada" | "em andamento" | "parcialmente alcançada" | "alcançada"
  progress_score?: number
  notes?: string
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
}

interface PlanningSectionProps {
  planningData: PlanningData
  diagnosisData: any
  barriers: any[]
  onPlanningChange: (data: PlanningData) => void
}

const PlanningSection = ({ planningData, diagnosisData, barriers = [], onPlanningChange }: PlanningSectionProps) => {
  const [generatingAI, setGeneratingAI] = useState(false)
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
      const { data, error } = await supabase.functions.invoke("generate-pei-planning", {
        body: { diagnosisData, barriers },
      })

      if (error) throw error

      onPlanningChange(data.planningData)
      toast({
        title: "Sucesso",
        description: "Planejamento gerado com IA!",
      })
    } catch (error) {
      console.error("Error generating planning:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o planejamento. Tente novamente.",
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
                <CardTitle className="text-base">Meta {goalIndex + 1}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => removeGoal(goalIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
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
                <Label>Data Alvo (Opcional)</Label>
                <input
                  type="date"
                  value={goal.target_date || ""}
                  onChange={(e) => updateGoal(goalIndex, "target_date", e.target.value)}
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  )
}

export default PlanningSection
