# 🌐 ESTRATÉGIA DE DOMÍNIOS E ACESSO - Monorepo

## 📍 **SITUAÇÃO ATUAL**

- **Domínio principal:** `peicollab.com.br`
- **App:** PEI-Collab (único)
- **Deploy:** Vercel

---

## 🎯 **ESTRATÉGIAS DE DOMÍNIOS**

### **OPÇÃO 1: SUBDOMÍNIOS** ⭐ (MAIS RECOMENDADA)

```
peicollab.com.br           → Portal/Landing page
pei.peicollab.com.br       → PEI-Collab (app atual)
aee.peicollab.com.br       → Plano de AEE
gestao.peicollab.com.br    → Gestão Escolar
aulas.peicollab.com.br     → Planejador de Aulas
api.peicollab.com.br       → API (se necessário)
docs.peicollab.com.br      → Documentação
```

#### **✅ Vantagens:**
- **SSO Simples**: Cookies compartilhados no mesmo domínio raiz
- **Branding Unificado**: Tudo sob peicollab.com.br
- **SEO**: Cada app tem sua identidade
- **Deploy Independente**: Cada subdomínio = Vercel project
- **Rollback Isolado**: Problema em um app não afeta outros

#### **🔧 Configuração:**

**No Vercel (por app):**
```
apps/pei-collab      → pei.peicollab.com.br
apps/aee-planner     → aee.peicollab.com.br
apps/school-mgmt     → gestao.peicollab.com.br
apps/lesson-planner  → aulas.peicollab.com.br
```

**No DNS (provedor do domínio):**
```
Tipo CNAME:
pei      → cname.vercel-dns.com
aee      → cname.vercel-dns.com
gestao   → cname.vercel-dns.com
aulas    → cname.vercel-dns.com
```

---

### **OPÇÃO 2: DOMÍNIOS DESCRITIVOS** (Alternativa)

```
peicollab.com.br           → PEI-Collab (principal)
planodeaee.com.br          → Plano de AEE (novo domínio)
gestaoinclusiva.com.br     → Gestão Escolar (novo domínio)
acessivel.app              → Planejador de Aulas (novo domínio)
```

#### **✅ Vantagens:**
- Identidade própria para cada app
- Marketing independente
- URLs mais descritivas

#### **❌ Desvantagens:**
- **SSO Complexo**: Precisa de OAuth/SAML entre domínios
- **Custo**: Múltiplos domínios para gerenciar
- **Branding Fragmentado**: Menos unificado
- **Cookies**: Não compartilham automaticamente

#### **Não recomendado para este caso**

---

### **OPÇÃO 3: SUBPATHS** (Não Recomendada)

```
peicollab.com.br           → Portal
peicollab.com.br/pei       → PEI-Collab
peicollab.com.br/aee       → Plano de AEE
peicollab.com.br/gestao    → Gestão Escolar
peicollab.com.br/aulas     → Planejador
```

#### **❌ Por Que NÃO:**
- Deploy complicado (um único Vercel project)
- Builds lentos (tudo junto)
- Rollback arriscado (afeta todos)
- Vercel cobra mais (um project grande)
- Roteamento complexo

---

## 🏆 **ESTRATÉGIA RECOMENDADA: SUBDOMÍNIOS**

### **Estrutura Final:**

```
┌─────────────────────────────────────────────┐
│  peicollab.com.br (Portal/Landing)          │
│  ┌───────────────────────────────────────┐  │
│  │  Bem-vindo ao PEI Collab!             │  │
│  │  Soluções para Educação Inclusiva     │  │
│  │                                       │  │
│  │  [📋 PEI]  [🎯 AEE]  [🏫 Gestão]     │  │
│  │  [📚 Aulas]  [👤 Login]              │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         │         │         │         │
         ▼         ▼         ▼         ▼
    pei.*     aee.*    gestao.*  aulas.*
```

---

## 🔐 **SSO: SINGLE SIGN-ON**

### **Como Funciona com Subdomínios:**

#### **1. Login Centralizado**

**Usuário acessa qualquer app:**
```
Usuário → https://pei.peicollab.com.br
         ↓
Não está logado
         ↓
Redireciona para: https://peicollab.com.br/auth
         ↓
Faz login
         ↓
Supabase cria sessão
         ↓
Cookie armazenado em: .peicollab.com.br
         ↓
Redireciona de volta para: pei.peicollab.com.br
         ↓
✅ Logado automaticamente!
```

