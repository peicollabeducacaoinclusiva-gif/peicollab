# Issue #2: Geração de Arquivo Educacenso (TXT)

**Prioridade**: 🔴 P0 - Crítica  
**Status**: 🟡 Em Andamento  
**Estimativa**: 2-3 semanas

---

## Descrição

Implementar geração de arquivo TXT no layout oficial do Educacenso/Censo Escolar para envio ao MEC. Sistema deve validar dados antes de gerar e criar relatório de inconsistências.

---

## Objetivos

1. Gerar arquivo TXT no formato oficial do Educacenso
2. Validar dados antes de exportar
3. Criar relatório de inconsistências
4. Permitir download do arquivo
5. Manter histórico de exportações

---

## Tarefas

### Fase 1: Pesquisa e Documentação (2-3 dias)

- [ ] **T2.1**: Estudar layout oficial do Educacenso
  - Documentação do MEC/INEP
  - Formatos de arquivo (TXT, delimitadores, codificação)
  - Estrutura de registros (00, 20, 30, 40, 50, 60)
  - Validações obrigatórias
  - Exemplos de arquivos reais

- [ ] **T2.2**: Documentar estrutura de registros
  - Registro 00: Cabeçalho
  - Registro 20: Escolas
  - Registro 30: Turmas
  - Registro 40: Alunos
  - Registro 50: Profissionais
  - Registro 60: Matrículas
  - Outros registros necessários

### Fase 2: Backend - Função RPC (1 semana)

- [ ] **T2.3**: Criar função RPC `generate_educacenso_file(tenant_id, school_id, academic_year)`
  - Gerar arquivo TXT no layout oficial
  - Incluir todos os registros necessários
  - Validar dados antes de gerar
  - Retornar arquivo como texto ou base64

- [ ] **T2.4**: Implementar geração de cada tipo de registro
  - Registro 00 (Cabeçalho)
  - Registro 20 (Escolas)
  - Registro 30 (Turmas)
  - Registro 40 (Alunos)
  - Registro 50 (Profissionais)
  - Registro 60 (Matrículas)

- [ ] **T2.5**: Implementar validação de dados pré-exportação
  - Verificar campos obrigatórios
  - Validar formatos (CPF, datas, códigos INEP)
  - Verificar relacionamentos (aluno-turma, turma-escola)
  - Gerar relatório de inconsistências

### Fase 3: Backend - Edge Function (3-4 dias)

- [ ] **T2.6**: Criar Edge Function `educacenso-export`
  - Receber parâmetros: `{ tenantId, schoolId, academicYear }`
  - Chamar função RPC
  - Retornar arquivo para download
  - Headers corretos para download (Content-Type, Content-Disposition)

- [ ] **T2.7**: Implementar tratamento de erros
  - Erros de validação
  - Erros de geração
  - Retornar mensagens claras

### Fase 4: Banco de Dados (2-3 dias)

- [ ] **T2.8**: Criar tabela `educacenso_exports`
  ```sql
  CREATE TABLE educacenso_exports (
    id uuid PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id),
    school_id uuid REFERENCES schools(id),
    academic_year integer,
    file_name text,
    file_size bigint,
    records_count jsonb, -- {escolas: 1, turmas: 10, alunos: 200, ...}
    validation_errors jsonb,
    exported_by uuid REFERENCES auth.users(id),
    exported_at timestamptz DEFAULT now()
  );
  ```

- [ ] **T2.9**: Criar RLS policies para `educacenso_exports`
  - Usuários podem ver exportações de suas escolas/rede
  - Apenas coordenadores/diretores podem exportar

### Fase 5: Frontend - Interface (1 semana)

- [ ] **T2.10**: Criar página `Censo.tsx` ou seção em página existente
  - Formulário de exportação
  - Seleção de ano letivo
  - Seleção de escola(s)
  - Botão de exportar
  - Indicador de progresso

- [ ] **T2.11**: Implementar download do arquivo
  - Chamar Edge Function
  - Fazer download do arquivo
  - Mostrar nome do arquivo
  - Tratar erros

- [ ] **T2.12**: Criar visualização de relatório de inconsistências
  - Lista de inconsistências
  - Agrupamento por tipo
  - Filtros
  - Link para correção

- [ ] **T2.13**: Criar histórico de exportações
  - Lista de exportações anteriores
  - Data/hora
  - Tamanho do arquivo
  - Número de registros
  - Download novamente

- [ ] **T2.14**: Criar serviço `educacensoService.ts`
  - Métodos: `validateData()`, `generateFile()`, `downloadFile()`, `getExportHistory()`

### Fase 6: Testes (3-4 dias)

- [ ] **T2.15**: Testar geração com dados válidos
  - Dados completos
  - Verificar formato do arquivo
  - Validar estrutura

- [ ] **T2.16**: Testar validação com dados inválidos
  - Campos faltantes
  - Formatos inválidos
  - Relacionamentos quebrados

- [ ] **T2.17**: Testar com arquivo real do MEC (se possível)
  - Comparar formato
  - Validar aceitação

- [ ] **T2.18**: Testar performance
  - Grande volume de dados
  - Múltiplas escolas
  - Tempo de geração

---

## Critérios de Aceite

- ✅ Arquivo gerado no formato oficial do Educacenso
- ✅ Todos os registros necessários incluídos
- ✅ Validação de dados implementada
- ✅ Relatório de inconsistências gerado
- ✅ Arquivo aceito pelo sistema do MEC (teste real)
- ✅ Interface de exportação funcional
- ✅ Histórico de exportações disponível
- ✅ Performance adequada (< 30s para 1000 alunos)

---

## Arquivos a Criar/Modificar

### Backend
- `supabase/functions/educacenso-export/index.ts`
- `supabase/migrations/YYYYMMDDHHMMSS_educacenso_export.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_educacenso_exports_table.sql`

### Frontend
- `apps/gestao-escolar/src/services/educacensoService.ts`
- `apps/gestao-escolar/src/pages/Censo.tsx` (ou seção em página existente)
- `apps/gestao-escolar/src/components/EducacensoExportDialog.tsx`
- `apps/gestao-escolar/src/components/ValidationResults.tsx`

### Documentação
- `docs/educacenso/FORMATO_ARQUIVO.md`
- `docs/educacenso/ESTRUTURA_REGISTROS.md`

---

## Dependências

- Issue #3 (Validação de Dados) - pode ser feito em paralelo
- Views de exportação já existem (`export_inep_*`)
- Campos INEP já foram adicionados nas tabelas

---

## Recursos Necessários

1. **Documentação do Educacenso**
   - Manual do Censo Escolar
   - Especificações técnicas
   - Exemplos de arquivos

2. **Acesso a ambiente de teste do MEC** (se possível)
   - Para validar arquivos gerados

---

## Riscos

1. **Layout pode mudar**
   - Mitigação: Versionar layouts, manter código flexível

2. **Performance com grande volume**
   - Mitigação: Processar em lotes, otimizar queries

3. **Validações complexas**
   - Mitigação: Usar Issue #3 (sistema de validação)

---

## Próximos Passos Imediatos

1. ✅ Issue criada e documentada
2. ⏳ Estudar documentação do Educacenso
3. ⏳ Criar estrutura básica de exportação
4. ⏳ Implementar função RPC de geração

---

**Última atualização**: Janeiro 2025

