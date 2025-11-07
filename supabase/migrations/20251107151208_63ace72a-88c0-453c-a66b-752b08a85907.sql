-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Patients can view own data" ON public.patients;

-- Create security definer function to check if user is patient
CREATE OR REPLACE FUNCTION public.is_patient_with_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patients
    WHERE email = _email
  )
$$;

-- Create non-recursive policy for patients
CREATE POLICY "Patients can view own data"
ON public.patients
FOR SELECT
TO authenticated
USING (
  email = auth.jwt()->>'email'
  OR is_patient_with_email(auth.jwt()->>'email')
);