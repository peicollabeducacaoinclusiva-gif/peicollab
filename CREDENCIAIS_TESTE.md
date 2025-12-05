# 🔑 Credenciais de Teste - PEI Collab V3.1.0

**Versão:** 3.1.0  
**Última Atualização:** Janeiro 2025

---

## 🎯 Usuários Principais Recomendados

### **Senha Padrão:** `Teste123` ou `Teste123!`

| Perfil | Email | Senha | Acesso |
|--------|-------|-------|--------|
| **Coordenador** ⭐ | `coordenador@teste.com` | `Teste123` | PEI, Gestão, AEE, Planejamento |
| **Professor** | `professor@teste.com` | `Teste123` | PEI, Gestão, Planejamento |
| **Professor AEE** | `professor.aee@teste.com` | `Teste123` | PEI, AEE, Planejamento |
| **Gestor Escolar** | `gestor.escolar@teste.com` | `Teste123` | Todos os apps de gestão |
| **Diretor** | `diretor.escola@teste.com` | `Teste123` | Gestão escolar completa |
| **Secretário** | `secretario.educacao@teste.com` | `Teste123` | Acesso administrativo total |
| **Família** | `familia@teste.com` | `Teste123` | Portal do Responsável |
| **Especialista** | `especialista@teste.com` | `Teste123` | PEI e AEE |
| **Prof. Apoio** | `profissional.apoio@teste.com` | `Teste123` | Dashboard PA |

---

## 🌟 Usuário Recomendado para Testes Gerais

### **👨‍🏫 Coordenador**
```
Email: coordenador@teste.com
Senha: Teste123
```

**Por quê?**
- ✅ Acesso a múltiplos apps
- ✅ Permissões intermediárias
- ✅ Pode criar e aprovar PEIs
- ✅ Pode gerenciar usuários
- ✅ Ideal para testar fluxos completos

---

## 🔐 Senhas Alternativas

Se a senha padrão não funcionar, tente:

1. `Teste123!` (com exclamação)
2. `PeiCollab@2025` (coordenadores importados)
3. `SGC@123456` (rede SGC)

---

## 📱 Como Testar

### 1. Acesse o Sistema

```
URL: http://localhost:8080 (desenvolvimento)
```

### 2. Faça Login

1. Clique em "Entrar" ou vá para `/login`
2. Use uma das credenciais acima
3. Senha: `Teste123`

### 3. Verifique o Dashboard

Após login, você verá o dashboard correspondente ao seu perfil.

---

## 🎭 Perfis Disponíveis

### 1. **Superadmin** (Acesso Total)
- Email: `superadmin@teste.com`
- Senha: `Teste123!`
- Acesso: **TODOS os apps e funcionalidades**

### 2. **Secretário de Educação**
- Email: `secretario.educacao@teste.com`
- Senha: `Teste123`
- Acesso: Gestão de rede, todas as escolas

### 3. **Diretor Escolar**
- Email: `diretor.escola@teste.com`
- Senha: `Teste123`
- Acesso: Gestão da escola

### 4. **Coordenador** ⭐
- Email: `coordenador@teste.com`
- Senha: `Teste123`
- Acesso: PEIs, validações, relatórios

### 5. **Professor**
- Email: `professor@teste.com`
- Senha: `Teste123`
- Acesso: Criar PEIs, visualizar alunos

### 6. **Professor AEE**
- Email: `professor.aee@teste.com`
- Senha: `Teste123`
- Acesso: PEIs, Planos de AEE

### 7. **Especialista**
- Email: `especialista@teste.com`
- Senha: `Teste123`
- Acesso: Acompanhamento, consultoria

### 8. **Família**
- Email: `familia@teste.com`
- Senha: `Teste123`
- Acesso: Portal do Responsável, visualizar PEI do filho

---

## 🗺️ Apps por Perfil

### Coordenador pode acessar:
- ✅ PEI Collab
- ✅ Gestão Escolar
- ✅ Plano de AEE
- ✅ Planejamento
- ✅ Blog
- ✅ Atividades

### Professor pode acessar:
- ✅ PEI Collab
- ✅ Gestão Escolar (limitado)
- ✅ Planejamento
- ✅ Blog
- ✅ Atividades

### Família pode acessar:
- ✅ Portal do Responsável
- ✅ Blog

---

## 🔧 Resolução de Problemas

### Problema: "Senha incorreta"

**Soluções:**
1. Tente `Teste123!` (com exclamação)
2. Tente `PeiCollab@2025`
3. Resete a senha no Dashboard do Supabase

