# 💡 PROPOSTA: Sistema Integrado de Reuniões e Avaliações de PEI

**Data**: 10 de Novembro de 2025  
**Análise do Sistema Atual** + **Proposta de Melhorias**

---

## 📊 ANÁLISE DO SISTEMA ATUAL

### Estrutura do Banco de Dados (JÁ EXISTENTE)

#### 1. Tabela `pei_meetings` ✅
**Reuniões relacionadas a PEIs**

Campos principais:
- `meeting_date` - Data/hora da reunião
- `meeting_type` - Tipo: inicial, acompanhamento, final, extraordinária
- `title` - Título
- `description` - Descrição
- `agenda` (JSONB) - **Pauta estruturada**
- `minutes` (JSONB) - **Ata estruturada**
- `meeting_notes` - Notas gerais
- `location` - Local
- `status` - scheduled, in_progress, completed, cancelled
- `completed_at` - Data de conclusão

**Tabelas relacionadas**:
- `pei_meeting_participants` - Participantes (com assinatura)
- `pei_meeting_peis` - PEIs discutidos na reunião

---

#### 2. Tabela `pei_evaluations` ✅
**Avaliações cíclicas dos PEIs (I, II, III Ciclo)**

Campos principais:
- `pei_id` - PEI avaliado
- `cycle_number` - 1, 2 ou 3
- `cycle_name` - Nome do ciclo
- `academic_year` - Ano letivo
- `evaluation_data` (JSONB) - Dados da avaliação
- `goals_achieved` (JSONB) - Metas alcançadas
- `goals_partially_achieved` (JSONB) - Parcialmente
- `goals_not_achieved` (JSONB) - Não alcançadas
- `academic_progress` - Progresso acadêmico
- `social_progress` - Progresso social
- `behavioral_progress` - Comportamento
- `autonomy_progress` - Autonomia
- `teacher_recommendations` - Recomendações do professor
- `coordinator_recommendations` - **Recomendações do coordenador**
- `family_feedback` - Feedback da família
- `modifications_needed` - Modificações necessárias
- `new_goals` (JSONB) - Novas metas
- `next_steps` - Próximos passos
- `evaluated_by` / `reviewed_by` - Quem avaliou/revisou
- `status` - pending, in_progress, completed, reviewed

---

#### 3. Tabela `pei_reviews` ✅
**Reviews/Pareceres dos Coordenadores**

Campos principais:
- `pei_id` - PEI revisado
- `reviewer_id` - Coordenador
- `reviewer_role` - Role do revisor
- `review_date` - Data da revisão
- `notes` - **Notas/Parecer do coordenador**
- `next_review_date` - Próxima revisão
- `evaluation_data` (JSONB) - Dados de avaliação

---

### Páginas Existentes ✅

1. ✅ `CreateMeeting.tsx` - Criar reunião
2. ✅ `MeetingMinutes.tsx` - Gerar ata
3. ✅ `MeetingsDashboard.tsx` - Dashboard de reuniões

---

## 💡 PROPOSTA DE SOLUÇÃO INTEGRADA

### Conceito: "Reunião de Avaliação de PEI"

Unificar **reuniões** e **avaliações** em um fluxo integrado:

1. **Coordenador agenda reunião** de avaliação de PEI
2. **Durante/Após reunião**: Preenche parecer de avaliação
3. **Ata gerada automaticamente** inclui:
   - Pauta (PEI a ser avaliado)
   - Participantes presentes
   - **Parecer de avaliação do coordenador**
   - Decisões tomadas
   - Assinaturas
4. **Parecer incorporado ao PEI**:
   - Na impressão
   - Na visualização
   - No histórico

---

## 🎯 PROPOSTA DE IMPLEMENTAÇÃO

### Opção 1: Vincular `pei_reviews` a `pei_meetings` (RECOMENDADO)

**Vantagem**: Usa tabelas existentes, sem migration

#### Mudança 1: Adicionar `meeting_id` a `pei_reviews`

