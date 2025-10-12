-- Add phone and email fields to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text;