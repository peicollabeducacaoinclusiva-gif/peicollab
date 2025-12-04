"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CheckCircle, AlertCircle, Clock, Users, FileText, PenTool, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface EvaluationData {
  observations?: string
  progress?: string
  review_date?: string
  last_review_date?: string
  next_review_date?: string
  overall_progress?: "insatisfatório" | "regular" | "bom" | "excelente"
  goals_evaluation?: string
  family_feedback?: string
  adjustments_needed?: string
  evaluation_criteria?: {
    progress_indicators?: string[]
    examples?: string[]
    measurement_methods?: string[]
  }
  progress_recording?: {
    frequency?: "bimestral" | "trimestral" | "semestral" | "anual"
    format?: "descriptive" | "quantitative" | "mixed"
    responsible?: string
    next_report_date?: string
    last_report_date?: string
  }
  pei_review?: {
    review_frequency?: string
    review_process?: string
    participants?: string[]
    last_review_meeting?: string
    next_review_meeting?: string
    reformulation_needed?: boolean
    reformulation_reason?: string
  }
  signatures?: Array<{
    name: string
    role: string
    signature_date?: string
    cpf?: string
    registration?: string
  }>
}

interface EvaluationSectionProps {
  evaluationData: EvaluationData
  onEvaluationChange: (data: EvaluationData) => void
}

