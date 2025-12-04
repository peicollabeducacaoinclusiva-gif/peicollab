# ⚡ GUIA RÁPIDO: Importar CSV São Gonçalo

## 🎉 **NOVA FUNCIONALIDADE: CRIAÇÃO AUTOMÁTICA DE COORDENADORES!**

O sistema agora **cria automaticamente** os coordenadores que não existem durante a importação!

- ✅ Username = parte antes do @ do email
- ✅ Senha padrão: `PeiCollab@2025`
- ✅ Nome formatado automaticamente

---

## 📋 **CHECKLIST RÁPIDO**

### **1. Aplicar Migrações SQL** ✅
```sql
-- No Supabase SQL Editor, executar TODO o conteúdo de:

-- A) Migração principal
scripts/add_diagnosis_fields_and_import_logic.sql

-- B) Criação automática de coordenadores
scripts/add_auto_coordinator_creation.sql
```

**O que faz:**
- ✅ Cria tabela de importações
- ✅ Cria 8 templates de metas (BNCC)
- ✅ Cria funções de geração automática
- ✅ Cria funções de criação de coordenadores

---

### **2. Instalar Dependência** ✅
```bash
npm install @types/papaparse
```

---

### **3. Executar Importação** 🚀
```bash
npx ts-node scripts/import_csv_pei.ts PEIColaborativo-SGC-Respostasaoformulário1.csv
```

**Resultado Esperado:**
```
✅ 28-32 PEIs criados
🎯 ~80-90 metas geradas automaticamente
👥 ~11 coordenadores criados automaticamente
📋 Credenciais exibidas no relatório
```

---

## 🔍 **VERIFICAR RESULTADOS**

### **No Supabase:**

```sql
-- Ver último batch de importação
SELECT * FROM pei_import_batches 
ORDER BY created_at DESC LIMIT 1;

-- Ver PEIs criados recentemente
SELECT 
  p.id,
  s.name as student_name,
  jsonb_array_length(p.planning_data->'goals') as total_goals,
  p.created_at
FROM peis p
INNER JOIN students s ON s.id = p.student_id
WHERE p.created_at > NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC;

-- Ver templates de metas disponíveis
SELECT code, title, category, educational_stage
FROM pei_goal_templates
WHERE is_active = true
ORDER BY category, code;
```

---

## 📊 **ESTATÍSTICAS ESPERADAS**

**CSV de São Gonçalo:**
- 📄 Total de linhas: **32 alunos**
- 🏫 Escolas: **7 diferentes**
- 👥 Coordenadores: **11 diferentes**

**Resultado da Importação:**
- ✅ PEIs criados: **~28-32**
- 🎯 Metas geradas: **~80-90**
- 📋 Encaminhamentos: **~20-30**
- ⚡ Tempo: **~2-5 minutos**

**Detalhamento de Metas:**
- 📚 Acadêmicas (Leitura/Escrita/Matemática): **~50-60 (65%)**
- 🎯 Funcionais (Atenção/Coordenação/Autonomia): **~30-40 (35%)**
- 📏 Média por aluno: **2.5-3 metas**

---

## 👥 **COORDENADORES CRIADOS AUTOMATICAMENTE**

### **Como Funciona:**

```
Email no CSV: vi_garcia19@hotmail.com
     ↓
Username: vi_garcia19
Nome: Vi Garcia19
Senha: PeiCollab@2025
```

### **Credenciais Exibidas no Relatório:**

Ao final da importação, o sistema mostra:

```
╔══════════════════════════════════════════════════════════╗
║  👥 COORDENADORES CRIADOS                               ║
╚══════════════════════════════════════════════════════════╝

  Total de coordenadores novos: 11

  ⚙️  CREDENCIAIS DE ACESSO:

  1. 👤 Vi Garcia19
     📧 Email: vi_garcia19@hotmail.com
     🔑 Username: vi_garcia19
     🔒 Senha padrão: PeiCollab@2025

  ... (mais coordenadores)
  
  ⚠️  IMPORTANTE: Oriente os coordenadores a alterarem a senha!
```

**📋 Copie e compartilhe essas credenciais com os coordenadores!**

---

## ⚠️ **SE DER ERRO**

### **Erro: "Coordenador não encontrado"**
⚠️ **Este erro NÃO deve mais ocorrer!** O sistema cria coordenadores automaticamente.

Se ainda ocorrer, verifique:
```sql
-- Verificar se o email já existe
SELECT * FROM profiles WHERE email = 'email@exemplo.com';
```

### **Erro: "Escola não encontrada"**
```sql
-- Listar escolas
SELECT id, school_name FROM schools WHERE is_active = true;

-- Cadastrar escola (se necessário)
INSERT INTO schools (school_name, tenant_id, is_active)
VALUES ('NOME EXATO DA ESCOLA', 'seu-tenant-id', true);
```

### **Erro: "Cannot find module"**
```bash
npm install @types/papaparse
```

---

## 🎯 **APÓS IMPORTAÇÃO**

### **1. Revisar PEIs Criados**
- Acessar sistema como coordenador
- Verificar lista de PEIs
- Conferir metas geradas

### **2. Atribuir Professores**
- Cada PEI está em `draft` sem professor
- Coordenador deve atribuir professor responsável

### **3. Ajustar Metas (Opcional)**
- Metas foram geradas automaticamente
- Pode editar, adicionar ou remover conforme necessário

### **4. Revisar Encaminhamentos**
- Sistema sugere encaminhamentos baseados no diagnóstico
- Confirmar ou ajustar conforme realidade local

---

## 📞 **SUPORTE**

Consulte:
1. ✅ `GUIA_IMPORTACAO_CSV_COMPLETO.md` - Guia detalhado
2. ✅ `ANALISE_MAPEAMENTO_CSV_PEI.md` - Análise técnica
3. ✅ `src/types/pei.ts` - Interfaces TypeScript

---

**🚀 Pronto! Sistema preparado para importar São Gonçalo!**

