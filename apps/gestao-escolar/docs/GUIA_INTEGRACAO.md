# Guia de Integração - Templates e Design Tokens

**Data:** 28/01/2025

---

## 🎯 OBJETIVO

Este guia mostra como integrar os templates e Design Tokens criados nas páginas existentes do app.

---

## ✅ PASSO 1: Design Tokens (JÁ INTEGRADO)

Os Design Tokens já foram importados no `index.css`:

```css
@import './styles/design-tokens.css';
```

**Status:** ✅ **Completo** - Os tokens já estão disponíveis globalmente!

---

## 📋 PASSO 2: Integrar Templates nas Páginas

### 2.1 Páginas de Listagem

**Antes:**
```tsx
export default function MyListPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader ... />
      <div className="container mx-auto px-4 py-6">
        <h1>Minha Lista</h1>
        {/* Código customizado */}
      </div>
    </div>
  );
}
```

**Depois:**
```tsx
import { StandardListPage } from '@/components/templates';
import { EmptyState } from '@/components/ui/microinteractions';
import { HoverCard } from '@/components/ui/microinteractions';

export default function MyListPage() {
  return (
    <StandardListPage
      title="Minha Lista"
      description="Descrição da lista"
      searchPlaceholder="Buscar..."
      searchValue={search}
      onSearchChange={setSearch}
      filters={<MyFilters />}
      onCreate={() => navigate('/create')}
      loading={isLoading}
      emptyState={
        <EmptyState
          icon={MyIcon}
          title="Nenhum item encontrado"
          description="Descrição"
        />
      }
    >
      {/* Seus itens aqui */}
    </StandardListPage>
  );
}
```

**Exemplo Real:**
- ✅ `StudentsRefactored.tsx` - Implementado
- ✅ `TransfersList.tsx` - Refatorado

### 2.2 Páginas de Detalhe

**Antes:**
```tsx
export default function MyDetailPage() {
  return (
    <div>
      <h1>Título</h1>
      {/* Conteúdo */}
    </div>
  );
}
```

**Depois:**
```tsx
import { StandardDetailPage } from '@/components/templates';

export default function MyDetailPage() {
  return (
    <StandardDetailPage
      title="Título"
      subtitle="Subtítulo"
      description="Descrição"
      onBack={() => navigate(-1)}
      tabs={[
        { value: 'info', label: 'Informações', content: <InfoTab /> },
        { value: 'history', label: 'Histórico', content: <HistoryTab /> },
      ]}
      onEdit={() => navigate('/edit')}
      onDelete={handleDelete}
    />
  );
}
```

### 2.3 Páginas de Edição

**Antes:**
```tsx
export default function MyEditPage() {
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos */}
    </form>
  );
}
```

**Depois:**
```tsx
import { StandardEditPage } from '@/components/templates';

export default function MyEditPage() {
  return (
    <StandardEditPage
      title="Editar Item"
      onSubmit={handleSubmit}
      sections={[
        { title: 'Dados Básicos', content: <BasicFields /> },
        { title: 'Dados Adicionais', content: <AdditionalFields /> },
      ]}
      saving={isSaving}
    />
  );
}
```

---

## 🎨 PASSO 3: Adicionar Microinterações

### 3.1 HoverCard

```tsx
import { HoverCard } from '@/components/ui/microinteractions';

// Envolver cards clicáveis
<HoverCard>
  <Card onClick={handleClick}>
    Conteúdo
  </Card>
</HoverCard>
```

### 3.2 LoadingSkeleton

```tsx
import { LoadingSkeleton } from '@/components/ui/microinteractions';

// Substituir loading states
{isLoading ? (
  <LoadingSkeleton variant="card" lines={3} />
) : (
  <Content />
)}
```

### 3.3 EmptyState

```tsx
import { EmptyState } from '@/components/ui/microinteractions';

<EmptyState
  icon={Users}
  title="Nenhum item encontrado"
  description="Descrição"
  action={<Button>Criar Novo</Button>}
/>
```

### 3.4 PageLoader

```tsx
import { PageLoader } from '@/components/ui/microinteractions';

{isLoading && <PageLoader message="Carregando..." />}
```

---

## 🔧 PASSO 4: Usar Design Tokens

### Cores

```css
/* Usar variáveis CSS */
.my-element {
  background: hsl(var(--color-primary));
  color: hsl(var(--color-primary-foreground));
}
```

### Espaçamentos

```css
.my-element {
  padding: var(--spacing-md);
  gap: var(--spacing-lg);
}
```

### Tipografia

```css
.my-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}
```

### Sombras

```css
.my-card {
  box-shadow: var(--shadow-md);
}
```

### Transições

```css
.my-button {
  transition: all var(--transition-base);
}
```

---

## 📝 CHECKLIST DE INTEGRAÇÃO

Para cada página:

- [ ] Substituir estrutura por template apropriado
- [ ] Adicionar EmptyState quando necessário
- [ ] Adicionar LoadingSkeleton para loading states
- [ ] Envolver cards clicáveis com HoverCard
- [ ] Usar variáveis CSS dos Design Tokens
- [ ] Testar responsividade
- [ ] Verificar acessibilidade

---

## 🎯 PÁGINAS PRIORITÁRIAS

### Alta Prioridade
1. ✅ Students (já refatorado como StudentsRefactored)
2. ✅ TransfersList (refatorado)
3. [ ] Classes
4. [ ] Professionals
5. [ ] OccurrencesList
6. [ ] TicketsList
7. [ ] DocumentsList

### Média Prioridade
- [ ] StudentProfile (detalhe)
- [ ] TransferDetail
- [ ] OccurrenceDetail
- [ ] TicketDetail

### Baixa Prioridade
- Outras páginas conforme necessário

---

## 📚 REFERÊNCIAS

- `apps/gestao-escolar/src/components/templates/` - Templates disponíveis
- `apps/gestao-escolar/src/components/ui/microinteractions/` - Microinterações
- `apps/gestao-escolar/src/styles/design-tokens.css` - Design Tokens
- `apps/gestao-escolar/docs/DESIGN_TOKENS_E_TEMPLATES_COMPLETO.md` - Documentação completa

---

**Status:** 🟢 **Guia completo e pronto para uso!**

