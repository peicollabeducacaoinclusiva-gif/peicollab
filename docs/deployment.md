# 🚀 PEI Collab V2.1 - Guia de Deployment

Este guia fornece instruções completas para fazer o deploy do PEI Collab V2.1 em produção.

## 📋 Pré-requisitos

### Software Necessário
- **Node.js** 18+ 
- **npm** 9+
- **Supabase CLI** (instalado globalmente)
- **Git** para controle de versão

### Contas e Serviços
- **Supabase** - Backend e banco de dados
- **Provedor de hospedagem** (Vercel, Netlify, etc.)
- **Domínio** (opcional, mas recomendado)

## 🔧 Configuração Inicial

### 1. Clone e Setup do Projeto

```bash
# Clone o repositório
git clone <repository-url>
cd pei-collab

# Instale dependências
npm install

# Instale dependências de desenvolvimento
npm install --save-dev web-push
```

### 2. Configuração do Supabase

```bash
# Login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref <your-project-ref>

# Aplique as migrações
supabase db reset --linked
```

### 3. Configuração de Variáveis de Ambiente

Crie o arquivo `.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# VAPID Keys para Push Notifications
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
SUPABASE_VAPID_PRIVATE_KEY=your_vapid_private_key

# Performance & Features
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Debug (apenas para desenvolvimento)
VITE_ENABLE_DEBUG_TOOLS=false
VITE_ENABLE_DATABASE_TESTS=false
```

### 4. Geração de VAPID Keys

```bash
# Gere as VAPID keys
node scripts/generate-vapid-keys.js

# Configure as keys no Supabase Dashboard
# Authentication > Settings > Push Notifications
```

## 🗄️ Configuração do Banco de Dados

### 1. Aplicar Migrações

```bash
# Reset e aplicação de todas as migrações
supabase db reset --linked

# Verificar se as migrações foram aplicadas
supabase db diff
```

### 2. Configurar RLS Policies

As políticas RLS já estão incluídas na migração `20250113000001_v2_2_improvements.sql`. Elas incluem:

- **Education Secretary**: Acesso completo à rede
- **School Director**: Acesso restrito à escola
- **Coordinators**: Acesso aos PEIs da rede
- **Teachers**: Acesso aos seus PEIs
- **Families**: Acesso via tokens seguros

### 3. Configurar Funções Auxiliares

As seguintes funções são criadas automaticamente:

```sql
-- Verificação de roles
is_education_secretary(user_id)
is_school_director(user_id)
get_user_school_id(user_id)
user_has_school_access(user_id, school_id)
```

## 🔔 Configuração de Notificações Push

### 1. Configurar VAPID Keys no Supabase

1. Acesse o Supabase Dashboard
2. Vá para **Authentication > Settings**
3. Configure as VAPID keys geradas
4. Ative o serviço de notificações push

### 2. Testar Notificações

```bash
# Execute o health check
node scripts/health-check.js

# Teste as notificações no app
# Acesse /debug/notifications
```

## 📱 Configuração PWA

### 1. Verificar Manifest

O arquivo `vite.config.ts` já está configurado com:

- **Manifest** completo para PWA
- **Service Worker** com cache strategies
- **Icons** para diferentes tamanhos
- **Offline capabilities**

### 2. Testar PWA

```bash
# Build da aplicação
npm run build

# Preview local
npm run preview

# Teste a instalação como PWA
# Chrome DevTools > Application > Manifest
```

## 🚀 Deploy em Produção

### Opção 1: Vercel (Recomendado)

```bash
# Instale Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure variáveis de ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_VAPID_PUBLIC_KEY
```

### Opção 2: Netlify

```bash
# Build da aplicação
npm run build

# Deploy via Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Opção 3: Servidor Próprio

```bash
# Build da aplicação
npm run build

# Copie os arquivos para o servidor
rsync -av dist/ user@server:/var/www/pei-collab/

# Configure nginx/apache para servir os arquivos
```

## 🔍 Verificação Pós-Deploy

### 1. Health Check

```bash
# Execute o script de verificação
node scripts/health-check.js

# Verifique se todos os testes passaram
# Pontuação deve ser >= 80%
```

### 2. Testes de Integração

```bash
# Execute testes de integração
npm run test:integration

# Verifique logs de erro
npm run test:integration -- --verbose
```

### 3. Testes de Usabilidade

```bash
# Acesse /debug/usability
# Crie testes com usuários reais
# Monitore métricas de performance
```

## 📊 Monitoramento

### 1. Métricas de Performance

- **Core Web Vitals**: LCP, FID, CLS
- **Bundle Size**: Monitorar tamanho dos assets
- **Cache Hit Rate**: Eficiência do cache offline
- **Memory Usage**: Uso de memória em dispositivos móveis

### 2. Logs de Erro

```bash
# Monitorar logs do Supabase
supabase logs

# Verificar erros de RLS
supabase logs --filter="error"

# Monitorar performance
supabase logs --filter="slow"
```

### 3. Alertas

Configure alertas para:

- **Uptime** < 99%
- **Response time** > 2s
- **Error rate** > 5%
- **Database connections** > 80%

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Erro de RLS Policies

```sql
-- Verificar se as políticas existem
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Recriar políticas se necessário
\i supabase/migrations/20250113000001_v2_2_improvements.sql
```

#### 2. Notificações Push Não Funcionam

```bash
# Verificar VAPID keys
echo $VITE_VAPID_PUBLIC_KEY
echo $SUPABASE_VAPID_PRIVATE_KEY

# Testar subscription
node scripts/test-push-notifications.js
```

#### 3. PWA Não Instala

```bash
# Verificar manifest
curl https://your-domain.com/manifest.json

# Verificar service worker
curl https://your-domain.com/sw.js
```

#### 4. Performance Lenta

```bash
# Analisar bundle
npm run build:analyze

# Verificar cache
node scripts/check-cache-performance.js
```

### Logs Úteis

```bash
# Logs do Supabase
supabase logs --filter="error" --limit=100

# Logs da aplicação
tail -f /var/log/nginx/error.log

# Logs de performance
node scripts/performance-monitor.js
```

## 🔄 Atualizações

### 1. Atualizar Código

```bash
# Pull das mudanças
git pull origin main

# Instalar novas dependências
npm install

# Aplicar migrações
supabase db reset --linked

# Rebuild e deploy
npm run build
vercel --prod
```

### 2. Rollback

```bash
# Reverter para versão anterior
git checkout <previous-commit>

# Rebuild e deploy
npm run build
vercel --prod
```

## 📞 Suporte

### Recursos de Ajuda

- **Documentação**: `/docs/`
- **Troubleshooting**: `/docs/troubleshooting.md`
- **API Reference**: `/docs/api.md`
- **Changelog**: `/CHANGELOG.md`

### Contatos

- **Issues**: GitHub Issues
- **Discord**: [Link do servidor]
- **Email**: suporte@pei-collab.com

## ✅ Checklist de Deploy

- [ ] Supabase configurado e migrações aplicadas
- [ ] Variáveis de ambiente configuradas
- [ ] VAPID keys geradas e configuradas
- [ ] Build da aplicação executado com sucesso
- [ ] Health check passou (>= 80%)
- [ ] Testes de integração passaram
- [ ] PWA instalável e funcional
- [ ] Notificações push funcionando
- [ ] Performance otimizada para mobile
- [ ] Monitoramento configurado
- [ ] Backup do banco de dados
- [ ] Documentação atualizada

---

**🎉 Parabéns! Seu PEI Collab V2.1 está pronto para produção!**


