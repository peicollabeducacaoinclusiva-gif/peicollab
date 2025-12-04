# 📝 Implementação Final - Novos Apps + Hub

## ✅ O Que Foi Implementado Nesta Sessão

### **1. Multi-Tenancy** ✅
- Migração SQL: `20250108000007_multi_tenancy.sql`
- Hook: `useTenantFromDomain()` 
- Context: `TenantProvider`
- Tabela: `tenant_domains`

### **2. Landing Page** ✅
- App completo em `apps/landing/`
- Página inicial institucional
- Seletor de redes
- Porta: 3000

### **3. Hub de Apps** ✅
- Página: `apps/pei-collab/src/pages/AppHub.tsx`
- Componente: `packages/ui/src/AppSwitcher.tsx`
- Mostra 6 apps com cards
- Filtra por permissões do usuário

---

## ⏳ O Que Falta Implementar

### **4. App Planejamento de Aulas**

**Estrutura necessária:**
```
apps/planejamento/
├── package.json          → Nome: @pei/planejamento
├── vite.config.ts        → Porta: 5176
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx → Lista de planos
│   │   ├── CreatePlan.tsx → Criar planejamento
│   │   └── EditPlan.tsx  → Editar
│   └── App.tsx
```

**Tabela SQL:**
```sql
CREATE TABLE lesson_plans (
  id uuid PRIMARY KEY,
  teacher_id uuid REFERENCES auth.users(id),
  class_id uuid REFERENCES classes(id),
  subject_id uuid REFERENCES subjects(id),
  title text,
  objectives jsonb,
  activities jsonb,
  resources jsonb,
  evaluation text,
  lesson_date date,
  duration integer,
  status text DEFAULT 'draft'
);
```

---

### **5. App Criação de Atividades**

**Estrutura necessária:**
```
apps/atividades/
├── package.json          → Nome: @pei/atividades
├── vite.config.ts        → Porta: 5177
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx → Biblioteca de atividades
│   │   ├── CreateActivity.tsx → Criar atividade
│   │   └── EditActivity.tsx → Editar
│   └── App.tsx
```

**Tabela SQL:**
```sql
CREATE TABLE activities (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text,
  subject_id uuid REFERENCES subjects(id),
  education_level education_level,
  activity_type text, -- 'individual', 'grupo', 'pratica'
  difficulty text, -- 'facil', 'medio', 'dificil'
  duration integer, -- minutos
  objectives jsonb,
  materials jsonb,
  instructions text,
  adaptations jsonb, -- Adaptações por tipo de deficiência
  attachments jsonb,
  created_by uuid REFERENCES auth.users(id),
  is_public boolean DEFAULT false,
  downloads_count integer DEFAULT 0,
  likes_count integer DEFAULT 0
);
```

---

## 🚀 Como Completar a Implementação

### **Passo 1: Aplicar Migração Multi-Tenancy**

```sql
-- No Supabase Dashboard:
Execute: supabase/migrations/20250108000007_multi_tenancy.sql
```

### **Passo 2: Adicionar Rota do Hub no PEI Collab**

Em `apps/pei-collab/src/App.tsx`, adicionar:

```typescript
import AppHub from './pages/AppHub';

// Nas routes:
<Route path="/hub" element={<AppHub />} />
```

### **Passo 3: Redirecionar para Hub Após Login**

Em `apps/pei-collab/src/pages/Auth.tsx`, após login bem-sucedido:

```typescript
// Substituir navigate('/dashboard') por:
navigate('/hub');
```

### **Passo 4: Criar Apps Planejamento e Atividades**

Copiar estrutura de `apps/gestao-escolar/` ou `apps/plano-aee/` e adaptar:

```bash
# Copiar estrutura base
cp -r apps/gestao-escolar apps/planejamento
cp -r apps/gestao-escolar apps/atividades

# Ajustar package.json de cada um:
# - Nome: @pei/planejamento e @pei/atividades
# - Porta: 5176 e 5177
```

### **Passo 5: Criar Migrações SQL**

Criar:
- `supabase/migrations/20250108000008_planejamento_aulas.sql`
- `supabase/migrations/20250108000009_atividades.sql`

### **Passo 6: Instalar e Testar**

```bash
pnpm install
pnpm dev
```

Verificar:
- Landing: http://localhost:3000
- Hub: http://localhost:8080/hub
- Planejamento: http://localhost:5176
- Atividades: http://localhost:5177

---

## 📋 URLs Finais do Sistema

| App | Desenvolvimento | Produção |
|-----|----------------|----------|
| Landing | http://localhost:3000 | https://peicollab.com.br |
| PEI Collab | http://localhost:8080 | https://rede.peicollab.com.br |
| Hub | http://localhost:8080/hub | https://rede.peicollab.com.br/hub |
| Gestão | http://localhost:5174 | https://rede.peicollab.com.br/gestao |
| AEE | http://localhost:5175 | https://rede.peicollab.com.br/aee |
| Planejamento | http://localhost:5176 | https://rede.peicollab.com.br/planejamento |
| Atividades | http://localhost:5177 | https://rede.peicollab.com.br/atividades |
| Blog | http://localhost:5178 | https://rede.peicollab.com.br/blog |

---

## 🎯 Status Atual

### **Completo:**
- [x] Multi-Tenancy (migração + hooks)
- [x] Landing Page (apps/landing)
- [x] Hub de Apps (apps/pei-collab/src/pages/AppHub.tsx)
- [x] AppSwitcher (packages/ui/src/AppSwitcher.tsx)

### **Falta:**
- [ ] Rota /hub no App.tsx
- [ ] Redirecionar login para /hub
- [ ] Criar apps/planejamento
- [ ] Criar apps/atividades
- [ ] Migrações SQL dos 2 novos apps
- [ ] Testar fluxo completo

---

## 📚 Arquivos Criados Hoje

### **Multi-Tenancy:**
- `supabase/migrations/20250108000007_multi_tenancy.sql`
- `packages/auth/src/hooks/useTenantFromDomain.ts`
- `packages/auth/src/contexts/TenantContext.tsx`

### **Landing Page:**
- `apps/landing/` (app completo)
  - package.json, vite.config.ts, tsconfig.json
  - src/pages/Home.tsx
  - src/pages/SelectNetwork.tsx
  - src/pages/About.tsx

### **Hub:**
- `apps/pei-collab/src/pages/AppHub.tsx`
- `packages/ui/src/AppSwitcher.tsx`

### **Documentação:**
- `✅_MONOREPO_COMPLETO_FUNCIONANDO.md`
- `🎊_SESSAO_COMPLETA_08JAN2025.md`
- `📝_IMPLEMENTACAO_FINAL_APPS_NOVOS.md` (este arquivo)

---

## 🎉 Próxima Sessão

Para completar 100%, na próxima sessão:
1. Criar estrutura dos apps Planejamento e Atividades
2. Criar migrações SQL
3. Adicionar rota /hub
4. Testar fluxo end-to-end
5. Deploy em produção (Vercel + wildcard domain)

---

**Última atualização**: 08 de Janeiro de 2025 - 19:30h

