# Correção do Erro no Alert - LoginForm

**Data:** 2025-12-05  
**Status:** ✅ Erro corrigido

---

## 🐛 Problema Identificado

### Erro:
```
NotFoundError: Failed to execute 'removeChild' on 'Node': 
The node to be removed is not a child of this node.
```

### Localização:
- **Arquivo:** `packages/ui/src/components/shared/LoginForm.tsx`
- **Componente:** `Alert` usado para exibir erros de login
- **Linha:** ~181

### Causa:
O componente `Alert` estava sendo renderizado condicionalmente sem uma `key` única, causando problemas quando o React tentava remover o elemento do DOM durante re-renderizações.

---

## ✅ Correção Aplicada

### Mudança:
Adicionada `key` única ao componente `Alert` para garantir que o React gerencie corretamente o ciclo de vida do elemento.

**Antes:**
```tsx
{error && (
  <Alert className="mb-4 border-red-200 bg-red-50">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertDescription className="text-sm text-red-800">{error}</AlertDescription>
  </Alert>
)}
```

**Depois:**
```tsx
{error && (
  <Alert key="login-error" className="mb-4 border-red-200 bg-red-50">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertDescription className="text-sm text-red-800">{error}</AlertDescription>
  </Alert>
)}
```

---

## 🧪 Teste

### Antes da Correção:
- ❌ Erro `removeChild` causava crash da aplicação
- ❌ ErrorBoundary capturava o erro e exibia tela de erro

### Após a Correção:
- ✅ Alert renderiza corretamente
- ✅ Erros de login são exibidos sem crash
- ✅ Página não quebra mais

---

## 📝 Notas

A `key` prop ajuda o React a identificar corretamente o elemento durante re-renderizações, evitando problemas de manipulação do DOM quando elementos condicionais são adicionados/removidos.

---

**Última atualização:** 2025-12-05
