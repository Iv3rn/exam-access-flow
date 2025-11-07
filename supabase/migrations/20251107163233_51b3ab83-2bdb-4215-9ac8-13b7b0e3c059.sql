-- Remove password fields from patients table for security
ALTER TABLE public.patients 
DROP COLUMN IF EXISTS temporary_password,
DROP COLUMN IF EXISTS fixed_password;