# 📊 ANÁLISE: Importação em Lote de PEIs via CSV

## 🔍 **ANÁLISE DO CSV RECEBIDO**

### **Formulário de São Gonçalo:**

**Campos do Formulário → Mapeamento para PEI:**

| # | Campo do Formulário | Campo PEI | Tipo |
|---|---------------------|-----------|------|
| 1 | Carimbo de data/hora | metadata | timestamp |
| 2 | Endereço de e-mail | coordinator_email | referência |
| 3 | ESCOLA REGULAR | school_name | lookup |
| 4 | **Nome do Estudante** | **student.name** | **string** |
| 5 | Série/Ano Escolar | student.grade | string |
| 6 | Turno | student.shift | string |
| 7 | **Histórico resumido** | **diagnosis_data.history** | **text** |
| 8 | **Interesses / Hiperfoco** | **diagnosis_data.interests** | **text** |
| 9 | Desinteresses / Aversão | diagnosis_data.aversions | text |
| 10 | **O que já consegue fazer** | **diagnosis_data.abilities** | **text** |
| 11 | **O que precisa de ajuda** | **diagnosis_data.specialNeeds** | **text** |
| 12 | Barreiras Arquitetônicas | barriers.architectural | enum |
| 13 | Barreiras Comunicacionais | barriers.communicational | enum |
| 14 | Barreiras Atitudinais | barriers.attitudinal | enum |
| 15 | Barreiras Tecnológicas | barriers.technological | enum |
| 16 | Barreiras Pedagógicas | barriers.pedagogical | enum |
| 17 | Barreiras Outras | barriers.other | enum |
| 18 | Comentários sobre barreiras | barriers.comments | text |

### **Mapeamento de Valores:**

```
Nenhum   → Não criar barreira
Pouco    → severity: 'leve'
Moderado → severity: 'moderada'
Alto     → severity: 'severa'
```

---

## 🎯 **ESTRUTURA IDEAL DO CSV**

### **Exemplo de Linha Processada:**

```csv
Nome: Josué Gonçalves de Oliveira
Escola: ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA
Histórico: "O estudante possui síndrome de Down e Autismo..."
Interesses: "Atividades de manuseio de objetos"
Necessidades: "Precisa de mais apoio para desenvolver autonomia"
Barreiras:
  - Arquitetônicas: Nenhum
  - Comunicacionais: Alto
  - Pedagógicas: Moderado
```

**Vira PEI:**
```json
{
  "student_name": "Josué Gonçalves de Oliveira",
  "school_name": "ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA",
  "grade": "2° ano",
  "shift": "Matutino",
  "diagnosis_data": {
    "history": "O estudante possui síndrome de Down e Autismo...",
    "interests": "Atividades de manuseio de objetos",
    "specialNeeds": "Precisa de mais apoio para desenvolver autonomia",
    "barriers": [
      {
        "barrier_type": "comunicacional",
        "description": "Falta de intérprete de Libras",
        "severity": "severa"
      },
      {
        "barrier_type": "pedagogical",
        "description": "Falta de profissional de apoio",
        "severity": "moderada"
      }
    ]
  },
  "planning_data": {
    "goals": [
      {
        "description": "Desenvolver maior autonomia nas atividades cotidianas",
        "category": "functional",
        "target_date": "2025-12-31",
        "strategies": ["Rotina visual", "Apoio individualizado", "Reforço positivo"]
      },
      {
        "description": "Aprimorar comunicação alternativa",
        "category": "functional",
        "barrier_id": "comunicacional_001",
        "strategies": ["CAA", "Pictogramas", "Gestos"]
      }
    ]
  }
}
```

---

## 🚀 **SOLUÇÃO PROPOSTA**

### **Funcionalidade: Importação em Lote de PEIs**

#### **Fluxo Completo:**

```
1. Coordenador → Dashboard
2. Botão "📥 Importar PEIs em Lote"
3. Upload arquivo CSV
4. Sistema valida e processa
5. Preview dos PEIs a serem criados
6. Revisão e ajustes
7. Confirmação
8. Criação em lote
9. Relatório de sucesso/erros
```

---

## 🏗️ **ARQUITETURA DA SOLUÇÃO**

### **Componentes Necessários:**

