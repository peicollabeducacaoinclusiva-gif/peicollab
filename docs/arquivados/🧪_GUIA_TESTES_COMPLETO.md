# 🧪 GUIA DE TESTES - App de Plano de AEE V2.0

> **Data**: 09/01/2025  
> **Versão**: V2.0 (71% implementada - Fases 1-5)  
> **Status**: Pronto para testes

---

## 🎯 O QUE TESTAR

### **✅ Fase 1: Fundação**
- Metas SMART
- Registro de atendimentos
- Progresso automático
- Estatísticas

### **✅ Fase 2: Avaliações**
- Formulário de avaliação diagnóstica
- Sugestões automáticas

### **✅ Fase 3-5: Infraestrutura**
- Geração de PDFs
- Modo offline
- Dashboard KPIs

---

## 🚀 SETUP INICIAL

### **Passo 1: Aplicar Migrações SQL**

```bash
# Navegar para o diretório
cd C:\workspace\Inclusao\pei-collab\supabase

# Aplicar Migração Fase 1
supabase db push migrations/20250201000001_aee_v2_fundacao.sql

# Aplicar Migração Fase 2
supabase db push migrations/20250202000001_aee_avaliacoes_diagnosticas.sql

# Verificar tabelas criadas
# Deve ter 6 novas tabelas:
# - aee_centers
# - aee_plan_goals
# - aee_attendance_records
# - aee_evaluation_cycles
# - aee_diagnostic_assessments
# - aee_family_interviews
```

### **Passo 2: Instalar Dependências**

```bash
cd C:\workspace\Inclusao\pei-collab\apps\plano-aee

# Instalar dependências necessárias
pnpm add dexie date-fns

# Verificar sem erros
pnpm type-check
```

### **Passo 3: Rodar o App**

```bash
pnpm dev

# App deve abrir em: http://localhost:5175
```

---

## 🧪 TESTES FUNCIONAIS

### **TESTE 1: Criar Meta SMART** ✅

```
1. Acessar: http://localhost:5175
2. Login com professor AEE
3. Editar um plano existente
4. Ir na aba "Metas e Atendimentos"
5. Clicar em "Nova Meta"
6. Preencher:
   - Descrição: "O aluno será capaz de ler 10 palavras simples com 80% de acerto até junho"
   - Área: Linguagem
   - Prioridade: Alta
   - Data alvo: 30/06/2025
7. Salvar
8. ✅ Verificar: Meta aparece na lista
9. ✅ Verificar: Estatística "Total de Metas" incrementou
```

### **TESTE 2: Registrar Atendimento** ✅

```
1. Na mesma aba "Metas e Atendimentos"
2. No card "Registro de Atendimento"
3. Status: Presente
4. Marcar a meta criada no checkbox
5. Preencher "Atividades Realizadas"
6. Salvar
7. ✅ Verificar: Registro salvo
8. ✅ Verificar: Progresso da meta atualizado para 10%
```

### **TESTE 3: Progresso Automático** ✅

```
1. Registrar mais 4 atendimentos marcando a mesma meta
2. ✅ Verificar: Após 5 registros, progresso = 50%
3. ✅ Verificar: Status muda para "Em Andamento"
4. Registrar mais 5 atendimentos
5. ✅ Verificar: Após 10 registros, progresso = 100%
6. ✅ Verificar: Status muda para "Alcançada"
7. ✅ Verificar: Card verde de "Alcançadas" incrementou
```

### **TESTE 4: Estatísticas do Plano** ✅

```
1. Verificar no banco:
   SELECT total_attendances, attendance_percentage, 
          goals_achieved, total_goals
   FROM plano_aee WHERE id = 'uuid-do-plano';

2. ✅ Verificar: Campos atualizados automaticamente
3. ✅ Verificar: Estatísticas corretas
```

### **TESTE 5: Ciclos Automáticos** ✅

```
1. Criar um novo plano de AEE
2. Verificar no banco:
   SELECT * FROM aee_evaluation_cycles WHERE plan_id = 'uuid-do-plano';

3. ✅ Deve retornar 3 ciclos:
   - I Ciclo (0-3 meses)
   - II Ciclo (3-6 meses)
   - III Ciclo (6-9 meses)
```

### **TESTE 6: Modo Offline** ✅

```
1. Registrar um atendimento
2. Desligar o WiFi/Ethernet
3. Registrar outro atendimento
4. ✅ Verificar: Salvo localmente (IndexedDB)
5. Ligar o WiFi novamente
6. Aguardar 5 minutos ou recarregar a página
7. ✅ Verificar: Sincronizou automaticamente
8. ✅ Verificar: Dados no Supabase
```

