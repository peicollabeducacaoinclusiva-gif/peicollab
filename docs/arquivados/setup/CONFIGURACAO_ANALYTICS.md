# 📊 Configuração de Analytics - PEI Collab

**Data:** 04 de Novembro de 2025  
**Objetivo:** Monitoramento completo do sistema em produção

---

## 🎯 Stack de Analytics

### 1. Vercel Analytics (Performance + Web Vitals)
- ✅ Já incluído no plano Vercel
- ✅ Zero configuração necessária
- ✅ Métricas automáticas

### 2. Vercel Speed Insights
- ✅ Core Web Vitals
- ✅ Real User Monitoring (RUM)
- ✅ Performance tracking

### 3. Google Analytics 4 (Opcional - Comportamento)
- Eventos customizados
- Funis de conversão
- Análise de usuários

### 4. Supabase Analytics (Database)
- Queries lentas
- Uso de recursos
- Erros de RLS

---

## 🚀 Passo 1: Ativar Vercel Analytics

### Via Dashboard da Vercel

1. Acesse: https://vercel.com/pei-collab/peicollab
2. Clique em **Analytics** (menu superior)
3. Clique em **Enable Analytics**
4. Aguarde ativação (instantâneo)

**Pronto! Métricas já começam a ser coletadas!**

### Métricas Disponíveis
- Page Views
- Unique Visitors
- Top Pages
- Countries
- Devices
- Browsers
- Real User Metrics (RUM)

---

## ⚡ Passo 2: Adicionar Speed Insights

### 2.1. Instalar Pacote

```bash
npm install @vercel/speed-insights
```

### 2.2. Adicionar ao App.tsx

Adicione no início do componente App:

```typescript
import { SpeedInsights } from "@vercel/speed-insights/react"

function App() {
  return (
    <>
      <SpeedInsights />
      {/* resto do código */}
    </>
  )
}
```

### 2.3. Redeploy
```bash
npm run build
npx vercel --prod
```

**Benefícios:**
- ✅ Core Web Vitals tracking
- ✅ LCP, FID, CLS automáticos
- ✅ Performance scores

---

## 📈 Passo 3: Google Analytics 4 (Opcional)

### 3.1. Criar Propriedade GA4

1. Acesse: https://analytics.google.com/
2. Crie nova propriedade "PEI Collab"
3. Copie o **Measurement ID** (formato: G-XXXXXXXXXX)

### 3.2. Instalar react-ga4

```bash
npm install react-ga4
```

### 3.3. Configurar no App

Crie `src/lib/analytics.ts`:

```typescript
import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

export const initGA = () => {
  if (MEASUREMENT_ID && import.meta.env.PROD) {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

export const logPageView = (page: string) => {
  if (import.meta.env.PROD) {
    ReactGA.send({ hitType: 'pageview', page });
  }
};

export const logEvent = (category: string, action: string, label?: string) => {
  if (import.meta.env.PROD) {
    ReactGA.event({ category, action, label });
  }
};

// Eventos customizados do PEI Collab
export const trackPEICreated = (role: string) => {
  logEvent('PEI', 'created', role);
};

export const trackPEIApproved = (role: string) => {
  logEvent('PEI', 'approved', role);
};

export const trackLogin = (role: string) => {
  logEvent('Auth', 'login', role);
};

export const trackDashboardView = (dashboard: string) => {
  logEvent('Dashboard', 'view', dashboard);
};
```

### 3.4. Adicionar ao App.tsx

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, logPageView } from '@/lib/analytics';

function App() {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  // resto do código...
}
```

### 3.5. Configurar Variável de Ambiente

Na Vercel:
```
Key:   VITE_GA_MEASUREMENT_ID
Value: G-XXXXXXXXXX
Environment: Production
```

---

## 📊 Passo 4: Eventos Customizados

### Eventos Principais a Rastrear

```typescript
// Em Dashboard.tsx - após login
trackLogin(userRole);
trackDashboardView(userRole + '-dashboard');

// Em CreatePEI.tsx - ao criar PEI
trackPEICreated(userRole);

// Em CoordinatorDashboard.tsx - ao aprovar
trackPEIApproved('coordinator');

// Em Auth.tsx - ao cadastrar
logEvent('Auth', 'signup', userRole);

// Em offlineDatabase.ts - ao sincronizar
logEvent('Sync', 'offline-to-online', itemsCount);
```

### Funis de Conversão

**Funil 1: Criação de PEI**
```
1. Login (teacher)
2. Dashboard teacher
3. Clique "Criar Novo PEI"
4. Formulário preenchido
5. PEI salvo
6. PEI submetido
```

**Funil 2: Aprovação de PEI**
```
1. Login (coordinator)
2. Dashboard coordinator
3. Visualizar fila
4. Abrir PEI
5. Aprovar/Devolver
```

---

## 🔔 Passo 5: Alertas e Notificações

### Configurar Alertas na Vercel

1. Acesse: **Settings** → **Notifications**
2. Configure alertas para:
   - Build failures
   - Deploy errors
   - High error rates
   - Performance degradation

### Email Notifications
```
Destinatários:
- Equipe técnica
- Product Owner
- DevOps
```

---

## 📈 Passo 6: Dashboard de Métricas

### Métricas Principais

#### Performance
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

#### Uso
- **DAU** (Daily Active Users)
- **MAU** (Monthly Active Users)
- **Session Duration**
- **Bounce Rate**

#### Negócio
- **PEIs criados/dia**
- **Taxa de aprovação**
- **Tempo médio de aprovação**
- **Engajamento familiar**

#### Técnico
- **Erro rate**
- **API response time**
- **Database query time**
- **Sync success rate**

---

## 🎯 KPIs do PEI Collab

### Educacionais
1. **Cobertura Inclusiva:** % de alunos com PEI ativo
2. **Taxa de Conformidade:** % de PEIs em conformidade com LBI
3. **Engajamento Familiar:** % de famílias participando
4. **Tempo de Aprovação:** Dias médios para aprovar PEI

### Técnicos
5. **Uptime:** 99.9% esperado
6. **Performance Score:** > 90
7. **Error Rate:** < 1%
8. **Sync Success:** > 95%

### Usuários
9. **Adoção por Escola:** % de professores ativos
10. **Satisfação:** Net Promoter Score (NPS)

---

## 🔍 Ferramentas Recomendadas

### Gratuitas
- ✅ **Vercel Analytics** (incluído)
- ✅ **Vercel Speed Insights** (incluído)
- ✅ **Supabase Dashboard** (incluído)
- 🆓 **Google Analytics 4** (free tier)
- 🆓 **Plausible** (open-source, privacy-first)

### Pagas (Opcionais)
- 💰 **Mixpanel** (product analytics)
- 💰 **Amplitude** (user behavior)
- 💰 **Datadog** (APM completo)
- 💰 **Sentry** (error tracking)

---

## ✅ Checklist de Implementação

### Imediato (Hoje)
- [ ] Ativar Vercel Analytics
- [ ] Instalar Speed Insights
- [ ] Configurar alertas

### Curto Prazo (Esta Semana)
- [ ] Adicionar GA4
- [ ] Implementar eventos customizados
- [ ] Criar dashboard de métricas

### Médio Prazo (Este Mês)
- [ ] Análise de comportamento
- [ ] Otimizações baseadas em dados
- [ ] Relatórios mensais

---

**Criado:** 04/11/2025 18:25  
**Próximo:** Implementar Speed Insights

