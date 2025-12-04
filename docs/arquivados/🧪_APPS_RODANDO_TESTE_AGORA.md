# 🧪 APPS RODANDO - TESTE AGORA!

**Data**: 10/11/2025  
**Status**: ✅ 4 Apps iniciados em background  

---

## 🚀 APPS DISPONÍVEIS

### 1️⃣ Blog Educacional ✨ NOVO!
**Porta**: 5178  
**URL**: http://localhost:5178

**O que testar:**
- ✅ Ver posts na página inicial
- ✅ Clicar em "Leia mais" para ver post completo
- ✅ Fazer login como admin
- ✅ Dashboard administrativo
- ✅ Criar novo post com editor rich text
- ✅ Publicar/despublicar posts
- ✅ Categorias funcionando

---

### 2️⃣ Gestão Escolar - HUB CENTRAL 🏢
**Porta**: 5174  
**URL**: http://localhost:5174

**O que testar:**
- ✅ Dashboard com novas cards:
  - Usuários
  - Importação
  - Exportação
- ✅ **Página /users** - Gestão centralizada de usuários
- ✅ **Página /import** - Wizard de importação em 5 etapas
- ✅ **Página /export** - Exportar dados (Educacenso, CSV, etc)
- ✅ **Tema claro/escuro** - Toggle no header
- ✅ Todas as 6 páginas com tema consistente

**Rotas principais:**
- `/` - Dashboard
- `/students` - Alunos
- `/professionals` - Profissionais
- `/classes` - Turmas
- `/subjects` - Disciplinas
- `/users` - **NOVO!** Gestão de usuários
- `/import` - **NOVO!** Importação em lote
- `/export` - **NOVO!** Exportação de dados

---

### 3️⃣ PEI Collab - COM USERSELECTOR 👥
**Porta**: 8080  
**URL**: http://localhost:8080

**O que testar:**
- ✅ **Login funcionando** (sem travar!)
- ✅ Dashboard → Criar novo PEI
- ✅ Selecionar aluno
- ✅ **UserSelector aparece!** ← NOVO!
  - Buscar professor
  - Selecionar professor
  - Ver selecionado com botão "Alterar"
- ✅ Preencher PEI e salvar
- ✅ Verificar professor atribuído
- ✅ Editar PEI existente
- ✅ Ver professor carregado no UserSelector

**Fluxo de teste completo:**
1. Login
2. Dashboard → "Criar PEI"
3. Selecionar aluno
4. **Ver UserSelector** com busca
5. Digitar nome do professor
6. Selecionar
7. Continuar preenchendo PEI
8. Salvar
9. Verificar que professor foi atribuído

---

### 4️⃣ Plano de AEE - TEMA CORRIGIDO 🎨
**Porta**: 5175  
**URL**: http://localhost:5175

**O que testar:**
- ✅ **Tema claro/escuro** - Toggle no header
- ✅ Dashboard com cards consistentes
- ✅ Todas as 5 páginas:
  - Dashboard
  - Criar Plano
  - Visualizar Plano
  - Editar Plano
  - (outras páginas)
- ✅ Sem mistura de fundo claro/escuro
- ✅ Cores consistentes

---

## 🔄 TESTE DE INTEGRAÇÃO COMPLETA

### Cenário 1: Hub Central → PEI Collab

**Passo 1: Cadastrar usuário no Gestão Escolar**
1. Abrir: http://localhost:5174/users
2. Clicar "Novo Usuário"
3. Preencher:
   - Nome: "João Silva"
   - Email: "joao@escola.com"
   - Role: "Professor"
   - Escola: Selecionar escola
4. Salvar
5. **Verificar**: Usuário aparece na lista

**Passo 2: Usar usuário no PEI Collab**
1. Abrir: http://localhost:8080
2. Login
3. Dashboard → "Criar PEI"
4. Selecionar aluno
5. **No UserSelector**: Buscar "João Silva"
6. **Verificar**: Aparece na lista
7. Selecionar
8. **Verificar**: Fica selecionado com botão "Alterar"
9. Salvar PEI
10. **Verificar**: João Silva atribuído

---

### Cenário 2: Redirect de Cadastro

**Passo 1: No PEI Collab**
1. Abrir: http://localhost:8080
2. Login como superadmin
3. Dashboard
4. Se tiver opção "Novo Usuário" → Clicar

**Passo 2: Ver Redirect**
1. **Ver diálogo** com mensagem educativa
2. **Ver botão** "Abrir Gestão Escolar"
3. Clicar no botão
4. **Nova aba abre**: http://localhost:5174/users
5. Cadastrar usuário lá
6. Voltar ao PEI Collab
7. **Verificar**: Dados atualizados

---

### Cenário 3: Importação em Lote

