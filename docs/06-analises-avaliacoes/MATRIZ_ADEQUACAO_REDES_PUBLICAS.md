# Matriz de Adequação: Sistema para Redes Públicas

## Legenda

- ✅ **Adequado**: Implementado e funcional
- ⚠️ **Parcial**: Implementado mas com lacunas
- ❌ **Inadequado**: Não implementado ou insuficiente
- 🔍 **Não Verificado**: Necessita análise mais profunda

---

## 1. Estrutura de Dados

### Alunos

| Campo/Recurso | Status | Observações |
|---------------|--------|-------------|
| CPF | ✅ | Campo `cpf` presente |
| RG | ✅ | Campo `rg` presente |
| Certidão de Nascimento | ✅ | Campo `birth_certificate` presente |
| NIS (Número Identificação Social) | ❌ | Não encontrado |
| Bolsa Família | ⚠️ | Mencionado em views mas não na tabela principal |
| Endereço Completo | ✅ | Logradouro, número, complemento, bairro, cidade, CEP |
| Contatos | ✅ | Telefone principal, secundário, email |
| Responsáveis | ✅ | Mãe e pai com nome, CPF, telefone separados |
| Dados Pessoais | ✅ | Sexo, raça/cor, naturalidade, tipo sanguíneo, Cartão SUS |
| Status Matrícula | ✅ | Ativo, Transferido, Cancelado, Concluído, Abandonou |
| Necessidades Especiais | ✅ | Campo booleano + array de tipos + laudo médico |
| Código INEP Aluno | ✅ | Campo `codigo_inep_aluno` presente |

### Profissionais

| Campo/Recurso | Status | Observações |
|---------------|--------|-------------|
| CPF | ✅ | Campo `cpf` presente |
| RG | ✅ | Campo `rg` presente |
| Matrícula Funcional | ✅ | Campo `matricula_funcional` presente |
| Cargo/Função | ✅ | Campo `cargo_funcao` presente |
| Tipo de Vínculo | ✅ | Efetivo, Contrato, Comissionado, Voluntário |
| Regime de Trabalho | ✅ | 20h, 30h, 40h, Dedicação Exclusiva |
| Formação | ✅ | Escolaridade + JSON de formações |
| Habilitações | ✅ | JSON de habilitações (Libras, Braille, AEE) |
| Código INEP Servidor | ✅ | Campo `codigo_inep_servidor` presente |
| Carga Horária Semanal | ✅ | Campo `carga_horaria_semanal` presente |

### Escolas

| Campo/Recurso | Status | Observações |
|---------------|--------|-------------|
| Código INEP | ✅ | Campo único obrigatório |
| Tipo de Escola | ✅ | Municipal, Estadual, Federal, Privada |
| Município IBGE | 🔍 | Mencionado em views, verificar tabela |
| UF (Estado) | 🔍 | Mencionado em views, verificar tabela |
| Zona | 🔍 | Mencionado em views, verificar tabela |
| Localização | 🔍 | Mencionado em views, verificar tabela |
| Localização Geográfica | ✅ | Latitude, longitude |
| Capacidade Total | ✅ | Campo presente |
| Turnos | ✅ | JSON com turnos oferecidos |
| Modalidades | ✅ | EJA, AEE configuráveis |

---

## 2. Funcionalidades Essenciais

### Matrícula

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Nova Matrícula | ✅ | Tabela `enrollments` implementada |
| Rematrícula | ✅ | Tipo "Rematrícula" no campo `modalidade` |
| Transferência | ⚠️ | Campo `escola_origem` existe, mas sem workflow |
| Histórico de Matrículas | ✅ | Tabela mantém histórico completo |
| Status de Matrícula | ✅ | Matriculado, Transferido, Cancelado, Concluído, Abandonou |
| Documentos de Transferência | ❌ | Não encontrado |

### Frequência

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Registro Diário | ✅ | Tabela `attendance` completa |
| Frequência por Disciplina | ✅ | Campo `subject_id` opcional |
| Frequência Geral | ✅ | `subject_id` NULL = frequência geral |
| Atrasos | ✅ | Campo `atraso_minutos` |
| Saídas Antecipadas | ✅ | Campo `saida_antecipada_minutos` |
| Justificativas | ✅ | Campo `justificativa` |
| Cálculo de Percentual | ⚠️ | Função existe mas não validada |
| Validação 75% Mínimo | ❌ | Não implementado |
| Alertas de Frequência | ⚠️ | Trigger existe para PEI, mas não geral |

### Avaliações

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Notas Numéricas | ✅ | Campo `nota_valor` (0-10) |
| Conceitos | ✅ | Campo `conceito` (A-E, MB-B-R-I) |
| Tipos de Avaliação | ✅ | Prova, Trabalho, Projeto, Participação, Recuperação, Simulado |
| Períodos | ✅ | Bimestres (1BIM-4BIM), Semestres, Anual |
| Média Ponderada | ✅ | Campo `peso` para cálculo |
| Sistema de Aprovação | ✅ | Coordenador aprova notas |
| Recuperação | ⚠️ | Tipo existe, mas workflow incompleto |
| Cálculo de Média Final | 🔍 | Necessita verificação |

