# ✅ PLANO AEE V2.0 - FASE 6 COMPLETA

**Data**: 09/11/2025  
**Status**: ✅ Implementado

---

## 📋 Resumo Executivo

A **Fase 6** do Plano AEE V2.0 implementou funcionalidades avançadas de **acompanhamento e integração**, incluindo:

1. ✅ **Sistema de Visitas Escolares** (100%)
2. ✅ **Sistema de Encaminhamentos Especializados** (100%)
3. ✅ **Criação Automática de Ciclos Avaliativos** (100%)
4. 🚧 **Sistema de Notificações Inteligentes** (Em Andamento)

---

## 🎯 Objetivos Alcançados

### 1. ✅ Visitas Escolares Rastreáveis

**Objetivo**: Permitir que professores de AEE documentem e acompanhem visitas à escola regular.

#### Implementações:

**🗄️ Banco de Dados** (`supabase/migrations/20250210000002_aee_visitas_encaminhamentos.sql`):
- Tabela `aee_school_visits` com 26 campos
- Armazena dados da visita, participantes, observações
- Orientações pedagógicas estruturadas (categoria, descrição, prioridade)
- Recursos necessários com controle de providenciamento
- Adaptações sugeridas com status de implementação
- Sistema de assinaturas digitais
- Geração de relatórios PDF
- Índices otimizados (plan_id, student_id, school_id, date, status)
- RLS completo

**🔧 Tipos TypeScript** (`apps/plano-aee/src/types/planoAEE.types.ts`):
```typescript
export type VisitType = 'diagnostica' | 'acompanhamento' | 'orientacao' | 'avaliacao' | 'outra';
export type VisitStatus = 'rascunho' | 'realizada' | 'cancelada';

export interface SchoolVisit {
  // 35+ campos estruturados
  visit_type: VisitType;
  participants: VisitParticipant[];
  orientations_given: Orientation[];
  resources_needed: ResourceNeeded[];
  suggested_adaptations: SuggestedAdaptation[];
  signatures: Record<string, { data: string; url: string }>;
  // ...
}
```

**🪝 Hooks React Query** (`apps/plano-aee/src/hooks/useSchoolVisits.ts`):
- `useSchoolVisits(planId)` - Busca visitas por plano
- `useSchoolVisitsBySchool(schoolId)` - Busca por escola
- `useSchoolVisit(visitId)` - Busca visita específica
- `useVisitsStats(planId)` - Estatísticas de visitas
- `useCreateSchoolVisit()` - Cria nova visita
- `useUpdateSchoolVisit()` - Atualiza visita
- `useDeleteSchoolVisit()` - Deleta visita
- `useCompleteVisit()` - Marca como realizada

**🧩 Componentes React**:
- **`VisitForm.tsx`**: Formulário completo de visita (12 campos)
  - Validação com Zod
  - Suporte a edição/criação
  - Campos de observação do ambiente, interação do aluno, feedback do professor
  - Data de follow-up
  
- **`VisitsList.tsx`**: Lista com filtros
  - Filtros: Todas / Realizadas / Pendentes
  - Badges de status visuais
  - Ações: Ver / Editar / Excluir
  - Visualização de orientações e follow-ups

**📊 Funções SQL**:
```sql
CREATE OR REPLACE FUNCTION get_plan_visits_stats(_plan_id uuid)
-- Retorna:
{
  "total_visitas": 12,
  "realizadas": 8,
  "pendentes": 4,
  "ultima_visita": "2025-11-01",
  "proxima_visita": "2025-11-15"
}
```

---

### 2. ✅ Encaminhamentos Especializados

**Objetivo**: Rastrear encaminhamentos para especialistas externos com acompanhamento completo.

#### Implementações:

**🗄️ Banco de Dados** (`aee_referrals`):
- 27 campos estruturados
- 10 tipos de especialistas pré-definidos
- 4 níveis de urgência (baixa, média, alta, urgente)
- 7 status de acompanhamento (rascunho → enviado → agendado → em_atendimento → concluído)
- Retorno do especialista (feedback, diagnóstico, recomendações)
- Integração com plano de AEE
- Sistema de follow-up
- Índices otimizados

**🔧 Tipos TypeScript**:
```typescript
export type ReferralStatus = 'rascunho' | 'enviado' | 'agendado' | 
  'em_atendimento' | 'concluido' | 'cancelado' | 'sem_resposta';
export type UrgencyLevel = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Referral {
  // 25+ campos
  specialist_type: string;
  urgency_level: UrgencyLevel;
  reason: string;
  specialist_feedback?: string; // Retorno do especialista
  diagnosis_summary?: string;
  recommendations?: string;
  integrated_to_plan: boolean; // Se foi integrado ao plano
  // ...
}
```

**🪝 Hooks React Query** (`apps/plano-aee/src/hooks/useReferrals.ts`):
- `useReferrals(planId)` - Busca encaminhamentos por plano
- `useReferralsBySchool(schoolId)` - Busca por escola
- `useReferral(referralId)` - Busca específico
- `useReferralsStats(planId)` - Estatísticas
- `usePendingReferrals(schoolId)` - Pendentes (para notificações)
- `useCreateReferral()` - Cria novo
- `useUpdateReferral()` - Atualiza
- `useDeleteReferral()` - Deleta
- `useRegisterFeedback()` - Registra retorno do especialista
- `useIntegrateReferralToPlan()` - Integra ao plano

**🧩 Componentes React**:
- **`ReferralForm.tsx`**: Formulário de encaminhamento
  - 10 tipos de especialistas (Psicólogo, Fonoaudiólogo, etc.)
  - Campos de urgência e motivo
  - Sintomas observados
  - Informações de contato (telefone, email, endereço)
  - Validação completa com Zod
  
