# 🎯 Arquitetura da Superficha - Documentação Técnica

## 📋 Visão Geral

A **Superficha** é o componente central de visualização e gestão de dados do estudante no sistema de Gestão Escolar. Ela unifica informações de múltiplas fontes em uma interface única e intuitiva.

## 🏗️ Arquitetura Atual

### Componentes Principais

```
StudentProfile (Página Principal)
├── UnifiedStudentCard (Card resumo)
├── Tabs (Navegação por seções)
│   ├── StudentPersonalData (Dados Pessoais)
│   ├── StudentAcademicHistory (Histórico Escolar)
│   ├── StudentNEE (Necessidades Especiais)
│   ├── StudentDocuments (Documentos)
│   ├── StudentAccessibility (Acessibilidade)
│   ├── QuickPEIAccess (Acesso rápido ao PEI)
│   └── QuickAEEAccess (Acesso rápido ao AEE)
```

### Fluxo de Dados

```
User → StudentProfile → useUnifiedStudent Hook
                         ↓
                    unifiedStudentService
                         ↓
                    Supabase RPC: get_student_unified_data
                         ↓
                    PostgreSQL (Dados unificados)
```

### Hooks Utilizados

- `useUnifiedStudent(studentId)` - Dados principais unificados
- `useStudentHistory(studentId)` - Histórico acadêmico
- `useStudentNEE(studentId)` - Necessidades educacionais especiais
- `useStudentDocuments(studentId)` - Documentos oficiais
- `useStudentAccessibility(studentId)` - Indicadores de acessibilidade

### Serviços

- `unifiedStudentService` - Centraliza todas as chamadas de API
  - `getUnifiedStudentData()` - RPC principal
  - `getStudentHistory()` - Query direta
  - `getStudentNEE()` - Queries múltiplas
  - `getStudentDocuments()` - Query direta
  - `getStudentAccessibility()` - Queries múltiplas

### Função RPC Principal

```sql
get_student_unified_data(p_student_id uuid)
```

Retorna JSON com:
- Dados do estudante
- Dados da escola
- Dados da rede (tenant)
- PEI ativo (se existir)
- AEE ativo (se existir)
- Matrícula atual
- Documentos
- Histórico acadêmico
- Indicadores de acessibilidade

## 🔄 Fluxo de Dados Atual

### 1. Carregamento Inicial

```typescript
StudentProfile
  ↓
useUnifiedStudent(studentId)
  ↓
unifiedStudentService.getUnifiedStudentData()
  ↓
supabase.rpc('get_student_unified_data')
  ↓
PostgreSQL retorna JSON unificado
  ↓
React Query cacheia resultado
  ↓
Componentes renderizam dados
```

### 2. Carregamento de Seções Específicas

Cada tab faz queries separadas:
- Histórico: `student_enrollments`
- NEE: `students` + `peis` + `pei_barriers` + `plano_aee`
- Documentos: `official_documents`
- Acessibilidade: `peis` + `pei_barriers` + `plano_aee`

## 📊 Estrutura de Dados

### UnifiedStudentData

```typescript
{
  student: {
    id, name, date_of_birth, registration_number,
    class_name, mother_name, father_name,
    email, phone, necessidades_especiais,
    tipo_necessidade, school_id, tenant_id,
    is_active, created_at, updated_at
  },
  school: { id, school_name, address, email, phone },
  tenant: { id, network_name },
  active_pei?: { id, status, version_number, goals_count, barriers_count },
  active_aee?: { id, status },
  current_enrollment?: { id, grade, shift, academic_year, status, class_id },
  documents?: Array<{ id, type, title, created_at }>,
  academic_history?: Array<{ academic_year, grade, shift, status }>,
  accessibility_indicators: {
    has_pei, has_aee, has_adaptations, needs_special_attention
  }
}
```

## ⚠️ Problemas Identificados

### 1. Queries Múltiplas
- Cada seção faz queries separadas
- Não há cache compartilhado eficiente
- Possível N+1 query problem

