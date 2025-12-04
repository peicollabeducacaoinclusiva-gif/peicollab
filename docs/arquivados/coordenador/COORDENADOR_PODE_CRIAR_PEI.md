# ✅ NOVA FUNCIONALIDADE: Coordenador Cria PEI Diretamente

## 🎯 **Situação Especial Implementada**

Coordenadores agora podem **criar e preencher PEIs diretamente** em situações especiais, sem precisar atribuir a um professor imediatamente.

---

## 📍 **Quando Usar**

### ✅ **Situações Apropriadas:**
1. **Urgência** - PEI precisa ser criado urgentemente e não há professor disponível
2. **Professor ausente** - Professor está de licença/afastado
3. **Caso complexo** - Coordenador conhece melhor o histórico do aluno
4. **Transição** - Aluno novo na escola, ainda sem professor definido
5. **Reorganização** - Mudança de turma/professor em andamento

### ❌ **Quando NÃO Usar:**
- Rotina normal (sempre atribua a um professor)
- Para "adiantar trabalho" sem necessidade
- Se há professor disponível e capaz

---

## 🚀 **Como Funciona**

### **Fluxo Normal (Atribuir a Professor):**
```
Coordenador → "Solicitar PEI"
  ↓
Seleciona Aluno
  ↓
Seleciona Professor
  ↓
Clica "Solicitar PEI"
  ↓
✅ PEI criado e atribuído
  ↓
Professor preenche e desenvolve
```

### **Novo Fluxo (Situação Especial):**
```
Coordenador → "Solicitar PEI"
  ↓
☑️ MARCA "Criar e preencher PEI diretamente"
  ↓
Seleciona APENAS o Aluno
  ↓
Clica "Criar e Preencher"
  ↓
Redireciona para /pei/new
  ↓
✅ Coordenador preenche todo o PEI
  ↓
Pode atribuir professor depois (se necessário)
```

---

## 📋 **Passo a Passo Visual**

### **1️⃣ Dashboard do Coordenador**
```
┌────────────────────────────────────────┐
│  📊 Dashboard - Coordenador            │
├────────────────────────────────────────┤
│                                        │
│  [➕ Solicitar PEI]  [👥 Professores]  │
│                                        │
└────────────────────────────────────────┘
         ↑
  Clique aqui
```

### **2️⃣ Dialog: Escolher Modo**
```
┌─ Criar Novo PEI ───────────────────────┐
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ ℹ️ ☑️ Criar e preencher PEI      │  │
│ │      diretamente (situação       │  │
│ │      especial)                    │  │
│ └──────────────────────────────────┘  │
│                                        │
│ Aluno *                                │
│ ┌──────────────────────────────────┐  │
│ │ Selecione um aluno              ▼│  │
│ └──────────────────────────────────┘  │
│                                        │
│ ⚠️ Situação Especial:                 │
│ Você será redirecionado para           │
│ preencher todo o PEI.                  │
│                                        │
│         [Cancelar] [Criar e Preencher] │
└────────────────────────────────────────┘
```

### **3️⃣ Página de Criar PEI**
```
Redireciona automaticamente para:
/pei/new?student={aluno_id}

Coordenador preenche:
- ✅ Identificação
- ✅ Diagnóstico
- ✅ Planejamento
- ✅ Encaminhamentos
- ✅ Salva ou envia
```

---

## 🎨 **Interface Atualizada**

### **Checkbox de Situação Especial:**
```
┌────────────────────────────────────────┐
│ ℹ️ Informação                           │
├────────────────────────────────────────┤
│ ☑️ Criar e preencher PEI diretamente   │
│    (situação especial)                 │
└────────────────────────────────────────┘
```

**Quando MARCADO:**
- ✅ Campo "Professor" **desaparece**
- ✅ Aviso de situação especial aparece
- ✅ Botão muda para "Criar e Preencher"
- ✅ Descrição muda para "Você irá criar e preencher o PEI diretamente"

**Quando DESMARCADO (Padrão):**
- ✅ Campo "Professor" aparece (obrigatório)
- ✅ Botão é "Solicitar PEI"
- ✅ Descrição é "Selecione um aluno e atribua um professor"

---

## 💡 **Diferenças entre os Modos**

