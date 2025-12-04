# 🧪 Guia Completo de Teste MVP - PEI Collab

**Data:** 2025-01-28  
**Status:** 📋 **GUIA PRONTO PARA EXECUÇÃO**

---

## 🎯 Objetivo

Este guia descreve como executar testes MVP (Minimum Viable Product) completos do app PEI Collab no navegador, validando funcionalidades essenciais.

---

## 📋 Pré-requisitos

### 1. Servidor de Desenvolvimento

```bash
# Iniciar app PEI Collab
npm run dev:pei

# Ou todos os apps em paralelo
npm run dev
```

**Verificar se está rodando:**
```bash
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080
```

**Resultado Esperado:** Processo ouvindo na porta 8080

---

### 2. Supabase Local (Opcional mas Recomendado)

```bash
# Iniciar Supabase local
supabase start

# Verificar status
supabase status
```

---

## 🚀 Teste 1: Carregamento Inicial

### Passos

1. **Abrir navegador:**
   ```
   http://localhost:8080
   ```

2. **Validar:**
   - [ ] Página carrega sem erros
   - [ ] Título: "PEI Collab - Planos Educacionais Individualizados"
   - [ ] React inicializa corretamente
   - [ ] Sem erros no console

### Resultado Esperado

- ✅ Splash screen ou tela de login aparece
- ✅ Sem erros de conexão
- ✅ Console limpo ou apenas warnings menores

---

## 🔐 Teste 2: Autenticação (Login)

### Credenciais de Teste

**Opção 1 - Superadmin:**
- Email: `superadmin@teste.com`
- Senha: `Teste123`

**Opção 2 - Coordenador:**
- Email: `coordenador@teste.com`
- Senha: `Teste123`

**Opção 3 - Professor:**
- Email: `professor@teste.com`
- Senha: `Teste123`

### Passos

1. **Navegar para tela de login:**
   - Se não redirecionar automaticamente, acessar `/auth` ou `/login`

2. **Preencher credenciais:**
   - Inserir email válido
   - Inserir senha válida
   - Clicar em "Entrar" ou "Login"

3. **Validar:**
   - [ ] Login bem-sucedido
   - [ ] Redirecionamento para Dashboard
   - [ ] Dados do usuário carregados
   - [ ] Sem erros no console

### Resultado Esperado

- ✅ Login funcionando
- ✅ Redirecionamento correto
- ✅ Dashboard carregado

---

## 📊 Teste 3: Dashboard

### Passos

1. **Após login, validar Dashboard:**
   - [ ] Nome do usuário exibido
   - [ ] Cards/métricas carregando
   - [ ] Menu de navegação visível
   - [ ] Informações do tenant/escola carregadas

2. **Navegação:**
   - [ ] Clicar em diferentes itens do menu
   - [ ] Verificar lazy loading de rotas
   - [ ] Validar que rotas carregam corretamente

### Resultado Esperado

- ✅ Dashboard funcional
- ✅ Dados exibidos corretamente
- ✅ Navegação suave

---

## 📝 Teste 4: CRUD de PEI

### 4.1 Criar Novo PEI

**Passos:**
1. Navegar para "Novo PEI" ou `/pei/new`
2. Selecionar aluno (se houver)
3. Preencher dados básicos
4. Salvar como rascunho

**Validar:**
- [ ] Formulário carrega
- [ ] Alunos aparecem na lista
- [ ] Salvar funciona
- [ ] Rascunho criado com sucesso

### 4.2 Visualizar PEI

**Passos:**
1. Acessar lista de PEIs
2. Clicar em um PEI existente
3. Verificar dados carregados

**Validar:**
- [ ] Lista de PEIs carrega
- [ ] Detalhes do PEI exibidos
- [ ] Histórico visível (se houver)

### 4.3 Editar PEI

**Passos:**
1. Abrir PEI existente
2. Modificar dados
3. Salvar alterações

**Validar:**
- [ ] Edição funciona
- [ ] Alterações salvas
- [ ] Feedback ao usuário

---

## 👥 Teste 5: Gestão de Alunos

### Passos

1. **Acessar lista de alunos:**
   - Navegar para "Alunos" ou rota equivalente

2. **Validar:**
   - [ ] Lista de alunos carrega
   - [ ] Busca funciona (se disponível)
   - [ ] Filtros funcionam (se disponíveis)
   - [ ] Detalhes do aluno acessíveis

### Resultado Esperado

