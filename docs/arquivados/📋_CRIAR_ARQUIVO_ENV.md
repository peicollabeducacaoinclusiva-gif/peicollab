# 📋 COMO CRIAR O ARQUIVO .env

**Status**: ⚠️ **AÇÃO NECESSÁRIA - CRIAR MANUALMENTE**

---

## 🎯 POR QUE CRIAR?

O arquivo `.env` contém as URLs de todos os apps do monorepo para:
- ✅ Navegação via AppSwitcher
- ✅ Links entre apps (Landing, Blog, etc)
- ✅ Configuração centralizada
- ✅ Fácil mudança dev → produção

---

## 🚀 PASSO A PASSO (WINDOWS)

### Opção 1: PowerShell (RECOMENDADO)

```powershell
# Na raiz do projeto (C:\workspace\Inclusao\pei-collab)
Copy-Item .env.example .env
```

### Opção 2: Manualmente

1. Abrir a pasta raiz do projeto no Explorer
2. Copiar o arquivo `.env.example`
3. Renomear a cópia para `.env`
4. Pronto!

---

## 📄 CONTEÚDO DO ARQUIVO .env

```env
# URLs dos Apps (Development)
VITE_PEI_COLLAB_URL=http://localhost:8080
VITE_GESTAO_ESCOLAR_URL=http://localhost:5174
VITE_PLANO_AEE_URL=http://localhost:5175
VITE_PLANEJAMENTO_URL=http://localhost:5176
VITE_ATIVIDADES_URL=http://localhost:5177
VITE_BLOG_URL=http://localhost:5179
VITE_LANDING_URL=http://localhost:3001

# Supabase
VITE_SUPABASE_URL=https://fximylewmvsllkdczovj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids
```

---

## ✅ APÓS CRIAR O .env

### 1. Reiniciar os Apps

```bash
# Parar todos os apps (Ctrl+C no terminal)
# Reiniciar turborepo
pnpm dev
```

### 2. Testar AppSwitcher

1. Abrir http://localhost:8080
2. Fazer login (superadmin@teste.com / Teste123!)
3. Ver ícone Grid3x3 no header
4. Clicar e ver dropdown com apps
5. Navegar entre apps

### 3. Verificar Console

Os apps devem carregar as URLs do .env sem erros.

---

## 🔒 SEGURANÇA

- ✅ `.env` está no `.gitignore` (não será commitado)
- ✅ `.env.example` pode ser commitado (sem dados sensíveis)
- ✅ Token SSO salvo apenas no localStorage local

---

## 🎊 PRONTO!

Após criar o `.env`, a navegação unificada estará **100% funcional!**

**Comando rápido**:
```powershell
Copy-Item .env.example .env
```

---

**Criado por**: Claude Sonnet 4.5  
**Data**: 10/11/2025