| Aspecto | Modo Normal | Modo Direto |
|---------|-------------|-------------|
| **Quem preenche** | Professor | Coordenador |
| **assigned_teacher_id** | ID do professor | NULL |
| **Ação imediata** | Cria PEI vazio | Redireciona para preencher |
| **Acesso ao aluno** | Cria student_access | Não cria (coordenador vê todos) |
| **Status inicial** | draft | draft |
| **Responsável** | Professor | Coordenador |

---

## 🔧 **Alterações Técnicas**

### **RequestPEIDialog.tsx:**

#### 1. **Novo estado:**
```typescript
const [createDirectly, setCreateDirectly] = useState(false);
const navigate = useNavigate();
```

#### 2. **Lógica no handleSubmit:**
```typescript
if (createDirectly) {
  if (!selectedStudentId) {
    toast({ title: "Campo obrigatório", ... });
    return;
  }
  
  // Redirecionar para página de criar PEI
  navigate(`/pei/new?student=${selectedStudentId}`);
  setOpen(false);
  return;
}

// Continua com lógica normal de atribuir a professor...
```

#### 3. **UI com checkbox:**
- Checkbox para ativar modo direto
- Campo de professor condicional (`!createDirectly && ...`)
- Alerta de situação especial quando marcado
- Botão dinâmico ("Criar e Preencher" vs "Solicitar PEI")

---

### **CreatePEI.tsx:**

#### 1. **Lógica de assigned_teacher_id:**
```typescript
// Coordenadores podem criar PEI sem professor atribuído
const assignedTeacherId = (primaryRole === "coordinator" || primaryRole === "education_secretary") 
  ? null  // Coordenador pode criar sem atribuir
  : profile.id;  // Professor se auto-atribui

const peiData = {
  ...
  assigned_teacher_id: assignedTeacherId,
  ...
};
```

#### 2. **Benefício:**
- Coordenadores podem criar PEI sem precisar ter student_access
- PEI fica "sem professor" até ser atribuído manualmente depois
- Coordenador vê todos os alunos da escola/tenant

---

## 📊 **Cenários de Uso Real**

### **Cenário 1: Professor de Licença**
```
Situação: Prof. João está de licença médica por 30 dias
Solução:
1. Coordenadora marca "Criar diretamente"
2. Seleciona aluno Débora
3. Preenche o PEI com base em reunião com outros professores
4. Salva como rascunho
5. Quando João voltar, atribui a ele para continuar
```

### **Cenário 2: Aluno Novo na Escola**
```
Situação: Carlos transferido de outra escola
Solução:
1. Coordenadora recebe histórico do aluno
2. Marca "Criar diretamente"
3. Preenche PEI com informações do histórico
4. Aguarda definição de turma/professor
5. Depois atribui ao professor responsável
```

### **Cenário 3: Urgência de Encaminhamento**
```
Situação: Especialista precisa de PEI para avaliação HOJE
Solução:
1. Coordenadora marca "Criar diretamente"
2. Preenche rapidamente com informações disponíveis
3. Submete para validação
4. Atribui professor para completar depois
```

---

## ⚙️ **Atribuir Professor Depois**

Quando coordenador criar direto, pode atribuir professor depois via:

### **Opção 1: RequestPEIDialog (Modo Normal)**
```sql
-- Se aluno JÁ tem PEI, RequestPEIDialog atualiza o assigned_teacher_id
UPDATE peis 
SET assigned_teacher_id = 'professor_id'
WHERE student_id = 'aluno_id' 
AND is_active_version = true;
```

### **Opção 2: Editar PEI Manualmente**
*Futura funcionalidade para alterar professor atribuído na interface*

---

## 🔐 **Permissões e Segurança**

### ✅ **Quem Pode Criar Diretamente:**
- Coordenadores (`coordinator`)
- Secretários de Educação (`education_secretary`)

### ❌ **Quem NÃO Pode:**
- Professores (sempre se auto-atribuem)
- Família (não tem acesso)
- Gestores (usam fluxo normal)

### ✅ **RLS Garantido:**
- Coordenador vê todos os alunos da escola/tenant
- PEI criado fica visível para coordenador
- Quando atribuir professor, este terá acesso via student_access

---

## 📝 **Validações**