#### **2. Navegação Entre Apps**

**Usuário já logado no PEI:**
```
pei.peicollab.com.br → Cookie existe
         ↓
Clica em "Plano de AEE"
         ↓
Redireciona para: aee.peicollab.com.br
         ↓
Cookie compartilhado (.peicollab.com.br)
         ↓
✅ JÁ ESTÁ LOGADO! (sem re-autenticar)
```

#### **3. Implementação no Supabase:**

```typescript
// packages/auth/src/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Cookie compartilhado entre subdomínios
      storage: {
        getItem: (key) => {
          return document.cookie
            .split('; ')
            .find(row => row.startsWith(key + '='))
            ?.split('=')[1] || null
        },
        setItem: (key, value) => {
          // Cookie com domínio raiz para compartilhar
          document.cookie = `${key}=${value}; domain=.peicollab.com.br; path=/; secure; samesite=lax`
        },
        removeItem: (key) => {
          document.cookie = `${key}=; domain=.peicollab.com.br; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
      },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)
```

**Resultado:** ✅ **Login UMA vez, acesso a TODOS os apps!**

---

## 🗺️ **NAVEGAÇÃO ENTRE APPS**

### **App Switcher (Menu Superior):**

```typescript
// packages/ui/src/components/AppSwitcher.tsx
export function AppSwitcher() {
  const currentDomain = window.location.hostname
  
  const apps = [
    {
      name: 'PEI-Collab',
      icon: '📋',
      url: 'https://pei.peicollab.com.br',
      description: 'Planos Educacionais',
      active: currentDomain.startsWith('pei.')
    },
    {
      name: 'Plano de AEE',
      icon: '🎯',
      url: 'https://aee.peicollab.com.br',
      description: 'Atendimento Especializado',
      active: currentDomain.startsWith('aee.')
    },
    {
      name: 'Gestão Escolar',
      icon: '🏫',
      url: 'https://gestao.peicollab.com.br',
      description: 'Administração',
      active: currentDomain.startsWith('gestao.'),
      roles: ['coordinator', 'school_director', 'education_secretary'] // Restrito
    },
    {
      name: 'Planejador de Aulas',
      icon: '📚',
      url: 'https://aulas.peicollab.com.br',
      description: 'Planos de Aula Inclusivos',
      active: currentDomain.startsWith('aulas.')
    }
  ]
  
  // Filtrar apps por permissão do usuário
  const { user, userRoles } = useAuth()
  const availableApps = apps.filter(app => 
    !app.roles || app.roles.some(role => userRoles.includes(role))
  )
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          {apps.find(a => a.active)?.icon}
          <span>{apps.find(a => a.active)?.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Aplicações PEI Collab</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableApps.map(app => (
          <DropdownMenuItem key={app.url} asChild>
            <a 
              href={app.url}
              className={cn(
                "flex items-start gap-3 p-3",
                app.active && "bg-primary/10"
              )}
            >
              <span className="text-2xl">{app.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{app.name}</div>
                <div className="text-xs text-muted-foreground">
                  {app.description}
                </div>
              </div>
              {app.active && (
                <Badge variant="secondary" className="text-xs">
                  Atual
                </Badge>
              )}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### **Visualização:**

```
┌────────────────────────────────────────┐
│  📋 PEI-Collab ▼                       │
├────────────────────────────────────────┤
│  📋 PEI-Collab                    [✓]  │
│     Planos Educacionais                │
│                                        │
│  🎯 Plano de AEE                       │
│     Atendimento Especializado          │
│                                        │
│  🏫 Gestão Escolar                     │
│     Administração                      │
│                                        │
│  📚 Planejador de Aulas                │
│     Planos de Aula Inclusivos          │
└────────────────────────────────────────┘
```

**Usuário clica** → Redireciona para outro subdomínio → **Já está logado!**

---

## 🔗 **DEEP LINKING ENTRE APPS**

### **Exemplo: Ver PEI a partir do Plano de AEE**

```typescript
// No app "aee-planner"
function AEEPlanDetails({ aeePlan }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plano de AEE - {student.name}</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Informações do plano de AEE */}
        
        {/* Link para o PEI relacionado */}
        {aeePlan.pei_id && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Este plano está vinculado a um PEI.
              <a 
                href={`https://pei.peicollab.com.br/pei/edit?id=${aeePlan.pei_id}`}
                className="ml-2 underline font-medium"
                target="_blank"
              >
                Ver PEI Completo →
              </a>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
```

### **Exemplo: Criar Plano de Aula a partir do PEI**

```typescript
// No app "pei-collab"
function PEIActions({ pei }) {
  return (
    <div className="flex gap-2">
      <Button onClick={() => navigate(`/pei/edit?id=${pei.id}`)}>
        Editar PEI
      </Button>
      
      {/* Link para criar plano de aula adaptado */}
      <Button 
        asChild
        variant="outline"
      >
        <a href={`https://aulas.peicollab.com.br/criar?pei=${pei.id}&student=${pei.student_id}`}>
          📚 Criar Aula Adaptada
        </a>
      </Button>
      
      {/* Link para criar plano de AEE */}
      <Button 
        asChild
        variant="outline"
      >
        <a href={`https://aee.peicollab.com.br/criar?pei=${pei.id}&student=${pei.student_id}`}>
          🎯 Criar Plano AEE
        </a>
      </Button>
    </div>
  )
}
```

---

## 🔐 **SSO: CONFIGURAÇÃO COMPLETA**

### **1. Cookie Strategy (Mais Simples)**

#### **Configuração do Supabase:**

```typescript
// packages/database/src/client.ts
export const createSupabaseClient = (appName: string) => {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        storage: {
          getItem: (key) => getCookie(key),
          setItem: (key, value) => {
            // Cookie compartilhado em .peicollab.com.br
            setCookie(key, value, {
              domain: '.peicollab.com.br',
              secure: true,
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7 // 7 dias
            })
          },
          removeItem: (key) => deleteCookie(key, {
            domain: '.peicollab.com.br'
          })
        },
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Redirect após login
        redirectTo: window.location.origin
      }
    }
  )
}
```

#### **Fluxo de Login:**

```
1. Usuário acessa aee.peicollab.com.br
2. Não tem cookie de sessão
3. Redireciona para peicollab.com.br/auth (portal central)
4. Faz login no Supabase
5. Cookie armazenado em .peicollab.com.br
6. Redireciona de volta para aee.peicollab.com.br
7. ✅ Cookie compartilhado, usuário logado!
```

### **2. Portal de Auth Centralizado**

```
peicollab.com.br/
├── /auth              → Página de login
├── /auth/callback     → Callback OAuth
├── /auth/reset        → Reset de senha
└── /                  → Landing page

Todos os apps redirecionam para cá quando não logado!
```

**Implementação:**

```typescript
// packages/auth/src/AuthGuard.tsx
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { session, loading } = useAuth()
  const currentUrl = window.location.href
  
  if (loading) return <LoadingScreen />
  
  if (!session) {
    // Redirecionar para portal central de login
    const loginUrl = `https://peicollab.com.br/auth?redirect=${encodeURIComponent(currentUrl)}`
    window.location.href = loginUrl
    return null
  }
  
  // Verificar permissão
  if (requiredRole && !hasRole(session.user, requiredRole)) {
    return <UnauthorizedScreen />
  }
  
  return <>{children}</>
}
```

---

## 📱 **PORTAL CENTRAL (peicollab.com.br)**

### **Landing Page + Login:**

```typescript
// Novo app: apps/portal
function Portal() {
  const { user } = useAuth()
  
  // Se já está logado, mostrar dashboard de apps
  if (user) {
    return <AppsDashboard user={user} />
  }
  
  // Se não, mostrar landing page + login
  return (
    <>
      <Hero />
      <Features />
      <Apps />
      <LoginSection />
    </>
  )
}

function AppsDashboard({ user }) {
  return (
    <div className="container mx-auto p-8">
      <h1>Bem-vindo, {user.full_name}!</h1>
      <p>Escolha uma aplicação:</p>
      
      <div className="grid grid-cols-2 gap-4 mt-8">
        <AppCard
          icon="📋"
          title="PEI-Collab"
          description="Planos Educacionais Individualizados"
          href="https://pei.peicollab.com.br"
          roles={['teacher', 'coordinator', 'aee_teacher']}
        />
        
        <AppCard
          icon="🎯"
          title="Plano de AEE"
          description="Atendimento Educacional Especializado"
          href="https://aee.peicollab.com.br"
          roles={['aee_teacher', 'specialist', 'coordinator']}
        />
        
        <AppCard
          icon="🏫"
          title="Gestão Escolar"
          description="Dashboard Administrativo"
          href="https://gestao.peicollab.com.br"
          roles={['school_director', 'coordinator', 'education_secretary']}
        />
        
        <AppCard
          icon="📚"
          title="Planejador de Aulas"
          description="Planos de Aula Inclusivos"
          href="https://aulas.peicollab.com.br"
          roles={['teacher', 'aee_teacher', 'coordinator']}
        />
      </div>
    </div>
  )
}
```

---

## 🎨 **BRANDING CONSISTENTE**

### **Visual Identity:**

```
┌─ Header Compartilhado ────────────────┐
│  [LOGO] PEI Collab                    │
│         📋 PEI-Collab ▼      [👤]    │
├───────────────────────────────────────┤
│  [Conteúdo específico do app]         │
└───────────────────────────────────────┘
```

**Cada app tem:**
- ✅ Mesmo header (package/ui)
- ✅ Mesmo logo
- ✅ App switcher no mesmo lugar
- ✅ Cor de destaque diferente (azul, roxo, verde, laranja)

### **Tema por App:**

```typescript
// pei.peicollab.com.br
<ThemeProvider theme={{
  primary: 'hsl(221, 83%, 53%)', // Azul
  name: 'PEI-Collab'
}} />

// aee.peicollab.com.br
<ThemeProvider theme={{
  primary: 'hsl(283, 83%, 53%)', // Roxo
  name: 'Plano de AEE'
}} />

// gestao.peicollab.com.br
<ThemeProvider theme={{
  primary: 'hsl(142, 76%, 36%)', // Verde
  name: 'Gestão Escolar'
}} />

// aulas.peicollab.com.br
<ThemeProvider theme={{
  primary: 'hsl(24, 95%, 53%)', // Laranja
  name: 'Planejador'
}} />
```

---

## 🚀 **DEPLOY STRATEGY**

### **Vercel Projects:**

| App | Vercel Project | Domínio | Branch |
|-----|----------------|---------|--------|
| Portal | `peicollab-portal` | peicollab.com.br | main |
| PEI | `peicollab-pei` | pei.peicollab.com.br | main |
| AEE | `peicollab-aee` | aee.peicollab.com.br | main |
| Gestão | `peicollab-gestao` | gestao.peicollab.com.br | main |
| Aulas | `peicollab-aulas` | aulas.peicollab.com.br | main |

### **Build Config (Turborepo):**

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### **Vercel Config (por app):**

```json
// apps/pei-collab/vercel.json
{
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@pei-collab/app-pei",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "pnpm install"
}
```

### **Deploy Workflow:**

```
Push to GitHub (main branch)
         ↓
Turborepo detecta mudanças
         ↓
┌────────────────────────────────┐
│ Mudou packages/ui?             │
│ → Rebuild TODOS os apps        │
├────────────────────────────────┤
│ Mudou apps/pei-collab?         │
│ → Rebuild APENAS pei-collab    │
├────────────────────────────────┤
│ Mudou apps/aee-planner?        │
│ → Rebuild APENAS aee-planner   │
└────────────────────────────────┘
         ↓
Vercel deploys independentes
         ↓
✅ Cada app atualiza seu domínio
```

---

## 🌍 **CONFIGURAÇÃO DNS**

### **No seu Provedor de Domínios (Registro.br):**

```
Domínio: peicollab.com.br

Records DNS:
┌──────────┬────────┬─────────────────────────┐
│ Nome     │ Tipo   │ Valor                   │
├──────────┼────────┼─────────────────────────┤
│ @        │ CNAME  │ cname.vercel-dns.com    │  ← peicollab.com.br
│ pei      │ CNAME  │ cname.vercel-dns.com    │  ← pei.peicollab.com.br
│ aee      │ CNAME  │ cname.vercel-dns.com    │  ← aee.peicollab.com.br
│ gestao   │ CNAME  │ cname.vercel-dns.com    │  ← gestao.peicollab.com.br
│ aulas    │ CNAME  │ cname.vercel-dns.com    │  ← aulas.peicollab.com.br
│ www      │ CNAME  │ cname.vercel-dns.com    │  ← www.peicollab.com.br
└──────────┴────────┴─────────────────────────┘
```

### **No Vercel (por project):**

```
Project: peicollab-pei
Domains:
  ✅ pei.peicollab.com.br (Production)
  ✅ pei-collab-git-main-....vercel.app (Auto)

Project: peicollab-aee
Domains:
  ✅ aee.peicollab.com.br (Production)
  ✅ peicollab-aee-git-main-....vercel.app (Auto)

Project: peicollab-gestao
Domains:
  ✅ gestao.peicollab.com.br (Production)
  ✅ peicollab-gestao-git-main-....vercel.app (Auto)

Project: peicollab-aulas
Domains:
  ✅ aulas.peicollab.com.br (Production)
  ✅ peicollab-aulas-git-main-....vercel.app (Auto)
```

---

## 🔄 **MIGRAÇÃO GRADUAL**

### **Fase 1: Manter como Está**
```
peicollab.com.br → PEI-Collab atual
```
**Duração:** Até setup do monorepo estar pronto

### **Fase 2: Criar Portal**
```
peicollab.com.br       → Portal (novo)
pei.peicollab.com.br   → PEI-Collab (migrado)
```
**Redirect:** `peicollab.com.br` → `pei.peicollab.com.br` (temporário)

### **Fase 3: Adicionar Apps Gradualmente**
```
peicollab.com.br       → Portal
pei.peicollab.com.br   → PEI-Collab
aee.peicollab.com.br   → Plano de AEE (novo)
```

### **Fase 4: Remover Redirect**
```
peicollab.com.br       → Portal completo (landing + login)
pei.peicollab.com.br   → PEI-Collab
aee.peicollab.com.br   → Plano de AEE
gestao.peicollab.com.br → Gestão Escolar (novo)
aulas.peicollab.com.br  → Planejador (novo)
```

---

## 💡 **EXPERIÊNCIA DO USUÁRIO**

### **Primeiro Acesso:**

```
1. Usuário digita: peicollab.com.br
2. Vê landing page linda
3. Clica "Entrar"
4. Faz login
5. Vê dashboard de apps disponíveis
6. Clica em "PEI-Collab"
7. Redireciona para pei.peicollab.com.br
8. ✅ Já está logado, usa normalmente
```

### **Acesso Direto:**

```
1. Usuário digita: pei.peicollab.com.br
2. Ainda não está logado
3. Redireciona automaticamente para peicollab.com.br/auth
4. Faz login
5. Volta para pei.peicollab.com.br
6. ✅ Logado e no app correto
```

### **Navegação Entre Apps:**

```
1. Usuário está em pei.peicollab.com.br
2. Clica no App Switcher (menu superior)
3. Seleciona "Plano de AEE"
4. Redireciona para aee.peicollab.com.br
5. ✅ Cookie compartilhado, já logado!
6. Não precisa autenticar novamente
```

---

## 📊 **PERMISSÕES POR APP**

### **Controle de Acesso:**

```typescript
// packages/auth/src/app-permissions.ts
export const APP_PERMISSIONS = {
  'pei-collab': ['teacher', 'aee_teacher', 'coordinator', 'family', 'school_director'],
  'aee-planner': ['aee_teacher', 'specialist', 'coordinator', 'school_director'],
  'school-management': ['school_director', 'coordinator', 'education_secretary', 'superadmin'],
  'lesson-planner': ['teacher', 'aee_teacher', 'coordinator']
}

export function canAccessApp(appName: string, userRoles: string[]): boolean {
  const allowedRoles = APP_PERMISSIONS[appName]
  return userRoles.some(role => allowedRoles.includes(role))
}
```

### **Menu Dinâmico:**

```typescript
// Professor vê:
✅ PEI-Collab
✅ Planejador de Aulas
❌ Gestão Escolar (sem permissão)

// Coordenador vê:
✅ PEI-Collab
✅ Plano de AEE
✅ Gestão Escolar
✅ Planejador de Aulas
```

---

## 🔄 **SINCRONIZAÇÃO DE DADOS**

### **Tempo Real (Opcional):**

```typescript
// Se alguém atualiza o PEI em pei.peicollab.com.br
// Atualização aparece automaticamente em aee.peicollab.com.br

// Usando Supabase Realtime
supabase
  .channel('pei-changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'peis' 
    },
    (payload) => {
      // Atualizar UI em todos os apps abertos
      refreshPEIData(payload.new.id)
    }
  )
  .subscribe()
