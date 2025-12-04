# 🔍 ANÁLISE: Mapeamento CSV → Estrutura PEI

## 📋 **RESUMO EXECUTIVO**

**Situação:** O formulário de São Gonçalo tem **18 campos**, mas a estrutura atual do PEI suporta apenas **12 deles** diretamente.

**Problemas Identificados:**
- ❌ **3 campos NOVOS** precisam ser criados no banco
- ⚠️ **2 campos** precisam ser aglutinados/transformados
- ⚠️ **1 campo** tem estrutura incompatível (barreiras)
- ✅ **12 campos** já mapeiam perfeitamente

**Ação Necessária:** Ajustar estrutura do banco + lógica de importação

---

## 📊 **MAPEAMENTO COMPLETO**

### **SEÇÃO 1: METADADOS DO FORMULÁRIO**

| Campo CSV | Tipo | Destino no Sistema | Status | Ação |
|-----------|------|-------------------|--------|------|
| **Carimbo de data/hora** | Timestamp | Metadata (não salvar no PEI) | ✅ OK | Usar para log de importação |
| **Endereço de e-mail** | Email | `peis.created_by` (buscar coordinator_id) | ✅ OK | Lookup na tabela `profiles` |

---

### **SEÇÃO 2: DADOS DA ESCOLA E ALUNO**

| Campo CSV | Tipo | Destino no Sistema | Status | Ação |
|-----------|------|-------------------|--------|------|
| **ESCOLA REGULAR** | Texto | `students.school_id` + `peis.school_id` | ✅ OK | Lookup na tabela `schools` |
| **Nome do Estudante** | Texto | `students.name` | ✅ OK | Direto |
| **Série/Ano Escolar** | Texto | `students.grade` | ❌ **CRIAR** | Adicionar coluna `grade` |
| **Turno** | Texto | `students.shift` | ❌ **CRIAR** | Adicionar coluna `shift` |

**🔧 SQL Necessária:**
```sql
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS grade VARCHAR(50),
  ADD COLUMN IF NOT EXISTS shift VARCHAR(20);
  
COMMENT ON COLUMN students.grade IS 'Série/Ano escolar (ex: 3° ano, Grupo 5)';
COMMENT ON COLUMN students.shift IS 'Turno (Matutino/Vespertino)';
```

---

### **SEÇÃO 3: DIAGNÓSTICO (diagnosis_data)**

#### **Estrutura Atual:**
```typescript
interface DiagnosisData {
  interests: string        // ✅ Existe
  specialNeeds: string     // ✅ Existe
  barriers: Barrier[]      // ⚠️ Estrutura diferente
  history: string          // ✅ Existe
  cid10?: string          // ✅ Existe (opcional)
  description?: string    // ✅ Existe (opcional)
}
```

#### **Mapeamento:**

| Campo CSV | Destino | Status | Observação |
|-----------|---------|--------|------------|
| **Histórico resumido** | `diagnosis_data.history` | ✅ OK | Texto longo |
| **Interesses / Hiperfoco** | `diagnosis_data.interests` | ✅ OK | Direto |
| **Desinteresses / Aversão** | `diagnosis_data.aversions` | ❌ **CRIAR** | Novo campo |
| **O que já consegue fazer** | `diagnosis_data.abilities` | ❌ **CRIAR** | Novo campo |
| **O que precisa de ajuda** | `diagnosis_data.specialNeeds` | ✅ OK | Direto |
| **Barreiras [6 colunas]** | `diagnosis_data.barriers[]` | ⚠️ **AJUSTAR** | Ver detalhes abaixo |
| **Comentários barreiras** | `diagnosis_data.barriersComments` | ❌ **CRIAR** | Novo campo |

