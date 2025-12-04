/**
 * Recomendações de Adaptações e Estratégias por Tipo de Barreira
 * 
 * Baseado em:
 * - Lei Brasileira de Inclusão (LBI - Lei 13.146/2015)
 * - Política Nacional de Educação Especial (2008)
 * - Diretrizes de Acessibilidade na Educação Inclusiva
 */

export interface BarrierRecommendation {
  barrier_type: string
  description: string
  adaptations: string[]
  strategies: string[]
  examples: string[]
}

/**
 * Adaptações Possíveis: Mudanças pedagógicas internas ao currículo e às práticas docentes
 * Estratégias de Acessibilidade: Condições externas e estruturais que viabilizam o acesso
 */
export const BARRIER_RECOMMENDATIONS: BarrierRecommendation[] = [
  {
    barrier_type: 'Pedagógica',
    description: 'Barreiras relacionadas às metodologias, conteúdos e formas de avaliação',
    adaptations: [
      'Flexibilização dos objetivos sem alterar conteúdos essenciais',
      'Reorganização da sequência didática',
      'Metodologias diversificadas e colaborativas',
      'Avaliações adaptadas (provas orais, portfólios, tempo ampliado)',
      'Prorrogação do tempo para conclusão de atividades',
      'Atividades complementares diferenciadas',
      'Redução da quantidade de exercícios mantendo a qualidade',
      'Uso de exemplos concretos para conceitos abstratos'
    ],
    strategies: [
      'Uso de materiais acessíveis (livros em linguagem simples, audiobooks, vídeos legendados)',
      'Recursos de tecnologia assistiva (softwares educativos, leitores de texto)',
      'Atendimento educacional especializado (AEE) em sala de recursos',
      'Materiais em formatos alternativos (braille, áudio, digital)',
      'Jogos educativos adaptados',
      'Materiais manipuláveis e concretos',
      'Recursos visuais (cartazes, esquemas, mapas mentais)'
    ],
    examples: [
      'Aluno com dificuldade de leitura recebe textos simplificados e avaliação oral',
      'Estudante com TDAH realiza provas com tempo estendido em sala separada',
      'Uso de calculadora para aluno com discalculia'
    ]
  },
  {
    barrier_type: 'Comunicacional',
    description: 'Barreiras na expressão e recepção de mensagens',
    adaptations: [
      'Adaptação de materiais com símbolos e pictogramas',
      'Utilização de Libras como primeira língua',
      'CAA - Comunicação Aumentativa e Alternativa',
      'Utilização de legendas em vídeos',
      'Audiodescrição em materiais visuais',
      'Linguagem simplificada e objetiva',
      'Comunicação visual e gestual'
    ],
    strategies: [
      'Intérprete de Libras em sala de aula',
      'Instrutor de Libras',
      'Comunicação facilitada ou apoiada',
      'Leitores de tela e sintetizadores de voz',
      'Softwares de comunicação alternativa',
      'Pranchas de comunicação',
      'Aplicativos de CAA (ARASAAC, Livox)'
    ],
    examples: [
      'Aluno surdo com intérprete de Libras acompanhando todas as aulas',
      'Estudante não verbal utiliza tablet com aplicativo de comunicação',
      'Materiais didáticos com pictogramas para aluno com autismo'
    ]
  },
  {
    barrier_type: 'Atitudinal',
    description: 'Barreiras relacionadas a preconceitos, estigmas e discriminação',
    adaptations: [
      'Formação e sensibilização da equipe escolar',
      'Desenvolvimento de práticas colaborativas entre professores',
      'Projetos pedagógicos que valorizem a diversidade',
      'Reuniões periódicas sobre inclusão',
      'Estudo de casos de sucesso',
      'Mediação de conflitos',
      'Promoção da empatia e respeito às diferenças'
    ],
    strategies: [
      'Formação continuada em educação inclusiva',
      'Campanhas e ações de convivência inclusiva',
      'Envolvimento da comunidade escolar e famílias',
      'Palestras sobre diversidade e inclusão',
      'Grupos de apoio entre professores',
      'Supervisão e acompanhamento pedagógico',
      'Valorização das potencialidades de cada aluno'
    ],
    examples: [
      'Formação mensal com professores sobre estratégias inclusivas',
      'Projeto "Talentos da Diversidade" valorizando habilidades de todos',
      'Roda de conversa com famílias sobre inclusão'
    ]
  },
  {
    barrier_type: 'Arquitetônica',
    description: 'Barreiras físicas nos espaços, mobiliários e equipamentos',
    adaptations: [
      'Adequação dos espaços físicos (rampas, portas amplas, corrimãos)',
      'Instalação de elevadores ou plataformas',
      'Instalação de mobiliário acessível',
      'Reorganização do layout das salas',
      'Adaptação de carteiras e cadeiras',
      'Adequação de laboratórios e bibliotecas',
      'Espaços de circulação ampliados'
    ],
    strategies: [
      'Sinalização tátil (piso tátil, placas em braille)',
      'Sinalização visual clara e objetiva',
      'Sinalização sonora (alarmes, avisos)',
      'Rotas acessíveis internas e externas',
      'Sanitários adaptados',
      'Bebedouros em alturas variadas',
      'Estacionamento preferencial',
      'Iluminação adequada'
    ],
    examples: [
      'Instalação de rampas de acesso para cadeirante',
      'Piso tátil nos corredores para aluno com deficiência visual',
      'Sanitário adaptado com barras de apoio'
    ]
  },
  {
    barrier_type: 'Tecnológica',
    description: 'Barreiras no acesso e uso de tecnologias',
    adaptations: [
      'Disponibilização de equipamentos adaptados',
      'Softwares e plataformas digitais acessíveis',
      'Recursos multimodais de aprendizagem',
      'Adaptação de interfaces digitais',
      'Tutoriais em formatos acessíveis',
      'Compatibilidade com tecnologias assistivas',
      'Flexibilização no uso de dispositivos pessoais'
    ],
    strategies: [
      'Uso intencional das tecnologias digitais na mediação pedagógica',
      'Acesso à internet de qualidade',
      'Dispositivos individuais (tablets, notebooks)',
      'Tecnologias assistivas: teclados ampliados, mouses adaptados',
      'Softwares de acessibilidade (NVDA, JAWS, ampliadores)',
      'Aplicativos educacionais inclusivos',
      'Suporte técnico especializado'
    ],
    examples: [
      'Aluno com deficiência visual usa leitor de tela no computador',
      'Teclado ampliado para estudante com baixa visão',
      'Tablet com aplicativos de CAA para aluno não verbal'
    ]
  },
  {
    barrier_type: 'Cognitiva',
    description: 'Barreiras relacionadas à atenção, memória, raciocínio e processamento',
    adaptations: [
      'Instruções claras, curtas e objetivas',
      'Divisão de tarefas complexas em etapas menores',
      'Uso de organizadores gráficos e mapas mentais',
      'Repetição e reforço de conteúdos essenciais',
      'Exemplos concretos e práticos',
      'Redução de estímulos distratores',
      'Tempo adicional para processamento'
    ],
    strategies: [
      'Atendimento individualizado ou em pequenos grupos',
      'Materiais com recursos visuais e concretos',
      'Jogos e atividades lúdicas',
      'Uso de tecnologias para organização (apps de planejamento)',
      'Rotinas estruturadas e previsíveis',
      'Apoio de mediador quando necessário',
      'Softwares educativos com feedback imediato'
    ],
    examples: [
      'Aluno com deficiência intelectual recebe atividades com apoio visual',
      'Estudante com TDAH usa timer para gestão de tempo',
      'Uso de checklist visual para sequência de tarefas'
    ]
  },
  {
    barrier_type: 'Comportamental',
    description: 'Barreiras relacionadas à impulsividade, agitação e autorregulação',
    adaptations: [
      'Estabelecimento de regras claras e consistentes',
      'Uso de reforço positivo',
      'Estratégias de autorregulação',
      'Pausas programadas',
      'Espaço de acolhimento para momentos de crise',
      'Contratos comportamentais',
      'Mediação de conflitos'
    ],
    strategies: [
      'Ambiente previsível e estruturado',
      'Técnicas de respiração e relaxamento',
      'Atividades físicas regulares',
      'Acompanhamento psicológico',
      'Comunicação escola-família constante',
      'Estratégias sensoriais (fidgets, almofadas)',
      'Apoio de profissional especializado quando necessário'
    ],
    examples: [
      'Aluno com TEA usa cartão de "preciso de pausa" quando ansioso',
      'Estudante com TOD participa de contrato comportamental com recompensas',
      'Uso de timer visual para transições entre atividades'
    ]
  },
  {
    barrier_type: 'Sensorial',
    description: 'Barreiras relacionadas à hipersensibilidade ou hiposensibilidade',
    adaptations: [
      'Adequação do ambiente (iluminação, ruídos)',
      'Uso de fones de proteção auditiva',
      'Oferta de diferentes texturas e materiais',
      'Respeito aos limites sensoriais',
      'Preparação para situações sensorialmente desafiadoras',
      'Flexibilização em atividades sensorialmente intensas'
    ],
    strategies: [
      'Sala com iluminação natural ou regulável',
      'Redução de estímulos visuais excessivos',
      'Espaço sensorial para autorregulação',
      'Materiais com texturas variadas',
      'Acompanhamento de terapia ocupacional',
      'Ferramentas de integração sensorial',
      'Comunicação prévia sobre mudanças'
    ],
    examples: [
      'Aluno com hipersensibilidade auditiva usa fones em momentos barulhentos',
      'Estudante com TEA tem acesso a sala sensorial para autorregulação',
      'Iluminação suave para aluno com fotossensibilidade'
    ]
  },
  {
    barrier_type: 'Motora',
    description: 'Barreiras relacionadas à locomoção e coordenação motora',
    adaptations: [
      'Adaptação de materiais escolares (tesouras, lápis)',
      'Uso de engrossadores para lápis/canetas',
      'Atividades alternativas para coordenação motora',
      'Tempo ampliado para atividades manuais',
      'Posicionamento adequado (cadeira, mesa)',
      'Redução da quantidade de escrita manual'
    ],
    strategies: [
      'Mobiliário adaptado (cadeiras, mesas, apoios)',
      'Tecnologias assistivas (teclado, mouse adaptado)',
      'Acompanhamento de fisioterapeuta',
      'Uso de computador ou tablet para escrita',
      'Materiais com preensão facilitada',
      'Apoios posturais',
      'Adaptação de banheiros e áreas de circulação'
    ],
    examples: [
      'Aluno com paralisia cerebral usa tablet com teclado virtual',
      'Estudante com dispraxia recebe engrossadores de lápis',
      'Cadeira adaptada com apoios laterais para aluno com hipotonia'
    ]
  },
  {
    barrier_type: 'Social',
    description: 'Barreiras na interação e participação social',
    adaptations: [
      'Atividades colaborativas estruturadas',
      'Ensino explícito de habilidades sociais',
      'Mediação de interações sociais',
      'Grupos pequenos inicialmente',
      'Projetos em duplas ou trios',
      'Uso de histórias sociais',
      'Modelagem de comportamentos sociais'
    ],
    strategies: [
      'Programa de habilidades sociais',
      'Buddy system (sistema de colegas)',
      'Apoio de psicólogo escolar',
      'Intervenções em grupo',
      'Comunicação alternativa para facilitar interação',
      'Espaços estruturados para socialização',
      'Envolvimento da família'
    ],
    examples: [
      'Aluno com TEA participa de grupo de habilidades sociais',
      'Estudante tímido é pareado com colega acolhedor (buddy)',
      'Uso de histórias sociais para preparar interações'
    ]
  }
]

