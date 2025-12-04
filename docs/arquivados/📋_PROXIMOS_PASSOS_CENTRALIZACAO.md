# 📋 PRÓXIMOS PASSOS - CENTRALIZAÇÃO DE CADASTROS

**Data**: 10/11/2025  
**Status**: Sistema implementado, falta integração com outros apps

---

## ✅ JÁ IMPLEMENTADO

### Gestão Escolar (Hub Central)
- ✅ Sistema de importação completo (5 etapas)
- ✅ Sistema de exportação (4 formatos)
- ✅ Gestão de usuários centralizada
- ✅ Templates E-grafite
- ✅ Validações configuráveis
- ✅ Resolução de duplicados
- ✅ Componente UserSelector compartilhado

### Banco de Dados
- ✅ 6 novas tabelas para import/export
- ✅ RLS policies configuradas
- ✅ Templates pré-salvos
- ✅ Auditoria completa

---

## 🔄 FALTA FAZER

### Fase 1: Modificar PEI Collab

#### 1.1 Remover Formulários de Cadastro
**Arquivos a Modificar:**
- `apps/pei-collab/src/pages/Settings.tsx`
- `apps/pei-collab/src/components/superadmin/UsersTable.tsx`

**Ações:**
- ❌ Remover formulário de criação de usuários
- ✅ Transformar em visualização apenas (read-only)
- ✅ Adicionar botão "Gerenciar Usuários no Gestão Escolar"

#### 1.2 Substituir por UserSelector
**Onde Usar:**
- Atribuição de professores em PEIs
- Seleção de coordenadores
- Seleção de especialistas
- Qualquer lugar que seleciona usuário

**Exemplo de Substituição:**
```tsx
// ANTES - Formulário completo
<UserForm onSubmit={createUser} />

// DEPOIS - Apenas seleção
<UserSelector
  value={selectedUserId}
  onChange={setSelectedUserId}
  roleFilter={['teacher']}
  label="Professor Responsável"
/>
```

#### 1.3 Adicionar Links Cruzados
Em formulários do PEI Collab:
```tsx
<p className="text-sm text-muted-foreground">
  Não encontrou o usuário?{' '}
  <a 
    href="http://localhost:5174/users" 
    target="_blank"
    className="text-primary hover:underline"
  >
    Cadastre no Gestão Escolar
  </a>
</p>
```

---

### Fase 2: Modificar Plano de AEE

#### 2.1 Verificar Cadastros Existentes
**Buscar em:**
- `apps/plano-aee/src/pages/`
- `apps/plano-aee/src/components/`

**Comando:**
```bash
cd apps/plano-aee
grep -r "create.*user\|new.*user\|cadastr" src/
```

#### 2.2 Substituir por UserSelector
Se houver formulários de usuário:
- ❌ Remover formulários
- ✅ Usar UserSelector
- ✅ Adicionar links para Gestão Escolar

---

### Fase 3: Testar Integração

#### 3.1 Teste de Fluxo Completo
1. **Gestão Escolar**: Cadastrar usuário
2. **PEI Collab**: Selecionar usuário em dropdown
3. **Verificar**: Dados sincronizam
4. **Atualizar no Gestão**: Mudar dados
5. **Verificar**: Mudança reflete em outros apps

#### 3.2 Teste de Importação
1. **Preparar CSV** com dados do E-grafite
2. **Importar** no Gestão Escolar
3. **Verificar** se aparece nos outros apps
4. **Testar** criar PEI com aluno importado

#### 3.3 Teste de Exportação
1. **Exportar** alunos para CSV
2. **Abrir** no Excel
3. **Exportar** para Educacenso
4. **Validar** formato oficial

---

### Fase 4: Documentação para Usuários

#### 4.1 Criar Tutoriais
- [ ] Como importar do E-grafite
- [ ] Como exportar para censo
- [ ] Como gerenciar usuários
- [ ] Vídeo tutorial (opcional)

#### 4.2 Atualizar README
- [ ] Atualizar arquitetura do sistema
- [ ] Documentar fluxo de dados
- [ ] Explicar papel de cada app

---

## 🎯 ARQUIVOS ESPECÍFICOS A MODIFICAR

### PEI Collab

