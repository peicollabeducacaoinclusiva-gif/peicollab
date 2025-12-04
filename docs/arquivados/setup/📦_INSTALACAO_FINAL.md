# 📦 Instalação Final do Monorepo PEI Collab V3

## ⚡ Configuração Completa Passo a Passo

### **🔹 Passo 1: Pré-requisitos**

Certifique-se de ter instalado:

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0

**Instalar pnpm** (se necessário):

```bash
npm install -g pnpm@8.10.0
```

**Verificar versões**:

```bash
node --version    # deve ser >= 18
pnpm --version    # deve ser >= 8
```

---

### **🔹 Passo 2: Instalar Dependências**

No **root do projeto** (onde está o `pnpm-workspace.yaml`):

```bash
pnpm install
```

Isso vai:
- Instalar dependências de todos os apps (`apps/*`)
- Instalar dependências dos packages (`packages/*`)
- Criar links simbólicos entre os packages

**Tempo estimado**: 2-3 minutos

---

### **🔹 Passo 3: Configurar Variáveis de Ambiente**

Criar arquivos `.env` em **cada app** com as credenciais do **mesmo banco Supabase**:

#### **apps/pei-collab/.env**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

#### **apps/gestao-escolar/.env**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

#### **apps/plano-aee/.env**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

> **Importante**: Todos os apps devem usar o **mesmo banco Supabase** para funcionar integrados.

---

### **🔹 Passo 4: Aplicar Migrações SQL no Supabase**

Acesse o **Supabase Dashboard** → **SQL Editor** e execute as migrações **na ordem**:

#### **Migração 1: Profissional de Apoio**

```sql
-- Copiar e executar: supabase/migrations/20250108000001_support_professional.sql
```

#### **Migração 2: Sistema de Reuniões**

```sql
-- Copiar e executar: supabase/migrations/20250108000002_meetings_system_FIXED.sql
```

#### **Migração 3: Avaliações do PEI**

```sql
-- Copiar e executar: supabase/migrations/20250108000003_pei_evaluation.sql
```

#### **Migração 4: Plano de AEE**

```sql
-- Copiar e executar: supabase/migrations/20250108000004_plano_aee.sql
```

#### **Migração 5: Blog (Opcional)**

```sql
-- Copiar e executar: supabase/migrations/20250108000005_blog.sql
```

#### **Migração 6: Gestão Escolar**

```sql
-- Copiar e executar: supabase/migrations/20250108000006_gestao_escolar.sql
```

**Como Executar**:
1. Abra o arquivo `.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**
5. Aguarde confirmação de sucesso
6. Repita para cada migração

**Tempo estimado**: 5-10 minutos

---

### **🔹 Passo 5: Criar Dados de Teste (Opcional)**

Execute este SQL no Supabase para criar dados iniciais:

```sql
-- 1. Criar escola teste
INSERT INTO schools (school_name, address, city, state, tenant_id)
SELECT 
    'Escola Teste Monorepo',
    'Rua Teste, 123',
    'São Paulo',
    'SP',
    id
FROM tenants
WHERE is_active = true
LIMIT 1;

-- 2. Criar turma
INSERT INTO classes (
    class_name, 
    education_level, 
    academic_year, 
    school_id, 
    tenant_id
)
SELECT 
    '1º Ano A',
    'ensino_fundamental_1'::education_level,
    '2025',
    s.id,
    s.tenant_id
FROM schools s
WHERE s.school_name = 'Escola Teste Monorepo'
LIMIT 1;

-- 3. Criar aluno teste
INSERT INTO students (
    full_name, 
    date_of_birth, 
    special_needs,
    school_id,
    tenant_id,
    class_id
)
SELECT 
    'João Silva',
    '2010-05-15',
    'Deficiência Intelectual',
    s.id,
    s.tenant_id,
    c.id
FROM schools s
JOIN classes c ON c.school_id = s.id
WHERE s.school_name = 'Escola Teste Monorepo'
LIMIT 1;
```

**Tempo estimado**: 2 minutos

---

### **🔹 Passo 6: Rodar os Apps**

#### **Opção A: Rodar Todos de Uma Vez (Recomendado)**

No **root do monorepo**:

```bash
pnpm dev
```

Isso vai iniciar:
- **PEI Collab**: http://localhost:8080
- **Gestão Escolar**: http://localhost:5174
- **Plano de AEE**: http://localhost:5175

#### **Opção B: Rodar Individualmente**

```bash
# Terminal 1: PEI Collab
pnpm dev:pei

