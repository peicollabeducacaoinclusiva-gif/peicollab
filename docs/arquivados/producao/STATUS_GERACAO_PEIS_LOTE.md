# 📊 Status: Geração de PEIs em Lote

**Data:** 06/11/2024  
**Status:** ⏸️ **AGUARDANDO DADOS NO BANCO**

---

## 🔍 Diagnóstico Realizado

Executei um diagnóstico completo do banco de dados:

```
═══════════════════════════════════════════════════
📊 ESTADO ATUAL DO BANCO
═══════════════════════════════════════════════════
✅ Redes (tenants): 0
✅ Escolas (schools): 0
✅ Alunos (students): 0
✅ PEIs (todos): 0
✅ PEIs (ativos): 0
✅ Usuários (profiles): 0
✅ Roles (user_roles): 20 ✔️
═══════════════════════════════════════════════════
```

### **Conclusão:**
O banco de dados está **estruturado** (tabelas existem e RLS funciona), mas ainda **não tem dados** cadastrados de:
- Redes de ensino
- Escolas
- Alunos
- PEIs

---

## ✅ Scripts Prontos (Já Criados)

Todos os scripts estão prontos para uso quando você tiver dados:

### **1. `npm run check:database`**
**Arquivo:** `scripts/diagnostico-banco.js`

Diagnóstico completo do banco:
- Conta registros em todas as tabelas
- Lista exemplos de cada tipo
- Identifica problemas de RLS
- Mostra resumo consolidado

**Quando usar:** Sempre que quiser ver o estado do banco

---

### **2. `npm run list:networks`**
**Arquivo:** `scripts/listar-redes.js`

Lista todas as redes cadastradas com:
- Nome da rede
- ID do tenant
- Email de contato
- Escolas vinculadas
- Quantidade de PEIs por escola
- Status dos PEIs (draft, pending, approved, etc.)

**Quando usar:** Para ver quais redes existem e escolher qual processar

---

### **3. `npm run generate:all-peis-pdf`**
**Arquivo:** `scripts/gerar-peis-todos.js`

Gera PDFs de **TODOS** os PEIs do banco:
- ✅ Busca todos os PEIs ativos
- ✅ Gera planejamento com IA (se necessário)
- ✅ Cria PDF com cabeçalho institucional
- ✅ Salva em pasta organizada
- ✅ Relatório detalhado de execução

**Quando usar:** Para gerar PDFs de todos os PEIs de uma vez

---

### **4. `npm run generate:peis-pdf`**
**Arquivo:** `scripts/gerar-peis-em-lote.js`

Gera PDFs de uma **rede específica**:
- Filtra por nome da rede
- Processa apenas escolas daquela rede
- Mesmo que o script anterior, mas filtrado

**Quando usar:** Quando tiver múltiplas redes e quiser processar apenas uma

---

## 🚀 Próximos Passos

### **Opção A: Popular o Banco com Dados Reais**

