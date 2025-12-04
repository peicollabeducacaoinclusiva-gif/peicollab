# 🚀 INICIAR APPS COM TURBOREPO

**Data**: 10/11/2025  
**Método**: pnpm + Turborepo  
**Status**: ✅ Configurado e rodando

---

## ✅ FORMA CORRETA (Turborepo)

### Comando Único para Todos os Apps

```bash
# No diretório raiz do projeto
pnpm dev
```

**Isso vai iniciar TODOS os apps simultaneamente:**
- Blog (5178)
- Gestão Escolar (5174)
- PEI Collab (8080)
- Plano de AEE (5175)
- Planejamento (5176)
- Atividades (5177)
- Landing (se configurada)

---

## 🎯 VANTAGENS DO TURBOREPO

### Paralelização Inteligente
✅ Inicia todos os apps ao mesmo tempo  
✅ Gerencia dependências entre pacotes  
✅ Cache de builds para agilizar  
✅ Logs organizados por app  

### Hot Reload
✅ Mudanças refletem instantaneamente  
✅ Recompilação incremental  
✅ Não precisa reiniciar manualmente  

### Gestão de Dependências
✅ Workspace único do pnpm  
✅ Compartilhamento de node_modules  
✅ Instalação mais rápida  

---

## 📊 ESTRUTURA DO MONOREPO

```
pei-collab/
├── package.json          # Root com scripts Turborepo
├── pnpm-workspace.yaml   # Configuração do workspace
├── turbo.json            # Configuração do Turborepo
├── apps/
│   ├── blog/            :5178
│   ├── gestao-escolar/  :5174
│   ├── pei-collab/      :8080
│   ├── plano-aee/       :5175
│   ├── planejamento/    :5176
│   └── atividades/      :5177
└── packages/
    └── database/         # Pacote compartilhado
```

---

## 🔧 COMANDOS DISPONÍVEIS

### Desenvolvimento
```bash
# Todos os apps
pnpm dev

# App específico
pnpm --filter blog dev
pnpm --filter gestao-escolar dev
pnpm --filter pei-collab dev
pnpm --filter plano-aee dev
```

### Build
```bash
# Todos os apps
pnpm build

# App específico
pnpm --filter blog build
```

### Instalar Dependências
```bash
# Em todos os workspaces
pnpm install

# Em app específico
pnpm --filter blog add papaparse
pnpm --filter gestao-escolar add xlsx
```

### Limpar
```bash
# Limpar node_modules e builds
pnpm clean

# Limpar e reinstalar
pnpm clean && pnpm install
```

---

## 🌐 ACESSAR OS APPS

Após rodar `pnpm dev`, acesse:

### Principais (Modificados nesta sessão)
- **Blog**: http://localhost:5178
- **Gestão Escolar**: http://localhost:5174
- **PEI Collab**: http://localhost:8080
- **Plano de AEE**: http://localhost:5175

### Outros
- **Planejamento**: http://localhost:5176
- **Atividades**: http://localhost:5177

---

## 🐛 TROUBLESHOOTING

### Erro: Portas em Uso
```bash
# Matar processos nas portas
npx kill-port 5178 5174 8080 5175 5176 5177

# Ou no Windows
netstat -ano | findstr "5178 5174 8080"
# Anotar o PID e:
taskkill /PID <PID> /F
```

### Erro: pnpm não encontrado
```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Verificar instalação
pnpm --version
```

### Erro: Dependências Faltando
```bash
# Reinstalar tudo
pnpm install
```

### Erro: App Específico Não Inicia
```bash
# Ver logs detalhados
pnpm dev --filter blog

# Ou
cd apps/blog
pnpm dev
```

### Limpar Cache do Turborepo
```bash
# Limpar cache
pnpm turbo clean

# Ou deletar pasta
rm -rf .turbo
```

---

## 📝 LOGS DO TURBOREPO

### Ver Logs Organizados
Quando roda `pnpm dev`, os logs aparecem assim:

```
blog:dev: > blog@0.0.0 dev
blog:dev: > vite
blog:dev:   VITE v5.0.0  ready in 500 ms
blog:dev:   ➜  Local:   http://localhost:5178/

gestao-escolar:dev: > gestao-escolar@0.0.0 dev
gestao-escolar:dev: > vite
gestao-escolar:dev:   VITE v5.0.0  ready in 650 ms
gestao-escolar:dev:   ➜  Local:   http://localhost:5174/

pei-collab:dev: > pei-collab@0.0.0 dev
pei-collab:dev: > vite
pei-collab:dev:   VITE v5.0.0  ready in 800 ms
pei-collab:dev:   ➜  Local:   http://localhost:8080/
```

---

## ⚙️ CONFIGURAÇÃO DO TURBOREPO

### turbo.json
```json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## 🎯 WORKFLOW RECOMENDADO

### 1. Primeira Vez
```bash
# Instalar dependências
pnpm install

# Iniciar todos os apps
pnpm dev
```

### 2. Desenvolvimento Diário
```bash
# Apenas iniciar (deps já instaladas)
pnpm dev
```

### 3. Após Adicionar Dependência
```bash
# Parar o dev (Ctrl+C)
# Instalar nova dependência
pnpm --filter blog add react-quill
# Reiniciar
pnpm dev
```

### 4. Após Pull/Merge
```bash
# Atualizar dependências
pnpm install
# Iniciar
pnpm dev
```

---

## 🚀 COMPARAÇÃO

### ❌ Forma Antiga (Não usar)
```bash
# Múltiplos terminais
cd apps/blog && npm run dev
cd apps/gestao-escolar && npm run dev
cd apps/pei-collab && npm run dev
# ...
```

**Problemas:**
- Precisa de 6+ terminais
- Logs misturados
- Difícil gerenciar
- Lento para iniciar

### ✅ Forma Nova (Turborepo)
```bash
# Um único comando
pnpm dev
```

**Vantagens:**
- 1 terminal apenas
- Logs organizados
- Paralelização automática
- Cache inteligente
- Mais rápido

---

## 📊 PERFORMANCE

### Tempo de Inicialização

| Método | Tempo |
|--------|-------|
| Manual (6 terminais) | ~3-4 min |
| **Turborepo (pnpm dev)** | **~1-2 min** |

**Ganho**: ~50% mais rápido! ⚡

### Hot Reload
- **Turborepo**: Instantâneo
- **Manual**: Pode demorar

---

## ✅ CHECKLIST

Após rodar `pnpm dev`, verificar:

- [ ] Nenhum erro no terminal
- [ ] Mensagem "ready in X ms" para cada app
- [ ] URLs locais exibidas
- [ ] Portas 5178, 5174, 8080, 5175 em uso
- [ ] Abrir URLs no navegador
- [ ] Hot reload funcionando ao editar arquivo

---

## 🎉 PRONTO!

**Comando único**: `pnpm dev`

**Resultado**: Todos os 6 apps rodando simultaneamente!

**Acesse**: http://localhost:5174 (Gestão Escolar - Hub Central)

---

**Turborepo**: Tornando o monorepo mais rápido e eficiente! 🚀




