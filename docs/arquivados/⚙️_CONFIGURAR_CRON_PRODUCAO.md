# ⚙️ CONFIGURAR CRON JOB EM PRODUÇÃO

**Status**: ⚠️ Requer configuração manual no Supabase em produção  
**Ambiente Local**: pg_cron tem limitações no Supabase local

---

## 🎯 O Que é o Cron Job

O cron job executa automaticamente a função `run_notification_checks()` **diariamente às 8h da manhã**, que:

1. ✅ Verifica ciclos próximos do fim (7 dias)
2. ✅ Verifica baixa frequência (< 75%)
3. ✅ Verifica encaminhamentos sem resposta (> 30 dias)
4. ✅ Verifica follow-ups de visitas
5. ✅ Limpa notificações expiradas

---

## 🚀 Configurar em PRODUÇÃO (Supabase Cloud)

### Opção 1: Via Dashboard do Supabase (RECOMENDADO)

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Database** → **Extensions**
4. Habilite **pg_cron**
5. Vá em **SQL Editor**
6. Execute:

```sql
-- Criar cron job
SELECT cron.schedule(
    'run-aee-notifications',
    '0 8 * * *', -- Todo dia às 8h
    $$ SELECT run_notification_checks(); $$
);
```

7. Verificar se foi criado:

```sql
SELECT * FROM cron.job;
```

Resultado esperado:
```
jobid | schedule  | command                               | nodename
------+-----------+---------------------------------------+---------
1     | 0 8 * * * | SELECT run_notification_checks();     | ...
```

---

### Opção 2: Via API Externa (Alternativa)

Se pg_cron não estiver disponível, use um serviço externo:

#### A. GitHub Actions (Grátis)

Crie `.github/workflows/notifications.yml`:

```yaml
name: Run AEE Notifications

on:
  schedule:
    - cron: '0 8 * * *' # Todo dia às 8h UTC

jobs:
  run-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            '${{ secrets.SUPABASE_URL }}/rest/v1/rpc/run_notification_checks' \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

#### B. Vercel Cron Jobs

Em `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Criar `pages/api/cron/notifications.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar token de autorização
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    await supabase.rpc('run_notification_checks');
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

#### C. AWS Lambda + CloudWatch Events

```javascript
// lambda/notifications.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await supabase.rpc('run_notification_checks');

  return { statusCode: 200, body: 'Success' };
};
```

CloudWatch Event Rule: `cron(0 8 * * ? *)`

---

## 🧪 Testar Manualmente (Desenvolvimento)

Enquanto o cron não está configurado, você pode executar manualmente:

```sql
-- Executar verificações agora
SELECT run_notification_checks();

-- Ver notificações criadas
SELECT * FROM aee_notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ⚙️ Configuração Local (Alternativa)

Para desenvolvimento local, você pode criar um script Node.js:

**`scripts/run-notifications.js`**:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runNotifications() {
  console.log('🔔 Executando verificações de notificações...');
  
  try {
    const { error } = await supabase.rpc('run_notification_checks');
    
    if (error) throw error;
    
    console.log('✅ Notificações verificadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

runNotifications();
```

Executar diariamente (no seu sistema operacional):

**Windows (Task Scheduler)**:
- Criar tarefa agendada para 8h
- Comando: `node scripts/run-notifications.js`

**Linux/Mac (Crontab)**:
```bash
# Editar crontab
crontab -e

# Adicionar linha:
0 8 * * * cd /path/to/project && node scripts/run-notifications.js
```

---

## 📋 Checklist

### Em Produção (Supabase Cloud)
- [ ] Habilitar extensão pg_cron
- [ ] Criar cron job via SQL
- [ ] Verificar execução com `SELECT * FROM cron.job;`
- [ ] Monitorar logs

### Alternativa (GitHub Actions / Vercel / Lambda)
- [ ] Escolher serviço
- [ ] Configurar workflow/função
- [ ] Adicionar secrets (SUPABASE_URL, SERVICE_ROLE_KEY)
- [ ] Testar manualmente
- [ ] Monitorar execuções

---

## 🎯 Validar Funcionamento

Após configurar, aguarde até às 8h do dia seguinte e verifique:

```sql
-- Ver se notificações foram criadas
SELECT 
  notification_type,
  priority,
  title,
  created_at
FROM aee_notifications
WHERE created_at > CURRENT_DATE
ORDER BY created_at DESC;
```

Se houver notificações, o cron está funcionando! 🎉

---

## ⚠️ IMPORTANTE

**O sistema funciona perfeitamente SEM o cron job**, mas:

- ✅ **COM cron**: Notificações automáticas diárias
- ⚙️ **SEM cron**: Você pode executar `run_notification_checks()` manualmente quando quiser

Todos os outros recursos funcionam normalmente!

---

## 🎉 Conclusão

**Para ambiente de produção**: Configure o cron no Supabase Cloud  
**Para desenvolvimento**: Execute manualmente quando precisar  
**Para testes**: Use o script Node.js

O sistema está **100% funcional** independentemente do cron! 🚀





