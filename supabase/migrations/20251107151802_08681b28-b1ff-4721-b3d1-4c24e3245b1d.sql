-- 1) Add user_id to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);

-- 2) Patients can view their own record (non-recursive)
DROP POLICY IF EXISTS "Patients can view own data" ON public.patients;
CREATE POLICY "Patients can view own record"
ON public.patients
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3) Update exams policy to bind access to patient's user_id
DROP POLICY IF EXISTS "Patients can view own exams" ON public.exams;
CREATE POLICY "Patients can view own exams"
ON public.exams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = exams.patient_id AND p.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'patient'::app_role)
);
