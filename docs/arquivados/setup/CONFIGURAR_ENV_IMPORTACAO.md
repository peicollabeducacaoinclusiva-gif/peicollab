# 🔑 CONFIGURAR VARIÁVEIS DE AMBIENTE

## ❌ **ERRO ATUAL**

```
❌ Erro: Variáveis de ambiente não configuradas
Configure: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
```

---

## ✅ **SOLUÇÃO (3 Passos)**

### **PASSO 1: Obter Credenciais do Supabase**

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto **PEI Colaborativo**
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** (ex: `https://xyzabc123.supabase.co`)
   - **service_role** key ⚠️ **NÃO a anon key!**

**⚠️ IMPORTANTE:** Precisa da **service_role key** (secret), não da **anon key** (public)!

---

### **PASSO 2: Criar Arquivo .env.local**

Crie um arquivo chamado `.env.local` na raiz do projeto com este conteúdo:

```env
# URL do projeto Supabase
VITE_SUPABASE_URL=https://sua-url.supabase.co

# Service Role Key (para scripts de importação)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Substitua pelos valores reais do seu projeto!**

---

### **PASSO 3: Executar Importação**

```bash
node scripts/import_csv_pei.js PEIColaborativo-SGC-Respostasaoformulário1.csv
```

---

## 📋 **TEMPLATE DO ARQUIVO .env.local**

Copie e cole (substitua os valores):

```env
# ============================================================================
# CONFIGURAÇÃO LOCAL - PEI Colaborativo
# ============================================================================

# URL do projeto Supabase
VITE_SUPABASE_URL=https://xyzabc123.supabase.co

# Service Role Key (para scripts de importação)
# ⚠️ IMPORTANTE: Use a service_role key, NÃO a anon key!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2ODc...

# ============================================================================
```

---

## 🔍 **ONDE ENCONTRAR AS CHAVES**

### **No Supabase Dashboard:**

```
1. Settings (⚙️)
   ↓
2. API
   ↓
3. Project URL
   └─ https://xyzabc123.supabase.co
   
4. Project API keys
   ├─ anon public (❌ NÃO USE ESTA)
   └─ service_role (✅ USE ESTA)
```

**Screenshot:**
```
┌─────────────────────────────────────┐
│ Project URL                         │
│ https://xyzabc123.supabase.co       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Project API keys                    │
├─────────────────────────────────────┤
│ anon public                         │
│ eyJhbGciOi... (❌ NÃO)              │
├─────────────────────────────────────┤
│ service_role ⚠️ SECRET              │
│ eyJhbGciOi... (✅ SIM)              │
│ [Reveal] [Copy]                     │
└─────────────────────────────────────┘
```

---

## ⚠️ **ATENÇÃO - SEGURANÇA**

### **Service Role Key:**

- ✅ Tem **poderes de admin** no Supabase
- ❌ **NUNCA** commit no Git
- ❌ **NUNCA** compartilhe publicamente
- ✅ Mantenha **APENAS** em `.env.local`
- ✅ Arquivo `.env.local` já está no `.gitignore`

### **Verificar .gitignore:**

```bash
# Verificar se .env.local está ignorado
cat .gitignore | grep .env.local

# Deve aparecer:
# .env.local
```

---

## 📝 **PASSO A PASSO VISUAL**

### **1. Criar arquivo .env.local na raiz do projeto:**

```
pei-collab/
├── src/
├── scripts/
├── package.json
└── .env.local  ← CRIAR ESTE ARQUIVO AQUI
```

### **2. Conteúdo do arquivo:**

```env
VITE_SUPABASE_URL=https://[SEU-PROJETO].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[RESTO-DA-CHAVE]
```

### **3. Salvar e executar:**

```bash
node scripts/import_csv_pei.js PEIColaborativo-SGC-Respostasaoformulário1.csv
```

---

## ✅ **CHECKLIST**

```bash
# 1. ✅ Migrações SQL executadas (você já fez)

# 2. ⏳ Criar arquivo .env.local
#    - Copiar template acima
#    - Obter credenciais do Supabase Dashboard
#    - Colar no arquivo

# 3. ⏳ Executar importação
node scripts/import_csv_pei.js PEIColaborativo-SGC-Respostasaoformulário1.csv
```

---

## 🆘 **ERRO COMUM**

### **"Cannot find module 'papaparse'"**

```bash
# Instalar papaparse
npm install papaparse
```

---

**📝 Crie o arquivo `.env.local` com as credenciais do Supabase e execute o comando acima!**
