-- Script para criar posts de exemplo no blog
-- Execute este script após aplicar a migração 20251110000000_create_blog_tables.sql

-- Buscar o ID do super admin (ajuste o email se necessário)
DO $$
DECLARE
  admin_id UUID;
  cat_inclusiva UUID;
  cat_pei UUID;
  cat_tutoriais UUID;
  cat_novidades UUID;
  cat_dicas UUID;
BEGIN
  -- Pegar o primeiro super admin
  SELECT user_id INTO admin_id 
  FROM user_roles 
  WHERE role = 'super_admin' 
  LIMIT 1;

  -- Se não houver super admin, usar o primeiro usuário
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM auth.users LIMIT 1;
  END IF;

  -- Pegar IDs das categorias
  SELECT id INTO cat_inclusiva FROM blog_categories WHERE slug = 'educacao-inclusiva';
  SELECT id INTO cat_pei FROM blog_categories WHERE slug = 'pei-colaborativo';
  SELECT id INTO cat_tutoriais FROM blog_categories WHERE slug = 'tutoriais';
  SELECT id INTO cat_novidades FROM blog_categories WHERE slug = 'novidades';
  SELECT id INTO cat_dicas FROM blog_categories WHERE slug = 'dicas';

  -- Inserir posts de exemplo
  INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, category_id, author_id, published, published_at, views) VALUES
  (
    'Bem-vindo ao Blog Educacional do PEI Colaborativo',
    'bem-vindo-ao-blog',
    'Conheça o novo blog educacional do sistema PEI Colaborativo, um espaço dedicado à educação inclusiva e compartilhamento de conhecimento.',
    '<h1>Bem-vindo ao Blog Educacional!</h1>
    <p>É com grande satisfação que apresentamos o <strong>Blog Educacional do PEI Colaborativo</strong>, um espaço dedicado ao compartilhamento de conhecimento sobre educação inclusiva e o funcionamento do nosso sistema.</p>
    <h2>O que você encontrará aqui</h2>
    <ul>
      <li><strong>Artigos sobre Educação Inclusiva:</strong> Conteúdo especializado sobre práticas pedagógicas inclusivas</li>
      <li><strong>Tutoriais do Sistema:</strong> Guias práticos para aproveitar ao máximo todas as funcionalidades</li>
      <li><strong>Novidades e Atualizações:</strong> Fique por dentro das últimas melhorias e recursos</li>
      <li><strong>Dicas e Boas Práticas:</strong> Recomendações de especialistas em educação</li>
    </ul>
    <h2>Nossa Missão</h2>
    <p>Acreditamos que a educação inclusiva é um direito de todos. Nosso objetivo é facilitar o trabalho dos educadores, proporcionar ferramentas eficientes e criar uma comunidade colaborativa em torno da inclusão escolar.</p>
    <p>Esperamos que este blog seja um recurso valioso para sua jornada na educação inclusiva!</p>',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    cat_novidades,
    admin_id,
    true,
    NOW(),
    15
  ),
  (
    'O que é um PEI e por que ele é importante?',
    'o-que-e-pei',
    'Entenda o que é o Plano Educacional Individualizado (PEI) e sua importância no processo de inclusão escolar de alunos com necessidades especiais.',
    '<h1>O que é um PEI?</h1>
    <p>O <strong>Plano Educacional Individualizado (PEI)</strong> é um documento fundamental no processo de inclusão escolar. Ele define estratégias, metas e adaptações específicas para cada aluno com necessidades educacionais especiais.</p>
    <h2>Componentes de um PEI</h2>
    <p>Um PEI completo deve incluir:</p>
    <ul>
      <li>Identificação do aluno e suas características</li>
      <li>Avaliação das habilidades atuais</li>
      <li>Metas de aprendizagem específicas e mensuráveis</li>
      <li>Estratégias pedagógicas adaptadas</li>
      <li>Recursos e apoios necessários</li>
      <li>Cronograma de avaliação e revisão</li>
    </ul>
    <h2>Por que o PEI é importante?</h2>
    <p>O PEI garante que cada aluno receba o suporte educacional adequado às suas necessidades. Ele:</p>
    <ul>
      <li>Personaliza o processo de aprendizagem</li>
      <li>Facilita a comunicação entre professores, família e especialistas</li>
      <li>Documenta o progresso do aluno</li>
      <li>Garante os direitos educacionais do estudante</li>
    </ul>
    <h2>O Sistema PEI Colaborativo</h2>
    <p>Nosso sistema foi desenvolvido para tornar a criação, gestão e acompanhamento de PEIs mais eficiente. Com ferramentas digitais intuitivas, facilitamos o trabalho colaborativo entre toda a comunidade escolar.</p>',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
    cat_inclusiva,
    admin_id,
    true,
    NOW() - INTERVAL ''1 day'',
    42
  ),
  (
    'Como criar seu primeiro PEI no sistema',
    'como-criar-primeiro-pei',
    'Tutorial passo a passo para criar e gerenciar seu primeiro Plano Educacional Individualizado usando o sistema PEI Colaborativo.',
    '<h1>Tutorial: Criando seu Primeiro PEI</h1>
    <p>Neste tutorial, vamos guiá-lo no processo de criação do seu primeiro PEI no sistema PEI Colaborativo.</p>
    <h2>Passo 1: Acessar o Sistema</h2>
    <ol>
      <li>Acesse o sistema PEI Colaborativo</li>
      <li>Faça login com suas credenciais</li>
      <li>Você será direcionado ao dashboard principal</li>
    </ol>
    <h2>Passo 2: Criar Novo PEI</h2>
    <ol>
      <li>No menu lateral, clique em "PEIs"</li>
      <li>Clique no botão "Novo PEI"</li>
      <li>Selecione o aluno para o qual o PEI será criado</li>
    </ol>
    <h2>Passo 3: Preencher Informações Básicas</h2>
    <p>Você precisará fornecer:</p>
    <ul>
      <li>Dados do aluno</li>
      <li>Período de validade do PEI</li>
      <li>Informações sobre diagnóstico e necessidades</li>
      <li>Objetivos gerais</li>
    </ul>
    <h2>Passo 4: Definir Metas e Estratégias</h2>
    <p>Esta é a parte mais importante do PEI:</p>
    <ul>
      <li>Defina metas específicas e mensuráveis</li>
      <li>Estabeleça prazos realistas</li>
      <li>Descreva as estratégias pedagógicas</li>
      <li>Liste os recursos necessários</li>
    </ul>
    <h2>Passo 5: Colaboração e Aprovação</h2>
    <ol>
      <li>Convide outros profissionais para colaborar</li>
      <li>Compartilhe com a família do aluno</li>
      <li>Envie para aprovação do coordenador</li>
    </ol>
    <p><strong>Dica:</strong> O sistema salva automaticamente seu progresso, então você pode trabalhar no PEI em várias sessões!</p>',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    cat_tutoriais,
    admin_id,
    true,
    NOW() - INTERVAL ''2 days'',
    78
  ),
  (
    '5 Dicas para um PEI eficaz',
    '5-dicas-pei-eficaz',
    'Descubra 5 dicas essenciais para criar um Plano Educacional Individualizado realmente eficaz e que faça a diferença na vida do aluno.',
    '<h1>5 Dicas para um PEI Eficaz</h1>
    <p>Criar um PEI eficaz requer planejamento, conhecimento e colaboração. Aqui estão 5 dicas essenciais:</p>
    <h2>1. Seja Específico nas Metas</h2>
    <p>Metas vagas como "melhorar a leitura" não são suficientes. Seja específico:</p>
    <ul>
      <li>❌ Meta vaga: "Melhorar a leitura"</li>
      <li>✅ Meta específica: "Ler e compreender textos de 200 palavras com 80% de acurácia até dezembro"</li>
    </ul>
    <h2>2. Envolva Todos os Stakeholders</h2>
    <p>Um PEI eficaz é construído colaborativamente:</p>
    <ul>
      <li>Professores de sala regular</li>
      <li>Professores de apoio</li>
      <li>Coordenação pedagógica</li>
      <li>Especialistas (fonoaudiólogo, psicólogo, etc.)</li>
      <li>Família do aluno</li>
    </ul>
    <h2>3. Revise Regularmente</h2>
    <p>O PEI não é um documento estático. Recomenda-se:</p>
    <ul>
      <li>Revisões trimestrais formais</li>
      <li>Ajustes pontuais quando necessário</li>
      <li>Registro contínuo do progresso</li>
    </ul>
    <h2>4. Use Recursos Concretos</h2>
    <p>Liste materiais e recursos específicos:</p>
    <ul>
      <li>Materiais pedagógicos adaptados</li>
      <li>Tecnologias assistivas</li>
      <li>Apoio de profissionais especializados</li>
      <li>Adaptações no ambiente físico</li>
    </ul>
    <h2>5. Celebre os Progressos</h2>
    <p>Reconheça e documente cada conquista, por menor que seja. Isso:</p>
    <ul>
      <li>Motiva o aluno</li>
      <li>Engaja a família</li>
      <li>Orienta futuras estratégias</li>
      <li>Demonstra a eficácia do trabalho</li>
    </ul>
    <p><strong>Lembre-se:</strong> O sucesso do PEI depende do comprometimento de toda a equipe escolar!</p>',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800',
    cat_dicas,
    admin_id,
    true,
    NOW() - INTERVAL ''3 days'',
    63
  ),
  (
    'Novos recursos: Gestão Escolar e Planejamento',
    'novos-recursos-gestao-planejamento',
    'Conheça os novos aplicativos do ecossistema PEI Colaborativo: Gestão Escolar e Planejamento de Atividades.',
    '<h1>Novos Aplicativos no Ecossistema PEI Colaborativo!</h1>
    <p>Temos o prazer de anunciar dois novos aplicativos que expandem as capacidades do nosso ecossistema:</p>
    <h2>📊 Gestão Escolar</h2>
    <p>O novo app de <strong>Gestão Escolar</strong> oferece:</p>
    <ul>
      <li><strong>Gestão de Alunos:</strong> Cadastro completo com informações acadêmicas e pessoais</li>
      <li><strong>Gestão de Profissionais:</strong> Controle de professores, coordenadores e especialistas</li>
      <li><strong>Turmas e Disciplinas:</strong> Organização de turmas, horários e matérias</li>
      <li><strong>Relatórios:</strong> Análises e indicadores da gestão escolar</li>
    </ul>
    <h2>📅 Planejamento</h2>
    <p>O app de <strong>Planejamento</strong> facilita:</p>
    <ul>
      <li><strong>Planejamento de Aulas:</strong> Organize suas aulas de forma eficiente</li>
      <li><strong>Sequências Didáticas:</strong> Crie e gerencie sequências completas</li>
      <li><strong>Objetivos de Aprendizagem:</strong> Alinhe com a BNCC</li>
      <li><strong>Compartilhamento:</strong> Colabore com outros professores</li>
    </ul>
    <h2>Integração Total</h2>
    <p>Todos os aplicativos se integram perfeitamente:</p>
    <ul>
      <li>Dados sincronizados em tempo real</li>
      <li>Login único para todos os apps</li>
      <li>Interface consistente e intuitiva</li>
    </ul>
    <h2>Nosso Ecossistema Completo</h2>
    <p>Agora você tem acesso a <strong>5 aplicações integradas</strong>:</p>
    <ol>
      <li>🎓 PEI Collab - Gestão de PEIs</li>
      <li>🏫 Gestão Escolar - Administração escolar</li>
      <li>👥 Plano de AEE - Atendimento Educacional Especializado</li>
      <li>📅 Planejamento - Planejamento de aulas</li>
      <li>📝 Atividades - Banco de atividades pedagógicas</li>
    </ol>
    <p>Acesse agora e explore todas as funcionalidades!</p>',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    cat_novidades,
    admin_id,
    true,
    NOW() - INTERVAL ''5 days'',
    91
  );

  RAISE NOTICE 'Posts de exemplo criados com sucesso!';
  RAISE NOTICE 'Admin ID usado: %', admin_id;
END $$;

