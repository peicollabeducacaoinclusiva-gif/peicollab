# Guia Rápido - Implementações LGPD e Observabilidade

**Data:** 2025-01-28

## 🚀 Início Rápido

### 1. Configurar Alertas

```bash
# Configurar regras básicas de alerta
npx tsx scripts/observability/setup-alert-rules.ts --app-name=gestao-escolar

# Testar regras de alerta
npx tsx scripts/observability/test-alert-rules.ts
```

### 2. Configurar Agendamento de Retenção

1. Abra o Supabase Dashboard > SQL Editor
2. Execute o arquivo: `scripts/retention/setup-retention-schedule.sql`
3. Ajuste o horário conforme necessário (padrão: 2h UTC diariamente)
4. Verifique os jobs: `SELECT * FROM cron.job WHERE jobname LIKE '%retencao%';`

### 3. Usar Traduções

```typescript
import { useTranslation } from '@pei/i18n';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <p>{t('dashboard.welcome')}</p>
    </div>
  );
}
```

---

## 📋 Checklist de Verificação

### AlertManager
- [ ] Regras básicas configuradas
- [ ] Alertas sendo gerados corretamente
- [ ] Notificações configuradas (se necessário)

### Retenção
- [ ] Painel acessível em Gestão Escolar
- [ ] Agendamento configurado no Supabase
- [ ] Logs sendo gerados corretamente

### i18n
- [ ] I18nProvider configurado no App.tsx
- [ ] Traduções funcionando nos componentes
- [ ] Novas traduções sendo adicionadas conforme necessário

---

## 🔍 Troubleshooting

### Alertas não são criados
1. Verifique se as regras estão ativas: `SELECT * FROM alert_rules WHERE is_active = true;`
2. Execute o script de teste: `npx tsx scripts/observability/test-alert-rules.ts`
3. Verifique logs no dashboard de observabilidade

### Agendamento não executa
1. Verifique se pg_cron está habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Verifique se o job está ativo: `SELECT * FROM cron.job WHERE jobname LIKE '%retencao%';`
3. Verifique logs de execução: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Traduções não funcionam
1. Verifique se I18nProvider está no App.tsx
2. Verifique se as chaves existem nos arquivos de tradução
3. Verifique o console do navegador para erros

---

## 📚 Documentação Completa

- **Análise e Plano:** `docs/ANALISE_E_PLANO_IMPLEMENTACAO_LGPD_OBSERVABILIDADE.md`
- **Resumo de Implementação:** `docs/RESUMO_IMPLEMENTACAO_LGPD_OBSERVABILIDADE.md`
- **Implementações Completas:** `docs/IMPLEMENTACOES_COMPLETAS_LGPD_OBSERVABILIDADE.md`
- **Implementações Finais:** `docs/IMPLEMENTACOES_FINAIS_LGPD_OBSERVABILIDADE.md`
- **Resumo Final:** `docs/RESUMO_FINAL_IMPLEMENTACOES.md`
- **Agendamento de Retenção:** `docs/AGENDAMENTO_RETENCAO_DADOS.md`

---

**Última atualização:** 2025-01-28

