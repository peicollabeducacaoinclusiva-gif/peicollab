## 📥 GUIA COMPLETO: Importação CSV → PEIs Automáticos

**Sistema PEI Colaborativo - São Gonçalo do Amarante/CE**

---

## 🎯 **O QUE FOI IMPLEMENTADO**

### ✅ **1. Ajustes no Banco de Dados**

- ✅ Aproveitamento da tabela `student_enrollments` (já tinha série, turma, turno!)
- ✅ Novos campos em `diagnosis_data` (JSONB - não precisa migração SQL):
  - `aversions` - Desinteresses/Aversão
  - `abilities` - O que já consegue fazer
  - `barriersComments` - Comentários sobre barreiras
- ✅ Nova tabela `pei_import_batches` - Rastreamento de importações
- ✅ Nova tabela `pei_goal_templates` - Templates de metas baseados em BNCC

### ✅ **2. Funções SQL Inteligentes**

| Função | Descrição |
|--------|-----------|
| `generate_goals_from_diagnosis()` | Gera metas automaticamente baseadas em BNCC + série |
| `generate_referrals_from_diagnosis()` | Sugere encaminhamentos (Fono, Psico, T.O., etc) |
| `transform_csv_barriers()` | Transforma 6 colunas CSV → array JSON |
| `import_pei_from_csv_row()` | Importa linha completa do CSV |

### ✅ **3. Templates de Metas (BNCC)**

**8 templates prontos:**

| Código | Área | Descrição |
|--------|------|-----------|
| `BNCC-LP-01` | Linguagens | Desenvolver habilidades de leitura |
| `BNCC-LP-02` | Linguagens | Aprimorar habilidades de escrita |
| `BNCC-MAT-01` | Matemática | Reconhecer e operar com números |
| `BNCC-MAT-02` | Matemática | Raciocínio lógico-matemático |
| `FUNC-CM-01` | Funcional | Coordenação motora fina |
| `FUNC-AT-01` | Funcional | Atenção e concentração |
| `FUNC-AU-01` | Funcional | Autonomia nas atividades |
| `FUNC-SO-01` | Funcional | Socialização e comunicação |

**Keywords de Detecção Automática:**

```
"leitura" → Meta de leitura
"escrita" → Meta de escrita
"matemática" → Meta de matemática
"atenção" → Meta de atenção/concentração
"coordenação motora" → Meta de coordenação
"autonomia" → Meta de autonomia
"socialização" → Meta de socialização
```

### ✅ **4. Geração Automática de Encaminhamentos**

**Baseado em palavras-chave:**

| Palavra-chave | Encaminhamento Sugerido |
|---------------|------------------------|
| fala, comunicação, linguagem | 🗣️ Fonoaudiologia |
| emocional, comportamento, ansiedade | 🧠 Psicologia |
| coordenação motora, sensorial | 👐 Terapia Ocupacional |
| atenção, concentração, hiperatividade | 🩺 Neurologia/Neuropediatria |
| leitura, escrita, matemática | 📚 AEE (Sala de Recursos) |
| barreiras comunicacionais | 💬 Avaliação para CAA |

### ✅ **5. Script de Importação TypeScript**

**Arquivo:** `scripts/import_csv_pei.ts`

**Recursos:**
- ✅ Validação de dados
- ✅ Busca inteligente de coordenadores e escolas
- ✅ Criação automática de alunos (se não existir)
- ✅ Criação de matrículas
- ✅ Geração de PEIs com metas e encaminhamentos
- ✅ Relatório detalhado em tempo real
- ✅ Rastreamento via `batch_id`

---

## 🚀 **COMO USAR**

### **PASSO 1: Aplicar Migração SQL**

```bash
# No Supabase SQL Editor, executar:
scripts/add_diagnosis_fields_and_import_logic.sql
```

**Isso vai:**
1. Criar tabela de importações (`pei_import_batches`)
2. Criar tabela de templates de metas (`pei_goal_templates`)
3. Popular 8 templates baseados em BNCC
4. Criar todas as funções de geração automática

---

### **PASSO 2: Instalar Dependências**

```bash
# No terminal do projeto:
npm install papaparse
npm install --save-dev @types/papaparse
```

---

### **PASSO 3: Configurar Variáveis de Ambiente**

Criar arquivo `.env.local` (se não existe):

```env
VITE_SUPABASE_URL=https://sua-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:** Use `SUPABASE_SERVICE_ROLE_KEY` (não a chave anônima)

---

### **PASSO 4: Executar Importação**

```bash
# Sintaxe:
npx ts-node scripts/import_csv_pei.ts <caminho-do-csv>

