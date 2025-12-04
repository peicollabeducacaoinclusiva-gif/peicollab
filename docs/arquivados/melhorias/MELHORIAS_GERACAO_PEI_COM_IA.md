# 🤖 Melhorias na Geração de PEI com Inteligência Artificial

**Data:** 06/11/2024  
**Funcionalidade:** Planejamento de PEI com IA baseado em evidências  
**Status:** ✅ **IMPLEMENTADO E APRIMORADO**

---

## 🎯 Objetivo das Melhorias

Transformar a geração de planejamento de PEI com IA de um assistente básico para um **especialista pedagógico robusto**, que produz:
- ✅ Metas baseadas em evidências científicas
- ✅ Estratégias fundamentadas em DUA (Design Universal para Aprendizagem)
- ✅ Objetivos SMART bem estruturados
- ✅ Metas acadêmicas alinhadas à BNCC
- ✅ Metas funcionais baseadas em AEE
- ✅ Textos detalhados e profissionais

---

## 📚 Fundamentos Pedagógicos Implementados

### **1. Design Universal para Aprendizagem (DUA)**

#### **O que é?**
Framework educacional que promove acesso equitativo à aprendizagem através de três princípios:

1. **Múltiplas Formas de Representação**
   - Como o conteúdo é apresentado
   - Diferentes formatos (visual, auditivo, tátil)
   - Adaptações e recursos diversos

2. **Múltiplas Formas de Ação e Expressão**
   - Como o aluno demonstra o aprendizado
   - Diferentes formas de resposta
   - Opções de comunicação variadas

3. **Múltiplas Formas de Engajamento**
   - Como motivar e manter o interesse
   - Conexão com interesses pessoais
   - Estratégias de autorregulação

#### **Como está implementado:**
```json
"duaPrinciples": {
  "representation": "Uso de materiais visuais (cartazes, pictogramas), áudio-livros e objetos manipulativos para apresentar conceitos matemáticos de múltiplas formas",
  "actionExpression": "Permitir que o aluno demonstre compreensão através de desenhos, construções com blocos, ou respostas orais, não apenas escrita",
  "engagement": "Conectar atividades matemáticas com o interesse do aluno em dinossauros, utilizando contagem e classificação de réplicas"
}
```

---

### **2. Base Nacional Comum Curricular (BNCC)**

#### **O que é?**
Documento normativo que define o conjunto de aprendizagens essenciais que todos os alunos devem desenvolver ao longo da Educação Básica.

#### **Estrutura BNCC:**
- **Competências gerais** (10 competências)
- **Competências específicas por área**
- **Habilidades** (codificadas, ex: EF15LP01)

#### **Como está implementado:**

**Metas Acadêmicas devem citar códigos BNCC:**

```json
{
  "title": "Leitura e Compreensão de Textos Narrativos",
  "type": "academica",
  "bnccCode": "EF15LP03",
  "description": "Desenvolver a habilidade de leitura e compreensão de textos narrativos curtos (até 150 palavras), identificando personagens, cenário e sequência de eventos, com 80% de acerto em atividades adaptadas, alinhado à habilidade EF15LP03 da BNCC, em um período de 4 meses"
}
```

**Exemplo de códigos BNCC por área:**
- **Língua Portuguesa:** EF15LP01, EF15LP03, EF35LP01
- **Matemática:** EF01MA01, EF05MA08
- **Ciências:** EF01CI01, EF05CI06

---

### **3. Atendimento Educacional Especializado (AEE)**

#### **O que é?**
Serviço da Educação Especial que identifica, elabora e organiza recursos pedagógicos e de acessibilidade que eliminem barreiras para a plena participação dos alunos.

#### **Objetivos do AEE:**
1. **Autonomia:** Habilidades para vida independente
2. **Comunicação:** Desenvolvimento de linguagem e interação
3. **Interação Social:** Convivência e relacionamento
4. **Autocuidado:** Higiene, alimentação, organização
5. **Funções Executivas:** Planejamento, atenção, memória

#### **Como está implementado:**

**Metas Funcionais focadas no AEE:**

```json
{
  "title": "Desenvolvimento da Comunicação Funcional",
  "type": "funcional",
  "bnccCode": null,
  "description": "Desenvolver a capacidade de expressar necessidades básicas (água, banheiro, ajuda) utilizando sistema de comunicação alternativa (PECS nível 2), de forma autônoma em 70% das situações do cotidiano escolar, no prazo de 5 meses",
  "theoreticalBasis": "Baseado no Picture Exchange Communication System (PECS) com evidências robustas para alunos com TEA (Bondy & Frost, 1994)"
}
```

