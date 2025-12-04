# 🤖 Manual de Programação Assistida por IA - PEI Collab

**Para:** Não-programadores que darão continuidade ao sistema  
**Versão:** 3.1.0  
**Última Atualização:** Janeiro 2025

---

## 🎯 Objetivo deste Manual

Este manual ensina **como manter e desenvolver o sistema PEI Collab usando IA** (Inteligência Artificial), mesmo sem ser programador. Você aprenderá a "conversar" com a IA de forma eficiente para fazer mudanças, corrigir problemas e adicionar funcionalidades.

---

## 📚 PARTE 1: Entendendo o Projeto

### O Que É o PEI Collab?

O **PEI Collab** é um sistema educacional que funciona como um **monorepo** (vários sistemas em um só lugar):

```
pei-collab/
├── apps/               → 9 aplicações (sistemas independentes)
├── packages/           → 9 pacotes compartilhados (código reutilizado)
├── supabase/           → Banco de dados e funções
├── tests/              → Testes automatizados
├── docs/               → Esta documentação
└── scripts/            → Scripts auxiliares
```

### 9 Aplicações do Sistema

1. **PEI Collab** (principal) - Criação de PEIs
2. **Gestão Escolar** - Alunos, professores, turmas
3. **Plano de AEE** - Planos de atendimento especializado
4. **Landing Page** - Página inicial
5. **Blog** - Sistema de conteúdo
6. **Atividades** - Gestão de atividades
7. **Planejamento** - Planejamento pedagógico
8. **Portal Responsável** - Para famílias
9. **Transporte/Merenda** - Gestão escolar

### Tecnologias Usadas (Conceitos Simples)

| Tecnologia | O Que É | Para Que Serve |
|------------|---------|----------------|
| **React** | Biblioteca JavaScript | Cria a interface do usuário (telas) |
| **TypeScript** | JavaScript com tipos | Evita erros, código mais seguro |
| **Supabase** | Banco de dados + Backend | Armazena dados e gerencia usuários |
| **Vite** | Ferramenta de build | Transforma código para o navegador |
| **Tailwind CSS** | Framework de CSS | Estiliza as telas |
| **pnpm** | Gerenciador de pacotes | Instala bibliotecas |

---

## 🗺️ PARTE 2: Estrutura do Código

### Onde Está Cada Coisa?

#### 📁 `apps/pei-collab/src/` (Aplicação Principal)

```
src/
├── pages/          → Páginas (telas completas)
│   ├── Dashboard.tsx    (Painel principal)
│   ├── CreatePEI.tsx    (Criar PEI)
│   └── Auth.tsx         (Login)
│
├── components/     → Componentes (partes reutilizáveis)
│   ├── pei/            (Componentes de PEI)
│   ├── dashboards/     (Painéis por perfil)
│   └── shared/         (Componentes compartilhados)
│
├── hooks/          → Hooks (lógica reutilizável)
│   ├── useAuth.ts       (Autenticação)
│   ├── usePermissions.ts (Permissões)
│   └── usePEIVersioning.ts (Versionamento)
│
├── services/       → Serviços (lógica de negócio)
│   ├── peiVersioningService.ts
│   └── peiCollaborationService.ts
│
├── lib/            → Utilitários (funções auxiliares)
│   ├── supabaseClient.ts
│   ├── validation.ts
│   └── utils.ts
│
└── types/          → Tipos TypeScript (definições)
    └── pei.ts
```

#### 📁 `supabase/` (Banco de Dados)

```
supabase/
├── migrations/     → Mudanças no banco de dados (SQL)
└── functions/      → Funções serverless (backend)
```

---

## 💬 PARTE 3: Como Conversar com a IA

### Regras de Ouro

#### ✅ SEMPRE Faça

1. **Seja Específico**
   ```
   ❌ Ruim: "Arruma o login"
   ✅ Bom: "O botão de login na página Auth.tsx não está funcionando quando clico. 
           Preciso que verifique se há erros no console e corrija."
   ```

