# 🎯 Dashboards Unificados - Implementação em Progresso

## ✅ Concluído com Sucesso

### 1. Package @pei/dashboards Criado
```
packages/dashboards/
  ├── package.json ✅
  ├── tsconfig.json ✅
  ├── src/
  │   ├── index.ts ✅
  │   ├── types.ts ✅
  │   ├── SuperadminDashboard.tsx ✅ (movido de pei-collab)
  │   ├── DirectorDashboard.tsx ✅ (novo)
  │   ├── CoordinatorDashboard.tsx ✅ (novo)
  │   └── components/
  │       └── ImportCSVDialog.tsx ✅ (movido de pei-collab)
```

### 2. SuperadminDashboard Movido e Atualizado
- ✅ Copiado de `apps/pei-collab/src/components/dashboards/SuperadminDashboard.tsx`
- ✅ Imports atualizados para usar `@pei/database` e `@pei/ui`
- ✅ ImportCSVDialog também movido e atualizado
- ✅ Adicionada nova aba "Gestão Escolar" com:
  - Card de Profissionais
  - Card de Turmas
  - Card de Disciplinas
  - Links para o app de gestao-escolar

### 3. Novos Dashboards Criados

#### DirectorDashboard.tsx
- ✅ Estatísticas da escola do diretor
- ✅ Cards: Alunos, Professores, Turmas, Usuários Ativos
- ✅ Links rápidos para gestão escolar
- ✅ Links para PEI Collab
- ✅ Barra de progresso de cobertura de PEI

#### CoordinatorDashboard.tsx
- ✅ Estatísticas pedagógicas
- ✅ Cards: Turmas, Disciplinas, Alunos, Professores
- ✅ Links para gestão de turmas e disciplinas
- ✅ Links para PEI Collab
- ✅ Métricas pedagógicas (alunos por turma, turmas por professor)

### 4. Integração Apps

#### gestao-escolar
- ✅ Dependência `@pei/dashboards` adicionada ao package.json
- ✅ SimpleDashboard.tsx criado (dashboard padrão)
- ✅ Dashboard.tsx atualizado com renderização por role:
  - superadmin → SuperadminDashboard
  - school_director → DirectorDashboard
  - coordinator → CoordinatorDashboard
  - outros → SimpleDashboard

#### pei-collab
- ✅ Dependência `@pei/dashboards` adicionada ao package.json
- ✅ Import atualizado: `import { SuperadminDashboard } from "@pei/dashboards"`

### 5. Package @pei/ui Expandido
- ✅ Componentes UI copiados de apps/pei-collab
- ✅ Exports adicionados ao index.ts:
  - Button, Card, Input, Label, Badge
  - Dialog, Select, Tabs, Table, Alert
  - useToast hook

### 6. Instalação de Dependências
- ✅ `pnpm install` executado com sucesso
- ✅ Novo package @pei/dashboards reconhecido no workspace

## 🔧 Problema Identificado

### Tabs não renderizam conteúdo
**Sintoma:** 
- Tabs aparecem corretamente
- Aba "Gestão Escolar" é clicável e fica selecionada
- Mas nenhum tabpanel é exibido (todos com `hidden=true` e `data-state="inactive"`)

**Possível Causa:**
- Incompatibilidade entre componente Tabs do @pei/ui e o SuperadminDashboard
- Possível problema com a forma como os TabsContent estão sendo renderizados
- Pode ser necessário ajustar a lógica de controle de estado das tabs

### Erros 400 no Console
- 2 requisições com status 400 (possivelmente do Supabase)
- Podem estar relacionadas a policies RLS ou queries inválidas

## 🔄 Próximos Passos

### 1. Debugar Tabs
- Verificar se o componente Tabs está funcionando em outros lugares
- Comparar com a implementação original no pei-collab
- Verificar se o activeTab state está sendo propagado corretamente

### 2. Verificar Queries
- Identificar quais queries retornam 400
- Corrigir policies RLS ou queries malformadas

### 3. Testar Outros Dashboards
- Criar usuário com role "school_director"
- Testar DirectorDashboard
- Criar usuário com role "coordinator"
- Testar CoordinatorDashboard

### 4. Ajustar URLs
- Substituir `http://localhost:5174/` hardcoded por variáveis de ambiente
- Usar `VITE_GESTAO_ESCOLAR_URL` para produção

## 📊 Estrutura Final

### Dashboards por Role:
| Role | Dashboard | Local |
|------|-----------|-------|
| superadmin | SuperadminDashboard | @pei/dashboards |
| school_director | DirectorDashboard | @pei/dashboards |
| coordinator | CoordinatorDashboard | @pei/dashboards |
| education_secretary | SimpleDashboard | gestao-escolar |
| teacher | SimpleDashboard | gestao-escolar |
| outros | SimpleDashboard | gestao-escolar |

### Apps:
- **pei-collab**: Mantém todos os dashboards específicos de PEI (Teacher, AEE, Family, etc.) + usa SuperadminDashboard do @pei/dashboards
- **gestao-escolar**: Usa dashboards do @pei/dashboards para roles administrativos + SimpleDashboard para outros

## 🎯 Benefícios Alcançados

1. **Zero Duplicação**: SuperadminDashboard agora é compartilhado
2. **Manutenção Centralizada**: Atualiza em um lugar, reflete em ambos apps
3. **Escalabilidade**: Fácil adicionar novos dashboards
4. **Separação de Responsabilidades**: Cada app mantém seu foco
5. **Reusabilidade**: Director e Coordinator dashboards podem ser usados em ambos apps

## 🚀 Status Atual

- ✅ Arquitetura implementada
- ✅ Package criado e reconhecido
- ✅ Componentes movidos e imports ajustados
- ✅ Novos dashboards criados
- ✅ Apps atualizados
- ✅ Dependências instaladas
- ⚠️ SuperadminDashboard carrega mas tabs não mostram conteúdo
- ⏳ Dashboards Director e Coordinator não testados ainda
- ⏳ Correção de bugs pendente

---

**Data:** 11/11/2025  
**Status:** 🔨 EM PROGRESSO - 85% COMPLETO  
**Próximo:** Debugar e corrigir renderização das tabs



