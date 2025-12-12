# Próximos Passos - Plano de Ação Priorizado

**Data de atualização:** 2025-12-05  
**Status:** Melhorias críticas implementadas ✅

---

## 🎯 Prioridade ALTA (Próximos 7 dias)

### 1. Correção de Erros TypeScript Restantes
**Impacto:** Bloqueia builds e desenvolvimento  
**Esforço:** Médio (2-3 dias)

#### Erros Críticos de Tipagem:
- [ ] `Classes.tsx` linha 396: Remover `onPageSizeChange` do componente Pagination
- [ ] `Dashboard.tsx` linha 174: Garantir que `role` seja sempre string (já corrigido parcialmente)
- [ ] `Diary.tsx` linhas 940, 963, 1589: Tratar `string | undefined` corretamente
- [ ] `Professionals.tsx` linha 203: Converter `email: null` para `undefined` (já corrigido parcialmente)
- [ ] `Reports.tsx` linha 178: Mesmo problema de email
- [ ] `CreateProfessionalDialog`: Verificar props `open` e `onOpenChange`

#### Erros de Relações Supabase:
- [ ] `ReportCards.tsx` linha 149: Corrigir relação `report_cards.student_id`
- [ ] `StudentHistory.tsx`: Corrigir relações `grades.student_id`, `attendance.student_id`, `descriptive_reports.student_id`
- [ ] `Subjects.tsx` linha 46: Corrigir tipagem de retorno
- [ ] `Transport.tsx` linha 78: Corrigir tipagem de retorno

#### Limpeza de Código:
- [ ] Remover variáveis não usadas (TS6133) - ~30 ocorrências
- [ ] Remover imports não usados (TS6192) - ~5 ocorrências

**Comando para verificar progresso:**
```bash
cd apps/gestao-escolar && pnpm type-check 2>&1 | grep -E "error TS" | wc -l
```

---

### 2. Preencher Campos Pendentes nos Documentos Legais
**Impacto:** Conformidade LGPD  
**Esforço:** Baixo (1-2 horas)

- [ ] `docs/07-legais/PoliticaPrivacidade.md`:
  - [ ] Controlador: [preencher com nome da instituição/órgão]
  - [ ] CNPJ: [preencher]
  - [ ] Endereço: [preencher]
  - [ ] Encarregado (DPO): [preencher nome]
  - [ ] E-mail de contato (privacidade): [preencher e-mail]

- [ ] `docs/07-legais/TermosUso.md`:
  - [ ] Canais de suporte: [preencher e-mail/canal]
  - [ ] Foro: [preencher comarca]
  - [ ] Dúvidas sobre Termos: [preencher e-mail/canal]

- [ ] Atualizar componentes `PrivacyPolicy.tsx` e `TermsOfUse.tsx` com os dados preenchidos

---

### 3. Verificação de Integridade de Backups
**Impacto:** Segurança e confiabilidade  
**Esforço:** Médio (1-2 dias)

- [ ] Implementar verificação obrigatória de checksums em `backupService.verifyBackup()`
- [ ] Adicionar validação automática após cada backup
- [ ] Criar alerta quando checksum não estiver disponível
- [ ] Adicionar testes unitários para `verifyBackup()`

**Arquivo:** `apps/gestao-escolar/src/services/backupService.ts`

---

## 🔶 Prioridade MÉDIA (Próximos 14 dias)

### 4. Testes Unitários para Serviços Críticos
**Impacto:** Qualidade e confiabilidade  
**Esforço:** Médio (3-4 dias)

- [ ] `backupService.ts`:
  - [ ] Testes para `createBackupJob()`
  - [ ] Testes para `executeBackup()`
  - [ ] Testes para `verifyBackup()`
  - [ ] Testes para `getBackupExecutions()` com filtros de tenantId

- [ ] `auditService.ts`:
  - [ ] Testes para `getAuditLogs()` com filtros
  - [ ] Testes para `getUserAccessLogs()` com e sem tenantId
  - [ ] Testes para `exportAuditLogs()`

- [ ] `lgpdService.ts`:
  - [ ] Testes para `checkActiveConsents()`
  - [ ] Testes para `getConsents()`
  - [ ] Testes para `revokeConsent()`

**Localização:** `apps/gestao-escolar/src/services/__tests__/`

---

### 5. Migração Completa de `data_consents` para `consents`
**Impacto:** Consistência de dados  
**Esforço:** Baixo-Médio (1-2 dias)

**Status atual:**
- ✅ Migração de dados criada (`20250228000001_consolidate_consents.sql`)
- ✅ View de compatibilidade criada
- ✅ `lgpdService.checkActiveConsents()` já usa `get_user_consents`
- ⚠️ Verificar se há código ainda acessando `data_consents` diretamente