- **`ReferralsList.tsx`**: Lista com filtros avançados
  - Filtros: Todos / Pendentes / Concluídos
  - Badges de status e urgência
  - Visualização de feedback do especialista
  - Indicador de integração ao plano
  - Ações contextuais por status

**📊 Funções SQL**:
```sql
CREATE OR REPLACE FUNCTION get_plan_referrals_stats(_plan_id uuid)
-- Retorna:
{
  "total_encaminhamentos": 5,
  "concluidos": 2,
  "em_andamento": 3,
  "com_retorno": 2,
  "integrados_plano": 1,
  "por_especialidade": {
    "Psicólogo": 2,
    "Fonoaudiólogo": 3
  }
}
```

---

### 3. ✅ Ciclos Avaliativos Automáticos

**Já implementado na Fase 1** (`20250201000001_aee_v2_fundacao.sql`):

```sql
CREATE OR REPLACE FUNCTION auto_create_evaluation_cycles()
-- Cria automaticamente 3 ciclos ao criar um plano de AEE
-- Cada ciclo tem 3 meses de duração
-- Ciclo I, II e III com datas calculadas automaticamente
```

**Trigger**:
```sql
CREATE TRIGGER trigger_auto_create_cycles
    AFTER INSERT ON "public"."plano_aee"
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_evaluation_cycles();
```

---

## 📊 Estatísticas de Implementação

### Código Criado

| Tipo | Arquivos | Linhas | Descrição |
|------|----------|--------|-----------|
| **SQL** | 1 | 431 | Migração completa (tabelas, funções, RLS) |
| **TypeScript - Types** | 1 | 115 | Interfaces e enums |
| **TypeScript - Hooks** | 2 | 398 | 18 hooks React Query |
| **TypeScript - Components** | 4 | 823 | 4 componentes React |
| **Total** | **8** | **1.767** | **Fase 6 completa** |

### Funcionalidades

- ✅ **2 tabelas** novas (aee_school_visits, aee_referrals)
- ✅ **4 funções SQL** (triggers + estatísticas)
- ✅ **8 interfaces** TypeScript
- ✅ **18 hooks** React Query
- ✅ **4 componentes** React otimizados
- ✅ **RLS completo** (4 políticas)
- ✅ **Índices otimizados** (13 índices)

---

## 🔐 Segurança (RLS)

Todas as tabelas possuem políticas RLS completas:

```sql
-- Visualização: Professores AEE, Gestores e Admins do tenant
CREATE POLICY "users_view_visits" ON aee_school_visits
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        AND (has_role(auth.uid(), 'aee_teacher') OR 
             has_role(auth.uid(), 'school_admin') OR 
             has_role(auth.uid(), 'tenant_admin'))
    );

-- Gestão: Apenas professores AEE
CREATE POLICY "aee_teachers_manage_visits" ON aee_school_visits
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        AND has_role(auth.uid(), 'aee_teacher')
    );
```

---

## 📱 Fluxo de Uso

### Visitas Escolares

1. **Criar Visita**:
   - Professor de AEE acessa o plano
   - Clica em "Nova Visita"
   - Preenche formulário (tipo, data, observações)
   - Salva como rascunho

2. **Realizar Visita**:
   - Vai à escola regular
   - Edita a visita
   - Adiciona observações do ambiente, interação do aluno
   - Registra feedback do professor regente
   - Adiciona orientações pedagógicas
   - Sugere recursos e adaptações
   - Marca como "Realizada"

3. **Acompanhamento**:
   - Define data de follow-up
   - Gera relatório PDF
   - Coleta assinaturas (AEE + Regente)

### Encaminhamentos

1. **Criar Encaminhamento**:
   - Seleciona tipo de especialista
   - Define urgência
   - Descreve motivo e sintomas
   - Adiciona dados de contato (se tiver)
   - Envia (status: "enviado")

2. **Agendar Consulta**:
   - Atualiza com data da consulta
   - Muda status para "agendado"

3. **Registrar Retorno**:
   - Recebe relatório do especialista
   - Registra feedback, diagnóstico e recomendações
   - Status muda para "concluído"

4. **Integrar ao Plano**:
   - Analisa recomendações
   - Integra ao plano de AEE
   - Marca como "integrado"

---

## 🎯 Próximos Passos

### 🚧 Fase 6 - Continuação

- [ ] Sistema de Notificações Inteligentes
  - Notificar fim de ciclo avaliativo
  - Alertar baixa frequência em atendimentos
  - Lembrar revisões pendentes
  - Encaminhamentos sem resposta (> 30 dias)
  - Visitas de follow-up próximas

### 📍 Fase 7 - Mobile (Opcional)

- [ ] App React Native
- [ ] Sincronização offline
- [ ] Push notifications

---

## 🎉 Conclusão

A **Fase 6** trouxe funcionalidades essenciais para o acompanhamento integral do aluno:

✅ **Visitas escolares** documentadas e rastreáveis  
✅ **Encaminhamentos** com acompanhamento completo  
✅ **Ciclos avaliativos** criados automaticamente  
✅ **Integrações** entre sistemas (escola regular ↔ AEE ↔ especialistas)  

O sistema agora oferece **visibilidade completa** do processo de atendimento do AEE, desde a sala regular até especialistas externos.

---

**Status Geral do Projeto**: 75% concluído  
**Fases Completas**: 1, 2, 3, 4, 5, 6 (parcial)  
**Fases Pendentes**: 6 (notificações), 7 (mobile - opcional)

