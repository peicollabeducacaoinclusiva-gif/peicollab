
- Resumo Executivo
    
    ```markdown
    Visão Geral do Produto
    O PEI Collab é uma plataforma digital colaborativa para criação, gestão e acompanhamento de Planos Educacionais Individualizados (PEI) em redes de ensino. A solução resolve problemas críticos na educação inclusiva: falta de colaboração entre stakeholders, processos manuais demorados, ausência de acompanhamento sistemático e baixo engajamento familiar.
    Problema Central
    Atualmente, a criação de PEIs é um processo fragmentado onde:
    
    Professores trabalham isoladamente sem modelos ou orientação
    Coordenadores não conseguem acompanhar adequadamente o processo
    Famílias ficam excluídas do planejamento educacional
    Alunos não participam do próprio desenvolvimento
    Documentos ficam perdidos em papéis ou planilhas desorganizadas
    
    Solução Proposta
    Uma plataforma digital que conecta todos os envolvidos no processo educacional através de interfaces específicas para cada perfil, mantendo o aluno no centro do planejamento colaborativo.
    
    ```
    
- Fluxo dos Usuários
    
    ## Perfis de Usuário
    
    ### Secretário de Educação / Network Admin
    
    **Papel**: Administrador estratégico da rede educacional (Secretário / Network Admin)
    **Principais necessidades**: KPIs, relatórios executivos, gestão de escolas e coordenadores
    **Interface**: Dashboard executivo com foco em impacto e resultados
    
    ### Diretor Escolar
    
    **Papel**: Gestor operacional da escola (Diretor)
    **Principais necessidades**: Visão geral da escola, gestão de professores e alunos, relatórios escolares
    **Interface**: Dashboard gerencial com foco em eficiência e qualidade escolar
    
    ### Coordenador
    
    **Papel**: Validador e supervisor pedagógico
    **Principais necessidades**: Visão geral da rede, ferramentas de validação, métricas
    **Interface**: Dashboard gerencial com foco em qualidade e compliance
    
    ### Professor
    
    **Papel**: Criador principal dos PEIs
    **Principais necessidades**: Templates, orientações, acompanhamento de progresso
    **Interface**: Dashboard focado em produtividade e suporte pedagógico
    
    ### Família
    
    **Papel**: Participante ativo no planejamento
    **Principais necessidades**: Compreensão simples, participação efetiva, acompanhamento
    **Interface**: Versão simplificada e acessível com linguagem não-técnica
    
    ### Aluno
    
    **Papel**: Protagonista do próprio desenvolvimento
    **Principais necessidades**: Engajamento, motivação, autonomia
    **Interface**: Gamificada com elementos visuais e feedback positivo
    
    ## Diferenciais Tecnológicos
    
    - **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
    - **Multi-tenant**: Arquitetura hierárquica (Tenant/Rede > School/Escola) com RLS (Row Level Security) para isolamento completo.
    - **Offline-first**: Funciona sem conexão com sincronização automática (Dexie.js / IndexedDB)
    - **IA integrada**: Sugestões inteligentes baseadas em melhores práticas
    - **Acessibilidade**: Compliance WCAG 2.1 AA para inclusão digital. O frontend é **Mobile-First** e suporta **PWA** (Progressive Web App).
    - **Auditoria completa**: Rastreabilidade de todas as alterações
    
    ## Impacto Esperado
    
    - Redução de 70% no tempo de criação de PEIs
    - Aumento de 85% na participação familiar
    - Melhoria de 60% na qualidade dos planos educacionais
    - 90% de satisfação dos educadores com o processo
    
    ---
    
    # Fluxos de Usuário por Perfil
    
    ## 👨‍💼 Fluxo do Secretário de Educação / Network Admin
    
    ### Jornada Principal: Monitorar rede educacional
    
    1. **Dashboard Executivo**
        - KPIs de impacto social
        - Métricas de bem-estar coletivo
        - Recomendações estratégicas da IA
        - Comparativo com dados nacionais (INEP)
    2. **Gestão Estratégica**
        - Análise de tendências por região
        - Identificação de necessidades de capacitação
        - Planejamento de recursos e investimentos
        - Monitoramento de compliance legal
    3. **Administração de Usuários**
        - Cadastro e permissionamento
        - Monitoramento de atividade
        - Gestão de acessos por escola
        - Auditoria de ações sensíveis
    4. **Relatórios e Decisões**
        - Geração de relatórios customizados
        - Análise de ROI educacional
        - Preparação para auditorias
        - Planejamento orçamentário
    
    ### Jornadas Secundárias:
    
    - **Configuração**: Personalização do sistema por rede
    - **Integrações**: Configuração de APIs externas
    - **Treinamento**: Organização de capacitações
    
    ---
    
    ## 👨‍🏫 Fluxo do Diretor Escolar
    
    ### Jornada Principal: Gerenciar a Escola
    
    1. **Dashboard Gerencial (Diretor)**
        - Métricas de PEIs em andamento na escola
        - Visão geral de professores e alunos
        - Alertas de prazos e conformidade
    2. **Gestão de Equipe**
        - Atribuição de professores a alunos
        - Monitoramento de atividades dos professores
        - Aprovação de licenças e ausências
    3. **Relatórios Escolares**
        - Geração de relatórios de progresso por turma/nível
        - Análise de tendências internas
        - Preparação de dados para o Secretário de Educação
    
    ### Jornadas Secundárias:
    
    - **Configuração da Escola**: Personalização de dados e parâmetros escolares
    - **Comunicação**: Envio de comunicados para professores e famílias
    - **Treinamento**: Organização de capacitações internas
    
    ---
    
    ## 👨‍💼 Fluxo do Coordenador
    
    ### Jornada Principal: Validar PEIs
    
    1. **Dashboard Gerencial**
        - Métricas de PEIs pendentes, aprovados, devolvidos
        - Fila priorizada de validação
        - Alertas de prazos e qualidade
    2. **Processo de Validação**
        - Seleciona PEI da fila
        - Revisa cada seção sistematicamente
        - Adiciona comentários específicos por campo
        - Verifica consistência com PAEE (quando aplicável)
    3. **Decisão de Aprovação**
        - **Aprovar**: PEI vai para assinaturas
        - **Devolver**: Com comentários específicos para correção
        - **Solicitar reunião**: Para casos complexos
    4. **Acompanhamento da Rede**
        - Monitora qualidade dos PEIs por escola
        - Identifica professores que precisam de suporte
        - Gera relatórios para gestão
    
    ### Jornadas Secundárias:
    
    - **Gestão de equipe**: Orientação a professores via webinars
    - **Relatórios**: Geração de métricas para gestão
    - **Integração PAEE**: Importação e sincronização de dados
    
    ---
    
    ## 👨‍👩‍👧‍👦 Fluxo da Família
    
    ### Jornada Principal: Participar do PEI
    
    1. **Acesso Simplificado**
        - Recebe link por email/SMS
        - Código de verificação (sem senha complexa)
        - Tutorial de primeiro acesso
    2. **Visualização do PEI**
        - Interface simplificada com linguagem acessível
        - Gráficos visuais de progresso
        - Metas explicadas em termos práticos
        - Glossário de termos técnicos
    3. **Participação Ativa**
        - Preenche formulário de feedback
        - Compartilha observações do cotidiano
        - Sugere estratégias familiares
        - Questiona ou esclarece dúvidas
    4. **Assinatura e Acordo**
        - Revisa resumo executivo
        - Assina digitalmente seu consentimento
        - Recebe cópia para arquivo pessoal
    5. **Acompanhamento Contínuo (PWA e Offline)**
        - Recebe atualizações de progresso (via PWA e notificações)
        - Participa de reuniões escolares
        - Colabora com atividades domiciliares
    
    ### Jornadas Secundárias:
    
    - **Comunicação**: Troca de mensagens com escola (acesso via token temporário)
    - **Orientações**: Recebe guias para apoio domiciliar
    - **Reuniões**: Participação em encontros pedagógicos
    
    ---
    
    ## 👶 Fluxo do Aluno
    
    ### Jornada Principal: Engajar com próprio desenvolvimento
    
    1. **Dashboard Gamificado (Mobile-First)**
        - Avatar personalizado
        - Barra de progresso visual
        - Badges e conquistas
        - Metas semanais com emojis
    2. **Atividades Diárias (Offline-First)**
        - Lista de atividades com dificuldade visual
        - Sistema de pontos por conclusão
        - Timeline de conquistas recentes
        - Celebrações de marcos importantes
    3. **Progresso Visual**
        - Gráficos simples de evolução
        - Comparação com metas estabelecidas
        - Portfolio digital de trabalhos
        - Linha do tempo emocional
    4. **Comunicação**
        - Recebe cartinhas digitais motivacionais
        - Pode expressar sentimentos sobre atividades
        - Compartilha conquistas com família
    
    ### Jornadas Secundárias:
    
    - **Personalização**: Customização de avatar e preferências
    - **Reflexão**: Avaliação simples de atividades
    - **Compartilhamento**: Mostrar progresso para família
    
    ---
    
    ## Pontos de Interseção entre Fluxos
    
    ### Comunicação Integrada
    
    - Professor ↔ Coordenador: Validação e feedback
    - Professor ↔ Família: Progresso e orientações
    - Escola ↔ Aluno: Motivação e engajamento
    - Coordenador ↔ Secretário de Educação: Métricas e qualidade
    
    ### Momentos Colaborativos
    
    - **Criação do PEI**: Professor com input da família (com versionamento automático V2.1)
    - **Validação**: Coordenador com feedback do professor
    - **Implementação**: Todos acompanham progresso do aluno
    - **Revisão**: Ciclo colaborativo de melhoria contínua
    
    ### Fluxo de Dados
    
    1. Aluno gera dados através de atividades
    2. Professor registra observações e progresso
    3. Família contribui com contexto domiciliar
    4. Coordenador valida e orienta
    5. Secretário de Educação monitora impacto sistêmico
    6. IA aprende e sugere melhorias
    
    Cada perfil tem sua jornada específica, mas todos convergem para o objetivo comum: o desenvolvimento integral e personalizado de cada aluno.
    
