# Vulnerabilidades de Dependências - Auditoria

**Data**: Janeiro 2025  
**Status**: 🔴 Ação Necessária

---

## 📊 Resumo

**Total de Vulnerabilidades**: 13
- **High**: 9
- **Moderate**: 4

---

## 🔴 Vulnerabilidades Críticas (High)

### 1. jsPDF (ReDoS e DoS)
**Severidade**: High  
**Pacote**: `jspdf@2.5.2`  
**Versão Corrigida**: `>=3.0.2`  
**Caminhos**: 16 paths através de `@pei/ui`

**Ação**: Atualizar jsPDF para versão 3.0.2 ou superior

```bash
cd packages/ui
pnpm add jspdf@^3.0.2
```

---

### 2. xlsx (Prototype Pollution e ReDoS)
**Severidade**: High  
**Pacote**: `xlsx@0.18.5`  
**Versão Corrigida**: Não disponível (pacote descontinuado)  
**Caminhos**: `apps/gestao-escolar`

**Ação**: Migrar para `xlsx-js-style` ou `exceljs`

**Opção 1**: Usar `exceljs` (recomendado)
```bash
cd apps/gestao-escolar
pnpm remove xlsx
pnpm add exceljs
```

**Opção 2**: Usar `xlsx-js-style`
```bash
cd apps/gestao-escolar
pnpm remove xlsx
pnpm add xlsx-js-style
```

---

### 3. ws (DoS via HTTP Headers)
**Severidade**: High  
**Pacote**: `ws@8.16.0`  
**Versão Corrigida**: `>=8.17.1`  
**Caminhos**: Através de `puppeteer`

**Ação**: Atualizar puppeteer (que atualizará ws)

```bash
pnpm update puppeteer@latest
```

---

### 4. tar-fs (Múltiplas Vulnerabilidades)
**Severidade**: High  
**Pacote**: `tar-fs@3.0.4`  
**Versão Corrigida**: `>=3.1.1`  
**Caminhos**: Através de `puppeteer`

**Ação**: Atualizar puppeteer (que atualizará tar-fs)

```bash
pnpm update puppeteer@latest
```

---

### 5. glob (Command Injection)
**Severidade**: High  
**Pacote**: `glob@10.4.5`  
**Versão Corrigida**: `>=10.5.0`  
**Caminhos**: 30 paths através de `tailwindcss`

**Ação**: Atualizar tailwindcss

```bash
pnpm update tailwindcss@latest
```

---

## 🟡 Vulnerabilidades Moderadas (Moderate)

### 6. quill (XSS)
**Severidade**: Moderate  
**Pacote**: `quill@1.3.7`  
**Versão Corrigida**: Não disponível  
**Caminhos**: Através de `react-quill`

**Ação**: Avaliar necessidade ou usar alternativa

---

### 7. esbuild (Development Server)
**Severidade**: Moderate  
**Pacote**: `esbuild@0.21.5`  
**Versão Corrigida**: `>=0.25.0`  
**Caminhos**: 25 paths através de `vite`

**Ação**: Atualizar vite

```bash
pnpm update vite@latest
```

---

### 8. DOMPurify (XSS)
**Severidade**: Moderate  
**Pacote**: `dompurify@2.5.8`  
**Versão Corrigida**: `>=3.2.4`  
**Caminhos**: 16 paths através de `jspdf`

**Ação**: Atualizar jsPDF (que atualizará DOMPurify)

---

### 9. js-yaml (Prototype Pollution)
**Severidade**: Moderate  
**Pacote**: `js-yaml@4.1.0`  
**Versão Corrigida**: `>=4.1.1`  
**Caminhos**: 80 paths

**Ação**: Atualizar js-yaml

```bash
pnpm update js-yaml@latest
```

---

## 📋 Plano de Ação Prioritizado

### Prioridade 1 (Crítico - Fazer Imediatamente)
1. **Atualizar jsPDF** → `3.0.2+`
2. **Migrar xlsx** → `exceljs` ou `xlsx-js-style`
3. **Atualizar puppeteer** → Versão mais recente

### Prioridade 2 (Alto - Fazer Esta Semana)
4. **Atualizar tailwindcss** → Versão mais recente
5. **Atualizar vite** → Versão mais recente
6. **Atualizar js-yaml** → `4.1.1+`

### Prioridade 3 (Médio - Fazer Este Mês)
7. **Avaliar quill** → Substituir ou mitigar
8. **Revisar dependências de desenvolvimento** → Atualizar quando possível

---

## 🔧 Comandos de Atualização

```bash
# 1. Atualizar jsPDF no pacote UI
cd packages/ui
pnpm add jspdf@^3.0.2

# 2. Migrar xlsx para exceljs
cd apps/gestao-escolar
pnpm remove xlsx
pnpm add exceljs

# 3. Atualizar puppeteer
pnpm update puppeteer@latest

# 4. Atualizar tailwindcss
pnpm update tailwindcss@latest

# 5. Atualizar vite
pnpm update vite@latest

# 6. Atualizar js-yaml
pnpm update js-yaml@latest

# 7. Reinstalar dependências
pnpm install
```

---

## ⚠️ Notas Importantes

### jsPDF 3.x
- **Breaking Changes**: Pode haver mudanças na API
- **Testar**: Geração de PDFs após atualização
- **Arquivos afetados**: `packages/ui/src/lib/pdf.ts`

### xlsx → exceljs
- **Breaking Changes**: API diferente
- **Migrar código**: Atualizar imports e chamadas
- **Arquivos afetados**: `apps/gestao-escolar/src/pages/Import.tsx`

### puppeteer
- **Testar**: Testes de acessibilidade após atualização
- **Arquivos afetados**: `tests/accessibility/`

---

## ✅ Checklist de Atualização

- [ ] Fazer backup do código atual
- [ ] Atualizar jsPDF
- [ ] Testar geração de PDFs
- [ ] Migrar xlsx para exceljs
- [ ] Atualizar código que usa xlsx
- [ ] Atualizar puppeteer
- [ ] Testar testes de acessibilidade
- [ ] Atualizar tailwindcss
- [ ] Testar build
- [ ] Atualizar vite
- [ ] Testar dev server
- [ ] Atualizar js-yaml
- [ ] Executar `pnpm audit` novamente
- [ ] Verificar se vulnerabilidades foram corrigidas

---

**Última atualização**: Janeiro 2025