**🔧 Estrutura Atualizada Necessária:**
```typescript
interface DiagnosisData {
  history: string              // ✅ Já existe
  interests: string            // ✅ Já existe
  aversions: string            // ❌ CRIAR NOVO
  abilities: string            // ❌ CRIAR NOVO
  specialNeeds: string         // ✅ Já existe
  barriers: Barrier[]          // ⚠️ Ajustar estrutura
  barriersComments: string     // ❌ CRIAR NOVO
  cid10?: string              // ✅ Já existe
  description?: string        // ✅ Já existe
}
```

---

### **SEÇÃO 4: BARREIRAS - PROBLEMA ESTRUTURAL**

#### **Estrutura Atual do Sistema:**
```typescript
interface Barrier {
  id?: string
  description: string
  severity?: 'leve' | 'moderada' | 'severa'
}

// Exemplo atual:
barriers: [
  { description: "Barreira pedagógica", severity: "moderada" }
]
```

#### **Estrutura do CSV (6 colunas separadas):**
```
Barreiras [🏗️ Arquitetônicas] → Nenhum/Pouco/Moderado/Alto
Barreiras [💬 Comunicacionais] → Nenhum/Pouco/Moderado/Alto
Barreiras [🤝 Atitudinais] → Nenhum/Pouco/Moderado/Alto
Barreiras [💻 Tecnológicas] → Nenhum/Pouco/Moderado/Alto
Barreiras [📚 Pedagógicas] → Nenhum/Pouco/Moderado/Alto
Barreiras [⚙️ Outras] → Nenhum/Pouco/Moderado/Alto
```

#### **🔧 SOLUÇÃO 1: Transformar CSV → Estrutura Atual (RECOMENDADA)**

```typescript
// Lógica de importação:
function parseBarriers(csvRow: any): Barrier[] {
  const barriers: Barrier[] = []
  
  const barrierMapping = {
    'arquitetonicas': csvRow['Barreiras [🏗️ Arquitetônicas]'],
    'comunicacionais': csvRow['Barreiras [💬 Comunicacionais]'],
    'atitudinais': csvRow['Barreiras [🤝 Atitudinais]'],
    'tecnologicas': csvRow['Barreiras [💻 Tecnológicas]'],
    'pedagogicas': csvRow['Barreiras [📚 Pedagógicas]'],
    'outras': csvRow['Barreiras [⚙️ Outras]']
  }
  
  // Mapeamento de nível CSV → severity
  const severityMap = {
    'Nenhum': null,      // Não adiciona
    'Pouco': 'leve',
    'Moderado': 'moderada',
    'Alto': 'severa'
  }
  
  for (const [type, level] of Object.entries(barrierMapping)) {
    if (level && level !== 'Nenhum') {
      barriers.push({
        description: `Barreira ${type}`,
        severity: severityMap[level]
      })
    }
  }
  
  return barriers
}
```

**Exemplo Real:**
```csv
CSV: Alto, Nenhum, Nenhum, Alto, Moderado, Moderado
     ↓
barriers: [
  { description: "Barreira arquitetônica", severity: "severa" },
  { description: "Barreira tecnológica", severity: "severa" },
  { description: "Barreira pedagógica", severity: "moderada" },
  { description: "Barreira outras", severity: "moderada" }
]
```

#### **🔧 SOLUÇÃO 2: Mudar Estrutura do Banco (NÃO RECOMENDADO)**

```typescript
// Mudaria a estrutura TODA do sistema - muito trabalho!
interface Barrier {
  architectural: 'none' | 'low' | 'moderate' | 'high'
  communicational: 'none' | 'low' | 'moderate' | 'high'
  attitudinal: 'none' | 'low' | 'moderate' | 'high'
  technological: 'none' | 'low' | 'moderate' | 'high'
  pedagogical: 'none' | 'low' | 'moderate' | 'high'
  other: 'none' | 'low' | 'moderate' | 'high'
}
```

**❌ Por que não fazer:**
- Quebraria todo o código existente
- Frontend teria que ser reescrito
- Perderíamos flexibilidade (não pode adicionar barreiras customizadas)