2. **Dê Contexto**
   ```
   ❌ Ruim: "Adiciona campo"
   ✅ Bom: "Preciso adicionar um campo 'telefone' no formulário de criação de PEI
           (CreatePEI.tsx), logo abaixo do campo 'email'. O campo deve validar
           formato brasileiro (XX) XXXXX-XXXX."
   ```

3. **Mencione Arquivos e Localização**
   ```
   ✅ Bom: "No arquivo apps/pei-collab/src/pages/Dashboard.tsx, linha 45,
           está dando erro..."
   ```

4. **Explique o Comportamento Esperado**
   ```
   ✅ Bom: "Quando o coordenador clicar em 'Aprovar PEI', o status deve mudar
           de 'pending' para 'approved' e uma notificação deve ser enviada
           ao professor."
   ```

#### ❌ NUNCA Faça

1. **Não seja vago**
   ```
   ❌ "Faz funcionar"
   ❌ "Tá dando erro"
   ❌ "Conserta isso"
   ```

2. **Não assuma que a IA lembra de tudo**
   ```
   ❌ "Faz igual você fez ontem"
   ❌ "Aquela coisa que a gente falou"
   ```

3. **Não peça para fazer várias coisas de uma vez**
   ```
   ❌ "Adiciona campo, muda cor, corrige erro, atualiza banco"
   ✅ Peça uma coisa por vez
   ```

---

## 🎓 PARTE 4: Conceitos-Chave que Você Precisa Entender

### 1. **Componentes React**

Um componente é uma "peça" da interface.

```typescript
// Exemplo de componente simples
export function MeuBotao() {
  return <button>Clique Aqui</button>
}
```

**Como pedir mudanças:**
```
"No componente PEIQueueTable.tsx, quero mudar a cor do botão 'Aprovar'
para verde e adicionar um ícone de check."
```

### 2. **Estados (Status) do PEI**

O PEI tem uma "máquina de estados":

```
draft → pending → approved
          ↓
      returned → draft
```

**NUNCA:**
- Edite um PEI com status `approved`
- Pule etapas da máquina de estados

**Como pedir mudanças:**
```
"Preciso adicionar um novo status 'em_revisao' entre 'pending' e 'approved'.
A máquina de estados deve ser: draft → pending → em_revisao → approved."
```

### 3. **Permissões e Roles**

O sistema tem 8 perfis de usuário:

1. **superadmin** - Acesso total
2. **education_secretary** - Secretário de educação
3. **school_director** - Diretor
4. **coordinator** - Coordenador
5. **teacher** - Professor
6. **aee_teacher** - Professor AEE
7. **specialist** - Especialista
8. **family** - Família

**SEMPRE use funções RPC para verificar permissões:**
```typescript
// ✅ Correto
const { data } = await supabase.rpc('user_can_access_pei', {
  pei_id: peiId,
  user_id: userId
});

// ❌ NUNCA faça SELECT direto
const { data } = await supabase.from('peis').select('*'); // ERRADO!
```

### 4. **RLS (Row Level Security)**

RLS é uma **segurança automática** do banco de dados. Cada usuário só vê seus próprios dados.

**NUNCA desative RLS em produção!**

---

## 🛠️ PARTE 5: Tarefas Comuns e Como Pedir

### 1. Adicionar um Campo em um Formulário

**Exemplo de pedido à IA:**
```
"Preciso adicionar um campo 'observações' no formulário de criação de PEI
(arquivo: apps/pei-collab/src/pages/CreatePEI.tsx).

O campo deve:
- Aparecer na seção de 'Diagnóstico'
- Ser um campo de texto longo (textarea)
- Ser opcional
- Salvar no banco de dados na coluna 'diagnosis_data.observations'

Pode fazer isso respeitando os padrões do código existente?"
```

