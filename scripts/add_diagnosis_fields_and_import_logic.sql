-- ============================================================================
-- MIGRAÇÃO: Preparar Sistema para Importação CSV São Gonçalo
-- Data: 2025-11-05
-- Descrição: 
--   1. Comentários sobre estrutura de diagnosis_data (JSONB já suporta novos campos)
--   2. Criar tabela de importações em lote
--   3. Criar funções de geração de metas baseadas em BNCC
--   4. Criar funções de geração de encaminhamentos
--   5. Criar funções de transformação de barreiras
-- ============================================================================

-- ============================================================================
-- PARTE 1: ESTRUTURA diagnosis_data (Apenas Documentação)
-- ============================================================================
-- Como diagnosis_data é JSONB, não precisa migração SQL.
-- A estrutura atualizada será:
--
-- diagnosis_data JSONB = {
--   history: string,              // ✅ Já existe
--   interests: string,            // ✅ Já existe  
--   specialNeeds: string,         // ✅ Já existe
--   barriers: Barrier[],          // ✅ Já existe
--   cid10?: string,              // ✅ Já existe
--   description?: string,        // ✅ Já existe
--   aversions?: string,          // ❌ NOVO - Desinteresses/Aversão
--   abilities?: string,          // ❌ NOVO - O que já consegue fazer
--   barriersComments?: string    // ❌ NOVO - Comentários sobre barreiras
-- }
--
-- AÇÃO: Atualizar apenas interfaces TypeScript no frontend

-- ============================================================================
-- PARTE 2: TABELA DE IMPORTAÇÕES EM LOTE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pei_import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coordinator_id UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  school_id UUID REFERENCES schools(id),
  
  -- Informações do arquivo
  file_name TEXT NOT NULL,
  file_size INTEGER,
  import_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Estatísticas
  total_rows INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'processing', -- processing, completed, failed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Detalhes
  report_data JSONB,  -- Relatório completo em JSON
  error_log TEXT,     -- Log de erros
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_import_batches_coordinator ON pei_import_batches(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_school ON pei_import_batches(school_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON pei_import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_date ON pei_import_batches(import_date);

COMMENT ON TABLE pei_import_batches IS 
  'Registro de importações em lote de PEIs via CSV. Rastreia estatísticas e permite auditoria.';

-- ============================================================================
-- PARTE 3: TABELA DE TEMPLATES DE METAS BASEADAS EM BNCC
-- ============================================================================

CREATE TABLE IF NOT EXISTS pei_goal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  code VARCHAR(50) UNIQUE NOT NULL,  -- Ex: "BNCC-EF-LP-03-01"
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Classificação
  category VARCHAR(20) NOT NULL, -- academic, functional
  domain VARCHAR(100),            -- Ex: "Linguagens", "Matemática", "Autonomia"
  
  -- BNCC
  bncc_code VARCHAR(50),          -- Código oficial da BNCC
  educational_stage VARCHAR(50),  -- Ex: "Educação Infantil", "Anos Iniciais", "Anos Finais"
  grade_range TEXT[],             -- Ex: ["1º ano", "2º ano", "3º ano"]
  
  -- Keywords para detecção automática
  keywords TEXT[],                -- Ex: ["leitura", "alfabetização", "decodificação"]
  
  -- Estratégias sugeridas
  default_strategies JSONB,       -- Array de estratégias padrão
  
  -- Adaptações
  adaptable_by_interests BOOLEAN DEFAULT true, -- Pode ser adaptada com interesses do aluno
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_templates_category ON pei_goal_templates(category);
CREATE INDEX IF NOT EXISTS idx_goal_templates_stage ON pei_goal_templates(educational_stage);
CREATE INDEX IF NOT EXISTS idx_goal_templates_keywords ON pei_goal_templates USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_goal_templates_grade_range ON pei_goal_templates USING GIN(grade_range);

COMMENT ON TABLE pei_goal_templates IS 
  'Templates de metas baseados na BNCC. Usados para geração automática de metas a partir do diagnóstico.';

-- ============================================================================
-- PARTE 4: POPULAR TEMPLATES DE METAS (BNCC - Anos Iniciais)
-- ============================================================================

-- Limpar templates existentes (descomente se quiser recriar)
-- DELETE FROM pei_goal_templates;

-- LINGUAGENS - LEITURA
INSERT INTO pei_goal_templates (
  code, title, description, category, domain, 
  educational_stage, grade_range, keywords, default_strategies
) VALUES 
(
  'BNCC-LP-01',
  'Desenvolver habilidades de leitura e decodificação',
  'Aprimorar a capacidade de ler palavras, frases e textos simples com fluência progressiva',
  'academic',
  'Linguagens - Língua Portuguesa',
  'Anos Iniciais',
  ARRAY['1º ano', '2º ano', '3º ano', 'Grupo 5'],
  ARRAY['leitura', 'ler', 'decodificação', 'palavras', 'textos'],
  '[
    "Leitura compartilhada com mediação do professor",
    "Utilização de textos adaptados ao nível de leitura",
    "Jogos de formação e reconhecimento de palavras",
    "Atividades lúdicas com fichas de leitura"
  ]'::jsonb
),

-- LINGUAGENS - ESCRITA
(
  'BNCC-LP-02',
  'Aprimorar habilidades de escrita',
  'Desenvolver a escrita de palavras, frases e textos curtos com progressiva autonomia',
  'academic',
  'Linguagens - Língua Portuguesa',
  'Anos Iniciais',
  ARRAY['1º ano', '2º ano', '3º ano'],
  ARRAY['escrita', 'escrever', 'grafia', 'registro'],
  '[
    "Tracejados preparatórios e caligrafia guiada",
    "Escrita de palavras significativas",
    "Produção de frases com apoio visual",
    "Registro de vivências do cotidiano"
  ]'::jsonb
),