```sql
ALTER TABLE pei_reviews 
ADD COLUMN meeting_id uuid REFERENCES pei_meetings(id);
```

#### Mudança 2: Modificar CreateMeeting/MeetingMinutes

**Fluxo**:
1. Criar reunião → Selecionar PEIs a serem avaliados
2. Durante ata → Campo "Parecer de Avaliação" para cada PEI
3. Salvar ata → Criar/Atualizar `pei_review` com `meeting_id`
4. Ata finalizada → `pei_review.notes` + assinaturas

**Benefícios**:
- ✅ Rastreabilidade (reunião ↔ avaliação)
- ✅ Ata histórica com pareceres
- ✅ Assinaturas dos participantes
- ✅ Campo específico para coordenador

---

### Opção 2: Usar `pei_evaluations` com vinculação a reuniões

**Vantagem**: Avaliações cíclicas estruturadas

#### Mudança 1: Adicionar `meeting_id` a `pei_evaluations`

```sql
ALTER TABLE pei_evaluations 
ADD COLUMN meeting_id uuid REFERENCES pei_meetings(id);
```

#### Fluxo:
1. Criar reunião de avaliação (tipo: acompanhamento)
2. Vincular ao ciclo (I, II ou III)
3. Na ata → Preencher campos de `pei_evaluations`
4. Salvar → Registro completo de avaliação cíclica

**Benefícios**:
- ✅ Avaliações cíclicas organizadas
- ✅ Métricas de progresso (acadêmico, social, comportamental, autonomia)
- ✅ Metas alcançadas/não alcançadas
- ✅ Modificações e novas metas

---

### Opção 3: Híbrida (MAIS COMPLETA) ⭐ **RECOMENDADO**

**Combinar ambas as tabelas**:

- `pei_reviews` → **Pareceres pontuais** do coordenador (vinculados a reuniões)
- `pei_evaluations` → **Avaliações cíclicas** formais (I, II, III Ciclo)

#### Fluxo Completo:

**Reunião de Acompanhamento** (mensal/bimestral):
1. Criar reunião tipo "acompanhamento"
2. Adicionar PEIs na pauta
3. Durante ata → Campo "Parecer do Coordenador"
4. Salvar → Criar `pei_review` com `meeting_id`

**Reunião de Avaliação Cíclica** (trimestral):
1. Criar reunião tipo "avaliação_ciclica"
2. Vincular ao ciclo (I, II ou III)
3. Durante ata → Formulário completo de avaliação
4. Salvar → Criar `pei_evaluation` com `meeting_id`

**Benefícios**:
- ✅ Pareceres frequentes (acompanhamento)
- ✅ Avaliações formais (cíclicas)
- ✅ Histórico completo
- ✅ Flexibilidade

---

## 🎨 PROPOSTA DE UI/UX

### 1. Nova Aba "Avaliações" no Dashboard de Coordenação

**Localização**: Tabs do CoordinatorDashboard

**Conteúdo**:
- Card "Reuniões de Avaliação"
- Card "Pareceres Recentes"
- Card "Avaliações Cíclicas Pendentes"
- Botão "Nova Reunião de Avaliação"

---

### 2. Melhorar MeetingMinutes.tsx

**Adicionar Seção**: "Avaliação dos PEIs"

```
┌────────────────────────────────────────┐
│ ATA DA REUNIÃO                         │
├────────────────────────────────────────┤
│ 📋 Pauta                               │
│ ✅ Participantes Presentes             │
│ 📊 Avaliação dos PEIs ✨ **NOVO**     │
│   ├── PEI: Carlos Silva                │
│   │   └── Parecer: [campo de texto]    │
│   ├── PEI: Maria Santos                │
│   │   └── Parecer: [campo de texto]    │
│ 🎯 Decisões e Encaminhamentos          │
│ ✍️ Assinaturas                          │
└────────────────────────────────────────┘
```

---

### 3. Tab "Avaliação" em PEIDetailDialog (MELHORADO)

**Adicionar 4ª tab**: "Avaliação"