#### **1. Upload CSV Component**
```typescript
// src/components/coordinator/BulkPEIImport.tsx
<Dialog>
  <DialogTrigger>
    <Button>
      <Upload /> Importar PEIs em Lote
    </Button>
  </DialogTrigger>
  
  <DialogContent>
    <FileUpload accept=".csv" onUpload={handleCSVUpload} />
    
    {/* Preview dos dados */}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Aluno</TableHead>
          <TableHead>Escola</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parsedData.map(row => (
          <TableRow key={row.index}>
            <TableCell>{row.studentName}</TableCell>
            <TableCell>{row.schoolName}</TableCell>
            <TableCell>
              {row.valid ? '✅ Pronto' : '❌ Erro'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    
    <Button onClick={handleBulkCreate}>
      Criar {validRows} PEIs
    </Button>
  </DialogContent>
</Dialog>
```

#### **2. CSV Parser**
```typescript
// src/lib/csvParser.ts
export function parseCSVToPEIs(csvContent: string) {
  const lines = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8'
  })
  
  return lines.data.map((row, index) => {
    try {
      return {
        index,
        valid: true,
        data: mapRowToPEI(row)
      }
    } catch (error) {
      return {
        index,
        valid: false,
        error: error.message,
        data: null
      }
    }
  })
}
```

#### **3. Mapper Function**
```typescript
// src/lib/peiMapper.ts
export function mapRowToPEI(row: CSVRow): PEIData {
  // 1. Identificação
  const student = {
    name: row['Nome do Estudante'],
    grade: row['Série/Ano Escolar'],
    shift: row['Turno']
  }
  
  // 2. Diagnóstico
  const diagnosis_data = {
    history: row['Histórico resumido (...)'],
    interests: row['Interesses / Hiperfoco (...)'],
    aversions: row['Desinteresses / Aversão (...)'],
    abilities: row['O que a criança já consegue fazer (...)'],
    specialNeeds: row['O que precisa de mais ajuda (...)'],
    barriers: parseBarriers(row)
  }
  
  // 3. Planejamento (AUTO-GERADO!)
  const planning_data = {
    goals: generateGoalsFromNeeds(
      diagnosis_data.specialNeeds,
      diagnosis_data.barriers
    ),
    accessibilityResources: suggestResources(diagnosis_data.barriers)
  }
  
  return {
    student,
    school_name: row['ESCOLA REGULAR'],
    coordinator_email: row['Endereço de e-mail'],
    diagnosis_data,
    planning_data,
    status: 'draft'
  }
}
```

#### **4. IA para Gerar Metas**
```typescript
// src/lib/aiGoalGenerator.ts
export function generateGoalsFromNeeds(
  needs: string,
  barriers: Barrier[]
): Goal[] {
  const goals: Goal[] = []
  
  // Parser de necessidades (usa IA ou regex)
  const parsedNeeds = parseNeeds(needs)
  
  // Exemplo: "leitura de palavras, organização de materiais"
  if (parsedNeeds.includes('leitura')) {
    goals.push({
      description: "Desenvolver habilidades de leitura e decodificação",
      category: 'academic',
      target_date: addMonths(new Date(), 3),
      strategies: [
        "Leitura guiada com apoio visual",
        "Textos adaptados ao nível do aluno",
        "Atividades lúdicas com palavras"
      ],
      barrier_id: findRelatedBarrier(barriers, 'pedagogical')
    })
  }
  
  if (parsedNeeds.includes('coordenação motora')) {
    goals.push({
      description: "Melhorar coordenação motora fina",
      category: 'functional',
      target_date: addMonths(new Date(), 4),
      strategies: [
        "Atividades com massinha",
        "Tracejados e pontilhados",
        "Uso de materiais concretos"
      ]
    })
  }
  
  // ... mais regras baseadas em keywords
  
  return goals
}
```

---

## 🗺️ **MAPEAMENTO DETALHADO**

### **Barreiras (6 colunas → Array de objetos):**

