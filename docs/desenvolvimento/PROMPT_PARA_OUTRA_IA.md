# Prompt para Correção de Erros TypeScript - Gestão Escolar

## Contexto do Projeto

Você está trabalhando no projeto **pei-collab**, especificamente no app **gestao-escolar**. O objetivo é corrigir erros TypeScript em modo strict. O projeto usa:
- TypeScript + React
- Supabase Client
- Tailwind CSS
- Componentes shadcn/ui
- Estrutura: `apps/gestao-escolar/src/`

## Padrões Estabelecidos

1. **Variáveis não utilizadas (TS6133)**: Prefixar com `_` (ex: `_unusedVar`)
2. **Imports não utilizados (TS6192)**: Remover completamente
3. **SelectQueryError**: Usar `as unknown as Type[]` para arrays ou `as any` para objetos
4. **Tipos incompatíveis (TS2322, TS2345)**: Usar type assertions quando necessário
5. **Possivelmente undefined (TS2532)**: Adicionar null checks ou optional chaining

## Tarefa Específica

Corrija os seguintes erros TypeScript, seguindo os padrões acima:

### 1. Variáveis não utilizadas (TS6133) - Prioridade Alta

**Arquivos para corrigir:**
- `src/components/import/ValidationRules.tsx(53,9)`: `_updateRule` já está prefixado, mas ainda gera erro
- `src/components/StudentFormDialog.tsx(24,7)`: `_EDUCATIONAL_LEVELS` - verificar se realmente não é usado
- `src/components/StudentFormDialog.tsx(67,7)`: `_SHIFTS` - verificar se realmente não é usado
- `src/pages/Classes.tsx(187,9)`: `_toggleSort` já está prefixado, mas ainda gera erro
- `src/pages/Dashboard.tsx(74,9)`: `_getRoleLabel` já está prefixado, mas ainda gera erro
- `src/pages/Export.tsx(172,13)`: `_batchId` já está prefixado, mas ainda gera erro

**Ação**: Se as variáveis realmente não são usadas, removê-las completamente. Se são usadas mas o TypeScript não detecta, ajustar o código.

### 2. Imports não utilizados (TS6192)

**Arquivo:**
- `src/pages/GovernmentReports.tsx(11,1)`: Import de `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` marcado como não utilizado, mas verificar se está sendo usado na linha 489

**Ação**: Se realmente não está sendo usado, remover. Se está sendo usado, manter o import.

### 3. Erros de tipos incompatíveis (TS2322, TS2345)

**Arquivos para corrigir:**
- `src/pages/Classes.tsx(396,21)`: Erro com `PaginationProps` - verificar interface do componente Pagination
- `src/pages/Dashboard.tsx(174,37)`: Erro com tipo `Profile` - verificar se `school_id` está sendo incluído no objeto
- `src/pages/PerformanceTracking.tsx(141,11)`: `SelectQueryError` em `Grade[]` - usar `as unknown as Grade[]`
- `src/pages/PerformanceTracking.tsx(142,11)`: `SelectQueryError` em `Attendance[]` - usar `as unknown as Attendance[]`
- `src/pages/PerformanceTracking.tsx(174,11)`: Objeto possivelmente undefined - adicionar null check

## Instruções de Execução

1. **Localização**: Trabalhe no diretório `apps/gestao-escolar/`
2. **Verificação**: Após cada correção, execute `pnpm type-check` para verificar se o erro foi resolvido
3. **Padrões**: Siga rigorosamente os padrões estabelecidos acima
4. **Documentação**: Não crie arquivos de documentação, apenas corrija os erros

## Comandos Úteis

```bash
# Verificar erros TypeScript
cd apps/gestao-escolar
pnpm type-check

# Ver erros específicos
pnpm type-check 2>&1 | Select-String "error TS" | Select-Object -First 20
```

## Importante

- **NÃO** mexa nos 3 erros persistentes em `Diary.tsx` (linhas 940, 963, 1589) - esses serão corrigidos separadamente
- **NÃO** remova código que está sendo usado, apenas ajuste tipos quando necessário
- **SEMPRE** teste que o erro foi resolvido antes de considerar a tarefa completa

## Resultado Esperado

Após suas correções, o número de erros TypeScript deve diminuir. Documente quantos erros foram corrigidos e quais arquivos foram modificados.

