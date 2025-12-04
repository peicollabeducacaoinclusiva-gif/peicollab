# 📝 COMO APLICAR TESTES E IMPLEMENTAÇÃO LGPD

**Guia Passo a Passo para Executar os Scripts de Segurança**

---

## 🎯 O QUE VOCÊ TEM

3 documentos SQL criados pela auditoria:

1. **🧪_TESTES_SEGURANCA_SQL.sql** - Testes de segurança
2. **🛡️_IMPLEMENTAR_LGPD_COMPLETO.sql** - Implementação LGPD
3. **📊_RELATORIO_FINAL_SEGURANCA_LGPD.md** - Relatório completo

---

## 📋 PASSO 1: EXECUTAR TESTES (15 min)

### 1.1 Abrir Supabase Dashboard

1. Ir para https://supabase.com/dashboard
2. Selecionar seu projeto PEI Collab
3. Menu lateral → **SQL Editor**
4. Click em **"New query"**

### 1.2 Executar os Testes

1. Abrir o arquivo: `🧪_TESTES_SEGURANCA_SQL.sql`
2. Copiar **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Colar no SQL Editor do Supabase
4. Click em **"Run"** (▶️) ou Ctrl+Enter

### 1.3 Analisar Resultados

O script vai gerar **11 relatórios**:

#### ✅ O que DEVE aparecer:
- "✅ Tabela com RLS ativada"
- "✅ TODAS protegidas"

#### 🔴 O que NÃO DEVE aparecer:
- "🔴 CRÍTICO: Tabela SEM RLS ativada"
- "🔴 CRÍTICO: Tabela de consentimento NÃO existe"
- "🔴 CRÍTICO: Tabela de logs de acesso NÃO existe"
- "🔴 PERIGO: Política muito permissiva"

### 1.4 Salvar Resultados

1. Click em "Results" (abaixo do editor)
2. Scroll por todos os resultados
3. Copiar e colar em arquivo de texto
4. Salvar como: `RESULTADOS_TESTES_SEGURANCA.txt`

---

## 🛡️ PASSO 2: APLICAR IMPLEMENTAÇÃO LGPD (30 min)

### 2.1 IMPORTANTE: Ler Antes de Aplicar

⚠️ **ATENÇÃO**: Este script vai:
- ✅ Criar 4 tabelas novas
- ✅ Adicionar colunas em tabelas existentes
- ✅ Criar 2 funções (anonimização, exportação)
- ✅ Criar RLS policies

⚠️ **NÃO VAI**:
- ❌ Deletar dados existentes
- ❌ Modificar dados de alunos/PEIs
- ❌ Quebrar sistema atual

### 2.2 Backup (Recomendado)

Antes de aplicar, fazer backup:

1. Supabase Dashboard → **Database**
2. **Backups** → "Create backup"
3. Aguardar conclusão

### 2.3 Aplicar o Script

1. SQL Editor → **"New query"**
2. Abrir: `🛡️_IMPLEMENTAR_LGPD_COMPLETO.sql`
3. Copiar **TODO** o conteúdo
4. Colar no SQL Editor
5. **Revisar** o código (importante!)
6. Click em **"Run"** (▶️)

### 2.4 Verificar Sucesso

Se tudo der certo, você verá no final:

```
✅ IMPLEMENTAÇÃO LGPD CONCLUÍDA
Tabelas criadas: consent_logs, access_logs, data_subject_requests, data_retention_policy
Funções criadas: anonymize_student, export_student_data
```

### 2.5 Verificar Tabelas Criadas

1. Supabase Dashboard → **Table Editor**
2. Verificar se aparecem as novas tabelas:
   - ✅ `consent_logs`
   - ✅ `access_logs`
   - ✅ `data_subject_requests`
   - ✅ `data_retention_policy`

3. Abrir cada tabela e verificar estrutura

---

## 🔍 PASSO 3: VERIFICAR CONSOLE.LOG (30 min)

### 3.1 Buscar console.log Perigosos

**No terminal** (na raiz do projeto):

```bash
# Windows PowerShell
cd C:\workspace\Inclusao\pei-collab
grep -r "console.log" apps/pei-collab/src --exclude-dir=node_modules | Select-String "student|pei|cpf|diagnosis"

# Ou usar findstr (nativo Windows)
findstr /s /i "console.log.*student" apps\pei-collab\src\*.tsx
findstr /s /i "console.log.*pei" apps\pei-collab\src\*.tsx
findstr /s /i "console.log.*cpf" apps\pei-collab\src\*.tsx
```

