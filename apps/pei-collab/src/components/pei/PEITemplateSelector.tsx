import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, GraduationCap, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Tipos baseados no schema do banco de dados e em CreatePEI.tsx
interface Barrier {
  id?: string;
  barrier_type: string;
  description: string;
  severity?: 'leve' | 'moderada' | 'severa';
}

interface PEIGoal {
  id?: string;
  description: string;
  target_date?: string;
  progress_level?: 'não iniciada' | 'em andamento' | 'parcialmente alcançada' | 'alcançada';
  progress_score?: number;
  notes?: string;
  strategies?: string[];
  evaluationCriteria?: string;
  resources?: string;
}

interface PEIReferral {
  id?: string;
  referred_to: string;
  reason?: string;
  date?: string;
  follow_up?: string;
}

interface DiagnosisData {
  interests: string;
  specialNeeds: string;
  barriers: Barrier[];
  history: string;
  cid10?: string;
  description?: string;
}

interface PlanningData {
  goals: PEIGoal[];
}

interface ReferralsData {
  referrals: PEIReferral[];
  observations: string;
}

interface PEITemplate {
  id: string;
  name: string;
  schoolLevel: string;
  condition: string;
  diagnosisData: DiagnosisData;
  planningData: PlanningData;
  referralsData: ReferralsData;
}

interface PEITemplateSelectorProps {
  onTemplateSelect: (template: PEITemplate) => void;
}