# Terminal 2: Gestão Escolar
pnpm dev:gestao

# Terminal 3: Plano de AEE
pnpm dev:aee
```

**Tempo de inicialização**: ~30 segundos

---

### **🔹 Passo 7: Verificar se Está Funcionando**

#### **Testar App Gestão Escolar**:

1. Acesse: http://localhost:5174
2. Faça login com usuário admin
3. Verifique se os cards do dashboard aparecem
4. Navegue para "Alunos" → deve aparecer "João Silva"

#### **Testar App Plano de AEE**:

1. Acesse: http://localhost:5175
2. Faça login como professor AEE
3. Clique em "Novo Plano de AEE"
4. Selecione "João Silva"
5. Preencha e salve

#### **Testar App PEI Collab**:

1. Acesse: http://localhost:8080
2. Faça login como coordenador
3. Crie um PEI para "João Silva"
4. Verifique se pode adicionar reuniões
5. Verifique se pode agendar avaliações

---

## 🔧 Solução de Problemas

### **Erro: "Cannot find module '@pei/ui'"**

```bash
# Rebuild das dependências
pnpm install
pnpm build
```

---

### **Erro: "Port 8080 is already in use"**

**Solução 1**: Matar o processo existente

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

**Solução 2**: Alterar a porta no `vite.config.ts`

```typescript
export default defineConfig({
  server: {
    port: 8081, // Mudar para porta livre
  },
});
```

---

### **Erro: "infinite recursion detected in policy"**

As RLS policies foram simplificadas nas migrações. Se aparecer:

1. Vá ao Supabase Dashboard → SQL Editor
2. Execute:

```sql
-- Limpar policies antigas
DROP POLICY IF EXISTS "nome_da_policy" ON tabela;
```

3. Reaplique a migração correspondente

---

### **Erro: "Could not find column in schema cache"**

**Solução Rápida**: Recarregue a página (F5)

**Solução Permanente**: O código já usa RPC functions para bypass do cache

---

### **App não carrega dados**

1. Verifique se as migrações foram aplicadas:

```sql
-- Verificar tabelas criadas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

2. Verifique se as RLS policies estão ativas:

```sql
-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

3. Verifique se o usuário tem roles:

```sql
-- Verificar roles do usuário
SELECT * FROM user_roles 
WHERE user_id = auth.uid();
```

---

## ✅ Checklist de Instalação

- [ ] Node.js >= 18 instalado
- [ ] pnpm >= 8 instalado
- [ ] `pnpm install` executado com sucesso
- [ ] `.env` criado em cada app
- [ ] 6 migrações aplicadas no Supabase
- [ ] Dados de teste criados
- [ ] Apps rodando (`pnpm dev`)
- [ ] Gestão Escolar acessível (5174)
- [ ] Plano de AEE acessível (5175)
- [ ] PEI Collab acessível (8080)
- [ ] Teste de integração realizado

---

## 🎉 Pronto!

Seu monorepo está **100% configurado** e pronto para uso!

### **Links Rápidos**:

- **Gestão Escolar**: http://localhost:5174
- **Plano de AEE**: http://localhost:5175
- **PEI Collab**: http://localhost:8080

### **Documentação**:

- `📚_GUIA_COMPLETO_MONOREPO_V3.md` → Guia completo
- `🚀_INICIO_RAPIDO_MONOREPO.md` → Setup rápido
- `🔗_INTEGRACAO_PEI_PLANO_AEE.md` → Integração PDF
- `✅_IMPLEMENTACAO_APPS_COMPLETA.md` → Resumo técnico
- `🎯_RESUMO_EXECUTIVO_FINAL_MONOREPO.md` → Resumo executivo

---

## 🚀 Próximos Passos

1. Explore cada app
2. Teste a integração entre eles
3. Crie mais dados de teste
4. Customize conforme necessário
5. Implemente a integração do PDF (código em `🔗_INTEGRACAO_PEI_PLANO_AEE.md`)

**Boa sorte e bom desenvolvimento! 🎓♿📋**

