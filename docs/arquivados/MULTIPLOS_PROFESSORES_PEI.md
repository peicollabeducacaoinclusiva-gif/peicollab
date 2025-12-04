# Sistema de Múltiplos Professores por PEI

## 📋 Problema Identificado

### Limitações Atuais:
1. **Alunos sem série, turma e turno**: Dificulta organização e relatórios
2. **Apenas 1 professor por PEI**: Não reflete a realidade do Ensino Fundamental II onde:
   - Alunos têm vários professores (Português, Matemática, Ciências, etc.)
   - Cada professor tem insights valiosos sobre o aluno na sua disciplina
   - Conhecimento fragmentado impede colaboração efetiva

---

## ✅ Solução Implementada

### Parte 1: Informações de Turma do Aluno

Novos campos na tabela `students`:

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `grade` | VARCHAR(50) | Série/ano escolar | "6º Ano", "7º Ano" |
| `class_name` | VARCHAR(10) | Turma | "A", "B", "6A" |
| `shift` | VARCHAR(20) | Turno | "Manhã", "Tarde", "Noite", "Integral" |
| `enrollment_number` | VARCHAR(50) | Matrícula | "20240123" |

**Benefícios:**
- ✅ Buscar alunos por série/turma
- ✅ Gerar relatórios por turma
- ✅ Contexto completo no PEI

---

### Parte 2: Múltiplos Professores Colaborativos

#### Nova Tabela: `pei_teachers`

```sql
CREATE TABLE pei_teachers (
  id UUID PRIMARY KEY,
  pei_id UUID REFERENCES peis(id),
  teacher_id UUID REFERENCES profiles(id),
  is_primary BOOLEAN,              -- Professor principal
  subject VARCHAR(100),             -- Disciplina
  can_edit_diagnosis BOOLEAN,      -- Permissões
  can_edit_planning BOOLEAN,
  can_edit_evaluation BOOLEAN,
  notes TEXT,                      -- Observações do professor
  created_at TIMESTAMPTZ
);
```

#### Modelo de Colaboração

```
PEI do Aluno: João Silva (6º Ano A)
├─ 👨‍🏫 Professor Principal: Maria (Português) ⭐
│  └─ Responsável geral pelo PEI
│  └─ Pode editar: Diagnóstico, Planejamento, Avaliação
│
├─ 👨‍🏫 Professor Complementar: Carlos (Matemática)
│  └─ Contribui com estratégias específicas de Matemática
│  └─ Pode editar: Planejamento, Avaliação
│
├─ 👨‍🏫 Professora Complementar: Ana (Ciências)
│  └─ Contribui com estratégias específicas de Ciências
│  └─ Pode editar: Planejamento, Avaliação
│
└─ 👨‍🏫 Professor Complementar: Pedro (Educação Física)
   └─ Contribui com estratégias de desenvolvimento motor
   └─ Pode editar: Planejamento, Avaliação
```

---

## 🎯 Como Funciona

### Cenário Típico

1. **Coordenador cria PEI** para aluno do 6º Ano
2. **Define professor principal**: Professora de Português (maior carga horária)
3. **Adiciona professores complementares**:
   - Matemática
   - Ciências
   - História
   - Geografia
   - Ed. Física

4. **Colaboração**:
   - **Professor Principal** (Português):
     - Preenche diagnóstico geral
     - Define metas gerais de aprendizagem
     - Coordena o PEI
   
   - **Professores Complementares**:
     - Adicionam metas específicas da disciplina
     - Sugerem estratégias pedagógicas da área
     - Avaliam progresso na disciplina
     - Compartilham observações

---

## 🛠️ Recursos Técnicos Implementados

### 1. Triggers Automáticos

```sql
-- Garante apenas 1 professor principal por PEI
ensure_single_primary_teacher_trigger

-- Sincroniza com assigned_teacher_id (retrocompatibilidade)
sync_pei_primary_teacher_trigger

-- Cria student_access automaticamente
sync_student_access_from_pei_teachers_trigger
```

### 2. Funções Auxiliares

```sql
-- Obter todos os professores de um PEI
SELECT * FROM get_pei_teachers('pei-uuid');

-- Adicionar professor ao PEI
SELECT add_teacher_to_pei(
  p_pei_id := 'pei-uuid',
  p_teacher_id := 'teacher-uuid',
  p_subject := 'Matemática',
  p_is_primary := false
);

-- Remover professor (exceto principal)
SELECT remove_teacher_from_pei('pei_teacher_uuid');
```

### 3. View Completa