---

### **4. Metas SMART**

#### **O que são?**
Metas bem formuladas que seguem 5 critérios:

| Critério | Significado | Exemplo |
|----------|-------------|---------|
| **S**pecífica | Detalhada e clara | "Ler textos de 150 palavras" (não apenas "melhorar leitura") |
| **M**ensurável | Quantificável | "Com 80% de acerto" |
| **A**tingível | Realista | Considera potencialidades do aluno |
| **R**elevante | Alinhada com necessidades | Baseada no diagnóstico |
| **T**emporal | Prazo definido | "Em 4 meses" |

#### **Como está implementado:**

```json
{
  "description": "Desenvolver a habilidade de resolução de operações de adição simples (até 20), utilizando materiais concretos como apoio, alcançando 75% de acerto em 10 problemas contextualizados, no prazo de 3 meses (curto prazo), alinhado à habilidade EF01MA08 da BNCC"
}
```

---

### **5. Práticas Baseadas em Evidências**

#### **O que são?**
Estratégias e metodologias validadas por pesquisas científicas com resultados comprovados.

#### **Abordagens Reconhecidas Mencionadas:**

| Abordagem | Aplicação | Evidências |
|-----------|-----------|------------|
| **ABA** (Applied Behavior Analysis) | Modificação de comportamento, desenvolvimento de habilidades | Forte evidência para TEA |
| **TEACCH** (Treatment and Education of Autistic) | Estruturação do ambiente, rotinas visuais | Eficaz para TEA |
| **PECS** (Picture Exchange Communication System) | Comunicação alternativa | Evidência robusta para comunicação |
| **Método Fônico** | Alfabetização | National Reading Panel (2000) |
| **Instrução Explícita** | Ensino direto e sistemático | Meta-análises positivas |
| **Modelagem e Modelação** | Aprendizagem por observação | Bandura (1977) |

#### **Como está implementado:**

```json
{
  "theoreticalBasis": "Baseado em ABA (Análise do Comportamento Aplicada) com modelagem e reforço positivo, metodologia com evidências científicas robustas para desenvolvimento de habilidades sociais (Cooper et al., 2007)",
  "strategies": [
    "Utilizar ensino estruturado (abordagem TEACCH) com rotina visual diária, incluindo pictogramas para cada atividade, promovendo previsibilidade e redução de ansiedade",
    "Implementar instrução explícita com modelagem: professor demonstra a habilidade passo a passo, seguida de prática guiada e independente, com feedback imediato (estratégia baseada em evidências de Rosenshine, 2012)"
  ]
}
```

---

## 🆕 Estrutura Melhorada das Metas

### **Campos Adicionados:**

```typescript
interface Goal {
  // Campos básicos
  title: string;              // Título conciso (máx 80 caracteres)
  type: 'academica' | 'funcional'; // Tipo da meta
  description: string;        // Descrição SMART completa
  
  // 🆕 NOVOS CAMPOS ROBUSTOS
  bnccCode: string | null;                    // Código BNCC (ex: EF15LP03)
  theoreticalBasis: string;                   // Fundamentação teórica
  duaPrinciples: {
    representation: string;                   // DUA - Representação
    actionExpression: string;                 // DUA - Ação/Expressão
    engagement: string;                       // DUA - Engajamento
  };
  strategies: string[];                       // 3-4 estratégias detalhadas
  evaluationCriteria: string;                 // Critérios mensuráveis
  resources: string;                          // Recursos e tecnologias
  teamInvolvement: string;                    // Papéis da equipe
  timeline: 'curto_prazo' | 'medio_prazo' | 'longo_prazo';
  expectedProgress: string;                   // Progresso esperado
}
```

---

## 📊 Comparação: Antes vs. Depois

### **❌ ANTES (Básico)**

```json
{
  "description": "Melhorar a leitura do aluno",
  "strategies": [
    "Usar materiais adaptados",
    "Praticar leitura diariamente"
  ],
  "evaluationCriteria": "Observação do professor",
  "resources": "Livros e materiais visuais"
}
```

**Problemas:**
- Vago e genérico
- Sem fundamentação teórica
- Sem alinhamento com BNCC
- Não é mensurável
- Sem prazo definido
- Estratégias superficiais

---

### **✅ DEPOIS (Robusto)**