# Exemplo:
npx ts-node scripts/import_csv_pei.ts PEIColaborativo-SGC-Respostasaoformulário1.csv
```

---

## 📊 **SAÍDA DO SCRIPT**

### **Durante a Execução:**

```
╔══════════════════════════════════════════════════════════╗
║  📥 IMPORTAÇÃO CSV → PEIs                               ║
║  São Gonçalo do Amarante - CE                           ║
╚══════════════════════════════════════════════════════════╝

📂 Arquivo: PEIColaborativo-SGC-Respostasaoformulário1.csv
📊 Total de linhas: 32

✅ Batch criado: abc-123-...

🔄 Processando...

  [1/32] Josué Gonçalves de Oliveira              ... ✅ OK (3 metas geradas)
  [2/32] João Carlos Bispo                        ... ✅ OK (3 metas geradas)
  [3/32] Ronald Xavier Queiroz                    ... ✅ OK (4 metas geradas)
  [4/32] Alberto Ferreira Porto Neto              ... ✅ OK (2 metas geradas)
  ...
```

### **Relatório Final:**

```
╔══════════════════════════════════════════════════════════╗
║  📊 RELATÓRIO FINAL                                     ║
╚══════════════════════════════════════════════════════════╝

  Total processados: 32
  ✅ Sucesso:        28
  ❌ Erros:          4
  ⚠️  Avisos:         0

  🎯 Metas geradas:  84
  📈 Média por PEI:  3.0

✅ Importação concluída!

📝 Batch ID: abc-123-def-456...
   Use este ID para consultar detalhes no sistema.
```

---

## 🔍 **EXEMPLO DE TRANSFORMAÇÃO**

### **Entrada (CSV):**

```csv
vi_garcia19@hotmail.com,
ESCOLA MUNICIPAL MANOEL FRANCISCO DE OLIVEIRA,
João Carlos Bispo,
3° ano,
Matutino,
"A família demonstra carinho...",
"João apresenta grande interesse por jogos, animais e cores",
"reage quando se sente provocado",
"João consegue escrever seu primeiro nome, reconhece algumas letras",
"leitura, escrita e coordenação motora",
Nenhum,Nenhum,Nenhum,Nenhum,Nenhum,Nenhum,
""
```

### **Saída (PEI Criado):**

#### **Student:**
```json
{
  "name": "João Carlos Bispo",
  "school_id": "escola-manoel-id"
}
```

#### **Student Enrollment:**
```json
{
  "academic_year": 2025,
  "grade": "3° ano",
  "class_name": "3",
  "shift": "Matutino",
  "status": "active"
}
```

#### **PEI - Diagnosis Data:**
```json
{
  "history": "A família demonstra carinho...",
  "interests": "Jogos, animais e cores",
  "aversions": "Reage quando se sente provocado",
  "abilities": "Escreve primeiro nome, reconhece letras",
  "specialNeeds": "Leitura, escrita e coordenação motora",
  "barriers": [],
  "barriersComments": ""
}
```

#### **PEI - Planning Data (Gerado Automaticamente!):**
```json
{
  "goals": [
    {
      "description": "Desenvolver habilidades de leitura e decodificação",
      "category": "academic",
      "bncc_code": "BNCC-LP-01",
      "target_date": "2026-02-05",
      "progress_level": "não iniciada",
      "strategies": [
        "Leitura compartilhada com mediação do professor",
        "Utilização de textos adaptados ao nível de leitura",
        "Jogos de formação e reconhecimento de palavras",
        "Uso de jogos, animais e cores para aumentar engajamento"
      ]
    },
    {
      "description": "Aprimorar habilidades de escrita",
      "category": "academic",
      "bncc_code": "BNCC-LP-02",
      "target_date": "2026-02-05",
      "strategies": [
        "Tracejados preparatórios e caligrafia guiada",
        "Escrita de palavras significativas",
        "Produção de frases com apoio visual",
        "Uso de jogos, animais e cores para aumentar engajamento"
      ]
    },
    {
      "description": "Desenvolver coordenação motora fina",
      "category": "functional",
      "bncc_code": "FUNC-CM-01",
      "target_date": "2026-03-05",
      "strategies": [
        "Massinha e argila para modelagem",
        "Recorte e colagem progressivos",
        "Jogos de encaixe e manipulação",
        "Uso de jogos, animais e cores para aumentar engajamento"
      ]
    }
  ],
  "referrals": [
    {
      "service": "Atendimento Educacional Especializado (AEE)",
      "reason": "Necessidade de apoio pedagógico especializado",
      "priority": "alta",
      "status": "pendente"
    }
  ]
}
```

**✨ Resultado:** PEI completo criado automaticamente com **3 metas** e **1 encaminhamento**!

---

## ⚙️ **DETALHES TÉCNICOS**

### **Como Funciona a Geração de Metas:**

1. **Análise de Keywords:** Sistema procura palavras-chave em `specialNeeds`
2. **Busca de Templates:** Encontra templates que batem com as keywords
3. **Filtro por Série:** Seleciona apenas templates compatíveis com a série do aluno
4. **Personalização:** Adiciona interesses do aluno nas estratégias
5. **Limite:** Máximo 5 metas por PEI

**Exemplo:**

```
specialNeeds: "leitura, atenção, organização"
grade: "3º ano"
interests: "jogos e cores"

