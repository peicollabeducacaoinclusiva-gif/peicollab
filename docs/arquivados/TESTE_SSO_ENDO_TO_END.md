# 🔐 Guia de Teste SSO End-to-End

## 📋 Visão Geral

Este documento descreve como testar a integração SSO (Single Sign-On) entre todos os apps do sistema PEI Collab.

## ✅ Status da Implementação

### Apps com SSO Implementado

| App | Validação SSO | AppSwitcher | Status |
|-----|---------------|-------------|--------|
| **pei-collab** | ✅ Dashboard | ✅ AppHeader | ✅ Completo |
| **gestao-escolar** | ✅ ProtectedRoute | ✅ PageHeader | ✅ Completo |
| **plano-aee** | ✅ ProtectedRoute | ✅ Dashboard | ✅ Completo |
| **planejamento** | ✅ ProtectedRoute | ✅ Dashboard | ✅ Completo |
| **atividades** | ✅ ProtectedRoute | ✅ Todas as páginas | ✅ Completo |
| **blog** | ✅ ProtectedRoute | ✅ Header customizado | ✅ Completo |
| **transporte-escolar** | ✅ ProtectedRoute | ✅ Dashboard | ✅ Completo |
| **merenda-escolar** | ✅ ProtectedRoute | ✅ Dashboard | ✅ Completo |
| **portal-responsavel** | ⚠️ Sistema próprio | ❓ | ⚠️ Sistema de tokens familiares |

## 🧪 Cenários de Teste

### 1. Teste Básico: Login e Navegação entre Apps

**Pré-requisitos:**
- Ter um usuário autenticado em qualquer app
- Todos os apps rodando nas portas corretas

**Passos:**

1. **Login inicial:**
   ```
   - Acesse: http://localhost:8080/dashboard (PEI Collab)
   - Faça login com um usuário válido
   - Verifique que o AppSwitcher aparece no header
   ```

2. **Navegação via AppSwitcher:**
   ```
   - Clique no botão "Apps" no header
   - Selecione "Gestão Escolar"
   - Verifique que:
     ✓ É redirecionado para http://localhost:5174
     ✓ A URL contém ?sso_code=...
     ✓ Login automático ocorre (sem tela de login)
     ✓ Dashboard carrega automaticamente
   ```

3. **Navegação entre múltiplos apps:**
   ```
   - A partir de Gestão Escolar, abra AppSwitcher
   - Navegue para "Plano de AEE"
   - Verifique login automático
   - Navegue para "Planejamento"
   - Verifique login automático
   ```

### 2. Teste de Expiração de Código SSO

**Objetivo:** Verificar que códigos SSO expiram após 5 minutos

**Passos:**

1. **Gerar código SSO:**
   ```javascript
   // No console do navegador
   const { data } = await supabase.functions.invoke('create-sso-code', {
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

2. **Aguardar expiração:**
   ```
   - Aguarde 6 minutos
   - Tente usar o código na URL: ?sso_code=...
   - Verifique que:
     ✓ Código é rejeitado
     ✓ Usuário é redirecionado para login
   ```

### 3. Teste de Uso Único de Código

**Objetivo:** Verificar que códigos SSO são de uso único

**Passos:**

1. **Gerar código SSO**
2. **Usar código pela primeira vez:**
   ```
   - Acesse: http://localhost:5174?sso_code=CODIGO_GERADO
   - Verifique login automático
   ```

3. **Tentar usar o mesmo código novamente:**
   ```
   - Abra nova aba/anônima
   - Acesse: http://localhost:5174?sso_code=MESMO_CODIGO
   - Verifique que:
     ✓ Código é rejeitado
     ✓ Mensagem de erro aparece
     ✓ Usuário precisa fazer login manual
   ```

### 4. Teste de Validação em Cada App

**Objetivo:** Verificar que todos os apps validam SSO corretamente

**Apps para testar:**

1. **pei-collab** (porta 8080)
   ```bash
   http://localhost:8080/dashboard?sso_code=CODIGO
   ```

2. **gestao-escolar** (porta 5174)
   ```bash
   http://localhost:5174?sso_code=CODIGO
   ```

3. **plano-aee** (porta 5175)
   ```bash
   http://localhost:5175?sso_code=CODIGO
   ```

4. **planejamento** (porta 5176)
   ```bash
   http://localhost:5176/dashboard?sso_code=CODIGO
   ```

5. **atividades** (porta 5178)
   ```bash
   http://localhost:5178/dashboard?sso_code=CODIGO
   ```

6. **blog** (porta 5179)
   ```bash
   http://localhost:5179/admin?sso_code=CODIGO
   ```

7. **transporte-escolar** (porta 5181)
   ```bash
   http://localhost:5181?sso_code=CODIGO
   ```

8. **merenda-escolar** (porta 5182)
   ```bash
   http://localhost:5182?sso_code=CODIGO
   ```

**Para cada app, verificar:**
- ✓ Código é validado corretamente
- ✓ Sessão é criada automaticamente
- ✓ Código é removido da URL após uso
- ✓ Dashboard carrega sem pedir login

### 5. Teste de Fallback quando SSO Falha

**Objetivo:** Verificar comportamento quando SSO falha

**Cenários de falha:**

1. **Código inválido:**
   ```
   - Acesse: http://localhost:5174?sso_code=CODIGO_INVALIDO
   - Verifique que:
     ✓ Código é removido da URL
     ✓ Usuário é redirecionado para login
     ✓ Nenhum erro crítico ocorre
   ```

2. **Sem sessão ativa no app origem:**
   ```
   - Faça logout do app atual
   - Tente usar AppSwitcher
   - Verifique que:
     ✓ Redireciona sem código SSO
     ✓ App destino pede login
   ```

3. **Edge Function indisponível:**
   ```
   - Simule falha na create-sso-code
   - Tente usar AppSwitcher
   - Verifique que:
     ✓ Redireciona sem código SSO
     ✓ App destino pede login
     ✓ Nenhum erro bloqueia o app
   ```

## 🔍 Verificações Técnicas

### 1. Verificar Tabela `sso_codes`

```sql
-- Ver códigos SSO criados recentemente
SELECT 
  code,
  user_id,
  target_app,
  expires_at,
  used,
  created_at
