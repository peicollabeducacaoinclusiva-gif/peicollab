# 🚀 Guia Rápido: Implementar Múltiplos Professores

## Passo 1: Aplicar Migração (5 min)

### Via Supabase Dashboard
1. Acesse https://supabase.com/dashboard
2. Selecione projeto **pei-collab**
3. Vá para **SQL Editor**
4. Cole o conteúdo de: `supabase/migrations/20250203000004_add_student_class_info_and_multiple_teachers.sql`
5. Clique em **RUN**
6. Aguarde confirmação ✅

### Verificar se funcionou
Execute no SQL Editor:

```sql
-- Ver estrutura da nova tabela
SELECT * FROM pei_teachers LIMIT 5;

-- Ver novos campos em students
SELECT id, name, grade, class_name, shift FROM students LIMIT 5;

-- Testar função
SELECT * FROM get_pei_teachers('algum-pei-id-existente');
```

---

## Passo 2: Atualizar Dados Existentes (10 min)

### 2.1. Adicionar série/turma aos alunos

```sql
-- Exemplo: Atualizar alunos do 6º Ano
UPDATE students 
SET 
  grade = '6º Ano',
  class_name = 'A',
  shift = 'Manhã'
WHERE id IN (
  SELECT id FROM students 
  WHERE name LIKE '%algum filtro%'
  LIMIT 10
);

-- Verificar
SELECT name, grade, class_name, shift FROM students WHERE grade IS NOT NULL;
```

### 2.2. Adicionar professores complementares a PEIs existentes

```sql
-- Exemplo: Adicionar professor de Matemática a um PEI
SELECT add_teacher_to_pei(
  p_pei_id := 'uuid-do-pei',
  p_teacher_id := 'uuid-do-professor-matematica',
  p_subject := 'Matemática',
  p_is_primary := false
);

-- Verificar professores de um PEI
SELECT * FROM get_pei_teachers('uuid-do-pei');
```

---

## Passo 3: Frontend Mínimo (30 min)

### 3.1. Mostrar série/turma na lista de alunos

**Arquivo**: `src/pages/Students.tsx`

```tsx
// Na query de students, adicionar novos campos:
const { data: studentsData } = await supabase
  .from("students")
  .select(`
    *,
    grade,
    class_name,
    shift
  `);

// Na tabela, adicionar coluna:
<TableCell>
  <div className="flex flex-col gap-1">
    {student.grade && (
      <Badge variant="outline">{student.grade}</Badge>
    )}
    {student.class_name && (
      <Badge variant="secondary">Turma {student.class_name}</Badge>
    )}
    {student.shift && (
      <span className="text-xs text-muted-foreground">{student.shift}</span>
    )}
  </div>
</TableCell>
```

---

### 3.2. Criar componente básico de gestão de professores

**Novo arquivo**: `src/components/coordinator/ManagePEITeachersDialog.tsx`

```tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface PEITeacher {
  teacher_id: string;
  teacher_name: string;
  is_primary: boolean;
  subject: string;
}

interface Props {
  peiId: string;
  studentName: string;
}

export default function ManagePEITeachersDialog({ peiId, studentName }: Props) {
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<PEITeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTeachers();
    }
  }, [open, peiId]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_pei_teachers', {
        p_pei_id: peiId
      });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os professores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Professores ({teachers.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Equipe de Professores do PEI</DialogTitle>
          <p className="text-sm text-muted-foreground">Aluno: {studentName}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map((teacher) => (
              <div
                key={teacher.teacher_id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{teacher.teacher_name}</p>
                  <p className="text-sm text-muted-foreground">{teacher.subject || "Sem disciplina definida"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {teacher.is_primary && (
                    <Badge variant="default">Principal</Badge>
                  )}
                </div>
              </div>
            ))}
            
            {teachers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum professor atribuído ainda</p>
              </div>
            )}
          </div>
        )}

        {/* TODO: Adicionar formulário para adicionar professores */}
      </DialogContent>
    </Dialog>
  );
}
```

---

### 3.3. Integrar no Dashboard do Coordenador

**Arquivo**: `src/components/dashboards/CoordinatorDashboard.tsx`

```tsx
import ManagePEITeachersDialog from "@/components/coordinator/ManagePEITeachersDialog";

// Na lista de PEIs, adicionar botão:
<ManagePEITeachersDialog
  peiId={pei.id}
  studentName={pei.student_name}
/>
```

---

## Passo 4: Testar (10 min)

### Checklist de Testes

- [ ] **Migração aplicada com sucesso**
  ```sql
  SELECT COUNT(*) FROM pei_teachers;
  ```

- [ ] **Professores principais migrados**
  ```sql
  SELECT COUNT(*) FROM pei_teachers WHERE is_primary = true;
  ```

- [ ] **Alunos com série/turma**
  ```sql
  SELECT name, grade, class_name, shift FROM students LIMIT 5;
  ```

- [ ] **Dialog de professores abre**
  - Acessar dashboard coordenador
  - Clicar em "Professores (X)" em um PEI
  - Ver lista de professores

- [ ] **Adicionar professor complementar** (via SQL por enquanto)
  ```sql
  SELECT add_teacher_to_pei(
    'pei-uuid',
    'teacher-uuid',
    'Matemática',
    false
  );
  ```

- [ ] **Ver professor no dialog**
  - Atualizar dialog
  - Verificar se novo professor aparece

---

## 📊 Diagrama de Fluxo

```
Coordenador cria PEI
       ↓
Define professor principal (Português)
       ↓
[Opcional] Adiciona professores complementares
       │
       ├─→ Matemática
       ├─→ Ciências
       ├─→ História
       └─→ Ed. Física
       ↓
Todos os professores recebem acesso ao aluno
       ↓
Professor principal: preenche diagnóstico + planejamento geral
       ↓
Professores complementares: adicionam metas/estratégias da disciplina
       ↓
Todos avaliam progresso
```

---

## ⚠️ Importante

### Antes de aplicar em produção:

1. ✅ **Backup do banco**
   ```bash
   # Via Supabase Dashboard → Database → Backups
   ```

2. ✅ **Testar em desenvolvimento primeiro**
   - Aplicar migração
   - Testar queries
   - Verificar RLS

3. ✅ **Comunicar usuários**
   - Informar sobre nova funcionalidade
   - Treinar coordenadores
   - Preparar professores

4. ✅ **Monitorar após deploy**
   - Verificar logs de erro
   - Acompanhar performance
   - Coletar feedback

---

## 🆘 Troubleshooting

### Erro: "function get_pei_teachers does not exist"
**Solução**: Migração não foi aplicada corretamente. Reaplicar.

### Erro: "column grade does not exist"
**Solução**: Migração não incluiu alterações em students. Verificar SQL.

### Professores não aparecem no dialog
**Solução**: Verificar RLS policies. Testar com superadmin primeiro.

### Não consigo adicionar professor complementar
**Solução**: Verificar se usuário é coordenador ou superadmin. Testar via SQL primeiro.

---

## 📞 Suporte

- **Documentação completa**: `docs/MULTIPLOS_PROFESSORES_PEI.md`
- **Arquivo de migração**: `supabase/migrations/20250203000004_add_student_class_info_and_multiple_teachers.sql`
- **Issues**: Abrir no repositório do projeto

---

**Tempo estimado total**: ~55 minutos  
**Dificuldade**: Média  
**Impacto**: Alto 🚀


