### Problema: "Usuário não existe"

**Soluções:**
1. Crie o usuário via Dashboard do Supabase
2. Execute script: `node scripts/create-test-users-fixed.js`
3. Use o botão "Criar Usuários de Teste" no Dashboard

### Problema: "Sem permissão"

**Verifique:**
1. Usuário tem role na tabela `user_roles`?
2. Usuário está vinculado a uma escola/rede?
3. Usuário está ativo (`is_active = true`)?

---

## 🛠️ Criar Novos Usuários de Teste

### Via Dashboard (Mais Fácil)

1. Faça login como superadmin
2. Acesse o Dashboard
3. Clique em "Criar Usuários de Teste"
4. Aguarde confirmação

### Via Script

```bash
node scripts/create-test-users-fixed.js
```

### Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Vá em **Authentication** > **Users**
3. Clique em **Add User**
4. Preencha:
   - Email: `teste@exemplo.com`
   - Password: `Teste123`
   - Auto Confirm: ✅

---

## 📊 Resumo de Senhas

| Senha | Quando Usar |
|-------|-------------|
| `Teste123` | Padrão geral |
| `Teste123!` | Usuários via migração/edge function |
| `PeiCollab@2025` | Coordenadores importados |
| `SGC@123456` | Rede SGC |
| `SAN@123456` | Rede Santanópolis |
| `SBA@123456` | Rede Santa Bárbara |

---

## ⚠️ Importante

### Em Desenvolvimento
- ✅ Pode usar as senhas acima
- ✅ Senhas simples para facilitar testes

### Em Produção
- ❌ **NUNCA** use estas senhas
- ✅ Senhas devem ser fortes e únicas
- ✅ Usuários devem criar suas próprias senhas
- ✅ Implementar recuperação de senha

---

## 📞 Acesso Rápido

### Usuário Mais Versátil para Testes

```
Email: coordenador@teste.com
Senha: Teste123
Ou: Teste123!
```

**Apps acessíveis:** PEI Collab, Gestão Escolar, Plano AEE, Planejamento, Blog, Atividades

---

## 📦 Sistema de Módulos (NOVO!)

### 🎯 Tenant de Teste Configurado

**Tenant**: Rede Municipal de Educação - Teste  
**ID**: `00000000-0000-0000-0000-000000000001`

### ✅ Módulos Habilitados (Todos)

**Gestão Escolar** (gestao.peicollab.com.br):
1. ✅ **Atividades** - `/atividades` - Geração de atividades pedagógicas
2. ✅ **Blog** - `/admin/blog` - Gestão de posts (público em `/blog`)
3. ✅ **Merenda** - `/merenda` - Gestão de cardápios
4. ✅ **Planejamento** - `/planejamento` - Planos de aula
5. ✅ **Transporte** - `/transporte` - Rotas e veículos

**PEI Collab** (pei.peicollab.com.br):
6. ✅ **Plano AEE** - `/plano-aee` - Atendimento Especializado

### 🔧 Administração de Módulos

**Acesso**: Como **Superadmin**
```
URL: /superadmin/modules
Email: peicollabeducacaoinclusiva@gmail.com
```

**Funcionalidades:**
- Ver todos os módulos disponíveis
- Habilitar/desabilitar por tenant
- Configurações por módulo
- Resumo visual

### 🧪 Como Testar

**1. Verificar Menu Dinâmico:**
```
Login → Menu deve mostrar apenas módulos habilitados
```

**2. Testar Módulo:**
```
Clicar em "Atividades" → Deve carregar /atividades/dashboard
```

**3. Testar Guard:**
```
Superadmin desabilita módulo → Usuário não vê no menu
Tentar acessar URL diretamente → Redireciona para "Módulo Não Disponível"
```

**4. Blog Público:**
```
Sem login: Acessar /blog → Ver posts publicados
Com login: Acessar /admin/blog → Criar/editar posts
```

### 📚 Documentação

- [SISTEMA_MODULOS.md](./SISTEMA_MODULOS.md) - Documentação técnica completa
- [GUIA_TESTES_MODULOS.md](./GUIA_TESTES_MODULOS.md) - Guia detalhado de testes
- [scripts/enable-test-modules.sql](./scripts/enable-test-modules.sql) - Scripts SQL

---

**⭐ Use este documento como referência para testes!**

---

**Criado em:** Janeiro 2025  
**Atualizado em:** Dezembro 2025 (Sistema de Módulos)  
**Para:** Testes e desenvolvimento