### 2. Falta de Edição Incremental
- Não há sistema de edição por campos
- Dados são apenas visualizados
- Sem histórico de alterações na interface

### 3. Falta de Indicadores Automáticos
- Não há cálculo de riscos
- Sem alertas contextuais
- Sem sugestões pedagógicas

### 4. UX Limitada
- Navegação apenas por tabs
- Sem breadcrumb contextual
- Falta de microinterações

### 5. Integrações Parciais
- PEI/AEE são apenas links rápidos
- Diário não integrado visualmente
- Portal do Responsável não sincronizado

## 🎯 Melhorias Planejadas

### 1. Arquitetura Refatorada

```
Superficha (Nova Arquitetura)
├── Header (Resumo Inteligente)
│   ├── Indicadores Automáticos
│   ├── Alertas Contextuais
│   └── Ações Rápidas
├── Navegação Lateral (Breadcrumb Pedagógico)
│   ├── Grupos Lógicos
│   └── Estados Visuais
├── Área de Conteúdo
│   ├── Modo Resumo
│   ├── Modo Detalhado
│   └── Modo Edição Incremental
└── Sidebar (Integrações)
    ├── PEI (Preview)
    ├── AEE (Preview)
    ├── Diário (Atividade Recente)
    └── Portal (Comunicações)
```

### 2. Endpoints Centralizados

Novos RPCs:
- `get_student_complete_profile()` - Todos os dados em uma query
- `get_student_risk_indicators()` - Cálculo de riscos
- `get_student_suggestions()` - Sugestões pedagógicas
- `update_student_field()` - Edição incremental
- `get_student_activity_timeline()` - Timeline completa

### 3. Sistema de Indicadores

- **Riscos de Aprendizagem**: Baseado em frequência, notas, evolução
- **Riscos de Inclusão**: Baseado em PEI/AEE, adaptações, barreiras
- **Alertas Automáticos**: Faltas consecutivas, notas baixas, etc.
- **Sugestões Pedagógicas**: Baseadas em dados históricos e ML

### 4. UX Premium

- **Hierarquia Visual**: Cards com pesos diferentes
- **Microinterações**: Hover, skeletons, loaders suaves
- **Empty States**: Designados para cada seção
- **Responsividade**: Mobile-first com breakpoints otimizados

### 5. Integrações Completas

- **PEI**: Preview inline + edição rápida
- **AEE**: Preview inline + edição rápida
- **Diário**: Timeline de atividades + notas recentes
- **Portal**: Comunicações + respostas dos responsáveis

## 🔧 Plano de Implementação

### Fase 1: Fundação (Semana 1)
1. ✅ Documentar arquitetura atual
2. Criar novos schemas Zod para validação
3. Criar novos endpoints RPC
4. Criar hooks unificados de dados

### Fase 2: Componentes Base (Semana 2)
1. Criar sistema de indicadores
2. Criar componentes de edição incremental
3. Criar modo Resumo Inteligente
4. Criar breadcrumb pedagógico

### Fase 3: UX Premium (Semana 3)
1. Aplicar hierarquia visual
2. Adicionar microinterações
3. Criar empty states
4. Otimizar responsividade

### Fase 4: Integrações (Semana 4)
1. Integrar PEI inline
2. Integrar AEE inline
3. Integrar Diário
4. Integrar Portal

### Fase 5: Testes e Refinamento (Semana 5)
1. Testes de integração
2. Testes de performance
3. Ajustes de UX
4. Documentação final

## 📝 Notas Técnicas

### Performance
- Cache agressivo com React Query
- Pré-agregações no banco
- Lazy loading de seções pesadas
- Virtual scrolling para listas grandes

### Segurança
- RLS em todas as queries
- Validação de acesso por perfil
- Auditoria de alterações
- Versionamento de dados

### Acessibilidade
- Navegação por teclado completa
- Screen readers compatíveis
- Contraste adequado
- Labels descritivos

---

**Versão**: 1.0  
**Última Atualização**: 2025-01-27  
**Próxima Revisão**: Após Fase 1

