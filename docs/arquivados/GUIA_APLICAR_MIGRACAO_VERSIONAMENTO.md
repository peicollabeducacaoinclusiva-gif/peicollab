# 🔧 Guia: Aplicar Migração de Versionamento de PEIs

## Como aplicar a migração manualmente

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione o projeto **pei-collab**
3. Vá para a aba **SQL Editor** no menu lateral
4. Clique em **+ New Query**
5. Cole o conteúdo completo do arquivo:
   ```
   supabase/migrations/20250203000003_enforce_single_active_pei.sql
   ```
6. Clique em **Run** (ou pressione `Ctrl+Enter`)
7. Aguarde a execução (deve levar ~10 segundos)
8. Verifique os **NOTICES** no console para confirmar:
   ```
   NOTICE:  Sistema de versionamento configurado:
   NOTICE:    Total de PEIs no sistema: X
   NOTICE:    PEIs ativos (1 por aluno): Y
   NOTICE:    PEIs arquivados (versões antigas): Z
   ```

---

### Opção 2: Via psql (linha de comando)

```bash
# Conectar ao banco
psql "postgresql://postgres.fximylewmvsllkdczovj:2@34Jk56Lm78Pq!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

# Executar a migração
\i supabase/migrations/20250203000003_enforce_single_active_pei.sql

# Verificar resultados
SELECT 
  COUNT(*) as total_peis,
  COUNT(*) FILTER (WHERE is_active_version = true) as peis_ativos,
  COUNT(*) FILTER (WHERE is_active_version = false) as peis_arquivados
FROM peis;
```

---

### Opção 3: Via Supabase CLI (local)

```bash
# Aplicar todas as migrações pendentes
npx supabase db push

# OU aplicar manualmente
npx supabase db execute --file supabase/migrations/20250203000003_enforce_single_active_pei.sql
```

---

## Verificação Pós-Migração

### 1. Verificar se há duplicatas

Execute esta query no SQL Editor:

```sql
-- Verificar se existem alunos com múltiplos PEIs ativos
SELECT 
  student_id,
  COUNT(*) as total_peis_ativos
FROM peis
WHERE is_active_version = true
GROUP BY student_id
HAVING COUNT(*) > 1;
```

**Resultado esperado**: ✅ Nenhuma linha (tabela vazia)

---

### 2. Verificar estatísticas

```sql
-- Ver estatísticas de versionamento
SELECT 
  COUNT(DISTINCT student_id) as alunos_com_pei,
  COUNT(*) as total_peis,
  COUNT(*) FILTER (WHERE is_active_version = true) as peis_ativos,
  COUNT(*) FILTER (WHERE is_active_version = false) as peis_arquivados,
  AVG(version_number) as media_versoes
FROM peis;
```

**Resultado esperado**:
- `alunos_com_pei` = `peis_ativos` (1 PEI ativo por aluno)
- `peis_arquivados` ≥ 0 (versões antigas)

---

### 3. Ver versões de um aluno específico

```sql
-- Substituir 'uuid-do-aluno' pelo ID real
SELECT 
  id,
  version_number,
  status,
  is_active_version,
  created_at,
  updated_at
FROM peis
WHERE student_id = 'uuid-do-aluno'
ORDER BY version_number DESC;
```

**Resultado esperado**: 
- Apenas 1 linha com `is_active_version = true`
- Outras linhas (se existirem) com `is_active_version = false`

---

### 4. Testar a função de verificação

```sql
-- Verificar se aluno tem PEI ativo
SELECT has_active_pei('uuid-do-aluno');  -- Deve retornar true ou false

-- Obter PEI ativo de um aluno
SELECT * FROM get_active_pei('uuid-do-aluno');
```

---

### 5. Testar a view simplificada

```sql
-- Ver todos os PEIs ativos com dados relacionados
SELECT * FROM active_peis LIMIT 10;
```

---

## Rollback (se necessário)

Se algo der errado, você pode reverter com:

```sql
-- ATENÇÃO: Isso remove o sistema de versionamento!
DROP TRIGGER IF EXISTS ensure_single_active_pei_trigger ON peis;
DROP FUNCTION IF EXISTS ensure_single_active_pei() CASCADE;
DROP FUNCTION IF EXISTS has_active_pei(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_active_pei(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_new_pei_version(UUID, UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_next_pei_version_number(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_pei_change_summary(JSONB, JSONB) CASCADE;
DROP VIEW IF EXISTS active_peis CASCADE;

-- Marcar todos os PEIs como ativos (estado anterior)
UPDATE peis SET is_active_version = true;
```

---

## Problemas Comuns

### ❌ "relation 'peis' already exists"
- **Causa**: Migração já foi aplicada
- **Solução**: Pular este passo, a migração já está ativa

### ❌ "function already exists"
- **Causa**: Funções já foram criadas
- **Solução**: Execute `DROP FUNCTION IF EXISTS ...` antes ou use `CREATE OR REPLACE FUNCTION`

### ❌ "multiple rows returned"
- **Causa**: Ainda existem duplicatas
- **Solução**: Execute a query de limpeza manualmente:

```sql
DO $$
DECLARE
  v_student RECORD;
  v_latest_pei UUID;
BEGIN
  FOR v_student IN SELECT DISTINCT student_id FROM peis
  LOOP
    SELECT id INTO v_latest_pei
    FROM peis
    WHERE student_id = v_student.student_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    UPDATE peis SET is_active_version = false
    WHERE student_id = v_student.student_id;
    
    UPDATE peis SET is_active_version = true
    WHERE id = v_latest_pei;
  END LOOP;
END $$;
```

---

## Próximos Passos

Depois de aplicar a migração:

1. ✅ Reinicie o aplicativo frontend (`npm run dev`)
2. ✅ Teste criar um novo PEI para aluno que já tem
3. ✅ Verifique que o dashboard mostra apenas 1 PEI por aluno
4. ✅ Teste como coordenador solicitar PEI para aluno que já tem

---

## Suporte

- **Documentação completa**: `docs/SISTEMA_VERSIONAMENTO_PEI.md`
- **Arquivo de migração**: `supabase/migrations/20250203000003_enforce_single_active_pei.sql`
- **Logs da aplicação**: Console do navegador (F12)


