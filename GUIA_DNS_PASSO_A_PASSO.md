# 🔴 GUIA PASSO A PASSO: Configurar DNS (BLOQUEADOR)

**Status**: ⏳ AÇÃO MANUAL NECESSÁRIA  
**Prioridade**: 🔴 ALTA (Bloqueador)  
**Tempo Estimado**: 30 minutos + propagação (até 48h)

---

## 📋 PRÉ-REQUISITOS

- [ ] Acesso ao provedor de DNS (Registro.br, GoDaddy, Cloudflare, etc)
- [ ] Acesso à dashboard da Vercel (https://vercel.com/pei-collab/peicollab)
- [ ] Domínio: `peicollab.com.br`

---

## 🎯 OBJETIVO

Configurar os seguintes domínios para apontar para a Vercel:

```
✅ https://peicollab.com.br → Landing Gestão Escolar
✅ https://www.peicollab.com.br → Landing Gestão Escolar (redirect)
✅ https://gestao.peicollab.com.br → Dashboard Gestão Escolar
✅ https://pei.peicollab.com.br → Landing PEI Collab
```

---

## 📝 PASSO 1: Adicionar Domínios na Vercel

### 1.1. Acessar Vercel Dashboard

1. Acesse: https://vercel.com/pei-collab/peicollab
2. Clique na aba **"Settings"**
3. No menu lateral, clique em **"Domains"**

### 1.2. Adicionar Domínio Principal

1. No campo "Domain", digite: `peicollab.com.br`
2. Clique em **"Add"**
3. A Vercel irá mostrar os registros DNS necessários
4. **NÃO FECHE ESTA PÁGINA** - você precisará dessas informações

### 1.3. Adicionar Subdomínios

Repita o processo para cada subdomínio:

1. Digite: `www.peicollab.com.br` → Add
2. Digite: `gestao.peicollab.com.br` → Add
3. Digite: `pei.peicollab.com.br` → Add

---

## 📝 PASSO 2: Configurar Registros DNS

### 2.1. Acessar Painel do Provedor DNS

**Se for Registro.br:**
1. Acesse: https://registro.br
2. Login com sua conta
3. Vá em **"Meus domínios"**
4. Clique em `peicollab.com.br`
5. Clique em **"Editar Zona"** ou **"Gerenciar DNS"**

**Se for outro provedor:**
- Procure por "DNS Management", "DNS Settings" ou "Zona DNS"

### 2.2. Adicionar Registros

A Vercel irá mostrar registros específicos. Geralmente são:

#### **Para o domínio raiz (peicollab.com.br):**

```
Tipo: A
Nome: @ (ou deixe em branco)
Valor: 76.76.21.21
TTL: 3600 (ou automático)
```

#### **Para www (www.peicollab.com.br):**

```
Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 3600
```

#### **Para gestao (gestao.peicollab.com.br):**

```
Tipo: CNAME
Nome: gestao
Valor: cname.vercel-dns.com
TTL: 3600
```

#### **Para pei (pei.peicollab.com.br):**

```
Tipo: CNAME
Nome: pei
Valor: cname.vercel-dns.com
TTL: 3600
```

> ⚠️ **IMPORTANTE**: Use os valores EXATOS mostrados na dashboard da Vercel, pois podem variar!

### 2.3. Salvar Alterações

1. Clique em **"Salvar"** ou **"Save Changes"**
2. Confirme as alterações
3. Anote o horário da alteração

---

## 📝 PASSO 3: Aguardar Propagação

### 3.1. Tempo de Propagação

- **Mínimo**: 15 minutos
- **Típico**: 2-6 horas
- **Máximo**: 48 horas

### 3.2. Verificar Propagação

Use estas ferramentas online:

1. **WhatsMyDNS**: https://www.whatsmydns.net
   - Digite: `peicollab.com.br`
   - Tipo: A
   - Deve mostrar: `76.76.21.21`

2. **DNS Checker**: https://dnschecker.org
   - Digite cada domínio
   - Verificar se está apontando corretamente

### 3.3. Testar no Terminal (Opcional)

```bash
# Windows (PowerShell)
nslookup peicollab.com.br
nslookup www.peicollab.com.br
nslookup gestao.peicollab.com.br
nslookup pei.peicollab.com.br

# Linux/Mac
dig peicollab.com.br
dig www.peicollab.com.br
dig gestao.peicollab.com.br
dig pei.peicollab.com.br
```

---

## 📝 PASSO 4: Verificar na Vercel

### 4.1. Status dos Domínios

1. Volte para Vercel → Settings → Domains
2. Aguarde até que todos os domínios mostrem:
   - ✅ **Status**: Valid Configuration
   - 🔒 **SSL**: Automatic (Let's Encrypt)

### 4.2. Forçar Verificação (Se Necessário)

1. Se após 1 hora ainda não validou, clique em **"Refresh"**
2. Ou clique nos **3 pontinhos** → **"Verify"**

---

## 📝 PASSO 5: Configurar Redirecionamentos

### 5.1. Configurar vercel.json (Já Feito)

O arquivo `vercel.json` já está configurado:

```json
{
  "buildCommand": "pnpm turbo run build --filter=@pei-collab/gestao-escolar --filter=@pei/pei-collab",
  "outputDirectory": "dist",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/apps/gestao-escolar/dist/$1",
      "has": [{ "type": "host", "value": "gestao.peicollab.com.br" }]
    },
    {
      "source": "/(.*)",
      "destination": "/apps/pei-collab/dist/$1",
      "has": [{ "type": "host", "value": "pei.peicollab.com.br" }]
    }
  ]
}
```

✅ Nenhuma ação necessária aqui!

---

## 📝 PASSO 6: Testar Tudo

### 6.1. Checklist de Testes

Abra cada URL no navegador:

- [ ] https://peicollab.com.br
  - **Esperado**: Landing page do Gestão Escolar
  - **Tem**: Header, Hero, Cards dos apps

- [ ] https://www.peicollab.com.br
  - **Esperado**: Redireciona para peicollab.com.br
  - **Ou**: Mesma landing page

- [ ] https://gestao.peicollab.com.br
  - **Esperado**: Mesma landing do Gestão
  - **Teste**: Clicar em "Entrar" → `/login`

- [ ] https://pei.peicollab.com.br
  - **Esperado**: Landing do PEI Collab
  - **Tem**: "Cada Aluno Merece um Caminho Único"

- [ ] https://peicollab.com.br/blog
  - **Esperado**: Lista de 3 posts
  - **Posts**: "Bem-vindo", "Módulos", "PEI com IA"

- [ ] https://gestao.peicollab.com.br/login
  - **Esperado**: Página de login
  - **Tem**: Formulário de email/senha

- [ ] https://pei.peicollab.com.br/auth
  - **Esperado**: Página de login do PEI
  - **Tem**: Formulário com fundo de biblioteca

### 6.2. Testar SSL

1. Verifique se o cadeado 🔒 aparece na barra de endereço
2. Clique no cadeado → **"Certificado válido"**
3. Deve ser emitido por **Let's Encrypt**

---

## ❓ PROBLEMAS COMUNS

### Problema 1: "Domain not found" na Vercel

**Causa**: DNS ainda não propagou  
**Solução**: Aguarde mais tempo (até 48h)

### Problema 2: "Invalid Configuration" na Vercel

**Causa**: Registros DNS incorretos  
**Solução**:
1. Verifique os valores EXATOS na Vercel
2. Compare com o que você configurou no DNS
3. Corrija se necessário
4. Aguarde propagação

### Problema 3: SSL não ativa

**Causa**: Domínio não validado ainda  
**Solução**:
1. Aguarde validação DNS completa
2. SSL é automático após validação
3. Pode levar até 24h

### Problema 4: "Página não encontrada" (404)

**Causa**: Build pode precisar de redeploy  
**Solução**:
```bash
vercel --prod
```

### Problema 5: www não funciona

**Causa**: Registro CNAME faltando  
**Solução**: Adicione o CNAME para `www` apontando para `cname.vercel-dns.com`

---

## 📊 CHECKLIST FINAL

Antes de considerar concluído, verifique:

### DNS Configurado:
- [ ] Registro A para `@` (raiz)
- [ ] CNAME para `www`
- [ ] CNAME para `gestao`
- [ ] CNAME para `pei`
- [ ] Alterações salvas no provedor

### Vercel:
- [ ] Todos os 4 domínios adicionados
- [ ] Status "Valid Configuration" para todos
- [ ] SSL ativo (🔒) para todos
- [ ] `vercel.json` configurado

### Testes:
- [ ] `peicollab.com.br` carrega
- [ ] `www.peicollab.com.br` funciona
- [ ] `gestao.peicollab.com.br` carrega
- [ ] `pei.peicollab.com.br` carrega
- [ ] `/blog` mostra 3 posts
- [ ] Login funciona
- [ ] SSL ativo em todos

---

## 📞 SUPORTE

### Ferramentas de Diagnóstico:

1. **Verificar DNS**: https://www.whatsmydns.net
2. **Verificar SSL**: https://www.ssllabs.com/ssltest/
3. **Verificar HTTP**: https://httpstatus.io

### Documentação Oficial:

- Vercel DNS: https://vercel.com/docs/concepts/projects/domains
- Registro.br: https://registro.br/ajuda/

### Se Precisar de Ajuda:

1. **Logs da Vercel**:
   - Dashboard → Deployments → Ver logs
   - Procure por erros relacionados a domínios

2. **Suporte Vercel**:
   - https://vercel.com/support
   - Via chat ou ticket

---

## ✅ CONCLUSÃO

Quando todos os checkboxes acima estiverem marcados:

🎉 **DNS CONFIGURADO COM SUCESSO!**

Você pode prosseguir para:
- ✅ Testar login com usuários reais
- ✅ Navegar entre apps
- ✅ Verificar módulos habilitados
- ✅ Ler posts do blog

---

**Criado em**: 05/12/2025  
**Status**: 🔴 AÇÃO NECESSÁRIA  
**Próximo Passo**: Configurar registros DNS no provedor