```
[👁️ Visualização] [💬 Comentários] [📄 Ações] [📊 Avaliação] ← NOVO
```

**Conteúdo da tab Avaliação**:
- Pareceres do Coordenador (timeline)
- Avaliações Cíclicas (I, II, III)
- Reuniões relacionadas
- Botão "Adicionar Parecer"
- Botão "Registrar Avaliação Cíclica"

---

### 4. Impressão do PEI com Pareceres

**PrintPEIDialog Melhorado**:

**Adicionar seção** (opcional via checkbox):

```
☑️ Incluir pareceres de avaliação na impressão

┌────────────────────────────────────────┐
│ PEI COMPLETO                           │
│ - Diagnóstico                          │
│ - Metas                                │
│ - Adaptações                           │
│                                        │
│ PARECERES DE AVALIAÇÃO ✨ **NOVO**    │
│ ─────────────────────────────────────  │
│ Reunião: 15/09/2025                    │
│ Parecer: Aluno demonstrou avanço...   │
│                                        │
│ Reunião: 20/10/2025                    │
│ Parecer: Necessário revisar metas...  │
│                                        │
│ AVALIAÇÃO DO I CICLO                   │
│ Metas Alcançadas: 3/5                  │
│ Recomendações: ...                     │
└────────────────────────────────────────┘
```

---

## 🔧 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Banco de Dados (1 migration)

```sql
-- Adicionar campos de vinculação
ALTER TABLE pei_reviews 
ADD COLUMN meeting_id uuid REFERENCES pei_meetings(id);

ALTER TABLE pei_evaluations 
ADD COLUMN meeting_id uuid REFERENCES pei_meetings(id);

-- Índices para performance
CREATE INDEX idx_pei_reviews_meeting_id ON pei_reviews(meeting_id);
CREATE INDEX idx_pei_evaluations_meeting_id ON pei_evaluations(meeting_id);

-- Comentários
COMMENT ON COLUMN pei_reviews.meeting_id IS 'Reunião onde o parecer foi discutido/registrado';
COMMENT ON COLUMN pei_evaluations.meeting_id IS 'Reunião de avaliação cíclica';
```

---

### Fase 2: Backend/UI (6 arquivos)

#### A. Modificar MeetingMinutes.tsx
- Adicionar seção "Avaliação dos PEIs"
- Campo de texto para parecer de cada PEI
- Ao salvar ata → Criar `pei_review` com `meeting_id`

#### B. Modificar PEIDetailDialog.tsx
- Adicionar 4ª tab "Avaliação"
- Listar pareceres (de reuniões)
- Listar avaliações cíclicas
- Botão "Adicionar Parecer Rápido"

#### C. Criar componente PEIEvaluationForm
- Formulário de avaliação cíclica
- Campos: progresso, metas, recomendações
- Pode ser usado standalone ou na ata

#### D. Modificar PrintPEIDialog.tsx
- Checkbox "Incluir pareceres de avaliação"
- Buscar `pei_reviews` onde `meeting_id IS NOT NULL`
- Renderizar seção "Histórico de Avaliações"

#### E. Nova página: PEIEvaluationDashboard (opcional)
- Visão consolidada de todas as avaliações
- Filtros por ciclo, status, data
- Botões para agendar reuniões

#### F. Modificar CoordinatorDashboard.tsx
- Adicionar tab "Avaliações"
- Cards com avaliações pendentes
- Link para agendar reuniões

---

### Fase 3: Fluxo Integrado

```
FLUXO COMPLETO:

1. Coordenador agenda "Reunião de Avaliação"
   ↓
2. Seleciona tipo: "acompanhamento" ou "avaliação_ciclica"
   ↓
3. Adiciona PEIs na pauta
   ↓
4. Convida participantes (professores, família)
   ↓
5. Reunião acontece
   ↓
6. Coordenador preenche ata + pareceres
   ↓
7. Sistema cria:
   - meeting.minutes (ata completa)
   - pei_review (1 por PEI) com meeting_id
   ↓
8. Participantes assinam ata
   ↓
9. Ata finalizada e arquivada
   ↓
10. Pareceres aparecem:
    - Na tab Avaliação do PEI
    - Na impressão do PEI (opcional)
    - No histórico

RESULTADO: Rastreabilidade completa!
```

