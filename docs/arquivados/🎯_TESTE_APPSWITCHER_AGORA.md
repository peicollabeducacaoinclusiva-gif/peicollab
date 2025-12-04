# 🎯 TESTE O APPSWITCHER AGORA!

**Status**: ✅ **PRONTO PARA TESTE**

---

## 🚀 PASSO A PASSO (5 MINUTOS)

### 1. Reiniciar os Apps (OBRIGATÓRIO)

```bash
# No terminal, parar os apps atuais (Ctrl+C)
# Depois reiniciar:
pnpm dev
```

**Por quê?** Os apps precisam recarregar o `.env` com as novas URLs.

---

### 2. Abrir o PEI Collab

```
URL: http://localhost:8080
```

---

### 3. Fazer Login

```
Email: superadmin@teste.com
Senha: Teste123!
```

**Ou testar com outros usuários**:
- `secretary@test.com` / `Secretary@123` (verá 3 apps)
- `coordenador@teste.com` / `Teste123!` (verá 4 apps)

---

### 4. Procurar o AppSwitcher

**Localização**: Header, lado direito, antes do Theme Toggle

**Visual**: Ícone de grade (≣) com texto "Apps"

```
[Logo]  PEI Collab  |  Rede...  |  [≣ Apps] [🔔] [🌙] [👤] [Sair]
                                      ↑
                                   AQUI!
```

---

### 5. Clicar e Ver o Dropdown

**SuperAdmin verá**:
```
┌─────────────────────────┐
│ APLICAÇÕES DISPONÍVEIS   │
├─────────────────────────┤
│ ✓ PEI Collab            │ ← Checkmark (app atual)
│   Gestão Escolar        │
│   Plano de AEE          │
│   Planejamento          │
│   Atividades            │
│   Blog                  │
└─────────────────────────┘
```

---

### 6. Testar Navegação

1. **Clicar** em "Gestão Escolar"
2. **Verificar** que abre http://localhost:5174
3. **Ver** que o AppSwitcher também está lá
4. **Clicar** em "PEI Collab" para voltar

---

## ✅ O QUE VALIDAR

### Checklist Visual

- [ ] Ícone Grid3x3 aparece no header
- [ ] Texto "Apps" ao lado do ícone (desktop)
- [ ] Dropdown abre ao clicar
- [ ] "APLICAÇÕES DISPONÍVEIS" no topo do dropdown
- [ ] Apps listados abaixo
- [ ] Checkmark (✓) no app atual
- [ ] Fechar ao clicar fora

### Checklist Funcional

- [ ] SuperAdmin vê 6 apps
- [ ] Secretary vê 3 apps (Gestão, PEI, Blog)
- [ ] Teacher vê 3 apps (PEI, Planejamento, Atividades)
- [ ] Clicar em app navega corretamente
- [ ] AppSwitcher presente em todos os apps
- [ ] URLs do .env sendo usadas

### Checklist Técnico

- [ ] Token no localStorage: `@pei-collab:auth-token`
- [ ] Token contém: access_token, refresh_token, expires_at, user_id
- [ ] Console sem erros críticos
- [ ] Network requests OK (status 200)

---

## 🐛 SE ALGO NÃO FUNCIONAR

### AppSwitcher não aparece
```bash
# 1. Verificar que reiniciou os apps
pnpm dev

# 2. Limpar cache do navegador
Ctrl+Shift+Delete → Limpar cache

# 3. Verificar console por erros
F12 → Console
```

### Dropdown vazio
```bash
# Role não está sendo detectado
# Verificar console:
# - Deve ter log "🔐 Token salvo para SSO entre apps"
# - Deve ter query ao Supabase para user_roles
```

### URLs erradas
```bash
# Verificar .env
Get-Content .env | Select-String "VITE_.*_URL"

# Deve mostrar todas as 7 URLs
```

---

## 🎯 TESTE COMPLETO (10 MINUTOS)

### Cenário 1: SuperAdmin (6 apps)

```
1. Login: superadmin@teste.com / Teste123!
2. Clicar em AppSwitcher
3. Ver: 6 apps listados
4. Navegar: PEI → Gestão → Blog → PEI
5. ✅ Validar navegação fluida
```

### Cenário 2: Secretary (3 apps)

```
1. Logout
2. Login: secretary@test.com / Secretary@123
3. Clicar em AppSwitcher
4. Ver: apenas 3 apps (Gestão, PEI, Blog)
5. ✅ Validar filtro funcionando
```

### Cenário 3: Teacher (3 apps)

```
1. Logout
2. Login: coordenador@teste.com / Teste123!
3. Clicar em AppSwitcher
4. Ver: 4 apps (PEI, Gestão, AEE, Planejamento)
5. ✅ Validar permissões corretas
```

---

## 📸 O QUE ESPERAR

### Visualmente

**Cores e Estilo**:
- Botão com fundo `bg-primary/10`
- Hover: `bg-primary/20`
- Texto: `text-primary`
- Dropdown: Card branco/escuro (theme-aware)

**Ícones**:
- Grid3x3 sempre visível
- Check no app atual
- Espaçamento consistente

### Comportamento

**Ao Clicar**:
- Dropdown abre instantaneamente
- Apps filtrados aparecem
- App atual destacado

**Ao Selecionar**:
- `window.location.href` muda
- Navegação para novo app
- Token SSO disponível

---

## 🎊 SUCESSO ESPERADO

### Se tudo funcionou ✅
- ✅ AppSwitcher aparece em todos os apps
- ✅ Dropdown abre e fecha corretamente
- ✅ Apps filtrados por role
- ✅ Navegação funciona entre apps
- ✅ Token no localStorage
- ✅ Sem erros no console

### Próximo passo
- ✅ **Sistema validado e pronto para produção!**
- ⏳ Deploy no Vercel (opcional)
- ⏳ Auto-login silencioso (melhoria futura)

---

# 🏆 BOA SORTE NOS TESTES!

**Tempo estimado**: 5-10 minutos  
**Complexidade**: Baixa  
**Resultado esperado**: ✅ **100% FUNCIONAL**

---

**Criado por**: Claude Sonnet 4.5  
**Data**: 10/11/2025