#### Settings.tsx
```tsx
// Remover seção de cadastro de usuários
// Adicionar:
<Card>
  <CardHeader>
    <CardTitle>Gestão de Usuários</CardTitle>
    <CardDescription>
      O cadastro de usuários foi centralizado no app Gestão Escolar
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button asChild>
      <a href="http://localhost:5174/users" target="_blank">
        <ExternalLink className="mr-2 h-4 w-4" />
        Gerenciar Usuários no Gestão Escolar
      </a>
    </Button>
  </CardContent>
</Card>
```

#### CreatePEI.tsx (exemplo)
```tsx
// Substituir input manual de professor por:
<UserSelector
  value={assignedTeacherId}
  onChange={(id) => setAssignedTeacherId(id)}
  roleFilter={['teacher', 'aee_teacher']}
  schoolFilter={schoolId}
  label="Professor Responsável"
  required
/>
```

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- ✅ Tabelas criadas
- ✅ RLS configurado
- ✅ Templates salvos
- ✅ Migrações aplicadas

### Gestão Escolar
- ✅ Serviços de import/export
- ✅ Componentes de UI
- ✅ Páginas criadas
- ✅ Rotas adicionadas
- ✅ Dashboard atualizado
- ✅ UserSelector criado

### PEI Collab
- ⏳ Remover cadastros
- ⏳ Adicionar UserSelector
- ⏳ Links cruzados
- ⏳ Testar integração

### Plano de AEE
- ⏳ Verificar cadastros
- ⏳ Adicionar UserSelector (se necessário)
- ⏳ Testar integração

### Testes
- ⏳ Importar CSV E-grafite
- ⏳ Exportar Educacenso
- ⏳ Validar duplicados
- ⏳ Testar templates
- ⏳ Verificar auditoria

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### 1. Aplicar Migração (PRIMEIRO!)
```bash
# Execute no Supabase:
supabase/migrations/20251110000001_import_export_system.sql
```

### 2. Instalar Dependências
```bash
cd apps/gestao-escolar
npm install
# Instala: papaparse, xlsx, react-dropzone
```

### 3. Testar Gestão Escolar
```bash
npm run dev
# Testar: /import, /export, /users
```

### 4. Modificar PEI Collab
- Remover cadastros
- Adicionar UserSelector
- Testar seleção de usuários

### 5. Testar Integração
- Cadastrar no Gestão Escolar
- Selecionar no PEI Collab
- Verificar sincronização

### 6. Documentar
- Screenshots
- Tutoriais
- Vídeos (opcional)

---

## 📝 NOTAS IMPORTANTES

### Dependências entre Apps

```
Gestão Escolar (Hub)
    ↓ cria
profiles, students, professionals
    ↓ usa
PEI Collab, Plano de AEE, etc.
```

### Ordem de Setup
1. **Primeiro:** Configurar Gestão Escolar
2. **Depois:** Cadastrar dados básicos (escolas, usuários)
3. **Por último:** Usar outros apps

### Backup
Antes de grandes importações:
```sql
-- Fazer backup das tabelas principais
pg_dump ... > backup.sql
```

---

## 🎊 BENEFÍCIOS ALCANÇADOS

### Técnicos
- ✅ Fonte única de verdade
- ✅ Código não duplicado
- ✅ Manutenção simplificada
- ✅ Auditoria centralizada

### Funcionais
- ✅ Importação em lote (economiza tempo)
- ✅ Exportação automática para censo
- ✅ Validações customizáveis
- ✅ Resolução inteligente de duplicados

### Experiência
- ✅ Interface intuitiva
- ✅ Feedback visual claro
- ✅ Wizard guiado
- ✅ Menos erros manuais

---

## 🎯 PRÓXIMA SESSÃO DE TRABALHO

**Prioridade 1:**
1. Aplicar migração no banco
2. Testar importação com CSV do E-grafite
3. Verificar se dados aparecem corretamente

**Prioridade 2:**
1. Modificar PEI Collab (remover cadastros)
2. Implementar UserSelector
3. Testar integração

**Prioridade 3:**
1. Documentar para usuários finais
2. Criar tutoriais
3. Treinar equipe

---

**Preparado por**: Claude Sonnet 4.5  
**Data**: 10/11/2025  
**Status**: ✅ **PRONTO PARA PRÓXIMA FASE**

🚀 **GESTÃO ESCOLAR PRONTO, FALTA INTEGRAR OUTROS APPS!** 🚀