---

## 📋 ESTRUTURA DE DADOS PROPOSTA

### pei_reviews (com meeting_id)

```json
{
  "id": "uuid",
  "pei_id": "uuid",
  "meeting_id": "uuid", // ← NOVO campo
  "reviewer_id": "uuid",
  "reviewer_role": "coordinator",
  "review_date": "2025-11-10T15:30:00Z",
  "notes": "Aluno demonstrou avanço significativo em leitura. Recomendo manter estratégias atuais e adicionar meta para escrita.",
  "evaluation_data": {
    "overall_progress": "good", // excellent, good, average, needs_improvement
    "goals_progress": {
      "goal_1": "achieved",
      "goal_2": "in_progress",
      "goal_3": "not_started"
    },
    "adaptations_effectiveness": "high", // high, medium, low
    "family_engagement": "active", // active, moderate, low
    "next_review_date": "2025-12-10"
  }
}
```

---

### pei_meetings.minutes (estrutura da ata)

```json
{
  "meeting_id": "uuid",
  "meeting_date": "2025-11-10T14:00:00Z",
  "agenda": [
    {"id": "1", "topic": "Avaliação PEI - Carlos Silva", "order": 1},
    {"id": "2", "topic": "Avaliação PEI - Maria Santos", "order": 2}
  ],
  "minutes": [
    {
      "id": "1",
      "topic": "Avaliação PEI - Carlos Silva",
      "pei_id": "uuid-carlos",
      "checked": true,
      "notes": "Discutido progresso em leitura. Família participativa.",
      "evaluation": { // ← NOVO campo na ata
        "overall_progress": "good",
        "coordinator_notes": "Aluno demonstrou avanço...",
        "decisions": ["Manter estratégias", "Adicionar meta de escrita"],
        "next_review": "2025-12-10"
      }
    }
  ],
  "participants": [
    {"user_id": "uuid", "name": "João - Professor", "present": true, "signed": true},
    {"user_id": "uuid", "name": "Maria - Coordenadora", "present": true, "signed": true},
    {"user_id": "uuid", "name": "Mãe do Carlos", "present": true, "signed": false}
  ],
  "general_notes": "Reunião produtiva com participação ativa da família."
}
```

---

## 🎨 MOCKUP DA UI

### MeetingMinutes - Seção de Avaliação

```
┌─────────────────────────────────────────────┐
│ 📊 AVALIAÇÃO DOS PEIs                       │
├─────────────────────────────────────────────┤
│                                             │
│ PEI: Carlos Eduardo Silva                   │
│ ─────────────────────────────────────────   │
│ Progresso Geral:                            │
│   ( ) Excelente  ( ) Bom  ( ) Regular       │
│   ( ) Necessita atenção                     │
│                                             │
│ Metas Alcançadas:                           │
│   ☑️ Meta 1: Melhorar leitura               │
│   ☑️ Meta 2: Socialização                   │
│   ☐ Meta 3: Escrita                         │
│                                             │
│ Parecer do Coordenador:                     │
│ ┌─────────────────────────────────────┐     │
│ │ [Campo de texto amplo]              │     │
│ │ Aluno demonstrou avanço             │     │
│ │ significativo em leitura...         │     │
│ └─────────────────────────────────────┘     │
│                                             │
│ Decisões Tomadas:                           │
│   • Manter estratégias atuais               │
│   • Adicionar meta de escrita               │
│   • Próxima reunião: 10/12/2025             │
│                                             │
│ ─────────────────────────────────────────   │
│                                             │
│ PEI: Maria Santos                           │
│ (repetir estrutura...)                      │
│                                             │
└─────────────────────────────────────────────┘
```

---

### PEIDetailDialog - Nova Tab "Avaliação"