**Passo 1: Preparar arquivo CSV**
```csv
nome,email,cpf,data_nascimento
Maria Santos,maria@escola.com,123.456.789-00,2015-03-15
Pedro Costa,pedro@escola.com,987.654.321-00,2014-08-22
```

**Passo 2: Importar**
1. Abrir: http://localhost:5174/import
2. **Etapa 1**: Fazer upload do CSV
3. **Etapa 2**: Mapear campos (nome → full_name, etc)
4. **Etapa 3**: Configurar validações
5. **Etapa 4**: Ver preview e resolver duplicados
6. **Etapa 5**: Executar importação
7. **Verificar**: Progresso em tempo real
8. **Verificar**: Sucesso da importação

---

### Cenário 4: Tema Claro/Escuro

**Gestão Escolar:**
1. Abrir: http://localhost:5174
2. Ver tema padrão (claro)
3. Clicar ícone lua/sol no header
4. **Ver mudança instantânea** para escuro
5. Navegar entre páginas
6. **Verificar**: Tema persiste

**Plano de AEE:**
1. Abrir: http://localhost:5175
2. Repetir teste acima
3. **Verificar**: Comportamento idêntico

---

## 🎨 CHECKLIST VISUAL

### Blog
- [ ] Página inicial bonita
- [ ] Cards de posts responsivos
- [ ] Editor rich text funcionando
- [ ] Categorias com cores
- [ ] Dashboard admin limpo

### Gestão Escolar
- [ ] Dashboard com 6 cards principais
- [ ] 3 cards novas (Usuários, Import, Export)
- [ ] Tema claro elegante
- [ ] Tema escuro confortável
- [ ] Toggle visível no header
- [ ] Todas páginas consistentes

### PEI Collab
- [ ] Login funciona e redireciona
- [ ] UserSelector aparece ao selecionar aluno
- [ ] Busca em tempo real funciona
- [ ] Seleção persiste
- [ ] Professor carregado ao editar

### Plano de AEE
- [ ] Tema claro sem mistura
- [ ] Tema escuro sem mistura
- [ ] Toggle em todas páginas
- [ ] Cores consistentes
- [ ] Formulários temáticos

---

## 🐛 SE ALGO NÃO FUNCIONAR

### Erro de Porta em Uso
```bash
# Matar processos nas portas
npx kill-port 5178 5174 8080 5175

# Reiniciar apps
cd apps/blog && npm run dev &
cd apps/gestao-escolar && npm run dev &
cd apps/pei-collab && npm run dev &
cd apps/plano-aee && npm run dev &
```

### Erro de Dependências
```bash
# No app específico
cd apps/blog
npm install

cd apps/gestao-escolar
npm install
```

### Erro de Migração
```bash
# Aplicar migrações no Supabase
cd supabase
supabase db push

# Ou via Dashboard do Supabase
# Copiar conteúdo dos arquivos de migração
```

### Erro de Autenticação
- Verificar se Supabase está configurado
- Verificar variáveis de ambiente (.env)
- Fazer logout/login novamente

---

## 📊 STATUS DOS SERVIDORES

```
┌────────────────────────────────────────┐
│        APPS EM EXECUÇÃO                │
├────────────────────────────────────────┤
│ ✅ Blog            :5178               │
│ ✅ Gestão Escolar  :5174               │
│ ✅ PEI Collab      :8080               │
│ ✅ Plano de AEE    :5175               │
└────────────────────────────────────────┘
```

---

## 🎯 ORDEM SUGERIDA DE TESTES

### 1. Teste Rápido (5 min)
1. Blog (5178) - Ver posts
2. Gestão Escolar (5174) - Ver dashboard novas cards
3. PEI Collab (8080) - Login e ver UserSelector

### 2. Teste Médio (15 min)
1. Criar post no Blog
2. Navegar por Gestão Escolar
3. Alternar tema claro/escuro
4. Criar PEI com UserSelector
5. Ver Plano de AEE com tema

### 3. Teste Completo (30 min)
1. Todos os cenários de integração acima
2. Importação de arquivo CSV
3. Exportação de dados
4. Fluxo completo de cadastro
5. Edição de PEI com professor
6. Verificar em todos os navegadores

---

## 🎉 PRONTO PARA TESTAR!

**Todos os apps estão rodando!**

**Comece por onde preferir:**
- 🆕 **Blog**: http://localhost:5178 (mais novo)
- 🏢 **Hub Central**: http://localhost:5174 (mais modificado)
- 👥 **UserSelector**: http://localhost:8080 (nova feature)
- 🎨 **Tema**: http://localhost:5175 (visual)

---

**Boa sorte nos testes!** 🚀

Se encontrar algum problema, me avise! 😊




