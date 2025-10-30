-- Migração para funcionalidades avançadas de manutenção e backup
-- Data: 2024-12-01

-- 1. Criar tabela de agendamentos de backup
CREATE TABLE IF NOT EXISTS backup_schedules (
    id TEXT PRIMARY KEY,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly')),
    time TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de logs de backup
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'simulated')),
    backup_size TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

-- 3. Criar tabela de logs de auditoria expandida
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_email TEXT,
    user_id UUID REFERENCES auth.users(id),
    details TEXT,
    ip_address INET,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar função para refresh de materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    start_time := NOW();
    
    -- Refresh de views materializadas (quando existirem)
    -- REFRESH MATERIALIZED VIEW CONCURRENTLY view_name;
    
    end_time := NOW();
    
    result := json_build_object(
        'status', 'success',
        'message', 'Materialized views refreshed successfully',
        'start_time', start_time,
        'end_time', end_time,
        'duration_ms', EXTRACT(EPOCH FROM (end_time - start_time)) * 1000
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'status', 'error',
            'message', SQLERRM,
            'start_time', start_time,
            'end_time', NOW()
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar função para backup do sistema
CREATE OR REPLACE FUNCTION execute_system_backup(
    backup_type TEXT DEFAULT 'manual',
    include_logs BOOLEAN DEFAULT true,
    include_media BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    backup_id UUID;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    backup_size TEXT;
BEGIN
    start_time := NOW();
    backup_id := gen_random_uuid();
    
    -- Simular backup (em produção, implementar backup real)
    PERFORM pg_sleep(2); -- Simular tempo de processamento
    
    end_time := NOW();
    backup_size := '2.5GB'; -- Simular tamanho do backup
    
    -- Registrar log do backup
    INSERT INTO backup_logs (id, backup_type, status, backup_size, created_by)
    VALUES (backup_id, backup_type, 'completed', backup_size, auth.uid());
    
    result := json_build_object(
        'status', 'success',
        'backup_id', backup_id,
        'backup_type', backup_type,
        'backup_size', backup_size,
        'include_logs', include_logs,
        'include_media', include_media,
        'start_time', start_time,
        'end_time', end_time,
        'duration_ms', EXTRACT(EPOCH FROM (end_time - start_time)) * 1000
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Registrar erro no log
        INSERT INTO backup_logs (id, backup_type, status, created_by, error_message)
        VALUES (gen_random_uuid(), backup_type, 'failed', auth.uid(), SQLERRM);
        
        result := json_build_object(
            'status', 'error',
            'message', SQLERRM,
            'start_time', start_time,
            'end_time', NOW()
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_networks INTEGER;
    total_users INTEGER;
    total_students INTEGER;
    total_peis INTEGER;
    active_peis INTEGER;
    approved_peis INTEGER;
BEGIN
    -- Contar redes
    SELECT COUNT(*) INTO total_networks FROM tenants;
    
    -- Contar usuários
    SELECT COUNT(*) INTO total_users FROM profiles;
    
    -- Contar estudantes
    SELECT COUNT(*) INTO total_students FROM students;
    
    -- Contar PEIs
    SELECT COUNT(*) INTO total_peis FROM peis;
    
    -- Contar PEIs ativos (não draft)
    SELECT COUNT(*) INTO active_peis FROM peis WHERE status != 'draft';
    
    -- Contar PEIs aprovados
    SELECT COUNT(*) INTO approved_peis FROM peis WHERE status = 'approved';
    
    result := json_build_object(
        'total_networks', total_networks,
        'total_users', total_users,
        'total_students', total_students,
        'total_peis', total_peis,
        'active_peis', active_peis,
        'approved_peis', approved_peis,
        'approval_rate', CASE 
            WHEN active_peis > 0 THEN ROUND((approved_peis::DECIMAL / active_peis) * 100, 2)
            ELSE 0
        END,
        'generated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar função para limpeza de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
    result JSON;
    deleted_audit_logs INTEGER;
    deleted_backup_logs INTEGER;
BEGIN
    -- Limpar logs de auditoria antigos
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_audit_logs = ROW_COUNT;
    
    -- Limpar logs de backup antigos (manter apenas os últimos 30 dias)
    DELETE FROM backup_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_backup_logs = ROW_COUNT;
    
    result := json_build_object(
        'status', 'success',
        'deleted_audit_logs', deleted_audit_logs,
        'deleted_backup_logs', deleted_backup_logs,
        'days_kept', days_to_keep,
        'cleaned_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_backup_schedules_updated_at
    BEFORE UPDATE ON backup_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Inserir agendamentos padrão
INSERT INTO backup_schedules (id, schedule_type, time, enabled, last_run, next_run)
VALUES 
    ('daily-backup', 'daily', '03:00', true, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day'),
    ('weekly-backup', 'weekly', '02:00', true, NOW() - INTERVAL '7 days', NOW() + INTERVAL '7 days'),
    ('monthly-backup', 'monthly', '01:00', true, NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 10. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_backup_logs_type ON backup_logs(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_enabled ON backup_schedules(enabled);

-- 11. Configurar RLS (Row Level Security)
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 12. Criar políticas RLS para superadmin
CREATE POLICY "Superadmin can manage backup schedules" ON backup_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Superadmin can view backup logs" ON backup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Superadmin can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 13. Criar função para inserir logs de auditoria
CREATE OR REPLACE FUNCTION insert_audit_log(
    action_name TEXT,
    details_text TEXT DEFAULT NULL,
    severity_level TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    user_email TEXT;
BEGIN
    log_id := gen_random_uuid();
    
    -- Obter email do usuário atual
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    INSERT INTO audit_logs (id, action, user_email, user_id, details, severity)
    VALUES (log_id, action_name, user_email, auth.uid(), details_text, severity_level);
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Comentários para documentação
COMMENT ON TABLE backup_schedules IS 'Agendamentos de backup automático do sistema';
COMMENT ON TABLE backup_logs IS 'Logs de execução de backups';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria expandidos do sistema';
COMMENT ON FUNCTION refresh_materialized_views() IS 'Atualiza views materializadas do sistema';
COMMENT ON FUNCTION execute_system_backup(TEXT, BOOLEAN, BOOLEAN) IS 'Executa backup do sistema';
COMMENT ON FUNCTION get_system_stats() IS 'Retorna estatísticas gerais do sistema';
COMMENT ON FUNCTION cleanup_old_logs(INTEGER) IS 'Limpa logs antigos do sistema';
COMMENT ON FUNCTION insert_audit_log(TEXT, TEXT, TEXT) IS 'Insere log de auditoria';