### 2. Corrigir um Erro

**Exemplo de pedido à IA:**
```
"Estou com um erro na tela de Dashboard. Quando faço login como professor,
aparece a mensagem: 'Cannot read property 'name' of undefined'.

O erro aparece no console do navegador na linha 120 do arquivo Dashboard.tsx.

Pode investigar e corrigir?"
```

### 3. Mudar a Aparência (Estilo)

**Exemplo de pedido à IA:**
```
"No componente PEIQueueTable.tsx, quero mudar:
- Cor do cabeçalho da tabela para azul escuro (#1e40af)
- Adicionar sombra nos cards
- Aumentar o espaçamento entre as linhas

Mantendo o restante do layout."
```

### 4. Adicionar uma Nova Funcionalidade

**Exemplo de pedido à IA:**
```
"Preciso adicionar um botão 'Duplicar PEI' na página de listagem de PEIs
(PEIs.tsx).

Ao clicar:
1. Deve abrir um modal de confirmação
2. Ao confirmar, deve criar um novo PEI copiando todos os dados do PEI original
3. O novo PEI deve ter status 'draft'
4. Deve criar uma versão inicial no histórico

Pode implementar isso seguindo os padrões de segurança do sistema?"
```

### 5. Modificar o Banco de Dados

**Exemplo de pedido à IA:**
```
"Preciso adicionar uma coluna 'data_nascimento_responsavel' na tabela 'students'.

A coluna deve:
- Ser do tipo DATE
- Ser opcional (NULL permitido)
- Ter um comentário: 'Data de nascimento do responsável'

Por favor, crie a migração SQL adequada em supabase/migrations/ e atualize
os tipos TypeScript correspondentes."
```

### 6. Adicionar Validação

**Exemplo de pedido à IA:**
```
"No formulário de cadastro de aluno (StudentForm.tsx), preciso adicionar
validação para o campo 'email':

- Deve ser um email válido
- Não pode ser vazio
- Deve mostrar mensagem de erro abaixo do campo se inválido
- A mensagem deve ser: 'Por favor, insira um email válido'

Use a biblioteca de validação Zod que já está configurada no projeto."
```

---

## ⚠️ PARTE 6: O QUE NUNCA FAZER

### 🔴 PROIBIDO - Questões de Segurança

#### 1. **NUNCA desabilite RLS**
```sql
❌ ALTER TABLE students DISABLE ROW LEVEL SECURITY;
```

#### 2. **NUNCA faça SELECT direto em tabelas sensíveis**
```typescript
❌ const { data } = await supabase.from('students').select('*');
✅ const { data } = await supabase.rpc('get_student_safe', { student_id });
```

#### 3. **NUNCA permita UPDATE em PEI aprovado**
```typescript
❌ if (pei.status === 'approved') { 
     await supabase.from('peis').update({ ... })
   }
```

#### 4. **NUNCA exponha senhas ou tokens**
```typescript
❌ console.log(password);
❌ console.log(SUPABASE_KEY);
```

### 🔴 PROIBIDO - Questões de Dados

#### 5. **NUNCA delete dados sem backup**
```sql
❌ DELETE FROM students; -- SEM WHERE!
```

#### 6. **NUNCA pule a máquina de estados**
```typescript
❌ pei.status = 'approved'; // Pulou 'pending'!
✅ Sempre seguir: draft → pending → approved
```

#### 7. **NUNCA modifique tipos de dados sem migração**
```sql
❌ ALTER TABLE students ALTER COLUMN cpf TYPE INTEGER; // Sem migração!
```

---

## 📖 PARTE 7: Guia de Comandos

### Comandos Básicos (Terminal)

```bash
# Instalar dependências (quando baixar o projeto)
pnpm install

# Rodar o sistema localmente
pnpm dev

# Rodar apenas o app principal
pnpm dev:pei

# Testar se está funcionando
pnpm test

# Ver cobertura de testes
pnpm test:coverage

# Verificar erros de código
pnpm lint

# Verificar tipos TypeScript
pnpm type-check

# Criar build para produção
pnpm build
```