/**
 * Obtém recomendações para um tipo específico de barreira
 */
export function getBarrierRecommendations(barrierType: string): BarrierRecommendation | undefined {
  return BARRIER_RECOMMENDATIONS.find(rec => 
    rec.barrier_type.toLowerCase() === barrierType.toLowerCase()
  )
}

/**
 * Obtém todas as adaptações possíveis para um tipo de barreira
 */
export function getAdaptationsForBarrier(barrierType: string): string[] {
  const recommendation = getBarrierRecommendations(barrierType)
  return recommendation?.adaptations || []
}

/**
 * Obtém todas as estratégias de acessibilidade para um tipo de barreira
 */
export function getStrategiesForBarrier(barrierType: string): string[] {
  const recommendation = getBarrierRecommendations(barrierType)
  return recommendation?.strategies || []
}

/**
 * Gera adaptações automáticas baseadas nas barreiras identificadas
 */
export function generateBarrierAdaptations(barriers: Array<{ barrier_type: string, description: string }>) {
  const adaptations = barriers.map(barrier => {
    const recommendations = getBarrierRecommendations(barrier.barrier_type)
    
    if (!recommendations) {
      return null
    }

    return {
      barrier_type: barrier.barrier_type as any,
      adaptations: recommendations.adaptations.slice(0, 3), // Top 3 mais relevantes
      strategies: recommendations.strategies.slice(0, 3),   // Top 3 mais relevantes
      priority: 'média' as const,
      implementation_status: 'planejada' as const
    }
  })

  return adaptations.filter(Boolean)
}

