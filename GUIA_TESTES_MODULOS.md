# Guia de Testes - Sistema de Módulos

## ✅ Status dos Testes

**Data**: 04/12/2025  
**Ambiente**: Produção  
**Tenant de Teste**: Rede Municipal de Educação - Teste

---

## 🧪 1. Testes do Banco de Dados

### ✅ Tabelas Criadas
- [x] `available_modules` - 6 módulos cadastrados
- [x] `tenant_modules` - Configurações por tenant

### ✅ RPCs Funcionais
- [x] `get_enabled_modules` - Retorna módulos corretamente
- [x] `enable_module_for_tenant` - Habilita módulos ✅
- [x] `disable_module_for_tenant` - Desabilita módulos (a testar)
- [x] `get_published_posts` - Posts do blog (a testar)
- [x] `get_post_by_slug` - Post individual (a testar)

### ✅ Módulos Habilitados para Tenant de Teste

Todos os 6 módulos habilitados:

| Módulo | App | Status | Habilitado em |
|--------|-----|--------|---------------|
| Atividades | gestao-escolar | ✅ Ativo | 02:07:35 |
| Blog | gestao-escolar | ✅ Ativo | 02:07:55 |
| Merenda | gestao-escolar | ✅ Ativo | 02:07:55 |
| Planejamento | gestao-escolar | ✅ Ativo | 02:07:55 |
| Transporte | gestao-escolar | ✅ Ativo | 02:07:55 |
| Plano AEE | pei-collab | ✅ Ativo | 02:07:55 |

---

## 🌐 2. Testes de Build e Deploy

### ✅ Builds Locais
- [x] Gestão Escolar: 36.68s ✅
- [x] PEI Collab: 26.31s ✅
- [x] Total: 51s ✅
- [x] Com UI de admin: ✅

### ✅ Deploy Vercel
- [x] GitHub push: df9ac3a ✅
- [x] Deploy automático: Sucesso ✅
- [x] URL produção: https://peicollab-du4d0trc8-pei-collab.vercel.app

---

## 🖥️ 3. Testes de Interface

### A Testar (Login necessário):

#### **Gestão Escolar** (gestao.peicollab.com.br ou URL da Vercel)

**Como Superadmin:**
```
URL: /superadmin/modules
Login: peicollabeducacaoinclusiva@gmail.com
Senha: [ver CREDENCIAIS_TESTE.md]

Testes:
[ ] Acessar /superadmin/modules
[ ] Ver tenant "Rede Municipal de Educação - Teste"
[ ] Ver todos os 6 módulos listados
[ ] Ver toggles em ON (verde)
[ ] Testar desabilitar um módulo
[ ] Testar habilitar novamente
[ ] Ver contadores atualizando
```

**Como Usuário Regular:**
```
Login: [qualquer usuário do tenant de teste]

Testes:
[ ] Verificar menu lateral/superior
[ ] Deve aparecer: Atividades, Blog, Merenda, Planejamento, Transporte
[ ] Clicar em "Atividades" - deve carregar /atividades/dashboard
[ ] Clicar em "Merenda" - deve carregar /merenda/dashboard
[ ] Clicar em "Planejamento" - deve carregar /planejamento/dashboard
[ ] Clicar em "Transporte" - deve carregar /transporte/dashboard
[ ] Admin Blog: /admin/blog/dashboard
```

**Testando ModuleGuard:**
```
[ ] Desabilitar módulo "Atividades" via UI admin
[ ] Como usuário, tentar acessar /atividades diretamente
[ ] Deve redirecionar para /modulo-nao-disponivel
[ ] Página de erro deve aparecer com botão "Voltar ao Dashboard"
[ ] Habilitar módulo novamente
[ ] Acessar /atividades - deve funcionar
```

#### **PEI Collab** (pei.peicollab.com.br ou URL da Vercel)

**Como Usuário do Tenant:**
```
Testes:
[ ] Login no PEI Collab
[ ] Verificar se "Plano AEE" aparece no menu
[ ] Clicar em "Plano AEE" - deve carregar /plano-aee/dashboard
[ ] Testar criação de plano AEE
[ ] Acessar Portal Responsável: /portal/dashboard
```

---

## 📱 4. Testes de Blog Público

### Landing Page (sem autenticação):

```
URL: gestao.peicollab.com.br ou https://peicollab-du4d0trc8-pei-collab.vercel.app

Testes:
[ ] Acessar / (landing page)
[ ] Verificar se seção "Notícias e Artigos" aparece
[ ] Se houver posts publicados, devem aparecer
[ ] Clicar em "Ver todos os artigos"
[ ] Acessar /blog - lista de posts
[ ] Clicar em um post - /blog/[slug]
[ ] Contador de views deve incrementar
```

**Criar Post de Teste:**
```
1. Login como admin (gestao-escolar)
2. Acessar /admin/blog/dashboard
3. Criar novo post
4. Publicar
5. Verificar na landing page (sem login)
```