### Como Usar os Comandos

1. Abra o terminal (PowerShell no Windows)
2. Navegue até a pasta do projeto:
   ```bash
   cd C:\workspace\Inclusao\pei-collab
   ```
3. Execute o comando desejado

---

## 🎨 PARTE 8: Padrões do Projeto

### 1. **Como os Arquivos São Nomeados**

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| **Componentes** | PascalCase | `CreatePEI.tsx`, `Dashboard.tsx` |
| **Hooks** | useCamelCase | `useAuth.ts`, `usePermissions.ts` |
| **Serviços** | camelCase | `peiVersioningService.ts` |
| **Utilitários** | camelCase | `utils.ts`, `validation.ts` |
| **Tipos** | PascalCase | `PEI`, `Student`, `UserRole` |

### 2. **Estrutura de um Componente React**

```typescript
// Sempre começa com imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Interface define os dados
interface MeuComponenteProps {
  nome: string;
  idade: number;
}

// Componente em si
export function MeuComponente({ nome, idade }: MeuComponenteProps) {
  // Estados (dados que mudam)
  const [contador, setContador] = useState(0);

  // Função que faz algo
  const clicar = () => {
    setContador(contador + 1);
  };

  // O que aparece na tela
  return (
    <div>
      <h1>Olá {nome}, você tem {idade} anos</h1>
      <p>Contador: {contador}</p>
      <Button onClick={clicar}>Clique Aqui</Button>
    </div>
  );
}
```

### 3. **Estrutura de uma Página**

Páginas são componentes "grandes" que ficam em `src/pages/`:

```typescript
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function MinhaTelaExemplo() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Se não está logado, redireciona
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container">
      <h1>Minha Tela</h1>
      {/* Conteúdo aqui */}
    </div>
  );
}
```

---

## 🔍 PARTE 9: Como Investigar Problemas

### Passo 1: Identificar o Erro

#### No Navegador
1. Abra o navegador (Chrome recomendado)
2. Pressione `F12` para abrir DevTools
3. Vá na aba "Console"
4. Procure mensagens de erro em vermelho

#### No Terminal
Erros aparecem no terminal onde você rodou `pnpm dev`

### Passo 2: Anotar Informações

Quando encontrar um erro, anote:
- ✅ **Mensagem de erro completa**
- ✅ **Arquivo e linha** (ex: Dashboard.tsx:120)
- ✅ **O que você estava fazendo** (clicou onde, preencheu o quê)
- ✅ **Perfil de usuário** (professor, coordenador, etc.)

### Passo 3: Perguntar à IA

**Exemplo de pedido bem formulado:**
```
"Estou com o seguinte erro no Console do navegador:

'TypeError: Cannot read property 'full_name' of null at Dashboard.tsx:120'

Contexto:
- Arquivo: apps/pei-collab/src/pages/Dashboard.tsx
- Linha: 120
- O que aconteceu: Fiz login como professor e a tela travou
- Perfil: teacher

Pode investigar e corrigir? Acho que o problema é que o usuário não tem
'full_name' definido no perfil."
```

---

## 🚀 PARTE 10: Exemplos Práticos

### Exemplo 1: Mudando um Texto

**Situação:** Quer mudar o título "Bem-vindo" para "Olá"

**Pedido à IA:**
```
"No arquivo apps/pei-collab/src/pages/Dashboard.tsx, encontre onde está
escrito 'Bem-vindo' e mude para 'Olá'. Mantenha o resto igual."
```

### Exemplo 2: Adicionando um Botão

**Situação:** Quer adicionar botão "Imprimir" no topo da lista de PEIs

