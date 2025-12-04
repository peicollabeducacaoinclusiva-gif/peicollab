# 📋 Roadmap do Sistema de Plano de AEE - V1.0 → V2.0

> Documento de planejamento e comparação entre a versão atual (V1.0) e a visão futura (V2.0)

---

## 📊 Comparação Executiva

| Aspecto | V1.0 (Atual) | V2.0 (Futuro) | Ganho |
|---------|--------------|---------------|-------|
| **Tabelas no Banco** | 3 | 12 (+9 novas) | +300% |
| **Páginas/Telas** | 5 | 20+ | +300% |
| **Componentes React** | 10 | 50+ | +400% |
| **Tipos de Documentos** | 0 | 8 | ∞ |
| **Modo Offline** | ❌ Não | ✅ Sim | ✨ Novo |
| **Dashboard Analítico** | Básico | Avançado (KPIs) | +500% |
| **Tempo de Documentação** | 100% | 30% | -70% |
| **Avaliação Diagnóstica** | Simples | Completa (8 áreas) | +700% |

---

## 🗄️ Evolução do Modelo de Dados

### **V1.0 - Estrutura Atual (3 tabelas)**

```
plano_aee (tabela principal)
├── plano_aee_comments
└── plano_aee_attachments
```

### **V2.0 - Estrutura Expandida (12 tabelas)**

```
plano_aee (estendida)
├── plano_aee_comments
├── plano_aee_attachments
└── [NOVAS TABELAS] ↓

aee_centers (Centros/Salas de AEE)
aee_diagnostic_assessments (Avaliações Diagnósticas - 8 áreas)
aee_plan_goals (Metas SMART)
aee_attendance_records (Registro de Atendimentos)
aee_evaluation_cycles (Ciclos I, II, III)
aee_school_visits (Visitas à Escola Regular)
aee_referrals (Encaminhamentos para Especialistas)
aee_family_interviews (Anamnese Familiar)
aee_low_vision_assessments (Avaliação de Baixa Visão)
aee_reminders (Lembretes e Notificações)
aee_documents (Documentos Gerados)
```

---

## 🎨 Evolução de Funcionalidades

### **1. Dashboard**

#### V1.0 (Atual)
```
✅ Listagem de planos
✅ Estatísticas básicas (Total, Rascunhos, Aprovados)
✅ Filtro por status
✅ Badges de ciclos
```

#### V2.0 (Futuro)
```
✅ Tudo da V1.0 +
🆕 4 KPIs principais com tendências
🆕 Gráfico de frequência mensal
🆕 Gráfico de progresso de metas
🆕 Alertas inteligentes (baixa frequência, revisões pendentes)
🆕 Lista de ações prioritárias
🆕 Comparativo entre períodos
🆕 Exportação para Excel/PDF
```

**Ganho**: De estatísticas básicas para análise completa

---

### **2. Criação de Plano**

#### V1.0 (Atual)
```
✅ Seleção de aluno
✅ Queixas (escola e família)
✅ 10 seções JSONB básicas
✅ Salvamento progressivo
```

#### V2.0 (Futuro)
```
✅ Tudo da V1.0 +
🆕 Avaliação diagnóstica prévia (8 áreas)
🆕 Entrevista familiar estruturada (anamnese)
🆕 Sistema sugere barreiras automaticamente
🆕 Sistema sugere metas SMART
🆕 Configuração de horários semanais
🆕 Definição de profissionais envolvidos
🆕 Geração de Termo de Compromisso automático
```

**Ganho**: De formulário manual para assistente inteligente

---

### **3. Avaliação Diagnóstica**

#### V1.0 (Atual)
```
❌ Não implementada
```

#### V2.0 (Futuro)
```
🆕 Formulário multi-step (8 etapas)
🆕 1. Lateralidade
🆕 2. Orientação Espacial e Temporal
🆕 3. Percepções (Visual e Auditiva)
🆕 4. Expressão (Oral e Escrita)
🆕 5. Leitura e Escrita
🆕 6. Raciocínio Lógico e Coordenação
🆕 7. Relações Interpessoais
🆕 8. Informações Escolares
🆕 Geração automática de relatório
🆕 Sugestões de metas baseadas na avaliação
```

**Ganho**: Nova funcionalidade completa

---

### **4. Registro de Atendimentos**

#### V1.0 (Atual)
```
❌ Não implementado
```

#### V2.0 (Futuro)
```
🆕 Registro rápido diário
🆕 Marcar presença/falta
🆕 Selecionar metas trabalhadas
🆕 Descrever atividades realizadas
🆕 Registrar desempenho do aluno
🆕 Upload de evidências (fotos/vídeos)
🆕 Calendário visual de atendimentos
🆕 Gráfico de frequência
🆕 Cálculo automático de estatísticas
🆕 Atualização automática de progresso de metas
```