```

---

## 🎯 **EXEMPLO PRÁTICO DE USO**

### **Professora Maria (Professora AEE):**

#### **Dia 1 - Manhã:**
```
1. Acessa pei.peicollab.com.br
2. Vê PEI do aluno João
3. Identifica necessidade de AEE em fonoaudiologia
4. Clica "Criar Plano de AEE" (link para aee.peicollab.com.br)
5. ✅ Já está logada
6. Plano de AEE abre pré-preenchido com dados do PEI
7. Adiciona objetivos específicos de fono
8. Salva plano
```

#### **Dia 1 - Tarde:**
```
1. Está em aee.peicollab.com.br
2. Precisa criar plano de aula adaptado
3. Clica App Switcher → "Planejador de Aulas"
4. Vai para aulas.peicollab.com.br
5. ✅ Já está logada
6. Plano de aula abre com sugestões do PEI + AEE
7. Cria aula sobre cores (objetivo do AEE)
8. Salva plano de aula
```

#### **Dia 2 - Manhã:**
```
1. Coordenador quer ver relatório
2. Acessa gestao.peicollab.com.br
3. ✅ Já está logado
4. Dashboard mostra:
   - João tem PEI ativo
   - João tem Plano AEE em andamento
   - João tem 3 aulas adaptadas planejadas
