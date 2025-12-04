# 📝 INTEGRAÇÃO USER SELECTOR - PEI COLLAB

**Data**: 10/11/2025  
**Status**: ✅ CreateUserDialog modificado  
**Próximo**: Implementar em formulários

---

## ✅ JÁ MODIFICADO

### CreateUserDialog.tsx
**Arquivo**: `apps/pei-collab/src/components/superadmin/CreateUserDialog.tsx`

**Antes:** Formulário completo de cadastro  
**Depois:** Redirect para Gestão Escolar

**Mudanças:**
- ❌ Removido formulário de criação
- ❌ Removido campos (email, nome, role, tenant)
- ❌ Removido lógica de submit
- ✅ Adicionado mensagem informativa
- ✅ Adicionado botão "Abrir Gestão Escolar"
- ✅ Abre em nova aba http://localhost:5174/users
- ✅ Auto-refresh ao voltar

---

## 🔄 PRÓXIMOS PASSOS

### 1. Criar UserSelector no PEI Collab

**Novo Arquivo**: `apps/pei-collab/src/components/shared/UserSelector.tsx`

Copiar de: `apps/gestao-escolar/src/components/shared/UserSelector.tsx`

Ajustar imports para PEI Collab:
```tsx
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
// etc...
```

### 2. Usar em CreatePEI.tsx

**Localização**: Onde atribui professor

**Substituir:**
```tsx
// ANTES - Auto-atribuição
const assignedTeacherId = primaryRole === "coordinator" 
  ? null 
  : profile.id;

// DEPOIS - Seleção manual
<UserSelector
  value={assignedTeacherId}
  onChange={(id) => setAssignedTeacherId(id)}
  roleFilter={['teacher', 'aee_teacher']}
  schoolFilter={studentSchoolId}
  label="Professor Responsável"
/>
```

### 3. Usar em Outros Formulários

**Locais que podem usar UserSelector:**
- CreatePEI.tsx - Selecionar professor
- CreateMeeting.tsx - Selecionar participantes
- PEIOrientations.tsx - Selecionar especialistas
- Settings.tsx - Gerenciar permissões

---

## 📝 CÓDIGO DO USERSELECTOR

```tsx
import { UserSelector } from '@/components/shared/UserSelector';

// Exemplo 1: Professor responsável
<UserSelector
  value={teacherId}
  onChange={(id, userData) => {
    setTeacherId(id);
    console.log('Usuário selecionado:', userData);
  }}
  roleFilter={['teacher', 'aee_teacher']}
  schoolFilter={schoolId}
  label="Professor Responsável"
  required
/>

// Exemplo 2: Coordenador
<UserSelector
  value={coordinatorId}
  onChange={(id) => setCoordinatorId(id)}
  roleFilter={['coordinator']}
  label="Coordenador"
/>

// Exemplo 3: Especialista
<UserSelector
  value={specialistId}
  onChange={(id) => setSpecialistId(id)}
  roleFilter={['specialist']}
  label="Especialista"
/>
```

---

## 🎯 BENEFÍCIOS ALCANÇADOS

### CreateUserDialog Modificado
- ✅ Não cria mais usuários localmente
- ✅ Redireciona para Gestão Escolar
- ✅ Mensagem educativa clara
- ✅ Link direto para cadastro
- ✅ Auto-refresh dos dados

### Experiência do Usuário
- ✅ Sabe onde cadastrar
- ✅ Interface única e consistente
- ✅ Sem duplicação de código
- ✅ Manutenção mais fácil

---

## 🔄 AINDA FALTA

### Copiar UserSelector
```bash
# Copiar componente
cp apps/gestao-escolar/src/components/shared/UserSelector.tsx \
   apps/pei-collab/src/components/shared/UserSelector.tsx
```

### Ajustar Imports
No arquivo copiado, mudar:
```tsx
// De:
import { supabase } from '@pei/database';

// Para:
import { supabase } from '@/integrations/supabase/client';
```

### Usar nos Formulários
- [ ] CreatePEI.tsx
- [ ] CreateMeeting.tsx
- [ ] PEIOrientations.tsx
- [ ] Outros formulários que selecionam usuários

---

**Status**: ✅ CreateUserDialog modificado  
**Próximo**: Copiar UserSelector e implementar nos formulários

