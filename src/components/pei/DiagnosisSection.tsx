import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { HelpCircle, Lightbulb, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Tipos baseados no schema do banco
interface Barrier {
  id?: string;
  pei_id?: string;
  barrier_type: string;
  description: string;
  severity?: 'leve' | 'moderada' | 'severa';
}

interface DiagnosisData {
  interests: string;
  specialNeeds: string;
  barriers: Barrier[];
  history: string;
  cid10?: string;
  description?: string;
  // ✅ Campos Estendidos
  aversions?: string;
  abilities?: string;
  barriersComments?: string;
  strengths?: string;
  challenges?: string;
  familyNeeds?: string;
  familyExpectations?: string;
  // 🆕 Relatório Circunstanciado
  circumstantial_report?: {
    how_student_learns?: string;
    learning_barriers?: string;
    social_interaction?: string;
    communication?: string;
    attention?: string;
    autonomy?: string;
    behavior?: string;
    emotional_context?: string;
    observations?: string;
  };
  // 🆕 Nível de Desenvolvimento
  development_level?: {
    language?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    reading?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    writing?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    logical_reasoning?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    motor_coordination?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    social_skills?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
  };
  // 🆕 Informações de Saúde
  health_info?: {
    condition_impact?: string;
    curriculum_adaptations?: string[];
    behavioral_adaptations?: string[];
    examples?: string;
  };
}

interface DiagnosisSectionProps {
  diagnosisData: DiagnosisData;
  onDiagnosisChange: (data: DiagnosisData) => void;
}

const DiagnosisSection = ({ diagnosisData, onDiagnosisChange }: DiagnosisSectionProps) => {
  const [openSections, setOpenSections] = useState<string[]>(["history", "profile", "barriers"]);
  
  const handleChange = (field: keyof DiagnosisData, value: any) => {
    onDiagnosisChange({ ...diagnosisData, [field]: value });
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Categorias e itens de barreiras (mantém a interface do usuário)
  const barrierCategories = [
    { 
      id: "Cognitiva", 
      label: "🧠 Cognitiva",
      items: [
        { id: "dificuldade_atencao", label: "Dificuldade de atenção e concentração" },
        { id: "memoria", label: "Dificuldades de memória" },
        { id: "raciocinio", label: "Dificuldades de raciocínio lógico" },
        { id: "processamento", label: "Lentidão no processamento de informações" },
        { id: "abstratos", label: "Dificuldade com conceitos abstratos" },
      ]
    },
    { 
      id: "Comportamental", 
      label: "🎭 Comportamental",
      items: [
        { id: "impulsividade", label: "Impulsividade" },
        { id: "agitacao", label: "Agitação motora" },
        { id: "oposicao", label: "Comportamento opositor" },
        { id: "agressividade", label: "Agressividade" },
        { id: "dificuldade_regras", label: "Dificuldade em seguir regras" },
      ]
    },
    { 
      id: "Sensorial", 
      label: "👁️ Sensorial",
      items: [
        { id: "visual", label: "Dificuldades visuais" },
        { id: "auditiva", label: "Dificuldades auditivas" },
        { id: "hipersensibilidade", label: "Hipersensibilidade sensorial" },
        { id: "hiposensibilidade", label: "Hiposensibilidade sensorial" },
        { id: "processamento_sensorial", label: "Dificuldades de processamento sensorial" },
      ]
    },
    { 
      id: "Motora", 
      label: "🏃 Motora",
      items: [
        { id: "coordenacao_fina", label: "Dificuldades de coordenação motora fina" },
        { id: "coordenacao_grossa", label: "Dificuldades de coordenação motora grossa" },
        { id: "equilibrio", label: "Dificuldades de equilíbrio" },
        { id: "escrita", label: "Dificuldades na escrita (disgrafia)" },
        { id: "locomocao", label: "Limitações na locomoção" },
      ]
    },
    { 
      id: "Comunicacional", 
      label: "💬 Comunicacional",
      items: [
        { id: "expressao_verbal", label: "Dificuldade na expressão verbal" },
        { id: "compreensao", label: "Dificuldade na compreensão" },
        { id: "linguagem_nao_verbal", label: "Dificuldade na linguagem não verbal" },
        { id: "articulacao", label: "Dificuldades de articulação" },
        { id: "comunicacao_alternativa", label: "Necessita de comunicação alternativa" },
      ]
    },
    { 
      id: "Socioemocional", 
      label: "❤️ Socioemocional",
      items: [
        { id: "interacao_social", label: "Dificuldades na interação social" },
        { id: "autorregulacao", label: "Dificuldades de autorregulação emocional" },
        { id: "ansiedade", label: "Ansiedade" },
        { id: "baixa_autoestima", label: "Baixa autoestima" },
        { id: "resistencia_mudancas", label: "Resistência a mudanças" },
      ]
    },
    { 
      id: "Outra", 
      label: "🔧 Outra",
      items: []
    },
  ];

  const handleBarrierToggle = (category: string, itemId: string, itemLabel: string) => {
    // Garante que diagnosisData.barriers é um array antes de usar
    const currentBarriers = Array.isArray(diagnosisData.barriers) ? diagnosisData.barriers : [];
    const barrierExists = currentBarriers.some(
      b => b.barrier_type === category && b.description === itemLabel
    );
    
    let newBarriers: Barrier[];
    if (barrierExists) {
      newBarriers = currentBarriers.filter(
        b => !(b.barrier_type === category && b.description === itemLabel)
      );
    } else {
      newBarriers = [
        ...currentBarriers,
        {
          barrier_type: category,
          description: itemLabel,
          severity: 'moderada' // Valor padrão, pode ser ajustado conforme necessidade
        }
      ];
    }
    
    onDiagnosisChange({ ...diagnosisData, barriers: newBarriers });
  };

  const isBarrierChecked = (category: string, itemLabel: string): boolean => {
    // Garante que diagnosisData.barriers é um array antes de usar
    return Array.isArray(diagnosisData.barriers) && diagnosisData.barriers.some(
      b => b.barrier_type === category && b.description === itemLabel
    );
  };

  const ExampleTooltip = ({ examples, tutorial }: { examples: string[], tutorial: string }) => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button type="button" className="ml-2 inline-flex items-center text-primary hover:text-primary/80">
          <Lightbulb className="h-4 w-4" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-2">💡 Exemplos:</h4>
            <ul className="text-xs space-y-1 list-disc pl-4">
              {examples.map((example, idx) => (
                <li key={idx}>{example}</li>
              ))}
            </ul>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{tutorial}</span>
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Diagnóstico do Aluno</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Preencha as informações sobre o perfil do aluno para construir um diagnóstico completo.
        </p>
      </div>

      <div className="space-y-3">
        {/* Histórico do Estudante */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("history")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">📖</span>
                <span className="font-semibold">Histórico do Estudante</span>
              </CardTitle>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${
                  openSections.includes("history") ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
          {openSections.includes("history") && (
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center">
                <Label htmlFor="history" className="text-sm">Histórico completo</Label>
                <ExampleTooltip
                  examples={[
                    "Aluno matriculado desde 2020, com acompanhamento multidisciplinar desde então",
                    "Apresentou atraso no desenvolvimento da fala, iniciou fonoaudiologia aos 3 anos",
                    "Família participativa, mãe acompanha todas as atividades escolares"
                  ]}
                  tutorial="Descreva o trajeto escolar do aluno, seu desenvolvimento ao longo do tempo, contexto familiar e qualquer informação relevante que ajude a compreender sua trajetória educacional."
                />
              </div>
              <Textarea
                id="history"
                placeholder="Descreva o histórico escolar, desenvolvimento, contexto familiar e outras informações relevantes..."
                value={diagnosisData.history || ""}
                onChange={(e) => handleChange("history", e.target.value)}
                rows={5}
              />
            </CardContent>
          )}
        </Card>

        {/* Perfil do Aluno */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("profile")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">👤</span>
                <span className="font-semibold">Perfil do Aluno</span>
              </CardTitle>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${
                  openSections.includes("profile") ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
          {openSections.includes("profile") && (
            <CardContent className="pt-4 space-y-6">
              <div>
                <div className="flex items-center mb-2">
                  <Label htmlFor="interests" className="text-sm">🎯 Interesses do Aluno</Label>
                  <ExampleTooltip
                    examples={[
                      "Demonstra grande interesse por música, gosta de cantar e tocar instrumentos",
                      "Adora atividades com animais, especialmente cães e gatos",
                      "Fascínio por tecnologia, tablets e jogos educativos digitais"
                    ]}
                    tutorial="Identifique o que motiva e engaja o aluno. Esses interesses podem ser usados como estratégias pedagógicas para facilitar o aprendizado e aumentar o engajamento nas atividades."
                  />
                </div>
                <Input
                  id="interests"
                  placeholder="Ex: música, arte, esportes, tecnologia..."
                  value={diagnosisData.interests || ""}
                  onChange={(e) => handleChange("interests", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Liste os principais interesses e atividades que motivam o aluno
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <Label htmlFor="specialNeeds" className="text-sm">📋 Necessidades Educacionais Especiais</Label>
                  <ExampleTooltip
                    examples={[
                      "Diagnóstico de Transtorno do Espectro Autista (TEA) - Nível 1, com laudo médico de 2022",
                      "Deficiência intelectual leve, com necessidade de adaptações curriculares",
                      "TDAH combinado, em tratamento medicamentoso e acompanhamento psicológico"
                    ]}
                    tutorial="Registre diagnósticos formais, laudos médicos, avaliações psicopedagógicas e todas as necessidades educacionais especiais identificadas. Seja específico quanto aos níveis de comprometimento e às áreas afetadas."
                  />
                </div>
                <Textarea
                  id="specialNeeds"
                  placeholder="Descreva as necessidades educacionais especiais identificadas, diagnósticos médicos ou psicopedagógicos relevantes..."
                  value={diagnosisData.specialNeeds || ""}
                  onChange={(e) => handleChange("specialNeeds", e.target.value)}
                  rows={5}
                />
              </div>

              {/* CID-10 e Descrição do Diagnóstico */}
              <div>
                <div className="flex items-center mb-2">
                  <Label htmlFor="cid10" className="text-sm">CID-10</Label>
                  <ExampleTooltip
                    examples={[
                      "F84.0 - Autismo infantil",
                      "F70 - Retardo mental leve",
                      "F90.0 - Transtorno do déficit de atenção com hiperatividade, tipo combinado"
                    ]}
                    tutorial="Código da Classificação Internacional de Doenças (CID-10) referente ao diagnóstico principal do aluno, se houver."
                  />
                </div>
                <Input
                  id="cid10"
                  placeholder="Ex: F84.0"
                  value={diagnosisData.cid10 || ""}
                  onChange={(e) => handleChange("cid10", e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <Label htmlFor="description" className="text-sm">Descrição Detalhada do Diagnóstico</Label>
                  <ExampleTooltip
                    examples={[
                      "Aluno com TEA, apresenta dificuldades na comunicação social e padrões restritos de comportamento. Necessita de apoio para interação e flexibilidade de rotina.",
                      "Diagnóstico de Deficiência Intelectual leve, com atraso no desenvolvimento cognitivo e adaptativo. Requer adaptações curriculares e suporte para autonomia."
                    ]}
                    tutorial="Forneça uma descrição detalhada do diagnóstico, incluindo observações sobre o impacto nas áreas de desenvolvimento e aprendizagem do aluno."
                  />
                </div>
                <Textarea
                  id="description"
                  placeholder="Descreva o diagnóstico de forma detalhada..."
                  value={diagnosisData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={5}
                />
              </div>

              {/* 🆕 HABILIDADES - O que já consegue fazer */}
              <div>
                <div className="flex items-center mb-2">
                  <Label htmlFor="abilities" className="text-sm">💪 Habilidades - O que já consegue fazer</Label>
                  <ExampleTooltip
                    examples={[
                      "Reconhece letras do alfabeto, escreve o nome com autonomia",
                      "Interage bem com colegas, segue instruções simples",
                      "Identifica moedas e números até 50, faz contagem básica"
                    ]}
                    tutorial="Liste as habilidades que o aluno já desenvolveu. Isso ajuda a identificar pontos fortes que podem ser usados como base para novas aprendizagens."
                  />
                </div>
                <Textarea
                  id="abilities"
                  placeholder="Ex: Reconhece letras, escreve o nome, interage com colegas, segue instruções simples, identifica moedas..."
                  value={diagnosisData.abilities || diagnosisData.strengths || ""}
                  onChange={(e) => handleChange("abilities", e.target.value)}
                  rows={3}
                />
              </div>

              {/* 🆕 AVERSÕES - Desinteresses */}
              <div>
                <div className="flex items-center mb-2">
                  <Label htmlFor="aversions" className="text-sm">⚠️ Desinteresses / Aversões</Label>
                  <ExampleTooltip
                    examples={[
                      "Sensibilidade a barulhos altos, prefere ambientes tranquilos",
                      "Não gosta de mudanças bruscas de rotina, causa ansiedade",
                      "Aversão a determinadas texturas de alimentos ou materiais"
                    ]}
                    tutorial="Identifique situações, atividades ou estímulos que causam desconforto, ansiedade ou recusa no aluno. Conhecer essas aversões ajuda a evitar gatilhos e adaptar o ambiente."
                  />
                </div>
                <Textarea
                  id="aversions"
                  placeholder="Ex: Barulho alto, mudanças de rotina, contato físico, determinados temas ou matérias..."
                  value={diagnosisData.aversions || diagnosisData.challenges || ""}
                  onChange={(e) => handleChange("aversions", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Barreiras Identificadas */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("barriers")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">🚧</span>
                <span className="font-semibold">Barreiras Identificadas</span>
              </CardTitle>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${
                  openSections.includes("barriers") ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
          {openSections.includes("barriers") && (
            <CardContent className="pt-4">
              <div className="space-y-3 mb-4">
                <div className="flex items-center">
                  <Label className="text-sm">Selecione todas as barreiras aplicáveis</Label>
                  <ExampleTooltip
                    examples={[
                      "Cognitiva: Dificuldade de atenção e concentração nas atividades em sala",
                      "Comportamental: Impulsividade que afeta a interação com colegas",
                      "Motora: Dificuldades de coordenação motora fina para escrita"
                    ]}
                    tutorial="Identifique todos os tipos de barreiras que dificultam a aprendizagem e participação do aluno. Marque os itens específicos que se aplicam."
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {barrierCategories.map((category) => (
                  <Card key={category.id} className="border-l-4 border-l-primary/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{category.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {category.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`barrier-${item.id}`}
                            checked={isBarrierChecked(category.id, item.label)}
                            onCheckedChange={() => handleBarrierToggle(category.id, item.id, item.label)}
                          />
                          <label
                            htmlFor={`barrier-${item.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 🆕 COMENTÁRIOS SOBRE BARREIRAS */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center mb-2">
                  <Label htmlFor="barriersComments" className="text-sm">💬 Comentários e Observações sobre as Barreiras</Label>
                  <ExampleTooltip
                    examples={[
                      "Falta de sinalização tátil nos corredores dificulta orientação espacial",
                      "Ausência de intérprete de Libras limita participação nas aulas",
                      "Ruídos excessivos durante o recreio causam desregulação sensorial",
                      "Resistência docente em adaptar metodologias impacta o aprendizado"
                    ]}
                    tutorial="Descreva situações concretas e exemplos práticos das barreiras identificadas no ambiente escolar. Seja específico sobre como cada barreira impacta o aluno no dia a dia."
                  />
                </div>
                <Textarea
                  id="barriersComments"
                  placeholder="Descreva situações específicas ou exemplos práticos das barreiras no ambiente escolar..."
                  value={diagnosisData.barriersComments || ""}
                  onChange={(e) => handleChange("barriersComments", e.target.value)}
                  rows={4}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contextualize as barreiras marcadas acima com exemplos do cotidiano escolar
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 🆕 RELATÓRIO CIRCUNSTANCIADO (RC) */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("circumstantial_report")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <span className="font-semibold">Relatório Circunstanciado (RC)</span>
              </CardTitle>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${
                  openSections.includes("circumstantial_report") ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
          {openSections.includes("circumstantial_report") && (
            <CardContent className="pt-4 space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  O Relatório Circunstanciado descreve de forma ampla como o aluno aprende, suas barreiras, interação social, comunicação, atenção, autonomia, comportamento e contexto emocional.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="how_student_learns">Como o Aluno Aprende</Label>
                <Textarea
                  id="how_student_learns"
                  placeholder="Descreva como o aluno processa informações, quais estratégias funcionam melhor, estilos de aprendizagem..."
                  value={diagnosisData.circumstantial_report?.how_student_learns || ''}
                  onChange={(e) => {
                    const rc = diagnosisData.circumstantial_report || {}
                    handleChange('circumstantial_report', { ...rc, how_student_learns: e.target.value })
                  }}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="learning_barriers">Barreiras Encontradas no Aprendizado</Label>
                <Textarea
                  id="learning_barriers"
                  placeholder="Descreva as principais barreiras que impedem ou dificultam o aprendizado..."
                  value={diagnosisData.circumstantial_report?.learning_barriers || ''}
                  onChange={(e) => {
                    const rc = diagnosisData.circumstantial_report || {}
                    handleChange('circumstantial_report', { ...rc, learning_barriers: e.target.value })
                  }}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="social_interaction">Interação Social</Label>
                <Textarea
                  id="social_interaction"
                  placeholder="Como o aluno interage com colegas, professores, família. Habilidades sociais, dificuldades..."
                  value={diagnosisData.circumstantial_report?.social_interaction || ''}
                  onChange={(e) => {
                    const rc = diagnosisData.circumstantial_report || {}
                    handleChange('circumstantial_report', { ...rc, social_interaction: e.target.value })
                  }}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="communication">Comunicação</Label>
                <Textarea
                  id="communication"
                  placeholder="Formas de comunicação, expressão oral, compreensão, uso de gestos, comunicação alternativa..."
                  value={diagnosisData.circumstantial_report?.communication || ''}
                  onChange={(e) => {
                    const rc = diagnosisData.circumstantial_report || {}
                    handleChange('circumstantial_report', { ...rc, communication: e.target.value })
                  }}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="attention">Atenção e Concentração</Label>
                <Textarea
                  id="attention"
                  placeholder="Tempo de atenção, fatores que distraem, estratégias que ajudam a manter o foco..."
                  value={diagnosisData.circumstantial_report?.attention || ''}
                  onChange={(e) => {
                    const rc = diagnosisData.circumstantial_report || {}
                    handleChange('circumstantial_report', { ...rc, attention: e.target.value })
                  }}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="autonomy">Autonomia</Label>
                <Textarea
                  id="autonomy"
                  placeholder="O que o aluno faz sozinho, o que precisa de ajuda, nível de independência..."
                  value={diagnosisData.circumstantial_report?.autonomy || ''}
                  onChange={(e) => {
                    const rc = diagnosisData.circumstantial_report || {}
                    handleChange('circumstantial_report', { ...rc, autonomy: e.target.value })
                  }}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="behavior">Comportamento</Label>
                <Textarea
                  id="behavior"
                  placeholder="Padrões comportamentais, autorregulação, seguimento de regras, adaptação a mudanças..."
                  value={diagnosisData.circumstantial_report?.behavior || ''}
                  onChange={(e) => {
                    const rc = diagnosisData.circumstantial_report || {}
                    handleChange('circumstantial_report', { ...rc, behavior: e.target.value })
                  }}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="emotional_context">Contexto Emocional</Label>
                <Textarea
                  id="emotional_context"
                  placeholder="Estado emocional, expressão de sentimentos, fatores que afetam o bem-estar emocional..."
                  value={diagnosisData.circumstantial_report?.emotional_context || ''}
                  onChange={(e) => {
                    const rc = diagnosisData.circumstantial_report || {}
                    handleChange('circumstantial_report', { ...rc, emotional_context: e.target.value })
                  }}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="rc_observations">Observações Gerais do RC</Label>
                <Textarea
                  id="rc_observations"
                  placeholder="Outras observações relevantes para o Relatório Circunstanciado..."
                  value={diagnosisData.circumstantial_report?.observations || ''}
                  onChange={(e) => {
                    const rc = diagnosisData.circumstantial_report || {}
                    handleChange('circumstantial_report', { ...rc, observations: e.target.value })
                  }}
                  rows={3}
                  className="mt-2"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* 🆕 NÍVEL DE DESENVOLVIMENTO E DESEMPENHO */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("development_level")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="font-semibold">Nível de Desenvolvimento e Desempenho</span>
              </CardTitle>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${
                  openSections.includes("development_level") ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
          {openSections.includes("development_level") && (
            <CardContent className="pt-4 space-y-6">
              <Alert className="bg-purple-50 border-purple-200">
                <Info className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-sm text-purple-800">
                  Detalhe o que o aluno já faz com autonomia, o que faz com ajuda, e o que ainda não realiza em cada área de desenvolvimento.
                </AlertDescription>
              </Alert>

              {['language', 'reading', 'writing', 'logical_reasoning', 'motor_coordination', 'social_skills'].map((area) => {
                const areaLabels: Record<string, string> = {
                  language: 'Linguagem',
                  reading: 'Leitura',
                  writing: 'Escrita',
                  logical_reasoning: 'Raciocínio Lógico',
                  motor_coordination: 'Coordenação Motora',
                  social_skills: 'Habilidades Sociais',
                }

                const areaData = diagnosisData.development_level?.[area as keyof typeof diagnosisData.development_level] || {}

                return (
                  <div key={area} className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-semibold text-sm">{areaLabels[area]}</h4>
                    
                    <div>
                      <Label className="text-xs text-green-700">✅ Com Autonomia</Label>
                      <Textarea
                        placeholder={`O que o aluno já faz sozinho em ${areaLabels[area].toLowerCase()}...`}
                        value={(areaData as any)?.autonomous?.join('\n') || ''}
                        onChange={(e) => {
                          const dl = diagnosisData.development_level || {}
                          const currentArea = dl[area as keyof typeof dl] || {}
                          handleChange('development_level', {
                            ...dl,
                            [area]: {
                              ...currentArea,
                              autonomous: e.target.value.split('\n').filter(Boolean),
                            },
                          })
                        }}
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-yellow-700">🟡 Com Ajuda</Label>
                      <Textarea
                        placeholder={`O que o aluno faz com apoio em ${areaLabels[area].toLowerCase()}...`}
                        value={(areaData as any)?.with_help?.join('\n') || ''}
                        onChange={(e) => {
                          const dl = diagnosisData.development_level || {}
                          const currentArea = dl[area as keyof typeof dl] || {}
                          handleChange('development_level', {
                            ...dl,
                            [area]: {
                              ...currentArea,
                              with_help: e.target.value.split('\n').filter(Boolean),
                            },
                          })
                        }}
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-red-700">❌ Ainda Não Realiza</Label>
                      <Textarea
                        placeholder={`O que o aluno ainda não consegue fazer em ${areaLabels[area].toLowerCase()}...`}
                        value={(areaData as any)?.not_yet?.join('\n') || ''}
                        onChange={(e) => {
                          const dl = diagnosisData.development_level || {}
                          const currentArea = dl[area as keyof typeof dl] || {}
                          handleChange('development_level', {
                            ...dl,
                            [area]: {
                              ...currentArea,
                              not_yet: e.target.value.split('\n').filter(Boolean),
                            },
                          })
                        }}
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          )}
        </Card>

        {/* 🆕 INFORMAÇÕES DE SAÚDE E IMPLICAÇÕES CURRICULARES */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection("health_info")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                <span className="font-semibold">Saúde e Implicações Curriculares</span>
              </CardTitle>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${
                  openSections.includes("health_info") ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
          {openSections.includes("health_info") && (
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label htmlFor="condition_impact">Como a Condição Impacta o Aprendizado</Label>
                <Textarea
                  id="condition_impact"
                  placeholder="Descreva como a condição de saúde (TEA, deficiência, etc.) impacta especificamente o processo de aprendizado..."
                  value={diagnosisData.health_info?.condition_impact || ''}
                  onChange={(e) => {
                    const hi = diagnosisData.health_info || {}
                    handleChange('health_info', { ...hi, condition_impact: e.target.value })
                  }}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Adaptações Curriculares Necessárias</Label>
                <Textarea
                  placeholder="Liste as adaptações curriculares necessárias (uma por linha)..."
                  value={(diagnosisData.health_info?.curriculum_adaptations || []).join('\n')}
                  onChange={(e) => {
                    const hi = diagnosisData.health_info || {}
                    handleChange('health_info', {
                      ...hi,
                      curriculum_adaptations: e.target.value.split('\n').filter(Boolean),
                    })
                  }}
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: Flexibilização de objetivos, reorganização da sequência didática, avaliações adaptadas
                </p>
              </div>

              <div>
                <Label>Adaptações Comportamentais Necessárias</Label>
                <Textarea
                  placeholder="Liste as adaptações comportamentais necessárias (uma por linha)..."
                  value={(diagnosisData.health_info?.behavioral_adaptations || []).join('\n')}
                  onChange={(e) => {
                    const hi = diagnosisData.health_info || {}
                    handleChange('health_info', {
                      ...hi,
                      behavioral_adaptations: e.target.value.split('\n').filter(Boolean),
                    })
                  }}
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: Rotina visual, apoio para transições, linguagem simples, pausas programadas
                </p>
              </div>

              <div>
                <Label htmlFor="health_examples">Exemplos Práticos</Label>
                <Textarea
                  id="health_examples"
                  placeholder="Descreva exemplos práticos de como essas adaptações são aplicadas no dia a dia..."
                  value={diagnosisData.health_info?.examples || ''}
                  onChange={(e) => {
                    const hi = diagnosisData.health_info || {}
                    handleChange('health_info', { ...hi, examples: e.target.value })
                  }}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DiagnosisSection;
