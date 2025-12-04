# 🎯 Aplicar Todas as Migrações AGORA (Guia Simplificado)

## ⚡ Execute Exatamente Nesta Ordem

No **Supabase Dashboard** → **SQL Editor**:

---

### ✅ **1. Profissional de Apoio**

```sql
supabase/migrations/20250108000001_support_professional.sql
```

---

### ✅ **2. Sistema de Reuniões**

```sql
supabase/migrations/20250108000002_meetings_system_FIXED.sql
```

---

### ⚠️ **3. Avaliações do PEI** (Limpar + Aplicar)

```sql
# Passo 3a: Limpar
LIMPAR_TOTAL_MIGRATION_3.sql

# Passo 3b: Aplicar
supabase/migrations/20250108000003_pei_evaluation_CLEAN.sql
```

---

### ⚠️ **4. Plano de AEE** (Limpar + Aplicar)

```sql
# Passo 4a: Limpar
LIMPAR_MIGRATION_4.sql

# Passo 4b: Aplicar
supabase/migrations/20250108000004_plano_aee_CLEAN.sql
```

---

### ⚠️ **5. Blog** (Limpar + Aplicar - Opcional)

```sql
# Passo 5a: Limpar
LIMPAR_MIGRATION_5.sql

# Passo 5b: Aplicar
supabase/migrations/20250108000005_blog_CLEAN.sql
```

---

### ⚠️ **6. Gestão Escolar** (Aplicar - Limpar se der erro)

```sql
# Tente aplicar direto:
supabase/migrations/20250108000006_gestao_escolar_CLEAN.sql

# Se der erro de policy já existente:
LIMPAR_MIGRATION_6.sql
# E depois:
supabase/migrations/20250108000006_gestao_escolar_CLEAN.sql
```

---

## ✅ Verificação Final

Depois de tudo, execute:

```sql
-- Contar tabelas criadas (deve retornar 18)
SELECT COUNT(*) AS total
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'support_professional_students',
    'support_professional_feedbacks',
    'pei_meetings',
    'pei_meeting_participants',
    'pei_meeting_peis',
    'pei_evaluations',
    'evaluation_schedules',
    'plano_aee',
    'plano_aee_comments',
    'plano_aee_attachments',
    'blog_categories',
    'blog_posts',
    'blog_comments',
    'blog_post_likes',
    'blog_post_views',
    'professionals',
    'classes',
    'subjects',
    'class_subjects'
);
```

**Resultado esperado**: 18 ou 19 tabelas criadas

---

## 🎉 Pronto!

Depois de aplicar tudo:

```bash
# Rodar os apps
pnpm dev
```

**Acessar:**
- Gestão Escolar: http://localhost:5174
- Plano de AEE: http://localhost:5175
- PEI Collab: http://localhost:8080

---

**Última atualização**: 08 de Janeiro de 2025

