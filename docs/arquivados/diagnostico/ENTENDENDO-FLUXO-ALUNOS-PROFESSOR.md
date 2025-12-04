# 📚 Entendendo o Fluxo de Alunos do Professor

## 🎯 Pergunta: De onde vêm os alunos no Dashboard do Professor?

### Resposta Simples:
Os alunos vêm da **tabela `student_access`** - uma tabela de relacionamento que define **quais alunos cada professor tem permissão de acessar**.

---

## 🔄 Fluxo Completo Passo a Passo

### **1. Coordenador Atribui Alunos ao Professor**

```sql
-- Tabela: student_access
┌──────────────┬──────────────┬─────────────┐
│ id           │ user_id      │ student_id  │
├──────────────┼──────────────┼─────────────┤
│ uuid-1       │ prof-123     │ aluno-abc   │
│ uuid-2       │ prof-123     │ aluno-def   │
│ uuid-3       │ prof-456     │ aluno-ghi   │
└──────────────┴──────────────┴─────────────┘
```

**Como é feito:**
- Coordenador usa o Dashboard
- Atribui alunos específicos a cada professor
- Cria registros na tabela `student_access`

---

### **2. Professor Visualiza Dashboard**

**Query executada em `TeacherDashboard.tsx`:**
```typescript
const { data: studentsAccessData } = await supabase
  .from("student_access")
  .select(`student_id, students (id, name, date_of_birth)`)
  .eq("user_id", profile.id);
```

**Resultado:**
```javascript
[
  { student_id: "aluno-abc", students: { id: "aluno-abc", name: "João Silva", ... } },
  { student_id: "aluno-def", students: { id: "aluno-def", name: "Maria Santos", ... } }
]
```

**Visualização no Dashboard:**
```
┌─────────────────────────────────┐
│ 👨‍🎓 Meus Alunos                  │
├─────────────────────────────────┤
│ [J] João Silva                  │
│     12 anos                     │
├─────────────────────────────────┤
│ [M] Maria Santos                │
│     10 anos                     │
└─────────────────────────────────┘
```

---

### **3. Professor Clica no Aluno**

**Ação:**
```typescript
onClick={() => navigate(`/pei/new?studentId=${student.id}`)}
```

**URL gerada:**
```
http://localhost:8080/pei/new?studentId=aluno-abc
```

---

### **4. Página CreatePEI Carrega**

#### **Passo 4.1: Lê o parâmetro da URL**
```typescript
const studentIdFromUrl = searchParams.get("student") || searchParams.get("studentId");
// Resultado: "aluno-abc"
```

#### **Passo 4.2: Carrega lista de alunos disponíveis**
```typescript
const loadStudents = async () => {
  // Busca EXATAMENTE os mesmos alunos que o dashboard mostrou
  const { data: accessData } = await supabase
    .from("student_access")
    .select("student_id")
    .eq("user_id", profile.id);
  
  // Depois busca os dados completos
  const { data: studentsData } = await supabase
    .from("students")
    .select("id, name, date_of_birth, school_id, ...")
    .in("id", studentIds);
  
  setStudents(studentsData);  // ["aluno-abc", "aluno-def"]
}
```

#### **Passo 4.3: Seleciona automaticamente o aluno da URL**
```typescript
useEffect(() => {
  if (studentIdFromUrl && students.length > 0) {
    // Procura "aluno-abc" na lista ["aluno-abc", "aluno-def"]
    const student = students.find((s) => s.id === studentIdFromUrl);
    
    if (student) {
      setSelectedStudentId(studentIdFromUrl);  // Seleciona no dropdown
      setStudentData(student);                  // Preenche dados do aluno
    }
  }
}, [studentIdFromUrl, students]);
```

---

## 🐛 Por que pode NÃO estar funcionando?

### **Possíveis Causas:**

### **1. Aluno não tem entrada em `student_access`**
```sql
-- Se o aluno aparece no dashboard mas não no CreatePEI,
-- significa que há INCONSISTÊNCIA nos dados

-- Dashboard pode estar usando uma query diferente
-- ou há algum cache
```

