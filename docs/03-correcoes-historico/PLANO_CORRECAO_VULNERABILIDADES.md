# Plano de Correção de Vulnerabilidades

**Data**: Janeiro 2025  
**Prioridade**: 🔴 CRÍTICA  
**Status**: 🟡 Em Planejamento

---

## 📊 Vulnerabilidades Identificadas

**Total**: 13
- **High**: 9
- **Moderate**: 4

---

## 🔴 Ações Críticas (Prioridade 1)

### 1. jsPDF - ReDoS e DoS
**Status**: 🔴 Crítico  
**Ação**: Atualizar para 3.0.2+

**Impacto**: 
- Usado em geração de PDFs
- 16 caminhos afetados
- Pode causar DoS

**Plano**:
1. Verificar uso atual de jsPDF
2. Atualizar para versão 3.0.2+
3. Testar geração de PDFs
4. Ajustar código se necessário (breaking changes)

---

### 2. xlsx - Prototype Pollution e ReDoS
**Status**: 🔴 Crítico  
**Ação**: Migrar para exceljs

**Impacto**:
- Usado em importação de dados
- Vulnerabilidades críticas
- Pacote descontinuado

**Plano**:
1. Identificar todos os usos de xlsx
2. Migrar para exceljs
3. Atualizar código
4. Testar importação

---

### 3. puppeteer - ws e tar-fs
**Status**: 🔴 Crítico  
**Ação**: Atualizar para versão mais recente

**Impacto**:
- Usado em testes de acessibilidade
- Múltiplas vulnerabilidades

**Plano**:
1. Atualizar puppeteer
2. Testar testes de acessibilidade
3. Verificar compatibilidade

---

## 🟡 Ações Importantes (Prioridade 2)

### 4. tailwindcss - glob
**Status**: 🟡 Alto  
**Ação**: Atualizar tailwindcss

### 5. vite - esbuild
**Status**: 🟡 Alto  
**Ação**: Atualizar vite

### 6. js-yaml
**Status**: 🟡 Alto  
**Ação**: Atualizar js-yaml

---

## 📋 Checklist de Execução

### jsPDF
- [ ] Verificar uso em `packages/ui`
- [ ] Atualizar versão
- [ ] Testar geração de PDFs
- [ ] Ajustar código se necessário

### xlsx → exceljs
- [ ] Identificar todos os usos
- [ ] Instalar exceljs
- [ ] Migrar código
- [ ] Testar importação
- [ ] Remover xlsx

### puppeteer
- [ ] Atualizar versão
- [ ] Testar testes de acessibilidade
- [ ] Verificar compatibilidade

---

**Última atualização**: Janeiro 2025

