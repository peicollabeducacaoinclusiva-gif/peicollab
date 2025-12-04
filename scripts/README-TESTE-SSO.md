# 🧪 Scripts de Teste SSO

## 📋 Scripts Disponíveis

### 1. Teste Automatizado Básico

```bash
pnpm test:sso
# ou
node scripts/test-sso.js
```

**O que testa:**
- ✅ Existência das Edge Functions (`create-sso-code`, `validate-sso-code`)
- ✅ Existência da tabela `sso_codes`
- ✅ Existência da função RPC `validate_sso_code`
- ✅ Configuração das URLs dos apps

**Limitações:**
- Requer variáveis de ambiente configuradas
- Testes de criação/validação reais requerem autenticação

### 2. Testes Manuais

Consulte: `scripts/test-sso-manual.md`

**Inclui:**
- Guia passo a passo para testar navegação entre apps
- Como verificar expiração de códigos
- Como testar uso único de códigos
- Verificações no banco de dados

## 🚀 Como Executar

### Teste Automatizado:

1. **Configurar variáveis de ambiente** (se necessário):
   ```bash
   # Criar .env.local na raiz do projeto
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```

2. **Executar script:**
   ```bash
   pnpm test:sso
   ```

### Testes Manuais:

1. **Iniciar todos os apps:**
   ```bash
   # Terminal 1
   pnpm dev:pei
   
   # Terminal 2
   pnpm dev:gestao
   
   # Terminal 3
   pnpm dev:aee
   
   # etc...
   ```

2. **Seguir o guia em:** `scripts/test-sso-manual.md`

## 📊 Resultado Esperado

### Teste Automatizado:
```
✅ create-sso-code existe: Edge Function encontrada
✅ validate-sso-code existe: Edge Function encontrada
✅ Tabela sso_codes existe: Tabela encontrada
✅ RPC validate_sso_code existe: Função RPC encontrada
✅ URLs dos apps verificadas: 8 apps configurados

✅ Passou: 5
❌ Falhou: 0
📊 Total: 5
```

### Testes Manuais:
- Navegação entre apps funciona sem login repetido
- Códigos SSO expiram após 5 minutos
- Códigos SSO são de uso único
- Fallback funciona quando SSO falha

## 🔍 Troubleshooting

Se os testes falharem:

1. **Edge Functions não encontradas:**
   - Verifique se foram deployadas: `supabase functions list`
   - Deploy manual: `supabase functions deploy create-sso-code`
   - Deploy manual: `supabase functions deploy validate-sso-code`

2. **Tabela não encontrada:**
   - Verifique migrações: `supabase migrations list`
   - Aplique migração: `supabase migration up`

3. **RPC não encontrada:**
   - Verifique se migração `20250215000022_sso_codes_table.sql` foi aplicada
   - Execute manualmente a função no Supabase SQL Editor

4. **Variáveis de ambiente:**
   - Verifique `.env.local` ou variáveis do sistema
   - URLs devem apontar para seu projeto Supabase

## 📚 Documentação Relacionada

- **Guia Completo**: `docs/TESTE_SSO_ENDO_TO_END.md`
- **Guia Manual**: `scripts/test-sso-manual.md`
- **Documentação SSO**: Ver migrações em `supabase/migrations/`