**Pedido à IA:**
```
"Na página PEIs.tsx (apps/pei-collab/src/pages/PEIs.tsx), quero adicionar
um botão 'Imprimir Lista' no canto superior direito, ao lado do botão
'Novo PEI'.

O botão deve:
- Ter ícone de impressora
- Chamar a função window.print() ao clicar
- Ter estilo azul (igual aos outros botões primários)

Pode implementar?"
```

### Exemplo 3: Corrigindo uma Validação

**Situação:** O CPF aceita valores inválidos

**Pedido à IA:**
```
"No arquivo apps/pei-collab/src/lib/validation.ts, a função validateCPF()
está aceitando CPFs inválidos como '111.111.111-11'.

Pode verificar a lógica de validação do dígito verificador e corrigir?
Depois, adicione testes em validation.test.ts para garantir que CPFs
inválidos sejam rejeitados."
```

### Exemplo 4: Adicionando uma Nova Tela

**Situação:** Quer criar uma página de relatórios personalizados

**Pedido à IA:**
```
"Preciso criar uma nova página 'Relatórios Personalizados' no sistema.

Requisitos:
- Arquivo: apps/pei-collab/src/pages/CustomReports.tsx
- Rota: /reports/custom
- Acesso: Apenas coordenadores e diretores
- Conteúdo:
  * Título: 'Relatórios Personalizados'
  * Filtros: Data início, Data fim, Escola
  * Botão: 'Gerar Relatório'
  * Tabela: Listar PEIs do período selecionado

Pode criar a página completa seguindo os padrões do projeto?"
```

### Exemplo 5: Integrando com o Banco de Dados

**Situação:** Quer buscar lista de alunos de uma escola

**Pedido à IA:**
```
"Preciso buscar todos os alunos de uma escola específica.

Requisitos:
- Usar função RPC do Supabase (NUNCA SELECT direto)
- A função deve respeitar RLS (segurança)
- Retornar: id, nome, data_nascimento, turma
- Ordenar por nome

Pode:
1. Verificar se já existe uma função RPC adequada
2. Se não existir, criar a função SQL em supabase/migrations/
3. Criar o serviço TypeScript para chamar a função
4. Adicionar testes

?"
```

---

## 📋 PARTE 11: Checklist Antes de Fazer Mudanças

### Antes de Pedir Mudanças à IA

- [ ] Entendi o que quero mudar?
- [ ] Sei qual arquivo precisa ser modificado?
- [ ] Entendi como a mudança afeta outras partes?
- [ ] A mudança respeita as regras de segurança?
- [ ] Fiz backup ou estou em uma branch separada?

### Depois da IA Fazer Mudanças

- [ ] Testei a mudança localmente (`pnpm dev`)?
- [ ] Rodei os testes (`pnpm test`)?
- [ ] Verifiquei se não quebrou outras partes?
- [ ] Li o código que a IA gerou?
- [ ] Entendi o que foi feito?

---

## 🎯 PARTE 12: Fluxo de Trabalho Recomendado

### Passo a Passo para Fazer uma Mudança

#### 1. **Planejar**
- O que quero mudar?
- Por quê?
- Onde está no código?

#### 2. **Pedir à IA**
```
"Preciso [AÇÃO] no [ARQUIVO].

A mudança deve fazer [COMPORTAMENTO ESPERADO].

Requisitos:
- [REQUISITO 1]
- [REQUISITO 2]
- [REQUISITO 3]

Pode implementar seguindo os padrões do projeto?"
```

#### 3. **Revisar**
- Leia o código gerado
- Entenda o que foi feito
- Pergunte se não entender algo

#### 4. **Testar**
```bash
# Testar localmente
pnpm dev

# Abrir no navegador
http://localhost:8080

# Testar a mudança manualmente
# Executar testes automatizados
pnpm test
```

#### 5. **Salvar (Commit)**
```bash
git add .
git commit -m "feat: adiciona [DESCRIÇÃO DA MUDANÇA]"
```

---

