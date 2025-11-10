-- Drop existing SELECT policies on patients table
DROP POLICY IF EXISTS "Patients can view own record" ON public.patients;
DROP POLICY IF EXISTS "Staff can view all patients" ON public.patients;

-- Create improved SELECT policies with proper authentication and role checks
CREATE POLICY "Authenticated patients can view own record"
ON public.patients
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  AND has_role(auth.uid(), 'patient'::app_role)
);

CREATE POLICY "Authenticated staff can view all patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'staff'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure other policies also require authentication
DROP POLICY IF EXISTS "Staff can create patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can update patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can delete patients" ON public.patients;

CREATE POLICY "Authenticated staff can create patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'staff'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated staff can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'staff'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated admins can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);