# 🎓 PEI Collab V2.1

**Sistema Colaborativo para Criação e Acompanhamento de Planos Educacionais Individualizados**

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/your-org/pei-collab)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5+-blue.svg)](https://www.typescriptlang.org/)

## ✨ Características Principais

### 🚀 **Mobile-First & PWA**
- **Progressive Web App** com instalação nativa
- **Design responsivo** otimizado para dispositivos móveis
- **Offline-first** com sincronização automática
- **Service Worker** para cache inteligente

### 👥 **Multi-Tenant & Roles**
- **Education Secretary**: Visão estratégica da rede
- **School Director**: Gestão operacional da escola
- **Coordinator**: Supervisão e validação de PEIs
- **Teacher**: Criação e acompanhamento de PEIs
- **Family**: Acesso via tokens seguros
- **Specialist**: Orientações especializadas

### 🔄 **Versionamento & Auditoria**
- **Histórico completo** de versões de PEIs
- **Comparação visual** entre versões
- **Auditoria automática** de todas as alterações
- **Controle de acesso** granular por role

### 🔔 **Notificações Inteligentes**
- **Push notifications** com Service Worker
- **Notificações contextuais** baseadas em ações
- **Configurações personalizáveis** por usuário
- **Suporte offline** para notificações

### 📊 **Analytics & Monitoramento**
- **Métricas de performance** em tempo real
- **Testes de usabilidade** integrados
- **Health checks** automatizados
- **Relatórios detalhados** de uso

## 🛠️ Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** para build otimizado
- **Tailwind CSS** para styling
- **shadcn/ui** para componentes
- **React Query** para cache de dados
- **React Router** para navegação

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security** (RLS) policies
- **Real-time subscriptions**
- **Edge Functions** para lógica serverless

### PWA & Offline
- **vite-plugin-pwa** para PWA
- **Dexie.js** para IndexedDB
- **Service Worker** com cache strategies
- **Background sync** para offline

### Mobile & Performance
- **Lazy loading** de componentes
- **Image optimization** automática
- **Bundle splitting** inteligente
- **Performance monitoring** em tempo real

## 🚀 Quick Start

### 1. Pré-requisitos
```bash
# Node.js 18+
node --version

# npm 9+
npm --version

# Supabase CLI
npm install -g supabase
```

### 2. Instalação
```bash
# Clone o repositório
git clone https://github.com/your-org/pei-collab.git
cd pei-collab

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações
```

### 3. Configuração do Supabase
```bash
# Login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref <your-project-ref>

# Aplique as migrações
supabase db reset --linked
```

### 4. Geração de VAPID Keys
```bash
# Gere as VAPID keys para notificações push
npm run generate:vapid

# Configure as keys no Supabase Dashboard
# Authentication > Settings > Push Notifications
```

### 5. Executar
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📱 Funcionalidades por Role

### 🏛️ **Education Secretary**
- **Dashboard estratégico** com KPIs da rede
- **Gestão de escolas** e diretores
- **Relatórios executivos** customizáveis
- **Monitoramento** de progresso da rede

### 🏫 **School Director**
- **Dashboard operacional** da escola
- **Gestão de professores** e alunos
- **Aprovação de PEIs** da escola
- **Relatórios escolares** detalhados

### 👨‍🏫 **Coordinator**
- **Validação de PEIs** da rede
- **Supervisão** de professores
- **Geração de tokens** familiares
- **Relatórios de coordenação**

### 👩‍🏫 **Teacher**
- **Criação de PEIs** com IA assistida
- **Acompanhamento** de alunos
- **Interface gamificada** para estudantes
- **Sincronização offline**

### 👨‍👩‍👧‍👦 **Family**
- **Acesso via tokens** seguros
- **Visualização de PEIs** do aluno
- **Feedback** e aprovação
- **Interface simplificada**

## 🔧 Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build
npm run lint             # Linting
npm run type-check       # Verificação de tipos
```

### Testes
```bash
npm run test             # Testes unitários
npm run test:integration # Testes de integração
npm run test:usability   # Testes de usabilidade
npm run health:check     # Verificação de saúde
```

### Banco de Dados
```bash
npm run db:reset         # Reset do banco
npm run db:migrate       # Aplicar migrações
npm run db:diff          # Ver diferenças
npm run db:backup        # Backup do banco
```

### Performance
```bash
npm run performance:analyze   # Análise do bundle
npm run performance:monitor  # Monitor de performance
npm run cache:clear          # Limpar cache
npm run cache:optimize       # Otimizar cache
```

### Debug
```bash
npm run debug:database      # Testes de banco
npm run debug:usability     # Testes de usabilidade
npm run debug:performance   # Testes de performance
npm run notifications:test  # Teste de notificações
```

## 📊 Monitoramento

### Health Check
```bash
# Verificação completa do sistema
npm run health:check

# Monitor de performance em tempo real
npm run performance:monitor
```

### Métricas Coletadas
- **Tempo de carregamento** (LCP, FID, CLS)
- **Uso de memória** em dispositivos móveis
- **Cache hit rate** para offline
- **Taxa de erro** e warnings
- **Métricas de usabilidade** com usuários reais

## 🔒 Segurança

### Row Level Security (RLS)
- **Políticas granulares** por role e tenant
- **Isolamento de dados** por escola
- **Auditoria completa** de acessos
- **Tokens seguros** para famílias

### Autenticação
- **Supabase Auth** com múltiplos provedores
- **JWT tokens** seguros
- **Refresh tokens** automáticos
- **Sessões persistentes** offline

## 📱 PWA & Offline

### Capacidades Offline
- **Funcionamento completo** sem internet
- **Sincronização automática** ao reconectar
- **Cache inteligente** de dados críticos
- **Indicadores visuais** de status

### Instalação PWA
- **Manifest** otimizado para mobile
- **Service Worker** com cache strategies
- **Icons** para diferentes dispositivos
- **Splash screen** personalizado

## 🧪 Testes de Usabilidade

### Sistema Integrado
- **Criação de testes** com templates
- **Sessões de teste** com usuários reais
- **Coleta de feedback** estruturado
- **Análise de issues** e métricas

### Templates Disponíveis
- **Navegação mobile** e acessibilidade
- **Criação de PEIs** e workflows
- **Interface gamificada** para estudantes
- **Acesso familiar** via tokens

## 📈 Performance

### Otimizações Mobile
- **Lazy loading** de componentes
- **Image optimization** baseada no viewport
- **Bundle splitting** inteligente
- **Preload** de recursos críticos

### Cache Strategies
- **Service Worker** com múltiplas estratégias
- **IndexedDB** para dados offline
- **Cache de imagens** otimizado
- **Garbage collection** automático

## 🚀 Deploy

### Setup de Produção
```bash
# Script automatizado de setup
npm run setup:production

# Verificação de saúde
npm run health:check
```

### Provedores Suportados
- **Vercel** (recomendado)
- **Netlify**
- **Servidor próprio** (nginx/apache)

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
SUPABASE_VAPID_PRIVATE_KEY=your_vapid_private_key
```

## 📚 Documentação

- **[Guia de Deploy](docs/deployment.md)** - Instruções completas
- **[Troubleshooting](docs/troubleshooting.md)** - Solução de problemas
- **[API Reference](docs/api.md)** - Documentação da API
- **[Changelog](CHANGELOG.md)** - Histórico de versões

## 🤝 Contribuição

### Como Contribuir
1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Código
- **ESLint** para linting
- **Prettier** para formatação
- **TypeScript** para tipagem
- **Conventional Commits** para mensagens

## 📞 Suporte

### Recursos de Ajuda
- **GitHub Issues** para bugs e features
- **Discord** para discussões
- **Email** para suporte direto
- **Documentação** completa

### Contatos
- **Issues**: [GitHub Issues](https://github.com/your-org/pei-collab/issues)
- **Discord**: [Servidor Discord](https://discord.gg/pei-collab)
- **Email**: suporte@pei-collab.com

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- **Supabase** pela plataforma backend
- **Vercel** pela hospedagem
- **shadcn/ui** pelos componentes
- **Comunidade React** pelo ecossistema

---

**🎉 PEI Collab V2.1 - Transformando a educação especial com tecnologia!**


