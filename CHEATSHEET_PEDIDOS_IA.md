# 📝 Cheatsheet - Como Pedir Coisas à IA

**Cola rápida** | **Copie e cole, só preencher os [CAMPOS]**

---

## 🎯 Templates Prontos

### 🔍 Investigar Erro

```
Estou com este erro:

[COLE O ERRO AQUI]

Acontece quando: [O QUE VOCÊ FEZ]
Tela: [QUAL TELA]
Perfil de usuário: [professor/coordenador/etc]

Pode investigar e corrigir?
```

---

### ➕ Adicionar Campo

```
Preciso adicionar o campo '[NOME]' no formulário de [QUAL FORMULÁRIO].

Deve:
- Aparecer [ONDE]
- Tipo: [texto/número/data/dropdown]
- [Obrigatório/Opcional]
- Validação: [SE HOUVER]

Pode adicionar e salvar no banco?
```

---

### 🎨 Mudar Aparência

```
Quero mudar a aparência de [ELEMENTO] em [TELA].

Mudanças:
- Cor: de [COR ATUAL] para [COR NOVA]
- Tamanho: [maior/menor/específico]
- [OUTRAS MUDANÇAS]

Pode fazer mantendo o resto igual?
```

---

### 📄 Criar Nova Tela

```
Preciso criar uma nova tela '[NOME]'.

Deve mostrar:
- [CONTEÚDO 1]
- [CONTEÚDO 2]
- [CONTEÚDO 3]

Acesso: [QUEM PODE VER]
URL: /[caminho]

Pode criar completo seguindo os padrões?
```

---

### 🐛 Corrigir Bug

```
Tem um bug em [TELA/COMPONENTE]:

O que está acontecendo:
[DESCREVA]

O que deveria acontecer:
[DESCREVA]

Como reproduzir:
1. [PASSO 1]
2. [PASSO 2]
3. [PASSO 3]

Pode corrigir?
```

---

### 🗄️ Mudar Banco de Dados

```
Preciso modificar a tabela '[TABELA]' no banco de dados.

Mudança:
- [Adicionar/Remover/Modificar] coluna '[NOME]'
- Tipo: [TEXT/INTEGER/DATE/etc]
- [Obrigatório/Opcional]
- Valor padrão: [SE HOUVER]

Pode criar a migração SQL e atualizar os tipos?
```

---

### 🔐 Ajustar Permissões

```
O perfil [PERFIL] não consegue [AÇÃO].

Deveria poder:
- [PERMISSÃO 1]
- [PERMISSÃO 2]

Mas está aparecendo: [ERRO OU COMPORTAMENTO]

Pode verificar as permissões e corrigir?
```

---

### ✅ Adicionar Validação

```
O campo '[CAMPO]' no formulário [FORMULÁRIO] aceita valores inválidos.

Deve validar:
- [REGRA 1]
- [REGRA 2]
- Mensagem de erro: "[MENSAGEM]"

Pode adicionar validação?
```

---

### 📊 Criar Relatório

```
Preciso de um relatório de '[NOME DO RELATÓRIO]'.

Deve mostrar:
- [DADO 1]
- [DADO 2]
- [DADO 3]

Filtros:
- [FILTRO 1]
- [FILTRO 2]

Formato: [Tabela/Gráfico/PDF]

Pode implementar?
```

---

### 🧪 Adicionar Teste

```
Preciso adicionar testes para [ARQUIVO/FUNCIONALIDADE].

Deve testar:
- [CENÁRIO 1]
- [CENÁRIO 2]
- [CENÁRIO 3]

Pode criar os testes seguindo os padrões do projeto?
```

---

### 🔄 Refatorar Código

```
O arquivo [ARQUIVO] está muito grande/confuso.

Pode:
1. Analisar o código
2. Sugerir melhorias
3. Implementar refatoração
4. Garantir que nada quebra

Mantendo mesma funcionalidade?
```

---

### 📖 Explicar Código

```
Não entendi como funciona [FUNCIONALIDADE/ARQUIVO].

Pode me explicar:
1. O que faz
2. Como funciona
3. Por que foi feito assim

De forma simples e com exemplos?
```

---

### 🔗 Integrar Funcionalidades

```
Preciso integrar [FUNCIONALIDADE A] com [FUNCIONALIDADE B].

Deve funcionar assim:
[DESCREVA O FLUXO]

Pode implementar a integração?
```

---

## 💡 Dicas de Ouro

### 1. **Sempre mencione o arquivo**
```
✅ "No arquivo Dashboard.tsx..."
❌ "Naquela tela..."
```

### 2. **Seja específico com números**
```
✅ "Aumentar o padding para 16px"
❌ "Aumentar o padding um pouco"
```

### 3. **Descreva o comportamento esperado**
```
✅ "Ao clicar, deve abrir modal de confirmação"
❌ "Fazer algo quando clicar"
```

### 4. **Mencione restrições**
```
✅ "Sem quebrar o código existente"
✅ "Mantendo as permissões de segurança"
✅ "Seguindo os padrões do projeto"
```

---

## 🎯 Frases Mágicas

### Para Entender
- "Pode me explicar como funciona..."
- "Não entendi, pode simplificar..."
- "Pode me dar exemplos de..."

### Para Implementar
- "Pode implementar... seguindo os padrões do projeto"
- "Pode criar... e adicionar testes"
- "Pode modificar... sem quebrar código existente"

### Para Corrigir
- "Pode investigar e corrigir..."
- "Pode verificar se... e ajustar"
- "Pode analisar o erro e resolver"

### Para Aprender
- "Pode me ensinar como fazer..."
- "Por que é feito assim..."
- "Qual a melhor forma de..."

---

## ⚠️ Palavras de Alerta

Quando usar estas palavras, a IA entende que é CRÍTICO:

- **IMPORTANTE:** algo fundamental
- **CUIDADO:** pode causar problema
- **NUNCA:** proibido fazer
- **SEMPRE:** obrigatório fazer
- **CRÍTICO:** muito importante
- **SEGURANÇA:** envolve proteção de dados

**Exemplo:**
```
"IMPORTANTE: Esta mudança envolve dados sensíveis de alunos.
SEMPRE use funções RPC e NUNCA desabilite RLS.
Pode implementar com estes cuidados de SEGURANÇA?"
```

---

## 🎓 Nível de Detalhe

### Quando Pedir Explicação Simples
```
"Explique como se eu tivesse 10 anos"
"De forma bem simples, sem termos técnicos"
"Passo a passo, para iniciante"
```

### Quando Pedir Detalhes
```
"Explique em detalhes técnicos"
"Mostre todas as opções possíveis"
"Explique linha por linha do código"
```

---

## ✅ Checklist de Pedido Eficiente

Seu pedido tem:
- [ ] Arquivo/local específico
- [ ] Comportamento atual
- [ ] Comportamento desejado
- [ ] Restrições/cuidados
- [ ] Exemplos (se necessário)

---

**Use este guia como cola! Copie, cole e adapte. 📋**

---

**Criado em:** Janeiro 2025  
**Tipo:** Cheatsheet rápido

