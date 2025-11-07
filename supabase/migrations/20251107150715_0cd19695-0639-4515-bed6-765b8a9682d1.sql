-- Allow patients to view their own exams
CREATE POLICY "Patients can view own exams"
ON public.exams
FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM public.patients WHERE email = auth.jwt()->>'email'
  )
  OR has_role(auth.uid(), 'patient'::app_role)
);