### **No Dialog:**
| Modo | Campo Aluno | Campo Professor | Validação |
|------|-------------|-----------------|-----------|
| Normal | Obrigatório | Obrigatório | Ambos devem estar selecionados |
| Direto | Obrigatório | Oculto | Apenas aluno deve estar selecionado |

### **No CreatePEI:**
| Role | assigned_teacher_id | Pode Salvar? |
|------|---------------------|--------------|
| Teacher | profile.id (obrigatório) | ✅ Sim |
| Coordinator | NULL (permitido) | ✅ Sim |
| AEE Teacher | profile.id (obrigatório) | ✅ Sim |

---

## 🎊 **Resumo das Alterações**

| Arquivo | Alteração | Linhas |
|---------|-----------|--------|
| **RequestPEIDialog.tsx** | ✅ Checkbox "Criar diretamente" | 340-362 |
| | ✅ Estado `createDirectly` | 55 |
| | ✅ Lógica de redirecionamento | 152-169 |
| | ✅ Campo professor condicional | 390-416 |
| | ✅ Alerta de situação especial | 424-432 |
| | ✅ Botão dinâmico | 438 |
| **CreatePEI.tsx** | ✅ assigned_teacher_id condicional | 430-441 |
| | ✅ Null para coordenadores | 433 |

---

## ✨ **Benefícios**

### ✅ **Flexibilidade**
- Coordenador não bloqueado por falta de professor
- Pode agir rapidamente em emergências
- Mantém fluxo normal para 95% dos casos

### ✅ **Rastreabilidade**
- `created_by` sempre registra quem criou
- `assigned_teacher_id` mostra se foi atribuído
- Histórico completo preservado

### ✅ **Qualidade**
- Coordenador pode preencher com qualidade
- Não depende de professor sobrecarregado
- Informações iniciais mais precisas

### ✅ **Controle**
- Coordenador decide quando é situação especial
- Não muda fluxo padrão
- Opção clara e visível

---

## 🧪 **Como Testar**

### **Teste 1: Criar Diretamente**
1. Login como **Coordenador**
2. Dashboard → Clique **"Solicitar PEI"**
3. ☑️ **Marque** "Criar e preencher PEI diretamente"
4. Selecione um **aluno**
5. Note que **campo de professor desaparece**
6. Clique **"Criar e Preencher"**
7. ✅ Deve abrir página `/pei/new` com aluno selecionado
8. Preencha o PEI normalmente
9. Salve como rascunho
10. ✅ PEI criado sem `assigned_teacher_id`

### **Teste 2: Modo Normal (Controle)**
1. Login como **Coordenador**
2. Dashboard → Clique **"Solicitar PEI"**
3. **NÃO marque** o checkbox
4. Selecione um **aluno**
5. Selecione um **professor**
6. Clique **"Solicitar PEI"**
7. ✅ PEI criado e atribuído ao professor
8. ✅ Professor vê o aluno na lista

### **Teste 3: Atribuir Depois**
1. Após criar diretamente (Teste 1)
2. No dashboard, clique **"Solicitar PEI"** novamente
3. Selecione o **mesmo aluno**
4. Selecione um **professor**
5. Clique **"Solicitar PEI"**
6. ✅ Sistema detecta PEI existente
7. ✅ Atualiza `assigned_teacher_id`
8. ✅ Professor recebe acesso

---

## 🔍 **Verificação no Banco**

### **Ver PEIs sem Professor:**
```sql
SELECT 
  s.name as aluno,
  p.status,
  prof.full_name as criado_por,
  p.assigned_teacher_id as professor_atribuido,
  p.created_at
FROM peis p
JOIN students s ON s.id = p.student_id
JOIN profiles prof ON prof.id = p.created_by
WHERE p.assigned_teacher_id IS NULL
  AND p.is_active_version = true
ORDER BY p.created_at DESC;
```

### **Ver PEIs Criados por Coordenador:**
```sql
SELECT 
  s.name as aluno,
  p.status,
  coord.full_name as coordenador,
  prof.full_name as professor_atribuido,
  p.created_at
FROM peis p
JOIN students s ON s.id = p.student_id
JOIN profiles coord ON coord.id = p.created_by
JOIN user_roles ur ON ur.user_id = coord.id
LEFT JOIN profiles prof ON prof.id = p.assigned_teacher_id
WHERE ur.role = 'coordinator'
  AND p.is_active_version = true
ORDER BY p.created_at DESC;
```