↓ PROCESSAMENTO ↓

Keywords detectadas: ["leitura", "atenção", "organização"]

Templates encontrados:
  1. BNCC-LP-01 (leitura) → ✅ Compatível com 3º ano
  2. FUNC-AT-01 (atenção) → ✅ Compatível com todos
  3. FUNC-AU-01 (organização/autonomia) → ✅ Compatível

Estratégias personalizadas:
  + "Uso de jogos e cores para aumentar engajamento"

↓ RESULTADO ↓

3 metas geradas com estratégias adaptadas!
```

---

## 📂 **ARQUIVOS CRIADOS/MODIFICADOS**

### **SQL:**
- ✅ `scripts/add_diagnosis_fields_and_import_logic.sql` - Migração completa

### **TypeScript:**
- ✅ `scripts/import_csv_pei.ts` - Script de importação
- ✅ `src/types/pei.ts` - Interfaces atualizadas

### **Documentação:**
- ✅ `GUIA_IMPORTACAO_CSV_COMPLETO.md` - Este arquivo
- ✅ `ANALISE_MAPEAMENTO_CSV_PEI.md` - Análise técnica detalhada

---

## 🎯 **PRÓXIMOS PASSOS**

### **1. AGORA (Preparação):**

- [ ] Executar migração SQL no Supabase
- [ ] Instalar dependências (`papaparse`)
- [ ] Configurar `.env.local`

### **2. TESTE (Subset):**

```bash
# Criar CSV de teste com 3-5 alunos
# Executar importação
npx ts-node scripts/import_csv_pei.ts teste_3alunos.csv

# Verificar no sistema:
# - Alunos criados
# - Matrículas criadas
# - PEIs gerados
# - Metas criadas
# - Encaminhamentos sugeridos
```

### **3. PRODUÇÃO (32 alunos):**

```bash
# Executar importação completa
npx ts-node scripts/import_csv_pei.ts PEIColaborativo-SGC-Respostasaoformulário1.csv

# Revisar PEIs criados
# Atribuir professores
# Ajustar metas conforme necessário
```

### **4. FUTURO (Interface Web):**

- [ ] Criar página de importação no sistema
- [ ] Upload de CSV via drag-and-drop
- [ ] Preview e validação visual
- [ ] Mapeamento interativo de escolas
- [ ] Edição de metas antes de salvar

---

## ❓ **FAQ**

### **P: E se um aluno já existir?**
R: O sistema usa o aluno existente e cria novo PEI (versão 1).

### **P: E se a escola não for encontrada?**
R: Retorna erro. Precisa cadastrar escola primeiro.

### **P: E se o coordenador não existir?**
R: Retorna erro. Precisa cadastrar coordenador primeiro.

### **P: Posso rodar várias vezes?**
R: Sim, mas cada execução cria novos PEIs (não atualiza existentes).

### **P: Como desfazer uma importação?**
R: Use o `batch_id` para identificar PEIs criados e excluir manualmente.

### **P: Posso ajustar os templates de metas?**
R: Sim! Edite a tabela `pei_goal_templates` via SQL.

### **P: Como adicionar mais templates?**
R: INSERT na tabela `pei_goal_templates` seguindo a estrutura.

### **P: As estratégias são sempre as mesmas?**
R: Não! Sistema adiciona interesses do aluno nas estratégias.

---

## 🆘 **RESOLUÇÃO DE PROBLEMAS**

### **Erro: "Coordenador não encontrado"**

```sql
-- Verificar coordenadores cadastrados:
SELECT email, full_name 
FROM profiles 
WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'coordinator');
```

### **Erro: "Escola não encontrada"**

```sql
-- Listar escolas:
SELECT id, school_name FROM schools WHERE is_active = true;

-- Cadastrar escola (se necessário):
INSERT INTO schools (school_name, tenant_id, is_active)
VALUES ('ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA', 'seu-tenant-id', true);
```

### **Erro: "Cannot find module 'papaparse'"**

```bash
npm install papaparse @types/papaparse
```

### **Nenhuma meta foi gerada**

- Verifique se templates foram populados:

```sql
SELECT COUNT(*) FROM pei_goal_templates WHERE is_active = true;
-- Deve retornar 8
```

---

## 📞 **CONTATO E SUPORTE**

Para dúvidas ou problemas:
1. Consulte este guia
2. Verifique `ANALISE_MAPEAMENTO_CSV_PEI.md`
3. Revise logs do script
4. Consulte tabela `pei_import_batches`

---

**✅ Sistema pronto para importar 32 alunos de São Gonçalo!**

**🚀 Boa importação!**




