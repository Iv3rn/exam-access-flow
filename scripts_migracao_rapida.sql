-- ================================================
-- SCRIPTS PARA MIGRAÇÃO RÁPIDA DE DADOS
-- ================================================
-- Execute estes scripts APÓS criar os usuários no Authentication

-- ================================================
-- PASSO 1: SUBSTITUIR UUIDs
-- ================================================
-- Primeiro, crie os usuários no Authentication e anote os UUIDs gerados:
-- 
-- 1. pedrohrqq23@gmail.com (Admin) -> UUID: _______________________
-- 2. elaine@facene.com (Staff) -> UUID: _______________________
-- 3. sara@facene.com (Staff) -> UUID: _______________________
-- 4. priscila@facene.com (?) -> UUID: _______________________
-- 5. patient+70213172470@patients.local (Patient) -> UUID: _______________________

-- ================================================
-- PASSO 2: INSERIR ROLES
-- ================================================

-- Admin (Pedro Henrique)
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_ADMIN_AQUI', 'admin', true);

-- Staff (Elaine Almeida)
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_ELAINE_AQUI', 'staff', true);

-- Staff (Sara)
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_SARA_AQUI', 'staff', true);

-- Priscila (escolha a role: 'admin', 'staff' ou 'patient')
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_PRISCILA_AQUI', 'staff', true);

-- Patient (se não foi criado via edge function)
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_PACIENTE_AQUI', 'patient', true);

-- ================================================
-- PASSO 3: INSERIR PACIENTE (se não usou edge function)
-- ================================================

INSERT INTO public.patients (
  cpf,
  full_name,
  email,
  phone,
  user_id,
  created_by
) VALUES (
  '702.131.724-70',
  'PEDRO HENRIQUE FIGUEIREDO DE MIRANDA',
  'pedrohrqq23@gmail.com',
  '83988821831',
  'UUID_PACIENTE_AQUI',
  'UUID_ELAINE_AQUI'
);

-- ================================================
-- PASSO 4: VERIFICAR DADOS INSERIDOS
-- ================================================

-- Verificar usuários e roles
SELECT 
  u.email,
  u.raw_user_meta_data->>'full_name' as nome,
  ur.role,
  ur.active
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY ur.role, u.email;

-- Verificar pacientes
SELECT 
  p.full_name,
  p.cpf,
  p.email,
  p.phone,
  u.email as user_email,
  creator.email as created_by_email
FROM patients p
LEFT JOIN auth.users u ON p.user_id = u.id
LEFT JOIN auth.users creator ON p.created_by = creator.id;

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================

/*
1. ORDEM DE EXECUÇÃO:
   a) Criar usuários no Authentication (Dashboard ou via edge functions)
   b) Executar INSERTs de user_roles
   c) Executar INSERT de patients (se não usou edge function)
   d) Fazer re-upload de exames e relatórios via sistema

2. PARA ARQUIVOS:
   É MUITO mais fácil fazer re-upload via sistema do que migrar arquivos manualmente.
   Basta fazer login e fazer upload novamente.

3. EDGE FUNCTIONS DISPONÍVEIS:
   - create-staff: Para criar usuários staff
   - create-patient: Para criar usuários pacientes (já cria o paciente na tabela também)
   - patient-login: Para login de pacientes via CPF

4. AUTO-CONFIRM EMAIL:
   Não esqueça de habilitar auto-confirm email no Supabase para facilitar testes.

5. SENHAS:
   Defina senhas fortes para todos os usuários criados.
   Para pacientes, a senha deve ser comunicada de forma segura.
*/

-- ================================================
-- OPCIONAL: INSERIR EXAMES E RELATÓRIOS
-- ================================================
-- SOMENTE se você já migrou os arquivos para o storage manualmente

/*
-- Obter o ID do paciente
SELECT id FROM patients WHERE cpf = '702.131.724-70';
-- Anote o ID: _______________________

-- Inserir Exame
INSERT INTO public.exams (
  patient_id,
  exam_type,
  description,
  file_path,
  file_type,
  uploaded_by
) VALUES (
  'PATIENT_ID_AQUI',
  'Raio-X',
  'raio x',
  'PATIENT_ID_AQUI/1762530161961.jpeg',
  'image/jpeg',
  'UUID_ELAINE_AQUI'
);

-- Inserir Relatório
INSERT INTO public.reports (
  patient_id,
  title,
  description,
  file_path,
  file_type,
  uploaded_by
) VALUES (
  'PATIENT_ID_AQUI',
  'teste',
  'teste',
  'laudos/PATIENT_ID_AQUI/1762531084327.pdf',
  'application/pdf',
  'UUID_ELAINE_AQUI'
);
*/