**Ganho**: Controle completo de frequência e evolução

---

### **5. Metas do Plano**

#### V1.0 (Atual)
```
✅ JSONB simples (teaching_objectives)
✅ Lista de objetivos como texto
```

#### V2.0 (Futuro)
```
✅ Tudo da V1.0 +
🆕 Tabela dedicada (aee_plan_goals)
🆕 Metas SMART estruturadas
🆕 Áreas de desenvolvimento
🆕 Progresso mensurável (0-100%)
🆕 Status (não iniciada, em andamento, alcançada)
🆕 Atividades e materiais vinculados
🆕 Critérios de sucesso
🆕 Priorização (baixa, média, alta)
🆕 Tracking automático via atendimentos
```

**Ganho**: De texto livre para gestão profissional de objetivos

---

### **6. Ciclos Avaliativos**

#### V1.0 (Atual)
```
✅ 3 campos JSONB (cycle_1, cycle_2, cycle_3)
✅ Preenchimento manual
```

#### V2.0 (Futuro)
```
✅ Tudo da V1.0 +
🆕 Tabela dedicada (aee_evaluation_cycles)
🆕 Criação automática ao criar plano
🆕 Datas de início/fim automáticas
🆕 Cálculo automático de frequência do ciclo
🆕 Progresso de metas por ciclo
🆕 Comparação entre ciclos (I vs II vs III)
🆕 Notificações de fim de ciclo
🆕 Relatório de ciclo em PDF
```

**Ganho**: De manual para automatizado

---

### **7. Documentos**

#### V1.0 (Atual)
```
❌ Sem geração automática
✅ Apenas anexos manuais
```

#### V2.0 (Futuro)
```
🆕 8 tipos de documentos gerados automaticamente:
   1. Termo de Compromisso
   2. Termo de Desistência
   3. Relatório de Visita
   4. Plano de AEE Completo
   5. Relatório de Ciclo
   6. Ficha de Anamnese
   7. Ficha de Encaminhamento
   8. Avaliação Diagnóstica

🆕 Templates HTML profissionais
🆕 Geração de PDF com dados reais
🆕 Assinatura digital
🆕 Compartilhamento via link temporário
🆕 Biblioteca de documentos gerados
```

**Ganho**: De zero para 8 documentos automáticos

---

### **8. Visitas Escolares**

#### V1.0 (Atual)
```
❌ Não implementado
```

#### V2.0 (Futuro)
```
🆕 Registro completo de visitas
🆕 Objetivos da visita
🆕 Participantes (diretor, coordenador, professores)
🆕 Orientações fornecidas
🆕 Adaptações curriculares sugeridas
🆕 Recursos recomendados
🆕 Estratégias metodológicas
🆕 Próximos passos
🆕 Assinaturas digitais dos participantes
🆕 Geração de Relatório de Visita em PDF
```

**Ganho**: Nova funcionalidade para articulação escola-AEE

---

### **9. Encaminhamentos**

#### V1.0 (Atual)
```
✅ JSONB simples (referrals)
✅ Lista como texto
```

#### V2.0 (Futuro)
```
✅ Tudo da V1.0 +
🆕 Tabela dedicada (aee_referrals)
🆕 Tipos de especialistas (fonoaudiólogo, psicólogo, etc.)
🆕 Motivo e sintomas
🆕 Urgência (baixa, média, alta, urgente)
🆕 Status (pendente, agendado, em atendimento, concluído)
🆕 Data de agendamento
🆕 Feedback do especialista
🆕 Recomendações recebidas
🆕 Tracking completo
🆕 Notificações de acompanhamento
```

**Ganho**: De lista estática para gestão completa

---

### **10. Modo Offline**

#### V1.0 (Atual)
```
❌ Não funciona offline
❌ Requer conexão constante
```

#### V2.0 (Futuro)
```
🆕 IndexedDB para armazenamento local
🆕 Sincronização automática ao conectar
🆕 Indicador de status (online/offline)
🆕 Fila de mudanças pendentes
🆕 Resolução de conflitos
🆕 Service Worker para PWA
🆕 Funciona 100% offline
```

**Ganho**: De dependente de rede para offline-first

---

### **11. Analytics e Relatórios**

#### V1.0 (Atual)
```
✅ Estatísticas básicas no dashboard
✅ Contadores simples
```

#### V2.0 (Futuro)
```
✅ Tudo da V1.0 +
🆕 Dashboard analítico completo
🆕 KPIs principais:
   - Taxa de frequência
   - Metas alcançadas
   - Alunos em risco
   - Planos ativos
🆕 Gráficos interativos (Recharts)
🆕 Comparações temporais
🆕 Relatórios por período
🆕 Relatórios por aluno
🆕 Relatórios gerenciais (rede)
🆕 Exportação para Excel
🆕 Exportação para PDF
```