**✅ Por que usar Solução 1:**
- Compatível com estrutura atual
- Não quebra nada
- Importação transparente

---

### **SEÇÃO 5: PLANEJAMENTO (planning_data)**

#### **Estrutura Atual:**
```typescript
interface PlanningData {
  goals: Goal[]
}

interface Goal {
  id?: string
  barrier_id?: string
  category?: 'academic' | 'functional'
  description: string
  target_date?: string
  progress_level?: 'não iniciada' | 'em andamento' | 'parcialmente alcançada' | 'alcançada'
  progress_score?: number
  notes?: string
  strategies?: string[]  // ⚠️ Verificar se existe
}
```

#### **Mapeamento:**

O CSV **NÃO TEM** metas explícitas. Precisamos **GERAR AUTOMATICAMENTE** a partir do campo **"O que precisa de ajuda"**.

**Exemplo:**
```
CSV: "leitura de palavras, organização de materiais, manter a atenção"
     ↓
planning_data.goals: [
  {
    description: "Desenvolver habilidades de leitura",
    category: "academic",
    target_date: "2026-02-20", // +3 meses
    strategies: [
      "Leitura compartilhada",
      "Textos adaptados ao nível",
      "Uso de jogos educativos" // Do campo interesses!
    ]
  },
  {
    description: "Melhorar organização de materiais",
    category: "functional",
    target_date: "2026-02-20",
    strategies: [
      "Etiquetas visuais",
      "Rotina de organização",
      "Checklist ilustrado"
    ]
  },
  {
    description: "Ampliar capacidade de atenção",
    category: "functional",
    target_date: "2026-03-20",
    strategies: [
      "Atividades curtas",
      "Pausas programadas",
      "Ambiente sem distrações"
    ]
  }
]
```

---

## 🔧 **MUDANÇAS NECESSÁRIAS NO SISTEMA**

### **1. BANCO DE DADOS**

#### **Tabela `students`:**
```sql
-- Adicionar colunas ausentes
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS grade VARCHAR(50),
  ADD COLUMN IF NOT EXISTS shift VARCHAR(20);
  
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_shift ON students(shift);
```

#### **Não mexer em `peis`** (estrutura JSONB já suporta novos campos)

---

### **2. INTERFACES TYPESCRIPT**

#### **Arquivo: `src/types/database.ts` (criar ou atualizar)**

```typescript
// Atualizar DiagnosisData
export interface DiagnosisData {
  // ✅ Campos existentes
  history: string
  interests: string
  specialNeeds: string
  barriers: Barrier[]
  cid10?: string
  description?: string
  
  // ❌ NOVOS CAMPOS
  aversions?: string       // Desinteresses/Aversão
  abilities?: string       // O que já consegue fazer
  barriersComments?: string // Comentários sobre barreiras
}

// Atualizar Barrier (mantém estrutura atual)
export interface Barrier {
  id?: string
  description: string
  severity?: 'leve' | 'moderada' | 'severa'
}

// Atualizar Goal para incluir strategies (se não existe)
export interface Goal {
  id?: string
  barrier_id?: string
  category?: 'academic' | 'functional'
  description: string
  target_date?: string
  progress_level?: 'não iniciada' | 'em andamento' | 'parcialmente alcançada' | 'alcançada'
  progress_score?: number
  notes?: string
  strategies?: string[]  // ❌ ADICIONAR SE NÃO EXISTE
}

// Atualizar Student
export interface Student {
  id: string
  name: string
  date_of_birth?: string
  student_id?: string
  class_name?: string
  grade?: string         // ❌ NOVO
  shift?: string         // ❌ NOVO
  school_id: string
  tenant_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

---

### **3. COMPONENTES FRONTEND**

#### **Arquivos a Atualizar:**

1. **`src/components/pei/DiagnosisSection.tsx`**
   - Adicionar campos: `aversions`, `abilities`, `barriersComments`
   - Layout: 3 novos inputs de texto

2. **`src/components/pei/ReportView.tsx`**
   - Exibir os 3 novos campos no relatório
   - Seção "O que já consegue fazer"
   - Seção "Desinteresses"
   - Comentários de barreiras

3. **`src/pages/CreatePEI.tsx`**
   - Atualizar estado inicial de `diagnosisData`
   - Incluir novos campos no salvamento

4. **`src/components/coordinator/PrintPEIDialog.tsx`**
   - Exibir novos campos no print

---

## 📈 **EXEMPLO COMPLETO DE TRANSFORMAÇÃO**

### **Linha do CSV:**
```csv
24/10/2025 19:48:50,
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

