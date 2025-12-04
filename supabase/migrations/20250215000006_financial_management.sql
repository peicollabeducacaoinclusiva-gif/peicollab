-- ============================================================================
-- MIGRAÇÃO: Gestão Financeira Básica
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabela budgets (Orçamentos)
--   2. Criar tabela financial_transactions (Transações Financeiras)
--   3. Criar tabela financial_reports (Relatórios Financeiros)
--   4. Criar RPCs para gerenciar finanças
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA budgets (Orçamentos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  academic_year integer NOT NULL,
  
  -- Categoria
  category text NOT NULL CHECK (category IN (
    'merenda', 'transporte', 'manutencao', 'material_didatico', 
    'recursos_humanos', 'infraestrutura', 'tecnologia', 'outros'
  )),
  
  -- Valores
  allocated_amount numeric(15,2) NOT NULL DEFAULT 0,
  spent_amount numeric(15,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(15,2) GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
  
  -- Metadados
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_budgets_tenant ON budgets(tenant_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_budgets_school ON budgets(school_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category, academic_year);
CREATE INDEX IF NOT EXISTS idx_budgets_academic_year ON budgets(academic_year);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS budgets_updated_at_trigger ON budgets;
CREATE TRIGGER budgets_updated_at_trigger
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

-- Trigger para atualizar spent_amount quando transações são criadas/atualizadas
CREATE OR REPLACE FUNCTION update_budget_spent_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.transaction_type = 'despesa' AND NEW.budget_id IS NOT NULL THEN
      UPDATE budgets
      SET spent_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM financial_transactions
        WHERE budget_id = NEW.budget_id
        AND transaction_type = 'despesa'
        AND status = 'aprovada'
      )
      WHERE id = NEW.budget_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.transaction_type = 'despesa' AND OLD.budget_id IS NOT NULL THEN
      UPDATE budgets
      SET spent_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM financial_transactions
        WHERE budget_id = OLD.budget_id
        AND transaction_type = 'despesa'
        AND status = 'aprovada'
      )
      WHERE id = OLD.budget_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE budgets IS 
  'Orçamentos por categoria para escolas e redes. Permite controle de alocação e gastos.';

-- ============================================================================
-- PARTE 2: TABELA financial_transactions (Transações Financeiras)
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  budget_id uuid REFERENCES budgets(id) ON DELETE SET NULL,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Tipo e categoria
  transaction_type text NOT NULL CHECK (transaction_type IN ('receita', 'despesa')),
  category text NOT NULL,
  description text NOT NULL,
  
  -- Valores
  amount numeric(15,2) NOT NULL,
  
  -- Data e aprovação
  transaction_date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'cancelada')),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  
  -- Documentos
  document_url text,
  document_type text, -- 'nota_fiscal', 'recibo', 'contrato', 'outro'
  
  -- Metadados
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_financial_transactions_budget ON financial_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_school ON financial_transactions(school_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant ON financial_transactions(tenant_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_financial_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS financial_transactions_updated_at_trigger ON financial_transactions;
CREATE TRIGGER financial_transactions_updated_at_trigger
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_transactions_updated_at();

-- Trigger para atualizar spent_amount do budget
DROP TRIGGER IF EXISTS financial_transactions_budget_trigger ON financial_transactions;
CREATE TRIGGER financial_transactions_budget_trigger
  AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_spent_amount();

-- Comentários
COMMENT ON TABLE financial_transactions IS 
  'Transações financeiras (receitas e despesas) das escolas e redes.';

-- ============================================================================
-- PARTE 3: TABELA financial_reports (Relatórios Financeiros)
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('mensal', 'trimestral', 'semestral', 'anual', 'personalizado')),
  
  -- Período
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Dados do relatório
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- Estrutura completa do relatório
  
  -- Geração
  pdf_url text,
  generated_at timestamptz DEFAULT now(),
  generated_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_financial_reports_school ON financial_reports(school_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_financial_reports_tenant ON financial_reports(tenant_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON financial_reports(report_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_financial_reports_period ON financial_reports(period_start, period_end);

-- Comentários
COMMENT ON TABLE financial_reports IS 
  'Relatórios financeiros gerados para prestação de contas e análise gerencial.';

COMMENT ON COLUMN financial_reports.report_data IS 
  'Estrutura completa do relatório: {summary: {...}, transactions: [...], budgets: [...], charts: {...}}';

-- ============================================================================
-- PARTE 4: RPCs PARA GERENCIAR FINANÇAS
-- ============================================================================

-- 4.1. Criar orçamento
CREATE OR REPLACE FUNCTION create_budget(
  p_tenant_id uuid,
  p_school_id uuid DEFAULT NULL,
  p_academic_year integer,
  p_category text,
  p_allocated_amount numeric,
  p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_budget_id uuid;
BEGIN
  INSERT INTO budgets (
    tenant_id,
    school_id,
    academic_year,
    category,
    allocated_amount,
    description,
    created_by
  ) VALUES (
    p_tenant_id,
    p_school_id,
    p_academic_year,
    p_category,
    p_allocated_amount,
    p_description,
    auth.uid()
  )
  RETURNING id INTO v_budget_id;
  
  RETURN v_budget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2. Criar transação financeira
CREATE OR REPLACE FUNCTION create_financial_transaction(
  p_budget_id uuid DEFAULT NULL,
  p_school_id uuid,
  p_tenant_id uuid,
  p_transaction_type text,
  p_category text,
  p_description text,
  p_amount numeric,
  p_transaction_date date,
  p_document_url text DEFAULT NULL,
  p_document_type text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_transaction_id uuid;
BEGIN
  INSERT INTO financial_transactions (
    budget_id,
    school_id,
    tenant_id,
    transaction_type,
    category,
    description,
    amount,
    transaction_date,
    document_url,
    document_type,
    notes,
    created_by
  ) VALUES (
    p_budget_id,
    p_school_id,
    p_tenant_id,
    p_transaction_type,
    p_category,
    p_description,
    p_amount,
    p_transaction_date,
    p_document_url,
    p_document_type,
    p_notes,
    auth.uid()
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3. Aprovar transação
CREATE OR REPLACE FUNCTION approve_financial_transaction(
  p_transaction_id uuid,
  p_approved_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE financial_transactions
  SET 
    status = 'aprovada',
    approved_by = COALESCE(p_approved_by, auth.uid()),
    approved_at = NOW()
  WHERE id = p_transaction_id
  AND status = 'pendente';
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.4. Listar transações
CREATE OR REPLACE FUNCTION get_financial_transactions(
  p_school_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_transaction_type text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_date_start date DEFAULT NULL,
  p_date_end date DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  budget_id uuid,
  budget_category text,
  school_id uuid,
  school_name text,
  transaction_type text,
  category text,
  description text,
  amount numeric,
  transaction_date date,
  status text,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  document_url text,
  document_type text,
  notes text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.id,
    ft.budget_id,
    b.category as budget_category,
    ft.school_id,
    sch.school_name,
    ft.transaction_type,
    ft.category,
    ft.description,
    ft.amount,
    ft.transaction_date,
    ft.status,
    ft.approved_by,
    approver.full_name as approved_by_name,
    ft.approved_at,
    ft.document_url,
    ft.document_type,
    ft.notes,
    ft.created_at
  FROM financial_transactions ft
  LEFT JOIN budgets b ON b.id = ft.budget_id
  LEFT JOIN schools sch ON sch.id = ft.school_id
  LEFT JOIN profiles approver ON approver.id = ft.approved_by
  WHERE 
    (p_school_id IS NULL OR ft.school_id = p_school_id)
    AND (p_tenant_id IS NULL OR ft.tenant_id = p_tenant_id)
    AND (p_transaction_type IS NULL OR ft.transaction_type = p_transaction_type)
    AND (p_category IS NULL OR ft.category = p_category)
    AND (p_status IS NULL OR ft.status = p_status)
    AND (p_date_start IS NULL OR ft.transaction_date >= p_date_start)
    AND (p_date_end IS NULL OR ft.transaction_date <= p_date_end)
  ORDER BY ft.transaction_date DESC, ft.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4.5. Obter resumo financeiro
CREATE OR REPLACE FUNCTION get_financial_summary(
  p_school_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_academic_year integer DEFAULT NULL,
  p_date_start date DEFAULT NULL,
  p_date_end date DEFAULT NULL
)
RETURNS TABLE (
  total_revenue numeric,
  total_expenses numeric,
  balance numeric,
  budget_allocated numeric,
  budget_spent numeric,
  budget_remaining numeric
) AS $$
DECLARE
  v_academic_year integer;
BEGIN
  IF p_academic_year IS NULL THEN
    SELECT EXTRACT(YEAR FROM CURRENT_DATE)::integer INTO v_academic_year;
  ELSE
    v_academic_year := p_academic_year;
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'receita' AND status = 'aprovada'), 0) as total_revenue,
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'despesa' AND status = 'aprovada'), 0) as total_expenses,
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'receita' AND status = 'aprovada'), 0) - 
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'despesa' AND status = 'aprovada'), 0) as balance,
    COALESCE(SUM(allocated_amount), 0) as budget_allocated,
    COALESCE(SUM(spent_amount), 0) as budget_spent,
    COALESCE(SUM(remaining_amount), 0) as budget_remaining
  FROM financial_transactions ft
  LEFT JOIN budgets b ON b.school_id = ft.school_id AND b.tenant_id = ft.tenant_id AND b.academic_year = v_academic_year
  WHERE 
    (p_school_id IS NULL OR ft.school_id = p_school_id)
    AND (p_tenant_id IS NULL OR ft.tenant_id = p_tenant_id)
    AND (p_date_start IS NULL OR ft.transaction_date >= p_date_start)
    AND (p_date_end IS NULL OR ft.transaction_date <= p_date_end);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 5: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to budgets" ON budgets;
CREATE POLICY "Superadmin full access to budgets"
  ON budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Secretário de educação vê orçamentos da rede
DROP POLICY IF EXISTS "Education secretary can view network budgets" ON budgets;
CREATE POLICY "Education secretary can view network budgets"
  ON budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND ur.role = 'education_secretary'
      AND p.tenant_id = budgets.tenant_id
    )
  );

