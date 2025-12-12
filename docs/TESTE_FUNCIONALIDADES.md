# Guia de Teste de Funcionalidades - PEI Collab

**Data:** 2025-12-05  
**Status:** Checklist de validação

---

## 🧪 Testes Unitários

### ✅ Testes Criados e Validados

#### 1. backupService.test.ts
**Localização:** `apps/gestao-escolar/src/services/__tests__/backupService.test.ts`

**Cenários testados:**
- ✅ `getBackupJobs()` - busca e filtragem por tenantId
- ✅ `createBackupJob()` - criação com validação de campos obrigatórios
- ✅ `executeBackup()` - execução e tratamento de erros
- ✅ `verifyBackup()` - verificação de integridade com checksum
- ✅ `getBackupExecutions()` - filtragem por tenantId

**Como executar:**
```bash
cd apps/gestao-escolar
pnpm test backupService.test.ts
```

#### 2. auditService.test.ts
**Localização:** `apps/gestao-escolar/src/services/__tests__/auditService.test.ts`

**Cenários testados:**
- ✅ `logAccess()` - registro de logs de acesso
- ✅ `getAuditLogs()` - busca com filtros e tenantId
- ✅ `getUserAccessLogs()` - logs de usuário com e sem tenantId
- ✅ `exportAuditLogs()` - exportação em formato CSV

**Como executar:**
```bash
cd apps/gestao-escolar
pnpm test auditService.test.ts
```

#### 3. evaluationService.test.ts
**Localização:** `apps/gestao-escolar/src/services/__tests__/evaluationService.test.ts`

**Cenários testados:**
- ✅ `getGrades()` - busca de notas com dados relacionados
- ✅ `getAttendance()` - busca de frequência
- ✅ `getDescriptiveReports()` - busca de pareceres descritivos
- ✅ `createGrade()` - criação de novas notas

**Como executar:**
```bash
cd apps/gestao-escolar
pnpm test evaluationService.test.ts
```

---

## 🔍 Testes de Funcionalidades (Manual)

### 1. Sistema de Backups

#### Interface: Dashboard Superadmin
**Localização:** `apps/gestao-escolar/src/pages/Dashboard.tsx` → `SuperadminDashboard`

**Funcionalidades para testar:**
- [ ] **Backup Manual Completo**
  - Acessar Dashboard como Superadmin
  - Clicar em "Backup Completo" na seção "Manutenção e Backup"
  - Verificar que backup é iniciado
  - Verificar mensagem de sucesso/erro
  - Verificar que execução aparece em "Backup Executions"

- [ ] **Backup Manual Compacto**
  - Clicar em "Backup Compacto"
  - Verificar que backup compacto é criado
  - Verificar tamanho reduzido em relação ao completo

- [ ] **Criar Job de Backup**
  - Acessar página "Backup Management" (`/backup-management`)
  - Criar novo job com:
    - Nome: "Backup Diário Teste"
    - Tipo: Diário
    - Horário: 03:00
    - Tipo de Backup: Completo
    - Retenção: 30 dias
  - Verificar que job é criado com sucesso
  - Verificar que aparece na lista de jobs

- [ ] **Verificar Integridade de Backup**
  - Após execução de backup, verificar que:
    - Status é "completed"
    - Checksum está presente (se disponível)
    - Tamanho do arquivo é > 0
    - Data de execução está correta

**Arquivos relacionados:**
- `apps/gestao-escolar/src/pages/BackupManagement.tsx`
- `apps/gestao-escolar/src/services/backupService.ts`
- `packages/dashboards/src/hooks/useSuperadminMaintenance.ts`

---

### 2. Sistema de Auditoria

#### Interface: Página de Relatórios de Auditoria
**Localização:** `apps/gestao-escolar/src/pages/AuditReports.tsx`

**Funcionalidades para testar:**
- [ ] **Visualizar Logs de Auditoria**
  - Acessar página "Audit Reports" (`/audit-reports`)
  - Verificar que logs são carregados
  - Verificar filtros por tabela, ação, data
  - Verificar que apenas logs do tenant atual são exibidos

- [ ] **Visualizar Logs de Acesso**
  - Na mesma página, verificar aba "Logs de Acesso"
  - Verificar que logs de acesso são carregados
  - Verificar filtros por ação, data
  - Verificar informações: usuário, ação, recurso, data/hora

- [ ] **Exportar Logs**
  - Clicar em "Exportar CSV"
  - Verificar que arquivo CSV é gerado
  - Verificar que arquivo contém dados corretos
  - Verificar formato: ID, Tabela, Registro, Ação, Usuário, Data

- [ ] **Visualizar Histórico de Registro**
  - Selecionar um registro na tabela
  - Clicar em "Ver Histórico"
  - Verificar que histórico completo é exibido
  - Verificar que mudanças são mostradas (old_values → new_values)

**Arquivos relacionados:**
- `apps/gestao-escolar/src/pages/AuditReports.tsx`
- `apps/gestao-escolar/src/services/auditService.ts`
- `src/components/shared/AuditLogsViewer.tsx`

---

### 3. Sistema de Avaliações

#### Interface: Página de Diário
**Localização:** `apps/gestao-escolar/src/pages/Diary.tsx`

**Funcionalidades para testar:**
- [ ] **Buscar Notas de Estudante**
  - Acessar página "Diary" (`/diary`)
  - Selecionar turma e disciplina
  - Verificar que notas são carregadas
  - Verificar que dados relacionados (nome do estudante, nome da disciplina) aparecem corretamente

