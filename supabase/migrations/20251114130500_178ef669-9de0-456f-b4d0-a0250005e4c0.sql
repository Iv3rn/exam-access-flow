-- Adicionar coluna gender (sexo) na tabela patients
ALTER TABLE public.patients 
ADD COLUMN gender text CHECK (gender IN ('M', 'F'));

COMMENT ON COLUMN public.patients.gender IS 'Sexo do paciente: M (Masculino) ou F (Feminino)';