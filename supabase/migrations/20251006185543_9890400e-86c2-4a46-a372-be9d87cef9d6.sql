-- Add network_name column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS network_name TEXT;

-- Update existing tenants to have a default network name
UPDATE tenants 
SET network_name = 'Rede Municipal de Ensino'
WHERE network_name IS NULL;