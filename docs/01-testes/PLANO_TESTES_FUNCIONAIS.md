# 📋 Plano de Testes Funcionais

**Data:** 2025-01-28  
**Status:** ✅ **Plano criado - Aguardando estrutura**

---

## 📊 Status Atual da Infraestrutura

### ✅ Estruturas Disponíveis

- ✅ Tabela `audit_events` - existe e está funcionando
- ✅ Função `check_active_consents` - existe e foi atualizada
- ✅ Função `get_user_consents` - existe (verificar se tabela consents existe)
- ✅ Serviços TypeScript - corrigidos e sem erros

### ⚠️ Estruturas Pendentes

- ⚠️ Tabela `consents` - **não existe ainda** (precisa de migração)
- ⚠️ Tabela `backup_jobs` - não existe (sistema de backup pode não estar configurado)
- ⚠️ Tabela `backup_executions` - não existe

---

## 🧪 Testes para lgpdService

### Teste 1: Verificar estrutura de dados

**Status:** ⚠️ **AGUARDANDO ESTRUTURA**

**Pré-requisito:** Tabela `consents` deve existir

**Testes a executar:**

1. **Teste: `checkActiveConsents` com aluno sem consentimentos**
   ```typescript
   // Esperado: { student_id, consents: [], has_active_consents: false }
   ```

2. **Teste: `checkActiveConsents` com aluno com consentimentos ativos**
   ```typescript
   // Esperado: { student_id, consents: [...], has_active_consents: true }
   ```

3. **Teste: `checkActiveConsents` com `consentType` específico**
   ```typescript
   // Esperado: Filtra por tipo de consentimento
   ```

**Validações:**
- ✅ Formato de retorno compatível
- ✅ Usa RPC `get_user_consents`
- ✅ Obtém `tenant_id` corretamente
- ✅ Filtra por `consentType` quando fornecido

---

## 🧪 Testes para backupService

### Teste 2: Verificar estrutura de backup

**Status:** ⚠️ **AGUARDANDO ESTRUTURA**

**Pré-requisito:** Tabelas `backup_jobs` e `backup_executions` devem existir

**Testes a executar:**

1. **Teste: `getBackupExecutions` com `tenantId`**
   ```typescript
   // Esperado: Lista de execuções filtradas por tenant
   // Valida: Correção do .in() com builder
   ```

2. **Teste: `createBackupJob`**
   ```typescript
   // Esperado: Job criado com tipo BackupJob
   // Valida: Cast de retorno
   ```

3. **Teste: `updateBackupJob`**
   ```typescript
   // Esperado: Job atualizado com tipo BackupJob
   // Valida: Cast de retorno
   ```

4. **Teste: `executeBackup`**
   ```typescript
   // Esperado: Execução criada com tipo BackupExecution
   // Valida: Cast de retorno
   ```

5. **Teste: `verifyBackup`**
   ```typescript
   // Esperado: Validação usando variável storage
   // Valida: Variável não usada resolvida
   ```

---

## ✅ Testes de Validação de Código

### Teste 3: TypeScript e Linter

**Status:** ✅ **PASSOU**

**Resultado:**
- ✅ Nenhum erro de linter encontrado
- ✅ Todas as tipagens corretas
- ✅ Variáveis utilizadas corretamente

**Validação:**
```bash
cd apps/gestao-escolar
npm run type-check
```

---

## ✅ Testes de Migração SQL

### Teste 4: Função SQL `check_active_consents`

**Status:** ✅ **APLICADA E VALIDADA**

**Validação realizada:**
- ✅ Função existe
- ✅ Usa tabela `consents` (canônica)
- ✅ Não usa mais `data_consents` (antiga)

**Observação:** Função retornará erro se tabela `consents` não existir ainda.

---

## 📋 Checklist de Pré-requisitos

### Para testar lgpdService:

- [ ] Verificar se migração que cria tabela `consents` foi aplicada
- [ ] Criar dados de teste (estudantes, consentimentos)
- [ ] Executar testes de `checkActiveConsents`

### Para testar backupService:

- [ ] Verificar se migrações de backup foram aplicadas
- [ ] Criar dados de teste (backup_jobs)
- [ ] Executar testes de backup

---

## 🔧 Ações Necessárias

### 1. Verificar Migrações de Consentimentos

**Buscar:**
- Migração que cria tabela `consents`
- Migração que cria função `get_user_consents`

**Comando:**
```bash
# Listar migrações relacionadas
ls supabase/migrations/*consent*
ls supabase/migrations/*lgpd*
```

### 2. Aplicar Migrações Pendentes

Se as migrações existirem mas não foram aplicadas:
```bash
supabase migration list
supabase migration up
```

### 3. Criar Dados de Teste

Após migrações aplicadas, criar:
- Estudantes de teste
- Consentimentos de teste
- Jobs de backup de teste

---

## 📊 Resumo de Status

| Componente | Status Código | Status Estrutura | Status Testes |
|------------|---------------|------------------|---------------|
| **lgpdService** | ✅ Corrigido | ⚠️ Aguardando `consents` | ⏳ Pendente |
| **backupService** | ✅ Corrigido | ⚠️ Aguardando `backup_jobs` | ⏳ Pendente |
| **Migração SQL** | ✅ Aplicada | ⚠️ Depende de `consents` | ✅ Validada |
| **TypeScript** | ✅ Sem erros | ✅ N/A | ✅ Passou |

---

## ✅ Próximos Passos Recomendados

1. **Verificar migrações de consentimentos:**
   - Buscar migrações que criam `consents`
   - Aplicar se necessário

2. **Verificar sistema de backup:**
   - Verificar se backup está implementado
   - Aplicar migrações se necessário

3. **Criar dados de teste:**
   - Estudantes
   - Consentimentos
   - Jobs de backup

4. **Executar testes funcionais:**
   - Após estrutura pronta
   - Validar comportamento correto

---

**Última atualização:** 2025-01-28  
**Status:** ✅ **PLANO CRIADO - AGUARDANDO INFRAESTRUTURA**

