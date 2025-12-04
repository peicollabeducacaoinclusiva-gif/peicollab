# ⚡ EXECUTAR AGORA: 3 Passos Para Importação

## 🎯 **RESUMO**

Sistema pronto! Faltam apenas **3 comandos SQL** e depois rodar o script.

---

## 📋 **PASSO 1: Adicionar coluna email**

No Supabase SQL Editor:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id;
```

**Tempo:** ~5 segundos

---

## 📋 **PASSO 2: Re-criar função com normalização**

No Supabase SQL Editor:

```sql
-- Dropar função antiga
DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;
```

Depois copie e cole **TODO o conteúdo** de:
```sql
scripts/add_auto_coordinator_creation.sql
```

**Tempo:** ~10 segundos

**O que faz:** Normaliza "ESCOLA MUN" → "ESCOLA MUNICIPAL" automaticamente

---

## 📋 **PASSO 3: Cadastrar escolas**

No Supabase SQL Editor, execute **TODO o conteúdo** de:

```sql
scripts/cadastrar_escolas_sao_goncalo.sql
```

**Tempo:** ~5 segundos

**O que faz:** Cadastra 7 escolas:
1. ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA
2. ESCOLA MUNICIPAL MANOEL FRANCISCO DE OLIVEIRA  
3. ESCOLA MUNICIPAL DEPUTADO NÓIDE CERQUEIRA
4. ESCOLA MUNICIPAL FRANCISCO JOSÉ DA SILVA
5. ESCOLA MUNICIPAL PEDRO MOURA ✅ (nome correto)
6. CRECHE ESCOLA TIA MARIA ANTÔNIA FALCÃO
7. ESCOLA MUNICIPAL PROFESSORA FELICÍSSIMA GUIMARÃES PINTO

---

## 🚀 **DEPOIS: Rodar Importação**

```bash
node scripts/import_csv_pei.js PEIColaborativo-SGC-Respostasaoformulário1.csv
```

**Resultado esperado:**
```
╔══════════════════════════════════════════════════════════╗
║  📊 RELATÓRIO FINAL                                     ║
╚══════════════════════════════════════════════════════════╝

  Total processados: 29
  ✅ Sucesso:        28-29
  ❌ Erros:          0-1
  
  🎯 Metas geradas:  80-90
  📈 Média por PEI:  2.8-3.0
```

---

## ✅ **VERIFICAÇÃO**

Após os 3 SQLs, verifique:

```sql
-- 1. Profiles tem email?
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'email';
-- Deve retornar: 1

-- 2. Escolas cadastradas?
SELECT COUNT(*) FROM schools WHERE school_name LIKE '%MUNICIPAL%';
-- Deve retornar: 7 ou mais

-- 3. Função atualizada?
SELECT pronargs FROM pg_proc WHERE proname = 'import_pei_from_csv_row';
-- Deve retornar: 19
```

---

## 📞 **EM CASO DE DÚVIDA**

- `INSTRUCOES_FINAIS_IMPORTACAO.md` - Este arquivo
- `CORRIGIR_IMPORTACAO_URGENTE.md` - Diagnóstico completo
- `CONFIGURAR_ENV_IMPORTACAO.md` - Config de ambiente

---

**🎯 Execute os 3 passos SQL e depois rode o script!**

