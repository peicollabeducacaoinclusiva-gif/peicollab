# Documento de Requisitos do Projeto PEI Collab V3

**Versão:** 1.0  
**Data:** 30 de Novembro de 2025  
**Status:** Consolidado

---

## 1. Introdução

O **PEI Collab V3** é um Sistema Integrado de Gestão Educacional Inclusiva, desenvolvido como um monorepo para atender às necessidades de redes de ensino público e privado. O objetivo principal é facilitar a gestão do Plano Educacional Individualizado (PEI), Plano de Atendimento Educacional Especializado (AEE), e a gestão escolar administrativa, promovendo a colaboração entre professores, profissionais de apoio, gestores e famílias.

Este documento consolida os requisitos funcionais e não funcionais do sistema, baseando-se na arquitetura atual, funcionalidades implementadas e necessidades de adequação para redes públicas (Educacenso/MEC).

---

## 2. Escopo do Projeto

O ecossistema é composto pelas seguintes aplicações integradas:

1.  **PEI Collab (@pei/pei-collab):** Aplicação principal para gestão de PEIs, reuniões e avaliações.
2.  **Gestão Escolar (@pei/gestao-escolar):** Sistema administrativo para escolas e redes (alunos, turmas, profissionais).
3.  **Plano AEE (@pei/plano-aee):** Gestão específica do Atendimento Educacional Especializado.
4.  **Portal do Responsável:** Acesso para pais e responsáveis acompanharem o desenvolvimento.
5.  **Atividades e Planejamento:** Ferramentas para professores planejarem aulas adaptadas.
6.  **Landing Page e Blog:** Canais institucionais e informativos.
7.  **Módulos Futuros:** Merenda Escolar e Transporte Escolar.

---

## 3. Requisitos Funcionais (RF)

### 3.1. Módulo PEI Collab (Core)
*   **RF-PEI-01 (Gestão de PEI):** Permitir criação, edição e visualização do Plano Educacional Individualizado.
*   **RF-PEI-02 (Dashboard do Profissional de Apoio):** Exibir alunos atribuídos e permitir inserção de feedbacks diários.
*   **RF-PEI-03 (Sistema de Reuniões):** Gerenciar agendamento, pautas, participantes e geração de atas de reuniões.
*   **RF-PEI-04 (Avaliação Cíclica):** Suportar ciclos de avaliação (I, II, III) com relatórios de evolução.
*   **RF-PEI-05 (Dashboards de Rede):** Fornecer métricas de inclusão, conformidade e engajamento para gestores (Secretaria).
*   **RF-PEI-06 (Exportação):** Gerar documentos do PEI em formato PDF.

### 3.2. Módulo Gestão Escolar
*   **RF-GE-01 (Cadastro de Alunos):** Gerenciar dados completos (pessoais, documentos, endereço, responsáveis, saúde).
*   **RF-GE-02 (Cadastro de Profissionais):** Gerenciar dados funcionais, formação e vínculos.
*   **RF-GE-03 (Gestão de Turmas):** Criar e gerenciar turmas, turnos, modalidades e enturmação de alunos.
*   **RF-GE-04 (Matrículas):** Gerenciar histórico de matrículas, transferências e status (Ativo, Cancelado, etc.).
*   **RF-GE-05 (Frequência):** Registrar presença/falta por dia, aluno e disciplina.
*   **RF-GE-06 (Notas e Avaliações):** Registrar notas por período (bimestre/semestre), tipos de avaliação e cálculo de médias.
*   **RF-GE-07 (Relatórios Gerenciais):** Gerar relatórios de frequência, rendimento e abandono escolar.
*   **RF-GE-08 (Exportação Educacenso):** Gerar arquivos/dados compatíveis com o layout do Educacenso (INEP).

### 3.3. Módulo Plano AEE
*   **RF-AEE-01 (Diagnóstico):** Registrar diagnóstico inicial e anamnese do aluno.
*   **RF-AEE-02 (Plano de Atendimento):** Criar planos de atendimento com objetivos e recursos específicos.
*   **RF-AEE-03 (Integração PEI):** Vincular Plano AEE ao PEI do aluno automaticamente.
*   **RF-AEE-04 (Anexos):** Permitir upload e gestão de documentos e laudos médicos.

### 3.4. Portal do Responsável
*   **RF-PR-01 (Acesso Seguro):** Autenticação específica para responsáveis visualizarem dados de seus dependentes.
*   **RF-PR-02 (Visualização):** Exibir PEI, Plano AEE, notas e frequência (modo leitura).
*   **RF-PR-03 (Comunicação):** Canal de comunicação entre família e escola (mensagens/feedbacks).