-- MATEMÁTICA - NÚMEROS
(
  'BNCC-MAT-01',
  'Reconhecer e operar com números',
  'Identificar, ler, escrever e operar com números naturais em situações do cotidiano',
  'academic',
  'Matemática',
  'Anos Iniciais',
  ARRAY['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'],
  ARRAY['números', 'matemática', 'cálculo', 'contagem', 'operações'],
  '[
    "Uso de material concreto (blocos, palitos, ábacos)",
    "Jogos matemáticos adaptados",
    "Situações-problema do cotidiano",
    "Sequências numéricas com apoio visual"
  ]'::jsonb
),

-- FUNCIONAL - COORDENAÇÃO MOTORA
(
  'FUNC-CM-01',
  'Desenvolver coordenação motora fina',
  'Aprimorar o controle dos movimentos das mãos e dedos para escrita e atividades cotidianas',
  'functional',
  'Desenvolvimento Motor',
  'Educação Infantil e Anos Iniciais',
  ARRAY['Grupo 2', 'Grupo 3', 'Grupo 4', 'Grupo 5', '1º ano', '2º ano', '3º ano'],
  ARRAY['coordenação motora', 'motora fina', 'escrita', 'segurar'],
  '[
    "Massinha e argila para modelagem",
    "Recorte e colagem progressivos",
    "Jogos de encaixe e manipulação",
    "Tracejados e pontilhados preparatórios"
  ]'::jsonb
),

-- FUNCIONAL - ATENÇÃO E CONCENTRAÇÃO
(
  'FUNC-AT-01',
  'Ampliar capacidade de atenção e concentração',
  'Desenvolver a capacidade de manter o foco em atividades por períodos progressivamente maiores',
  'functional',
  'Funções Executivas',
  'Todos os níveis',
  ARRAY['Grupo 2', 'Grupo 3', 'Grupo 4', 'Grupo 5', '1º ano', '2º ano', '3º ano', '4º ano', '5º ano'],
  ARRAY['atenção', 'concentração', 'foco', 'dispersão', 'distração'],
  '[
    "Atividades curtas e variadas",
    "Pausas programadas (Técnica Pomodoro adaptada)",
    "Ambiente com redução de estímulos visuais/sonoros",
    "Uso de temporizadores visuais"
  ]'::jsonb
),