```json
{
  "title": "Leitura e Compreensão de Textos Narrativos Curtos",
  "type": "academica",
  "description": "Desenvolver a habilidade de leitura e compreensão de textos narrativos curtos (até 150 palavras), identificando personagens, cenário e sequência de eventos principais, com 80% de acerto em atividades adaptadas, alinhado à habilidade EF15LP03 da BNCC, no prazo de 4 meses",
  "bnccCode": "EF15LP03",
  "theoreticalBasis": "Baseado nos princípios da alfabetização funcional e no método fônico combinado com abordagem global (whole language), com evidências robustas de eficácia segundo o National Reading Panel (2000) e estudos nacionais de alfabetização",
  "duaPrinciples": {
    "representation": "Apresentar textos em múltiplos formatos: livros físicos com imagens grandes, áudio-livros com narração pausada, vídeos de contação de histórias, e textos digitais com opção de aumento de fonte e contraste",
    "actionExpression": "Permitir que o aluno demonstre compreensão através de múltiplas formas: reconto oral, sequência de imagens, desenhos, dramatização, ou uso de aplicativo de quadrinhos digitais",
    "engagement": "Conectar textos aos interesses do aluno em dinossauros e animais, utilizar histórias com personagens que enfrentam desafios similares, e incorporar elementos de gamificação (pontos, badges) para manter motivação"
  },
  "strategies": [
    "Implementar rotina de leitura compartilhada (15min diários): professor lê em voz alta com entonação, faz pausas para perguntas de compreensão (Quem? Onde? O que aconteceu?), e usa estratégia de think-aloud para modelar processos de compreensão",
    "Utilizar organizadores gráficos visuais (mapa de história) com espaços para colar imagens de personagens, cenário e eventos, promovendo compreensão da estrutura narrativa através de suporte visual concreto",
    "Aplicar técnica de pré-leitura com ativação de conhecimento prévio: explorar vocabulário-chave com cartões ilustrados, fazer previsões sobre a história baseadas na capa e título, conectando com experiências do aluno",
    "Praticar leitura em níveis graduados (leveled readers) começando em nível atual do aluno e aumentando complexidade progressivamente, com textos de interesse pessoal para aumentar engajamento e fluência"
  ],
  "evaluationCriteria": "Avaliação contínua através de rubrica adaptada com 4 níveis de progresso: Nível 1 (0-25%): identifica até 1 elemento da história; Nível 2 (26-50%): identifica 2 elementos; Nível 3 (51-75%): identifica 3 elementos com apoio; Nível 4 (76-100%): identifica personagens, cenário e eventos de forma autônoma. Registro semanal em portfólio com amostras de trabalho e observações anedóticas",
  "resources": "Coleção de livros paradidáticos nivelados (níveis A-C) com foco em narrativas, aplicativo gratuito 'Elefante Letrado' para leitura digital, fichas com imagens para organizadores gráficos, gravador de áudio para prática de fluência, cronômetro visual para rotina de leitura, e banco de imagens temáticas (dinossauros/animais) para conexão com interesses",
  "teamInvolvement": "Professor regente: conduz leitura compartilhada diária e registra progresso. Professor de AEE: prepara materiais adaptados e treina uso de organizadores gráficos 2x/semana. Família: pratica leitura compartilhada em casa 10min/dia com livros da biblioteca escolar",
  "timeline": "medio_prazo",
  "expectedProgress": "Ao final de 4 meses, espera-se que o aluno leia e compreenda textos narrativos de até 150 palavras, identificando personagens principais, onde a história acontece e a sequência de pelo menos 3 eventos, com 80% de acerto, de forma mais autônoma e com maior fluência"
}
```

**Vantagens:**
- ✅ Específico e mensurável (SMART)
- ✅ Fundamentado em evidências (National Reading Panel)
- ✅ Alinhado à BNCC (EF15LP03)
- ✅ Aplica princípios do DUA
- ✅ Estratégias detalhadas e práticas
- ✅ Avaliação com níveis claros
- ✅ Recursos específicos listados
- ✅ Papéis da equipe definidos
- ✅ Prazo e progresso esperado claros

---

## 🎯 Tipos de Metas Geradas

### **📚 Metas Acadêmicas (BNCC)**

**Áreas Curriculares:**
- Língua Portuguesa (leitura, escrita, oralidade)
- Matemática (números, operações, geometria)
- Ciências (observação, experimentação)
- História/Geografia (noções temporais, espaciais)
- Arte (expressão, criação)

