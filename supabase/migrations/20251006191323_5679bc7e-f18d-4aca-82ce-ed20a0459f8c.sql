-- Add network information fields to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS network_address text,
ADD COLUMN IF NOT EXISTS network_email text,
ADD COLUMN IF NOT EXISTS network_phone text,
ADD COLUMN IF NOT EXISTS network_responsible text;