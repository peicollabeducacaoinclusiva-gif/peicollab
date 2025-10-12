-- Limpar tentativas bloqueadas do rate limit
DELETE FROM pei_access_attempts WHERE ip_address = 'web-app';

-- Adicionar índice para melhor performance na limpeza automática
CREATE INDEX IF NOT EXISTS idx_access_attempts_timestamp 
ON pei_access_attempts(attempted_at);