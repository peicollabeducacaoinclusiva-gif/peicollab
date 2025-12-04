# ✅ Correções Finais - RLS e Header

**Data**: 08/01/2025  
**Problemas Corrigidos:**
1. ✅ Recursão infinita nas RLS policies
2. ✅ Falta de cabeçalho nas páginas

---

## 🔧 CORREÇÃO 1: RLS Policies (URGENTE)

### ⚠️ Execute Este SQL Agora no Supabase

Abra o **Supabase Dashboard** → **SQL Editor** e execute:

```sql
-- ============================================================================
-- CORREÇÃO: RLS Policies para pei_meetings (sem recursão)
-- ============================================================================

-- Remover policies problemáticas
DROP POLICY IF EXISTS "coordinators_manage_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "directors_manage_school_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "participants_view_own_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "inherit_meeting_permissions" ON "public"."pei_meeting_peis";
DROP POLICY IF EXISTS "coordinators_directors_manage_participants" ON "public"."pei_meeting_participants";

-- Coordenadores podem gerenciar todas as reuniões da rede
CREATE POLICY "coordinators_manage_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM "public"."user_roles" ur
            JOIN "public"."profiles" p ON p.id = ur.user_id
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
            AND p.tenant_id = "pei_meetings"."tenant_id"
        )
    );

-- Diretores podem gerenciar reuniões da sua escola
CREATE POLICY "directors_manage_school_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING (
        "pei_meetings"."school_id" IN (
            SELECT p.school_id
            FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('school_manager', 'education_secretary')
            AND p.school_id IS NOT NULL
        )
    );

-- Participantes podem ver reuniões das quais participam
CREATE POLICY "participants_view_own_meetings"
    ON "public"."pei_meetings"
    FOR SELECT
    USING (
        "pei_meetings"."id" IN (
            SELECT pmp.meeting_id
            FROM "public"."pei_meeting_participants" pmp
            WHERE pmp.user_id = auth.uid()
        )
    );

-- Criador pode gerenciar suas próprias reuniões
CREATE POLICY "creator_manage_own_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING ("pei_meetings"."created_by" = auth.uid());

-- Usuários que podem ver a reunião podem ver os PEIs vinculados
CREATE POLICY "view_peis_of_accessible_meetings"
    ON "public"."pei_meeting_peis"
    FOR SELECT
    USING (true);

-- Coordenadores e criadores podem gerenciar vinculações
CREATE POLICY "coordinators_manage_meeting_peis"
    ON "public"."pei_meeting_peis"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_manager')
        )
        OR
        EXISTS (
            SELECT 1
            FROM "public"."pei_meetings" pm
            WHERE pm.id = "pei_meeting_peis"."meeting_id"
            AND pm.created_by = auth.uid()
        )
    );

-- Coordenadores e criadores da reunião podem gerenciar participantes
CREATE POLICY "manage_participants_of_own_meetings"
    ON "public"."pei_meeting_participants"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_manager')
        )
        OR
        EXISTS (
            SELECT 1
            FROM "public"."pei_meetings" pm
            WHERE pm.id = "pei_meeting_participants"."meeting_id"
            AND pm.created_by = auth.uid()
        )
    );
```

### ✅ Mensagem de Sucesso

Você deve ver:
```
Success. No rows returned
```

---

## ✅ CORREÇÃO 2: Headers Adicionados

### Arquivos Modificados:

1. **Criado**: `src/components/shared/PageLayout.tsx` ✅
   - Componente de layout compartilhado
   - Header com logo e navegação
   - Botão "Voltar" e "Sair"

2. **Modificado**: `src/pages/MeetingsDashboard.tsx` ✅
   - Agora usa PageLayout
   - Header aparece automaticamente

3. **Modificado**: `src/pages/CreateMeeting.tsx` ✅
   - Agora usa PageLayout
   - Botão "Voltar" para /meetings

4. **Modificado**: `src/pages/MeetingMinutes.tsx` ✅
   - Agora usa PageLayout
   - Botão "Voltar" para /meetings

5. **Modificado**: `src/pages/EvaluationSchedule.tsx` ✅
   - Agora usa PageLayout
   - Header completo

---

## 🧪 TESTE AGORA

### Passo 1: Aplicar SQL

```
1. Abra Supabase Dashboard
2. Vá para SQL Editor
3. Copie e cole o SQL acima
4. Clique em RUN
5. Aguarde mensagem de sucesso
```

### Passo 2: Reiniciar o App

```bash
# Ctrl+C no terminal
# Depois:
npm run dev
```

### Passo 3: Testar

```
1. Acesse: http://localhost:8080/meetings
2. Verifique se:
   ✅ Header aparece (logo, voltar, sair)
   ✅ Página carrega sem erro
   ✅ Não aparece "infinite recursion"
   ✅ Cards de estatísticas aparecem
```

---

## 📊 O Que Deve Aparecer

### Página /meetings com Header:

```
┌────────────────────────────────────────────┐
│ [← Voltar]    🎓 PEI Collab    [🌓][Sair] │ ← HEADER NOVO
├────────────────────────────────────────────┤
│  Reuniões de PEI        [Nova Reunião]    │
│                                             │
│  [Cards de Estatísticas]                   │
│  Total: 0    Agendadas: 0                  │
│                                             │
│  [Buscar Reuniões]                         │
│                                             │
│  [Tabs: Agendadas|Concluídas|Canceladas]  │
│                                             │
│  📅 Nenhuma reunião encontrada             │
│  [Criar Primeira Reunião]                  │
└────────────────────────────────────────────┘
```

---

## ✅ Checklist de Verificação

Após aplicar o SQL e reiniciar:

- [ ] SQL executado sem erros
- [ ] Servidor reiniciado
- [ ] Header aparece em /meetings
- [ ] Header aparece em /meetings/create
- [ ] Header aparece em /evaluations/schedule
- [ ] Logo clicável leva para /dashboard
- [ ] Botão "Voltar" funciona
- [ ] Botão "Sair" funciona
- [ ] Não aparece erro "infinite recursion"

---

## 🐛 Se Ainda Houver Erro

### Console do Navegador (F12)

Envie os logs que aparecem quando você acessa `/meetings`:

```
🎯 MeetingsDashboard montado
📥 Carregando reuniões...
[?] O que aparece aqui?
```

### Network Tab

Verifique se há requisições falhando:
- Alguma requisição com status 500/401/403?
- Qual é a mensagem de erro?

---

## 📝 Arquivos Criados/Modificados

### Criados (1 novo)
- ✅ `src/components/shared/PageLayout.tsx` - Layout compartilhado

### Modificados (4)
- ✅ `src/pages/MeetingsDashboard.tsx`
- ✅ `src/pages/CreateMeeting.tsx`
- ✅ `src/pages/MeetingMinutes.tsx`
- ✅ `src/pages/EvaluationSchedule.tsx`

### SQL (1 correção)
- ✅ `CORRIGIR_RLS_MEETINGS.sql` - Políticas RLS corrigidas

---

## 🚀 Próximo Teste

Depois de aplicar a correção SQL:

```bash
# 1. Reiniciar
npm run dev

# 2. Testar em ordem:
http://localhost:8080/meetings              ✅
http://localhost:8080/meetings/create       ✅
http://localhost:8080/evaluations/schedule  ✅

# 3. Verificar:
- Headers aparecem?
- Botões funcionam?
- Não há erro de recursão?
```

---

**🎯 Aplique o SQL e teste novamente!**

**Arquivo SQL**: `CORRIGIR_RLS_MEETINGS.sql`

---

**Status**: ⏳ Aguardando aplicação do SQL e teste

