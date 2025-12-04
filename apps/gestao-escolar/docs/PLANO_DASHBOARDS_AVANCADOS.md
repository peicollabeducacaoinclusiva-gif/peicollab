# Plano de Implementação - Dashboards Avançados

**Data:** 28/01/2025  
**Objetivo:** Criar painéis úteis e informativos para gestores e diretores

---

## 📊 ESTRUTURA DOS DASHBOARDS

### 1. Painel por Escola (`/dashboards/school`)
**Público:** Diretores, Gestores Escolares

**Métricas:**
- ✅ Frequência (taxa, tendências, alunos com baixa frequência)
- ✅ Evolução das turmas (progresso, desempenho, comparativo)
- ✅ Alunos com risco (aprendizagem, inclusão, alertas automáticos)
- ✅ Alertas automáticos (pendências, ações necessárias)
- ✅ Inclusão e AEE (cobertura, efetividade, necessidades)
- ✅ Cumprimento curricular (progresso, metas, adequação)

### 2. Painel da Rede (`/dashboards/network`)
**Público:** Secretários de Educação, Coordenadores de Rede

**Métricas:**
- ✅ Comparativo entre escolas (desempenho, indicadores)
- ✅ Indicadores de inclusão (taxa, distribuição, efetividade)
- ✅ Necessidades de AEE (demanda, cobertura, recursos)
- ✅ Carga de trabalho dos professores (distribuição, equilíbrio)
- ✅ Efetividade dos PEIs/AEE (taxa de sucesso, progresso)

---

## 🏗️ ARQUITETURA

### Camada de Dados (Backend)
1. **RPC Functions Otimizadas**
   - Pré-agregações em cache
   - Queries eficientes
   - Filtros por período/escola/rede

2. **Tabelas de Cache (Opcional)**
   - Tabelas materializadas
   - Atualização periódica
   - Redução de carga

### Camada de Apresentação (Frontend)
1. **Componentes Universais de Gráficos**
   - Bar Chart
   - Line Chart
   - Pie Chart
   - Area Chart
   - Sparklines

2. **Hooks React Query**
   - Cache inteligente
   - Refresh automático
   - Estado de loading

3. **Páginas dos Dashboards**
   - Layout responsivo
   - Filtros dinâmicos
   - Exportação de dados

---

## 📦 COMPONENTES A CRIAR

### 1. Componentes de Gráficos Universais
- `UniversalBarChart.tsx`
- `UniversalLineChart.tsx`
- `UniversalPieChart.tsx`
- `UniversalAreaChart.tsx`
- `SparklineChart.tsx`
- `MetricCard.tsx`
- `TrendIndicator.tsx`

### 2. Hooks de Dados
- `useSchoolDashboardData.ts`
- `useNetworkDashboardData.ts`
- `useDashboardKPIs.ts`
- `useRiskIndicators.ts`
- `useAttendanceMetrics.ts`

### 3. Páginas
- `SchoolDashboard.tsx`
- `NetworkDashboard.tsx`

---

## 🎯 FUNCIONALIDADES PRIORITÁRIAS

### Fase 1: Base (Prioridade Alta)
- [x] Componentes de gráficos universais
- [x] Hooks de dados básicos
- [x] Estrutura das páginas

### Fase 2: Métricas (Prioridade Alta)
- [ ] Frequência e evolução
- [ ] Alunos com risco
- [ ] Alertas automáticos

### Fase 3: Comparativos (Prioridade Média)
- [ ] Comparativo entre escolas
- [ ] Indicadores de inclusão
- [ ] Carga de trabalho

### Fase 4: Otimizações (Prioridade Baixa)
- [ ] Cache de pré-agregações
- [ ] Exportação de relatórios
- [ ] Filtros avançados

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Criar estrutura de componentes de gráficos
2. ✅ Criar RPC functions para dashboards
3. ✅ Criar hooks React Query
4. ✅ Criar página do painel por escola
5. ✅ Criar página do painel da rede

