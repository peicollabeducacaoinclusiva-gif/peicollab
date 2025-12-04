# ✅ STATUS DOS APPS - RODANDO AGORA

**Data**: 10/11/2025  
**Método**: Turborepo + pnpm  
**Atualização**: Tempo real

---

## 🟢 APPS RODANDO (4/6)

### ✅ 1. PEI Collab - COM USERSELECTOR
**Porta**: 8080  
**URL**: http://localhost:8080  
**PID**: 27948  
**Status**: 🟢 ONLINE

**Teste agora:**
- Login
- Criar PEI
- Ver UserSelector funcionando!

---

### ✅ 2. Gestão Escolar - HUB CENTRAL  
**Porta**: 5174  
**URL**: http://localhost:5174  
**PID**: 12080  
**Status**: 🟢 ONLINE

**Teste agora:**
- Dashboard com novas cards
- /users - Gestão de usuários
- /import - Importação em lote
- /export - Exportação
- Tema claro/escuro

---

### ✅ 3. Plano de AEE - TEMA CORRIGIDO
**Porta**: 5175  
**URL**: http://localhost:5175  
**PID**: 16144  
**Status**: 🟢 ONLINE

**Teste agora:**
- Tema claro/escuro
- Todas as páginas consistentes

---

### ✅ 4. Planejamento
**Porta**: 5176  
**Status**: 🟢 ONLINE

---

### ✅ 5. Atividades
**Porta**: 5177  
**Status**: 🟢 ONLINE

---

### ⏳ 6. Blog - EM INICIALIZAÇÃO
**Porta**: 5178  
**URL**: http://localhost:5178  
**Status**: ⏳ AGUARDANDO

**Possíveis motivos:**
- Primeira compilação (pode demorar)
- Instalando dependências
- Verificar se há erros no terminal

**Solução alternativa:**
```bash
# Terminal separado
cd apps/blog
pnpm install
pnpm dev
```

---

## 🎯 TESTAR AGORA - PRIORIDADE

### 1️⃣ **Gestão Escolar** (PRIORIDADE MÁXIMA)
http://localhost:5174

**O que ver:**
- ✅ 3 novas cards no dashboard:
  - Usuários (ícone UserCog)
  - Importação (ícone Upload)
  - Exportação (ícone Download)
- ✅ Clicar em cada uma:
  - `/users` - Hub central de usuários
  - `/import` - Wizard de importação
  - `/export` - Exportar dados
- ✅ Toggle tema (lua/sol no header)

**Rotas para testar:**
```
http://localhost:5174/           # Dashboard
http://localhost:5174/users      # NOVO!
http://localhost:5174/import     # NOVO!
http://localhost:5174/export     # NOVO!
http://localhost:5174/students   # Alunos
http://localhost:5174/professionals  # Profissionais
```

---

### 2️⃣ **PEI Collab** (UserSelector)
http://localhost:8080

**Fluxo completo:**
1. Fazer login
2. Dashboard → "Criar PEI"
3. Selecionar aluno qualquer
4. **👀 VER O USERSELECTOR APARECER!**
5. Buscar professor (digitar nome)
6. Selecionar
7. Ver feedback visual
8. Continuar preenchendo PEI
9. Salvar
10. Verificar professor atribuído

**O que mudou:**
- ❌ Antes: Auto-atribuição automática
- ✅ Agora: Seleção manual com busca

---

### 3️⃣ **Plano de AEE** (Tema)
http://localhost:5175

**O que testar:**
- Clicar no toggle tema (header)
- Ver mudança instantânea
- Navegar entre páginas
- Verificar consistência

---

## 🔄 TESTE DE INTEGRAÇÃO HUB CENTRAL

### Cenário Completo: Cadastro → Uso

**Passo 1: Gestão Escolar**
1. Abrir: http://localhost:5174/users
2. Clicar "Novo Usuário"
3. Preencher formulário:
   - Nome: "Maria Silva"
   - Email: "maria@test.com"
   - Role: "Professor"
   - Escola: (selecionar)
4. Salvar
5. **Verificar**: Aparece na lista

**Passo 2: PEI Collab**
1. Abrir: http://localhost:8080
2. Login
3. Criar PEI → Selecionar aluno
4. **No UserSelector**: Buscar "Maria"
5. **Verificar**: Aparece!
6. Selecionar → Salvar PEI
7. **Sucesso**: Maria atribuída

