# 🧪 Guia de Teste Manual SSO

## Pré-requisitos

1. Todos os apps rodando:
   ```bash
   # Terminal 1 - PEI Collab
   cd apps/pei-collab && pnpm dev
   
   # Terminal 2 - Gestão Escolar
   cd apps/gestao-escolar && pnpm dev
   
   # Terminal 3 - Plano AEE
   cd apps/plano-aee && pnpm dev
   
   # etc...
   ```

2. Ter um usuário de teste logado em pelo menos um app

## 🧪 Testes Manuais

### Teste 1: Navegação Básica via AppSwitcher

1. **Acesse o PEI Collab:**
   ```
   http://localhost:8080/dashboard
   ```

2. **Faça login** (se necessário)

3. **Localize o AppSwitcher:**
   - Deve aparecer no header como botão "Apps"
   - Clique no botão

4. **Verifique a lista de apps:**
   - Deve mostrar apps baseados na sua role
   - O app atual (PEI Collab) deve estar marcado com ✓

5. **Clique em "Gestão Escolar"**
   - Deve redirecionar para `http://localhost:5174?sso_code=...`
   - Deve fazer login automaticamente
   - Não deve pedir login novamente

6. **Verifique o AppSwitcher no novo app:**
   - Deve mostrar "Gestão Escolar" como atual
   - Deve permitir navegar de volta

### Teste 2: Verificar Código SSO na URL

1. **Navegue via AppSwitcher** de um app para outro

2. **Observe a URL:**
   - Deve conter `?sso_code=` seguido de um UUID
   - O código deve ser removido da URL após validação

3. **Copie o código antes de ser removido:**
   ```
   ?sso_code=12345678-1234-1234-1234-123456789012
   ```

4. **Tente usar o código manualmente:**
   ```
   http://localhost:5175?sso_code=CODIGO_COPIADO
   ```
   - Deve funcionar na primeira vez
   - Se tentar novamente, deve falhar (código usado)

### Teste 3: Expiração de Código

1. **No console do navegador, gere um código SSO:**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   const { data, error } = await supabase.functions.invoke('create-sso-code', {
     body: {
       target_app: 'gestao-escolar',
       access_token: session.access_token,
       refresh_token: session.refresh_token,
       expires_at: session.expires_at
     }
   });
   console.log('Código:', data.code);
   console.log('Expira em:', data.expires_at);
   ```

2. **Aguarde 6 minutos**

3. **Tente usar o código:**
   ```
   http://localhost:5174?sso_code=CODIGO_GERADO
   ```
   - Deve falhar com erro de código expirado
   - Deve redirecionar para login

### Teste 4: Navegação Circular

1. **PEI Collab → Gestão Escolar → Plano AEE → Planejamento → PEI Collab**
   - Cada navegação deve funcionar
   - Login deve persistir entre apps
   - AppSwitcher deve mostrar o app atual corretamente

### Teste 5: Fallback quando SSO Falha

1. **Simule falha desligando temporariamente a Edge Function**

2. **Tente usar AppSwitcher:**
   - Deve redirecionar sem código SSO
   - App destino deve pedir login manual
   - Não deve quebrar a aplicação

### Teste 6: Validação em Cada App

Teste cada app individualmente:

- [ ] **pei-collab** (8080): `http://localhost:8080/dashboard?sso_code=CODIGO`
- [ ] **gestao-escolar** (5174): `http://localhost:5174?sso_code=CODIGO`
- [ ] **plano-aee** (5175): `http://localhost:5175?sso_code=CODIGO`
- [ ] **planejamento** (5176): `http://localhost:5176/dashboard?sso_code=CODIGO`
- [ ] **atividades** (5178): `http://localhost:5178/dashboard?sso_code=CODIGO`
- [ ] **blog** (5179): `http://localhost:5179/admin?sso_code=CODIGO`
- [ ] **transporte-escolar** (5181): `http://localhost:5181?sso_code=CODIGO`
- [ ] **merenda-escolar** (5182): `http://localhost:5182?sso_code=CODIGO`

Para cada app, verificar:
- ✅ Código é validado
- ✅ Sessão é criada
- ✅ Código é removido da URL
- ✅ Dashboard carrega sem login

## 🔍 Verificações no Banco

### Ver códigos SSO recentes:
```sql
SELECT 
  code,
  user_id,
  target_app,
  expires_at,
  used,
  created_at
FROM sso_codes
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar limpeza automática:
```sql
-- Códigos expirados há mais de 1 hora devem ser removidos automaticamente
SELECT COUNT(*) 
FROM sso_codes 
WHERE expires_at < NOW() - INTERVAL '1 hour';
```

### Verificar códigos usados:
```sql
-- Códigos usados não devem poder ser reutilizados
SELECT code, used, expires_at
FROM sso_codes
WHERE used = true
ORDER BY created_at DESC
LIMIT 10;
```

## ✅ Checklist de Validação

- [ ] AppSwitcher aparece em todos os apps
- [ ] Lista de apps carrega corretamente
- [ ] Apps filtrados por role
- [ ] Navegação funciona entre apps
- [ ] Login automático funciona
- [ ] Código SSO expira em 5 minutos
- [ ] Código SSO é de uso único
- [ ] Fallback funciona quando SSO falha
- [ ] Código é removido da URL após uso
- [ ] Nenhum erro no console

## 🐛 Troubleshooting

Se algo não funcionar:

1. **Verifique console do navegador** para erros
2. **Verifique logs do Supabase** para Edge Functions
3. **Verifique se tabela `sso_codes` existe**
4. **Verifique se Edge Functions estão deployadas**
5. **Verifique variáveis de ambiente**

Para mais detalhes, veja: `docs/TESTE_SSO_ENDO_TO_END.md`

