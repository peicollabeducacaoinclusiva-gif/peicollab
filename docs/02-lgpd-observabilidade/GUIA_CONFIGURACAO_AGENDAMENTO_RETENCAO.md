# Guia de Configuração - Agendamento de Retenção

**Data:** 28/01/2025

---

## 📋 INTRODUÇÃO

Este guia descreve como configurar o agendamento automático de retenção de dados no Supabase.

---

## 🔧 OPÇÕES DE AGENDAMENTO

### Opção 1: Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - Vá para: `https://app.supabase.com/project/[seu-project-id]`
   - Navegue até: **Database** > **Cron Jobs**

2. **Crie um novo Cron Job:**
   - Clique em **"New Cron Job"**
   - Configure:
     - **Name:** `daily-retention-job`
     - **Schedule:** `0 3 * * *` (diariamente às 3h da manhã)
     - **Enabled:** ✓

3. **Configure a requisição HTTP:**
   - **Method:** POST
   - **URL:** `https://[seu-project-ref].supabase.co/functions/v1/apply-retention`
   - **Headers:**
     ```json
     {
       "Authorization": "Bearer [SUPABASE_SERVICE_ROLE_KEY]",
       "Content-Type": "application/json"
     }
     ```
   - **Body:**
     ```json
     {
       "forceAllTenants": true,
       "dryRun": false
     }
     ```

4. **Salve e ative o job**

---

### Opção 2: Via Script Externo (Cron Job no Servidor)

Crie um script que executa periodicamente:

```bash
#!/bin/bash
# Executa retenção de dados diariamente às 3h

SUPABASE_URL="https://[seu-project-ref].supabase.co"
SERVICE_ROLE_KEY="[SUPABASE_SERVICE_ROLE_KEY]"

curl -X POST \
  "${SUPABASE_URL}/functions/v1/apply-retention" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "forceAllTenants": true,
    "dryRun": false
  }'
```

Configure no crontab:
```bash
# Adicionar ao crontab: crontab -e
0 3 * * * /path/to/retention-script.sh
```

---

### Opção 3: GitHub Actions (Para projetos open-source)

Crie `.github/workflows/retention.yml`:

```yaml
name: Daily Retention Job

on:
  schedule:
    - cron: '0 3 * * *' # Diariamente às 3h UTC
  workflow_dispatch: # Permite execução manual

jobs:
  retention:
    runs-on: ubuntu-latest
    steps:
      - name: Execute Retention
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/apply-retention" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"forceAllTenants": true, "dryRun": false}'
```

---

## 🔍 VERIFICAÇÃO

1. **Acesse o Painel de Retenção:**
   - Vá para: `/retention` no app Gestão Escolar
   - Verifique o histórico de execuções

2. **Execute um teste manual:**
   - Clique em **"Executar Teste (Dry Run)"**
   - Verifique os logs

3. **Monitore as execuções:**
   - Verifique a tabela `retention_logs` no Supabase
   - Veja os detalhes no painel

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **Dry Run:** Sempre teste com `dryRun: true` antes de executar para produção
- ⚠️ **Horário:** Execute em horários de baixo tráfego (recomendado: 3h da manhã)
- ⚠️ **Backup:** Faça backup antes da primeira execução real
- ⚠️ **Logs:** Monitore os logs após cada execução

---

**Status:** ✅ **GUIA CRIADO**