FROM sso_codes
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### 2. Verificar Logs das Edge Functions

```bash
# Logs do Supabase CLI
supabase functions logs create-sso-code
supabase functions logs validate-sso-code
```

### 3. Verificar Console do Navegador

Verificar mensagens de erro ou sucesso:
- `✅ Código SSO gerado com sucesso`
- `❌ Erro ao gerar código SSO`
- `✅ Sessão criada via SSO`
- `❌ Código SSO inválido ou expirado`

## 📊 Checklist de Validação

### Por App

- [ ] AppSwitcher visível no header
- [ ] Lista de apps disponíveis carrega corretamente
- [ ] Apps filtrados por role do usuário
- [ ] Navegação entre apps funciona
- [ ] SSO funciona ao receber `sso_code` na URL
- [ ] Código é removido da URL após validação
- [ ] Fallback funciona quando SSO falha

### Funcionalidades SSO

- [ ] Códigos SSO expiram em 5 minutos
- [ ] Códigos SSO são de uso único
- [ ] Validação funciona em todos os apps
- [ ] Erros são tratados graciosamente
- [ ] Logs são gerados corretamente
- [ ] Limpeza automática de códigos expirados funciona

## 🐛 Troubleshooting

### Problema: AppSwitcher não aparece

**Solução:**
- Verificar se `AppHeader` está sendo usado
- Verificar se há erro de importação
- Verificar console do navegador

### Problema: SSO não funciona

**Solução:**
1. Verificar se Edge Functions estão deployadas
2. Verificar se tabela `sso_codes` existe
3. Verificar se RPC `validate_sso_code` existe
4. Verificar logs das Edge Functions

### Problema: Código expira muito rápido

**Solução:**
- Verificar tempo de expiração (deve ser 5 minutos)
- Verificar fuso horário do servidor

### Problema: Código pode ser usado múltiplas vezes

**Solução:**
- Verificar se campo `used` está sendo atualizado
- Verificar função RPC `validate_sso_code`

## 📝 Notas Importantes

1. **Portas dos Apps:**
   - pei-collab: 8080 ou 8081
   - gestao-escolar: 5174
   - plano-aee: 5175
   - planejamento: 5176
   - atividades: 5178
   - blog: 5179
   - portal-responsavel: 5180
   - transporte-escolar: 5181
   - merenda-escolar: 5182

2. **Variáveis de Ambiente:**
   Certifique-se de que todas as apps têm:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Roles e Permissões:**
   Apps disponíveis dependem da role do usuário:
   - `superadmin`: Todos os apps
   - `education_secretary`: pei-collab, gestao-escolar, blog, transporte, merenda
   - `teacher`: pei-collab, planejamento, atividades
   - etc.

## ✅ Resultado Esperado

Após todos os testes, você deve ser capaz de:
1. Fazer login uma vez em qualquer app
2. Navegar entre todos os apps sem fazer login novamente
3. Ver o app atual destacado no AppSwitcher
4. Ter uma experiência fluida e integrada entre apps

---

**Última atualização:** 2025-01-XX  
**Versão:** 1.0.0

