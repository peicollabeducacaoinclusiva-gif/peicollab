# Sistema de Módulos - PEI Collab

## 📋 Visão Geral

O PEI Collab agora utiliza um **sistema modular** que permite ativar/desativar funcionalidades por instituição (tenant). Isso oferece:

- 🎯 **Personalização**: Cada tenant ativa apenas o que precisa
- 💰 **Economia**: Paga apenas pelos módulos utilizados
- 🚀 **Escalabilidade**: Fácil adicionar novos módulos
- 🔒 **Segurança**: Controle granular de acesso

---

## 🏗️ Arquitetura

### 2 Apps Principais

#### **1. Gestão Escolar** (gestao.peicollab.com.br)
**Core** (sempre disponível):
- Gestão de alunos, professores, turmas
- Matrículas e frequência
- Diário eletrônico e notas
- Secretaria e documentos
- Relatórios e dashboards
- Censo escolar

**Módulos Opcionais**:
- ✨ **Atividades**: Geração de atividades pedagógicas com IA
- 📰 **Blog**: Sistema de notícias (admin protegido + visualização pública)
- 🍽️ **Merenda**: Gestão de cardápios e alimentação escolar
- 📅 **Planejamento**: Planos de aula e projetos pedagógicos
- 🚌 **Transporte**: Gestão de rotas e transporte escolar

#### **2. PEI Collab** (pei.peicollab.com.br)
**Core** (sempre disponível):
- PEI (Plano Educacional Individualizado)
- Diagnóstico e planejamento
- Avaliações e reuniões
- Portal responsável (acesso familiar)

**Módulo Opcional**:
- ♿ **Plano AEE**: Atendimento Educacional Especializado

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas

#### `available_modules`
Catálogo de módulos disponíveis no sistema.

```sql
CREATE TABLE available_modules (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,              -- ID do módulo (ex: 'atividades')
  display_name TEXT NOT NULL,             -- Nome amigável
  description TEXT,                       -- Descrição do módulo
  icon TEXT,                              -- Ícone (lucide-react)
  app TEXT NOT NULL,                      -- 'gestao-escolar' ou 'pei-collab'
  is_public BOOLEAN DEFAULT false,        -- Se tem componentes públicos
  requires_modules TEXT[] DEFAULT '{}',   -- Dependências (futuro)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `tenant_modules`
Módulos habilitados para cada instituição.

```sql
CREATE TABLE tenant_modules (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,                -- Instituição
  module_name TEXT NOT NULL,              -- Nome do módulo
  is_enabled BOOLEAN DEFAULT false,       -- Ativo/Inativo
  enabled_at TIMESTAMPTZ,                 -- Quando foi ativado
  enabled_by UUID,                        -- Quem ativou
  settings JSONB DEFAULT '{}',            -- Configurações do módulo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, module_name)
);
```

### RPCs (Remote Procedure Calls)

#### `get_enabled_modules(p_tenant_id UUID)`
Retorna módulos habilitados para um tenant.

```sql
SELECT * FROM get_enabled_modules('tenant-id-aqui');
```

**Retorno**:
```json
[
  {
    "module_name": "atividades",
    "display_name": "Atividades Pedagógicas",
    "icon": "clipboard",
    "is_public": false,
    "settings": {}
  }
]
```

#### `enable_module_for_tenant(...)`
Habilita um módulo para um tenant (apenas superadmin).

```sql
SELECT enable_module_for_tenant(
  'tenant-id'::UUID,
  'atividades',
  'user-id'::UUID,
  '{}'::JSONB
);
```

#### `disable_module_for_tenant(...)`
Desabilita um módulo para um tenant.

```sql
SELECT disable_module_for_tenant(
  'tenant-id'::UUID,
  'atividades'
);
```

---

## 💻 Como Usar no Código

### Hook `useModules`

```typescript
import { useModules } from '@/core/hooks/useModules';

function MyComponent() {
  const { enabledModules, isModuleEnabled, isLoading } = useModules();
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      {isModuleEnabled('atividades') && (
        <Link to="/atividades">Atividades</Link>
      )}
      
      {enabledModules.map(module => (
        <MenuItem key={module.module_name} {...module} />
      ))}
    </div>
  );
}
```

### Guard de Rotas

```typescript
import { ModuleGuard } from '@/core/components/ModuleGuard';

<Route 
  path="/atividades/*" 
  element={
    <ModuleGuard module="atividades">
      <AtividadesRoutes />
    </ModuleGuard>
  } 
/>
```

### Menu Dinâmico

```typescript
const { enabledModules } = useModules();