**Características:**
- Sempre incluem código BNCC
- Alinhadas com ano/série escolar
- Focadas em competências curriculares
- Podem incluir adaptações e flexibilizações

---

### **🎯 Metas Funcionais (AEE)**

**Áreas de Desenvolvimento:**
- **Autonomia:** Independência em tarefas diárias
- **Comunicação:** Linguagem verbal/não-verbal
- **Interação Social:** Relacionamento com pares
- **Autocuidado:** Higiene, alimentação, vestuário
- **Funções Executivas:** Atenção, memória, planejamento
- **Mobilidade:** Locomoção e orientação espacial
- **Autorregulação:** Controle emocional e comportamental

**Características:**
- Não têm código BNCC (são do AEE)
- Focadas em habilidades para vida
- Promovem inclusão e participação
- Podem envolver tecnologias assistivas

---

## 🛠️ Como Funciona Tecnicamente

### **Fluxo de Geração:**

```
1. Professor preenche DIAGNÓSTICO
   ├─ Interesses e potencialidades
   ├─ Necessidades especiais
   └─ Barreiras identificadas

2. Professor clica "✨ Gerar com IA"

3. Frontend chama Edge Function
   └─ supabase/functions/generate-pei-planning

4. Edge Function envia para IA (Gemini 2.5)
   ├─ System prompt (persona do especialista)
   └─ User prompt (diagnóstico + instruções)

5. IA processa e retorna JSON estruturado

6. Edge Function valida e retorna

7. Frontend popula campos do planejamento
```

### **Tecnologias:**

- **IA:** Google Gemini 2.5 Flash
- **API:** Lovable AI Gateway
- **Runtime:** Deno Edge Functions
- **Linguagem:** TypeScript
- **Temperature:** 0.8 (criatividade controlada)

---

## 📝 Exemplo de Prompt Enviado para IA

```
Você é um especialista em Educação Inclusiva com profundo conhecimento em:
- Design Universal para Aprendizagem (DUA)
- Base Nacional Comum Curricular (BNCC)
- Atendimento Educacional Especializado (AEE)
- Práticas Baseadas em Evidências Científicas
- Tecnologias Assistivas e Recursos de Acessibilidade

Com base no diagnóstico do aluno abaixo, elabore um PLANO EDUCACIONAL INDIVIDUALIZADO (PEI) robusto e fundamentado.

DIAGNÓSTICO DO ALUNO:
Interesses e Potencialidades: Gosta muito de dinossauros e atividades com blocos de montar
Necessidades Educacionais Especiais: Transtorno do Espectro Autista (TEA) nível 1, com dificuldades na comunicação verbal e interação social
Barreiras Identificadas: Dificuldade em compreender instruções verbais longas, sensibilidade a ruídos altos

INSTRUÇÕES PARA ELABORAÇÃO DO PLANEJAMENTO:
Gere entre 4 a 6 METAS SMART sendo 2-3 acadêmicas (BNCC) e 2-3 funcionais (AEE)...
[prompt completo de 150+ linhas]
```

---

## ✅ Validações e Garantias

### **1. Validação de Conteúdo:**
- Verifica se retorna JSON válido
- Extrai JSON de markdown code blocks se necessário
- Trata erros de parsing graciosamente

### **2. Rate Limiting:**
- Detecta erro 429 (muitas requisições)
- Retorna mensagem amigável ao usuário

### **3. Créditos:**
- Detecta erro 402 (sem créditos)
- Informa necessidade de adicionar créditos

### **4. Qualidade da Resposta:**
- System prompt define persona especialista
- Temperature 0.8 equilibra criatividade e precisão
- Instruções detalhadas garantem resposta estruturada

---

## 🧪 Como Testar

### **1. Criar um Novo PEI:**
1. Login como professor
2. Ir para "Criar PEI"
3. Selecionar aluno
4. Preencher seção de **Diagnóstico** com:
   - Interesses do aluno
   - Necessidades educacionais especiais
   - Barreiras identificadas (opcional)
5. Na seção **Planejamento**, clicar **"✨ Gerar com IA"**

### **2. Aguardar Geração:**
- Pode levar 10-30 segundos
- Botão fica com loading