### **Vira Objeto no Banco:**

```json
{
  "student": {
    "name": "João Carlos Bispo",
    "grade": "3° ano",                    // ❌ NOVO CAMPO
    "shift": "Matutino",                  // ❌ NOVO CAMPO
    "school_id": "abc-123..."
  },
  "pei": {
    "created_by": "coord-id-vi-garcia",   // Lookup por email
    "status": "draft",
    "assigned_teacher_id": null,
    "diagnosis_data": {
      "history": "A família demonstra carinho...",
      "interests": "Jogos, animais e cores",
      "aversions": "Reage quando se sente provocado",     // ❌ NOVO CAMPO
      "abilities": "Escreve primeiro nome, reconhece letras", // ❌ NOVO CAMPO
      "specialNeeds": "Leitura, escrita e coordenação motora",
      "barriers": [],                     // Nenhuma barreira marcada
      "barriersComments": ""              // ❌ NOVO CAMPO
    },
    "planning_data": {
      "goals": [
        {
          "description": "Desenvolver habilidades de leitura",
          "category": "academic",
          "target_date": "2026-02-20",
          "strategies": [                 // ✅ Gerado automaticamente
            "Leitura compartilhada",
            "Uso de jogos educativos"     // Do campo interesses!
          ]
        },
        {
          "description": "Aprimorar habilidades de escrita",
          "category": "academic",
          "target_date": "2026-02-20",
          "strategies": [
            "Tracejados preparatórios",
            "Escrita guiada",
            "Atividades com animais e cores" // Do campo interesses!
          ]
        },
        {
          "description": "Desenvolver coordenação motora fina",
          "category": "functional",
          "target_date": "2026-03-20",
          "strategies": [
            "Massinha e argila",
            "Recorte e colagem",
            "Jogos de encaixe"
          ]
        }
      ]
    }
  }
}
```

---

## 🚨 **PROBLEMAS ENCONTRADOS**

### **Problema 1: Campos de Aluno Ausentes**
**Impacto:** ❌ BLOQUEANTE
**Campos:** `grade`, `shift`

**Solução:**
```sql
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS grade VARCHAR(50),
  ADD COLUMN IF NOT EXISTS shift VARCHAR(20);
```

---

### **Problema 2: Campos de Diagnóstico Ausentes**
**Impacto:** ⚠️ MÉDIO
**Campos:** `aversions`, `abilities`, `barriersComments`

**Solução:** Adicionar aos interfaces TypeScript (JSONB já suporta)

```typescript
interface DiagnosisData {
  // ... campos existentes
  aversions?: string
  abilities?: string
  barriersComments?: string
}
```

**Trabalho Frontend:** Atualizar 4 componentes

---

### **Problema 3: Barreiras em Formato Diferente**
**Impacto:** ⚠️ MÉDIO
**Estrutura CSV:** 6 colunas (Nenhum/Pouco/Moderado/Alto)
**Estrutura Banco:** Array de objetos

**Solução:** Transformação na importação (já detalhada acima)

---

### **Problema 4: Metas Não Existem no CSV**
**Impacto:** ⚠️ MÉDIO
**Problema:** CSV não tem metas explícitas

**Solução:** Geração automática via NLP/Keywords