```typescript
function parseBarriers(row: CSVRow): Barrier[] {
  const barriers: Barrier[] = []
  
  const barrierTypes = [
    { csv: 'Arquitetônicas', type: 'architectural', items: [
      'escadas_sem_rampa', 'banheiros_nao_adaptados', 'carteiras_inadequadas'
    ]},
    { csv: 'Comunicacionais', type: 'communicational', items: [
      'falta_libras', 'falta_caa', 'sinalizacao'
    ]},
    { csv: 'Pedagógicas', type: 'pedagogical', items: [
      'material_nao_adaptado', 'falta_individualizacao', 'falta_apoio'
    ]},
    // ... outros
  ]
  
  barrierTypes.forEach(bt => {
    const level = row[`Barreiras ... [${bt.csv}]`]
    
    if (level && level !== 'Nenhum') {
      const severity = {
        'Pouco': 'leve',
        'Moderado': 'moderada',
        'Alto': 'severa'
      }[level]
      
      // Criar barreira genérica para esse tipo
      barriers.push({
        barrier_type: bt.type,
        description: `Barreiras ${bt.csv.toLowerCase()} identificadas`,
        severity: severity,
        details: row['Comentários ou observações sobre barreiras']
      })
    }
  })
  
  return barriers
}
```

### **Metas Auto-Geradas:**

```typescript
// Exemplo: "Leitura de palavras, organização de materiais, manter atenção"
const needsText = "leitura de palavras, organização de materiais, manter a atenção"

// Sistema detecta keywords e cria metas:
const goals = [
  {
    description: "Desenvolver habilidades de leitura de palavras",
    category: 'academic',
    strategies: [
      "Método fônico com apoio visual",
      "Leitura compartilhada",
      "Jogos de formação de palavras"
    ],
    target_date: "2025-12-31"
  },
  {
    description: "Melhorar organização de materiais escolares",
    category: 'functional',
    strategies: [
      "Etiquetas e marcações visuais",
      "Rotina de organização diária",
      "Checklist ilustrado"
    ],
    target_date: "2025-12-31"
  },
  {
    description: "Ampliar capacidade de atenção e concentração",
    category: 'functional',
    strategies: [
      "Atividades curtas e variadas",
      "Pausas programadas",
      "Recursos visuais de foco"
    ],
    target_date: "2025-12-31"
  }
]
```

---

## 💡 **FUNCIONALIDADES PROPOSTAS**

### **1. Interface de Importação**

```typescript
// src/pages/BulkPEIImport.tsx
export default function BulkPEIImport() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedPEI[]>([])
  const [step, setStep] = useState<'upload' | 'review' | 'mapping' | 'creating'>('upload')
  
  return (
    <div className="container">
      <header>
        <h1>📥 Importação em Lote de PEIs</h1>
        <p>Importe dados de formulários externos para criar PEIs automaticamente</p>
      </header>
      
      <Stepper currentStep={step}>
        <Step name="upload">Upload do CSV</Step>
        <Step name="review">Revisão dos Dados</Step>
        <Step name="mapping">Mapeamento de Escolas</Step>
        <Step name="creating">Criação dos PEIs</Step>
      </Stepper>
      
      {step === 'upload' && <UploadStep />}
      {step === 'review' && <ReviewStep />}
      {step === 'mapping' && <MappingStep />}
      {step === 'creating' && <CreatingStep />}
    </div>
  )
}
```

### **2. Preview e Validação**