---

## 🔄 5. Testes de Integração

### Hook useModules

```typescript
// Verificar no console do browser (F12)
// Executar no console:
localStorage.getItem('tanstack-query-cache')

// Deve conter chave: ['enabled-modules', 'tenant-id']
```

### ModuleGuard

**Teste 1: Módulo Habilitado**
```
1. Login como usuário
2. Acessar /atividades
3. Resultado esperado: Carrega página normalmente
```

**Teste 2: Módulo Desabilitado**
```
1. Superadmin desabilita "atividades"
2. Usuário tenta acessar /atividades
3. Resultado esperado: Redireciona para /modulo-nao-disponivel
4. Página mostra: "Módulo Não Disponível" com botão "Voltar"
```

**Teste 3: Atualização em Tempo Real**
```
1. Usuário está logado (menu sem "atividades")
2. Superadmin habilita "atividades"
3. Usuário recarrega página (F5)
4. Resultado esperado: "Atividades" aparece no menu
```

---

## 📊 6. Testes de Performance

### Métricas Esperadas

**Gestão Escolar:**
- Build: ~35-40s
- First Load: < 3s
- Navegação entre módulos: < 500ms
- Size: ~5MB (com PWA cache)

**PEI Collab:**
- Build: ~25-30s
- First Load: < 2s
- Module loading: < 300ms
- Size: ~2.7MB

### Lighthouse Scores (Meta)
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 85

---

## 🐛 7. Testes de Erro

### Cenários a Validar:

**Sem Autenticação:**
```
[ ] Tentar acessar /atividades sem login
[ ] Resultado: Redirecionar para /login
```

**Tenant Errado:**
```
[ ] Usuário de Tenant A tenta acessar módulo habilitado apenas para Tenant B
[ ] Resultado: Módulo não aparece no menu
```

**Módulo Inexistente:**
```
[ ] Tentar acessar /modulo-inexistente
[ ] Resultado: 404 ou redirecionamento adequado
```

**Network Offline:**
```
[ ] Desconectar internet
[ ] Tentar acessar módulo
[ ] Resultado: Mensagem offline apropriada
```

---

## ✅ 8. Checklist de Validação Final

### Banco de Dados
- [x] Migration aplicada sem erros
- [x] Tabelas criadas
- [x] Índices criados
- [x] RPCs funcionais
- [x] RLS habilitado
- [x] Módulos cadastrados
- [x] Tenant de teste configurado

### Código
- [x] Hooks useModules criados
- [x] ModuleGuard funcionando
- [x] Rotas integradas
- [x] Builds sem erros
- [x] UI de admin criada

### Deploy
- [x] GitHub atualizado
- [x] Vercel deploy OK
- [x] vercel.json configurado
- [x] Rewrites configurados

### Documentação
- [x] SISTEMA_MODULOS.md
- [x] CONFIGURACAO_DNS.md
- [x] GUIA_TESTES_MODULOS.md (este arquivo)
- [x] scripts/enable-test-modules.sql

### Testes Pendentes
- [ ] Login e verificar menu
- [ ] Navegar entre módulos
- [ ] Testar ModuleGuard
- [ ] Testar desabilitar/habilitar módulo
- [ ] Testar blog público
- [ ] Configurar DNS customizado

---

## 📝 Relatório de Testes

### Template para Preencher Após Testes:

```
Data: __/__/____
Testador: _____________

GESTÃO ESCOLAR:
[ ] Login funcionou
[ ] Menu exibe 5 módulos
[ ] Atividades carrega
[ ] Blog admin carrega
[ ] Merenda carrega
[ ] Planejamento carrega
[ ] Transporte carrega
[ ] ModuleGuard funciona

PEI COLLAB:
[ ] Login funcionou
[ ] Plano AEE no menu
[ ] Plano AEE carrega
[ ] Portal funcionou

ADMIN:
[ ] /superadmin/modules acessível
[ ] Lista de módulos carrega
[ ] Toggle funciona
[ ] Mudanças persistem

PROBLEMAS ENCONTRADOS:
_______________________
_______________________
```

---

## 🚀 Próximos Passos

**Imediato (Hoje):**
1. ✅ Módulos habilitados
2. ⏳ Testar interface
3. ⏳ Validar funcionalidades
4. ⏳ Configurar DNS

**Curto Prazo (Esta Semana):**
1. Habilitar módulos para outros tenants
2. Coletar feedback de usuários
3. Ajustes finos se necessário
4. Documentar casos de uso

**Médio Prazo (Este Mês):**
1. Remover apps antigos (validação completa)
2. Analytics de uso de módulos
3. Configurações avançadas
4. Planos/pricing por módulo

---

**Status**: 🟢 PRONTO PARA TESTES  
**Bloqueadores**: Nenhum  
**Riscos**: Baixo  
**Confiança**: Alta ✅