1. **Acessar o sistema web** (http://localhost:8080)
2. **Login como superadmin** ou education_secretary
3. **Criar:**
   - Rede "São Gonçalo dos Campos"
   - Escolas vinculadas à rede
   - Alunos nas escolas
   - PEIs para os alunos

4. **Executar script:**
```bash
npm run generate:all-peis-pdf
```

---

### **Opção B: Popular com Dados de Teste via SQL**

Vou criar um script SQL para você:

```sql
-- =====================================================
-- DADOS DE TESTE: São Gonçalo dos Campos
-- =====================================================

-- 1. Criar Rede
INSERT INTO tenants (id, network_name, network_address, network_email, is_active)
VALUES (
  gen_random_uuid(),
  'Rede Municipal de São Gonçalo dos Campos',
  'Rua da Educação, 123',
  'educacao@saogoncalo.sp.gov.br',
  true
) RETURNING id;

-- Copie o ID retornado e use nas próximas queries

-- 2. Criar Escola
INSERT INTO schools (id, tenant_id, school_name, school_address, is_active)
VALUES (
  gen_random_uuid(),
  '<cole_o_id_do_tenant_aqui>',
  'EMEF Professor João Silva',
  'Rua das Flores, 456',
  true
) RETURNING id;

-- 3. Criar Alunos
INSERT INTO students (tenant_id, school_id, name, date_of_birth, class_name, is_active)
VALUES 
  ('<tenant_id>', '<school_id>', 'João Pedro Santos', '2015-05-10', '3º Ano A', true),
  ('<tenant_id>', '<school_id>', 'Maria Eduarda Silva', '2014-08-22', '4º Ano B', true),
  ('<tenant_id>', '<school_id>', 'Lucas Gabriel Oliveira', '2016-03-15', '2º Ano A', true)
RETURNING id, name;

-- 4. Criar PEIs (use os IDs dos alunos)
INSERT INTO peis (
  student_id, 
  school_id, 
  tenant_id, 
  status, 
  is_active_version,
  diagnosis_data,
  planning_data
)
VALUES (
  '<student_id_1>',
  '<school_id>',
  '<tenant_id>',
  'approved',
  true,
  '{"specialNeeds": "TEA nível 1", "interests": "Dinossauros e blocos de montar"}'::jsonb,
  '{"goals": []}'::jsonb
);
```

---

### **Opção C: Usar Dados de Produção**

Se você já tem dados em **produção** (Vercel):

1. **Fazer backup do banco de produção:**
```bash
# No Supabase Dashboard de produção
# SQL Editor → Copiar dados importantes
```

2. **Importar para local:**
```bash
# Copiar dados via SQL queries
```

3. **Executar scripts de geração**

---

## 📁 Estrutura Quando Executar

Quando você tiver dados e executar `npm run generate:all-peis-pdf`:

```
pei-collab/
  └── peis-gerados/
       ├── PEI_joao_pedro_santos_abc12345.pdf
       ├── PEI_maria_eduarda_silva_def45678.pdf
       ├── PEI_lucas_gabriel_oliveira_ghi91011.pdf
       └── ...
```

### **Cada PDF conterá:**
```
═══════════════════════════════════════════════════
    REDE MUNICIPAL DE SÃO GONÇALO DOS CAMPOS
  Secretaria de Educação - Setor Educação Inclusiva
       EMEF Professor João Silva

         PLANO EDUCACIONAL INDIVIDUALIZADO

1. IDENTIFICAÇÃO DO ALUNO
   Nome: João Pedro Santos
   Data de Nascimento: 10/05/2015
   Turma: 3º Ano A
   ...

2. DIAGNÓSTICO
   Necessidades: TEA nível 1...
   Interesses: Dinossauros...

3. PLANEJAMENTO - METAS E ESTRATÉGIAS

   Meta 1: [Gerada com IA]
   Tipo: Acadêmica | BNCC: EF15LP03
   Fundamentação: [Baseada em evidências]
   
   Estratégias:
   • [Estratégia detalhada 1]
   • [Estratégia detalhada 2]
   • [Estratégia detalhada 3]
   
   Avaliação: [Critérios mensuráveis]
   Recursos: [Tecnologias assistivas]
   Equipe: [Papéis definidos]
   
   Meta 2: [...]
   ...
═══════════════════════════════════════════════════
```

---

## 🤖 Geração com IA

### **O script vai:**

1. ✅ Buscar todos os PEIs ativos
2. ✅ Para cada PEI:
   - Verificar se tem planejamento
   - Se NÃO: Gerar com IA usando o novo prompt melhorado
   - Se SIM: Usar planejamento existente
3. ✅ Gerar PDF com:
   - Cabeçalho institucional
   - Diagnóstico completo
   - Metas detalhadas (com DUA, BNCC, AEE)
   - Estratégias baseadas em evidências
4. ✅ Salvar na pasta `peis-gerados/`

### **Melhorias da IA:**
- 🔬 Fundamentação teórica em cada meta
- 📚 Códigos BNCC citados (metas acadêmicas)
- 🎯 Objetivos AEE (metas funcionais)
- 🎨 Princípios DUA aplicados
- 📋 Estratégias detalhadas (3-4 por meta)
- 📊 Critérios mensuráveis com níveis
- 🛠️ Recursos específicos listados
- 👥 Papéis da equipe definidos

---

## 📞 Quando Estiver Pronto

### **Avisar que tem dados:**
1. Execute: `npm run check:database`
2. Verifique se há:
   - Alunos: > 0
   - PEIs: > 0
3. Se sim, execute: `npm run generate:all-peis-pdf`

### **Ver o resultado:**
```bash
cd peis-gerados
ls -la
```

Ou abra a pasta `peis-gerados` no Windows Explorer.

---

## ✅ Checklist

Scripts criados e prontos:
- [x] ✅ `check:database` - Diagnóstico do banco
- [x] ✅ `list:networks` - Listar redes
- [x] ✅ `generate:all-peis-pdf` - Gerar todos os PDFs
- [x] ✅ `generate:peis-pdf` - Gerar PDFs de rede específica
- [x] ✅ Prompt IA melhorado (DUA, BNCC, AEE, evidências)
- [x] ✅ Cabeçalho institucional implementado
- [x] ✅ Documentação completa

Aguardando:
- [ ] ⏸️ Dados cadastrados no banco
- [ ] ⏸️ Executar geração de PDFs
- [ ] ⏸️ Validar qualidade dos PDFs gerados

---

**🎉 Tudo pronto! Só falta popular o banco com dados!**

Quando tiver alunos e PEIs cadastrados, é só executar:
```bash
npm run generate:all-peis-pdf
```

E todos os PDFs serão gerados automaticamente com IA, DUA, BNCC e AEE! 🚀

---

**Data:** 06/11/2024  
**Versão:** 1.0  
**Arquivo:** STATUS_GERACAO_PEIS_LOTE.md

