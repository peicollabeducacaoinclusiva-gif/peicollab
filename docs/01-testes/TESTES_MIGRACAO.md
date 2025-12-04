# Testes de Migração - Guia

**Data**: Janeiro 2025  
**Status**: 🟡 Scripts Criados

---

## 🧪 Scripts de Teste

### 1. Teste ExcelJS
**Arquivo**: `scripts/test-exceljs-migration.ts`

**O que testa**:
- Criação de workbook
- Geração de buffer
- Leitura de workbook
- Leitura de dados

**Como executar**:
```bash
pnpm test:exceljs
```

**Ou diretamente**:
```bash
pnpm tsx scripts/test-exceljs-migration.ts
```

---

### 2. Teste jsPDF 3.x
**Arquivo**: `scripts/test-jspdf-3.ts`

**O que testa**:
- Criação de PDF básico
- Adição de imagem
- Adição de páginas
- Geração de output
- Métodos principais

**Como executar**:
```bash
pnpm test:jspdf
```

**Ou diretamente**:
```bash
pnpm tsx scripts/test-jspdf-3.ts
```

---

## 📋 Checklist de Testes Manuais

### ExcelJS - Importação
- [ ] Importar arquivo Excel (.xlsx) com múltiplas colunas
- [ ] Verificar se cabeçalhos são lidos corretamente
- [ ] Verificar se dados são parseados corretamente
- [ ] Testar com arquivo grande (>1000 linhas)
- [ ] Testar com diferentes tipos de dados (texto, números, datas)

### ExcelJS - Exportação
- [ ] Exportar dados para Excel
- [ ] Verificar se arquivo é gerado corretamente
- [ ] Verificar se cabeçalhos estão formatados
- [ ] Abrir arquivo no Excel e verificar dados
- [ ] Testar com grande volume de dados

### jsPDF 3.x
- [ ] Gerar PDF de gráfico
- [ ] Verificar se PDF é gerado corretamente
- [ ] Verificar se imagens são incluídas
- [ ] Verificar se múltiplas páginas funcionam
- [ ] Abrir PDF e verificar conteúdo

---

## 🔍 Verificações de TypeScript

### Type-Check
```bash
cd apps/gestao-escolar
pnpm type-check
```

### Lint
```bash
cd apps/gestao-escolar
pnpm lint
```

---

## 🐛 Problemas Conhecidos

### ExcelJS
- Nenhum problema conhecido até o momento

### jsPDF 3.x
- Nenhum problema conhecido até o momento

---

## 📊 Resultados Esperados

### ExcelJS
- ✅ Workbook criado
- ✅ Buffer gerado
- ✅ Workbook lido
- ✅ Dados parseados corretamente

### jsPDF 3.x
- ✅ PDF criado
- ✅ Métodos principais disponíveis
- ✅ Output gerado
- ✅ Compatibilidade mantida

---

**Última atualização**: Janeiro 2025

