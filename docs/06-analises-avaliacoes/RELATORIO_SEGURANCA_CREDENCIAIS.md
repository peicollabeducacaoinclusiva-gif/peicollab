# 🔒 Relatório de Segurança - Credenciais Expostas

**Data:** 2025-02-03  
**Status:** ⚠️ **CRÍTICO - Ação Imediata Necessária**

## 🚨 Problemas Identificados

### 1. **CRÍTICO: OpenAI API Key Exposta**
- **Localização:** Múltiplos arquivos
- **Chave:** `[REMOVIDO POR SEGURANÇA]`
- **Impacto:** Alto - Pode resultar em custos não autorizados
- **Arquivos Afetados:**
  - `scripts/completar-com-openai-simples.js` (linha 18)
  - `scripts/completar-peis-openai.js` (linha 23)
  - `scripts/completar-planning-final.js` (linha 23)
  - `supabase/functions/generate-pei-planning/index.ts` (linha 107)

### 2. **CRÍTICO: Supabase Service Role Key Exposta**
- **Localização:** Múltiplos scripts
- **Chave:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY5NjQ3MiwiZXhwIjoyMDc3MjcyNDcyfQ.ezYPOGMO2ik-VaiNoBrJ7cKKivms3SiZsJ5zN0Fhm3Fg`
- **Impacto:** MUITO ALTO - Permite acesso total ao banco de dados, ignorando RLS
- **Arquivos Afetados:**
  - `scripts/completar-com-openai-simples.js` (linha 13)
  - `scripts/completar-peis-openai.js` (linha 17)
  - `scripts/completar-peis-com-ia.js` (linha 7)
  - `scripts/apply-all-migrations.js` (linha 15)

### 3. **ALTO: Supabase Anon Key Hardcoded**
- **Localização:** Múltiplos arquivos
- **Impacto:** Médio - Deve estar em variáveis de ambiente
- **Arquivos Afetados:**
  - Múltiplos arquivos em `scripts/`, `packages/`, `apps/`, `src/`
  - Estes têm fallback para valores hardcoded

### 4. **MÉDIO: Senhas de Teste Hardcoded**
- **Impacto:** Baixo - Apenas para ambiente de desenvolvimento/teste
- **Arquivos Afetados:**
  - Vários scripts de teste com senhas como `Teste123`, `SGC@123456`, etc.

### 5. **BAIXO: URLs do Supabase Hardcoded**
- **Impacto:** Baixo - URLs públicas, mas preferível usar variáveis de ambiente
- **Arquivos Afetados:**
  - Múltiplos arquivos com `https://fximylewmvsllkdczovj.supabase.co`

---

## ✅ Ações Recomendadas (Prioridade)

### 🔴 **URGENTE (Fazer Agora)**

1. **Revogar e Regenerar Chaves Expostas:**
   - [ ] Revogar OpenAI API Key atual e gerar nova
   - [ ] Revogar Supabase Service Role Key e gerar nova
   - [ ] Atualizar todas as referências para usar variáveis de ambiente

2. **Mover Credenciais para Variáveis de Ambiente:**
   - [ ] Criar arquivo `.env.example` com estrutura
   - [ ] Atualizar `.gitignore` para garantir que `.env*` não sejam commitados
   - [ ] Mover todas as chaves para variáveis de ambiente

3. **Atualizar Arquivos Críticos:**
   - [ ] `scripts/completar-com-openai-simples.js`
   - [ ] `scripts/completar-peis-openai.js`
   - [ ] `scripts/completar-peis-com-ia.js`
   - [ ] `scripts/apply-all-migrations.js`
   - [ ] `supabase/functions/generate-pei-planning/index.ts`

### 🟡 **IMPORTANTE (Fazer em Seguida)**

4. **Limpar Histórico do Git (se necessário):**
   - [ ] Se as chaves foram commitadas, considerar usar `git filter-branch` ou BFG Repo-Cleaner
   - [ ] Forçar push para remover do histórico

5. **Auditoria Completa:**
   - [ ] Verificar se há outros secrets em arquivos não rastreados
   - [ ] Verificar histórico de commits públicos
   - [ ] Configurar pre-commit hooks para detectar secrets

### 🟢 **RECOMENDADO (Melhorias)**

6. **Implementar Boas Práticas:**
   - [ ] Usar bibliotecas como `dotenv` para gerenciar variáveis de ambiente
   - [ ] Implementar validação de variáveis de ambiente na inicialização
   - [ ] Configurar secret scanning no CI/CD
   - [ ] Documentar processo de configuração de ambiente

---

## 📋 Checklist de Correção

### Scripts a Corrigir
- [ ] `scripts/completar-com-openai-simples.js`
- [ ] `scripts/completar-peis-openai.js`
- [ ] `scripts/completar-peis-com-ia.js`
- [ ] `scripts/completar-planning-final.js`
- [ ] `scripts/completar-planning-openai.js`
- [ ] `scripts/apply-all-migrations.js`
- [ ] `scripts/listar-redes.js`
- [ ] `scripts/test-sso.js`
- [ ] `scripts/create-secretary-sao-goncalo.js`

### Edge Functions a Corrigir
- [ ] `supabase/functions/generate-pei-planning/index.ts`

### Packages/Apps a Corrigir
- [ ] `packages/database/src/client.ts`
- [ ] `packages/ui/src/AppSwitcher.tsx`
- [ ] `packages/ui/src/hooks/useUserProfile.ts`
- [ ] `packages/ui/src/components/shared/UserMenu.tsx`
- [ ] `src/integrations/supabase/client.ts`
- [ ] `apps/pei-collab/src/integrations/supabase/client.ts`
- [ ] `apps/landing/src/integrations/supabase/client.ts`
- [ ] `apps/blog/src/lib/supabase.ts`

---

## 🔐 Estrutura Recomendada de Variáveis de Ambiente

```bash
# .env.example (template)
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_key_here

# Para scripts Node.js
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_key_here

# Para Edge Functions (Deno)
OPENAI_API_KEY=your_openai_key_here
```

---

## 📝 Notas Importantes

1. **Nunca commitar arquivos `.env`** - Já está no `.gitignore`, mas verificar novamente
2. **Service Role Key** deve ser usado APENAS em:
   - Scripts de migração
   - Edge Functions server-side
   - Nunca no frontend ou código cliente
3. **Anon Key** pode ser pública, mas é melhor prática usar variáveis de ambiente
4. **OpenAI API Key** deve ser sempre protegida e nunca exposta

---

## 🚀 Próximos Passos

1. Revisar este relatório
2. Revogar chaves expostas
3. Implementar correções prioritárias
4. Testar aplicação com novas configurações
5. Commit e deploy apenas após correções

---

**⚠️ ATENÇÃO:** Não fazer commit das mudanças até que todas as credenciais sejam movidas para variáveis de ambiente e as chaves antigas sejam revogadas.

