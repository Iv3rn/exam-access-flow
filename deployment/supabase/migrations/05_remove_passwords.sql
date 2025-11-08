-- Remove password column if it exists (legacy cleanup)
ALTER TABLE IF EXISTS public.patients DROP COLUMN IF EXISTS password;

-- Ensure user_id column exists and is properly configured
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;