```
┌────────────────────────────────────────────┐
│ [👁️ Visualização] [💬 Comentários]         │
│ [📄 Ações] [📊 Avaliação] ← NOVA TAB       │
├────────────────────────────────────────────┤
│                                            │
│ 📅 HISTÓRICO DE PARECERES                  │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ 20/10/2025 - Reunião de Acompanhamento│ │
│ │ Coordenadora: Maria Silva            │   │
│ │ Parecer: Aluno demonstrou avanço     │   │
│ │ significativo em leitura...          │   │
│ │ Decisões: Manter estratégias         │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ 15/09/2025 - Reunião Inicial         │   │
│ │ Coordenadora: Maria Silva            │   │
│ │ Parecer: PEI bem estruturado...      │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ 📊 AVALIAÇÕES CÍCLICAS                     │
│                                            │
│ I Ciclo - Concluído ✅                     │
│ Metas Alcançadas: 3/5                      │
│ Progresso: Bom                             │
│ [Ver Detalhes]                             │
│                                            │
│ II Ciclo - Em Andamento ⏳                 │
│ Previsão: 15/12/2025                       │
│ [Agendar Reunião de Avaliação]             │
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ [+ Adicionar Parecer Rápido]               │
│                                            │
└────────────────────────────────────────────┘
```

---

### PrintPEIDialog - Com Pareceres

```
┌────────────────────────────────────────┐
│ Opções de Impressão:                   │
│ ☑️ Incluir diagnóstico completo        │
│ ☑️ Incluir metas e adaptações          │
│ ☑️ Incluir pareceres de avaliação ✨   │
│ ☐ Incluir histórico de reuniões        │
│ ☐ Incluir assinaturas                  │
│                                        │
│ [Visualizar] [Imprimir]                │
└────────────────────────────────────────┘
```

**PDF gerado**:
```
─────────────────────────────────────────
PLANO EDUCACIONAL INDIVIDUALIZADO

Aluno: Carlos Eduardo Silva
Data: 10/11/2025

1. DIAGNÓSTICO
   ...

2. METAS SMART
   ...

3. ADAPTAÇÕES
   ...

4. PARECERES DE AVALIAÇÃO ← NOVO
   ─────────────────────────────
   
   Parecer 1 - 20/10/2025
   Reunião de Acompanhamento
   Coordenadora: Maria Silva
   
   "Aluno demonstrou avanço significativo
   em leitura. Recomendo manter estratégias
   atuais e adicionar meta para escrita."
   
   Participantes presentes:
   - João (Professor)
   - Maria (Coordenadora)
   - Mãe do Carlos
   
   ─────────────────────────────
   
   Parecer 2 - 15/09/2025
   ...

5. ASSINATURAS
   ...
─────────────────────────────────────────
```

---

## 🎯 CAMPOS SUGERIDOS PARA PARECER

### Parecer Simples (pei_reviews.notes)
- **Texto livre** do coordenador
- Usado em reuniões de acompanhamento
- Rápido de preencher

### Parecer Estruturado (pei_reviews.evaluation_data)

```json
{
  "overall_progress": "good", // excellent, good, average, needs_improvement, critical
  "dimensions": {
    "academic": "good",
    "social": "excellent",
    "behavioral": "average",
    "autonomy": "good"
  },
  "goals_status": [
    {"goal_id": "uuid", "status": "achieved", "notes": "..."},
    {"goal_id": "uuid", "status": "in_progress", "notes": "..."}
  ],
  "adaptations_effectiveness": "high", // high, medium, low
  "family_engagement": "active", // active, moderate, low, absent
  "coordinator_notes": "Texto livre do coordenador...",
  "decisions": [
    "Manter estratégias atuais",
    "Adicionar meta de escrita",
    "Agendar visita da família"
  ],
  "next_review_date": "2025-12-10",
  "meeting_id": "uuid"
}
```

---

## 📊 COMPARAÇÃO DAS OPÇÕES