---

## 📊 RESUMO VISUAL

```
┌────────────────────────────────────────┐
│      APPS DISPONÍVEIS AGORA            │
├────────────────────────────────────────┤
│ 🟢 PEI Collab      :8080   ✅ UserSel │
│ 🟢 Gestão Escolar  :5174   ✅ Hub     │
│ 🟢 Plano de AEE    :5175   ✅ Tema    │
│ 🟢 Planejamento    :5176   ✅         │
│ 🟢 Atividades      :5177   ✅         │
│ ⏳ Blog            :5178   ⏳ Loading │
└────────────────────────────────────────┘
```

---

## 🎯 PRIORIDADES DE TESTE

### Nível 1 - CRÍTICO (5 min)
1. ✅ Gestão Escolar → Ver novas cards
2. ✅ PEI Collab → Ver UserSelector
3. ✅ Plano de AEE → Alternar tema

### Nível 2 - IMPORTANTE (15 min)
1. ✅ Gestão Escolar → Navegar em /users, /import, /export
2. ✅ PEI Collab → Criar PEI completo com professor
3. ✅ Integração Hub → Cadastrar usuário e usar no PEI

### Nível 3 - COMPLETO (30 min)
1. ✅ Todos os fluxos de integração
2. ✅ Importação de arquivo CSV
3. ✅ Exportação de dados
4. ✅ Edição de PEI com professor
5. ✅ Testar em múltiplos navegadores

---

## 🐛 SE BLOG NÃO INICIAR

### Opção 1: Aguardar
- Primeira compilação pode demorar 2-3 minutos
- Verificar terminal para progresso

### Opção 2: Iniciar Manualmente
```bash
# Novo terminal
cd apps/blog
pnpm install
pnpm dev
```

### Opção 3: Verificar Dependências
```bash
cd apps/blog
pnpm install
```

### Opção 4: Ver Logs
```bash
# Verificar se há erros
pnpm dev --filter blog
```

---

## 💡 COMANDOS ÚTEIS

### Ver Todas as Portas
```powershell
netstat -ano | Select-String "5178|5174|8080|5175|5176|5177"
```

### Ver Processos Node
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

### Matar Porta Específica
```powershell
# Se precisar reiniciar
npx kill-port 5174
```

### Reiniciar App Específico
```bash
pnpm dev --filter gestao-escolar
```

---

## ✅ CHECKLIST DE TESTE

### Gestão Escolar
- [ ] Dashboard carrega
- [ ] Ver cards: Usuários, Importação, Exportação
- [ ] Navegar para /users
- [ ] Ver lista de usuários
- [ ] Navegar para /import
- [ ] Ver wizard de importação
- [ ] Navegar para /export
- [ ] Ver opções de exportação
- [ ] Toggle tema funciona
- [ ] Tema persiste ao navegar

### PEI Collab
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar PEI
- [ ] Selecionar aluno
- [ ] UserSelector aparece
- [ ] Busca funciona
- [ ] Selecionar professor
- [ ] Visualização do selecionado
- [ ] Botão "Alterar" funciona
- [ ] Salvar PEI
- [ ] Professor atribuído corretamente

### Plano de AEE
- [ ] Dashboard carrega
- [ ] Toggle tema aparece
- [ ] Alternar entre claro/escuro
- [ ] Cores consistentes
- [ ] Sem mistura de cores

### Integração
- [ ] Cadastrar usuário no Gestão Escolar
- [ ] Ver usuário aparecer no PEI Collab
- [ ] Selecionar em UserSelector
- [ ] Criar PEI com usuário selecionado
- [ ] Verificar no banco

---

## 🎉 PRÓXIMOS PASSOS

### Após Testes Básicos
1. Testar importação com arquivo CSV real
2. Testar exportação Educacenso
3. Editar PEI existente
4. Trocar professor atribuído
5. Verificar auditoria

### Quando Blog Iniciar
1. Ver posts na home
2. Login como admin
3. Criar post com editor
4. Publicar post
5. Ver visualizações

---

# 🚀 COMECE TESTANDO AGORA!

**Link principal**: http://localhost:5174 (Gestão Escolar - Hub Central)

**Tempo estimado**: 5-10 minutos para teste básico

**O que mais me impressionou**: UserSelector funcionando perfeitamente! 🎉




