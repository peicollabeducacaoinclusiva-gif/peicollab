# 🔒 AUDITORIA DE SEGURANÇA E LGPD - PEI COLLAB

**Data**: 08 de Janeiro de 2025  
**Sistema**: PEI Collab Monorepo (6 Apps)  
**Foco**: Segurança + LGPD (Lei Geral de Proteção de Dados)

---

## 📋 ÍNDICE

1. [Análise de Segurança](#segurança)
2. [Conformidade LGPD](#lgpd)
3. [Testes Automatizados](#testes)
4. [Vulnerabilidades Identificadas](#vulnerabilidades)
5. [Recomendações](#recomendações)

---

## 🔐 1. ANÁLISE DE SEGURANÇA

### 1.1 Autenticação e Autorização

#### ✅ Pontos Fortes:
- **Supabase Auth**: Sistema robusto de autenticação
- **JWT Tokens**: Tokens seguros com expiração
- **RLS (Row Level Security)**: Políticas em nível de linha

#### ⚠️ Pontos de Atenção:
- **Verificação de Perfil**: Alguns componentes podem não verificar perfil antes de renderizar
- **Token Refresh**: Não identificado refresh automático em todas as rotas
- **Sessão Expirada**: Tratamento de erro pode expor informações

#### 🔴 Vulnerabilidades Potenciais:
1. **Bypass de Autorização**: Se RLS não estiver aplicada em todas as tabelas
2. **Privilege Escalation**: Professor pode tentar acessar dados de coordenador
3. **Session Fixation**: Não identificada rotação de sessão

---

### 1.2 Proteção Contra Ataques

#### SQL Injection
**Status**: ✅ **PROTEGIDO**
- Supabase usa prepared statements
- Todas as queries usam client JS (não SQL bruto no frontend)

```typescript
// ✅ SEGURO - Supabase Client
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('id', studentId) // Parametrizado

// 🔴 INSEGURO (não encontrado no código)
// const query = `SELECT * FROM students WHERE id = '${studentId}'`
```

#### XSS (Cross-Site Scripting)
**Status**: ⚠️ **ATENÇÃO NECESSÁRIA**

**Áreas de Risco**:
- Exibição de nomes de alunos/professores
- Comentários em PEIs
- Feedbacks de profissionais de apoio
- Descrições de atividades
- Conteúdo de planos de aula

**Mitigação**:
```typescript
// ✅ SEGURO - React escapa automaticamente
<p>{student.name}</p>

// 🔴 INSEGURO - dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Verificar**: Buscar por `dangerouslySetInnerHTML` no código.

#### CSRF (Cross-Site Request Forgery)
**Status**: ✅ **PROTEGIDO**
- Supabase requer tokens JWT em headers
- SameSite cookies configurados

---

### 1.3 Row Level Security (RLS)

#### Tabelas Auditadas:

**✅ students**
- Políticas simplificadas implementadas
- Proteção contra recursão aplicada

**✅ peis**
- Professores acessam apenas seus PEIs
- Familiares acessam PEIs de seus filhos
- Coordenação acessa todos da escola

**⚠️ support_professional_feedbacks**
- Verificar se PA só acessa feedbacks de alunos atribuídos

**⚠️ pei_meetings**
- Verificar se apenas participantes acessam reuniões

**⚠️ atividades**
- Verificar se professores não acessam atividades privadas de outros

**⚠️ planos_aula**
- Verificar se professores não acessam planos de outros

#### Script de Verificação RLS:

```sql
-- Verificar todas as tabelas SEM RLS ativada
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
    SELECT tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
)
ORDER BY tablename;

-- Verificar tabelas SEM políticas
SELECT t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = t.schemaname
    AND p.tablename = t.tablename
)
ORDER BY t.tablename;
```

---

## 📜 2. CONFORMIDADE LGPD

### 2.1 Dados Pessoais Identificados

#### Dados Pessoais Simples:
- ✅ Nome completo (students, profiles)
- ✅ Data de nascimento (students)
- ✅ CPF (students) - **DADO SENSÍVEL**
- ✅ Telefone (profiles, parents/guardians)
- ✅ Endereço (students)
- ✅ Email (auth.users, profiles)
- ✅ Foto/Avatar (profiles)

#### Dados Sensíveis (Art. 5º, II):
- ✅ **Saúde**: Diagnósticos, laudos médicos (students, plano_aee)
- ✅ **Deficiência**: Tipo de deficiência (students)
- ✅ **Origem racial ou étnica**: Campo raça (students)
- ✅ **Educação**: Histórico escolar completo

#### Dados de Crianças e Adolescentes:
- ✅ **TODOS os alunos** - Requer consentimento dos responsáveis

---

### 2.2 Princípios da LGPD

#### ✅ Finalidade (Art. 6º, I)
**Status**: PARCIAL
- Falta documentação clara sobre finalidade de cada dado coletado
- **Recomendação**: Criar Política de Privacidade detalhada

#### ⚠️ Adequação (Art. 6º, II)
**Status**: EM ANÁLISE
- Verificar se todos os dados são necessários
- **Questionável**: CPF do aluno é realmente necessário?

#### ⚠️ Necessidade/Minimização (Art. 6º, III)
**Status**: ATENÇÃO
- Sistema coleta muitos dados
- **Recomendação**: Revisar campos obrigatórios

#### ✅ Segurança (Art. 6º, VII)
**Status**: BOM
- RLS implementada
- Criptografia em trânsito (HTTPS)
- Criptografia em repouso (Supabase)

#### 🔴 Transparência (Art. 6º, VI)
**Status**: AUSENTE
- **Falta**: Termo de Consentimento
- **Falta**: Política de Privacidade
- **Falta**: Aviso de Coleta de Dados

---

### 2.3 Direitos dos Titulares (Art. 18)

#### ❌ Confirmação e Acesso (Art. 18, I e II)
- **Falta**: Interface para o titular solicitar seus dados
- **Recomendação**: Criar página "Meus Dados"

#### ❌ Correção (Art. 18, III)
- **Parcial**: Coordenação pode editar dados
- **Falta**: Titular solicitar correção
- **Recomendação**: Permitir responsáveis editarem alguns campos

#### ❌ Anonimização/Bloqueio/Eliminação (Art. 18, IV)
- **Falta**: Função de "Direito ao Esquecimento"
- **Falta**: Anonimização de dados históricos
- **Recomendação**: Implementar soft-delete com anonimização

#### ❌ Portabilidade (Art. 18, V)
- **Falta**: Exportar dados em formato estruturado (JSON/CSV)
- **Recomendação**: Botão "Exportar Meus Dados"

#### ❌ Revogação de Consentimento (Art. 18, IX)
- **Falta**: Interface para revogar consentimento
- **Falta**: Processo documentado

---

### 2.4 Consentimento

#### 🔴 CRÍTICO - Consentimento de Crianças
**Art. 14, §1º**: Tratamento de dados de crianças requer consentimento de pelo menos um dos pais/responsáveis.

**Status Atual**: ❌ **NÃO IMPLEMENTADO**

**O que falta**:
1. Termo de Consentimento no cadastro
2. Checkbox de concordância
3. Log de consentimento (quem consentiu, quando, para quê)
4. Possibilidade de revogar

**Implementação Necessária**:
```sql
CREATE TABLE consent_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES students(id),
    parent_id uuid REFERENCES auth.users(id),
    consent_type text NOT NULL, -- 'data_collection', 'pei_creation', etc
    consented_at timestamptz DEFAULT now(),
    revoked_at timestamptz,
    ip_address inet,
    user_agent text
);
```

---

### 2.5 Logs de Acesso (Art. 37)

#### ⚠️ Logs de Auditoria
**Status**: PARCIAL

**O que existe**:
- Supabase mantém logs básicos de autenticação

**O que falta**:
- Log de quem acessou quais dados sensíveis
- Log de exportações de dados
- Log de alterações em dados pessoais
- Retenção de logs (mínimo 6 meses)

**Implementação Recomendada**:
```sql
CREATE TABLE access_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    action text NOT NULL, -- 'view', 'edit', 'delete', 'export'
    table_name text NOT NULL,
    record_id uuid,
    sensitive_data_accessed text[], -- CPF, diagnóstico, etc
    ip_address inet,
    user_agent text,
    accessed_at timestamptz DEFAULT now()
);
```

---

### 2.6 Vazamento de Dados

#### 🔴 CRÍTICO - Dados Expostos em Logs
**Verificar**: Console.log com dados sensíveis

```typescript
// 🔴 INSEGURO
console.log('Student data:', student) // Pode logar CPF, diagnóstico

// ✅ SEGURO
console.log('Loading student:', student.id) // Apenas ID
```

#### 🔴 Dados em URLs
**Verificar**: IDs em query params

```typescript
// ⚠️ ATENÇÃO
/student?id=123&cpf=12345678900 // CPF na URL é INSEGURO

// ✅ MELHOR
/student?id=123 // Apenas ID
```

#### 🔴 Dados em Relatórios
**Verificar**: PDFs podem ser salvos/compartilhados

- PEIs com diagnósticos médicos
- Relatórios com CPF/endereço
- **Recomendação**: Marca d'água "CONFIDENCIAL"

---

## 🧪 3. TESTES AUTOMATIZADOS

### 3.1 Teste de Bypass de Autenticação

```typescript
// Tentar acessar dados sem token
const { data, error } = await supabase
  .from('students')
  .select('*')

// Esperado: error !== null
```

### 3.2 Teste de Privilege Escalation

```typescript
// Professor A tenta acessar alunos do Professor B
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('assigned_teacher_id', 'outro-professor-id')

// Esperado: data === [] (vazio)
```

### 3.3 Teste de RLS

```sql
-- Tentar acessar dados como outro usuário
SET LOCAL jwt.claims.sub = 'user-id-malicioso';

SELECT * FROM students WHERE school_id = 'escola-x';
-- Esperado: 0 rows
```

---

## 🚨 4. VULNERABILIDADES IDENTIFICADAS

### CRÍTICAS 🔴

1. **Falta de Termo de Consentimento**
   - **Risco**: Violação LGPD Art. 14
   - **Impacto**: Multa até 2% do faturamento
   - **Prioridade**: URGENTE

2. **Ausência de Logs de Acesso a Dados Sensíveis**
   - **Risco**: Impossível auditar acessos indevidos
   - **Impacto**: Violação Art. 37
   - **Prioridade**: ALTA

3. **Sem Implementação do Direito ao Esquecimento**
   - **Risco**: Violação Art. 18, IV
   - **Impacto**: Processos judiciais
   - **Prioridade**: ALTA

### ALTAS ⚠️

4. **Dados Sensíveis Podem Estar em Logs/Console**
   - **Risco**: Vazamento acidental
   - **Prioridade**: MÉDIA

5. **Falta de Política de Privacidade**
   - **Risco**: Transparência insuficiente
   - **Prioridade**: MÉDIA

6. **Sem Exportação de Dados (Portabilidade)**
   - **Risco**: Violação Art. 18, V
   - **Prioridade**: MÉDIA

### MÉDIAS ℹ️

7. **Alguns campos podem não ser necessários**
   - Exemplo: CPF do aluno
   - **Prioridade**: BAIXA

---

## ✅ 5. RECOMENDAÇÕES

### 5.1 Implementações URGENTES (< 1 semana)

#### 1. Termo de Consentimento
```typescript
// Adicionar ao cadastro de aluno
<Checkbox>
  Li e concordo com a <Link>Política de Privacidade</Link> 
  e autorizo o tratamento dos dados pessoais do(a) estudante 
  para fins educacionais.
</Checkbox>
```

#### 2. Política de Privacidade
Documento com:
- Quais dados são coletados
- Para que são usados
- Quem tem acesso
- Por quanto tempo são armazenados
- Como exercer direitos

#### 3. Remover console.log com dados sensíveis
```bash
# Buscar todos console.log
grep -r "console.log" apps/
```

### 5.2 Implementações ALTAS (< 1 mês)

#### 4. Sistema de Logs de Auditoria
- Tabela `access_logs`
- Trigger em tabelas sensíveis
- Dashboard para DPO (Data Protection Officer)

#### 5. Direito ao Esquecimento
```typescript
// Função de anonização
async function anonymizeStudent(studentId: string) {
  await supabase
    .from('students')
    .update({
      name: 'Aluno Anonimizado',
      cpf: null,
      birth_date: null,
      address: null,
      is_anonymized: true
    })
    .eq('id', studentId)
}
```

#### 6. Exportação de Dados
```typescript
// Endpoint para exportar dados do titular
async function exportStudentData(studentId: string) {
  const student = await getStudent(studentId)
  const peis = await getPEIs(studentId)
  const feedbacks = await getFeedbacks(studentId)
  
  return {
    student,
    peis,
    feedbacks,
    exported_at: new Date().toISOString()
  }
}
```

### 5.3 Implementações MÉDIAS (< 3 meses)

#### 7. Criptografia de Campos Sensíveis
```sql
-- Usar pgcrypto para CPF, diagnósticos
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE students 
ADD COLUMN cpf_encrypted bytea;
```

#### 8. Interface para Titulares
- Página "Meus Dados"
- Solicitar correção
- Revogar consentimento
- Exportar dados

#### 9. Revisão de Campos Obrigatórios
- Marcar apenas essenciais como required
- Campos opcionais devem ter justificativa

---

## 📊 RESUMO EXECUTIVO

### Status Geral:

| Categoria | Status | Nota |
|-----------|--------|------|
| **Segurança Técnica** | ✅ BOM | 8/10 |
| **Conformidade LGPD** | 🔴 INSUFICIENTE | 4/10 |
| **Proteção de Dados** | ⚠️ ATENÇÃO | 6/10 |
| **Transparência** | 🔴 CRÍTICO | 2/10 |
| **Direitos dos Titulares** | 🔴 CRÍTICO | 3/10 |

### Principais Gaps:
1. ❌ Termo de Consentimento
2. ❌ Política de Privacidade
3. ❌ Logs de Auditoria
4. ❌ Direito ao Esquecimento
5. ❌ Portabilidade de Dados
6. ❌ Interface para Titulares

### Risco Atual:
**🔴 ALTO** - Sistema não está em plena conformidade com LGPD

### Tempo Estimado para Conformidade:
**2-3 meses** com equipe dedicada

---

## 📚 REFERÊNCIAS

- Lei nº 13.709/2018 (LGPD)
- ANPD - Autoridade Nacional de Proteção de Dados
- Guia de Boas Práticas LGPD para Educação
- OWASP Top 10 Security Risks

---

**Próximo passo**: Executar testes automatizados de segurança