| Aspecto | Opção 1 (pei_reviews) | Opção 2 (pei_evaluations) | **Opção 3 (Híbrida)** ⭐ |
|---------|----------------------|---------------------------|------------------------|
| **Flexibilidade** | Alta | Média (cíclica) | **Muito Alta** |
| **Estrutura** | Livre | Muito estruturada | **Ambas** |
| **Frequência** | Qualquer | Trimestral | **Qualquer + Cíclica** |
| **Complexity** | Baixa | Alta | Média |
| **Rastreabilidade** | Alta (com meeting_id) | Alta | **Muito Alta** |
| **Impressão** | Fácil | Complexa | **Completa** |
| **Uso Atual** | Pouco | Não usado | **Aproveita tudo** |

---

## 💡 RECOMENDAÇÃO FINAL

### **Opção 3 - Sistema Híbrido** ⭐

**Por quê?**
1. ✅ Aproveita todas as tabelas existentes
2. ✅ Flexibilidade para pareceres rápidos (reuniões frequentes)
3. ✅ Estrutura para avaliações formais (cíclicas)
4. ✅ Rastreabilidade completa (reunião → parecer → PEI)
5. ✅ Ata da reunião inclui avaliações
6. ✅ Impressão do PEI com histórico de pareceres
7. ✅ Sem perder funcionalidades existentes

**Tipos de Reunião**:
- **Acompanhamento** (mensal/bimestral) → Gera `pei_review`
- **Avaliação Cíclica** (trimestral) → Gera `pei_evaluation`
- **Extraordinária** (quando necessário) → Gera `pei_review`

**Diferença**:
- `pei_review` = Parecer pontual, texto livre
- `pei_evaluation` = Avaliação formal, estruturada, cíclica

---

## 🚀 PRÓXIMOS PASSOS

### 1. Migration (10 min)
- Adicionar `meeting_id` em `pei_reviews` e `pei_evaluations`
- Criar índices

### 2. Modificar MeetingMinutes.tsx (2 horas)
- Seção "Avaliação dos PEIs"
- Form para parecer por PEI
- Salvar em `pei_reviews`

### 3. Tab Avaliação em PEIDetailDialog (1 hora)
- Nova tab
- Listar pareceres
- Botão adicionar parecer

### 4. PrintPEIDialog com Pareceres (1 hora)
- Checkbox incluir pareceres
- Buscar e renderizar

### 5. Testes (30 min)
- Criar reunião → Ata → Parecer
- Ver parecer no PEI
- Imprimir com parecer

**Tempo total estimado**: ~5 horas

---

## 🎊 BENEFÍCIOS DA SOLUÇÃO

### Para Coordenadores
- ✅ Campo específico para avaliação na ata
- ✅ Pareceres vinculados a reuniões
- ✅ Histórico completo e rastreável
- ✅ Impressão profissional com pareceres

### Para Professores
- ✅ Ver feedback do coordenador
- ✅ Participar de reuniões de avaliação
- ✅ Acompanhar decisões tomadas

### Para Famílias
- ✅ Transparência nas avaliações
- ✅ Ata assinada como documento oficial
- ✅ Histórico de progresso documentado

### Para o Sistema
- ✅ Dados estruturados
- ✅ Rastreabilidade completa
- ✅ Auditoria facilitada
- ✅ Relatórios automatizados

---

# 💡 RESUMO DA PROPOSTA

**Sistema Híbrido de Reuniões + Avaliações**:

1. ✅ Usar tabelas existentes (`pei_meetings`, `pei_reviews`, `pei_evaluations`)
2. ✅ Vincular pareceres a reuniões (`meeting_id`)
3. ✅ Ata inclui campo de avaliação
4. ✅ PEI mostra histórico de pareceres
5. ✅ Impressão com pareceres opcionais
6. ✅ Fluxo integrado e rastreável

**Implementação**: 1 migration + 5 arquivos modificados  
**Tempo**: ~5 horas  
**Benefício**: Sistema completo de avaliação colaborativa  

---

**Proposto por**: Claude Sonnet 4.5  
**Data**: 10/11/2025  
**Status**: ⏳ **Aguardando aprovação para implementar**

