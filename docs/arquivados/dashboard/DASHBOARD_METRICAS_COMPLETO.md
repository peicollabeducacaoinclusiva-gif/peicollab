# 📈 Dashboard de Métricas Completo - PEI Collab

**Data:** 04 de Novembro de 2025  
**Objetivo:** Monitoramento 360° do sistema

---

## 🎯 Visão Geral do Sistema de Métricas

```
┌──────────────────────────────────────────────────┐
│          DASHBOARD DE MÉTRICAS PEI COLLAB         │
├──────────────────────────────────────────────────┤
│                                                  │
│  📊 Vercel Analytics    →  Performance + Uso    │
│  ⚡ Speed Insights      →  Core Web Vitals      │
│  🗄️  Supabase Metrics   →  Database + RLS       │
│  🔔 Push Stats          →  Notificações         │
│  👥 User Behavior       →  Engajamento          │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 1️⃣ Vercel Analytics Dashboard

### Acesso
**https://vercel.com/pei-collab/peicollab/analytics**

### Métricas Automáticas

#### Tráfego
- **Page Views:** Total de visualizações
- **Unique Visitors:** Visitantes únicos
- **Top Pages:** Páginas mais acessadas
- **Referrers:** De onde vêm os usuários

#### Geografia
- **Countries:** Países dos usuários
- **Cities:** Cidades principais
- **Time Zones:** Fusos horários

#### Tecnologia
- **Devices:** Desktop vs Mobile vs Tablet
- **Browsers:** Chrome, Safari, Firefox, Edge
- **OS:** Windows, macOS, iOS, Android

#### Performance (Real User Monitoring)
- **LCP:** Largest Contentful Paint
- **FID:** First Input Delay
- **CLS:** Cumulative Layout Shift
- **TTFB:** Time to First Byte

---

## 2️⃣ Supabase Analytics Dashboard

### Acesso
**https://supabase.com/dashboard/project/fximylewmvsllkdczovj/reports**

### Queries Prontas para Copiar

#### A. Métricas de PEI

```sql
-- PEIs criados por dia (últimos 30 dias)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as peis_created,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned
FROM peis
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### B. Performance por Escola

```sql
-- Ranking de escolas por produtividade
SELECT 
  s.school_name,
  COUNT(DISTINCT st.id) as total_students,
  COUNT(DISTINCT p.id) as total_peis,
  ROUND(COUNT(DISTINCT p.id)::numeric / NULLIF(COUNT(DISTINCT st.id), 0) * 100, 2) as coverage_rate,
  AVG(EXTRACT(EPOCH FROM (p.updated_at - p.created_at))/86400) as avg_days_to_complete
FROM schools s
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN peis p ON p.student_id = st.id
WHERE s.is_active = true
GROUP BY s.id, s.school_name
ORDER BY coverage_rate DESC;
```

#### C. Engajamento de Usuários

```sql
-- Usuários ativos por role (últimos 7 dias)
SELECT 
  ur.role,
  COUNT(DISTINCT ur.user_id) as total_users,
  COUNT(DISTINCT CASE 
    WHEN au.last_sign_in_at > NOW() - INTERVAL '7 days' 
    THEN ur.user_id 
  END) as active_last_7days,
  ROUND(
    COUNT(DISTINCT CASE WHEN au.last_sign_in_at > NOW() - INTERVAL '7 days' THEN ur.user_id END)::numeric / 
    NULLIF(COUNT(DISTINCT ur.user_id), 0) * 100, 
    2
  ) as engagement_rate
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
GROUP BY ur.role
ORDER BY total_users DESC;
```

#### D. Tempo Médio de Aprovação

```sql
-- Análise de tempo de aprovação de PEIs
SELECT 
  s.school_name,
  COUNT(*) as total_approved,
  ROUND(AVG(EXTRACT(EPOCH FROM (
    CASE 
      WHEN p.status = 'approved' 
      THEN p.updated_at - p.created_at 
    END
  ))/86400), 1) as avg_days_to_approve,
  MIN(EXTRACT(EPOCH FROM (p.updated_at - p.created_at))/86400) as fastest_approval,
  MAX(EXTRACT(EPOCH FROM (p.updated_at - p.created_at))/86400) as slowest_approval
FROM peis p
JOIN students st ON st.id = p.student_id
JOIN schools s ON s.id = st.school_id
WHERE p.status = 'approved'
  AND p.updated_at > NOW() - INTERVAL '90 days'
GROUP BY s.id, s.school_name
ORDER BY avg_days_to_approve ASC;
```

