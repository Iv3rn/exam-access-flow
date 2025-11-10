-- Drop the public access policy
DROP POLICY IF EXISTS "Todos podem visualizar configurações da clínica" ON public.clinic_settings;

-- Create new policy that requires authentication
CREATE POLICY "Usuários autenticados podem visualizar configurações da clínica"
ON public.clinic_settings
FOR SELECT
TO authenticated
USING (true);