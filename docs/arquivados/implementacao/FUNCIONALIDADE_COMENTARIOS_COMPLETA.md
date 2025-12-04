# 💬 Funcionalidade de Comentários - Sistema PEI-Collab

## ✅ **IMPLEMENTAÇÃO COMPLETA**

A funcionalidade de comentários agora está disponível para **todos os perfis**, permitindo colaboração rica sobre os PEIs.

---

## 👥 **Quem Pode Comentar e Ler**

| Perfil | Ler Comentários | Escrever Comentários | Local |
|--------|-----------------|----------------------|-------|
| **Professor** | ✅ Sim | ✅ Sim | Dashboard → Visualizar PEI |
| **Prof. AEE** | ✅ Sim | ✅ Sim | Dashboard → Ver e Comentar |
| **Coordenador** | ✅ Sim | ✅ Sim | PEIDetailDialog |
| **Especialista** | ✅ Sim | ✅ Sim | (via orientações) |
| **Família** | ✅ **Não** | ✅ Sim | FamilyPEIView (link de acesso) |
| **Gestor** | ✅ Sim | ✅ Sim | Dashboard |
| **Diretor** | ✅ Sim | ✅ Sim | Dashboard |

---

## 📍 **Onde Comentar - Por Perfil**

### 👨‍🏫 **Professor / Professor AEE**

#### **Local 1: Dashboard → Visualizar PEI**
```
Dashboard → Meus PEIs → [Clique no ícone 👁️] → Dialog com:
  - Visualização completa do PEI
  - Seção "Comentários e Colaboração"
  - Campo para adicionar comentário
  - Lista de todos os comentários
```

**Características:**
- ✅ Interface completa de comentários
- ✅ Vê quem comentou e quando
- ✅ Adiciona novos comentários
- ✅ Contador de comentários
- ✅ Avatar dos autores

#### **Local 2: Editar PEI** (Futuro)
```
Dashboard → Editar PEI → Aba "Comentários"
```
*Em implementação futura*

---

### 👔 **Coordenador**

#### **Local: PEI Detail Dialog**
```
Dashboard → Fila de PEIs → Ver Detalhes → 
  Seção "Comentários" (completa)
```

**Características:**
- ✅ Interface rica com textarea
- ✅ Lista completa de comentários
- ✅ Integrado com aprovação de PEI

---

### 👨‍👩‍👧 **Família**

#### **Local: Página de Acesso Familiar**
```
Link recebido por email → FamilyPEIView →
  Card "Seu Feedback"
```

**Características:**
- ✅ Campo de feedback
- ✅ Marcado como "[Família]"
- ❌ **NÃO vê** outros comentários (privacidade)
- ✅ Pode aprovar o PEI

---

## 🎨 **Interface do Professor (Nova)**

```
┌─────────────────────────────────────────────┐
│ 👁️ Visualização do PEI                      │
│ Visualização completa com comentários       │
├─────────────────────────────────────────────┤
│                                             │
│ [Conteúdo do PEI - ReportView]             │
│                                             │
├─────────────────────────────────────────────┤
│ 💬 Comentários e Colaboração         [2]   │
│                                             │
│ ┌─ Adicionar Comentário ─────────────────┐ │
│ │ ┌───────────────────────────────────┐  │ │
│ │ │ Compartilhe suas observações...   │  │ │
│ │ │                                   │  │ │
│ │ └───────────────────────────────────┘  │ │
│ │           [💬 Enviar Comentário]       │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ ┌─ João Silva · 04/11/2025 às 14:30 ────┐ │
│ │ Ótimo progresso! Sugiro reforçar...    │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ ┌─ Maria Santos · 03/11/2025 às 10:15 ──┐ │
│ │ Concordo com a abordagem proposta...   │ │
│ └────────────────────────────────────────┘ │
│                                             │
│                    [Fechar] [✏️ Editar PEI] │
└─────────────────────────────────────────────┘
```

---

## 📊 **Fluxo de Comentários**

### **Adicionar Comentário:**
```
1. Professor abre PEI
2. Digita comentário no campo
3. Clica "Enviar Comentário"
   ↓
4. INSERT em pei_comments
   ↓
5. Toast de sucesso
6. Lista atualiza automaticamente
7. Contador de não lidos atualiza no dashboard
```

### **Ler Comentários:**
```
1. Professor abre PEI
2. Vê todos os comentários anteriores
3. Identifica:
   - Quem comentou (nome + avatar)
   - Quando comentou (data/hora)
   - Conteúdo do comentário
```

---

## 🔧 **Implementação Técnica**

### **TeacherDashboard.tsx - Alterações:**

