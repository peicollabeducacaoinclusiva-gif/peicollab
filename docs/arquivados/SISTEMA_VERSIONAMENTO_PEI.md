# Sistema de Versionamento de PEI

## 📋 Problema Identificado

O sistema estava criando **múltiplos PEIs ativos simultâneos** para o mesmo aluno, causando:
- Confusão na interface (vários PEIs do mesmo aluno)
- Dificuldade em saber qual PEI é o atual
- Dados duplicados e desorganizados

### Cenário problemático:
1. Coordenador atribui aluno → cria PEI em **draft**
2. Professor cria novo PEI → cria **OUTRO** PEI em draft
3. Resultado: 2+ PEIs concorrentes do mesmo aluno ❌

---

## ✅ Solução Implementada

### Sistema de Versionamento Único

Agora o sistema garante que:
- **Apenas 1 PEI ATIVO por aluno** (`is_active_version = true`)
- PEIs antigos se tornam **versões históricas** (`is_active_version = false`)
- Cada PEI tem um `version_number` (v1, v2, v3...)
- Dashboards mostram **apenas versões ativas**

---

## 🛠️ Implementação Técnica

### 1. Banco de Dados (`20250203000003_enforce_single_active_pei.sql`)

#### Funções criadas:

```sql
-- Verifica se aluno tem PEI ativo
has_active_pei(student_id UUID) → BOOLEAN

-- Retorna o PEI ativo do aluno
get_active_pei(student_id UUID) → TABLE

-- Cria nova versão (arquiva a anterior automaticamente)
create_new_pei_version(student_id, teacher_id, school_id, tenant_id) → UUID
```

#### Trigger automático:
```sql
-- Garante que ao marcar PEI como ativo, desativa os outros do mesmo aluno
ensure_single_active_pei_trigger
```

#### View simplificada:
```sql
-- Mostra apenas PEIs ativos com dados relacionados
CREATE VIEW active_peis AS ...
```

#### Limpeza de dados:
- Script automático que marcou apenas o PEI **mais recente** de cada aluno como ativo
- PEIs antigos foram arquivados como versões históricas

---

### 2. Frontend

#### `TeacherDashboard.tsx`
```typescript
// Busca APENAS PEIs ativos
.eq('is_active_version', true)
```

#### `CreatePEI.tsx`
```typescript
// ANTES de criar novo PEI, verifica se já existe um ativo
const { data: existingActivePEI } = await supabase
  .from("peis")
  .select("id, status, version_number")
  .eq("student_id", selectedStudentId)
  .eq("is_active_version", true)
  .maybeSingle();

if (existingActivePEI) {
  // Redireciona para editar o existente
  navigate(`/pei/edit?id=${existingActivePEI.id}`);
}
```

#### `RequestPEIDialog.tsx` (Coordenador)
```typescript
// Verifica se aluno já tem PEI ativo
if (existingPEI) {
  // NÃO cria novo - apenas reatribui professor se necessário
  toast({ description: "PEI já existe. Professor foi atribuído." });
}
```

---

## 📊 Fluxo Atual

### Cenário 1: Coordenador solicita PEI
```
1. Coordenador seleciona aluno
2. Sistema verifica: aluno já tem PEI ativo?
   ├─ SIM → Reatribui professor ao PEI existente
   └─ NÃO → Cria novo PEI v1 (is_active_version = true)
```

### Cenário 2: Professor tenta criar PEI
```
1. Professor seleciona aluno atribuído
2. Sistema verifica: aluno já tem PEI ativo?
   ├─ SIM → Redireciona para editar o existente
   └─ NÃO → Cria novo PEI v1
```

### Cenário 3: Dashboard
```
- Lista apenas PEIs com is_active_version = true
- 1 PEI por aluno no máximo
- Interface limpa e organizada ✅
```

---

## 🔄 Versionamento

### Estrutura de versões:
```
Aluno: João Silva
├─ PEI v1 (is_active_version = false) ← Criado 2024-01-15
├─ PEI v2 (is_active_version = false) ← Criado 2024-06-10  
└─ PEI v3 (is_active_version = true)  ← Criado 2025-01-20 ✅ ATIVO
```

### Como criar nova versão:
- **Opção futura**: Botão "Criar Nova Versão" no dashboard
- **Automático**: Quando necessário arquivar um PEI antigo

---

## 🎯 Benefícios

✅ **Interface limpa**: Apenas 1 PEI por aluno nas listas  
✅ **Dados organizados**: Histórico de versões preservado  
✅ **Consistência garantida**: Trigger impede duplicatas  
✅ **Performance**: Queries filtram apenas versões ativas  
✅ **Rastreabilidade**: Todas as versões antigas ficam disponíveis  

---

## 🔍 Consultas Úteis

### Ver PEI ativo de um aluno:
```sql
SELECT * FROM peis
WHERE student_id = 'uuid-do-aluno'
AND is_active_version = true;
```

### Ver histórico de versões:
```sql
SELECT id, version_number, status, created_at, is_active_version
FROM peis
WHERE student_id = 'uuid-do-aluno'
ORDER BY version_number DESC;
```

### Usar a view simplificada:
```sql
SELECT * FROM active_peis
WHERE assigned_teacher_id = 'uuid-do-professor';
```

---

## 🚀 Próximos Passos (Opcional)

1. **Interface de Histórico**: Tela para visualizar versões antigas de PEIs
2. **Comparação de Versões**: Diff entre v1, v2, v3...
3. **Restauração**: Permitir restaurar dados de versões anteriores
4. **Arquivamento Manual**: Botão para coordenador criar nova versão intencionalmente

---

## 🔐 Segurança

- Função `ensure_single_active_pei()` com `SECURITY DEFINER`
- Triggers garantem integridade mesmo em acessos diretos ao banco
- RLS continua aplicado em todas as queries
- Índice UNIQUE para performance: `unique_active_pei_version`

---

## 📝 Notas de Migração

A migração `20250203000003_enforce_single_active_pei.sql` automaticamente:
- ✅ Limpou dados duplicados existentes
- ✅ Marcou apenas PEIs mais recentes como ativos
- ✅ Criou funções auxiliares
- ✅ Instalou triggers de proteção
- ✅ Criou view `active_peis`

**Status**: ✅ Pronto para produção