### 3.2 Revisar Manualmente

Abrir os arquivos com mais ocorrências:

**Prioridade ALTA**:
- `SuperadminDashboard.tsx` (71 logs!)
- `Dashboard.tsx` (38 logs)
- `TestDataManager.tsx` (13 logs)
- `ImportTest.tsx` (12 logs)

### 3.3 Substituir por Logger Seguro

**ANTES** (🔴 INSEGURO):
```typescript
console.log('Student data:', student)
// Pode logar: { name: "João", cpf: "123.456.789-00", diagnosis: "..." }
```

**DEPOIS** (✅ SEGURO):
```typescript
// Desenvolvimento: apenas ID
if (process.env.NODE_ENV !== 'production') {
  console.log('Loading student ID:', student.id)
}

// Produção: nada
```

### 3.4 Criar Logger Seguro

Criar arquivo: `src/lib/safeLogger.ts`

```typescript
export const safeLog = {
  info: (message: string, data?: {id: string}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, data)
    }
  },
  
  error: (message: string, error: Error) => {
    // Sempre loga erros (sem dados sensíveis)
    console.error(message, {
      name: error.name,
      message: error.message
    })
  }
}

// Uso:
import { safeLog } from '@/lib/safeLogger'

// ✅ SEGURO
safeLog.info('Loading student', { id: student.id })
```

---

## ✅ PASSO 4: IMPLEMENTAR TERMO DE CONSENTIMENTO (1-2 dias)

### 4.1 Criar Componente

Criar arquivo: `src/components/consent/ConsentForm.tsx`

```typescript
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface ConsentFormProps {
  studentId: string
  studentName: string
  onConsent: () => void
}

export function ConsentForm({ studentId, studentName, onConsent }: ConsentFormProps) {
  const [agreed, setAgreed] = useState(false)

  const handleSubmit = async () => {
    if (!agreed) return

    // Registrar consentimento
    const { error } = await supabase
      .from('consent_logs')
      .insert({
        student_id: studentId,
        consented_by_user_id: (await supabase.auth.getUser()).data.user?.id,
        consented_by_name: user.profile.full_name,
        consent_type: 'all',
        consent_text: CONSENT_TEXT_V1, // Texto completo do termo
        consent_version: '1.0',
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      })

    if (!error) {
      onConsent()
    }
  }

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-bold">Termo de Consentimento - LGPD</h3>
      
      <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto text-sm">
        <p>
          Eu, responsável legal pelo(a) estudante <strong>{studentName}</strong>,
          autorizo a coleta e tratamento dos seguintes dados pessoais:
        </p>
        <ul className="list-disc ml-6 mt-2">
          <li>Nome completo, data de nascimento</li>
          <li>CPF, RG (para fins de identificação)</li>
          <li>Endereço e contatos</li>
          <li>Informações educacionais</li>
          <li>Informações de saúde (diagnósticos, laudos médicos)</li>
        </ul>
        <p className="mt-2">
          <strong>Finalidade</strong>: Elaboração e acompanhamento de Plano Educacional 
          Individualizado (PEI) conforme legislação educacional.
        </p>
        <p className="mt-2">
          <strong>Base legal</strong>: Consentimento (LGPD Art. 7º, I) e cumprimento de 
          obrigação legal (Art. 7º, II).
        </p>
        <p className="mt-2 text-xs text-gray-600">
          Você pode revogar este consentimento a qualquer momento através do menu 
          "Meus Dados" ou entrando em contato com o DPO.
        </p>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox 
          id="consent" 
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(!!checked)}
        />
        <label htmlFor="consent" className="text-sm cursor-pointer">
          Li e concordo com a{' '}
          <a href="/politica-privacidade" className="text-blue-600 underline" target="_blank">
            Política de Privacidade
          </a>{' '}
          e autorizo o tratamento dos dados pessoais do(a) estudante para fins educacionais.
        </label>
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={!agreed}
        className="w-full"
      >
        Confirmar Consentimento
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Data: {new Date().toLocaleDateString('pt-BR')} | 
        Responsável: {user.profile.full_name}
      </p>
    </div>
  )
}

const CONSENT_TEXT_V1 = `[Texto completo do termo de consentimento...]`
```

