# Solução: Erro ERR_CONNECTION_REFUSED

## Problema

Erros no console do navegador:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
main.tsx:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
@react-refresh:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
pwa-entry-point-loaded:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
manifest.webmanifest:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
```

## Causas Possíveis

### 1. Servidor de Desenvolvimento Não Está Rodando

O erro mais comum é simplesmente o servidor não estar em execução.

**Solução:**
```bash
# No diretório raiz do projeto
npm run dev
# ou
pnpm dev
# ou
yarn dev
```

### 2. Service Worker do PWA em Cache

O PWA pode ter registrado um service worker que está tentando carregar recursos mesmo quando o servidor está offline.

**Solução:**

1. **Limpar cache do navegador:**
   - Chrome/Edge: `Ctrl+Shift+Delete` → Limpar dados de navegação
   - Firefox: `Ctrl+Shift+Delete` → Limpar dados recentes
   - Ou usar modo anônimo: `Ctrl+Shift+N`

2. **Desregistrar Service Worker:**
   - Abrir DevTools (F12)
   - Ir para aba "Application" (Chrome) ou "Storage" (Firefox)
   - Clicar em "Service Workers"
   - Clicar em "Unregister" para cada service worker listado
   - Recarregar a página (Ctrl+F5)

3. **Limpar Storage:**
   - Na mesma aba "Application"
   - Clicar em "Clear storage"
   - Marcar todas as opções
   - Clicar em "Clear site data"

### 3. Porta Incorreta ou Conflito de Porta

O servidor pode estar tentando usar uma porta que já está em uso.

**Solução:**

1. **Verificar porta no vite.config.ts:**
   ```typescript
   server: {
     host: "::",
     port: 8080, // Verificar se esta porta está livre
   }
   ```

2. **Usar porta diferente:**
   ```bash
   # Definir porta via variável de ambiente
   PORT=3000 npm run dev
   ```

3. **Verificar processos usando a porta:**
   ```bash
   # Windows
   netstat -ano | findstr :8080
   
   # Linux/Mac
   lsof -i :8080
   ```

### 4. Problema com PWA em Desenvolvimento

O PWA pode estar tentando carregar recursos que só existem em produção.

**Solução Temporária:**

Desabilitar PWA em desenvolvimento editando `vite.config.ts`:

```typescript
VitePWA({
  // ... outras configurações
  devOptions: {
    enabled: false, // Desabilitar PWA em desenvolvimento
    type: 'module'
  }
})
```

## Passos de Diagnóstico

### 1. Verificar se o servidor está rodando

```bash
# Verificar processos Node
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

### 2. Verificar logs do servidor

O servidor deve mostrar algo como:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: http://[::]:8080/
```

### 3. Testar acesso direto

Abrir no navegador:
- http://localhost:8080
- http://127.0.0.1:8080

### 4. Verificar console do navegador

- Abrir DevTools (F12)
- Ir para aba "Console"
- Verificar se há outros erros além de CONNECTION_REFUSED
- Verificar aba "Network" para ver quais recursos estão falhando

## Solução Rápida (Recomendada)

1. **Parar todos os processos Node:**
   ```bash
   # Windows
   taskkill /F /IM node.exe
   
   # Linux/Mac
   pkill node
   ```

2. **Limpar cache e node_modules (se necessário):**
   ```bash
   rm -rf node_modules
   npm install
   # ou
   pnpm install
   ```

3. **Limpar cache do navegador:**
   - Usar modo anônimo ou limpar dados do site

4. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

5. **Abrir em modo anônimo:**
   - `Ctrl+Shift+N` (Chrome/Edge)
   - `Ctrl+Shift+P` (Firefox)

## Prevenção

### Desabilitar PWA em Desenvolvimento

Para evitar problemas com service workers durante desenvolvimento:

```typescript
// vite.config.ts
VitePWA({
  // ... configurações
  devOptions: {
    enabled: false, // PWA desabilitado em dev
    type: 'module'
  }
})
```

### Usar Extensão do Navegador

Instalar extensão para limpar service workers:
- Chrome: "Service Worker Detector"
- Firefox: "Service Worker Detector"

## Verificação Final

Após seguir os passos, verificar:

1. ✅ Servidor está rodando e mostra URL no terminal
2. ✅ Navegador consegue acessar http://localhost:8080
3. ✅ Console do navegador não mostra erros de conexão
4. ✅ Página carrega normalmente

## Se o Problema Persistir

1. **Verificar variáveis de ambiente:**
   - `.env` ou `.env.local`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. **Verificar firewall/antivírus:**
   - Pode estar bloqueando conexões locais
   - Adicionar exceção para localhost:8080

3. **Verificar proxy/VPN:**
   - Desabilitar temporariamente
   - Verificar configurações de proxy do navegador

4. **Reinstalar dependências:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Contato

Se o problema persistir após seguir todos os passos, verificar:
- Logs do servidor de desenvolvimento
- Console do navegador completo
- Configuração do projeto
- Versões do Node.js e npm/pnpm