### **3. Verificar Resultado:**
- Metas devem aparecer preenchidas
- Verifique campos:
  - ✅ Título conciso
  - ✅ Tipo (acadêmica/funcional)
  - ✅ Descrição SMART detalhada
  - ✅ Código BNCC (para acadêmicas)
  - ✅ Fundamentação teórica
  - ✅ Princípios DUA (3 campos)
  - ✅ 3-4 estratégias detalhadas
  - ✅ Critérios de avaliação mensuráveis
  - ✅ Recursos específicos
  - ✅ Envolvimento da equipe
  - ✅ Prazo definido

### **4. Editar Conforme Necessário:**
- Professor pode ajustar/personalizar qualquer campo
- IA serve como ponto de partida robusto

---

## 📊 Métricas de Qualidade Esperadas

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Tamanho médio da descrição | 30-50 palavras | 80-120 palavras |
| Número de estratégias | 2 genéricas | 3-4 detalhadas |
| Fundamentação teórica | Nenhuma | Citação de estudos/métodos |
| Alinhamento BNCC | 0% | 50% das metas (acadêmicas) |
| Aplicação DUA | Implícito | Explícito em 3 dimensões |
| Mensurabilidade | Vaga | Critérios com % e níveis |
| Detalhamento recursos | Lista simples | Descrição específica |

---

## 🎓 Referências Implementadas

### **Frameworks e Metodologias:**
- **DUA** - CAST (2018). Universal Design for Learning Guidelines
- **BNCC** - Brasil. MEC (2018). Base Nacional Comum Curricular
- **Metas SMART** - Doran, G. T. (1981). Management Review
- **ABA** - Cooper, Heron & Heward (2007). Applied Behavior Analysis
- **TEACCH** - Mesibov & Shea (2010). Autism Spectrum Disorders
- **PECS** - Bondy & Frost (1994). Picture Exchange Communication System
- **Alfabetização** - National Reading Panel (2000)
- **Instrução Explícita** - Rosenshine (2012). Principles of Instruction

---

## 📁 Arquivos Modificados

### ✅ `supabase/functions/generate-pei-planning/index.ts`

**Mudanças:**
1. Prompt expandido de ~15 linhas para ~150 linhas
2. System prompt transformado em persona especialista
3. Estrutura JSON enriquecida com 10+ campos
4. Instruções detalhadas para cada seção
5. Exemplos de boas práticas incluídos
6. Temperature ajustada para 0.8

**Linhas modificadas:** 22-149 (prompt), 159-185 (system)

---

## 🚀 Próximos Passos (Futuro)

### **Melhorias Potenciais:**

1. **Adicionar exemplos de metas por faixa etária**
   - Educação Infantil
   - Anos Iniciais (1º-5º)
   - Anos Finais (6º-9º)

2. **Personalizar por tipo de NEE**
   - TEA (Transtorno do Espectro Autista)
   - Deficiência Intelectual
   - Deficiência Física
   - Surdez/Deficiência Auditiva
   - Cegueira/Baixa Visão
   - Altas Habilidades/Superdotação

3. **Integrar com banco de estratégias**
   - Biblioteca de estratégias validadas
   - Busca por tipo de necessidade
   - Rating de efetividade

4. **Feedback do Professor**
   - Avaliar qualidade das metas geradas
   - Melhorar prompts com base no feedback
   - Machine learning para personalização

---

## ✅ Checklist de Validação

- [x] ✅ Prompt expandido e detalhado
- [x] ✅ System prompt como especialista
- [x] ✅ Instruções para DUA incluídas
- [x] ✅ Requisito de códigos BNCC
- [x] ✅ Separação metas acadêmicas/funcionais
- [x] ✅ Formato SMART reforçado
- [x] ✅ Fundamentação teórica obrigatória
- [x] ✅ Estratégias detalhadas (3-4)
- [x] ✅ Critérios mensuráveis com níveis
- [x] ✅ Recursos específicos listados
- [x] ✅ Envolvimento da equipe definido
- [x] ✅ Prazos e progresso esperado
- [x] ✅ Exemplos de boas práticas
- [x] ✅ Validação de JSON
- [x] ✅ Tratamento de erros
- [x] ✅ Documentação completa

---

**🎉 Geração de PEI com IA agora é robusta, fundamentada e profissional!**

Os professores terão metas de alta qualidade como ponto de partida, alinhadas com BNCC, DUA, AEE e práticas baseadas em evidências.

---

**Autor:** AI Assistant  
**Data:** 06/11/2024  
**Versão:** 2.1  
**Arquivo:** MELHORIAS_GERACAO_PEI_COM_IA.md

