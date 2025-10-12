-- Ensure profiles table has ON DELETE CASCADE for auth.users
-- This ensures when a user is deleted from auth.users, their profile is also deleted

-- First, check if the foreign key exists and drop it if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- Add the foreign key with ON DELETE CASCADE
-- This ensures LGPD compliance - when user is deleted from auth, all their data is removed
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;