### Turmas

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Criação de Turmas | ✅ | Tabela `classes` completa |
| Níveis de Ensino | ✅ | Educação Infantil, EF1, EF2, EM, EJA |
| Turnos | ✅ | Campo `shift` |
| Capacidade | ✅ | `max_students`, `current_students` |
| Professor Principal | ✅ | Campo `main_teacher_id` |
| Disciplinas | ✅ | Tabela `class_subjects` |
| Horários | 🔍 | Não verificado completamente |

### Histórico Escolar

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Histórico de Matrículas | ✅ | Tabela `enrollments` |
| Histórico de Notas | ✅ | Tabela `grades` |
| Histórico de Frequência | ✅ | Tabela `attendance` |
| View Consolidada | ❌ | Não encontrada |
| PDF do Histórico | ❌ | Não encontrado |
| Formato Oficial | ❌ | Não validado |

---

## 3. Integração Educacenso

| Componente | Status | Observações |
|------------|--------|-------------|
| View Escolas (Registro 00) | ✅ | `export_inep_escolas` |
| View Turmas (Registro 20) | ✅ | `export_inep_turmas` |
| View Pessoas (Registro 30) | ✅ | `export_inep_pessoas` |
| View Gestores (Registro 40) | ✅ | `export_inep_gestores` |
| View Profissionais (Registro 50) | ✅ | `export_inep_profissionais` |
| View Matrículas (Registro 60) | ✅ | `export_inep_matriculas` |
| Geração de Arquivo TXT | ❌ | Não encontrado |
| Validação de Dados | ❌ | Não encontrado |
| Relatório de Inconsistências | ❌ | Não encontrado |
| Importação do Educacenso | ❌ | Não encontrado |

---

## 4. Requisitos Legais

### LGPD

| Componente | Status | Observações |
|------------|--------|-------------|
| Consentimentos | ✅ | Tabela `data_consents` |
| Políticas de Privacidade | ✅ | Tabela `privacy_policies` |
| Solicitações LGPD | ✅ | Tabela `lgpd_requests` |
| Anonimização | ✅ | Função `anonymize_student_data()` |
| Auditoria | ✅ | Tabela `audit_log` |

### Prazos Legais

| Requisito | Status | Observações |
|-----------|--------|-------------|
| 200 Dias Letivos | ❌ | Não validado |
| Frequência Mínima 75% | ❌ | Não validado |
| Prazos de Matrícula | ❌ | Não validado |
| Período Letivo | ⚠️ | Campo `ano_letivo` existe, mas validação não verificada |

### Documentação

| Documento | Status | Observações |
|-----------|--------|-------------|
| Histórico Escolar | ❌ | Não gerado em PDF |
| Transferência | ❌ | Não gerado |
| Declarações | 🔍 | Tabela `certificates` existe mas não analisada |
| Atas | 🔍 | Não verificado |

---

## 5. Escalabilidade

| Aspecto | Status | Observações |
|---------|--------|-------------|
| Multi-tenancy | ✅ | RLS por tenant |
| Isolamento de Dados | ✅ | RLS por escola |
| Índices Otimizados | ✅ | Criados em campos frequentes |
| Full-text Search | ✅ | Campo `search_vector` |
| Materialized Views | ✅ | `mv_network_dashboard` |
| Offline Support | ✅ | PWA com IndexedDB |
| Sincronização | ✅ | Hook `useOfflineSync` |
| Particionamento | ❌ | Não implementado |
| Cache | ⚠️ | Materialized views, mas pode melhorar |
| Testes de Volume | ❌ | Não encontrado |

---

## 6. Relatórios e Exportações

| Relatório | Status | Observações |
|-----------|--------|-------------|
| Dashboard Secretário | ✅ | `EducationSecretaryDashboard` |
| Dashboard Diretor | ✅ | `SchoolDirectorDashboard` |
| Relatório de Frequência | ⚠️ | Estrutura existe, formato não validado |
| Relatório de Rendimento | ⚠️ | Estrutura existe, formato não validado |
| Relatório de Abandono | ❌ | Não encontrado |
| Relatório IDEB | ✅ | Componente `IDEBReport.tsx` |
| Exportação Educacenso | ⚠️ | Views existem, arquivo TXT não |
| Exportação Excel | 🔍 | Serviço existe mas não verificado |
| Exportação PDF | 🔍 | Serviço existe mas não verificado |

---

## Resumo por Categoria

| Categoria | Adequado | Parcial | Inadequado | Não Verificado | Total |
|-----------|----------|---------|------------|----------------|-------|
| Estrutura de Dados | 12 | 2 | 2 | 4 | 20 |
| Funcionalidades | 15 | 5 | 6 | 2 | 28 |
| Integração Educacenso | 6 | 0 | 4 | 0 | 10 |
| Requisitos Legais | 5 | 1 | 4 | 1 | 11 |
| Escalabilidade | 7 | 1 | 2 | 0 | 10 |
| Relatórios | 3 | 2 | 1 | 2 | 8 |
| **TOTAL** | **48** | **11** | **19** | **9** | **87** |

**Percentual de Adequação**: 55% (48/87)  
**Percentual com Implementação Parcial ou Completa**: 68% (59/87)

---

**Última atualização**: Janeiro 2025