- [ ] **Buscar Frequência**
  - Na mesma página, verificar aba "Frequência"
  - Verificar que frequência é carregada
  - Verificar cálculos: total de aulas, presenças, faltas, percentual

- [ ] **Buscar Pareceres Descritivos**
  - Verificar aba "Pareceres Descritivos"
  - Verificar que pareceres são carregados
  - Verificar que nome do criador aparece corretamente

- [ ] **Criar Nova Nota**
  - Clicar em "Adicionar Nota"
  - Preencher formulário:
    - Estudante
    - Disciplina
    - Período
    - Valor da nota
  - Salvar
  - Verificar que nota aparece na lista

**Arquivos relacionados:**
- `apps/gestao-escolar/src/pages/Diary.tsx`
- `apps/gestao-escolar/src/services/evaluationService.ts`

---

### 4. Páginas Legais (LGPD)

#### Interface: Páginas de Política de Privacidade e Termos de Uso
**Localização:** 
- `apps/pei-collab/src/pages/PrivacyPolicy.tsx`
- `apps/pei-collab/src/pages/TermsOfUse.tsx`

**Funcionalidades para testar:**
- [ ] **Acessar Política de Privacidade**
  - Acessar `/legal/privacy`
  - Verificar que página carrega corretamente
  - Verificar que conteúdo está formatado
  - Verificar que scroll funciona
  - Verificar data de atualização: "30 de novembro de 2025"

- [ ] **Acessar Termos de Uso**
  - Acessar `/legal/terms`
  - Verificar que página carrega corretamente
  - Verificar que conteúdo está formatado
  - Verificar que scroll funciona
  - Verificar data de atualização: "30 de novembro de 2025"

- [ ] **Acessar via Footer**
  - Acessar página inicial (`/`)
  - Rolar até o footer
  - Clicar em "Política de Privacidade"
  - Verificar que redireciona para `/legal/privacy`
  - Voltar e clicar em "Termos de Uso"
  - Verificar que redireciona para `/legal/terms`

**Arquivos relacionados:**
- `apps/pei-collab/src/pages/PrivacyPolicy.tsx`
- `apps/pei-collab/src/pages/TermsOfUse.tsx`
- `apps/pei-collab/src/pages/Splash.tsx` (footer)
- `apps/pei-collab/src/App.tsx` (rotas)

---

### 5. Criação de Profissionais

#### Interface: Página de Profissionais
**Localização:** `apps/gestao-escolar/src/pages/Professionals.tsx`

**Funcionalidades para testar:**
- [ ] **Criar Novo Profissional**
  - Acessar página "Profissionais" (`/professionals`)
  - Clicar em "Adicionar Profissional"
  - Preencher formulário:
    - Nome completo
    - E-mail
    - Perfil/Role
    - Rede (tenant)
  - Salvar
  - Verificar que profissional aparece na lista
  - Verificar que e-mail é salvo corretamente (mesmo se null)

- [ ] **Paginação**
  - Verificar que paginação funciona
  - Navegar entre páginas
  - Verificar que dados são carregados corretamente
  - Verificar que `onPageSizeChange` não está sendo usado (foi removido)

**Arquivos relacionados:**
- `apps/gestao-escolar/src/pages/Professionals.tsx`
- `apps/gestao-escolar/src/components/CreateProfessionalDialog.tsx`

---

## 📋 Checklist de Validação Completo

### Testes Unitários
- [x] backupService.test.ts criado e validado
- [x] auditService.test.ts criado e validado
- [x] evaluationService.test.ts criado e validado

### Funcionalidades Críticas
- [ ] Backup manual completo
- [ ] Backup manual compacto
- [ ] Criação de job de backup
- [ ] Verificação de integridade de backup
- [ ] Visualização de logs de auditoria
- [ ] Exportação de logs em CSV
- [ ] Busca de notas com dados relacionados
- [ ] Busca de frequência
- [ ] Busca de pareceres descritivos
- [ ] Criação de nova nota
- [ ] Acesso às páginas legais
- [ ] Links no footer funcionando
- [ ] Criação de profissional

### Correções TypeScript
- [x] Erros críticos corrigidos
- [x] Variáveis não usadas removidas
- [x] Imports não usados removidos
- [x] Queries Supabase com fallbacks

---

## 🚀 Como Executar Testes

### Testes Unitários
```bash
# Executar todos os testes
cd apps/gestao-escolar
pnpm test

# Executar testes específicos
pnpm test backupService
pnpm test auditService
pnpm test evaluationService

# Executar com coverage
pnpm test:coverage

# Executar em modo watch
pnpm test --watch
```

### Testes Manuais
1. Iniciar servidor de desenvolvimento:
   ```bash
   cd apps/gestao-escolar
   pnpm dev
   ```

2. Acessar aplicação no navegador
3. Fazer login com perfil apropriado (Superadmin para backups, etc.)
4. Seguir checklist acima

---

## 📝 Notas

- **Testes unitários** usam mocks do Supabase
- **Testes manuais** requerem ambiente de desenvolvimento rodando
- **Funcionalidades de backup** requerem permissões de Superadmin
- **Logs de auditoria** são filtrados por tenantId automaticamente
- **Páginas legais** estão acessíveis publicamente (sem autenticação)

---

**Última atualização:** 2025-12-05
