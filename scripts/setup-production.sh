#!/bin/bash

# Script de setup para produção - PEI Collab V2.1
# Execute: chmod +x scripts/setup-production.sh && ./scripts/setup-production.sh

set -e

echo "🚀 PEI Collab V2.1 - Setup de Produção"
echo "======================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto PEI Collab"
    exit 1
fi

log "Verificando dependências..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm não encontrado. Instale npm primeiro."
    exit 1
fi

# Verificar Supabase CLI
if ! command -v supabase &> /dev/null; then
    warn "Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

log "Instalando dependências do projeto..."
npm install

log "Instalando dependências de desenvolvimento..."
npm install --save-dev web-push

log "Verificando configuração do Supabase..."
if [ ! -f "supabase/config.toml" ]; then
    error "Arquivo supabase/config.toml não encontrado"
    exit 1
fi

log "Aplicando migrações do banco de dados..."
supabase db reset --linked

log "Executando testes de integração..."
npm run test:integration || warn "Alguns testes falharam - verifique manualmente"

log "Gerando VAPID keys para notificações push..."
node scripts/generate-vapid-keys.js

log "Configurando variáveis de ambiente..."
if [ ! -f ".env.local" ]; then
    log "Criando arquivo .env.local..."
    cat > .env.local << EOF
# PEI Collab V2.1 - Configurações de Produção
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
SUPABASE_VAPID_PRIVATE_KEY=your_vapid_private_key_here

# Configurações de Performance
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Configurações de Debug (apenas para desenvolvimento)
VITE_ENABLE_DEBUG_TOOLS=false
VITE_ENABLE_DATABASE_TESTS=false
EOF
    warn "Configure as variáveis no arquivo .env.local"
fi

log "Construindo aplicação para produção..."
npm run build

log "Verificando build..."
if [ ! -d "dist" ]; then
    error "Build falhou - diretório dist não encontrado"
    exit 1
fi

log "Executando verificações de segurança..."
npm audit --audit-level moderate || warn "Vulnerabilidades encontradas - revise manualmente"

log "Gerando relatório de performance..."
npm run build:analyze || warn "Análise de bundle não disponível"

echo ""
echo "✅ Setup de produção concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis no arquivo .env.local"
echo "2. Configure as VAPID keys no Supabase Dashboard"
echo "3. Execute: npm run preview para testar localmente"
echo "4. Faça deploy para seu provedor de hospedagem"
echo ""
echo "🔧 Comandos úteis:"
echo "• npm run dev          - Desenvolvimento"
echo "• npm run build        - Build para produção"
echo "• npm run preview      - Preview do build"
echo "• npm run test         - Executar testes"
echo "• supabase db reset    - Resetar banco de dados"
echo ""
echo "📚 Documentação:"
echo "• README.md           - Documentação principal"
echo "• docs/deployment.md  - Guia de deployment"
echo "• docs/troubleshooting.md - Solução de problemas"
echo ""


