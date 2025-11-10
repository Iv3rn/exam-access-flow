-- ================================================
-- DADOS PARA INSERIR APÓS CRIAR USUÁRIOS NO AUTH
-- ================================================

-- IMPORTANTE: Primeiro crie os usuários no Authentication do Supabase Dashboard
-- Depois substitua os UUIDs abaixo pelos IDs reais gerados

-- ============================================
-- USUÁRIOS A CRIAR NO DASHBOARD DO SUPABASE
-- ============================================

-- 1. ADMIN
-- Email: pedrohrqq23@gmail.com
-- Full Name: Pedro Henrique
-- Após criar, copie o UUID gerado e use no INSERT abaixo

-- 2. STAFF  
-- Email: elaine@facene.com
-- Full Name: Elaine Almeida
-- Após criar, copie o UUID gerado e use no INSERT abaixo

-- 3. PACIENTE
-- Email: patient+70213172470@patients.local
-- Full Name: PEDRO HENRIQUE FIGUEIREDO DE MIRANDA
-- Após criar, copie o UUID gerado e use no INSERT abaixo

-- ============================================
-- INSERIR ROLES (substituir UUIDs)
-- ============================================

-- Admin role
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_DO_ADMIN_AQUI', 'admin', true);

-- Staff role
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_DO_STAFF_AQUI', 'staff', true);

-- Patient role
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_DO_PACIENTE_AQUI', 'patient', true);

-- ============================================
-- INSERIR PACIENTE (substituir UUIDs)
-- ============================================

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
  'UUID_DO_PACIENTE_AQUI',  -- UUID do usuário paciente criado no auth
  'UUID_DO_STAFF_AQUI'       -- UUID do staff que criou (Elaine)
);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
1. Os profiles são criados automaticamente pelo trigger on_auth_user_created
   quando você cria um usuário no Authentication do Supabase

2. Para os exames e relatórios, é melhor fazer upload novamente através
   do sistema, pois isso garante que os arquivos sejam armazenados
   corretamente no storage

3. Se você quiser inserir os registros de exames e relatórios diretamente:
   - Primeiro migre os arquivos para o storage do novo Supabase
   - Depois insira os registros usando os scripts abaixo

4. ORDEM DE EXECUÇÃO:
   a) Criar usuários no Authentication (Dashboard)
   b) Executar INSERTs de user_roles
   c) Executar INSERT de patients
   d) (Opcional) Inserir exames e relatórios OU fazer upload pelo sistema
*/

-- ============================================
-- INSERIR EXAME (OPCIONAL - substituir UUIDs)
-- ============================================

/*
-- Somente se você já migrou o arquivo para o storage
INSERT INTO public.exams (
  patient_id,
  exam_type,
  description,
  file_path,
  file_type,
  uploaded_by
) VALUES (
  (SELECT id FROM patients WHERE cpf = '702.131.724-70'),
  'Raio-X',
  'raio x',
  'PATIENT_ID_AQUI/1762530161961.jpeg',
  'image/jpeg',
  'UUID_DO_STAFF_AQUI'
);
*/

-- ============================================
-- INSERIR RELATÓRIO (OPCIONAL - substituir UUIDs)
-- ============================================

/*
-- Somente se você já migrou o arquivo para o storage
INSERT INTO public.reports (
  patient_id,
  title,
  description,
  file_path,
  file_type,
  uploaded_by
) VALUES (
  (SELECT id FROM patients WHERE cpf = '702.131.724-70'),
  'teste',
  'teste',
  'laudos/PATIENT_ID_AQUI/1762531084327.pdf',
  'application/pdf',
  'UUID_DO_STAFF_AQUI'
);
*/

-- ============================================
-- VERIFICAR DADOS INSERIDOS
-- ============================================

-- Verificar roles
SELECT u.email, ur.role, ur.active
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at;

-- Verificar pacientes
SELECT p.full_name, p.cpf, p.email, p.phone,
       u.email as user_email
FROM patients p
LEFT JOIN auth.users u ON p.user_id = u.id;

-- Verificar exames
SELECT e.exam_type, e.description, p.full_name as paciente
FROM exams e
JOIN patients p ON e.patient_id = p.id;

-- Verificar relatórios
SELECT r.title, r.description, p.full_name as paciente
FROM reports r
JOIN patients p ON r.patient_id = p.id;
