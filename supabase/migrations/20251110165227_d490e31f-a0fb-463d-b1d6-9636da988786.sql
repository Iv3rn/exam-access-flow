-- Criar tabela para tipos de exames
CREATE TABLE public.exam_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  active boolean NOT NULL DEFAULT true
);

-- Habilitar RLS
ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para exam_types
CREATE POLICY "Admins can insert exam types"
ON public.exam_types
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update exam types"
ON public.exam_types
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete exam types"
ON public.exam_types
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff and admins can view exam types"
ON public.exam_types
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Inserir tipos de exames padrão
INSERT INTO public.exam_types (name, created_by) 
SELECT 'Raio-X', id FROM auth.users WHERE email = 'admin@clinica.com'
UNION ALL
SELECT 'Tomografia', id FROM auth.users WHERE email = 'admin@clinica.com'
UNION ALL
SELECT 'Ressonância', id FROM auth.users WHERE email = 'admin@clinica.com'
UNION ALL
SELECT 'Ultrassom', id FROM auth.users WHERE email = 'admin@clinica.com'
UNION ALL
SELECT 'Exame de Sangue', id FROM auth.users WHERE email = 'admin@clinica.com'
UNION ALL
SELECT 'Laudo Médico', id FROM auth.users WHERE email = 'admin@clinica.com'
UNION ALL
SELECT 'Outro', id FROM auth.users WHERE email = 'admin@clinica.com';