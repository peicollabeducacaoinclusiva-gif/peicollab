# Teste SSO via Console do Navegador

## Passo a Passo

### 1. Fazer Login Manualmente

1. Acesse: `http://localhost:8081`
2. Faça login com:
   - **Email**: `peicollabeducacaoinclusiva@gmail.com`
   - **Senha**: `Inclusao2025!`
3. Aguarde o redirecionamento para o dashboard

### 2. Abrir Console do Navegador (F12)

### 3. Testar Criação de Código SSO

Cole este código no console:

```javascript
// Verificar sessão atual
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  console.error('❌ Nenhuma sessão ativa. Faça login primeiro.');
} else {
  console.log('✅ Sessão ativa:', session.user.email);
  
  // Criar código SSO para Gestão Escolar
  console.log('🔄 Criando código SSO...');
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
  
  if (error) {
    console.error('❌ Erro ao criar código SSO:', error);
  } else if (data?.code) {
    console.log('✅ Código SSO criado:', data.code);
    console.log('📋 URL para testar:', `http://localhost:5174?sso_code=${data.code}`);
    
    // Testar validação imediatamente
    console.log('🔄 Validando código SSO...');
    const { data: validateData, error: validateError } = await supabase.functions.invoke('validate-sso-code', {
      body: { code: data.code }
    });
    
    if (validateError) {
      console.error('❌ Erro ao validar:', validateError);
    } else {
      console.log('✅ Código validado:', validateData);
      console.log('✅ SSO está funcionando corretamente!');
    }
  } else {
    console.error('❌ Resposta inesperada:', data);
  }
}
```

### 4. Testar Fluxo Completo

Depois de criar o código, teste navegando para o Gestão Escolar:

1. Copie a URL gerada no console (ex: `http://localhost:5174?sso_code=xxx`)
2. Cole na barra de endereço ou abra em nova aba
3. Verifique se o login é automático

### 5. Testar AppSwitcher no Dashboard

1. No dashboard do PEI Collab, procure o botão **AppSwitcher** (menu de apps)
2. Clique para abrir
3. Clique em **"Gestão Escolar"**
4. Verifique login automático

## Verificações

✅ **Teste bem-sucedido se**:
- Código SSO é criado sem erros
- Código é validado com sucesso
- Login automático funciona no app destino
- Código não pode ser reutilizado

❌ **Se houver erros**:
- Verifique se as Edge Functions estão deployadas
- Verifique console do navegador para erros específicos
- Verifique se o Gestão Escolar está rodando em `http://localhost:5174`