const menuItems = [
  // Core (sempre visível)
  { name: 'Dashboard', path: '/dashboard', always: true },
  
  // Módulos (condicional)
  { name: 'Atividades', path: '/atividades', module: 'atividades' },
  { name: 'Merenda', path: '/merenda', module: 'merenda' },
].filter(item => 
  item.always || enabledModules.some(m => m.module_name === item.module)
);
```

---

## 👨‍💼 Administração de Módulos

### Via Interface (Recomendado)

1. Acesse como **Superadmin**
2. Navegue para `/superadmin/modules`
3. Selecione a instituição
4. Ative/desative módulos com toggle
5. Mudanças são instantâneas

### Via SQL (Avançado)

Execute no **Supabase SQL Editor**:

```sql
-- Habilitar módulo
SELECT enable_module_for_tenant(
  (SELECT id FROM tenants WHERE network_name = 'Escola Teste'),
  'atividades',
  (SELECT id FROM profiles WHERE role = 'superadmin' LIMIT 1),
  '{}'::JSONB
);

-- Verificar módulos habilitados
SELECT 
  t.network_name,
  am.display_name,
  tm.is_enabled,
  tm.enabled_at
FROM tenant_modules tm
JOIN available_modules am ON am.name = tm.module_name
JOIN tenants t ON t.id = tm.tenant_id
WHERE tm.is_enabled = true
ORDER BY t.network_name, am.display_name;
```

---

## 📦 Módulos Disponíveis

### Gestão Escolar

| Módulo | Nome | Descrição | Rota |
|--------|------|-----------|------|
| `atividades` | Atividades Pedagógicas | Geração e gestão de atividades | `/atividades` |
| `blog` | Blog/Notícias | Publicação de conteúdo (público na landing) | `/admin/blog` |
| `merenda` | Merenda Escolar | Cardápios e nutrição | `/merenda` |
| `planejamento` | Planejamento | Planos de aula e projetos | `/planejamento` |
| `transporte` | Transporte | Rotas e veículos | `/transporte` |

### PEI Collab

| Módulo | Nome | Descrição | Rota |
|--------|------|-----------|------|
| `plano-aee` | Plano AEE | Atendimento Educacional Especializado | `/plano-aee` |

---

## 🎨 Características dos Módulos

### Módulos Públicos

Alguns módulos têm componentes **públicos** (sem autenticação):

- **Blog**: Posts publicados aparecem na landing page (`/blog`)
  - Admin protegido: `/admin/blog`
  - Visualização pública: `/blog`, `/blog/[slug]`

### Módulos Protegidos

Todos os outros módulos requerem:
- ✅ Autenticação
- ✅ Tenant ativo
- ✅ Módulo habilitado para o tenant
- ✅ Permissões adequadas (roles)

---

## 🔄 Fluxo de Ativação

```mermaid
1. Superadmin acessa /superadmin/modules
2. Seleciona instituição
3. Ativa módulo desejado
4. Sistema atualiza tenant_modules
5. Usuários da instituição veem módulo no menu
6. Ao clicar, ModuleGuard verifica permissão
7. Se habilitado, acessa módulo
8. Se não, redireciona para /modulo-nao-disponivel
```

---

## 🧪 Testando Módulos

### 1. Habilitar Módulo de Teste

```sql
-- No Supabase SQL Editor
SELECT enable_module_for_tenant(
  'SEU_TENANT_ID'::UUID,
  'atividades',
  'SEU_USER_ID'::UUID,
  '{}'::JSONB
);
```

### 2. Verificar no App

1. Login como usuário do tenant
2. Verificar se "Atividades" aparece no menu
3. Clicar e testar funcionalidade
4. Verificar que outros tenants não veem o módulo

### 3. Desabilitar e Testar

```sql
SELECT disable_module_for_tenant(
  'SEU_TENANT_ID'::UUID,
  'atividades'
);
```

Verificar que módulo desaparece do menu.

---

## 📊 Monitoramento

### Queries Úteis

```sql
-- Módulos mais usados
SELECT 
  module_name,
  COUNT(*) as total_tenants,
  COUNT(*) FILTER (WHERE is_enabled) as active_tenants
FROM tenant_modules
GROUP BY module_name
ORDER BY active_tenants DESC;

-- Tenants por módulo
SELECT 
  am.display_name as modulo,
  COUNT(tm.id) as tenants_habilitados
FROM available_modules am
LEFT JOIN tenant_modules tm ON tm.module_name = am.name AND tm.is_enabled = true
GROUP BY am.display_name
ORDER BY tenants_habilitados DESC;

-- Histórico de ativações
SELECT 
  t.network_name,
  am.display_name,
  tm.enabled_at,
  p.full_name as habilitado_por
