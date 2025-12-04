# ⚡ APLICAR MIGRAÇÃO: User_Roles

## 🚨 PROBLEMA

HTTP 500 ao buscar `user_roles` - recursão ou policy incorreta.

## ✅ SOLUÇÃO

Aplicar migração:
```
supabase/migrations/20250204000002_fix_user_roles_recursion.sql
```

## 📋 COMO APLICAR

1. Supabase SQL Editor
2. Copiar TODO o conteúdo do arquivo acima
3. Colar e executar
4. Aguardar: `✓ User_roles configurado corretamente!`

## ✅ DEPOIS

Recarregue e faça login novamente.  
Dashboard deve carregar sem HTTP 500!

---

**Arquivo:** 20250204000002_fix_user_roles_recursion.sql  
**Tempo:** ~5 segundos