const templates: PEITemplate[] = [
  // Educação Infantil
  {
    id: "ei-tea",
    name: "Educação Infantil - TEA",
    schoolLevel: "Educação Infantil",
    condition: "TEA",
    diagnosisData: {
      interests: "Interesse por atividades sensoriais, brinquedos com texturas variadas, músicas infantis.",
      specialNeeds: "Transtorno do Espectro Autista (TEA) - Necessita de rotina estruturada, comunicação visual, apoio para interação social.",
      barriers: [
        { barrier_type: "Comunicacional", description: "Dificuldade na comunicação verbal", severity: "moderada" },
        { barrier_type: "Comunicacional", description: "Necessita de apoio visual (PECS, gestos)", severity: "moderada" },
        { barrier_type: "Comportamental", description: "Resistência a mudanças de rotina", severity: "moderada" },
        { barrier_type: "Comportamental", description: "Necessita de tempo para adaptação", severity: "moderada" },
        { barrier_type: "Pedagogica", description: "Dificuldade em atividades coletivas", severity: "moderada" },
        { barrier_type: "Pedagogica", description: "Necessita de atividades individualizadas", severity: "moderada" },
      ],
      history: "Criança de 4 anos com diagnóstico de TEA. Apresenta dificuldade na comunicação verbal e preferência por atividades solitárias. Família busca inclusão e desenvolvimento de habilidades sociais.",
      cid10: "F84.0",
      description: "Aluno com TEA, apresenta dificuldades na comunicação social e padrões restritos de comportamento. Necessita de apoio para interação e flexibilidade de rotina."
    },
    planningData: {
      goals: [
        {
          description: "Desenvolver comunicação funcional",
          strategies: ["Uso de comunicação alternativa (PECS)", "Rotina visual diária", "Atividades de expressão com apoio visual"],
          evaluationCriteria: "Consegue comunicar necessidades básicas usando 5 figuras do PECS",
          resources: "Material PECS, quadro de rotina visual, brinquedos sensoriais",
          progress_level: "não iniciada",
          progress_score: 0
        },
        {
          description: "Ampliar tempo de interação social",
          strategies: ["Brincadeiras pareadas com mediação", "Jogos cooperativos simples", "Círculo de conversa adaptado"],
          evaluationCriteria: "Participa de atividades em grupo por pelo menos 10 minutos com mediação",
          resources: "Brinquedos de interesse da criança, jogos adaptados",
          progress_level: "não iniciada",
          progress_score: 0
        }
      ]
    },
    referralsData: {
      referrals: [
        { referred_to: "Psicólogo", reason: "Apoio no desenvolvimento social e emocional" },
        { referred_to: "Fonoaudiólogo", reason: "Terapia da fala e comunicação" },
        { referred_to: "Terapeuta Ocupacional", reason: "Integração sensorial e habilidades motoras finas" }
      ],
      observations: "Importante manter comunicação constante com a família e profissionais da saúde. Registrar progressos semanalmente."
    }
  },
  {
    id: "ei-di",
    name: "Educação Infantil - DI",
    schoolLevel: "Educação Infantil",
    condition: "Deficiência Intelectual",
    diagnosisData: {
      interests: "Interesse por jogos de encaixe, atividades musicais, brincadeiras ao ar livre.",
      specialNeeds: "Deficiência Intelectual (DI) - Necessita de atividades adaptadas ao ritmo de aprendizagem, apoio individualizado.",
      barriers: [
        { barrier_type: "Pedagogica", description: "Ritmo de aprendizagem diferenciado", severity: "moderada" },
        { barrier_type: "Cognitiva", description: "Dificuldade em conceitos abstratos", severity: "moderada" },
        { barrier_type: "Metodologica", description: "Necessita de metodologias concretas e lúdicas", severity: "moderada" },
        { barrier_type: "Metodologica", description: "Repetição e reforço constante", severity: "moderada" },
      ],
      history: "Criança de 5 anos com DI. Apresenta desenvolvimento global mais lento, mas participa bem de atividades práticas e lúdicas.",
      cid10: "F70",
      description: "Diagnóstico de Deficiência Intelectual leve, com atraso no desenvolvimento cognitivo e adaptativo. Requer adaptações curriculares e suporte para autonomia."
    },
    planningData: {
      goals: [
        {
          description: "Desenvolver autonomia nas atividades diárias",
          strategies: ["Rotina visual estruturada", "Ensino passo a passo", "Reforço positivo constante"],
          evaluationCriteria: "Realiza 3 atividades de rotina (lavar mãos, guardar material, fazer lanche) com mínima supervisão",
          resources: "Quadro de rotina, materiais de higiene adaptados",
          progress_level: "não iniciada",
          progress_score: 0
        }
      ]
    },
    referralsData: {
      referrals: [
        { referred_to: "Psicólogo", reason: "Apoio no desenvolvimento cognitivo e emocional" },
        { referred_to: "Neuropsicólogo", reason: "Avaliação e intervenção neuropsicológica" }
      ],
      observations: "Estimular autonomia e independência. Valorizar pequenos progressos."
    }
  },
  // Ensino Fundamental
  {
    id: "ef-tdah",
    name: "Ensino Fundamental - TDAH",
    schoolLevel: "Ensino Fundamental",
    condition: "TDAH",
    diagnosisData: {
      interests: "Interesse por esportes, jogos interativos, atividades práticas.",
      specialNeeds: "Transtorno de Déficit de Atenção e Hiperatividade (TDAH) - Dificuldade de concentração, impulsividade, necessita de estratégias organizacionais.",
      barriers: [
        { barrier_type: "Pedagogica", description: "Dificuldade em manter atenção prolongada", severity: "moderada" },
        { barrier_type: "Pedagogica", description: "Necessita de pausas frequentes", severity: "moderada" },
        { barrier_type: "Metodologica", description: "Beneficia-se de atividades dinâmicas", severity: "moderada" },
        { barrier_type: "Metodologica", description: "Necessita de organização visual", severity: "moderada" },
        { barrier_type: "Comportamental", description: "Impulsividade afeta relações sociais", severity: "moderada" },
        { barrier_type: "Comportamental", description: "Necessita de mediação em conflitos", severity: "moderada" },
      ],
      history: "Aluno de 8 anos com diagnóstico de TDAH. Apresenta dificuldade de concentração e organização, mas é criativo e gosta de atividades práticas.",
      cid10: "F90.0",
      description: "Aluno com TDAH, apresenta dificuldade de concentração e organização. Requer estratégias para manter o foco e gerenciar impulsividade."
    },
    planningData: {
      goals: [
        {
          description: "Aumentar tempo de concentração nas atividades",
          strategies: ["Quebrar tarefas em etapas menores", "Uso de timer visual", "Pausas programadas a cada 15 minutos"],
          evaluationCriteria: "Consegue completar atividades de 20 minutos com até 2 pausas",
          resources: "Timer visual, checklist de tarefas, fidget toys",
          progress_level: "não iniciada",
          progress_score: 0
        },
        {
          description: "Desenvolver organização pessoal",
          strategies: ["Agenda visual", "Checklist diário", "Sistema de cores para materiais"],
          evaluationCriteria: "Utiliza agenda e organiza material com supervisão mínima",
          resources: "Agenda escolar, etiquetas coloridas, organizadores",
          progress_level: "não iniciada",
          progress_score: 0
        }
      ]
    },
    referralsData: {
      referrals: [
        { referred_to: "Psicólogo", reason: "Apoio no manejo do comportamento e estratégias de foco" },
        { referred_to: "Neurologista", reason: "Acompanhamento medicamentoso, se necessário" },
        { referred_to: "Psicopedagogo", reason: "Estratégias de aprendizagem e organização" }
      ],
      observations: "Importante trabalhar autoestima e autorregulação emocional. Manter família informada sobre estratégias."
    }
  },
  {
    id: "ef-dislexia",
    name: "Ensino Fundamental - Dislexia",
    schoolLevel: "Ensino Fundamental",
    condition: "Dislexia",
    diagnosisData: {
      interests: "Interesse por histórias, atividades artísticas, aulas práticas.",
      specialNeeds: "Dislexia - Dificuldade específica na leitura e escrita, necessita de apoio e metodologias diferenciadas.",
      barriers: [
        { barrier_type: "Pedagogica", description: "Dificuldade na decodificação de palavras", severity: "moderada" },
        { barrier_type: "Pedagogica", description: "Lentidão na leitura", severity: "moderada" },
        { barrier_type: "Metodologica", description: "Beneficia-se de material audiovisual", severity: "moderada" },
        { barrier_type: "Metodologica", description: "Necessita de mais tempo para leitura", severity: "moderada" },
        { barrier_type: "Tecnologica", description: "Pode utilizar ferramentas de apoio (áudio livros, leitores de tela)", severity: "moderada" },
      ],
      history: "Aluno de 10 anos com diagnóstico de dislexia. Inteligente e criativo, mas enfrenta grandes dificuldades na leitura e escrita.",
      cid10: "F81.0",
      description: "Aluno com dislexia, apresenta dificuldades na leitura e escrita. Requer abordagens multissensoriais e tempo adicional para tarefas."
    },
    planningData: {
      goals: [
        {
          description: "Melhorar fluência de leitura",
          strategies: ["Leitura compartilhada", "Uso de régua de leitura", "Textos com fonte adaptada (OpenDyslexic)"],
          evaluationCriteria: "Lê textos curtos com menos erros e maior fluência",
          resources: "Régua de leitura, textos adaptados, audiolivros",
          progress_level: "não iniciada",
          progress_score: 0
        },
        {
          description: "Fortalecer autoestima acadêmica",
          strategies: ["Valorizar produções orais", "Permitir avaliações alternativas", "Destacar pontos fortes"],
          evaluationCriteria: "Participa ativamente demonstrando confiança em suas capacidades",
          resources: "Reconhecimento verbal, certificados de progresso",
          progress_level: "não iniciada",
          progress_score: 0
        }
      ]
    },
    referralsData: {
      referrals: [
        { referred_to: "Psicopedagogo", reason: "Intervenção específica para leitura e escrita" },
        { referred_to: "Fonoaudiólogo", reason: "Apoio no processamento fonológico" }
      ],
      observations: "Não confundir dificuldade de leitura com falta de inteligência. Estimular outras formas de expressão."
    }
  },
  // Ensino Médio
  {
    id: "em-altas-habilidades",
    name: "Ensino Médio - Altas Habilidades",
    schoolLevel: "Ensino Médio",
    condition: "Altas Habilidades",
    diagnosisData: {
      interests: "Interesse por temas científicos, debates, pesquisas acadêmicas, projetos complexos.",
      specialNeeds: "Altas Habilidades/Superdotação - Necessita de enriquecimento curricular, desafios intelectuais, projetos diferenciados.",
      barriers: [
        { barrier_type: "Pedagogica", description: "Ritmo de aprendizagem acelerado", severity: "leve" },
        { barrier_type: "Pedagogica", description: "Necessita de aprofundamento", severity: "leve" },
        { barrier_type: "Metodologica", description: "Currículo regular pode ser insuficiente", severity: "leve" },
        { barrier_type: "Metodologica", description: "Necessita de projetos desafiadores", severity: "leve" },
      ],
      history: "Estudante de 16 anos com altas habilidades em ciências exatas. Demonstra facilidade acima da média e busca por desafios.",
      cid10: "Z73.8", // Exemplo de código para altas habilidades
      description: "Estudante com altas habilidades, demonstra grande potencial em áreas específicas. Requer desafios intelectuais e oportunidades de aprofundamento."
    },
    planningData: {
      goals: [
        {
          description: "Proporcionar enriquecimento curricular",
          strategies: ["Projetos de pesquisa avançados", "Mentoria com professores universitários", "Participação em olimpíadas científicas"],
          evaluationCriteria: "Desenvolve projeto de pesquisa e apresenta resultados",
          resources: "Material bibliográfico avançado, laboratórios, orientação especializada",
          progress_level: "não iniciada",
          progress_score: 0
        }
      ]
    },
    referralsData: {
      referrals: [
        { referred_to: "Psicólogo", reason: "Apoio no desenvolvimento socioemocional e gestão de expectativas" }
      ],
      observations: "Importante trabalhar aspectos socioemocionais e evitar isolamento. Estimular a interação com pares de interesse."
    }
  },
];