FROM tenant_modules tm
JOIN tenants t ON t.id = tm.tenant_id
JOIN available_modules am ON am.name = tm.module_name
LEFT JOIN profiles p ON p.id = tm.enabled_by
WHERE tm.is_enabled = true
ORDER BY tm.enabled_at DESC
LIMIT 20;
```

---

## 🆕 Adicionando Novos Módulos

### Passo 1: Cadastrar no Banco

```sql
INSERT INTO available_modules (name, display_name, description, icon, app, is_public)
VALUES (
  'novo-modulo',
  'Novo Módulo',
  'Descrição do novo módulo',
  'package',
  'gestao-escolar',  -- ou 'pei-collab'
  false
);
```

### Passo 2: Criar Estrutura de Código

```bash
# Criar pasta do módulo
mkdir -p apps/gestao-escolar/src/modules/novo-modulo/{pages,components,services}

# Criar routes.tsx
# Criar index.ts
```

### Passo 3: Integrar no App.tsx

```typescript
import { NovoModuloRoutes } from './modules/novo-modulo';

<Route path="/novo-modulo/*" element={
  <ProtectedRoute>
    <ModuleGuard module="novo-modulo">
      <NovoModuloRoutes />
    </ModuleGuard>
  </ProtectedRoute>
} />
```

### Passo 4: Adicionar ao Menu

```typescript
const menuItems = [
  // ... outros
  { 
    name: 'Novo Módulo', 
    path: '/novo-modulo', 
    icon: Package, 
    module: 'novo-modulo' 
  },
];
```

---

## 🔐 Segurança e RLS

### Políticas Aplicadas

**available_modules**:
- ✅ Leitura pública (todos podem ver módulos disponíveis)

**tenant_modules**:
- ✅ Leitura apenas para usuários do próprio tenant
- ✅ Escrita apenas via RPCs (SECURITY DEFINER)

**Vantagens**:
- Nenhum tenant vê configurações de outros
- Apenas superadmin pode habilitar/desabilitar
- RPCs garantem validação centralizada

---

## 📱 Exemplos de Uso

### Tenant A (Escola Municipal)
```
✅ Core Gestão Escolar
✅ Módulo Merenda (habilitado)
✅ Módulo Transporte (habilitado)
❌ Módulo Atividades (não habilitado)
❌ Módulo Blog (não habilitado)
```

Menu exibe apenas: Dashboard, Alunos, Professores, **Merenda**, **Transporte**

### Tenant B (Rede Privada)
```
✅ Core Gestão Escolar
✅ Módulo Atividades (habilitado)
✅ Módulo Blog (habilitado)
✅ Módulo Planejamento (habilitado)
❌ Módulo Merenda (não habilitado)
❌ Módulo Transporte (não habilitado)
```

Menu exibe: Dashboard, Alunos, **Atividades**, **Blog**, **Planejamento**

---

## 🎯 Roadmap

### Fase 1 (Atual) ✅
- [x] Sistema de módulos no banco
- [x] Hooks e guards
- [x] Integração física dos módulos
- [x] UI de administração
- [x] Deploy funcional

### Fase 2 (Próximo)
- [ ] Analytics de uso por módulo
- [ ] Configurações avançadas por módulo
- [ ] Módulos com planos/pricing
- [ ] Marketplace de módulos

### Fase 3 (Futuro)
- [ ] Módulos desenvolvidos por terceiros
- [ ] SDK para criar módulos
- [ ] Módulos com webhooks
- [ ] Módulos com APIs próprias

---

## 🛠️ Manutenção

### Logs de Auditoria

Todas as ativações/desativações são registradas em `tenant_modules`:
- `enabled_at`: Quando foi ativado
- `enabled_by`: Quem ativou
- `settings`: Configurações aplicadas

### Backup

```sql
-- Backup de configurações de módulos
COPY (
  SELECT * FROM tenant_modules WHERE is_enabled = true
) TO '/tmp/modules_backup.csv' CSV HEADER;
```

### Restauração

```sql
-- Restaurar configurações
\copy tenant_modules FROM '/tmp/modules_backup.csv' CSV HEADER;
```

---

## 📞 Suporte

### Problemas Comuns

**Módulo não aparece no menu**
- Verificar se está habilitado: `SELECT * FROM tenant_modules WHERE tenant_id = 'X'`
- Verificar cache do browser (Ctrl+Shift+R)
- Verificar console do browser para erros

**Erro ao ativar módulo**
- Verificar permissões (apenas superadmin)
- Verificar se módulo existe em `available_modules`
- Verificar logs do Supabase

**Módulo habilitado mas redireciona**
- Verificar `ModuleGuard` no código
- Verificar token de autenticação
- Verificar tenant_id do usuário

---

## 📚 Referências

- **Migration**: `supabase/migrations/20251204154659_create_modules_system.sql`
- **Hooks**: `apps/*/src/core/hooks/useModules.ts`
- **Guards**: `apps/*/src/core/components/ModuleGuard.tsx`
- **Admin UI**: `apps/gestao-escolar/src/pages/superadmin/ModuleManagement.tsx`
- **Scripts**: `scripts/enable-test-modules.sql`

---

**Data de Criação**: 04/12/2025  
**Versão**: 1.0  
**Status**: ✅ Produção