```typescript
// Após upload, mostrar preview
<Card>
  <CardHeader>
    <CardTitle>📋 Preview da Importação</CardTitle>
    <CardDescription>
      {validRows} alunos prontos | {errorRows} com erros
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Aluno</TableHead>
          <TableHead>Escola</TableHead>
          <TableHead>Diagnóstico</TableHead>
          <TableHead>Metas</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parsedData.map(pei => (
          <TableRow>
            <TableCell>
              {pei.valid ? (
                <Badge variant="default">✅ OK</Badge>
              ) : (
                <Badge variant="destructive">❌ Erro</Badge>
              )}
            </TableCell>
            <TableCell>{pei.student_name}</TableCell>
            <TableCell>{pei.school_name}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {pei.diagnosis_data.barriers.length} barreiras
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {pei.planning_data.goals.length} metas sugeridas
              </Badge>
            </TableCell>
            <TableCell>
              <Button size="sm" onClick={() => previewPEI(pei)}>
                👁️ Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### **3. Mapeamento de Escolas**

```typescript
// Sistema precisa mapear nome da escola do CSV → school_id
<Card>
  <CardHeader>
    <CardTitle>🏫 Mapeamento de Escolas</CardTitle>
  </CardHeader>
  
  <CardContent>
    {uniqueSchools.map(csvSchoolName => (
      <div key={csvSchoolName} className="mb-4">
        <Label>{csvSchoolName}</Label>
        <Select onValueChange={(schoolId) => mapSchool(csvSchoolName, schoolId)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a escola correspondente" />
          </SelectTrigger>
          <SelectContent>
            {schools.map(school => (
              <SelectItem value={school.id}>
                {school.school_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ))}
  </CardContent>
</Card>
```

### **4. Criação em Lote**

```typescript
async function createPEIsInBatch(peis: ParsedPEI[]) {
  const results = {
    success: [],
    errors: []
  }
  
  for (const pei of peis) {
    try {
      // 1. Verificar se aluno já existe
      let student = await findStudent(pei.student_name, pei.school_id)
      
      // 2. Se não existe, criar aluno
      if (!student) {
        student = await createStudent({
          name: pei.student_name,
          school_id: pei.school_id,
          tenant_id: pei.tenant_id,
          grade: pei.grade,
          shift: pei.shift,
          class_name: extractClassName(pei.grade)
        })
      }
      
      // 3. Verificar se aluno já tem PEI ativo
      const existingPEI = await supabase
        .from('peis')
        .select('id')
        .eq('student_id', student.id)
        .eq('is_active_version', true)
        .maybeSingle()
      
      if (existingPEI) {
        results.errors.push({
          student: pei.student_name,
          reason: 'Aluno já possui PEI ativo'
        })
        continue
      }
      
      // 4. Criar PEI
      const { data: newPEI, error } = await supabase
        .from('peis')
        .insert({
          student_id: student.id,
          school_id: pei.school_id,
          tenant_id: pei.tenant_id,
          created_by: coordinatorId,
          assigned_teacher_id: null, // Atribuir depois
          status: 'draft',
          version_number: 1,
          is_active_version: true,
          diagnosis_data: pei.diagnosis_data,
          planning_data: pei.planning_data,
          evaluation_data: {}
        })
        .select()
        .single()
      
      if (error) throw error
      
      results.success.push({
        student: pei.student_name,
        pei_id: newPEI.id
      })
      
    } catch (error) {
      results.errors.push({
        student: pei.student_name,
        reason: error.message
      })
    }
  }
  
  return results
}
```

---

## 🤖 **GERAÇÃO AUTOMÁTICA DE METAS**

### **Regras de Negócio:**

```typescript
// src/lib/goalGenerator.ts
const NEED_PATTERNS = {
  // Acadêmicas
  'leitura': {
    description: "Desenvolver habilidades de leitura",
    category: 'academic',
    strategies: [
      "Método fônico com apoio visual",
      "Leitura compartilhada diária",
      "Jogos de formação de palavras",
      "Textos adaptados ao nível do aluno"
    ]
  },
  'escrita': {
    description: "Aprimorar habilidades de escrita",
    category: 'academic',
    strategies: [
      "Tracejados e pontilhados",
      "Escrita guiada",
      "Uso de pautas diferenciadas",
      "Atividades lúdicas de registro"
    ]
  },
  'matemática|cálculo': {
    description: "Desenvolver raciocínio lógico-matemático",
    category: 'academic',
    strategies: [
      "Material concreto (blocos, ábacos)",
      "Jogos matemáticos",
      "Situações-problema do cotidiano",
      "Uso de calculadora quando necessário"
    ]
  },
  
  // Funcionais
  'autonomia': {
    description: "Ampliar autonomia nas atividades cotidianas",
    category: 'functional',
    strategies: [
      "Rotina visual estruturada",
      "Checklist de tarefas",
      "Reforço positivo",
      "Prática diária com supervisão"
    ]
  },
  'atenção|concentração': {
    description: "Melhorar atenção e concentração",
    category: 'functional',
    strategies: [
      "Atividades curtas e variadas",
      "Pausas programadas",
      "Ambiente com menos estímulos",
      "Uso de timer visual"
    ]
  },
  'coordenação motora': {
    description: "Desenvolver coordenação motora fina",
    category: 'functional',
    strategies: [
      "Atividades com massinha",
      "Recorte e colagem",
      "Tracejados e pontilhados",
      "Jogos de encaixe"
    ]
  },
  'socialização|interação': {
    description: "Ampliar habilidades de interação social",
    category: 'functional',
    strategies: [
      "Atividades em duplas e grupos pequenos",
      "Jogos cooperativos",
      "Mediação de conflitos",
      "Reforço de comportamentos sociais positivos"
    ]
  }
}

export function generateGoalsFromNeeds(needsText: string): Goal[] {
  const goals: Goal[] = []
  const needsLower = needsText.toLowerCase()
  
  Object.entries(NEED_PATTERNS).forEach(([pattern, goal]) => {
    if (needsLower.match(new RegExp(pattern, 'i'))) {
      goals.push({
        ...goal,
        target_date: addMonths(new Date(), 3).toISOString()
      })
    }
  })
  
  return goals
}
```

---

## 📋 **VALIDAÇÕES NECESSÁRIAS**

### **Checklist por Linha:**

```typescript
function validatePEIRow(row: CSVRow): ValidationResult {
  const errors = []
  
  // Campos obrigatórios
  if (!row['Nome do Estudante']) {
    errors.push('Nome do estudante é obrigatório')
  }
  
  if (!row['ESCOLA REGULAR']) {
    errors.push('Escola é obrigatória')
  }
  
  // Validações de formato
  if (row['Endereço de e-mail'] && !isValidEmail(row['Endereço de e-mail'])) {
    errors.push('Email inválido')
  }
  
  // Avisos (não bloqueiam)
  const warnings = []
  
  if (!row['Histórico resumido (...)']) {
    warnings.push('Histórico não preenchido')
  }
  
  if (!row['Interesses / Hiperfoco (...)']) {
    warnings.push('Interesses não preenchidos')
  }
  
  const allBarriersNone = Object.keys(row)
    .filter(k => k.startsWith('Barreiras'))
    .every(k => !row[k] || row[k] === 'Nenhum')
  
  if (allBarriersNone) {
    warnings.push('Nenhuma barreira identificada')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
```

---

## 🎨 **INTERFACE PROPOSTA**

### **Tela 1: Upload**
```
┌─────────────────────────────────────────┐
│ 📥 Importar PEIs em Lote                │
├─────────────────────────────────────────┤
│                                         │
│  Arraste o arquivo CSV aqui ou          │
│  [Escolher Arquivo]                     │
│                                         │
│  Formato esperado:                      │
│  • Formulário PEI Colaborativo          │
│  • Codificação UTF-8                    │
│  • Primeira linha: cabeçalhos           │
│                                         │
│  [📄 Baixar Modelo CSV]                 │
│                                         │
└─────────────────────────────────────────┘
```

### **Tela 2: Preview e Validação**
```
┌─────────────────────────────────────────┐
│ ✅ Arquivo carregado: 32 linhas         │
│ 🟢 28 válidos | 🔴 4 com erros          │
├─────────────────────────────────────────┤
│ Aluno              Escola       Status  │
│─────────────────────────────────────────│
│ ✅ Josué G.        Emigdia      OK      │
│ ✅ João Carlos     M.F.Oliveira OK      │
│ ❌ [Nome vazio]    Emigdia      ERRO    │
│ ✅ Ronald Xavier   M.F.Oliveira OK      │
│ ...                                     │
│                                         │
│ [❌ Corrigir Erros]  [✅ Importar 28]   │
└─────────────────────────────────────────┘
```

### **Tela 3: Mapeamento de Escolas**
```
┌─────────────────────────────────────────┐
│ 🏫 Vincular Escolas do CSV              │
├─────────────────────────────────────────┤
│ ESCOLA MUNICIPAL EMIGDIA PEDREIRA       │
│ [Selecione a escola no sistema    ▼]   │
│                                         │
│ ESCOLA MUNICIPAL M.F. DE OLIVEIRA       │
│ [Selecione a escola no sistema    ▼]   │
│                                         │
│ ESCOLA MUNICIPAL DEPUTADO NÓIDE         │
│ [Selecione a escola no sistema    ▼]   │
│                                         │
│ ✅ Auto-detectar por nome similar      │
│                                         │
│          [Voltar]  [Continuar]          │
└─────────────────────────────────────────┘
```

### **Tela 4: Criando em Lote**
```
┌─────────────────────────────────────────┐
│ ⏳ Criando PEIs...                      │
├─────────────────────────────────────────┤
│                                         │
│  ████████████░░░░░░░░  18 / 28         │
│                                         │
│  ✅ Josué G. - PEI criado               │
│  ✅ João Carlos - PEI criado            │
│  ⏳ Ronald Xavier - processando...      │
│                                         │
└─────────────────────────────────────────┘
```

### **Tela 5: Resultado**
```
┌─────────────────────────────────────────┐
│ ✅ Importação Concluída!                │
├─────────────────────────────────────────┤
│  🟢 26 PEIs criados com sucesso         │
│  🔴 2 erros (aluno já tem PEI)          │
│                                         │
│  Próximos passos:                       │
│  • Revisar PEIs criados                 │
│  • Atribuir professores                 │
│  • Ajustar metas geradas                │
│                                         │
│  [📄 Baixar Relatório]                  │
│  [🔍 Ver PEIs Criados]                  │
│  [✅ Concluir]                          │
└─────────────────────────────────────────┘
```

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **Bibliotecas Necessárias:**

```json
// package.json
{
  "dependencies": {
    "papaparse": "^5.4.1",        // Parser CSV robusto
    "@types/papaparse": "^5.3.14" // Types
  }
}
```

### **Estrutura de Arquivos:**

```
src/
├── pages/
│   └── BulkPEIImport.tsx              # Página principal
│
├── components/
│   └── bulk-import/
│       ├── UploadStep.tsx             # Step 1: Upload
│       ├── ReviewStep.tsx             # Step 2: Review
│       ├── SchoolMappingStep.tsx      # Step 3: Mapping
│       ├── CreationStep.tsx           # Step 4: Creating
│       ├── PEIPreviewCard.tsx         # Card de preview
│       └── ImportProgress.tsx         # Progress bar
│
├── lib/
│   ├── csvParser.ts                   # Parser CSV
│   ├── peiMapper.ts                   # CSV → PEI
│   ├── goalGenerator.ts               # IA de metas
│   └── bulkImport.ts                  # Lógica de importação
│
└── types/
    └── bulkImport.ts                  # Types
```

---

## 🎯 **EXEMPLO DE USO REAL**

### **Caso: São Gonçalo - 32 Alunos**

```
Coordenadora Municipal faz upload do CSV
    ↓
Sistema processa 32 linhas
    ↓
Validação:
  ✅ 28 alunos OK
  ❌ 4 com problemas (nome vazio, etc)
    ↓
Mapeia escolas:
  "ESCOLA MUNICIPAL EMIGDIA..." → school_id_001
  "ESCOLA MUNICIPAL M.F. DE OLIVEIRA" → school_id_002
  (Auto-detecta por similaridade de nome)
    ↓
Gera metas automaticamente:
  "leitura de palavras" → 3 metas acadêmicas
  "coordenação motora" → 2 metas funcionais
  "autonomia" → 2 metas funcionais
    ↓
Preview mostra:
  28 PEIs prontos para criar
  Média de 5 metas por aluno
    ↓
Coordenadora revisa e confirma
    ↓
Sistema cria em 30 segundos:
  ✅ 28 alunos criados
  ✅ 28 PEIs criados (status: draft)
  ✅ ~140 metas geradas
    ↓
Próximo passo:
  Atribuir professores via interface
```

---

## 📊 **BENEFÍCIOS**

| Aspecto | Manual | Com Importação | Ganho |
|---------|--------|----------------|-------|
| **Tempo por aluno** | 15-20 min | ~30s | **95%** |
| **Tempo total (32 alunos)** | 8-10 horas | 30 min | **95%** |
| **Erros de digitação** | Alto | Baixo | **80%** |
| **Metas geradas** | Manual | Automático | **100%** |
| **Consistência** | Variável | Alta | **90%** |

**ROI:** 
- 1 importação = economiza 8-10 horas
- Coordenador pode focar em revisão ao invés de digitação

---

## ⚡ **MELHORIAS ADICIONAIS**

### **1. Geração de Encaminhamentos**

```typescript
// Detectar necessidades → sugerir encaminhamentos
if (diagnosis_data.specialNeeds.includes('fala') || 
    diagnosis_data.specialNeeds.includes('linguagem')) {
  referrals.push('fonoaudiologo')
}

if (diagnosis_data.specialNeeds.includes('coordenação motora')) {
  referrals.push('terapeuta_ocupacional')
}

if (barriers.some(b => b.barrier_type === 'communicational')) {
  referrals.push('fonoaudiologo')
}
```

### **2. Sugestão de Recursos**

```typescript
// Barreiras → Recursos de Acessibilidade
if (barriers.some(b => b.barrier_type === 'communicational')) {
  resources.push({
    resource_type: 'CAA',
    description: 'Sistema de Comunicação Alternativa',
    usage_frequency: 'Diário'
  })
}

if (barriers.some(b => b.barrier_type === 'pedagogical')) {
  resources.push({
    resource_type: 'Material adaptado',
    description: 'Atividades diferenciadas e adaptadas',
    usage_frequency: 'Diário'
  })
}
```

### **3. Dashboard de Importações**

```typescript
// Ver histórico de importações
<Card>
  <CardHeader>
    <CardTitle>📊 Histórico de Importações</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableRow>
        <TableCell>05/11/2025</TableCell>
        <TableCell>São Gonçalo - Emigdia</TableCell>
        <TableCell>32 linhas</TableCell>
        <TableCell>28 criados</TableCell>
        <TableCell>
          <Button size="sm">Ver Relatório</Button>
        </TableCell>
      </TableRow>
    </Table>
  </CardContent>
</Card>
```

---

## 🚀 **ROADMAP DE IMPLEMENTAÇÃO**

### **Fase 1: MVP (2 semanas)**
- [ ] Criar página BulkPEIImport
- [ ] Parser CSV básico
- [ ] Preview de dados
- [ ] Criação em lote simples
- [ ] Relatório de resultado

### **Fase 2: Inteligência (1 semana)**
- [ ] Geração automática de metas
- [ ] Sugestão de encaminhamentos
- [ ] Sugestão de recursos
- [ ] Keywords de necessidades

### **Fase 3: UX (1 semana)**
- [ ] Mapeamento auto de escolas
- [ ] Edição inline de erros
- [ ] Preview detalhado por PEI
- [ ] Progresso em tempo real

### **Fase 4: Avançado (1 semana)**
- [ ] IA para gerar metas (OpenAI/Gemini)
- [ ] Detecção de duplicatas
- [ ] Merge inteligente
- [ ] Templates de importação

---

## 📄 **TEMPLATE CSV IDEAL**

### **Formato Simplificado:**

```csv
nome_estudante,escola,serie,turno,historico,interesses,necessidades,barreiras_arq,barreiras_com,barreiras_ped
João Silva,Escola ABC,3º Ano,Matutino,"Histórico...",Jogos,"Leitura, coordenação",Nenhum,Alto,Moderado
Maria Santos,Escola ABC,2º Ano,Vespertino,"Histórico...",Música,"Autonomia, atenção",Pouco,Nenhum,Alto
```

**Vantagens:**
- Mais compacto
- Nomes de campos em português
- Fácil de entender
- Excel compatível

---

## 🎯 **PRÓXIMOS PASSOS**

### **Opção A: Implementação Completa** (Recomendado)
```
Tempo: 4-5 semanas
Esforço: Alto
Resultado: Sistema robusto e reutilizável
```

### **Opção B: Script One-Time** (Rápido)
```
Tempo: 2-3 dias
Esforço: Baixo
Resultado: Processa apenas este CSV específico
```

### **Opção C: Híbrido** (Pragmático)
```
Tempo: 1-2 semanas
Esforço: Médio
Resultado: MVP funcional + melhorias graduais
```

---

## 💡 **RECOMENDAÇÃO**

**✅ Implementar Importação em Lote (Opção C - Híbrido)**

**Por quê:**
- São Gonçalo tem 32 alunos AGORA
- Outras escolas vão precisar da mesma funcionalidade
- ROI positivo após primeira importação
- Reutilizável para futuras coletas

**Prioridade:**
1. **AGORA:** Script para importar estes 32 alunos
2. **Próxima semana:** Interface de importação
3. **Próximo mês:** IA para gerar metas

---

## 🎊 **PRÓXIMO PASSO**

Quer que eu:
1. **Crie o script de importação para este CSV?**
2. **Implemente a interface completa de importação?**
3. **Faça apenas um exemplo de como processar?**

Me avise e começamos a implementação! 🚀

