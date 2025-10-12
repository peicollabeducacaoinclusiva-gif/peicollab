-- Add is_active column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active by default
UPDATE public.tenants SET is_active = true WHERE is_active IS NULL;
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;