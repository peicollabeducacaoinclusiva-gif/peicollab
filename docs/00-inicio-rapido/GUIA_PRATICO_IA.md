# 🎯 Guia Prático - Como Trabalhar com IA no PEI Collab

**Versão Simplificada** | **Formato: Perguntas e Respostas**

---

## ❓ Perguntas Frequentes

### 1. "Quero mudar um texto na tela. Como faço?"

**Passo 1:** Identifique onde está o texto
- Abra o navegador (F12 → Console)
- Procure o texto na tela

**Passo 2:** Pergunte à IA
```
"Quero mudar o texto '[TEXTO ATUAL]' para '[TEXTO NOVO]' 
na tela [NOME DA TELA].

Pode encontrar onde está e mudar?"
```

**Exemplo real:**
```
"Quero mudar o texto 'Bem-vindo ao PEI Collab' para 'Olá, Professor!'
na tela de Dashboard.

Pode encontrar onde está e mudar?"
```

---

### 2. "Como adiciono um campo novo em um formulário?"

**Pergunte à IA:**
```
"Preciso adicionar um campo '[NOME DO CAMPO]' no formulário de [FORMULÁRIO].

O campo deve:
- Aparecer [ONDE: no início, no fim, depois de X]
- Ser do tipo [texto, número, data, etc]
- Ser [obrigatório/opcional]
- [OUTRAS ESPECIFICAÇÕES]

Pode adicionar e salvar no banco de dados?"
```

**Exemplo real:**
```
"Preciso adicionar um campo 'Telefone de Emergência' no formulário
de cadastro de aluno.

O campo deve:
- Aparecer logo abaixo do campo 'Telefone'
- Ser do tipo texto
- Validar formato brasileiro: (XX) XXXXX-XXXX
- Ser opcional

Pode adicionar e salvar no banco de dados?"
```

---

### 3. "Como mudo a cor ou aparência de algo?"

**Pergunte à IA:**
```
"Quero mudar a aparência de [ELEMENTO] em [TELA/COMPONENTE].

Mudanças:
- Cor: [NOVA COR]
- Tamanho: [MAIOR/MENOR]
- Espaçamento: [MAIS/MENOS]

Arquivo: [SE SOUBER]

Pode fazer mantendo o restante igual?"
```

**Exemplo real:**
```
"Quero mudar a aparência do botão 'Criar PEI' no Dashboard.

Mudanças:
- Cor: azul escuro para verde
- Tamanho: um pouco maior
- Adicionar ícone de '+' antes do texto

Pode fazer?"
```

---

### 4. "Como adiciono uma nova tela?"

**Pergunte à IA:**
```
"Preciso criar uma nova tela '[NOME DA TELA]'.

A tela deve:
- Mostrar [O QUÊ]
- Ter acesso [QUEM PODE VER]
- Conter [ELEMENTOS: tabela, formulário, etc]

URL: /[caminho]

Pode criar a tela completa?"
```

**Exemplo real:**
```
"Preciso criar uma nova tela 'Relatórios Mensais'.

A tela deve:
- Mostrar lista de relatórios do mês atual
- Ter filtro por escola
- Conter tabela com: data, tipo, status
- Botão para gerar novo relatório

Apenas coordenadores e diretores podem acessar.
URL: /reports/monthly

Pode criar a tela completa?"
```

---

### 5. "Como corrijo um erro?"

**Passo 1:** Copie o erro completo

**Passo 2:** Pergunte à IA
```
"Estou com este erro:

[COLE O ERRO AQUI]

O erro acontece quando:
[DESCREVA O QUE VOCÊ FEZ]

Pode investigar e corrigir?"
```

**Exemplo real:**
```
"Estou com este erro:

TypeError: Cannot read property 'name' of undefined
  at Dashboard.tsx:120

O erro acontece quando:
1. Faço login como professor
2. A tela do Dashboard carrega
3. Erro aparece no console

Pode investigar e corrigir?"
```

---

## 🎨 Mudanças Comuns

### Mudar Cores

**Cores principais do sistema:**
- Azul: `#3b82f6` (primário)
- Verde: `#10b981` (sucesso)
- Vermelho: `#ef4444` (erro)
- Amarelo: `#f59e0b` (aviso)

**Exemplo de pedido:**
```
"Quero mudar a cor dos botões primários de azul para verde no
componente [NOME].

Pode fazer isso mantendo acessibilidade?"
```

### Adicionar Validação

**Tipos comuns:**
- CPF válido
- Email válido
- Telefone brasileiro
- Data válida
- CEP válido

**Exemplo de pedido:**
```
"O campo 'CEP' no formulário de aluno não está validando.
Aceita qualquer valor.

Pode adicionar validação para formato brasileiro XXXXX-XXX
e mostrar mensagem de erro se inválido?"
```

### Mudar Comportamento

**Exemplo de pedido:**
```
"Quando salvo um PEI, ele salva como 'pending' automaticamente.
Quero que salve como 'draft' e só mude para 'pending' quando
eu clicar em 'Enviar para Aprovação'.

Pode ajustar este comportamento?"
```

---

## 🔧 Problemas Comuns e Soluções

### Problema: "Não consigo rodar o sistema"

**Pergunte à IA:**
```
"Tentei rodar 'pnpm dev' mas deu erro:

[COLE O ERRO]

Pode me ajudar a configurar o ambiente?"
```