-- Diretores e gestores veem orçamentos da escola
DROP POLICY IF EXISTS "School staff can view school budgets" ON budgets;
CREATE POLICY "School staff can view school budgets"
  ON budgets FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage school budgets" ON budgets;
CREATE POLICY "School staff can manage school budgets"
  ON budgets FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('school_director', 'school_manager', 'coordinator')
    )
  );

-- Transações: mesmas regras de orçamentos
DROP POLICY IF EXISTS "Superadmin full access to financial_transactions" ON financial_transactions;
CREATE POLICY "Superadmin full access to financial_transactions"
  ON financial_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Education secretary can view network transactions" ON financial_transactions;
CREATE POLICY "Education secretary can view network transactions"
  ON financial_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND ur.role = 'education_secretary'
      AND p.tenant_id = financial_transactions.tenant_id
    )
  );

DROP POLICY IF EXISTS "School staff can view school transactions" ON financial_transactions;
CREATE POLICY "School staff can view school transactions"
  ON financial_transactions FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can create school transactions" ON financial_transactions;
CREATE POLICY "School staff can create school transactions"
  ON financial_transactions FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School directors can approve transactions" ON financial_transactions;
CREATE POLICY "School directors can approve transactions"
  ON financial_transactions FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('school_director', 'school_manager')
    )
  );

-- Relatórios: mesmas regras
DROP POLICY IF EXISTS "Superadmin full access to financial_reports" ON financial_reports;
CREATE POLICY "Superadmin full access to financial_reports"
  ON financial_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Users can view reports in their scope" ON financial_reports;
CREATE POLICY "Users can view reports in their scope"
  ON financial_reports FOR SELECT
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

-- ============================================================================
-- PARTE 6: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de gestão financeira básica concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela budgets (orçamentos)';
  RAISE NOTICE '  2. ✅ Criada tabela financial_transactions (transações)';
  RAISE NOTICE '  3. ✅ Criada tabela financial_reports (relatórios)';
  RAISE NOTICE '  4. ✅ Criados RPCs para gerenciar finanças';
  RAISE NOTICE '  5. ✅ Triggers para atualização automática de orçamentos';
  RAISE NOTICE '  6. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface no app Gestão Escolar (/finance)';
  RAISE NOTICE '  - Implementar geração de relatórios PDF';
  RAISE NOTICE '  - Adicionar gráficos e dashboards financeiros';
END $$;

