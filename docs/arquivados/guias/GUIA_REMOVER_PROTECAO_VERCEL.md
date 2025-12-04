# 🔓 Guia: Remover Proteção de Deploy da Vercel

---

## ⚠️ Situação Atual

O deploy está protegido com **Vercel Password Protection** ou **SSO**.

**URL atual requer autenticação:**
https://peicollab-mnae93785-pei-collab.vercel.app

---

## 🔓 Como Tornar o Site Público

### Opção A: Via Dashboard da Vercel

#### 1. Acesse o Projeto
1. Vá para: https://vercel.com/dashboard
2. Faça login
3. Clique no projeto **peicollab**

#### 2. Remova a Proteção
1. Clique em **Settings** (menu superior)
2. No menu lateral, clique em **Deployment Protection**
3. Em **Protection Level**, selecione **Public** (ou desative proteção)
4. Clique em **Save**

#### 3. Redeploy (se necessário)
1. Volte para **Deployments**
2. Clique no último deploy
3. Clique em **⋯** (três pontos)
4. Selecione **Redeploy**
5. Confirme

**Pronto! O site estará público!**

---

### Opção B: Via CLI da Vercel

```bash
# 1. Fazer login
npx vercel login

# 2. Listar projetos
npx vercel list

# 3. Configurar proteção
npx vercel project settings peicollab protection public

# 4. Redeploy
npx vercel --prod
```

---

## 🔐 Alternativa: Acessar com Login

Se preferir manter a proteção:

1. Acesse: https://vercel.com/login
2. Faça login com sua conta
3. Depois acesse: https://peicollab-mnae93785-pei-collab.vercel.app
4. O sistema deve carregar normalmente

---

## ✅ Como Saber se Funcionou?

Após remover a proteção:

1. Abra em **modo anônimo/privado**
2. Acesse: https://peicollab-mnae93785-pei-collab.vercel.app
3. Deve mostrar a **landing page** do PEI Collab
4. Clique em "Fazer Login"
5. Use: `teacher@test.com` / `Teacher@123`

**Se carregar o dashboard, está público!** ✅

---

## 📝 Configurações Recomendadas

### Para Produção Real (Dados Reais)
- 🔒 **Manter proteção ATIVA**
- 🔐 Usar domínio customizado
- 🛡️ Configurar firewall

### Para Demo/Testes (Dados Fictícios)
- 🌐 **Remover proteção** (site público)
- 📊 Permitir acesso livre
- 🧪 Facilitar testes

---

## 🎯 Status Atual do Deploy

### ✅ Deploy Bem-Sucedido
- Build: Completo ✅
- Upload: 17.9 MB ✅
- Vercel: Ativo ✅

### ⚠️ Proteção Ativa
- SSO/Password Protection habilitado
- Requer login na Vercel para acessar

### 🔓 Próximo Passo
**Escolha:**
- Opção A: Fazer login e acessar
- Opção B: Remover proteção e tornar público

---

**Guia criado em:** 04/11/2025 18:15  
**Próximo:** Remover proteção ou fazer login