**Ganho**: De contadores para business intelligence

---

## 🚀 Plano de Implementação

### **Cronograma Proposto**

```
┌─────────────────────────────────────────────────────────┐
│ 2025                                                    │
├─────────────────────────────────────────────────────────┤
│ Q1 │ ✅ V1.0 Estável e Documentada                      │
├─────────────────────────────────────────────────────────┤
│ Q2 │ 🔄 Fase 1 - Fundação (3 meses)                     │
│    │ • Migração das 9 novas tabelas                    │
│    │ • Componentes básicos de UI                       │
│    │ • Sistema de metas SMART                          │
│    │ • Registro de atendimentos básico                 │
├─────────────────────────────────────────────────────────┤
│ Q3 │ 🔄 Fase 2 - Avaliações (2 meses)                   │
│    │ • Avaliação diagnóstica (8 áreas)                 │
│    │ • Entrevista familiar (anamnese)                  │
├─────────────────────────────────────────────────────────┤
│ Q4 │ 🔄 Fase 3 - Documentos (2 meses)                   │
│    │ • Templates HTML dos 8 tipos                      │
│    │ • Geração de PDF                                  │
│    │ • Assinatura digital                              │
│    │ • Compartilhamento                                │
├─────────────────────────────────────────────────────────┤
│ 2026                                                    │
├─────────────────────────────────────────────────────────┤
│ Q1 │ 🔄 Fase 4 - Offline (1 mês)                        │
│    │ • IndexedDB                                        │
│    │ • Sincronização                                    │
│    │ • Service Worker                                   │
│    │                                                     │
│    │ 🔄 Fase 5 - Analytics (1 mês)                      │
│    │ • Dashboard de KPIs                                │
│    │ • Gráficos interativos                             │
│    │ • Relatórios customizáveis                         │
├─────────────────────────────────────────────────────────┤
│ Q2 │ 🔄 Fase 6 - Avançado (2 meses)                     │
│    │ • Visitas escolares                                │
│    │ • Sistema de encaminhamentos                       │
│    │ • Ciclos automáticos                               │
│    │ • Notificações inteligentes                        │
├─────────────────────────────────────────────────────────┤
│ Q3 │ 🔄 Fase 7 - Mobile (3 meses)                       │
│    │ • App React Native                                 │
│    │ • Sincronização mobile                             │
│    │ • Push notifications                               │
│    │ • Modo offline mobile                              │
└─────────────────────────────────────────────────────────┘
```

### **Duração Total**: ~18 meses

---

## 💰 Estimativa de Esforço

### **Por Fase**

| Fase | Duração | Desenvolvedores | Complexidade | Risco |
|------|---------|-----------------|--------------|-------|
| Fase 1 - Fundação | 3 meses | 2 Full-stack | Alta | Médio |
| Fase 2 - Avaliações | 2 meses | 1 Frontend | Média | Baixo |
| Fase 3 - Documentos | 2 meses | 1 Backend + 1 Designer | Média | Baixo |
| Fase 4 - Offline | 1 mês | 1 Frontend | Alta | Alto |
| Fase 5 - Analytics | 1 mês | 1 Full-stack | Média | Baixo |
| Fase 6 - Avançado | 2 meses | 2 Full-stack | Média | Médio |
| Fase 7 - Mobile | 3 meses | 2 Mobile | Alta | Alto |

**Total**: ~14 meses de desenvolvimento (considerando trabalho paralelo)

---

## 🎯 Critérios de Sucesso

### **Métricas de Adoção**

| Métrica | V1.0 (Baseline) | V2.0 (Target) |
|---------|-----------------|---------------|
| Professores usando | 100% | 100% |
| Tempo médio de criação de plano | 2 horas | 30 minutos |
| Documentos gerados por mês | 0 | 500+ |
| Taxa de preenchimento completo | 60% | 95% |
| Satisfação dos usuários | 70% | 90% |
| Planos com ciclos avaliados | 40% | 90% |
| Encaminhamentos rastreados | 0% | 100% |

### **Métricas Técnicas**

| Métrica | V1.0 | V2.0 (Target) |
|---------|------|---------------|
| Tempo de carregamento | < 2s | < 1s |
| Cobertura de testes | 40% | 80% |
| Disponibilidade | 99% | 99.9% |
| Tempo offline máximo | 0 | Ilimitado |
| Taxa de sincronização bem-sucedida | N/A | > 99% |

---

## 🔄 Estratégia de Migração

### **Migração de Dados V1.0 → V2.0**

