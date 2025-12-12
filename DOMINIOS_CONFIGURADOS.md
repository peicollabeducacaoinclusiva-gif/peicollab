# Domínios Configurados - PEI Collab

**Última atualização:** 12/12/2025

---

## 🌐 Configuração Atual de Domínios

### Domínio Principal
```
peicollab.com.br → PEI Collab (Página Splash)
```

### Subdomínios

| Subdomínio | Aplicação | URL Completa | Status |
|------------|-----------|--------------|--------|
| `pei` | PEI Collab | https://pei.peicollab.com.br | ✅ Ativo |
| `gei` | Gestão Escolar | https://gei.peicollab.com.br | ✅ Ativo |
| `gestao` | Gestão Escolar | https://gestao.peicollab.com.br | ✅ Ativo |

---

## 📋 Mapeamento Detalhado

### 1. PEI Collab (App de Planos Educacionais)
- **Domínio Principal:** https://peicollab.com.br
- **Subdomínio:** https://pei.peicollab.com.br
- **Diretório:** `apps/pei-collab/`
- **Página Inicial:** Splash "Cada Aluno Merece um Caminho Único"
- **Funcionalidades:**
  - Criação e edição de PEIs
  - Planos de AEE
  - Portal do Responsável
  - Reuniões e Avaliações
  - Sugestões com IA

### 2. Gestão Escolar (App de Administração)
- **Subdomínios:** 
  - https://gei.peicollab.com.br (principal)
  - https://gestao.peicollab.com.br (alternativo)
- **Diretório:** `apps/gestao-escolar/`
- **Página Inicial:** Landing "Educação Inclusiva com Inteligência Artificial"
- **Funcionalidades:**
  - Cadastro de alunos e professores
  - Gestão de turmas
  - Módulos integrados (Merenda, Transporte, Planejamento)
  - Blog institucional
  - Relatórios e dashboards

---

## 🔧 Configuração DNS

### Provedor: Registro.br
**Nameservers Delegados para Vercel:**
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

> ⚠️ **Importante:** Como os nameservers estão delegados para a Vercel, TODO o gerenciamento de DNS é feito diretamente na dashboard da Vercel. NÃO é necessário configurar CNAMEs ou registros A no Registro.br.

### Como Adicionar Novos Subdomínios

1. Atualizar [`vercel.json`](./vercel.json) com a nova rota
2. Acessar Vercel Dashboard → Settings → Domains
3. Adicionar o novo subdomínio (ex: `novo.peicollab.com.br`)
4. Aguardar validação automática (5-15 minutos)
5. SSL é gerado automaticamente (Let's Encrypt)

---

## 📝 Arquivo de Configuração

**Arquivo:** [`vercel.json`](./vercel.json)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/apps/pei-collab/dist/$1",
      "has": [{ "type": "host", "value": "peicollab.com.br" }]
    },
    {
      "source": "/(.*)",
      "destination": "/apps/gestao-escolar/dist/$1",
      "has": [{ "type": "host", "value": "gestao.peicollab.com.br" }]
    },
    {
      "source": "/(.*)",
      "destination": "/apps/gestao-escolar/dist/$1",
      "has": [{ "type": "host", "value": "gei.peicollab.com.br" }]
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

- **Provedor:** Let's Encrypt (via Vercel)
- **Renovação:** Automática
- **Status:** Ativo em todos os domínios
- **Redirect HTTP → HTTPS:** Automático
- **HSTS:** Habilitado

---

## 🧪 Testes de Verificação

### Checklist Pós-Deploy

Execute estes testes após cada deploy:

```bash
# Verificar DNS
nslookup peicollab.com.br
nslookup pei.peicollab.com.br
nslookup gei.peicollab.com.br
nslookup gestao.peicollab.com.br

# Verificar HTTPS (deve retornar 200)
curl -I https://peicollab.com.br
curl -I https://pei.peicollab.com.br
curl -I https://gei.peicollab.com.br
curl -I https://gestao.peicollab.com.br
```

### Teste Manual no Navegador

- [ ] https://peicollab.com.br → Splash PEI Collab
- [ ] https://pei.peicollab.com.br → Splash PEI Collab
- [ ] https://gei.peicollab.com.br → Landing Gestão Escolar
- [ ] https://gestao.peicollab.com.br → Landing Gestão Escolar
- [ ] Todos os domínios têm SSL ativo (cadeado 🔒 verde)
- [ ] Login funciona em todos os apps
- [ ] Navegação entre páginas funciona

---

## 🚀 Deploy e Propagação

### Tempo de Propagação
- **DNS:** 5-15 minutos (nameservers Vercel)
- **SSL:** Automático após validação DNS
- **Deploy:** 2-5 minutos (build + deploy)

### Verificar Status do Deploy
- Dashboard Vercel: https://vercel.com
- Verificar logs em: Deployments → Ver último deploy
- Status esperado: ✅ Ready

---

## 📊 Monitoramento

### Ferramentas Disponíveis
- **Analytics:** Vercel Analytics (@vercel/analytics)
- **Speed Insights:** Vercel Speed Insights
- **Logs:** Vercel Dashboard → Logs
- **DNS Check:** https://www.whatsmydns.net

### Métricas Importantes
- Tempo de resposta (esperado: < 500ms)
- Core Web Vitals (LCP, FID, CLS)
- Taxa de erro (esperado: < 1%)
- Uptime (esperado: > 99.9%)

---

## 🔧 Troubleshooting

### Problema: Domínio não resolve
1. Verificar em https://www.whatsmydns.net
2. Confirmar que domínio foi adicionado na Vercel
3. Aguardar propagação (até 48h em casos extremos)

### Problema: SSL não ativa
1. Confirmar que domínio está validado na Vercel
2. Aguardar alguns minutos
3. Se persistir, remover e readicionar domínio

### Problema: 404 ou página errada
1. Verificar configuração no vercel.json
2. Limpar cache do navegador (Ctrl+Shift+Del)
3. Testar em modo anônimo
4. Verificar logs do deploy na Vercel

### Problema: Mudanças não aparecem
1. Confirmar que deploy foi concluído
2. Limpar cache do CDN da Vercel
3. Forçar hard refresh (Ctrl+Shift+R)

---

## 📞 Suporte

### Documentação Oficial
- Vercel Domains: https://vercel.com/docs/concepts/projects/domains
- Registro.br: https://registro.br/ajuda/

### Contatos
- Suporte Vercel: https://vercel.com/support
- Dashboard do Projeto: https://vercel.com (seu projeto)

---

## 📅 Histórico de Alterações

| Data | Alteração | Responsável |
|------|-----------|-------------|
| 12/12/2025 | Adicionado subdomínio `gei.peicollab.com.br` | Sistema |
| 12/12/2025 | Configurado `peicollab.com.br` como domínio principal para PEI Collab | Sistema |
| 12/12/2025 | Padronizados links internos para `https://pei.peicollab.com.br` | Sistema |

---

**Última verificação:** 12/12/2025  
**Status geral:** ✅ Todos os domínios operacionais