-- FUNCIONAL - AUTONOMIA
(
  'FUNC-AU-01',
  'Desenvolver autonomia nas atividades cotidianas',
  'Promover independência nas atividades de rotina escolar e autocuidado',
  'functional',
  'Autonomia e Independência',
  'Todos os níveis',
  ARRAY['Grupo 2', 'Grupo 3', 'Grupo 4', 'Grupo 5', '1º ano', '2º ano', '3º ano', '4º ano', '5º ano'],
  ARRAY['autonomia', 'independência', 'organização', 'rotina', 'banheiro', 'material'],
  '[
    "Rotina visual estruturada",
    "Checklist ilustrado de tarefas",
    "Reforço positivo para conquistas",
    "Suportes visuais (etiquetas, marcações)"
  ]'::jsonb
),

-- FUNCIONAL - SOCIALIZAÇÃO
(
  'FUNC-SO-01',
  'Promover interação social e comunicação',
  'Desenvolver habilidades de interação com pares e adultos, e comunicação efetiva',
  'functional',
  'Socialização e Comunicação',
  'Todos os níveis',
  ARRAY['Grupo 2', 'Grupo 3', 'Grupo 4', 'Grupo 5', '1º ano', '2º ano', '3º ano', '4º ano', '5º ano'],
  ARRAY['socialização', 'interação', 'comunicação', 'colegas', 'timidez', 'fala'],
  '[
    "Atividades em grupos pequenos",
    "Jogos cooperativos",
    "Rodas de conversa estruturadas",
    "Mediação de conflitos pelo professor"
  ]'::jsonb
),

-- MATEMÁTICA - RACIOCÍNIO LÓGICO
(
  'BNCC-MAT-02',
  'Desenvolver raciocínio lógico-matemático',
  'Aprimorar a capacidade de resolver situações-problema com estratégias variadas',
  'academic',
  'Matemática',
  'Anos Iniciais',
  ARRAY['2º ano', '3º ano', '4º ano', '5º ano'],
  ARRAY['raciocínio', 'problema', 'lógica', 'pensamento'],
  '[
    "Situações-problema contextualizadas",
    "Jogos de lógica e estratégia",
    "Uso de materiais manipuláveis",
    "Representações visuais (desenhos, diagramas)"
  ]'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PARTE 5: FUNÇÃO PARA GERAR METAS AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_goals_from_diagnosis(
  p_special_needs TEXT,
  p_interests TEXT,
  p_grade VARCHAR(50),
  p_target_months INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
  v_goals JSONB := '[]'::jsonb;
  v_goal_template RECORD;
  v_goal JSONB;
  v_strategies JSONB;
  v_target_date DATE;
  v_keyword TEXT;