```sql
-- PEIs com todas as informações
SELECT * FROM peis_with_teachers
WHERE student_name LIKE '%João%';
```

Retorna:
- Dados do PEI
- Dados do aluno (incluindo série, turma, turno)
- Nome do professor principal
- Contagem de professores totais
- Contagem de professores complementares

---

## 📱 Implementação no Frontend

### 1. Formulário de Edição de Alunos

**Arquivo**: `src/components/superadmin/StudentForm.tsx`

Adicionar campos:

```tsx
<div className="grid grid-cols-3 gap-4">
  <div>
    <Label htmlFor="grade">Série/Ano</Label>
    <Select value={grade} onValueChange={setGrade}>
      <SelectItem value="1º Ano">1º Ano</SelectItem>
      <SelectItem value="2º Ano">2º Ano</SelectItem>
      <SelectItem value="3º Ano">3º Ano</SelectItem>
      <SelectItem value="4º Ano">4º Ano</SelectItem>
      <SelectItem value="5º Ano">5º Ano</SelectItem>
      <SelectItem value="6º Ano">6º Ano</SelectItem>
      <SelectItem value="7º Ano">7º Ano</SelectItem>
      <SelectItem value="8º Ano">8º Ano</SelectItem>
      <SelectItem value="9º Ano">9º Ano</SelectItem>
    </Select>
  </div>

  <div>
    <Label htmlFor="class_name">Turma</Label>
    <Input id="class_name" value={className} onChange={...} />
  </div>

  <div>
    <Label htmlFor="shift">Turno</Label>
    <Select value={shift} onValueChange={setShift}>
      <SelectItem value="Manhã">Manhã</SelectItem>
      <SelectItem value="Tarde">Tarde</SelectItem>
      <SelectItem value="Noite">Noite</SelectItem>
      <SelectItem value="Integral">Integral</SelectItem>
    </Select>
  </div>
</div>
```

---

### 2. Dialog de Gestão de Professores

**Novo arquivo**: `src/components/coordinator/ManagePEITeachersDialog.tsx`

```tsx
interface PEITeacher {
  id: string;
  teacher_name: string;
  is_primary: boolean;
  subject: string;
}

const ManagePEITeachersDialog = ({ peiId, studentName }) => {
  const [teachers, setTeachers] = useState<PEITeacher[]>([]);
  
  // Buscar professores do PEI
  const loadTeachers = async () => {
    const { data } = await supabase
      .rpc('get_pei_teachers', { p_pei_id: peiId });
    setTeachers(data);
  };
  
  // Adicionar professor
  const handleAddTeacher = async (teacherId, subject) => {
    await supabase.rpc('add_teacher_to_pei', {
      p_pei_id: peiId,
      p_teacher_id: teacherId,
      p_subject: subject,
      p_is_primary: false
    });
    loadTeachers();
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="mr-2 h-4 w-4" />
          Gerenciar Professores ({teachers.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Professores do PEI</DialogTitle>
          <DialogDescription>
            Aluno: {studentName}
          </DialogDescription>
        </DialogHeader>
        
        {/* Lista de professores */}
        <div className="space-y-3">
          {teachers.map(teacher => (
            <div key={teacher.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{teacher.teacher_name}</p>
                <p className="text-sm text-muted-foreground">{teacher.subject}</p>
              </div>
              {teacher.is_primary ? (
                <Badge>Principal</Badge>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => handleRemove(teacher.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {/* Adicionar professor */}
        <AddTeacherForm onAdd={handleAddTeacher} />
      </DialogContent>
    </Dialog>
  );
};
```

---

### 3. Seção de Contribuição por Disciplina no PEI

**Arquivo**: `src/pages/CreatePEI.tsx`

Adicionar seção específica para cada professor contribuir:

```tsx
{/* Após a seção de Planejamento */}
<Card>
  <CardHeader>
    <CardTitle>📚 Contribuições por Disciplina</CardTitle>
    <CardDescription>
      Cada professor pode adicionar metas e estratégias específicas da sua área
    </CardDescription>
  </CardHeader>
  <CardContent>
    {peiTeachers.map(teacher => (
      <Accordion key={teacher.id} type="single" collapsible>
        <AccordionItem value={teacher.id}>
          <AccordionTrigger>
            {teacher.subject} - {teacher.teacher_name}
            {teacher.is_primary && <Badge className="ml-2">Principal</Badge>}
          </AccordionTrigger>
          <AccordionContent>
            <TeacherContributionForm
              teacherId={teacher.id}
              subject={teacher.subject}
              peiId={peiId}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    ))}
  </CardContent>
</Card>
```