#### E. Taxa de Devolução

```sql
-- PEIs devolvidos vs aprovados
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as total_peis,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned,
  ROUND(
    COUNT(CASE WHEN status = 'returned' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as return_rate
FROM peis
WHERE created_at > NOW() - INTERVAL '12 weeks'
GROUP BY week
ORDER BY week DESC;
```

---

## 3️⃣ Dashboard Personalizado (Supabase)

### Criar View Materializada para Performance

```sql
-- View com métricas principais (atualiza a cada hora)
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_dashboard AS
SELECT 
  -- Métricas Gerais
  (SELECT COUNT(*) FROM tenants WHERE is_active = true) as active_networks,
  (SELECT COUNT(*) FROM schools WHERE is_active = true) as active_schools,
  (SELECT COUNT(*) FROM students WHERE is_active = true) as total_students,
  (SELECT COUNT(*) FROM peis) as total_peis,
  
  -- PEIs por Status
  (SELECT COUNT(*) FROM peis WHERE status = 'draft') as peis_draft,
  (SELECT COUNT(*) FROM peis WHERE status = 'pending') as peis_pending,
  (SELECT COUNT(*) FROM peis WHERE status = 'approved') as peis_approved,
  (SELECT COUNT(*) FROM peis WHERE status = 'returned') as peis_returned,
  
  -- Usuários por Role
  (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'teacher') as total_teachers,
  (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'coordinator') as total_coordinators,
  (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'family') as total_families,
  
  -- Performance
  (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400), 1) 
   FROM peis WHERE status = 'approved') as avg_approval_days,
  
  -- Cobertura
  (SELECT ROUND(COUNT(DISTINCT student_id)::numeric / NULLIF(
    (SELECT COUNT(*) FROM students WHERE is_active = true), 0
  ) * 100, 2) FROM peis WHERE status IN ('approved', 'pending')) as coverage_rate,
  
  -- Timestamp
  NOW() as updated_at;

-- Índice para refresh rápido
CREATE UNIQUE INDEX IF NOT EXISTS metrics_dashboard_idx ON metrics_dashboard (updated_at);

-- Refresh automático a cada hora
CREATE OR REPLACE FUNCTION refresh_metrics_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_dashboard;
END;
$$ LANGUAGE plpgsql;

-- Agendar refresh (via pg_cron ou externamente)
-- SELECT cron.schedule('refresh-metrics', '0 * * * *', 'SELECT refresh_metrics_dashboard()');
```

### Consultar Dashboard

```sql
-- Ver métricas atuais
SELECT * FROM metrics_dashboard;
```

---

## 4️⃣ KPIs Principais do PEI Collab

### 🎓 Educacionais

| KPI | Fórmula | Meta |
|-----|---------|------|
| **Cobertura Inclusiva** | (Alunos com PEI / Total Alunos) × 100 | > 80% |
| **Taxa de Aprovação** | (PEIs Aprovados / Total PEIs) × 100 | > 70% |
| **Tempo Médio de Aprovação** | Média(Data Aprovação - Data Criação) | < 7 dias |
| **Engajamento Familiar** | (Famílias Ativas / Total Famílias) × 100 | > 60% |
| **Taxa de Conformidade LBI** | (PEIs Conformes / Total PEIs) × 100 | > 90% |

### ⚡ Técnicos

| KPI | Fórmula | Meta |
|-----|---------|------|
| **Uptime** | (Tempo Online / Tempo Total) × 100 | > 99.9% |
| **Performance Score** | Lighthouse PWA Score | > 90 |
| **Error Rate** | (Errors / Total Requests) × 100 | < 1% |
| **API Response Time** | P95 de tempo de resposta | < 500ms |
| **Sync Success Rate** | (Syncs OK / Total Syncs) × 100 | > 95% |

### 👥 Usuários

| KPI | Fórmula | Meta |
|-----|---------|------|
| **DAU** (Daily Active Users) | Usuários únicos/dia | - |
| **MAU** (Monthly Active Users) | Usuários únicos/mês | - |
| **Retention Rate** | (Usuários Retidos / Total Usuários) × 100 | > 70% |
| **Adoption Rate** | (Professores Ativos / Total Professores) × 100 | > 80% |
| **NPS** (Net Promoter Score) | Survey de satisfação | > 50 |