### **2. Timing Issue**
```javascript
// O useEffect pode disparar ANTES dos alunos carregarem
// Por isso adicionamos a verificação: students.length > 0
```

### **3. ID não corresponde**
```javascript
// UUID do aluno pode estar diferente
// Dashboard mostra: "abc-123"
// URL passa: "abc-123"
// Banco retorna: "ABC-123" (case-sensitive?)
```

---

## 🔍 Como Debugar (Console do Navegador)

### **Logs adicionados agora:**

Quando você clicar em um aluno e abrir `/pei/new?studentId=xxx`, verá no console:

```javascript
📚 Carregando alunos para role: teacher
👥 Alunos com acesso (student_access): 5
✅ Alunos carregados: 5 
   [
     { id: "aluno-abc", name: "João Silva" },
     { id: "aluno-def", name: "Maria Santos" },
     ...
   ]
🔍 Tentando selecionar aluno da URL:
   {
     studentIdFromUrl: "aluno-abc",
     totalStudents: 5,
     studentIds: ["aluno-abc", "aluno-def", ...]
   }
✅ Aluno encontrado e selecionado: João Silva
```

### **Se NÃO encontrar:**
```javascript
⚠️ Aluno não encontrado na lista: aluno-xyz
```

E aparecerá um toast vermelho:
```
❌ Aluno não encontrado
   O aluno selecionado não está na sua lista de alunos atribuídos.
```

---

## ✅ Solução Implementada

### **Melhorias adicionadas:**

1. **Logs de debug detalhados** - Para você ver exatamente o que está acontecendo
2. **Toast explicativo** - Se aluno não for encontrado
3. **Suporte a `aee_teacher`** - Também usa `student_access`
4. **Mais campos carregados** - `mother_name`, `father_name`, `phone`, `email`
5. **Query melhorada para gestores** - Usa `school_id` se disponível

---

## 🧪 Como Testar

### **Teste 1: Verificar student_access**
```sql
-- No Supabase SQL Editor:
SELECT 
  sa.id,
  sa.user_id,
  p.full_name as professor,
  s.name as aluno
FROM student_access sa
JOIN profiles p ON p.id = sa.user_id
JOIN students s ON s.id = sa.student_id
WHERE sa.user_id = 'ID_DO_PROFESSOR';
```

### **Teste 2: Criar PEI via Dashboard**
1. Faça login como professor
2. Vá para o Dashboard
3. Na tab "Meus Alunos", clique em um aluno
4. **Abra o Console do navegador (F12)**
5. Veja os logs:
   - `📚 Carregando alunos...`
   - `✅ Alunos carregados: X`
   - `🔍 Tentando selecionar...`
   - `✅ Aluno encontrado...`

### **Teste 3: Verificar se selecionou**
- O dropdown de aluno deve mostrar o nome do aluno
- Os dados do aluno devem aparecer no card abaixo
- Você deve conseguir preencher e salvar o PEI

---

## 💡 Se AINDA não funcionar

### **Me envie os logs do console:**
```javascript
📚 Carregando alunos para role: ?
👥 Alunos com acesso (student_access): ?
✅ Alunos carregados: ?
🔍 Tentando selecionar aluno da URL: ?
```

### **Possíveis correções adicionais:**

1. **Verificar se há dados em `student_access`**
2. **Criar script para popular `student_access` automaticamente**
3. **Adicionar fallback se não houver `student_access`**

---

## 📝 Resumo

| Pergunta | Resposta |
|----------|----------|
| De onde vêm os alunos? | Tabela `student_access` |
| Por que não seleciona automaticamente? | Agora seleciona + tem logs |
| Como atribuir alunos? | Coordenador via Dashboard |
| Professores veem todos os alunos? | ❌ Apenas os atribuídos |

**Agora teste e me envie os logs do console!** 🔍