---

### 4. Dashboard do Professor

Mostrar PEIs onde ele é principal OU complementar:

```tsx
// Buscar PEIs
const { data: myPEIs } = await supabase
  .from('pei_teachers')
  .select(`
    *,
    peis(*, students(*))
  `)
  .eq('teacher_id', userId);

// Separar por tipo
const primaryPEIs = myPEIs.filter(pt => pt.is_primary);
const complementaryPEIs = myPEIs.filter(pt => !pt.is_primary);
```

---

## 📊 Exemplo de Interface

### Card de PEI com Professores

```
┌─────────────────────────────────────────────────────┐
│ 📋 PEI - João Silva                                │
│ 6º Ano A • Turno: Manhã                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 👨‍🏫 Equipe de Professores (4)                      │
│                                                     │
│ ⭐ Maria Santos (Principal) - Português             │
│ 📐 Carlos Oliveira - Matemática                     │
│ 🔬 Ana Costa - Ciências                            │
│ ⚽ Pedro Lima - Educação Física                     │
│                                                     │
│ [Gerenciar Professores]  [Visualizar PEI]          │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Permissões e Segurança

### Matriz de Permissões

| Ação | Professor Principal | Professor Complementar | Coordenador | Superadmin |
|------|-------------------|----------------------|-------------|------------|
| Ver PEI | ✅ | ✅ | ✅ | ✅ |
| Editar Diagnóstico | ✅ | ❌ | ✅ | ✅ |
| Editar Planejamento (geral) | ✅ | ❌ | ✅ | ✅ |
| Adicionar metas da disciplina | ✅ | ✅ | ✅ | ✅ |
| Adicionar estratégias | ✅ | ✅ | ✅ | ✅ |
| Avaliar progresso | ✅ | ✅ (na disciplina) | ✅ | ✅ |
| Adicionar professores | ❌ | ❌ | ✅ | ✅ |
| Remover professores | ❌ | ❌ | ✅ | ✅ |

---

## 🚀 Próximos Passos

### 1. Aplicar Migração ✅ CONCLUÍDO
```bash
# Via Supabase Dashboard - SQL Editor
# Executar: supabase/migrations/20250203000004_add_student_class_info_and_multiple_teachers.sql
```

### 2. Frontend - Prioridade Alta

- [ ] **Formulário de aluno**: Adicionar campos série, turma, turno
- [ ] **Lista de alunos**: Mostrar série e turma como badges
- [ ] **Dialog de gestão de professores**: Criar componente
- [ ] **Dashboard professor**: Separar PEIs principais vs complementares
- [ ] **Criar PEI**: Mostrar professores atribuídos

### 3. Frontend - Prioridade Média

- [ ] **Seção de contribuição por disciplina**: No formulário do PEI
- [ ] **Filtros**: Por série, turma, turno na lista de alunos
- [ ] **Relatórios**: Incluir informações de professores e turma
- [ ] **Notificações**: Avisar professores complementares quando são adicionados

### 4. UX/UI

- [ ] **Indicador visual**: Professor principal vs complementar
- [ ] **Badges de disciplina**: Coloridos por área
- [ ] **Timeline de contribuições**: Quem contribuiu o quê
- [ ] **Comparação**: Visão geral das contribuições por disciplina

---

## 💡 Benefícios da Solução

### Para Professores
✅ Colaboração real entre professores  
✅ Cada um contribui com expertise da sua área  
✅ Visão holística do aluno  
✅ Responsabilidade compartilhada  

### Para Coordenadores
✅ Gestão flexível da equipe docente  
✅ Atribuição por disciplina  
✅ Acompanhamento de contribuições  
✅ Relatórios mais completos  

### Para o Sistema
✅ Reflete realidade do Fundamental II  
✅ Dados organizados por turma/série  
✅ Escalável para qualquer número de professores  
✅ Retrocompatível com sistema atual  

---

## 📖 Documentação de Referência

- **Migração**: `supabase/migrations/20250203000004_add_student_class_info_and_multiple_teachers.sql`
- **Função get_pei_teachers**: Retorna lista de professores de um PEI
- **Função add_teacher_to_pei**: Adiciona professor a um PEI
- **Função remove_teacher_from_pei**: Remove professor de um PEI (exceto principal)
- **View peis_with_teachers**: Informações completas de PEIs com professores

---

**Status**: ✅ Migração pronta para aplicação  
**Próximo**: Implementar interfaces no frontend