---

## 📊 Template de Relatório Semanal

```markdown
# Relatório Semanal - PEI Collab
**Semana:** DD/MM - DD/MM/YYYY

## 📈 Métricas Principais
- **PEIs Criados:** XX (+YY% vs semana anterior)
- **PEIs Aprovados:** XX
- **Tempo Médio de Aprovação:** X.X dias
- **Cobertura Inclusiva:** XX%

## 👥 Usuários
- **DAU Médio:** XX usuários/dia
- **Novos Cadastros:** XX
- **Escolas Ativas:** XX

## ⚡ Performance
- **Uptime:** 99.X%
- **P95 Response Time:** XXXms
- **Error Rate:** X.XX%

## 🎯 Destaques
- [Conquista 1]
- [Conquista 2]
- [Problema resolvido]

## ⚠️ Pontos de Atenção
- [Alerta 1]
- [Ação recomendada]
```

---

## 🔧 Ferramentas de Monitoramento

### Dashboards Prontos

#### 1. Vercel
- **URL:** https://vercel.com/pei-collab/peicollab
- **Abas:**
  - Analytics (tráfego)
  - Speed Insights (Core Web Vitals)
  - Logs (erros e warnings)
  - Deployments (histórico)

#### 2. Supabase
- **URL:** https://supabase.com/dashboard/project/fximylewmvsllkdczovj
- **Abas:**
  - Reports (métricas de uso)
  - Logs (query logs)
  - Database (health)
  - API (usage)

### Ferramentas Externas (Opcionais)

#### Gratuitas
- 📊 **Google Analytics 4** - Comportamento de usuários
- 📈 **Plausible** - Analytics privacy-first
- 🔍 **Hotjar** (free tier) - Heatmaps e recordings
- 🐛 **Sentry** (free tier) - Error tracking

#### Pagas
- 💰 **Datadog** - APM completo
- 💰 **New Relic** - Monitoring avançado
- 💰 **Mixpanel** - Product analytics

---

## 📊 Queries SQL Úteis

### Performance de Professores

```sql
-- Top 10 professores por PEIs criados
SELECT 
  p.full_name as professor,
  COUNT(pei.id) as total_peis,
  COUNT(CASE WHEN pei.status = 'approved' THEN 1 END) as approved,
  ROUND(
    COUNT(CASE WHEN pei.status = 'approved' THEN 1 END)::numeric / 
    NULLIF(COUNT(pei.id), 0) * 100, 
    1
  ) as success_rate
FROM profiles p
JOIN peis pei ON pei.assigned_teacher_id = p.id
WHERE pei.created_at > NOW() - INTERVAL '90 days'
GROUP BY p.id, p.full_name
ORDER BY total_peis DESC
LIMIT 10;
```

### Atividade por Hora do Dia

```sql
-- Distribuição de criação de PEIs por hora
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as peis_created,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600), 2) as avg_hours_to_complete
FROM peis
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY hour
ORDER BY hour;
```

### Barreiras Mais Comuns

```sql
-- Top barreiras identificadas
SELECT 
  jsonb_array_elements_text(diagnosis_data->'barriers') as barrier_type,
  COUNT(*) as occurrences
FROM peis
WHERE diagnosis_data IS NOT NULL
  AND jsonb_array_length(diagnosis_data->'barriers') > 0
GROUP BY barrier_type
ORDER BY occurrences DESC
LIMIT 10;
```

---

## 🎯 Alertas Automatizados

### Configurar no Supabase

#### Alerta 1: Taxa de Erro Alta

```sql
-- Criar função para detectar taxa de erro alta
CREATE OR REPLACE FUNCTION check_error_rate()
RETURNS void AS $$
DECLARE
  error_count int;
  total_requests int;
  error_rate numeric;
BEGIN
  -- Contar erros na última hora
  SELECT COUNT(*) INTO error_count
  FROM logs
  WHERE level = 'error'
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Contar total de requests
  SELECT COUNT(*) INTO total_requests
  FROM logs
  WHERE created_at > NOW() - INTERVAL '1 hour';
  
  -- Calcular taxa
  error_rate := (error_count::numeric / NULLIF(total_requests, 0)) * 100;
  
  -- Alertar se > 5%
  IF error_rate > 5 THEN
    -- Enviar notificação (via webhook ou email)
    RAISE NOTICE 'ALERTA: Taxa de erro em %% na última hora', error_rate;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

#### Alerta 2: PEIs Acumulando na Fila

```sql
-- Alertar se muitos PEIs pendentes
CREATE OR REPLACE FUNCTION check_pending_peis()
RETURNS void AS $$
DECLARE
  pending_count int;
  old_pending_count int;