#### 1. **Estados Adicionados:**
```typescript
const [peiComments, setPeiComments] = useState<Comment[]>([]);
const [newComment, setNewComment] = useState("");
const [sendingComment, setSendingComment] = useState(false);
```

#### 2. **Função: loadPEIComments**
```typescript
const loadPEIComments = async (peiId: string) => {
  const { data, error } = await supabase
    .from("pei_comments")
    .select(`
      id, content, created_at, user_id,
      profiles (full_name)
    `)
    .eq("pei_id", peiId)
    .order("created_at", { ascending: false });
  
  setPeiComments(data || []);
};
```

#### 3. **Função: handleAddComment**
```typescript
const handleAddComment = async () => {
  const { error } = await supabase
    .from("pei_comments")
    .insert({
      pei_id: peiToView.id,
      student_id: peiToView.student_id,
      user_id: profile.id,
      content: newComment.trim(),
    });
  
  // Recarregar comentários e dados
  loadPEIComments(peiToView.id);
  loadData(); // Atualizar contador de não lidos
};
```

#### 4. **UI Adicionada ao Dialog:**
- Card destacado para adicionar comentário
- Textarea com placeholder descritivo
- Botão com loading state
- Lista de comentários com avatar e data
- Estado vazio amigável

---

## 🎯 **Benefícios dos Comentários**

### ✅ **Colaboração Multi-Perfil**
- Professores de diferentes disciplinas discutem
- Coordenador orienta e acompanha
- Especialistas dão parecer
- Família participa com feedback

### ✅ **Rastreabilidade**
- Histórico completo de conversas
- Data e hora de cada comentário
- Identificação do autor
- Não pode editar/deletar (auditoria)

### ✅ **Notificações**
- Contador de não lidos no dashboard
- Badge vermelho em PEIs com comentários novos
- Timeline com atividades recentes

### ✅ **Contexto Rico**
- Comentários ficam vinculados ao PEI
- Podem referenciar seções específicas
- Facilitam decisões colaborativas

---

## 📱 **Exemplo de Uso Real**

### **Cenário: Aluno com dificuldade em Matemática**

```
[Prof. João - Português] 04/11 14:30
"Observei que o aluno tem dificuldade com textos que envolvem 
números. Sugiro trabalho integrado com Matemática."

[Prof. Maria - Matemática] 04/11 16:45
"Concordo! Vou adaptar as atividades usando contextos literários 
que ele gosta. Podemos fazer um projeto sobre estatísticas de 
livros."

[Coordenadora Ana] 05/11 09:15
"Excelente integração! Vou acompanhar o progresso. Precisam 
de algum material específico?"

[Prof. João] 05/11 10:00
"Seria ótimo ter acesso a gráficos grandes impressos. 
O aluno responde melhor a recursos visuais."

[Família] 05/11 19:30
"Em casa ele adora contar seus livros e brinquedos. 
Podemos fazer algo similar?"

[Prof. Maria] 06/11 08:00
"Perfeito! Vou criar uma atividade de catalogação de biblioteca."
```

**Resultado:** Colaboração rica, decisões informadas, família envolvida! ✨

---

## 🚀 **Próximos Passos**

### ✅ **Já Funciona:**
1. Professores podem comentar via dialog de visualização
2. Sistema carrega e exibe todos os comentários
3. Contador de não lidos funciona

### 🔄 **Melhorias Futuras:**
1. Notificações em tempo real (websocket)
2. Menções (@usuario)
3. Anexar arquivos aos comentários
4. Filtrar comentários por autor
5. Responder comentários (threading)

---

## 🔐 **Segurança e Privacidade**

### ✅ **RLS (Row Level Security)**
- Comentários só visíveis para quem tem acesso ao PEI
- Família não vê comentários de outros (só envia)
- Professores veem comentários de professores + coordenação

### ✅ **Auditoria**
- Todos os comentários são imutáveis
- Histórico completo preservado
- Identificação do autor sempre presente

### ✅ **Validação**
- Comentário não pode ser vazio
- Deve ter user_id ou ser marcado como família
- Vinculado obrigatoriamente a um PEI

---

## 📞 **Teste Agora**

1. **Login como Professor João**
2. Vá em **Dashboard → Meus PEIs**
3. Clique no **ícone 👁️** de qualquer PEI
4. **Role até o final** → Veja "Comentários e Colaboração"
5. **Digite um comentário** → Clique "Enviar"
6. ✅ **Deve aparecer na lista!**

---

**Status:** ✅ Implementado e testado  
**Versão:** 2.0 (Multi-perfil)  
**Data:** 05/11/2025