## 📚 PARTE 13: Glossário de Termos

| Termo | O Que Significa | Exemplo |
|-------|-----------------|---------|
| **Component** | Peça reutilizável da interface | Botão, Card, Formulário |
| **Hook** | Função que adiciona lógica | useAuth, usePermissions |
| **State** | Dados que podem mudar | Contador, lista de alunos |
| **Props** | Dados passados para componente | `<Botao texto="Clique">` |
| **RPC** | Função remota no banco | `user_can_access_pei()` |
| **RLS** | Segurança automática do banco | Usuário só vê seus dados |
| **Migration** | Mudança no banco de dados | Adicionar coluna, tabela |
| **TypeScript** | JavaScript com tipos | Evita erros, mais seguro |
| **Interface** | Definição de estrutura | `interface Student { name: string }` |

---

## 🆘 PARTE 14: Troubleshooting Comum

### Problema 1: "pnpm não é reconhecido"

**Solução:**
```bash
npm install -g pnpm
```

### Problema 2: "Erro ao instalar dependências"

**Solução:**
```bash
# Limpar cache
pnpm store prune

# Tentar novamente
pnpm install --force
```

### Problema 3: "Página não carrega (tela branca)"

**Como pedir ajuda à IA:**
```
"A página está carregando uma tela branca. No console do navegador
aparece o erro: [COPIE O ERRO AQUI].

Pode investigar?"
```

### Problema 4: "Erro de permissão no banco"

**Como pedir ajuda à IA:**
```
"Estou tentando salvar um PEI mas aparece erro:
'new row violates row-level security policy'

O usuário é um professor (role: teacher) tentando criar PEI para
aluno da sua escola.

Pode verificar as políticas RLS e corrigir?"
```

### Problema 5: "Testes falhando"

**Como pedir ajuda à IA:**
```
"Rodei 'pnpm test' e 5 testes estão falhando:
[COPIE A SAÍDA DO TERMINAL]

Pode investigar e corrigir os testes?"
```

---

## 📖 PARTE 15: Recursos de Aprendizado

### Documentação do Projeto

1. **Índice Principal:** `docs/INDICE_DOCUMENTACAO.md`
2. **Análise do Projeto:** `docs/06-analises-avaliacoes/ANALISE_COMPLETA.md`
3. **Guia de Desenvolvimento:** `docs/desenvolvimento/README.md`
4. **Arquitetura:** `docs/desenvolvimento/02_ARQUITETURA_SISTEMA.md`

### Documentação Externa

- **React:** https://react.dev/learn
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Supabase:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

### Como Aprender no Projeto

**Pergunte à IA:**
```
"Pode me explicar como funciona o componente [NOME] em [ARQUIVO]?
Explique linha por linha de forma simples."
```

---

## 🎓 PARTE 16: Dicas Avançadas

### 1. **Explorando o Código**

**Como pedir à IA:**
```
"Quero entender como funciona o sistema de versionamento de PEI.
Pode me explicar:
1. Onde está implementado?
2. Quais arquivos estão envolvidos?
3. Como funciona o fluxo?
Explique de forma simples."
```

### 2. **Refatorando Código**

**Como pedir à IA:**
```
"O arquivo Dashboard.tsx está muito grande (700 linhas). Pode:
1. Analisar o código
2. Sugerir uma forma de dividir em componentes menores
3. Implementar a refatoração mantendo tudo funcionando?"
```

### 3. **Adicionando Funcionalidade Complexa**

**Como pedir à IA:**
```
"Preciso implementar um sistema de notificações em tempo real.

Requisitos:
- Notificações aparecem no canto superior direito
- Tipos: sucesso, erro, info, aviso
- Auto-fecham após 5 segundos
- Podem ser fechadas manualmente

Pode:
1. Verificar se já existe algo similar
2. Se não, implementar do zero
3. Integrar com o sistema de toasts existente
4. Adicionar testes

Explique cada passo conforme implementa."
```