**Algoritmo:**
```javascript
function generateGoals(specialNeeds, interests) {
  const keywords = extractKeywords(specialNeeds)
  const goals = []
  
  for (const keyword of keywords) {
    const goal = GOAL_TEMPLATES[keyword]
    if (goal) {
      // Personalizar estratégias com interesses do aluno
      goal.strategies = personalizeStrategies(goal.strategies, interests)
      goals.push(goal)
    }
  }
  
  return goals
}
```

---

## ✅ **PLANO DE AÇÃO**

### **FASE 1: Ajustes no Banco (1h)**
- [x] Criar SQL de migração
- [ ] Testar em ambiente de dev
- [ ] Aplicar em produção

### **FASE 2: Atualizar Interfaces (30min)**
- [ ] Atualizar `DiagnosisData`
- [ ] Atualizar `Student`
- [ ] Atualizar `Goal` (adicionar `strategies[]`)

### **FASE 3: Atualizar Frontend (2-3h)**
- [ ] `DiagnosisSection.tsx` - adicionar 3 campos
- [ ] `ReportView.tsx` - exibir novos campos
- [ ] `PrintPEIDialog.tsx` - exibir no print
- [ ] `CreatePEI.tsx` - incluir no save

### **FASE 4: Script de Importação (4-6h)**
- [ ] Parser de CSV
- [ ] Transformação de barreiras
- [ ] Geração automática de metas
- [ ] Testes com subset (5 alunos)
- [ ] Importação completa (32 alunos)

### **FASE 5: Validação (1h)**
- [ ] Revisar PEIs criados
- [ ] Verificar metas geradas
- [ ] Ajustar templates se necessário

---

## 📊 **CAMPOS FINAIS - COMPARAÇÃO**

| Campo CSV | Campo Sistema | Trabalho Necessário |
|-----------|---------------|---------------------|
| Carimbo | metadata | ✅ Nenhum |
| Email | created_by | ✅ Lookup |
| ESCOLA | school_id | ✅ Lookup |
| Nome | student.name | ✅ Direto |
| Série | student.grade | ❌ **CRIAR COLUNA** |
| Turno | student.shift | ❌ **CRIAR COLUNA** |
| Histórico | diagnosis_data.history | ✅ Direto |
| Interesses | diagnosis_data.interests | ✅ Direto |
| Desinteresses | diagnosis_data.aversions | ⚠️ **ADICIONAR INTERFACE** |
| Habilidades | diagnosis_data.abilities | ⚠️ **ADICIONAR INTERFACE** |
| Necessidades | diagnosis_data.specialNeeds | ✅ Direto |
| Barreiras [6x] | diagnosis_data.barriers[] | ⚠️ **TRANSFORMAÇÃO** |
| Comentários | diagnosis_data.barriersComments | ⚠️ **ADICIONAR INTERFACE** |
| (Metas geradas) | planning_data.goals[] | ⚠️ **GERAÇÃO AUTO** |

**Totais:**
- ✅ **7 campos** funcionam direto
- ❌ **2 colunas SQL** para criar
- ⚠️ **4 campos** para adicionar em interfaces
- ⚠️ **1 transformação** complexa (barreiras)
- ⚠️ **1 geração** automática (metas)

---

## 💡 **RECOMENDAÇÃO FINAL**

**✅ EXECUTAR NESTA ORDEM:**

1. **Hoje:** SQL para criar `grade` e `shift` em `students`
2. **Hoje:** Atualizar interfaces TypeScript
3. **Amanhã:** Atualizar componentes frontend
4. **Depois:** Criar script de importação
5. **Depois:** Testar importação com 5 alunos
6. **Depois:** Importar os 32 completos

**Tempo Total Estimado:** 8-12 horas de trabalho

**Quer que eu:**
1. ✅ **Crie a migração SQL agora?**
2. ✅ **Atualize as interfaces TypeScript?**
3. ✅ **Atualize os componentes frontend?**
4. ✅ **Crie o script completo de importação?**

**Me avise e começo! 🚀**




