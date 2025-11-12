-- Criar políticas RLS para o bucket exam-files

-- Staff e Admin podem fazer upload de arquivos
CREATE POLICY "Staff e Admin podem fazer upload de exames"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-files' AND
  (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Staff e Admin podem visualizar todos os arquivos
CREATE POLICY "Staff e Admin podem visualizar exames"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-files' AND
  (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Pacientes podem visualizar apenas seus próprios arquivos
CREATE POLICY "Pacientes podem visualizar seus exames"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-files' AND
  has_role(auth.uid(), 'patient'::app_role) AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patients WHERE user_id = auth.uid()
  )
);

-- Staff e Admin podem deletar arquivos
CREATE POLICY "Staff e Admin podem deletar exames"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-files' AND
  (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);