-- Allow patients to view their own data
CREATE POLICY "Patients can view own data"
ON public.patients
FOR SELECT
TO authenticated
USING (
  email = auth.jwt()->>'email'
  OR id IN (
    SELECT p.id FROM public.patients p
    WHERE p.email = auth.jwt()->>'email'
  )
);