**Ações:**
- [ ] Buscar todas as referências a `data_consents` no código
- [ ] Migrar para usar `consents` ou RPCs canônicas
- [ ] Remover dependências da tabela antiga
- [ ] Documentar processo de descontinuação

**Comando para buscar referências:**
```bash
grep -r "data_consents" apps/ packages/ --exclude-dir=node_modules
```

---

### 6. Melhorias de Performance e Bundle Size
**Impacto:** Experiência do usuário  
**Esforço:** Médio (2-3 dias)

- [ ] Analisar tamanho de bundles das páginas mais pesadas (PEI, Reuniões)
- [ ] Implementar code splitting adicional se necessário
- [ ] Otimizar imports de bibliotecas grandes (recharts, react-quill)
- [ ] Revisar uso de `react-vendor` chunk

**Ferramentas:**
```bash
pnpm build --analyze  # Se configurado
# ou usar source-map-explorer
```

---

### 7. Atualização para React Router v7 (Preparação)
**Impacto:** Compatibilidade futura  
**Esforço:** Médio-Alto (3-5 dias)

**Status atual:**
- ⚠️ Avisos sobre "React Router Future Flags" presentes
- ⚠️ Uso de `startTransition` pode precisar revisão

**Ações:**
- [ ] Criar feature flag para migração gradual
- [ ] Testar compatibilidade com versão atual
- [ ] Planejar migração por módulo
- [ ] Validar regressões após migração

---

## 🔵 Prioridade BAIXA (Próximos 30 dias)

### 8. Melhorias de Observabilidade
**Impacto:** Monitoramento e debugging  
**Esforço:** Baixo-Médio (2-3 dias)

- [ ] Garantir filtros por `tenantId` em todas as consultas diretas de auditoria
- [ ] Adicionar métricas de performance para operações críticas
- [ ] Implementar alertas automáticos para erros críticos
- [ ] Melhorar logs estruturados

---

### 9. Documentação Técnica
**Impacto:** Manutenibilidade  
**Esforço:** Contínuo

- [ ] Documentar arquitetura de consentimentos
- [ ] Documentar fluxo de auditoria
- [ ] Documentar sistema de backups
- [ ] Atualizar `docs/MapaNavegacao.md` com novas rotas legais

---

### 10. Acessibilidade e UX
**Impacto:** Inclusão e usabilidade  
**Esforço:** Médio (2-3 dias)

- [ ] Revisar componentes com `AuditLogsViewer` e `SimpleAuditLogsViewer`
- [ ] Garantir navegação por teclado em todas as páginas
- [ ] Adicionar ARIA labels onde necessário
- [ ] Testar com leitores de tela

---

## 📊 Métricas de Sucesso

### TypeScript
- **Meta:** Reduzir erros de 230+ para < 10
- **Atual:** ~230 erros
- **Progresso:** ✅ Corrigidos erros críticos de serviços

### LGPD
- **Meta:** 100% de rotas legais implementadas
- **Atual:** ✅ Rotas `/legal/privacy` e `/legal/terms` criadas
- **Pendente:** Preencher campos de controlador/DPO

### Testes
- **Meta:** Cobertura > 70% em serviços críticos
- **Atual:** A definir
- **Próximo:** Implementar testes para backupService, auditService, lgpdService

---

## 🚀 Comandos Úteis

### Verificar erros TypeScript
```bash
cd apps/gestao-escolar
pnpm type-check > typecheck_output.txt 2>&1
```

### Executar testes
```bash
pnpm test
pnpm test:coverage
```

### Verificar dependências de data_consents
```bash
grep -r "data_consents" apps/ packages/ supabase/migrations/ --exclude-dir=node_modules
```

### Verificar uso de RPCs canônicas
```bash
grep -r "get_user_consents\|check_active_consents\|get_audit_trail" apps/ packages/
```

---

## 📝 Notas Importantes

1. **Ordem de priorização:** Resolver erros TypeScript primeiro, pois bloqueiam desenvolvimento
2. **Testes:** Implementar testes antes de refatorações maiores
3. **LGPD:** Documentos legais devem ser preenchidos antes de produção
4. **Backups:** Verificação de integridade é crítica para confiabilidade
5. **Migração:** `data_consents` → `consents` deve ser concluída antes de remover tabela antiga

---

## 🔄 Revisão Semanal

Este documento deve ser revisado semanalmente para:
- Atualizar status das tarefas
- Ajustar prioridades conforme necessário
- Adicionar novas tarefas identificadas
- Documentar bloqueios e dependências

**Última revisão:** 2025-12-05  
**Próxima revisão:** 2025-12-12