### 4.2 Integrar no Cadastro

Em `CreateStudent.tsx` ou similar:

```typescript
const [showConsent, setShowConsent] = useState(false)
const [studentId, setStudentId] = useState<string>()

const handleStudentCreated = async (newStudentId: string) => {
  setStudentId(newStudentId)
  setShowConsent(true)
}

return (
  <>
    {!showConsent ? (
      <StudentForm onSuccess={handleStudentCreated} />
    ) : (
      <ConsentForm
        studentId={studentId!}
        studentName={studentName}
        onConsent={() => {
          // Redirecionar para dashboard
          navigate('/dashboard')
        }}
      />
    )}
  </>
)
```

---

## 📊 PASSO 5: VERIFICAR RESULTADOS

### 5.1 Testar Consentimento

1. Criar novo aluno
2. Verificar se formulário de consentimento aparece
3. Marcar checkbox e confirmar
4. Verificar no Supabase:
   - Table Editor → `consent_logs`
   - Deve ter 1 registro novo

### 5.2 Testar Anonimização

No SQL Editor:

```sql
-- Ver estudante antes
SELECT id, name, cpf, birth_date 
FROM students 
WHERE name = 'Aluno Teste'
LIMIT 1;

-- Anonimizar (trocar ID pelo real)
SELECT anonymize_student('uuid-do-aluno-aqui');

-- Ver depois
SELECT id, name, cpf, birth_date, anonymized_at
FROM students 
WHERE id = 'uuid-do-aluno-aqui';

-- Esperado: name = "Aluno Anonimizado ...", cpf = null, etc
```

### 5.3 Testar Exportação

No SQL Editor:

```sql
-- Exportar dados de um estudante
SELECT export_student_data('uuid-do-aluno-aqui');

-- Deve retornar JSON com:
-- { student: {...}, peis: [...], feedbacks: [...], ... }
```

---

## ❓ TROUBLESHOOTING

### Erro: "relation consent_logs does not exist"

**Causa**: Script LGPD não foi aplicado

**Solução**: 
1. Aplicar `🛡️_IMPLEMENTAR_LGPD_COMPLETO.sql`
2. Verificar se tabela foi criada

---

### Erro: "duplicate key value violates unique constraint"

**Causa**: Tentando criar tabela/função que já existe

**Solução**:
1. Verificar se já foi aplicado antes
2. Se sim, pular a criação
3. Script já tem `IF NOT EXISTS` para evitar isso

---

### Erro ao executar função `anonymize_student`

**Causa**: Permissões ou tabela não existe

**Solução**:
```sql
-- Verificar se função existe
SELECT * FROM pg_proc WHERE proname = 'anonymize_student';

-- Se não existir, recriar:
-- (copiar apenas a parte CREATE FUNCTION do script)
```

---

## ✅ CHECKLIST FINAL

Após aplicar tudo:

- [ ] ✅ Testes SQL executados com sucesso
- [ ] ✅ 4 novas tabelas criadas no Supabase
- [ ] ✅ 2 funções criadas (anonimizar, exportar)
- [ ] ✅ Console.log sensíveis revisados
- [ ] ✅ Logger seguro implementado
- [ ] ✅ Componente de consentimento criado
- [ ] ✅ Consentimento integrado no cadastro
- [ ] ✅ Testes de anonimização funcionando
- [ ] ✅ Testes de exportação funcionando
- [ ] ✅ Backup do banco feito

---

## 📞 PRÓXIMOS PASSOS

Depois de aplicar tudo:

1. **Criar Política de Privacidade** (contratar advogado)
2. **Implementar logs de auditoria** em componentes
3. **Criar página "Meus Dados"** para titulares
4. **Nomear DPO** (Data Protection Officer)
5. **Treinar equipe** em LGPD

---

## 📚 REFERÊNCIAS

- `📊_RELATORIO_FINAL_SEGURANCA_LGPD.md` - Relatório completo
- `⚡_RESUMO_EXECUTIVO_AUDITORIA.md` - Resumo executivo
- `🧪_TESTES_SEGURANCA_SQL.sql` - Script de testes
- `🛡️_IMPLEMENTAR_LGPD_COMPLETO.sql` - Script de implementação

---

**Dúvidas?** Releia o relatório completo ou consulte especialista em LGPD.

**Data**: 08/01/2025