### Problema: "Tela branca ao abrir o sistema"

**Pergunte à IA:**
```
"O sistema carrega uma tela branca. No console (F12) aparece:

[COLE O ERRO]

Pode investigar?"
```

### Problema: "Não consigo fazer login"

**Pergunte à IA:**
```
"Tento fazer login com email [EMAIL] mas não funciona.
Mensagem de erro: [MENSAGEM]

Pode verificar:
1. Se o usuário existe no banco
2. Se as permissões estão corretas
3. Se há problema na autenticação?"
```

### Problema: "Mudança não aparece na tela"

**Pergunte à IA:**
```
"Fiz uma mudança no arquivo [ARQUIVO] mas não aparece na tela.

O que mudei:
[DESCREVA]

O servidor está rodando (pnpm dev).

Pode verificar se:
1. O arquivo correto foi modificado
2. Precisa recarregar a página
3. Há erro de sintaxe?"
```

---

## 📚 Glossário Visual

### Front-end vs Back-end

```
FRONT-END (O que você vê)
├── Páginas (screens)
├── Botões
├── Formulários
├── Tabelas
└── Cores e estilos

BACK-END (O que não vê)
├── Banco de dados
├── Autenticação
├── Validações
├── Regras de negócio
└── Segurança (RLS)
```

### Componente vs Página

```
PÁGINA (tela completa)
├── Dashboard.tsx
├── CreatePEI.tsx
└── Auth.tsx

COMPONENTE (parte reutilizável)
├── Button.tsx (botão)
├── Input.tsx (campo de texto)
└── Card.tsx (cartão)
```

### Props vs State

```
PROPS (dados que vem de fora)
<Botao texto="Clique" cor="azul" />
       ↑         ↑
    props     props

STATE (dados que mudam internamente)
const [contador, setContador] = useState(0);
       ↑              ↑
     state      função para mudar
```

---

## 🎯 Exemplos do Dia a Dia

### Cenário 1: Adicionar Campo "Observações"

**Você quer:** Campo de observações no PEI

**Pergunte:**
```
"No formulário de PEI (CreatePEI.tsx), seção de Diagnóstico,
quero adicionar um campo 'Observações Gerais'.

Deve ser:
- Texto longo (textarea)
- Opcional
- Salvar em diagnosis_data.general_observations
- Aparecer antes do botão 'Salvar'

Pode implementar?"
```

### Cenário 2: Criar Relatório de Alunos

**Você quer:** Página com lista de alunos por turma

**Pergunte:**
```
"Preciso criar uma página 'Alunos por Turma'.

Deve mostrar:
- Dropdown para selecionar turma
- Tabela com: Nome, Idade, Status
- Botão 'Exportar para Excel'
- Total de alunos no rodapé

Apenas coordenadores podem acessar.
URL: /reports/students-by-class

Pode criar completo?"
```

### Cenário 3: Corrigir Permissão

**Você percebe:** Professor não consegue ver seus alunos

**Pergunte:**
```
"Professores não estão conseguindo ver a lista de seus alunos.

Quando tentam acessar /students, aparece lista vazia.

No console aparece: 'RLS policy violation'

Pode:
1. Verificar as políticas RLS da tabela students
2. Verificar se professores têm vínculo com a escola
3. Corrigir as permissões?"
```

---

## 🚀 Primeiros Passos

### Dia 1: Familiarização

1. **Rode o sistema:**
   ```bash
   cd C:\workspace\Inclusao\pei-collab
   pnpm install
   pnpm dev
   ```

2. **Explore as telas:**
   - Faça login com diferentes perfis
   - Clique em todos os botões
   - Veja o que cada tela faz

3. **Pergunte à IA:**
   ```
   "Pode me dar um tour completo do sistema?
   Explique o que faz cada aplicação e como elas se conectam."
   ```

### Dia 2: Primeira Mudança Simples

1. **Escolha algo pequeno:**
   - Mudar um texto
   - Mudar uma cor
   - Adicionar um campo simples

2. **Peça à IA passo a passo**

3. **Teste imediatamente**

### Dia 3: Entendendo o Código

**Pergunte à IA:**
```
"Pode me explicar como funciona o Dashboard?
Explique de forma simples, linha por linha se necessário."
```

---

## 📖 Aprendizado Contínuo

### Toda Vez que Fizer uma Mudança

1. ✅ Leia o código que a IA gerou
2. ✅ Pergunte o que não entender
3. ✅ Documente mudanças importantes
4. ✅ Teste antes de aceitar

### Perguntas Para Aprender

```
"Pode me explicar o que é [CONCEITO] de forma simples?"
"Pode me mostrar exemplos de como usar [FUNCIONALIDADE]?"
"Por que é importante fazer [PRÁTICA]?"
```

---

## ✅ Checklist Final

Antes de cada mudança:
- [ ] Entendi o que quero fazer
- [ ] Formulei um pedido claro à IA
- [ ] Tenho backup do código

Depois de cada mudança:
- [ ] Testei localmente
- [ ] Entendi o que foi feito
- [ ] Documentei se necessário
- [ ] Fiz commit com mensagem clara

---

**Você consegue! A IA está aqui para ajudar. 🚀**

---

**Criado em:** Janeiro 2025  
**Formato:** Guia prático e acessível

