# Configuração DNS - PEI Collab

## Domínio: peicollab.com.br

### 📋 Registros DNS Necessários

Configure os seguintes registros no seu provedor de DNS:

#### 1. Domínio Principal (Gestão Escolar)

```
Tipo: A ou CNAME
Nome: @  (ou peicollab.com.br)
Valor: 76.76.21.21  (IP da Vercel)
OU
Valor: cname.vercel-dns.com  (CNAME)
TTL: 3600
```

#### 2. Subdomínio Gestão (Alternativo)

```
Tipo: CNAME
Nome: gestao
Host: gestao.peicollab.com.br
Valor: cname.vercel-dns.com
TTL: 3600
```

#### 3. Subdomínio PEI Collab

```
Tipo: CNAME
Nome: pei
Host: pei.peicollab.com.br
Valor: cname.vercel-dns.com
TTL: 3600
```

---

## 🔧 Configuração na Vercel

### Passo 1: Acessar Projeto na Vercel
1. Acesse https://vercel.com/pei-collab/peicollab
2. Vá em **Settings** > **Domains**

### Passo 2: Adicionar Domínios Customizados

Adicione os seguintes domínios:

**Domínio 1: peicollab.com.br**
- Clique em "Add Domain"
- Digite: `peicollab.com.br`
- A Vercel vai mostrar os registros DNS necessários
- Adicione esses registros no seu provedor de DNS

**Domínio 2: gestao.peicollab.com.br** (Opcional)
- Clique em "Add Domain"
- Digite: `gestao.peicollab.com.br`
- Adicione CNAME conforme indicado

**Domínio 3: pei.peicollab.com.br**
- Clique em "Add Domain"  
- Digite: `pei.peicollab.com.br`
- Adicione CNAME conforme indicado

### Passo 3: Aguardar Propagação

- DNS leva de **15 minutos a 48 horas** para propagar
- Vercel automaticamente configura SSL (Let's Encrypt)
- Certificados SSL são gerados automaticamente

### Passo 4: Testar

Após propagação, teste:
- `https://peicollab.com.br` → Deve carregar Gestão Escolar
- `https://gestao.peicollab.com.br` → Deve carregar Gestão Escolar
- `https://pei.peicollab.com.br` → Deve carregar PEI Collab

---

## 📱 Verificação de DNS

### Comando para Verificar Propagação

```bash
# Windows PowerShell
nslookup peicollab.com.br
nslookup gestao.peicollab.com.br
nslookup pei.peicollab.com.br

# Linux/Mac
dig peicollab.com.br
dig gestao.peicollab.com.br
dig pei.peicollab.com.br
```

### Ferramentas Online

- https://www.whatsmydns.net
- https://dnschecker.org

---

## 🎨 Roteamento Atual (vercel.json)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/apps/gestao-escolar/dist/$1",
      "has": [{ "type": "host", "value": "peicollab.com.br" }]
    },
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

---

## 🔒 SSL/HTTPS

- ✅ Automático via Vercel (Let's Encrypt)
- ✅ Renovação automática
- ✅ HTTP → HTTPS redirect automático
- ✅ HSTS habilitado

---

## 🌐 Provedor de DNS Específico

### Se usar Registro.br
1. Acesse https://registro.br
2. Login com certificado digital ou usuário/senha
3. Meus Domínios > peicollab.com.br > Alterar servidores DNS
4. Se usar DNS do Registro.br:
   - Modo Avançado
   - Adicionar registros conforme acima

### Se usar Cloudflare
1. Acesse https://dash.cloudflare.com
2. Selecione peicollab.com.br
3. DNS > Add Record
4. Adicionar registros conforme acima
5. ⚠️ Desabilitar proxy (ícone laranja) se houver problemas

### Se usar outros (GoDaddy, Hostinger, etc)
- Procure seção "DNS Management" ou "Gerenciar DNS"
- Adicione registros conforme tabela acima

---

## 📊 Monitoramento

Após configuração, monitore:
- Vercel Dashboard: https://vercel.com/pei-collab/peicollab
- Analytics: Integrado com @vercel/analytics
- Logs: Via Vercel CLI ou dashboard

---

## 🆘 Troubleshooting

### Domínio não resolve
- Verificar se DNS propagou (usar whatsmydns.net)
- Aguardar até 48h
- Verificar se registros estão corretos

### SSL não funciona
- Aguardar alguns minutos após DNS propagar
- Vercel gera certificado automaticamente
- Se persistir, remover e readicionar domínio na Vercel

### Redireciona para domínio errado
- Verificar rewrites no vercel.json
- Limpar cache do browser (Ctrl+Shift+R)
- Testar em modo anônimo

---

## ✅ Checklist de Verificação

- [ ] Registros DNS adicionados no provedor
- [ ] Domínios adicionados na Vercel
- [ ] SSL gerado (ícone de cadeado verde)
- [ ] peicollab.com.br carrega Gestão Escolar
- [ ] pei.peicollab.com.br carrega PEI Collab
- [ ] Login funciona em ambos os domínios
- [ ] Módulos aparecem no menu (se habilitados)

---

**Data de Criação**: 04/12/2025  
**Última Atualização**: 04/12/2025