BEGIN
  -- PEIs pendentes
  SELECT COUNT(*) INTO pending_count
  FROM peis
  WHERE status = 'pending';
  
  -- PEIs pendentes há mais de 7 dias
  SELECT COUNT(*) INTO old_pending_count
  FROM peis
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '7 days';
  
  IF old_pending_count > 5 THEN
    RAISE NOTICE 'ALERTA: % PEIs pendentes há mais de 7 dias', old_pending_count;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 📈 Dashboard HTML Customizado

### Criar Página Interna de Métricas

Adicionar rota em `src/App.tsx`:

```typescript
<Route path="/metrics" element={<MetricsDashboard />} />
```

Criar componente `src/pages/MetricsDashboard.tsx`:

```typescript
// Dashboard interno com métricas em tempo real
// - Gráficos de PEIs por status
// - Top escolas
// - Usuários ativos
// - Performance metrics
// - Alertas automáticos
```

---

## 🔔 Notificações de Alertas

### Webhook para Slack/Discord

```typescript
// src/lib/alerts.ts
export const sendAlert = async (title: string, message: string, severity: 'info' | 'warning' | 'critical') => {
  const webhookURL = import.meta.env.VITE_WEBHOOK_URL;
  
  if (!webhookURL) return;
  
  await fetch(webhookURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      message,
      severity,
      timestamp: new Date().toISOString(),
      source: 'PEI Collab'
    })
  });
};

// Exemplos de uso:
sendAlert('Taxa de Erro Alta', '7% de erros na última hora', 'critical');
sendAlert('PEIs Acumulados', '15 PEIs pendentes há > 7 dias', 'warning');
sendAlert('Nova Escola', 'Escola XYZ adicionada à rede', 'info');
```

---

## 📊 Métricas em Tempo Real

### WebSocket para Métricas Live

```typescript
// Hook para métricas em tempo real
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLiveMetrics = () => {
  const [metrics, setMetrics] = useState({
    activeSessions: 0,
    pendingPEIs: 0,
    todayCreated: 0
  });

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel('metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'peis'
      }, (payload) => {
        // Atualizar métricas em tempo real
        loadMetrics();
      })
      .subscribe();

    loadMetrics();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMetrics = async () => {
    // Buscar métricas atualizadas
    const { data } = await supabase
      .from('peis')
      .select('*')
      .eq('status', 'pending');
    
    setMetrics(prev => ({
      ...prev,
      pendingPEIs: data?.length || 0
    }));
  };

  return metrics;
};
```

---

## ✅ Checklist de Implementação

### Analytics ✅
- [x] Vercel Analytics instalado
- [x] Speed Insights configurado
- [x] Deploy realizado

### Notificações ✅
- [x] VAPID keys geradas
- [ ] Configurar na Vercel
- [ ] Testar em produção

### Métricas 
- [ ] Criar views no Supabase
- [ ] Implementar queries de relatório
- [ ] Configurar alertas automáticos
- [ ] Dashboard de métricas interno

### Monitoramento
- [ ] Configurar uptime monitoring
- [ ] Alertas de erro configurados
- [ ] Webhook para notificações
- [ ] Relatórios semanais automáticos

---

## 🎯 Roadmap de Métricas

### Semana 1 (Agora)
- [x] Analytics básico (Vercel)
- [x] Performance tracking (Speed Insights)
- [x] VAPID keys geradas

### Semana 2
- [ ] Views materializadas
- [ ] Alertas automáticos
- [ ] Relatórios SQL

### Semana 3
- [ ] Dashboard interno
- [ ] Métricas em tempo real
- [ ] Integração Slack/Discord

### Mês 2
- [ ] Machine Learning insights
- [ ] Previsão de demanda
- [ ] Otimizações baseadas em dados

---

**Criado:** 04/11/2025 18:40  
**Status:** Parcialmente implementado  
**Próximo:** Configurar views e alertas no Supabase





