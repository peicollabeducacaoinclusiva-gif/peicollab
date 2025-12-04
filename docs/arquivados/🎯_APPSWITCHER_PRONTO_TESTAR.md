# 🎯 APPSWITCHER - PRONTO PARA TESTAR!

**Data**: 10 de Novembro de 2025  
**Status**: ✅ **APPS REINICIADOS - PRONTO PARA TESTE!**

---

## 🚀 APPS REINICIADOS COM SUCESSO

### Apps Esperados nas Portas:

- ✅ **PEI Collab**: http://localhost:8080
- ✅ **Gestão Escolar**: http://localhost:5174
- ✅ **Plano de AEE**: http://localhost:5175
- ✅ **Planejamento**: http://localhost:5176
- ✅ **Atividades**: http://localhost:5177
- ✅ **Blog**: http://localhost:5179

---

## 🧪 TESTE O APPSWITCHER (5 MINUTOS)

### 1. Abrir PEI Collab
```
http://localhost:8080
```

### 2. Fazer Login
```
Email: superadmin@teste.com
Senha: Teste123!
```

### 3. Procurar o AppSwitcher

**Localização**: Header, lado direito

```
[Logo] PEI Collab | Rede... | [≣ Apps] [🔔] [🌙] [👤] [Sair]
                                 ↑↑↑
                              PROCURE AQUI!
```

### 4. Clicar no Ícone Grid3x3

**Deve abrir dropdown com**:
```
┌─────────────────────────┐
│ APLICAÇÕES DISPONÍVEIS   │
├─────────────────────────┤
│ ✓ PEI Collab            │ ← Checkmark
│   Gestão Escolar        │
│   Plano de AEE          │
│   Planejamento          │
│   Atividades            │
│   Blog                  │
└─────────────────────────┘
```

### 5. Testar Navegação

1. Clicar em **"Gestão Escolar"**
2. Deve abrir: http://localhost:5174
3. Ver que AppSwitcher também está lá
4. Clicar em **"PEI Collab"** para voltar

---

## ✅ O QUE VALIDAR

### Checklist Visual
- [ ] Ícone Grid3x3 aparece no header
- [ ] Texto "Apps" ao lado (desktop)
- [ ] Dropdown abre ao clicar
- [ ] "APLICAÇÕES DISPONÍVEIS" no topo
- [ ] 6 apps listados (SuperAdmin)
- [ ] Checkmark no app atual
- [ ] Fechar ao clicar fora

### Checklist Funcional
- [ ] Navegação entre apps funciona
- [ ] AppSwitcher em todos os apps
- [ ] Filtro por role (Secretary = 3 apps)
- [ ] Token no localStorage

---

## 🧪 TESTES POR ROLE

### SuperAdmin (6 apps)
```
Login: superadmin@teste.com / Teste123!
Deve ver: PEI, Gestão, AEE, Planejamento, Atividades, Blog
```

### Secretary (3 apps)
```
Login: secretary@test.com / Secretary@123
Deve ver: PEI, Gestão, Blog
```

### Teacher (3 apps)
```
Login: coordenador@teste.com / Teste123!
Deve ver: PEI, Planejamento, Atividades
```

---

## 🔍 VERIFICAR TOKEN SSO

1. Login em PEI Collab
2. F12 → Application → Local Storage
3. Procurar chave: `@pei-collab:auth-token`
4. Ver JSON com:
```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "v1.MR...",
  "expires_at": 1731267600,
  "user_id": "9918db90-..."
}
```

---

## 🎊 SUCESSO ESPERADO

Se tudo funcionou:
- ✅ AppSwitcher visível em todos os apps
- ✅ Dropdown abre e fecha
- ✅ Apps filtrados por role
- ✅ Navegação fluida
- ✅ Token SSO funcionando

---

# 🏆 BOA SORTE NOS TESTES!

**Tempo**: 5 minutos  
**Complexidade**: Baixa  
**Resultado esperado**: ✅ 100% funcional

---

**Pronto para testar**: Claude Sonnet 4.5  
**Data**: 10/11/2025

