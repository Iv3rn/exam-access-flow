# Guia Completo de Migração de Dados

## 📊 Dados Identificados para Migração

### Usuários (5 usuários)
1. **Admin**: pedrohrqq23@gmail.com - Pedro Henrique
2. **Staff**: elaine@facene.com - Elaine Almeida
3. **Staff**: sara@facene.com - Sara
4. **Sem Role**: priscila@facene.com - Priscila Guedes
5. **Paciente**: patient+70213172470@patients.local - PEDRO HENRIQUE FIGUEIREDO DE MIRANDA

### Pacientes (1 paciente)
- CPF: 702.131.724-70
- Nome: PEDRO HENRIQUE FIGUEIREDO DE MIRANDA
- Email: pedrohrqq23@gmail.com
- Telefone: 83988821831

### Exames (1 exame)
- Tipo: Raio-X
- Descrição: raio x
- Arquivo: a19e4d83-8e4c-4ba0-b9cd-4f0ea5dd591d/1762530161961.jpeg

### Relatórios (1 relatório)
- Título: teste
- Descrição: teste
- Arquivo: laudos/a19e4d83-8e4c-4ba0-b9cd-4f0ea5dd591d/1762531084327.pdf

---

## 🚀 Processo de Migração (Passo a Passo)

### PASSO 1: Criar Usuários no Novo Supabase

Você tem 3 opções:

#### Opção A: Via Dashboard do Supabase (RECOMENDADO para Admin)
1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard/project/muykssffzspvouwqvfon
2. Vá em Authentication > Users
3. Clique em "Add User" > "Create new user"
4. Preencha os dados de cada usuário
5. **IMPORTANTE**: Anote o UUID gerado para cada usuário

#### Opção B: Via Edge Function (RECOMENDADO para Staff)
Use a edge function `create-staff` que já existe:

```javascript
// Exemplo de chamada
const { data, error } = await supabase.functions.invoke('create-staff', {
  body: {
    email: 'elaine@facene.com',
    password: 'senha123',
    fullName: 'Elaine Almeida'
  }
});
```

#### Opção C: Via Edge Function (RECOMENDADO para Pacientes)
Use a edge function `create-patient` que já existe:

```javascript
const { data, error } = await supabase.functions.invoke('create-patient', {
  body: {
    cpf: '702.131.724-70',
    full_name: 'PEDRO HENRIQUE FIGUEIREDO DE MIRANDA',
    email: 'pedrohrqq23@gmail.com',
    phone: '83988821831',
    password: 'senha123',
    created_by: 'UUID_DO_STAFF_AQUI'
  }
});
```

---

### PASSO 2: Inserir Roles dos Usuários

Após criar os usuários, execute este SQL no SQL Editor do Supabase:

```sql
-- Substitua os UUIDs pelos IDs reais gerados

-- Admin
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_DO_ADMIN_AQUI', 'admin', true);

-- Staff (Elaine)
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_DA_ELAINE_AQUI', 'staff', true);

-- Staff (Sara)
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_DA_SARA_AQUI', 'staff', true);

-- Paciente (se criou via dashboard, senão a edge function já cria)
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('UUID_DO_PACIENTE_AQUI', 'patient', true);
```

---

### PASSO 3: Verificar Paciente Criado

Se você usou a edge function `create-patient`, o paciente já foi criado automaticamente.

Se não, execute:

```sql
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
  'UUID_DO_PACIENTE_AQUI',
  'UUID_DA_ELAINE_AQUI'
);
```

---

### PASSO 4: Migrar Arquivos do Storage

Você tem 2 opções:

#### Opção A: Re-upload via Sistema (RECOMENDADO)
1. Faça login no sistema com o usuário staff
2. Acesse o paciente
3. Faça upload novamente do exame e do relatório
4. ✅ Mais simples e garante que tudo funcione

#### Opção B: Migração Manual dos Arquivos
1. Baixe os arquivos do storage antigo:
   - `a19e4d83-8e4c-4ba0-b9cd-4f0ea5dd591d/1762530161961.jpeg`
   - `laudos/a19e4d83-8e4c-4ba0-b9cd-4f0ea5dd591d/1762531084327.pdf`

2. Faça upload para o novo storage na mesma estrutura de pastas

3. Execute o SQL para criar os registros:

```sql
-- Inserir Exame
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
  'NOVO_PATIENT_ID/1762530161961.jpeg',
  'image/jpeg',
  'UUID_DA_ELAINE_AQUI'
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
  (SELECT id FROM patients WHERE cpf = '702.131.724-70'),
  'teste',
  'teste',
  'laudos/NOVO_PATIENT_ID/1762531084327.pdf',
  'application/pdf',
  'UUID_DA_ELAINE_AQUI'
);
```

---

## ✅ Checklist de Migração

- [ ] Criar usuário Admin (pedrohrqq23@gmail.com)
- [ ] Adicionar role admin ao Admin
- [ ] Criar usuário Staff (elaine@facene.com)
- [ ] Adicionar role staff à Elaine
- [ ] Criar usuário Staff (sara@facene.com)
- [ ] Adicionar role staff à Sara
- [ ] Criar usuário Priscila (priscila@facene.com) - decidir role
- [ ] Criar usuário/paciente (patient+70213172470@patients.local)
- [ ] Verificar paciente criado na tabela patients
- [ ] Migrar arquivo de exame (Raio-X)
- [ ] Migrar arquivo de relatório (PDF)
- [ ] Testar login de cada usuário
- [ ] Testar acesso aos dados por cada role

---

## 🔐 Configurações Adicionais Necessárias

### 1. Configurar Auto-Confirm Email (IMPORTANTE!)
No Dashboard do Supabase:
1. Vá em Authentication > Policies
2. Desabilite "Enable email confirmations"
3. Isso permite login imediato após criar usuários

### 2. Configurar Secrets do MinIO
Para o upload de arquivos funcionar, configure no Cloud:
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET_NAME`

---

## 🆘 Solução de Problemas

### "new row violates row-level security policy"
- Verifique se o usuário tem a role correta no `user_roles`
- Verifique se o usuário está autenticado

### "permission denied for table"
- Verifique as RLS policies
- Confirme que as funções `has_role` estão criadas

### "User not found"
- Verifique se o usuário foi criado no Authentication
- Confirme o UUID correto

---

## 📝 Ordem Recomendada

1. ✅ Criar Admin primeiro (via Dashboard)
2. ✅ Adicionar role admin
3. ✅ Criar Staff (via edge function ou dashboard)
4. ✅ Adicionar roles staff
5. ✅ Criar Paciente (via edge function)
6. ✅ Re-upload de arquivos via sistema
7. ✅ Testar tudo

---

## 🎯 Próximos Passos Após Migração

1. Habilitar auto-confirm email
2. Configurar secrets do MinIO
3. Testar login de todos os usuários
4. Testar upload de novos exames
5. Verificar permissões de cada role