---

## 🛡️ PARTE 17: Segurança e Boas Práticas

### Regras de Segurança (SEMPRE siga)

#### 1. **Sempre use Funções RPC para Dados Sensíveis**
```typescript
✅ await supabase.rpc('user_can_access_pei', { pei_id, user_id })
❌ await supabase.from('peis').select('*')
```

#### 2. **Sempre Valide Entradas**
```typescript
✅ const emailSchema = z.string().email();
❌ Aceitar qualquer entrada sem validar
```

#### 3. **Sempre Respeite a Máquina de Estados**
```typescript
✅ draft → pending → approved
❌ draft → approved (pulou etapa!)
```

#### 4. **Sempre Teste Após Mudanças**
```bash
pnpm test
pnpm test:coverage
```

### Como Pedir à IA para Seguir as Regras

```
"IMPORTANTE: Esta mudança envolve dados sensíveis de alunos.
Por favor, certifique-se de:
1. Usar funções RPC (NUNCA SELECT direto)
2. Respeitar RLS
3. Validar todas as entradas
4. Adicionar testes de segurança

Pode implementar seguindo estas regras?"
```

---

## 📝 PARTE 18: Templates de Pedidos à IA

### Template 1: Nova Funcionalidade

```
"Preciso implementar [FUNCIONALIDADE].

Contexto:
- Onde: [ARQUIVO ou PASTA]
- Quem usa: [PERFIL DE USUÁRIO]
- Quando: [SITUAÇÃO]

Requisitos:
1. [REQUISITO 1]
2. [REQUISITO 2]
3. [REQUISITO 3]

Restrições:
- [RESTRIÇÃO 1]
- [RESTRIÇÃO 2]

Pode implementar seguindo os padrões do projeto?"
```

### Template 2: Correção de Bug

```
"Encontrei um bug em [ARQUIVO].

Erro:
[MENSAGEM DE ERRO COMPLETA]

Como reproduzir:
1. [PASSO 1]
2. [PASSO 2]
3. [PASSO 3]

Comportamento atual:
[O QUE ESTÁ ACONTECENDO]

Comportamento esperado:
[O QUE DEVERIA ACONTECER]

Pode investigar e corrigir?"
```

### Template 3: Mudança no Banco de Dados

```
"Preciso modificar o banco de dados.

Tabela: [NOME DA TABELA]
Mudança: [ADICIONAR/REMOVER/MODIFICAR COLUNA]

Especificações:
- Nome da coluna: [NOME]
- Tipo: [TEXT/INTEGER/DATE/etc]
- Obrigatório: [SIM/NÃO]
- Valor padrão: [SE APLICÁVEL]

Por favor:
1. Crie a migração SQL
2. Atualize os tipos TypeScript
3. Verifique se não quebra código existente
4. Adicione comentário no SQL explicando a mudança"
```

### Template 4: Mudança Visual (CSS)

```
"Preciso mudar o visual de [COMPONENTE].

Mudanças:
- [MUDANÇA 1: cor, tamanho, espaçamento, etc]
- [MUDANÇA 2]
- [MUDANÇA 3]

Arquivo: [CAMINHO DO ARQUIVO]

Mantendo: [O QUE NÃO DEVE MUDAR]

Pode fazer usando Tailwind CSS (classes já no projeto)?"
```

---

## 🎯 PARTE 19: Metas e Métricas

### Como Saber se Está Indo Bem?

#### Métricas de Qualidade

| Métrica | Como Verificar | Meta |
|---------|----------------|------|
| **Testes passando** | `pnpm test` | 100% ✅ |
| **Cobertura** | `pnpm test:coverage` | 70%+ ✅ |
| **Erros de lint** | `pnpm lint` | 0 ❌ |
| **Erros de tipo** | `pnpm type-check` | 0 ❌ |

#### Como Pedir à IA para Melhorar