---

## ⚠️ **Observações Importantes**

### **1. Professor pode ser atribuído depois:**
- Use o botão "Solicitar PEI" novamente
- Selecione o mesmo aluno
- Sistema detecta PEI existente e atualiza

### **2. PEI sem professor aparece para:**
- ✅ Coordenador (criador)
- ✅ Gestores da escola
- ❌ Professores (até ser atribuído)

### **3. Status do PEI:**
- Criado sempre como **"draft"**
- Coordenador pode submeter quando pronto
- Segue fluxo normal de aprovação

### **4. student_access:**
- **NÃO é criado** quando coordenador cria diretamente
- Coordenador não precisa (vê todos da escola)
- **É criado** quando professor for atribuído

---

## 📊 **Estatísticas e Monitoramento**

### **Dashboard do Coordenador Mostra:**
- Total de PEIs criados
- PEIs sem professor atribuído
- PEIs por status
- PEIs criados por ele mesmo vs. por professores

### **SQL para Monitorar:**
```sql
-- PEIs criados por coordenador que ainda não têm professor
SELECT COUNT(*) as peis_sem_professor
FROM peis p
JOIN profiles prof ON prof.id = p.created_by
JOIN user_roles ur ON ur.user_id = prof.id
WHERE ur.role = 'coordinator'
  AND p.assigned_teacher_id IS NULL
  AND p.is_active_version = true;
```

---

## 🚀 **Próximas Melhorias**

### **Interface para Atribuir Depois:**
```
Dashboard Coordenador → Lista de PEIs
↓
PEIs sem professor destacados
↓
Botão "Atribuir Professor"
↓
Dialog simples: selecionar professor
↓
✅ Professor atribuído
```

### **Notificação:**
```
Quando PEI for atribuído a professor:
- Email/notificação para o professor
- "Você foi atribuído ao PEI de [Aluno]"
```

### **Relatório:**
```
Dashboard → Relatórios
↓
"PEIs Criados Diretamente por Coordenadores"
- Quantos
- Quais
- Status
- Tempo até atribuição de professor
```

---

## ✅ **Status da Implementação**

| Funcionalidade | Status |
|----------------|--------|
| Checkbox "Criar diretamente" | ✅ Implementado |
| Condicional campo professor | ✅ Implementado |
| Redirecionamento | ✅ Implementado |
| Botão dinâmico | ✅ Implementado |
| Alerta de situação especial | ✅ Implementado |
| Validação condicional | ✅ Implementado |
| CreatePEI aceita coordenador | ✅ Implementado |
| assigned_teacher_id NULL | ✅ Permitido |
| Limpeza de estado | ✅ Implementado |

---

## 📖 **Exemplo Real**

### **História: Escola Municipal Exemplo**

**Contexto:**
- Aluna nova transferida de outra cidade
- Laudo médico complexo precisa ser registrado
- Definição de turma/professor ainda em andamento
- Reunião com especialistas agendada para semana que vem

**Ação da Coordenadora:**
1. ☑️ Marca "Criar diretamente"
2. Seleciona a aluna
3. Preenche PEI com:
   - Histórico do laudo médico
   - Diagnósticos conhecidos
   - Encaminhamentos urgentes
4. Salva como rascunho
5. Compartilha com especialistas
6. Após reunião, atribui ao professor definido
7. Professor continua o planejamento pedagógico

**Resultado:**
- ✅ Informações críticas registradas rapidamente
- ✅ Especialistas têm dados para reunião
- ✅ Professor recebe PEI já com diagnóstico
- ✅ Nenhuma informação perdida na transição

---

## 🎯 **Conclusão**

Esta funcionalidade adiciona **flexibilidade essencial** para o trabalho do coordenador, mantendo a **qualidade e rastreabilidade** do sistema.

**Recomendação de Uso:**  
Use com moderação. O fluxo normal (atribuir a professor) deve ser a regra.  
Esta opção é para **situações especiais**, não para rotina.

---

**Implementado em:** 05/11/2025  
**Testado:** ✅ Sim  
**Em Produção:** ✅ Pronto  
**Nível de Risco:** 🟢 Baixo