### 3.5. Atividades e Planejamento
*   **RF-ATV-01 (Planejamento de Aulas):** Criar planos de aula alinhados à BNCC e currículo.
*   **RF-ATV-02 (Adaptação Curricular):** Sugerir adaptações de atividades baseadas nas necessidades do PEI/AEE.
*   **RF-ATV-03 (Banco de Atividades):** Repositório de atividades adaptadas reutilizáveis.

### 3.6. Landing e Blog
*   **RF-WEB-01 (AppHub):** Centralizar acesso a todos os aplicativos do ecossistema.
*   **RF-WEB-02 (Conteúdo):** Gerenciar publicação de artigos e notícias sobre educação inclusiva.

---

## 4. Requisitos Não Funcionais (RNF)

### 4.1. Segurança e Privacidade (LGPD)
*   **RNF-SEG-01 (Autenticação):** Sistema de Login Único (SSO) entre todas as aplicações.
*   **RNF-SEG-02 (Controle de Acesso):** Row-Level Security (RLS) rigoroso para isolamento de dados por Tenant (Rede) e Escola.
*   **RNF-SEG-03 (Auditoria):** Logs imutáveis de todas as operações de escrita (quem, quando, o quê).
*   **RNF-SEG-04 (Consentimento):** Gestão de termos de consentimento e políticas de privacidade (LGPD).
*   **RNF-SEG-05 (Anonimização):** Capacidade de anonimizar dados de alunos para fins de teste ou exclusão.

### 4.2. Performance e Escalabilidade
*   **RNF-PERF-01 (Otimização):** Tempo de carregamento inicial < 2s (LCP).
*   **RNF-PERF-02 (Volume de Dados):** Suportar redes com > 10.000 alunos sem degradação perceptível.
*   **RNF-PERF-03 (Offline First):** Suporte a funcionamento offline (PWA) para funcionalidades críticas (ex: chamada, feedback).
*   **RNF-PERF-04 (Cache):** Utilização eficiente de cache e Materialized Views para dashboards.

### 4.3. Usabilidade e Acessibilidade
*   **RNF-UX-01 (Interface):** Design responsivo (Mobile First) e consistente (Design System compartilhado).
*   **RNF-UX-02 (Acessibilidade):** Conformidade com WCAG 2.1 Nível AA (navegação por teclado, leitores de tela, contraste).

### 4.4. Confiabilidade e Disponibilidade
*   **RNF-REL-01 (Sincronização):** Mecanismo robusto de sincronização de dados offline-online.
*   **RNF-REL-02 (Backup):** Rotinas automáticas de backup e recuperação de desastres.

### 4.5. Arquitetura e Manutenibilidade
*   **RNF-ARQ-01 (Monorepo):** Estrutura modular utilizando Turborepo e pnpm workspaces.
*   **RNF-ARQ-02 (Código):** Uso estrito de TypeScript e padrões de código (ESLint, Prettier).
*   **RNF-ARQ-03 (Testes):** Cobertura de testes unitários, integração e E2E (Vitest, Playwright).

---

## 5. Requisitos de Adequação à Rede Pública (Prioritários)

Para operação em redes públicas, os seguintes requisitos são críticos (baseado na análise de adequação):

*   **RA-01 (Frequência Mínima):** Validação automática de 75% de frequência com alertas de risco.
*   **RA-02 (Educacenso TXT):** Geração de arquivos de exportação no layout oficial do INEP (txt).
*   **RA-03 (Validação de Dados):** Validação prévia de campos obrigatórios do Censo antes da exportação.
*   **RA-04 (Histórico Escolar):** Geração de Histórico Escolar consolidado em PDF oficial.
*   **RA-05 (Transferência):** Workflow completo de transferência entre escolas da mesma rede ou redes distintas.
*   **RA-06 (Recuperação):** Workflow de recuperação de notas e cálculo automático de resultados finais.

---

## 6. Roadmap de Implementação (Resumo)

*   **Curto Prazo (30 dias):** Finalização da UI de Gestão Escolar, Validação de Frequência, Exportação Básica Educacenso.
*   **Médio Prazo (60 dias):** Portal do Responsável (MVP), Sugestões Automáticas em Atividades, Relatórios Oficiais (PDF).
*   **Longo Prazo (90 dias):** SSO completo com subdomínios, Dashboards Consolidados de Rede, Auditoria Avançada.