BEGIN
  -- Calcular data alvo (padrão: 3 meses)
  v_target_date := CURRENT_DATE + (p_target_months || ' months')::INTERVAL;
  
  -- Normalizar entrada
  p_special_needs := LOWER(TRIM(p_special_needs));
  p_interests := LOWER(TRIM(p_interests));
  
  -- Buscar templates que correspondem às necessidades
  FOR v_goal_template IN 
    SELECT * 
    FROM pei_goal_templates
    WHERE is_active = true
    AND (
      -- Verificar se alguma keyword aparece nas necessidades
      EXISTS (
        SELECT 1 FROM unnest(keywords) kw 
        WHERE p_special_needs LIKE '%' || kw || '%'
      )
      -- Verificar se a série está no range
      AND (
        grade_range IS NULL 
        OR p_grade = ANY(grade_range)
      )
    )
    ORDER BY 
      -- Priorizar por número de keywords que batem
      (
        SELECT COUNT(*) FROM unnest(keywords) kw 
        WHERE p_special_needs LIKE '%' || kw || '%'
      ) DESC
    LIMIT 5  -- Máximo 5 metas
  LOOP
    -- Copiar estratégias padrão
    v_strategies := v_goal_template.default_strategies;
    
    -- Se o template permite adaptação e há interesses, adicionar estratégia personalizada
    IF v_goal_template.adaptable_by_interests AND p_interests IS NOT NULL AND p_interests != '' THEN
      v_strategies := v_strategies || jsonb_build_array(
        'Uso de ' || p_interests || ' para aumentar engajamento'
      );
    END IF;
    
    -- Construir meta
    v_goal := jsonb_build_object(
      'description', v_goal_template.description,
      'category', v_goal_template.category,
      'target_date', v_target_date,
      'progress_level', 'não iniciada',
      'strategies', v_strategies,
      'notes', 'Meta gerada automaticamente com base em ' || v_goal_template.code,
      'bncc_code', v_goal_template.bncc_code
    );
    
    -- Adicionar ao array de metas
    v_goals := v_goals || jsonb_build_array(v_goal);
  END LOOP;
  
  -- Se não encontrou nenhuma meta, criar uma genérica
  IF jsonb_array_length(v_goals) = 0 THEN
    v_goal := jsonb_build_object(
      'description', 'Desenvolver habilidades de ' || p_special_needs,
      'category', 'functional',
      'target_date', v_target_date,
      'progress_level', 'não iniciada',
      'strategies', jsonb_build_array(
        'Atividades adaptadas ao nível do aluno',
        'Acompanhamento individualizado',
        'Reforço positivo'
      )
    );
    v_goals := v_goals || jsonb_build_array(v_goal);
  END IF;
  
  RETURN v_goals;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_goals_from_diagnosis(TEXT, TEXT, VARCHAR, INTEGER) IS 
  'Gera metas automaticamente baseadas em necessidades, interesses e série do aluno. Retorna JSONB array de metas.';

