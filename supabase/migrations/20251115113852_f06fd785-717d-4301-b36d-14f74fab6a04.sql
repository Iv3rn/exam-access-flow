-- Criar tabela de logs de atividades
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- Habilitar RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem visualizar todos os logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados podem criar logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE public.activity_logs IS 'Registro de atividades do sistema';
COMMENT ON COLUMN public.activity_logs.action IS 'Ação realizada (create, update, delete, upload)';
COMMENT ON COLUMN public.activity_logs.entity_type IS 'Tipo de entidade (patient, exam, report)';
COMMENT ON COLUMN public.activity_logs.entity_id IS 'ID da entidade afetada';
COMMENT ON COLUMN public.activity_logs.details IS 'Detalhes adicionais da ação em formato JSON';