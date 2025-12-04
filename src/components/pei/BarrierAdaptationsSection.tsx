"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lightbulb, ArrowRight, BookOpen, Building2, Info } from "lucide-react"
import { getBarrierRecommendations, generateBarrierAdaptations } from "@/lib/barrier-recommendations"

interface Barrier {
  id?: string
  barrier_type: string
  description: string
  severity?: "leve" | "moderada" | "severa"
}

interface BarrierAdaptationsSectionProps {
  barriers: Barrier[]
}

const BarrierAdaptationsSection = ({ barriers }: BarrierAdaptationsSectionProps) => {
  const [selectedBarrierType, setSelectedBarrierType] = useState<string | null>(null)

  // Obter tipos únicos de barreiras
  const uniqueBarrierTypes = Array.from(new Set(barriers.map((b) => b.barrier_type)))

  // Gerar adaptações automáticas
  const suggestedAdaptations = generateBarrierAdaptations(barriers)

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "severa":
        return "destructive"
      case "moderada":
        return "default"
      case "leve":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getSeverityLabel = (severity?: string) => {
    switch (severity) {
      case "severa":
        return "Severa"
      case "moderada":
        return "Moderada"
      case "leve":
        return "Leve"
      default:
        return "Não especificada"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Adaptações e Estratégias de Acessibilidade</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Recomendações pedagógicas baseadas nas barreiras identificadas
        </p>
      </div>

      {barriers.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nenhuma barreira foi identificada ainda. Complete a seção de Diagnóstico para receber recomendações
            personalizadas de adaptações e estratégias.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Informação sobre Adaptações vs Estratégias */}
          <Alert className="bg-blue-50 border-blue-200">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <div className="space-y-1">
                <p>
                  <strong>Adaptações Possíveis:</strong> Mudanças pedagógicas internas ao currículo e práticas
                  docentes (o que o professor faz em sala)
                </p>
                <p>
                  <strong>Estratégias de Acessibilidade:</strong> Condições externas e estruturais que viabilizam
                  o acesso (recursos, infraestrutura, apoios)
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Lista de Barreiras Identificadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🚧 Barreiras Identificadas</CardTitle>
              <CardDescription>Clique em uma barreira para ver as recomendações específicas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {barriers.map((barrier, index) => (
                  <Button
                    key={barrier.id || index}
                    variant={selectedBarrierType === barrier.barrier_type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBarrierType(barrier.barrier_type)}
                    className="flex items-center gap-2"
                  >
                    {barrier.barrier_type}
                    <Badge variant={getSeverityColor(barrier.severity)} className="ml-1">
                      {getSeverityLabel(barrier.severity)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recomendações por Tipo de Barreira */}
          {uniqueBarrierTypes.map((barrierType) => {
            const recommendations = getBarrierRecommendations(barrierType)
            const barriersOfType = barriers.filter((b) => b.barrier_type === barrierType)

            if (!recommendations) return null

            return (
              <Card
                key={barrierType}
                className={selectedBarrierType === barrierType ? "border-primary ring-2 ring-primary/20" : ""}
              >
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-2xl">
                      {barrierType === "Pedagógica" && "📚"}
                      {barrierType === "Comunicacional" && "💬"}
                      {barrierType === "Atitudinal" && "🤝"}
                      {barrierType === "Arquitetônica" && "🏛️"}
                      {barrierType === "Tecnológica" && "💻"}
                      {barrierType === "Cognitiva" && "🧠"}
                      {barrierType === "Comportamental" && "🎭"}
                      {barrierType === "Sensorial" && "👁️"}
                      {barrierType === "Motora" && "🏃"}
                      {barrierType === "Social" && "👥"}
                    </span>
                    {barrierType}
                  </CardTitle>
                  <CardDescription>{recommendations.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Barreiras específicas deste tipo */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Barreiras Identificadas:</h4>
                    <ul className="space-y-1">
                      {barriersOfType.map((barrier, index) => (
                        <li key={barrier.id || index} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <span>{barrier.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Tabs defaultValue="adaptations" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="adaptations" className="text-xs sm:text-sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Adaptações (Internas)
                      </TabsTrigger>
                      <TabsTrigger value="strategies" className="text-xs sm:text-sm">
                        <Building2 className="h-4 w-4 mr-2" />
                        Estratégias (Externas)
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="adaptations" className="space-y-3 mt-4">
                      <Alert className="bg-purple-50 border-purple-200">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        <AlertDescription className="text-xs text-purple-800">
                          Mudanças que o <strong>professor</strong> pode fazer no currículo, metodologia e avaliação
                        </AlertDescription>
                      </Alert>
                      <ul className="space-y-2">
                        {recommendations.adaptations.map((adaptation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">▸</span>
                            <span className="text-sm">{adaptation}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="strategies" className="space-y-3 mt-4">
                      <Alert className="bg-green-50 border-green-200">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-xs text-green-800">
                          Recursos e condições que a <strong>escola/gestão</strong> deve fornecer
                        </AlertDescription>
                      </Alert>
                      <ul className="space-y-2">
                        {recommendations.strategies.map((strategy, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">▸</span>
                            <span className="text-sm">{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>

                  {/* Exemplos Práticos */}
                  {recommendations.examples && recommendations.examples.length > 0 && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        Exemplos Práticos:
                      </h4>
                      <ul className="space-y-2">
                        {recommendations.examples.map((example, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-yellow-600 mt-0.5">💡</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* Resumo de Todas as Recomendações */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-base">📋 Resumo das Recomendações</CardTitle>
              <CardDescription>Todas as adaptações e estratégias sugeridas para este PEI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Adaptações (Internas)
                  </h4>
                  <ul className="text-xs space-y-1">
                    {suggestedAdaptations.map((item, index) =>
                      item?.adaptations.slice(0, 3).map((adaptation, idx) => (
                        <li key={`${index}-${idx}`} className="flex items-start gap-1">
                          <span className="text-primary">•</span>
                          <span>{adaptation}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Estratégias (Externas)
                  </h4>
                  <ul className="text-xs space-y-1">
                    {suggestedAdaptations.map((item, index) =>
                      item?.strategies.slice(0, 3).map((strategy, idx) => (
                        <li key={`${index}-${idx}`} className="flex items-start gap-1">
                          <span className="text-primary">•</span>
                          <span>{strategy}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default BarrierAdaptationsSection