5. Exporta relatório consolidado em PDF
```

**Tudo conectado, tudo integrado!** 🎉

---

## 💰 **CUSTOS**

### **Infraestrutura:**

| Item | Custo | Nota |
|------|-------|------|
| **Vercel** | ~$20/project/mês | Hobby: grátis, Pro: $20 |
| **Domínio** | ~R$40/ano | Já possui |
| **Subdomínios** | R$0 | Ilimitados e grátis |
| **Supabase** | $25/mês | Um único banco |
| **Total** | ~$100-200/mês | 4-5 apps em produção |

**Comparado com apps separados:**
- Multi-repo: $25/app Supabase = $100-125/mês
- Monorepo: $25 total = **ECONOMIA de 75%**

---

## 📋 **CHECKLIST DE VIABILIDADE**

### **✅ Fatores Positivos:**
- [x] Domínio próprio (peicollab.com.br)
- [x] Subdomínios possíveis (ilimitados)
- [x] Mesmo Supabase pode ser usado
- [x] Usuários já cadastrados
- [x] Schema pode ser expandido
- [x] Apps se relacionam entre si
- [x] ROI rápido (3 meses)

### **⚠️ Fatores de Atenção:**
- [ ] Setup inicial leva tempo (1 mês)
- [ ] Equipe precisa aprender Turborepo
- [ ] CI/CD precisa ser ajustado
- [ ] Migrations precisam ser coordenadas

### **Veredito:**
✅ **VIÁVEL E RECOMENDADO!**

---

## 🚀 **PLANO DE AÇÃO**

### **Opção A: Começar Agora** (Agressivo)
```
Semana 1-2: Setup monorepo
Semana 3: Migrar PEI-Collab
Semana 4: Criar packages compartilhados
Semana 5-8: Desenvolver Plano de AEE
```

### **Opção B: Gradual** (Conservador)
```
Mês 1: Estabilizar PEI-Collab atual
Mês 2: Planejar e preparar monorepo
Mês 3: Setup e migração
Mês 4+: Novos apps
```

### **Opção C: Híbrido** ⭐ (Recomendado)
```
Agora: Estabilizar deploy atual + executar SQLs
Semana que vem: Planejar arquitetura detalhada
Mês que vem: Iniciar setup do monorepo
2-3 meses: Primeiro app adicional
```

---

## 🎊 **CONCLUSÃO**

### **Resposta Direta às suas Perguntas:**

#### **1. Como ficam os domínios?**
✅ **Subdomínios:**
- `pei.peicollab.com.br` - PEI-Collab
- `aee.peicollab.com.br` - Plano de AEE
- `gestao.peicollab.com.br` - Gestão
- `aulas.peicollab.com.br` - Planejador

#### **2. Como fica o acesso?**
✅ **SSO com Cookie Compartilhado:**
- Login UMA vez no portal
- Cookie em `.peicollab.com.br`
- Acesso automático a TODOS os apps
- Menu para trocar entre apps

#### **3. É viável?**
✅ **SIM, ALTAMENTE VIÁVEL!**
- ROI positivo em 3 meses
- Economia de 60-70% no desenvolvimento
- UX superior (tudo integrado)

---

**Quer que eu crie o plano de implementação detalhado?** 🎯




