-- Criar tabela para configurações da clínica
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_name text,
  logo_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem visualizar configurações da clínica"
  ON public.clinic_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins podem inserir configurações"
  ON public.clinic_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar configurações"
  ON public.clinic_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_clinic_settings_updated_at
  BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para logos de clínicas (público para visualização)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-logos', 'clinic-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para logos
CREATE POLICY "Público pode visualizar logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'clinic-logos');

CREATE POLICY "Admins podem fazer upload de logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'clinic-logos' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins podem atualizar logos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'clinic-logos' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins podem deletar logos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'clinic-logos' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Inserir configuração padrão se não existir
INSERT INTO public.clinic_settings (clinic_name)
SELECT 'Clínica'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_settings);