```
"Rodei 'pnpm test:coverage' e a cobertura está em 65%.
Pode adicionar testes para aumentar para 70%+?"
```

```
"'pnpm lint' está mostrando 15 erros.
Pode corrigir todos os erros de linting?"
```

---

## 📞 PARTE 20: Quando Pedir Ajuda

### Sinais de que Precisa de Ajuda da IA

1. ❓ Não entendo o erro
2. ❓ Não sei onde está o código
3. ❓ Não sei como implementar algo
4. ❓ Os testes estão falhando
5. ❓ O sistema não está rodando

### Como Formular o Pedido

**Estrutura ideal:**
```
1. Contexto (o que você está tentando fazer)
2. Problema (o que está dando errado)
3. Evidências (erros, mensagens, comportamento)
4. Objetivo (o que você quer alcançar)
5. Restrições (o que não pode mudar)
```

**Exemplo completo:**
```
CONTEXTO:
Estou tentando adicionar um campo "telefone do responsável" no cadastro
de alunos.

PROBLEMA:
Quando salvo o aluno, o campo não é salvo no banco de dados.

EVIDÊNCIAS:
- Adicionei o campo no formulário (StudentForm.tsx)
- O campo aparece na tela
- Mas quando busco o aluno depois, o telefone está vazio
- No console não aparece erro

OBJETIVO:
O campo deve ser salvo corretamente no banco de dados e aparecer quando
eu editar o aluno.

RESTRIÇÕES:
- Não pode quebrar o formulário existente
- Deve validar formato de telefone brasileiro
- Deve ser opcional (não obrigatório)

Pode investigar e implementar corretamente?"
```

---

## ✅ PARTE 21: Checklist de Manutenção

### Semanalmente

- [ ] Rodar `pnpm dev` e verificar se tudo funciona
- [ ] Rodar `pnpm test` e garantir que testes passam
- [ ] Verificar se há atualizações de dependências
- [ ] Fazer backup do banco de dados

### Mensalmente

- [ ] Revisar logs de erros
- [ ] Atualizar documentação se necessário
- [ ] Verificar métricas de performance
- [ ] Revisar segurança

### Antes de Deploy

- [ ] Todos os testes passando
- [ ] Cobertura de testes acima de 70%
- [ ] Lint sem erros
- [ ] Type-check sem erros
- [ ] Testado em ambiente local
- [ ] Backup do banco criado

---

## 🎉 Conclusão

Você agora tem um **guia completo** para manter e desenvolver o sistema PEI Collab com ajuda de IA.

### Lembre-se:

✅ **Seja específico** nos pedidos  
✅ **Dê contexto** completo  
✅ **Teste sempre** após mudanças  
✅ **Siga as regras de segurança**  
✅ **Peça explicações** quando não entender  
✅ **Mantenha a documentação atualizada**  

### A IA é sua parceira, mas você é responsável por:
- Entender o que está sendo feito
- Tomar decisões
- Garantir qualidade
- Manter segurança

---

## 📞 Referências Rápidas

### Documentação
- [Índice Completo](docs/INDICE_DOCUMENTACAO.md)
- [Guia de Desenvolvimento](docs/desenvolvimento/README.md)
- [Análise do Projeto](docs/06-analises-avaliacoes/ANALISE_COMPLETA.md)

### Comandos Essenciais
```bash
pnpm install    # Instalar
pnpm dev        # Rodar
pnpm test       # Testar
pnpm build      # Build
```

### Arquivos Importantes
- `apps/pei-collab/src/pages/` - Telas
- `apps/pei-collab/src/components/` - Componentes
- `apps/pei-collab/src/hooks/` - Lógica reutilizável
- `supabase/migrations/` - Banco de dados

---

**Criado em:** Janeiro 2025  
**Para:** Desenvolvimento assistido por IA  
**Versão do Projeto:** 3.1.0

**Boa sorte! 🚀**

