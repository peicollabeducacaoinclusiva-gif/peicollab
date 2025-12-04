# ✅ Erro Gestão Escolar Corrigido

## 🐛 Problema Identificado

**Erro:**
```
[ERROR] The symbol "getMainTable" has already been declared
```

**Arquivo:** `apps/gestao-escolar/src/components/import/FieldMapper.tsx`

## 🔍 Causa Raiz

A função `getMainTable` estava declarada **duas vezes** no mesmo arquivo:

1. **Linha 104-111**: Dentro do componente (✅ correto)
2. **Linha 396-403**: Fora do componente, após o `return` (❌ duplicação)

```typescript
// Declaração 1 (correta - dentro do componente)
const getMainTable = (type: string): string => {
  const tables: Record<string, string> = {
    'student': 'students',
    'professional': 'professionals',
    'user': 'profiles'
  };
  return tables[type] || 'students';
};

// ... código ...

// Declaração 2 (DUPLICADA - fora do componente)
function getMainTable(type: string): string {
  const tables: Record<string, string> = {
    'student': 'students',
    'professional': 'professionals',
    'user': 'profiles'
  };
  return tables[type] || 'students';
}
```

## ✅ Solução Aplicada

Removida a declaração duplicada (linhas 396-403), mantendo apenas a declaração dentro do componente.

**Antes:**
```typescript
      </Card>
    </div>
  );

  function getMainTable(type: string): string {
    const tables: Record<string, string> = {
      'student': 'students',
      'professional': 'professionals',
      'user': 'profiles'
    };
    return tables[type] || 'students';
  }
}
```

**Depois:**
```typescript
      </Card>
    </div>
  );
}
```

## 📊 Validação

- ✅ Declaração duplicada removida
- ✅ Sem erros de lint
- ✅ TypeScript compila sem erros
- ✅ App Gestão Escolar deve iniciar normalmente

## 🚀 Próximo Passo

Execute novamente:
```bash
npm run dev
```

O app `@pei-collab/gestao-escolar` agora deve iniciar sem erros!