- ✅ Lista de alunos funcional
- ✅ Navegação para detalhes funciona
- ✅ Dados carregados corretamente

---

## 🌐 Teste 6: Internacionalização (i18n)

### Passos

1. **Verificar textos traduzidos:**
   - [ ] Títulos em português
   - [ ] Botões traduzidos
   - [ ] Mensagens em português

2. **Trocar idioma (se disponível):**
   - [ ] Seletor de idioma funciona
   - [ ] Textos atualizam
   - [ ] Preferência salva

### Resultado Esperado

- ✅ Interface em português
- ✅ Todos os textos traduzidos
- ✅ Troca de idioma funciona (se implementado)

---

## ♿ Teste 7: Acessibilidade

### Validações Básicas

1. **Navegação por teclado:**
   - [ ] Tab navega entre elementos
   - [ ] Enter ativa botões
   - [ ] Esc fecha modais
   - [ ] Setas navegam em listas

2. **Leitores de tela:**
   - [ ] Labels presentes em inputs
   - [ ] ARIA attributes corretos
   - [ ] Skip links funcionam (se implementados)

3. **Contraste:**
   - [ ] Textos legíveis
   - [ ] Cores com contraste adequado

### Ferramentas Recomendadas

- Lighthouse (Chrome DevTools)
- axe DevTools
- Screen reader (NVDA/JAWS)

---

## ⚡ Teste 8: Performance

### Validações

1. **Tempo de carregamento:**
   - [ ] Página inicial < 3s
   - [ ] Navegação entre rotas < 1s
   - [ ] Lazy loading funcionando

2. **Network:**
   - [ ] Recursos carregam corretamente
   - [ ] Code splitting ativo
   - [ ] Chunks carregados sob demanda

3. **Métricas:**
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

### Ferramentas

- Chrome DevTools Performance tab
- Lighthouse
- Network tab

---

## 🔔 Teste 9: Error Handling

### Cenários de Teste

1. **Erro de conexão:**
   - Desconectar internet
   - Tentar ação que requer conexão
   - Validar mensagem de erro

2. **Erro de validação:**
   - Tentar salvar formulário inválido
   - Validar mensagens de erro

3. **ErrorBoundary:**
   - Simular erro de renderização
   - Validar que ErrorBoundary captura

### Resultado Esperado

- ✅ Erros são tratados graciosamente
- ✅ Mensagens claras para usuário
- ✅ ErrorBoundary funciona

---

## 📱 Teste 10: Responsividade

### Breakpoints

1. **Mobile (< 640px):**
   - [ ] Layout adapta
   - [ ] Menu hamburger funciona
   - [ ] Textos legíveis

2. **Tablet (640px - 1024px):**
   - [ ] Layout intermediário
   - [ ] Navegação acessível

3. **Desktop (> 1024px):**
   - [ ] Layout completo
   - [ ] Sidebar visível

### Ferramentas

- Chrome DevTools Device Toolbar
- Resize window

---

## ✅ Checklist Final MVP

### Funcionalidades Core

- [ ] Autenticação funciona
- [ ] Dashboard carrega
- [ ] Navegação funciona
- [ ] CRUD de PEI funciona
- [ ] Lista de alunos funciona

### Qualidade

- [ ] Sem erros críticos no console
- [ ] Performance aceitável
- [ ] Acessibilidade básica ok
- [ ] Responsivo

### Extras

- [ ] i18n funcionando
- [ ] PWA funcionando (offline)
- [ ] ErrorBoundary ativo
- [ ] Observabilidade reportando

---

## 📊 Resultado do Teste

Após completar todos os testes, preencher:

| Categoria | Status | Observações |
|-----------|--------|-------------|
| **Autenticação** | ⬜ | |
| **Dashboard** | ⬜ | |
| **CRUD PEI** | ⬜ | |
| **Alunos** | ⬜ | |
| **i18n** | ⬜ | |
| **Acessibilidade** | ⬜ | |
| **Performance** | ⬜ | |
| **Error Handling** | ⬜ | |

---

## 🐛 Problemas Encontrados

### Problema 1: Servidor não está rodando

**Status:** ❌ Bloqueador

**Solução:**
```bash
npm run dev:pei
```

---

## 📝 Notas de Teste

[Adicionar observações durante os testes]

---

**Última atualização:** 2025-01-28  
**Status:** 📋 **GUIA PRONTO - AGUARDANDO SERVIDOR**

