# Guia de Teste Manual - SSO Seguro

## Pré-requisitos

1. **Apps rodando**:
   - PEI Collab: `http://localhost:8080`
   - Gestão Escolar: `http://localhost:5174`

2. **Supabase configurado**:
   - URL: `https://fximylewmvsllkdczovj.supabase.co`
   - Edge Functions deployadas: `create-sso-code` e `validate-sso-code`

## Passo a Passo do Teste

### 1. Iniciar os Apps

```bash
# Terminal 1 - PEI Collab
pnpm run dev:pei

# Terminal 2 - Gestão Escolar  
pnpm run dev:gestao
```

### 2. Fazer Login no PEI Collab

1. Acesse: `http://localhost:8080`
2. Clique em "Fazer Login" ou navegue para `/auth`
3. Use as credenciais:
   - **Email**: `superadmin@teste.com`
   - **Senha**: `Teste123!`
4. Aguarde redirecionamento para o dashboard

### 3. Testar SSO - Trocar para Gestão Escolar

1. No dashboard do PEI Collab, procure o botão **AppSwitcher** (geralmente no canto superior direito, ícone de grid/apps)
2. Clique no botão para abrir o menu de apps
3. Clique em **"Gestão Escolar"**
4. **Resultado esperado**:
   - O navegador redireciona para `http://localhost:5174?sso_code=xxx`
   - O código SSO é automaticamente processado
   - Você é logado automaticamente no Gestão Escolar
   - A URL é limpa (sem `sso_code`)

### 4. Verificar Login Automático

1. Verifique se você está autenticado no Gestão Escolar
2. O dashboard deve aparecer sem solicitar login
3. Seu nome/avatar deve aparecer no canto superior

### 5. Testar Volta - De Gestão Escolar para PEI Collab

1. No Gestão Escolar, clique no AppSwitcher
2. Clique em **"PEI Collab"**
3. Verifique se o login automático funciona na volta

## Validações Importantes

### ✅ Código SSO Único
- Cada troca de app gera um novo código
- Códigos não podem ser reutilizados

### ✅ Expiração (5 minutos)
- Se aguardar mais de 5 minutos, o código deve expirar
- Tentar usar código expirado deve falhar

### ✅ Segurança
- Tokens não aparecem na URL (apenas o código)
- Código é removido da URL após uso

### ✅ Fallback
- Se SSO falhar, o usuário é redirecionado normalmente
- Usuário pode fazer login manual no app destino

## Debugging

### Verificar Console do Navegador

Abra o DevTools (F12) e verifique:

1. **Ao clicar no AppSwitcher**:
   ```
   [log] Chamando create-sso-code para gestao-escolar
   [log] Código SSO criado: abc123...
   ```

2. **Ao chegar no app destino**:
   ```
   [log] Código SSO encontrado na URL: abc123...
   [log] Validando código SSO...
   [log] SSO bem-sucedido, criando sessão local
   ```

### Verificar Requisições de Rede

No DevTools → Network, procure por:

- `POST /functions/v1/create-sso-code` (status 200)
- `POST /functions/v1/validate-sso-code` (status 200)

### Problemas Comuns

1. **Erro 401 ao criar código SSO**:
   - Verifique se está logado no app origem
   - Verifique se a sessão não expirou

2. **Erro 404 ao validar código**:
   - Código expirou (aguarde menos de 5 minutos)
   - Código já foi usado (tente novamente)

3. **Login não funciona automaticamente**:
   - Verifique o console para erros
   - Verifique se a Edge Function `validate-sso-code` está deployada
   - Verifique se `ProtectedRoute` está processando `sso_code`

## Teste Automatizado (via Console do Navegador)

No console do navegador (F12), após fazer login no PEI Collab:

```javascript
// 1. Verificar sessão atual
const { data: { session } } = await supabase.auth.getSession();
console.log('Sessão:', session);

// 2. Criar código SSO manualmente
const { data, error } = await supabase.functions.invoke('create-sso-code', {
  body: {
    target_app: 'gestao-escolar',
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at
  },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
});

if (data?.code) {
  console.log('✅ Código SSO criado:', data.code);
  
  // 3. Testar validação
  const { data: validateData, error: validateError } = await supabase.functions.invoke('validate-sso-code', {
    body: { code: data.code }
  });
  
  if (validateData) {
    console.log('✅ Código validado com sucesso:', validateData);
  } else {
    console.error('❌ Erro ao validar:', validateError);
  }
} else {
  console.error('❌ Erro ao criar código:', error);
}
```

## Resultado Esperado

✅ **Teste bem-sucedido se**:
- Login automático funciona em ambas direções
- Código SSO é gerado e validado corretamente
- Tokens não aparecem na URL
- Código é removido após uso

❌ **Teste falhou se**:
- Login manual é necessário no app destino
- Erros aparecem no console
- Códigos podem ser reutilizados
- Tokens aparecem na URL