const EvaluationSection = ({ evaluationData, onEvaluationChange }: EvaluationSectionProps) => {
  const handleChange = (field: keyof EvaluationData, value: string) => {
    onEvaluationChange({
      ...evaluationData,
      [field]: value,
    })
  }

  const getProgressColor = (progress?: string) => {
    switch (progress) {
      case "excelente":
        return "text-green-600 bg-green-50 border-green-200"
      case "bom":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "regular":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "insatisfatório":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getProgressIcon = (progress?: string) => {
    switch (progress) {
      case "excelente":
      case "bom":
        return <CheckCircle className="h-5 w-5" />
      case "regular":
        return <Clock className="h-5 w-5" />
      case "insatisfatório":
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Avaliação e Acompanhamento</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Registre o progresso do aluno e agende as próximas revisões do PEI
        </p>
      </div>

      {/* Datas de Revisão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Datas de Revisão
          </CardTitle>
          <CardDescription>
            Agende e registre as revisões periódicas do PEI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Importante:</strong> O PEI deve ser revisado periodicamente para garantir que as estratégias
              estejam sendo efetivas e realizar ajustes necessários.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="last_review_date">Última Revisão</Label>
              <Input
                id="last_review_date"
                type="date"
                value={evaluationData.last_review_date || ""}
                onChange={(e) => handleChange("last_review_date", e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Data da última revisão realizada
              </p>
            </div>

            <div>
              <Label htmlFor="review_date">Data de Revisão Atual *</Label>
              <Input
                id="review_date"
                type="date"
                value={evaluationData.review_date || ""}
                onChange={(e) => handleChange("review_date", e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Data desta avaliação
              </p>
            </div>

            <div>
              <Label htmlFor="next_review_date">Próxima Revisão Programada</Label>
              <Input
                id="next_review_date"
                type="date"
                value={evaluationData.next_review_date || ""}
                onChange={(e) => handleChange("next_review_date", e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Agende a próxima revisão (recomendado: 3-6 meses)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {getProgressIcon(evaluationData.overall_progress)}
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="overall_progress">Avaliação Geral do Progresso</Label>
            <Select
              value={evaluationData.overall_progress || ""}
              onValueChange={(value) => handleChange("overall_progress", value)}
            >
              <SelectTrigger className={`mt-2 ${getProgressColor(evaluationData.overall_progress)}`}>
                <SelectValue placeholder="Selecione a avaliação geral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excelente">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Excelente - Superou expectativas</span>
                  </div>
                </SelectItem>
                <SelectItem value="bom">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Bom - Alcançou os objetivos</span>
                  </div>
                </SelectItem>
                <SelectItem value="regular">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Regular - Progresso parcial</span>
                  </div>
                </SelectItem>
                <SelectItem value="insatisfatório">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span>Insatisfatório - Necessita ajustes</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="progress">Descrição do Progresso</Label>
            <Textarea
              id="progress"
              placeholder="Descreva o progresso observado no período, conquistas alcançadas, áreas que melhoraram..."
              value={evaluationData.progress || ""}
              onChange={(e) => handleChange("progress", e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="goals_evaluation">Avaliação das Metas</Label>
            <Textarea
              id="goals_evaluation"
              placeholder="Avalie como as metas estabelecidas estão sendo alcançadas. Quais metas foram atingidas? Quais precisam ser ajustadas?"
              value={evaluationData.goals_evaluation || ""}
              onChange={(e) => handleChange("goals_evaluation", e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback da Família */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Feedback da Família
          </CardTitle>
          <CardDescription>
            Registre as observações, expectativas e feedback dos responsáveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="family_feedback">Comentários da Família</Label>
            <Textarea
              id="family_feedback"
              placeholder="Registre os comentários, observações e feedback dos familiares sobre o progresso do aluno, dificuldades em casa, sugestões..."
              value={evaluationData.family_feedback || ""}
              onChange={(e) => handleChange("family_feedback", e.target.value)}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              💡 Inclua: perspectiva da família sobre o progresso, dificuldades observadas em casa, sugestões
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Observações e Ajustes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações e Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="observations">Observações Gerais</Label>
            <Textarea
              id="observations"
              placeholder="Adicione observações sobre o desenvolvimento do aluno, comportamento, interação social, etc..."
              value={evaluationData.observations || ""}
              onChange={(e) => handleChange("observations", e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="adjustments_needed">Ajustes Necessários no PEI</Label>
            <Textarea
              id="adjustments_needed"
              placeholder="Descreva quais ajustes devem ser feitos no PEI: novas metas, mudanças de estratégias, recursos adicionais necessários..."
              value={evaluationData.adjustments_needed || ""}
              onChange={(e) => handleChange("adjustments_needed", e.target.value)}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              💡 Seja específico: o que funcionou bem? O que não funcionou? O que deve ser modificado?
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 🆕 CRITÉRIOS DE AVALIAÇÃO INDIVIDUALIZADA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Critérios de Avaliação Individualizada
          </CardTitle>
          <CardDescription>
            Defina o que será considerado progresso e como será medido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Indicadores de Progresso</Label>
            <Textarea
              placeholder="Liste o que será considerado progresso (um por linha)..."
              value={(evaluationData.evaluation_criteria?.progress_indicators || []).join('\n')}
              onChange={(e) => {
                const ec = evaluationData.evaluation_criteria || {}
                onEvaluationChange({
                  ...evaluationData,
                  evaluation_criteria: {
                    ...ec,
                    progress_indicators: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: Aumento de vocabulário, maior tempo de atenção, melhor interação social
            </p>
          </div>

          <div>
            <Label>Exemplos de Progresso</Label>
            <Textarea
              placeholder="Liste exemplos específicos de progresso observável (um por linha)..."
              value={(evaluationData.evaluation_criteria?.examples || []).join('\n')}
              onChange={(e) => {
                const ec = evaluationData.evaluation_criteria || {}
                onEvaluationChange({
                  ...evaluationData,
                  evaluation_criteria: {
                    ...ec,
                    examples: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Métodos de Mensuração</Label>
            <Textarea
              placeholder="Liste os métodos que serão usados para medir o progresso (um por linha)..."
              value={(evaluationData.evaluation_criteria?.measurement_methods || []).join('\n')}
              onChange={(e) => {
                const ec = evaluationData.evaluation_criteria || {}
                onEvaluationChange({
                  ...evaluationData,
                  evaluation_criteria: {
                    ...ec,
                    measurement_methods: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: Observação direta, portfólio, avaliações adaptadas, registros de frequência
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 🆕 FORMA DE REGISTRO DO PROGRESSO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Registro do Progresso
          </CardTitle>
          <CardDescription>
            Defina como e com que frequência o progresso será registrado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Frequência de Registro</Label>
              <Select
                value={evaluationData.progress_recording?.frequency || ""}
                onValueChange={(value) => {
                  const pr = evaluationData.progress_recording || {}
                  onEvaluationChange({
                    ...evaluationData,
                    progress_recording: {
                      ...pr,
                      frequency: value as any,
                    },
                  })
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bimestral">Bimestral</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Formato do Registro</Label>
              <Select
                value={evaluationData.progress_recording?.format || ""}
                onValueChange={(value) => {
                  const pr = evaluationData.progress_recording || {}
                  onEvaluationChange({
                    ...evaluationData,
                    progress_recording: {
                      ...pr,
                      format: value as any,
                    },
                  })
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="descriptive">Descritivo (observações)</SelectItem>
                  <SelectItem value="quantitative">Quantitativo (notas, percentuais)</SelectItem>
                  <SelectItem value="mixed">Misto (descritivo + quantitativo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Responsável pelo Registro</Label>
              <Input
                placeholder="Nome do responsável"
                value={evaluationData.progress_recording?.responsible || ""}
                onChange={(e) => {
                  const pr = evaluationData.progress_recording || {}
                  onEvaluationChange({
                    ...evaluationData,
                    progress_recording: {
                      ...pr,
                      responsible: e.target.value,
                    },
                  })
                }}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Data do Último Relatório</Label>
              <Input
                type="date"
                value={evaluationData.progress_recording?.last_report_date || ""}
                onChange={(e) => {
                  const pr = evaluationData.progress_recording || {}
                  onEvaluationChange({
                    ...evaluationData,
                    progress_recording: {
                      ...pr,
                      last_report_date: e.target.value,
                    },
                  })
                }}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Data do Próximo Relatório</Label>
              <Input
                type="date"
                value={evaluationData.progress_recording?.next_report_date || ""}
                onChange={(e) => {
                  const pr = evaluationData.progress_recording || {}
                  onEvaluationChange({
                    ...evaluationData,
                    progress_recording: {
                      ...pr,
                      next_report_date: e.target.value,
                    },
                  })
                }}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🆕 REVISÃO E REFORMULAÇÃO DO PEI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Revisão e Reformulação do PEI
          </CardTitle>
          <CardDescription>
            Defina o processo de revisão periódica do PEI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Frequência de Revisão</Label>
            <Input
              placeholder="Ex: Trimestral, Semestral"
              value={evaluationData.pei_review?.review_frequency || ""}
              onChange={(e) => {
                const pr = evaluationData.pei_review || {}
                onEvaluationChange({
                  ...evaluationData,
                  pei_review: {
                    ...pr,
                    review_frequency: e.target.value,
                  },
                })
              }}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Processo de Revisão</Label>
            <Textarea
              placeholder="Descreva como o PEI será reavaliado (reuniões, participantes, metodologia)..."
              value={evaluationData.pei_review?.review_process || ""}
              onChange={(e) => {
                const pr = evaluationData.pei_review || {}
                onEvaluationChange({
                  ...evaluationData,
                  pei_review: {
                    ...pr,
                    review_process: e.target.value,
                  },
                })
              }}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Participantes da Revisão</Label>
            <Textarea
              placeholder="Liste os participantes das reuniões de revisão (um por linha)..."
              value={(evaluationData.pei_review?.participants || []).join('\n')}
              onChange={(e) => {
                const pr = evaluationData.pei_review || {}
                onEvaluationChange({
                  ...evaluationData,
                  pei_review: {
                    ...pr,
                    participants: e.target.value.split('\n').filter(Boolean),
                  },
                })
              }}
              rows={2}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: Equipe escolar, família, coordenador, AEE
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data da Última Reunião de Revisão</Label>
              <Input
                type="date"
                value={evaluationData.pei_review?.last_review_meeting || ""}
                onChange={(e) => {
                  const pr = evaluationData.pei_review || {}
                  onEvaluationChange({
                    ...evaluationData,
                    pei_review: {
                      ...pr,
                      last_review_meeting: e.target.value,
                    },
                  })
                }}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Data da Próxima Reunião de Revisão</Label>
              <Input
                type="date"
                value={evaluationData.pei_review?.next_review_meeting || ""}
                onChange={(e) => {
                  const pr = evaluationData.pei_review || {}
                  onEvaluationChange({
                    ...evaluationData,
                    pei_review: {
                      ...pr,
                      next_review_meeting: e.target.value,
                    },
                  })
                }}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={evaluationData.pei_review?.reformulation_needed || false}
              onChange={(e) => {
                const pr = evaluationData.pei_review || {}
                onEvaluationChange({
                  ...evaluationData,
                  pei_review: {
                    ...pr,
                    reformulation_needed: e.target.checked,
                  },
                })
              }}
              className="h-4 w-4"
            />
            <Label>Reformulação do PEI Necessária</Label>
          </div>

          {evaluationData.pei_review?.reformulation_needed && (
            <div>
              <Label>Motivo da Reformulação</Label>
              <Textarea
                placeholder="Descreva o motivo da necessidade de reformulação do PEI..."
                value={evaluationData.pei_review?.reformulation_reason || ""}
                onChange={(e) => {
                  const pr = evaluationData.pei_review || {}
                  onEvaluationChange({
                    ...evaluationData,
                    pei_review: {
                      ...pr,
                      reformulation_reason: e.target.value,
                    },
                  })
                }}
                rows={3}
                className="mt-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🆕 ASSINATURAS COMPLETAS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                Assinaturas
              </CardTitle>
              <CardDescription>
                Registre as assinaturas dos profissionais e responsáveis
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                const signatures = evaluationData.signatures || []
                onEvaluationChange({
                  ...evaluationData,
                  signatures: [...signatures, { name: '', role: '' }],
                })
              }}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Assinatura
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(evaluationData.signatures || []).map((signature, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Assinatura {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const signatures = evaluationData.signatures || []
                      onEvaluationChange({
                        ...evaluationData,
                        signatures: signatures.filter((_, i) => i !== index),
                      })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      placeholder="Nome legível"
                      value={signature.name}
                      onChange={(e) => {
                        const signatures = [...(evaluationData.signatures || [])]
                        signatures[index] = { ...signatures[index], name: e.target.value }
                        onEvaluationChange({ ...evaluationData, signatures })
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Cargo/Função *</Label>
                    <Input
                      placeholder="Ex: Professor, Coordenador, Diretor, Responsável"
                      value={signature.role}
                      onChange={(e) => {
                        const signatures = [...(evaluationData.signatures || [])]
                        signatures[index] = { ...signatures[index], role: e.target.value }
                        onEvaluationChange({ ...evaluationData, signatures })
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Data da Assinatura</Label>
                    <Input
                      type="date"
                      value={signature.signature_date || ""}
                      onChange={(e) => {
                        const signatures = [...(evaluationData.signatures || [])]
                        signatures[index] = { ...signatures[index], signature_date: e.target.value }
                        onEvaluationChange({ ...evaluationData, signatures })
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>CPF (Opcional)</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={signature.cpf || ""}
                      onChange={(e) => {
                        const signatures = [...(evaluationData.signatures || [])]
                        signatures[index] = { ...signatures[index], cpf: e.target.value }
                        onEvaluationChange({ ...evaluationData, signatures })
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Registro Profissional (Opcional)</Label>
                    <Input
                      placeholder="Ex: CREB, CRP, etc."
                      value={signature.registration || ""}
                      onChange={(e) => {
                        const signatures = [...(evaluationData.signatures || [])]
                        signatures[index] = { ...signatures[index], registration: e.target.value }
                        onEvaluationChange({ ...evaluationData, signatures })
                      }}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(evaluationData.signatures || []).length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhuma assinatura adicionada ainda</p>
              <Button
                onClick={() => {
                  onEvaluationChange({
                    ...evaluationData,
                    signatures: [{ name: '', role: '' }],
                  })
                }}
                variant="outline"
                className="mt-4 bg-transparent"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeira assinatura
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EvaluationSection