```sql
-- Script de migração
-- 1. Manter todas as tabelas V1.0
-- 2. Adicionar novas tabelas V2.0
-- 3. Migrar dados existentes

-- Exemplo: Migrar objectives JSONB para aee_plan_goals
INSERT INTO aee_plan_goals (plan_id, goal_description, goal_area)
SELECT 
    id as plan_id,
    jsonb_array_elements_text(teaching_objectives) as goal_description,
    'geral' as goal_area
FROM plano_aee
WHERE teaching_objectives IS NOT NULL;
```

### **Rollout Gradual**

1. **Alpha (1 mês)**: 5 professores voluntários
2. **Beta (1 mês)**: 20% dos professores
3. **Produção (gradual)**: 100% em 3 meses

---

## 🏆 Benefícios Esperados

### **Para Professores de AEE**

- ⏱️ **70% de redução** no tempo de documentação
- 📊 **Visibilidade completa** do progresso dos alunos
- 📱 **Trabalho offline** sem preocupações
- 📄 **Documentos profissionais** em 1 clique
- 🎯 **Metas mensuráveis** com tracking automático

### **Para Coordenadores**

- 📈 **Dashboard gerencial** com KPIs em tempo real
- 🚨 **Alertas automáticos** de situações críticas
- 📊 **Relatórios completos** para prestação de contas
- 👥 **Visão consolidada** de toda a rede
- 🎯 **Decisões baseadas em dados**

### **Para Alunos e Famílias**

- 👀 **Transparência total** sobre o atendimento
- 📲 **Acesso fácil** a documentos
- 📸 **Evidências visuais** do progresso
- 🤝 **Participação ativa** no processo
- ✨ **Melhor qualidade** de atendimento

### **Para a Gestão da Rede**

- 📊 **Indicadores de qualidade** do AEE
- 💰 **Otimização de recursos**
- 📈 **Escalabilidade** para mais alunos
- 🎯 **Decisões estratégicas** embasadas
- ⭐ **Melhoria contínua** baseada em dados

---

## 🤝 Estratégia de Capacitação

### **Fase 1 - Professores de AEE**

- 📹 8 vídeos tutoriais (5-10 min cada)
- 📚 Manual do usuário completo
- 💬 Grupo de suporte no WhatsApp
- 🎓 Treinamento presencial (4 horas)
- 🆘 Suporte individual nas primeiras semanas

### **Fase 2 - Coordenadores**

- 📹 4 vídeos sobre dashboard gerencial
- 📊 Curso de análise de dados (2 horas)
- 📋 Templates de relatórios prontos
- 🎯 Sessão de alinhamento estratégico

---

## 📊 Análise de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Resistência dos professores | Média | Alto | Treinamento e suporte intensivo |
| Bugs na sincronização offline | Alta | Médio | Testes extensivos + rollback rápido |
| Performance degradada | Baixa | Alto | Otimizações + monitoramento |
| Dados perdidos na migração | Baixa | Crítico | Backups + rollback plan |
| Adoção baixa da V2.0 | Média | Alto | Feedback contínuo + ajustes |

---

## ✅ Decisão de Go/No-Go

### **Critérios para Iniciar V2.0**

- ✅ V1.0 estável em produção (> 3 meses)
- ✅ Feedback positivo dos usuários (> 70%)
- ✅ Equipe de desenvolvimento disponível (2+ devs)
- ✅ Budget aprovado
- ✅ Roadmap de 18 meses aprovado
- ✅ Comprometimento da gestão

### **Aprovação**

⬜ Product Owner  
⬜ Tech Lead  
⬜ Coordenação Pedagógica  
⬜ Diretoria

---

## 📚 Documentos de Referência

- [`📚_APP_PLANO_AEE.md`](./📚_APP_PLANO_AEE.md) - Documentação V1.0 (atual)
- [`🚀_APP_PLANO_AEE_V2.md`](./🚀_APP_PLANO_AEE_V2.md) - Especificação V2.0 (futuro)
- [Fichas Oficiais da Bahia](https://example.com/fichas-bahia) - Referência pedagógica

---

## 🎉 Conclusão

A evolução do Sistema de Plano de AEE da V1.0 para a V2.0 representa um salto significativo em:

- **Funcionalidade**: De básico para completo
- **Eficiência**: De manual para automatizado
- **Qualidade**: De texto livre para estruturado
- **Usabilidade**: De online-only para offline-first
- **Análise**: De estatísticas para business intelligence

**Recomendação**: Iniciar Fase 1 após 3 meses de V1.0 estável em produção.

---

**Versão do Roadmap**: 1.0  
**Data**: 09/01/2025  
**Status**: 📋 Documento de Planejamento  
**Próxima Revisão**: Trimestral

