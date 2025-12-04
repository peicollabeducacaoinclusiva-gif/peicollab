# Migração xlsx → exceljs

**Data**: Janeiro 2025  
**Prioridade**: 🔴 CRÍTICA  
**Status**: 🟡 Em Planejamento

---

## 📋 Motivo da Migração

- **xlsx** tem vulnerabilidades críticas (Prototype Pollution, ReDoS)
- Pacote descontinuado
- **exceljs** é mantido ativamente e mais seguro

---

## 📁 Arquivos Afetados

1. `apps/gestao-escolar/src/services/importService.ts`
2. `apps/gestao-escolar/src/services/exportService.ts`

---

## 🔄 Mudanças Necessárias

### Antes (xlsx)
```typescript
import * as XLSX from 'xlsx';

// Ler arquivo
const workbook = XLSX.read(data, { type: 'binary' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(sheet);

// Escrever arquivo
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
```

### Depois (exceljs)
```typescript
import ExcelJS from 'exceljs';

// Ler arquivo
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(buffer);
const worksheet = workbook.getWorksheet(1);
const json: any[] = [];
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return; // Skip header
  const obj: any = {};
  row.eachCell((cell, colNumber) => {
    obj[headers[colNumber - 1]] = cell.value;
  });
  json.push(obj);
});

// Escrever arquivo
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sheet1');
worksheet.addRow(headers);
data.forEach(row => worksheet.addRow(Object.values(row)));
const buffer = await workbook.xlsx.writeBuffer();
```

---

## 📝 Checklist de Migração

- [ ] Instalar exceljs
- [ ] Atualizar `importService.ts`
- [ ] Atualizar `exportService.ts`
- [ ] Testar importação de arquivos
- [ ] Testar exportação de arquivos
- [ ] Remover xlsx
- [ ] Executar `pnpm audit` novamente

---

**Última atualização**: Janeiro 2025