- **Mapeamento Detalhado de Telas - PEI Collab App**
    - 🎯 Princípios de UX Aplicados
        - **Accessibility First**: Contraste alto, fontes legíveis, navegação por teclado
        - **Mobile-First**: Design responsivo, gestos intuitivos, uso com uma mão
        - **Cognitive Load Reduction**: Informações organizadas, progressão clara, feedback imediato
        - **Inclusive Design**: Interface adaptável para diferentes necessidades e níveis tecnológicos
        
        ---
        
        ## 📱 Telas Globais (Todos os Usuários)
        
        ### 1. **Splash Screen**
        
        **Objetivo**: Apresentar a marca e preparar a aplicação
        **Conteúdo**:
        
        - Logo PEI Collab com animação suave
        - Indicador de carregamento acessível
        - Versão da aplicação (canto inferior)
        - Modo offline indicator (se aplicável)
        
        ### 2. **Tela de Login**
        
        **Objetivo**: Autenticação segura e acessível
        **Conteúdo**:
        
        - Campo email com validação visual
        - Campo senha com toggle de visibilidade
        - Botão "Entrar" com estado de carregamento
        - Link "Esqueci minha senha"
        - Opção "Lembrar-me" (checkbox acessível)
        - Selector de perfil (Secretário de Educação, Diretor Escolar, Coordenador, Professor)
        - Botão de acessibilidade (alto contraste, fonte grande)
        
        ### 3. **Recuperação de Senha**
        
        **Objetivo**: Processo simples de recuperação
        **Conteúdo**:
        
        - Campo email com validação
        - Botão "Enviar código"
        - Feedback visual do envio
        - Timer para reenvio
        - Link para voltar ao login
        
        ### 4. **Onboarding (Primeira utilização)**
        
        **Objetivo**: Guiar o novo usuário pelas funcionalidades principais
        **Conteúdo**:
        
        - Slides explicativos por perfil (Secretário de Educação, Diretor Escolar, Coordenador, Professor, Família)
        - Tour guiado (coach marks) para as áreas mais importantes
        - Opção "Pular" e "Não mostrar novamente"
        
        ---
        
        ## 📊 Dashboard - Secretário de Educação
        
        ### 1. **Visão Geral da Rede**
        
        **Objetivo**: Visão macro de impacto e desempenho
        **Conteúdo**:
        
        - **KPIs Estratégicos**:
            - % de PEIs concluídos na rede
            - % de PEIs com metas alcançadas
            - Média de tempo de validação (Coordenadores)
            - Engajamento Familiar (métrica de acesso)
        - **Gráfico de Tendência**: Progresso da rede ao longo do tempo
        - **Alerta de Compliance**: Escolas com PEIs atrasados ou pendentes
        
        ### 2. **Gestão de Escolas**
        
        **Objetivo**: Gerenciar as unidades escolares e seus diretores
        **Conteúdo**:
        
        - Lista de escolas com status (Ativa/Inativa)
        - Filtro por região, porte, desempenho
        - Acesso rápido ao dashboard do Diretor Escolar
        - Cadastro/Edição de Diretores Escolares
        
        ### 3. **Relatórios Executivos**
        
        **Objetivo**: Geração de documentos para prestação de contas
        **Conteúdo**:
        
        - Gerador de relatórios customizados (PDF, Excel)
        - Modelos pré-definidos (INEP, Auditoria)
        - Histórico de relatórios gerados
        
        ---
        
        ## 🏫 Dashboard - Diretor Escolar
        
        ### 1. **Visão Geral da Escola**
        
        **Objetivo**: Visão operacional do desempenho da unidade
        **Conteúdo**:
        
        - **KPIs Escolares**:
            - % de PEIs concluídos na escola
            - % de alunos com PEI ativo
            - Média de tempo de criação (Professores)
            - Lista de professores e alunos
        - **Gráfico de Status**: Distribuição de PEIs por fase (Rascunho, Pendente, Aprovado)
        
        ### 2. **Gestão de Professores**
        
        **Objetivo**: Gerenciar a equipe e atribuir responsabilidades
        **Conteúdo**:
        
        - Lista de professores com carga de PEIs
        - Atribuição de alunos a professores
        - Monitoramento de atividades (log de acesso)
        
        ### 3. **Relatórios Escolares**
        
        **Objetivo**: Geração de relatórios internos e para a Secretaria
        **Conteúdo**:
        
        - Relatório de progresso por turma
        - Relatório de necessidades de recursos
        - Envio de dados consolidados para o Secretário de Educação
        
        ---
        
        ## 🧠 Dashboard - Coordenador
        
        ### 1. **Fila de Validação**
        
        **Objetivo**: Priorizar a revisão dos PEIs
        **Conteúdo**:
        
        - Lista de PEIs com status "Pendente"
        - Filtros por urgência, professor, escola
        - Detalhes do PEI para revisão
        
        ### 2. **Feedback e Devolução**
        
        **Objetivo**: Facilitar a comunicação com o professor
        **Conteúdo**:
        
        - Interface de comentários por campo do PEI
        - Templates de feedback comum
        - Histórico de revisões
        
        ### 3. **Monitoramento de Qualidade**
        
        **Objetivo**: Avaliar a performance dos professores
        **Conteúdo**:
        
        - Métricas de PEIs devolvidos por professor
        - Identificação de professores que precisam de suporte
        
        ---
        
        ## 👨‍🏫 Dashboard - Professor
        
        ### 1. **Meus PEIs**
        
        **Objetivo**: Visão geral dos planos sob sua responsabilidade
        **Conteúdo**:
        
        - Lista de alunos e seus PEIs
        - Status (Rascunho, Pendente, Aprovado)
        - Próxima data de revisão
        - Alerta de feedback do Coordenador
        
        ### 2. **Criação de PEI (Wizard)**
        
        **Objetivo**: Processo guiado de criação
        **Conteúdo**:
        
        - **Passo 1: Identificação**: Dados do aluno, histórico
        - **Passo 2: Avaliação**: Repertório, Barreiras (com IA Suggest)
        - **Passo 3: Planejamento**: Metas SMART, Estratégias (com IA Suggest)
        - **Passo 4: Revisão**: Preview e Submissão
        
        ### 3. **Acompanhamento de Metas**
        
        **Objetivo**: Registro de progresso contínuo
        **Conteúdo**:
        
        - Formulário de registro de progresso (0-100%)
        - Campo para observações qualitativas
        - Gráfico de evolução da meta
        
        ---
        
        ## 👨‍👩‍👧‍👦 Interface - Família
        
        ### 1. **Acesso e Visualização**
        
        **Objetivo**: Compreensão e participação no plano
        **Conteúdo**:
        
        - Resumo executivo do PEI em linguagem simples
        - Metas explicadas em termos práticos
        - Gráfico de progresso do aluno (visual e motivacional)
        
        ### 2. **Feedback e Assinatura**
        
        **Objetivo**: Formalizar o acordo e contribuir
        **Conteúdo**:
        
        - Formulário de feedback (observações domiciliares)
        - Botão para Assinatura Digital (com termo de consentimento)
        
        ---
        
        ## 👶 Interface - Aluno
        
        ### 1. **Meu Progresso**
        
        **Objetivo**: Engajamento e protagonismo
        **Conteúdo**:
        
        - Avatar personalizado e customizável
        - Barra de progresso geral e por meta (gamificação)
        - Badges e conquistas desbloqueadas
        
        ### 2. **Atividades e Desafios**
        
        **Objetivo**: Reforçar metas de forma lúdica
        **Conteúdo**:
        
        - Lista de atividades diárias ou semanais (com feedback visual)
        - Sistema de pontos e recompensas virtuais
        
        ---
        
        ## 🧩 Componentes Chave
        
        - **AI Assistant**: Componente de sugestão de metas e estratégias
        - **Editor de PEI**: Interface de formulário complexo com validação em tempo real
        - **Gráfico de Progresso**: Componente reutilizável para visualização de metas
        - **Assinatura Digital**: Componente de captura de consentimento legal
        
        ---
        
        ## ⚙️ Configurações Técnicas
        
        - **Tecnologia Frontend**: React + TypeScript + Vite
        - **Backend**: Lovable Cloud (Supabase)
        - **UI/UX**: Tailwind CSS + shadcn/ui
        - **Autenticação**: Supabase Auth
        
        ---

