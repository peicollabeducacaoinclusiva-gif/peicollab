-- ============================================================================
-- MIGRAÇÃO: Sistema de Merenda Escolar
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabelas de merenda escolar
--   2. Criar RPCs para gerenciar merenda
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA meal_menus (Cardápios)
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Período
  period_start date NOT NULL,
  period_end date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar')),
  
  -- Cardápio
  menu_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- Estrutura completa do cardápio
  daily_menus jsonb DEFAULT '[]'::jsonb, -- [{date, items: [...], nutritional_info: {...}}]
  
  -- Informações nutricionais
  nutritional_info jsonb DEFAULT '{}'::jsonb, -- {calories, proteins, carbs, fats, vitamins}
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meal_menus_school ON meal_menus(school_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_meal_menus_tenant ON meal_menus(tenant_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_meal_menus_period ON meal_menus(period_start, period_end);

-- ============================================================================
-- PARTE 2: TABELA meal_plans (Planejamento de Compras)
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Período
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Planejamento
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- Estrutura completa
  items jsonb DEFAULT '[]'::jsonb, -- [{item, quantity, unit, estimated_cost}]
  total_estimated_cost numeric(15,2),
  
  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'purchased', 'completed')),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meal_plans_school ON meal_plans(school_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON meal_plans(status, period_start DESC);

-- ============================================================================
-- PARTE 3: TABELA meal_suppliers (Fornecedores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  cnpj text,
  contact_name text,
  contact_phone text,
  contact_email text,
  address text,
  
  -- Categorias
  categories text[] DEFAULT ARRAY[]::text[], -- ['cereais', 'legumes', 'carnes', etc.]
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meal_suppliers_tenant ON meal_suppliers(tenant_id, is_active);

-- ============================================================================
-- PARTE 4: TABELA meal_purchases (Compras)
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES meal_suppliers(id) ON DELETE SET NULL,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Compra
  purchase_date date NOT NULL,
  items jsonb DEFAULT '[]'::jsonb, -- [{item, quantity, unit, unit_price, total_price}]
  total_amount numeric(15,2) NOT NULL,
  
  -- Documentos
  invoice_number text,
  invoice_url text,
  
  -- Aprovação
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meal_purchases_school ON meal_purchases(school_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_purchases_supplier ON meal_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_meal_purchases_plan ON meal_purchases(meal_plan_id);

-- ============================================================================
-- PARTE 5: TABELA meal_preparation (Registro de Preparo)
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_preparation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  meal_menu_id uuid REFERENCES meal_menus(id) ON DELETE SET NULL,
  
  -- Preparo
  preparation_date date NOT NULL,
  meal_type text NOT NULL,
  items_prepared jsonb DEFAULT '[]'::jsonb, -- [{item, quantity, unit}]
  quantity_served integer, -- Quantidade de refeições servidas
  
  -- Responsável
  prepared_by uuid REFERENCES profiles(id),
  
  -- Observações
  observations text,
  
  -- Metadados
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meal_preparation_school ON meal_preparation(school_id, preparation_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_preparation_menu ON meal_preparation(meal_menu_id);

-- ============================================================================
-- PARTE 6: TABELA student_meal_attendance (Controle de Consumo)
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_meal_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Refeição
  meal_date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar')),
  
  -- Status
  consumed boolean DEFAULT true,
  quantity_served numeric(5,2), -- Quantidade servida (em porções)
  
  -- Observações
  observations text,
  
  -- Metadados
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_student_meal_attendance_student ON student_meal_attendance(student_id, meal_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_meal_attendance_school ON student_meal_attendance(school_id, meal_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_meal_attendance_date ON student_meal_attendance(meal_date, meal_type);

-- ============================================================================
-- PARTE 7: RPCs PARA GERENCIAR MERENDA
-- ============================================================================

-- 7.1. Criar cardápio
CREATE OR REPLACE FUNCTION create_meal_menu(
  p_school_id uuid,
  p_tenant_id uuid,
  p_period_start date,
  p_period_end date,
  p_meal_type text,
  p_daily_menus jsonb DEFAULT '[]'::jsonb,
  p_nutritional_info jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_menu_id uuid;
BEGIN
  INSERT INTO meal_menus (
    school_id,
    tenant_id,
    period_start,
    period_end,
    meal_type,
    daily_menus,
    nutritional_info,
    menu_data,
    created_by
  ) VALUES (
    p_school_id,
    p_tenant_id,
    p_period_start,
    p_period_end,
    p_meal_type,
    p_daily_menus,
    p_nutritional_info,
    jsonb_build_object('period_start', p_period_start, 'period_end', p_period_end),
    auth.uid()
  )
  RETURNING id INTO v_menu_id;
  
  RETURN v_menu_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2. Criar planejamento de compras
CREATE OR REPLACE FUNCTION create_meal_plan(
  p_school_id uuid,
  p_tenant_id uuid,
  p_period_start date,
  p_period_end date,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_total_estimated_cost numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_plan_id uuid;
BEGIN
  INSERT INTO meal_plans (
    school_id,
    tenant_id,
    period_start,
    period_end,
    items,
    total_estimated_cost,
    plan_data,
    created_by
  ) VALUES (
    p_school_id,
    p_tenant_id,
    p_period_start,
    p_period_end,
    p_items,
    p_total_estimated_cost,
    jsonb_build_object('period_start', p_period_start, 'period_end', p_period_end),
    auth.uid()
  )
  RETURNING id INTO v_plan_id;
  
  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.3. Registrar consumo de refeição
CREATE OR REPLACE FUNCTION record_meal_consumption(
  p_student_id uuid,
  p_school_id uuid,
  p_meal_date date,
  p_meal_type text,
  p_consumed boolean DEFAULT true,
  p_quantity_served numeric DEFAULT NULL,
  p_observations text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_attendance_id uuid;
BEGIN
  INSERT INTO student_meal_attendance (
    student_id,
    school_id,
    meal_date,
    meal_type,
    consumed,
    quantity_served,
    observations,
    recorded_by
  ) VALUES (
    p_student_id,
    p_school_id,
    p_meal_date,
    p_meal_type,
    p_consumed,
    p_quantity_served,
    p_observations,
    auth.uid()
  )
  RETURNING id INTO v_attendance_id;
  
  RETURN v_attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.4. Listar cardápios
CREATE OR REPLACE FUNCTION get_meal_menus(
  p_school_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_period_start date DEFAULT NULL,
  p_period_end date DEFAULT NULL,
  p_meal_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  school_id uuid,
  school_name text,
  period_start date,
  period_end date,
  meal_type text,
  daily_menus jsonb,
  nutritional_info jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mm.id,
    mm.school_id,
    sch.school_name,
    mm.period_start,
    mm.period_end,
    mm.meal_type,
    mm.daily_menus,
    mm.nutritional_info,
    mm.created_at
  FROM meal_menus mm
  LEFT JOIN schools sch ON sch.id = mm.school_id
  WHERE 
    (p_school_id IS NULL OR mm.school_id = p_school_id)
    AND (p_tenant_id IS NULL OR mm.tenant_id = p_tenant_id)
    AND (p_period_start IS NULL OR mm.period_start >= p_period_start)
    AND (p_period_end IS NULL OR mm.period_end <= p_period_end)
    AND (p_meal_type IS NULL OR mm.meal_type = p_meal_type)
  ORDER BY mm.period_start DESC, sch.school_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 8: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE meal_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_preparation ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_meal_attendance ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to meal_menus" ON meal_menus;
CREATE POLICY "Superadmin full access to meal_menus"
  ON meal_menus FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Usuários veem merenda da sua escola/rede
DROP POLICY IF EXISTS "Users can view meal menus in their scope" ON meal_menus;
CREATE POLICY "Users can view meal menus in their scope"
  ON meal_menus FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    OR tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage meal menus" ON meal_menus;
CREATE POLICY "School staff can manage meal menus"
  ON meal_menus FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Planejamentos: mesmas regras
DROP POLICY IF EXISTS "Users can view meal plans in their scope" ON meal_plans;
CREATE POLICY "Users can view meal plans in their scope"
  ON meal_plans FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    OR tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage meal plans" ON meal_plans;
CREATE POLICY "School staff can manage meal plans"
  ON meal_plans FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Fornecedores: secretário vê todos da rede
DROP POLICY IF EXISTS "Education secretary can view suppliers" ON meal_suppliers;
CREATE POLICY "Education secretary can view suppliers"
  ON meal_suppliers FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- Compras: mesmas regras de planejamentos
DROP POLICY IF EXISTS "Users can view purchases in their scope" ON meal_purchases;
CREATE POLICY "Users can view purchases in their scope"
  ON meal_purchases FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    OR tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- Preparo: mesmas regras
DROP POLICY IF EXISTS "Users can view preparation in their school" ON meal_preparation;
CREATE POLICY "Users can view preparation in their school"
  ON meal_preparation FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can record preparation" ON meal_preparation;
CREATE POLICY "School staff can record preparation"
  ON meal_preparation FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Consumo: mesmas regras
DROP POLICY IF EXISTS "Users can view meal attendance in their school" ON student_meal_attendance;
CREATE POLICY "Users can view meal attendance in their school"
  ON student_meal_attendance FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can record meal attendance" ON student_meal_attendance;
CREATE POLICY "School staff can record meal attendance"
  ON student_meal_attendance FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- PARTE 9: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de sistema de merenda escolar concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela meal_menus (cardápios)';
  RAISE NOTICE '  2. ✅ Criada tabela meal_plans (planejamento de compras)';
  RAISE NOTICE '  3. ✅ Criada tabela meal_suppliers (fornecedores)';
  RAISE NOTICE '  4. ✅ Criada tabela meal_purchases (compras)';
  RAISE NOTICE '  5. ✅ Criada tabela meal_preparation (registro de preparo)';
  RAISE NOTICE '  6. ✅ Criada tabela student_meal_attendance (controle de consumo)';
  RAISE NOTICE '  7. ✅ Criados RPCs para gerenciar merenda';
  RAISE NOTICE '  8. ✅ RLS policies aplicadas';
END $$;

