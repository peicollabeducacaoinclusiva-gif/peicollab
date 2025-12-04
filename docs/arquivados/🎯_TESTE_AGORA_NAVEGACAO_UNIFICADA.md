# 🎯 TESTE AGORA - NAVEGAÇÃO UNIFICADA!

**Status**: ✅ **TUDO PRONTO - TESTE EM 5 MINUTOS!**

---

## 🚀 APPS RODANDO

| App | URL | Status |
|-----|-----|--------|
| **PEI Collab** | http://localhost:8080 | ✅ |
| **Plano de AEE** | http://localhost:5175 | ✅ |
| **Planejamento** | http://localhost:5176 | ✅ |
| **Atividades** | http://localhost:5177 | ✅ |
| **Blog** | http://localhost:5179 | ✅ |
| **Landing** | http://localhost:3001 | ✅ |

---

## 🧪 TESTE EM 3 PASSOS (5 MINUTOS)

### PASSO 1: Login
```
1. Abrir: http://localhost:8080
2. Email: superadmin@teste.com
3. Senha: Teste123!
4. Clicar em "Entrar"
```

### PASSO 2: Procurar AppSwitcher
```
No header (direita), procurar:

[≣ Apps] ← Ícone de grade com texto "Apps"

Ao lado do Theme Toggle (🌙)
```

### PASSO 3: Clicar e Testar
```
1. Clicar no [≣ Apps]
2. Ver dropdown com 6 apps
3. Ver checkmark (✓) no "PEI Collab"
4. Clicar em "Blog"
5. Navegar para http://localhost:5179
6. Ver AppSwitcher também no Blog
```

---

## ✅ O QUE VOCÊ DEVE VER

### Dropdown do SuperAdmin
```
┌─────────────────────────┐
│ APLICAÇÕES DISPONÍVEIS   │
├─────────────────────────┤
│ ✓ PEI Collab            │ ← Você está aqui
│   Gestão Escolar        │
│   Plano de AEE          │
│   Planejamento          │
│   Atividades            │
│   Blog                  │
└─────────────────────────┘
```

**6 apps listados!**

---

## 🧪 TESTE ADICIONAL: Filtro por Role

### Secretary (3 apps)
```
1. Fazer logout
2. Login: secretary@test.com / Secretary@123
3. Clicar em AppSwitcher
4. Ver apenas: PEI Collab, Gestão Escolar, Blog
```

### Teacher (3 apps)
```
1. Fazer logout
2. Login: coordenador@teste.com / Teste123!
3. Clicar em AppSwitcher
4. Ver: PEI Collab, Planejamento, Atividades
```

---

## 🔍 VERIFICAR TOKEN SSO

```
1. F12 (DevTools)
2. Application → Local Storage
3. Procurar: @pei-collab:auth-token
4. Ver JSON com access_token, refresh_token, etc
```

---

## 📸 EVIDÊNCIAS ESPERADAS

### Checklist Visual
- [ ] Ícone Grid3x3 no header
- [ ] Texto "Apps" ao lado
- [ ] Dropdown abre ao clicar
- [ ] Apps listados
- [ ] Checkmark no app atual
- [ ] Fechar ao clicar fora

### Checklist Funcional
- [ ] SuperAdmin vê 6 apps
- [ ] Secretary vê 3 apps
- [ ] Teacher vê 3 apps
- [ ] Navegação funciona
- [ ] Token no localStorage
- [ ] AppSwitcher em todos os apps

---

## 🎯 SE ALGO NÃO FUNCIONAR

### AppSwitcher não aparece
```
Console → Ver erros
Verificar se apps foram reiniciados
```

### Dropdown vazio
```
Verificar role do usuário
Console → Ver logs de query ao Supabase
```

### Navegação não funciona
```
Verificar URLs no .env
Console → Ver se há erros
```

---

## 🎊 SUCESSO ESPERADO

Ao completar os 3 passos:
- ✅ AppSwitcher visível e funcional
- ✅ Dropdown com 6 apps (SuperAdmin)
- ✅ Navegação fluida entre apps
- ✅ Token SSO no localStorage
- ✅ Filtro por role funcionando

---

# 🏆 SISTEMA PRONTO - TESTE AGORA!

**Tempo**: 5 minutos  
**Resultado esperado**: ✅ 100% funcional

---

**URLs Rápidas**:
- PEI Collab: http://localhost:8080
- Blog: http://localhost:5179
- Planejamento: http://localhost:5176
- Atividades: http://localhost:5177

**Credenciais**:
- SuperAdmin: `superadmin@teste.com` / `Teste123!`
- Secretary: `secretary@test.com` / `Secretary@123`

---

**Pronto para testar!** 🚀