-- ============================================================================
-- PARTE 6: FUNÇÃO PARA GERAR ENCAMINHAMENTOS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_referrals_from_diagnosis(
  p_diagnosis_data JSONB,
  p_barriers JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_referrals JSONB := '[]'::jsonb;
  v_referral JSONB;
  v_special_needs TEXT;
  v_barrier JSONB;
BEGIN
  v_special_needs := LOWER(COALESCE(p_diagnosis_data->>'specialNeeds', ''));
  
  -- Encaminhamentos baseados em necessidades específicas
  
  -- Fonoaudiologia
  IF v_special_needs LIKE '%fala%' 
     OR v_special_needs LIKE '%comunicação%'
     OR v_special_needs LIKE '%linguagem%'
     OR v_special_needs LIKE '%fonológ%' THEN
    v_referral := jsonb_build_object(
      'service', 'Fonoaudiologia',
      'reason', 'Dificuldades de fala, linguagem ou comunicação identificadas no diagnóstico',
      'priority', 'alta',
      'status', 'pendente'
    );
    v_referrals := v_referrals || jsonb_build_array(v_referral);
  END IF;
  
  -- Psicologia
  IF v_special_needs LIKE '%emocion%'
     OR v_special_needs LIKE '%comportamento%'
     OR v_special_needs LIKE '%ansiedade%'
     OR v_special_needs LIKE '%agressiv%' THEN
    v_referral := jsonb_build_object(
      'service', 'Psicologia',
      'reason', 'Aspectos emocionais e comportamentais que requerem acompanhamento',
      'priority', 'alta',
      'status', 'pendente'
    );
    v_referrals := v_referrals || jsonb_build_array(v_referral);
  END IF;
  
  -- Terapia Ocupacional
  IF v_special_needs LIKE '%coordenação motora%'
     OR v_special_needs LIKE '%motora fina%'
     OR v_special_needs LIKE '%sensorial%' THEN
    v_referral := jsonb_build_object(
      'service', 'Terapia Ocupacional',
      'reason', 'Desenvolvimento de coordenação motora e integração sensorial',
      'priority', 'média',
      'status', 'pendente'
    );
    v_referrals := v_referrals || jsonb_build_array(v_referral);
  END IF;
  
  -- Neurologia/Neuropediatria
  IF v_special_needs LIKE '%atenção%'
     OR v_special_needs LIKE '%concentração%'
     OR v_special_needs LIKE '%hiperativ%'
     OR v_special_needs LIKE '%memória%' THEN
    v_referral := jsonb_build_object(
      'service', 'Neurologia/Neuropediatria',
      'reason', 'Avaliação neurológica para dificuldades de atenção e funções executivas',
      'priority', 'média',
      'status', 'pendente'
    );
    v_referrals := v_referrals || jsonb_build_array(v_referral);
  END IF;
  
  -- Sala de Recursos / AEE
  IF v_special_needs LIKE '%leitura%'
     OR v_special_needs LIKE '%escrita%'
     OR v_special_needs LIKE '%matemática%'
     OR v_special_needs LIKE '%aprendizagem%' THEN
    v_referral := jsonb_build_object(
      'service', 'Atendimento Educacional Especializado (AEE)',
      'reason', 'Necessidade de apoio pedagógico especializado',
      'priority', 'alta',
      'status', 'pendente'
    );
    v_referrals := v_referrals || jsonb_build_array(v_referral);
  END IF;
  
  -- Encaminhamentos baseados em barreiras comunicacionais
  IF p_barriers IS NOT NULL THEN
    FOR v_barrier IN SELECT * FROM jsonb_array_elements(p_barriers)
    LOOP
      IF (v_barrier->>'description') LIKE '%comunicacional%' 
         AND (v_barrier->>'severity') IN ('moderada', 'severa') THEN
        -- CAA (Comunicação Aumentativa e Alternativa)
        v_referral := jsonb_build_object(
          'service', 'Avaliação para CAA (Comunicação Aumentativa/Alternativa)',
          'reason', 'Barreira comunicacional identificada requer avaliação para recursos de CAA',
          'priority', 'alta',
          'status', 'pendente'
        );
        v_referrals := v_referrals || jsonb_build_array(v_referral);
      END IF;
    END LOOP;
  END IF;
  
  RETURN v_referrals;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_referrals_from_diagnosis(JSONB, JSONB) IS 
  'Gera encaminhamentos automaticamente baseados no diagnóstico e barreiras. Retorna JSONB array de encaminhamentos.';

-- ============================================================================
-- PARTE 7: FUNÇÃO PARA TRANSFORMAR BARREIRAS DO CSV
-- ============================================================================

CREATE OR REPLACE FUNCTION transform_csv_barriers(
  p_arquitetonicas TEXT,
  p_comunicacionais TEXT,
  p_atitudinais TEXT,
  p_tecnologicas TEXT,
  p_pedagogicas TEXT,
  p_outras TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_barriers JSONB := '[]'::jsonb;
  v_barrier JSONB;
  v_severity_map JSONB := '{
    "Nenhum": null,
    "Pouco": "leve",
    "Moderado": "moderada",
    "Alto": "severa"
  }'::jsonb;
BEGIN
  -- Arquitetônicas
  IF p_arquitetonicas IS NOT NULL AND p_arquitetonicas != 'Nenhum' THEN
    v_barrier := jsonb_build_object(
      'description', 'Barreira arquitetônica (mobiliário inadequado, banheiros não adaptados)',
      'severity', v_severity_map->>p_arquitetonicas
    );
    v_barriers := v_barriers || jsonb_build_array(v_barrier);
  END IF;
  
  -- Comunicacionais
  IF p_comunicacionais IS NOT NULL AND p_comunicacionais != 'Nenhum' THEN
    v_barrier := jsonb_build_object(
      'description', 'Barreira comunicacional (ausência de Libras, braile, CAA)',
      'severity', v_severity_map->>p_comunicacionais
    );
    v_barriers := v_barriers || jsonb_build_array(v_barrier);
  END IF;
  
  -- Atitudinais
  IF p_atitudinais IS NOT NULL AND p_atitudinais != 'Nenhum' THEN
    v_barrier := jsonb_build_object(
      'description', 'Barreira atitudinal (falta de acolhimento, capacitismo, bullying)',
      'severity', v_severity_map->>p_atitudinais
    );
    v_barriers := v_barriers || jsonb_build_array(v_barrier);
  END IF;
  
  -- Tecnológicas
  IF p_tecnologicas IS NOT NULL AND p_tecnologicas != 'Nenhum' THEN
    v_barrier := jsonb_build_object(
      'description', 'Barreira tecnológica (falta de computadores, tablets, softwares acessíveis)',
      'severity', v_severity_map->>p_tecnologicas
    );
    v_barriers := v_barriers || jsonb_build_array(v_barrier);
  END IF;
  
  -- Pedagógicas
  IF p_pedagogicas IS NOT NULL AND p_pedagogicas != 'Nenhum' THEN
    v_barrier := jsonb_build_object(
      'description', 'Barreira pedagógica (atividades sem adaptação, provas inflexíveis)',
      'severity', v_severity_map->>p_pedagogicas
    );
    v_barriers := v_barriers || jsonb_build_array(v_barrier);
  END IF;
  
  -- Outras
  IF p_outras IS NOT NULL AND p_outras != 'Nenhum' THEN
    v_barrier := jsonb_build_object(
      'description', 'Outras barreiras (emocionais, familiares, sensoriais)',
      'severity', v_severity_map->>p_outras
    );
    v_barriers := v_barriers || jsonb_build_array(v_barrier);
  END IF;
  
  RETURN v_barriers;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION transform_csv_barriers(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS 
  'Transforma as 6 colunas de barreiras do CSV em um array JSONB compatível com o sistema.';

-- ============================================================================
-- PARTE 8: FUNÇÃO COMPLETA DE IMPORTAÇÃO DE LINHA DO CSV
-- ============================================================================

CREATE OR REPLACE FUNCTION import_pei_from_csv_row(
  p_coordinator_email TEXT,
  p_school_name TEXT,
  p_student_name TEXT,
  p_grade VARCHAR(50),
  p_shift VARCHAR(20),
  p_history TEXT,
  p_interests TEXT,
  p_aversions TEXT,
  p_abilities TEXT,
  p_special_needs TEXT,
  p_barrier_arquitetonicas TEXT DEFAULT 'Nenhum',
  p_barrier_comunicacionais TEXT DEFAULT 'Nenhum',
  p_barrier_atitudinais TEXT DEFAULT 'Nenhum',
  p_barrier_tecnologicas TEXT DEFAULT 'Nenhum',
  p_barrier_pedagogicas TEXT DEFAULT 'Nenhum',
  p_barrier_outras TEXT DEFAULT 'Nenhum',
  p_barriers_comments TEXT DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_coordinator_id UUID;
  v_school_id UUID;
  v_student_id UUID;
  v_enrollment_id UUID;
  v_pei_id UUID;
  v_diagnosis_data JSONB;
  v_planning_data JSONB;
  v_barriers JSONB;
  v_goals JSONB;
  v_referrals JSONB;
  v_result JSONB;
  v_current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  -- 1. Buscar coordenador por email
  SELECT id INTO v_coordinator_id
  FROM profiles
  WHERE email = p_coordinator_email
  AND id IN (SELECT user_id FROM user_roles WHERE role = 'coordinator')
  LIMIT 1;
  
  IF v_coordinator_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Coordenador não encontrado: ' || p_coordinator_email
    );
  END IF;
  
  -- 2. Buscar escola por nome (fuzzy match)
  SELECT id INTO v_school_id
  FROM schools
  WHERE UPPER(school_name) LIKE '%' || UPPER(TRIM(p_school_name)) || '%'
  AND is_active = true
  LIMIT 1;
  
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Escola não encontrada: ' || p_school_name
    );
  END IF;
  
  -- 3. Verificar se aluno já existe (mesmo nome na mesma escola)
  SELECT id INTO v_student_id
  FROM students
  WHERE UPPER(name) = UPPER(TRIM(p_student_name))
  AND school_id = v_school_id
  LIMIT 1;
  
  -- 4. Se não existe, criar aluno
  IF v_student_id IS NULL THEN
    INSERT INTO students (name, school_id, tenant_id, is_active)
    SELECT 
      TRIM(p_student_name),
      v_school_id,
      tenant_id,
      true
    FROM schools WHERE id = v_school_id
    RETURNING id INTO v_student_id;
  END IF;
  
  -- 5. Criar matrícula (se ainda não tiver uma ativa)
  SELECT create_student_enrollment(
    v_student_id,
    v_school_id,
    v_current_year,
    TRIM(p_grade),
    COALESCE(NULLIF(TRIM(p_grade), ''), 'A'),  -- class_name = primeira letra da série
    TRIM(p_shift)
  ) INTO v_enrollment_id;
  
  -- 6. Transformar barreiras
  v_barriers := transform_csv_barriers(
    p_barrier_arquitetonicas,
    p_barrier_comunicacionais,
    p_barrier_atitudinais,
    p_barrier_tecnologicas,
    p_barrier_pedagogicas,
    p_barrier_outras
  );
  
  -- 7. Montar diagnosis_data
  v_diagnosis_data := jsonb_build_object(
    'history', COALESCE(TRIM(p_history), ''),
    'interests', COALESCE(TRIM(p_interests), ''),
    'aversions', COALESCE(TRIM(p_aversions), ''),
    'abilities', COALESCE(TRIM(p_abilities), ''),
    'specialNeeds', COALESCE(TRIM(p_special_needs), ''),
    'barriers', v_barriers,
    'barriersComments', COALESCE(TRIM(p_barriers_comments), '')
  );
  
  -- 8. Gerar metas automaticamente
  v_goals := generate_goals_from_diagnosis(
    p_special_needs,
    p_interests,
    p_grade,
    3  -- 3 meses
  );
  
  -- 9. Gerar encaminhamentos automaticamente
  v_referrals := generate_referrals_from_diagnosis(
    v_diagnosis_data,
    v_barriers
  );
  
  -- 10. Montar planning_data
  v_planning_data := jsonb_build_object(
    'goals', v_goals,
    'referrals', v_referrals
  );
  
  -- 11. Criar PEI
  INSERT INTO peis (
    student_id,
    school_id,
    tenant_id,
    created_by,
    assigned_teacher_id,
    status,
    version_number,
    is_active_version,
    diagnosis_data,
    planning_data
  )
  SELECT 
    v_student_id,
    v_school_id,
    s.tenant_id,
    v_coordinator_id,
    NULL,  -- Sem professor atribuído ainda
    'draft',
    1,
    true,
    v_diagnosis_data,
    v_planning_data
  FROM schools s WHERE s.id = v_school_id
  RETURNING id INTO v_pei_id;
  
  -- 12. Atualizar batch (se fornecido)
  IF p_batch_id IS NOT NULL THEN
    UPDATE pei_import_batches
    SET success_count = success_count + 1
    WHERE id = p_batch_id;
  END IF;
  
  -- 13. Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'pei_id', v_pei_id,
    'student_id', v_student_id,
    'student_name', p_student_name,
    'goals_generated', jsonb_array_length(v_goals),
    'referrals_generated', jsonb_array_length(v_referrals)
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, registrar no batch
  IF p_batch_id IS NOT NULL THEN
    UPDATE pei_import_batches
    SET 
      error_count = error_count + 1,
      error_log = COALESCE(error_log, '') || E'\n' || 
                  'Erro ao importar ' || p_student_name || ': ' || SQLERRM
    WHERE id = p_batch_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', false,
    'student_name', p_student_name,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION import_pei_from_csv_row IS 
  'Importa uma linha completa do CSV, criando aluno, matrícula e PEI com metas e encaminhamentos automáticos.';

-- ============================================================================
-- LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração concluída com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela pei_import_batches';
  RAISE NOTICE '  2. ✅ Criada tabela pei_goal_templates (BNCC)';
  RAISE NOTICE '  3. ✅ Populados 8 templates de metas';
  RAISE NOTICE '  4. ✅ Criada função generate_goals_from_diagnosis()';
  RAISE NOTICE '  5. ✅ Criada função generate_referrals_from_diagnosis()';
  RAISE NOTICE '  6. ✅ Criada função transform_csv_barriers()';
  RAISE NOTICE '  7. ✅ Criada função import_pei_from_csv_row()';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Atualizar interfaces TypeScript';
  RAISE NOTICE '  - Criar script Node.js de importação CSV';
  RAISE NOTICE '  - Testar com subset do CSV (5 alunos)';
END $$;