export function PEITemplateSelector({ onTemplateSelect }: PEITemplateSelectorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const levels = ["Educação Infantil", "Ensino Fundamental", "Ensino Médio"];
  const conditions = ["TEA", "TDAH", "DI", "Dislexia", "Altas Habilidades", "DA", "DV", "DF", "TOD"];

  const handleTemplateSelect = (template: PEITemplate) => {
    onTemplateSelect(template);
    setOpen(false);
    toast({
      title: "Modelo aplicado!",
      description: `O modelo \"${template.name}\" foi carregado. Você pode editá-lo conforme necessário.`,
    });
  };

  const filteredTemplates = selectedLevel
    ? templates.filter(t => t.schoolLevel === selectedLevel)
    : templates;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto">
          <FileText className="mr-2 h-4 w-4" />
          Usar Modelo Pré-preenchido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Modelos de PEI Pré-preenchidos
          </DialogTitle>
          <DialogDescription>
            Selecione um modelo baseado no nível de escolaridade e necessidade específica do aluno.
            Você poderá editar todas as informações após carregar o modelo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtro por nível de escolaridade */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Nível de Escolaridade
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedLevel === null ? "default" : "outline"}
                onClick={() => setSelectedLevel(null)}
              >
                Todos
              </Button>
              {levels.map((level) => (
                <Button
                  key={level}
                  size="sm"
                  variant={selectedLevel === level ? "default" : "outline"}
                  onClick={() => setSelectedLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Lista de templates */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Modelos Disponíveis ({filteredTemplates.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {template.schoolLevel}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{template.condition}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        <strong>Inclui:</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Diagnóstico pré-preenchido</li>
                        <li>{template.planningData.goals.length} meta(s) de planejamento</li>
                        <li>Encaminhamentos sugeridos</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum modelo disponível para este filtro.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}