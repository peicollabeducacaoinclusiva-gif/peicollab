# ⚡ APLICAR AGORA: Correção Tokens Dashboard Coordenador

**Problema:** Tokens de acesso familiar não aparecem no dashboard  
**Solução:** Adicionar policy RLS para coordenadores  
**Tempo:** 2 minutos

---

## 🚀 Passo a Passo Rápido

### 1️⃣ Aplicar Migração SQL (OBRIGATÓRIO)

#### Via Supabase Dashboard:

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: **SQL Editor**
4. Clique em **"New Query"**
5. Cole o código abaixo:

```sql
-- =====================================================
-- Adicionar Policy RLS para Coordenadores 
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.family_access_tokens ENABLE ROW LEVEL SECURITY;

-- Remover policy se já existir
DROP POLICY IF EXISTS "coordinator_can_manage_tokens" ON public.family_access_tokens;

-- Criar policy para coordenadores
CREATE POLICY "coordinator_can_manage_tokens" 
ON public.family_access_tokens
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    JOIN public.students s ON s.id = family_access_tokens.student_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'coordinator'
      AND s.school_id = p.school_id
  )
);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Policy RLS para coordenadores adicionada com sucesso!';
  RAISE NOTICE 'Coordenadores agora podem ver e gerenciar tokens de acesso familiar.';
END;
$$;
```

6. Clique em **"Run"** (Ctrl + Enter)
7. Verifique a mensagem: `NOTICE: Policy RLS para coordenadores adicionada com sucesso!`

---

### 2️⃣ Recarregar o Dashboard

1. **Abra o dashboard do coordenador**
2. **Pressione F5** ou **Ctrl + R**
3. **Veja a nova aba "Tokens"** entre "PEIs" e "Estatísticas"

---

## ✅ Como Testar

### 1. Login como Coordenador
```
Email: coord@sgc.edu.br
Senha: SGC@123456
```

### 2. Acessar Aba "Tokens"
```
Dashboard → Aba "Tokens"
```

### 3. Verificar Lista de Tokens
Você deve ver:
- ✅ Todos os tokens gerados da sua escola
- ✅ Nome do aluno
- ✅ Status (ativo, expirado, usado)
- ✅ Data de criação e expiração
- ✅ Contador de usos (ex: 3/10)

---

## 🎯 O Que Foi Corrigido?

### ✅ Antes (Problema)
- ❌ Sem aba "Tokens" no dashboard
- ❌ Coordenadores não podiam ver tokens (bloqueado por RLS)
- ❌ Tokens só apareciam como modal em PEI específico

### ✅ Depois (Corrigido)
- ✅ Nova aba "Tokens" adicionada
- ✅ Policy RLS criada para coordenadores
- ✅ Lista completa de todos os tokens da escola
- ✅ Filtros por status (ativo, expirado, usado)
- ✅ Ações: visualizar, copiar link, excluir

---

## 📋 Estrutura da Aba "Tokens"

```
┌─────────────────────────────────────────────┐
│ Dashboard do Coordenador                    │
├─────────────────────────────────────────────┤
│ [Visão Geral] [PEIs] [TOKENS] [Stats] [...] │
└─────────────────────────────────────────────┘

Aba "Tokens":
┌─────────────────────────────────────────────┐
│ 🔑 Tokens de Acesso Familiar                │
│ Gerencie e visualize todos os tokens       │
├─────────────────────────────────────────────┤
│ [🔍 Buscar...] [Filtro: Todos ▼] [🔄]      │
├─────────────────────────────────────────────┤
│ 👤 João Silva               [✅ Ativo]      │
│ 📅 Expira: 08/11/2024                      │
│ Usos: 3/10                                  │
│ [👁️] [🔗] [🗑️]                            │
├─────────────────────────────────────────────┤
│ 👤 Maria Santos            [⏰ Expirado]    │
│ ...                                         │
└─────────────────────────────────────────────┘
```

---

## 🚨 Troubleshooting

### Problema: Tokens ainda não aparecem

**Soluções:**

1. **Limpar cache do navegador:**
   ```
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

2. **Verificar se migração foi aplicada:**
   ```sql
   -- No SQL Editor do Supabase
   SELECT * FROM pg_policies 
   WHERE policyname = 'coordinator_can_manage_tokens';
   ```
   Se não retornar nada, reaplique a migração.

3. **Verificar role do usuário:**
   ```sql
   SELECT role FROM user_roles 
   WHERE user_id = auth.uid();
   ```
   Deve retornar `coordinator`.

---

## 📁 Arquivos Criados/Modificados

### ✅ Frontend (Já aplicado automaticamente)
- `src/components/dashboards/CoordinatorDashboard.tsx`
  - Adicionada aba "Tokens"
  - Renderizado componente FamilyTokenManager

### ⏸️ Backend (Aguardando sua ação)
- `supabase/migrations/20250206000001_add_coordinator_tokens_policy.sql`
  - **APLICAR AGORA** conforme instruções acima

---

## 📞 Precisa de Ajuda?

1. **Documentação completa:**
   - Veja: `CORRECAO_TOKENS_DASHBOARD_COORDENADOR.md`

2. **Logs do Supabase:**
   - Dashboard → Logs → Database

3. **Testar policy manualmente:**
   ```sql
   SELECT * FROM family_access_tokens
   WHERE student_id IN (
     SELECT id FROM students 
     WHERE school_id = (
       SELECT school_id FROM profiles 
       WHERE id = auth.uid()
     )
   );
   ```

---

**🎉 Pronto! Em 2 minutos os tokens estarão visíveis!**

---

**Data:** 06/11/2024  
**Versão:** 2.1  
**Prioridade:** 🔴 Alta (funcionalidade essencial para coordenadores)

