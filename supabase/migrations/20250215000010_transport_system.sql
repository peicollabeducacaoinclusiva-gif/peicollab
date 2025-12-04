-- ============================================================================
-- MIGRAÇÃO: Sistema de Transporte Escolar
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabelas de transporte escolar
--   2. Criar RPCs para gerenciar transporte
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA school_transport (Transporte Escolar)
-- ============================================================================

CREATE TABLE IF NOT EXISTS school_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Veículo
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('onibus', 'van', 'microonibus', 'outro')),
  license_plate text NOT NULL,
  vehicle_model text,
  vehicle_year integer,
  capacity integer NOT NULL,
  
  -- Motorista
  driver_id uuid REFERENCES professionals(id) ON DELETE SET NULL,
  driver_name text,
  driver_license text,
  driver_phone text,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_school_transport_school ON school_transport(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_school_transport_tenant ON school_transport(tenant_id);
CREATE INDEX IF NOT EXISTS idx_school_transport_driver ON school_transport(driver_id);

-- ============================================================================
-- PARTE 2: TABELA transport_routes (Rotas de Transporte)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  route_name text NOT NULL,
  route_code text,
  
  -- Rota
  route_data jsonb DEFAULT '{}'::jsonb, -- {stops: [...], coordinates: [...], distance_km: ...}
  stops jsonb DEFAULT '[]'::jsonb, -- [{name, address, coordinates, order, time}]
  
  -- Horários
  morning_departure_time time,
  morning_arrival_time time,
  afternoon_departure_time time,
  afternoon_arrival_time time,
  
  -- Veículo
  vehicle_id uuid REFERENCES school_transport(id) ON DELETE SET NULL,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transport_routes_school ON transport_routes(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_transport_routes_vehicle ON transport_routes(vehicle_id);

-- ============================================================================
-- PARTE 3: TABELA student_transport (Vínculo Aluno-Rota)
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
  academic_year integer NOT NULL,
  
  -- Detalhes
  boarding_stop text, -- Nome da parada de embarque
  disembarkation_stop text, -- Nome da parada de desembarque
  shift text CHECK (shift IN ('manha', 'tarde', 'integral')),
  
  -- Status
  is_active boolean DEFAULT true,
  start_date date,
  end_date date,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_student_transport_student ON student_transport(student_id, academic_year, is_active);
CREATE INDEX IF NOT EXISTS idx_student_transport_route ON student_transport(route_id, is_active);

-- ============================================================================
-- PARTE 4: TABELA transport_attendance (Controle de Acesso)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transport_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES school_transport(id),
  
  -- Data e horário
  attendance_date date NOT NULL,
  attendance_time time NOT NULL,
  attendance_type text NOT NULL CHECK (attendance_type IN ('boarding', 'disembarkation')),
  
  -- Localização (opcional)
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  
  -- Método de verificação
  verification_method text CHECK (verification_method IN ('qr_code', 'biometric', 'manual', 'rfid')),
  verification_code text, -- Código QR ou RFID
  
  -- Status
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  
  -- Metadados
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transport_attendance_student ON transport_attendance(student_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_transport_attendance_route ON transport_attendance(route_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_transport_attendance_date ON transport_attendance(attendance_date, attendance_type);

-- ============================================================================
-- PARTE 5: RPCs PARA GERENCIAR TRANSPORTE
-- ============================================================================

-- 5.1. Criar veículo
CREATE OR REPLACE FUNCTION create_school_transport(
  p_school_id uuid,
  p_tenant_id uuid,
  p_vehicle_type text,
  p_license_plate text,
  p_capacity integer,
  p_vehicle_model text DEFAULT NULL,
  p_vehicle_year integer DEFAULT NULL,
  p_driver_id uuid DEFAULT NULL,
  p_driver_name text DEFAULT NULL,
  p_driver_license text DEFAULT NULL,
  p_driver_phone text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_transport_id uuid;
BEGIN
  INSERT INTO school_transport (
    school_id,
    tenant_id,
    vehicle_type,
    license_plate,
    capacity,
    vehicle_model,
    vehicle_year,
    driver_id,
    driver_name,
    driver_license,
    driver_phone
  ) VALUES (
    p_school_id,
    p_tenant_id,
    p_vehicle_type,
    p_license_plate,
    p_capacity,
    p_vehicle_model,
    p_vehicle_year,
    p_driver_id,
    p_driver_name,
    p_driver_license,
    p_driver_phone
  )
  RETURNING id INTO v_transport_id;
  
  RETURN v_transport_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2. Criar rota
CREATE OR REPLACE FUNCTION create_transport_route(
  p_school_id uuid,
  p_route_name text,
  p_route_code text DEFAULT NULL,
  p_stops jsonb DEFAULT '[]'::jsonb,
  p_morning_departure_time time DEFAULT NULL,
  p_morning_arrival_time time DEFAULT NULL,
  p_afternoon_departure_time time DEFAULT NULL,
  p_afternoon_arrival_time time DEFAULT NULL,
  p_vehicle_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_route_id uuid;
BEGIN
  INSERT INTO transport_routes (
    school_id,
    route_name,
    route_code,
    stops,
    morning_departure_time,
    morning_arrival_time,
    afternoon_departure_time,
    afternoon_arrival_time,
    vehicle_id
  ) VALUES (
    p_school_id,
    p_route_name,
    p_route_code,
    p_stops,
    p_morning_departure_time,
    p_morning_arrival_time,
    p_afternoon_departure_time,
    p_afternoon_arrival_time,
    p_vehicle_id
  )
  RETURNING id INTO v_route_id;
  
  RETURN v_route_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3. Vincular aluno à rota
CREATE OR REPLACE FUNCTION assign_student_to_route(
  p_student_id uuid,
  p_route_id uuid,
  p_academic_year integer,
  p_boarding_stop text DEFAULT NULL,
  p_disembarkation_stop text DEFAULT NULL,
  p_shift text DEFAULT NULL,
  p_start_date date DEFAULT CURRENT_DATE
)
RETURNS uuid AS $$
DECLARE
  v_assignment_id uuid;
BEGIN
  INSERT INTO student_transport (
    student_id,
    route_id,
    academic_year,
    boarding_stop,
    disembarkation_stop,
    shift,
    start_date
  ) VALUES (
    p_student_id,
    p_route_id,
    p_academic_year,
    p_boarding_stop,
    p_disembarkation_stop,
    p_shift,
    p_start_date
  )
  RETURNING id INTO v_assignment_id;
  
  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4. Registrar presença no transporte
CREATE OR REPLACE FUNCTION record_transport_attendance(
  p_student_id uuid,
  p_route_id uuid,
  p_attendance_date date,
  p_attendance_time time,
  p_attendance_type text,
  p_vehicle_id uuid DEFAULT NULL,
  p_verification_method text DEFAULT 'manual',
  p_verification_code text DEFAULT NULL,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_attendance_id uuid;
BEGIN
  INSERT INTO transport_attendance (
    student_id,
    route_id,
    vehicle_id,
    attendance_date,
    attendance_time,
    attendance_type,
    verification_method,
    verification_code,
    latitude,
    longitude,
    recorded_by
  ) VALUES (
    p_student_id,
    p_route_id,
    p_vehicle_id,
    p_attendance_date,
    p_attendance_time,
    p_attendance_type,
    p_verification_method,
    p_verification_code,
    p_latitude,
    p_longitude,
    auth.uid()
  )
  RETURNING id INTO v_attendance_id;
  
  RETURN v_attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5. Listar rotas da escola
CREATE OR REPLACE FUNCTION get_transport_routes(
  p_school_id uuid,
  p_is_active boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  route_name text,
  route_code text,
  stops jsonb,
  morning_departure_time time,
  morning_arrival_time time,
  afternoon_departure_time time,
  afternoon_arrival_time time,
  vehicle_id uuid,
  vehicle_license_plate text,
  student_count bigint,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.route_name,
    tr.route_code,
    tr.stops,
    tr.morning_departure_time,
    tr.morning_arrival_time,
    tr.afternoon_departure_time,
    tr.afternoon_arrival_time,
    tr.vehicle_id,
    st.license_plate as vehicle_license_plate,
    COUNT(DISTINCT st_trans.student_id) as student_count,
    tr.is_active
  FROM transport_routes tr
  LEFT JOIN school_transport st ON st.id = tr.vehicle_id
  LEFT JOIN student_transport st_trans ON st_trans.route_id = tr.id AND st_trans.is_active = true
  WHERE tr.school_id = p_school_id
  AND (p_is_active IS NULL OR tr.is_active = p_is_active)
  GROUP BY tr.id, st.license_plate
  ORDER BY tr.route_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 6: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE school_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_attendance ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to school_transport" ON school_transport;
CREATE POLICY "Superadmin full access to school_transport"
  ON school_transport FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Usuários veem transporte da sua escola
DROP POLICY IF EXISTS "Users can view transport in their school" ON school_transport;
CREATE POLICY "Users can view transport in their school"
  ON school_transport FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage transport" ON school_transport;
CREATE POLICY "School staff can manage transport"
  ON school_transport FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Rotas: mesmas regras
DROP POLICY IF EXISTS "Users can view routes in their school" ON transport_routes;
CREATE POLICY "Users can view routes in their school"
  ON transport_routes FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage routes" ON transport_routes;
CREATE POLICY "School staff can manage routes"
  ON transport_routes FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Vínculos aluno-rota: mesmas regras
DROP POLICY IF EXISTS "Users can view student transport in their school" ON student_transport;
CREATE POLICY "Users can view student transport in their school"
  ON student_transport FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN profiles p ON p.school_id = s.school_id
      WHERE p.id = auth.uid()
    )
  );

-- Presença: mesmas regras
DROP POLICY IF EXISTS "Users can view transport attendance in their school" ON transport_attendance;
CREATE POLICY "Users can view transport attendance in their school"
  ON transport_attendance FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN profiles p ON p.school_id = s.school_id
      WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can record transport attendance" ON transport_attendance;
CREATE POLICY "School staff can record transport attendance"
  ON transport_attendance FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN profiles p ON p.school_id = s.school_id
      WHERE p.id = auth.uid()
    )
  );

-- ============================================================================
-- PARTE 7: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de sistema de transporte escolar concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela school_transport (veículos)';
  RAISE NOTICE '  2. ✅ Criada tabela transport_routes (rotas)';
  RAISE NOTICE '  3. ✅ Criada tabela student_transport (vínculo aluno-rota)';
  RAISE NOTICE '  4. ✅ Criada tabela transport_attendance (controle de acesso)';
  RAISE NOTICE '  5. ✅ Criados RPCs para gerenciar transporte';
  RAISE NOTICE '  6. ✅ RLS policies aplicadas';
END $$;