### **TESTE 7: Dashboard KPIs** ✅

```
1. Adicionar DashboardKPIs no Dashboard principal
2. ✅ Verificar 4 cards:
   - Alunos Ativos
   - Taxa de Frequência
   - Metas Alcançadas
   - Planos Ativos
3. ✅ Verificar: Valores corretos
4. ✅ Verificar: Atualiza em tempo real
```

### **TESTE 8: Geração de PDF** ✅

```
1. Em um plano, tentar gerar documento
2. DocumentGenerator.generatePDF('termo_compromisso', {student_id, plan_id})
3. ✅ Verificar: PDF gerado (mock por enquanto)
4. ✅ Verificar: Interpolação de dados funcionando
```

---

## 🐛 ERROS ESPERADOS E SOLUÇÕES

### **Erro 1: Imports não encontrados**

```
❌ Cannot find module '@pei/ui'

✅ Solução:
cd packages/ui
pnpm install
pnpm build
```

### **Erro 2: Tipo 'Badge' não existe**

```
❌ Property 'Badge' does not exist

✅ Solução:
Adicionar Badge ao @pei/ui ou importar de @/components/ui/badge
```

### **Erro 3: Tabelas não existem**

```
❌ relation "aee_plan_goals" does not exist

✅ Solução:
Aplicar as migrações SQL primeiro!
```

### **Erro 4: Dexie not defined**

```
❌ Cannot find module 'dexie'

✅ Solução:
pnpm add dexie
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Backend/Banco**
- [ ] 6 tabelas criadas
- [ ] Triggers funcionando
- [ ] Funções SQL testadas
- [ ] RLS policies ativas
- [ ] Ciclos criados automaticamente
- [ ] Progresso atualiza automaticamente

### **Frontend**
- [ ] Sem erros de compilação
- [ ] Sem erros de tipo (TypeScript)
- [ ] Componentes renderizando
- [ ] Formulários validando
- [ ] Toast notifications funcionando

### **Funcional**
- [ ] Criar meta SMART
- [ ] Editar meta
- [ ] Deletar meta
- [ ] Registrar atendimento presente
- [ ] Registrar falta
- [ ] Progresso atualiza (10% por atendimento)
- [ ] Estatísticas calculadas corretamente
- [ ] Modo offline funciona
- [ ] Sincronização automática funciona

### **UX**
- [ ] Interface responsiva (mobile)
- [ ] Tabs navegam corretamente
- [ ] Dialogs abrem e fecham
- [ ] Progress bars animam
- [ ] Badges coloridas corretas
- [ ] Mensagens de feedback claras

---

## 📊 MÉTRICAS DE SUCESSO

### **Performance**
- [ ] Carregamento < 2 segundos
- [ ] Navegação entre tabs < 300ms
- [ ] Salvamento < 1 segundo
- [ ] Sincronização < 5 segundos

### **Qualidade**
- [ ] 0 erros no console
- [ ] 0 warnings de TypeScript
- [ ] 0 erros de lint
- [ ] Código limpo e organizado

### **Usabilidade**
- [ ] Professor consegue usar sozinho
- [ ] Fluxos intuitivos
- [ ] Feedback claro de ações
- [ ] Ajuda contextual disponível

---

## 🎯 PRÓXIMOS PASSOS APÓS TESTES

### **Se tudo funcionar** ✅

1. **Deploy em staging**
2. **Testes com 3-5 professores** (Alpha)
3. **Coletar feedback**
4. **Ajustes e melhorias**
5. **Deploy em produção** (Beta)
6. **Monitoramento**
7. **Decidir sobre Fases 6-7**

### **Se houver erros** 🐛

1. **Documentar erros** encontrados
2. **Priorizar correções**
3. **Aplicar fixes**
4. **Re-testar**
5. **Repetir até estável**

---

## 📚 DOCUMENTOS DE APOIO

- [`📚_APP_PLANO_AEE.md`](docs/apps/📚_APP_PLANO_AEE.md) - V1.0
- [`🛠️_IMPLEMENTACAO_PLANO_AEE_V2.md`](docs/apps/🛠️_IMPLEMENTACAO_PLANO_AEE_V2.md) - Blueprint
- [`✅_FASES_1_2_3_4_5_COMPLETAS.md`](docs/apps/✅_FASES_1_2_3_4_5_COMPLETAS.md) - Resumo

---

**🧪 Boa sorte nos testes! Sistema está sólido e pronto! 🚀**





