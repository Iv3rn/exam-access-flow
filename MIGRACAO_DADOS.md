# Guia de Migração de Dados

## ✅ Estrutura Migrada Automaticamente

A estrutura completa do banco de dados foi migrada com sucesso:
- ✅ Tabelas (profiles, user_roles, patients, exams, reports)
- ✅ Funções (has_role, handle_new_user, update_updated_at_column, is_patient_with_email)
- ✅ Triggers
- ✅ Políticas RLS (Row Level Security)
- ✅ Bucket de storage (exam-files)

## 📋 Dados Existentes a Migrar

### 1. Usuários (Auth)

**Dados atuais:**
- **Admin:** Pedro Henrique (pedrohrqq23@gmail.com)
- **Staff:** Elaine Almeida (elaine@facene.com)
- **Paciente:** PEDRO HENRIQUE FIGUEIREDO DE MIRANDA (CPF: 702.131.724-70)

**Como migrar:**

Os usuários precisam ser recriados no novo Supabase. Use as credenciais que você tem:

#### A) Criar Admin no Dashboard do Supabase:
1. Acesse: Authentication > Users > Add User
2. Email: pedrohrqq23@gmail.com
3. Senha: [a senha que você usa]
4. Depois, adicione a role 'admin' manualmente no banco:

```sql
-- Substitua USER_ID_AQUI pelo UUID gerado
INSERT INTO user_roles (user_id, role, active)
VALUES ('USER_ID_AQUI', 'admin', true);
```

#### B) Criar Staff via API:
A edge function `create-staff` já está no projeto e pode ser usada.

#### C) Criar Paciente via API:
A edge function `create-patient` já está no projeto.

### 2. Paciente

**Dados atuais:**
- Nome: PEDRO HENRIQUE FIGUEIREDO DE MIRANDA
- CPF: 702.131.724-70
- Email: pedrohrqq23@gmail.com
- Telefone: 83988821831

**Como recriar:**
Após criar o usuário admin, use o sistema para recriar o paciente através do botão "Adicionar Paciente" no dashboard.

### 3. Exame

**Dados atuais:**
- Tipo: Raio-X
- Descrição: raio x
- Arquivo: a19e4d83-8e4c-4ba0-b9cd-4f0ea5dd591d/1762530161961.jpeg

**Como migrar:**
Após recriar o paciente, faça o upload do exame novamente através do sistema.

### 4. Relatório

**Dados atuais:**
- Título: teste
- Descrição: teste
- Arquivo: laudos/a19e4d83-8e4c-4ba0-b9cd-4f0ea5dd591d/1762531084327.pdf

**Como migrar:**
Após recriar o paciente, faça o upload do relatório novamente através do sistema.

## 🔧 Migrando Arquivos do Storage (Opcional)

Se você quiser migrar os arquivos do storage sem fazer upload novamente:

### Opção 1: Download e Re-upload Manual
1. Baixe os arquivos do Lovable Cloud através do sistema
2. Faça upload no novo Supabase através do sistema

### Opção 2: Migração via API (Avançado)
Você pode criar um script para copiar arquivos entre os storages usando as APIs do Supabase.

## 📝 Checklist de Migração

- [ ] Estrutura do banco criada ✅ (já feito)
- [ ] Criar usuário Admin no novo Supabase
- [ ] Adicionar role 'admin' ao usuário
- [ ] Testar login com o admin
- [ ] Criar usuário Staff (Elaine)
- [ ] Recriar paciente através do sistema
- [ ] Re-upload do exame
- [ ] Re-upload do relatório
- [ ] Configurar edge functions secrets (MINIO_* se aplicável)
- [ ] Atualizar arquivo .env com as novas credenciais do Supabase
- [ ] Testar todas as funcionalidades

## ⚙️ Configurações Necessárias

### Edge Functions Secrets

Se você estiver usando MinIO ou outro storage externo, configure os secrets:

```bash
# No dashboard do Supabase: Settings > Edge Functions > Secrets
MINIO_ENDPOINT=seu_endpoint
MINIO_ACCESS_KEY=sua_access_key
MINIO_SECRET_KEY=sua_secret_key
MINIO_BUCKET_NAME=seu_bucket
```

### Arquivo .env

Atualize o arquivo `.env` com as credenciais do novo Supabase:

```env
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[sua-key]
VITE_SUPABASE_PROJECT_ID=[seu-project-id]
```

## 🎯 Ordem Recomendada

1. ✅ Estrutura migrada (já feito)
2. Configurar .env com novo Supabase
3. Criar primeiro usuário Admin manualmente
4. Adicionar role admin ao usuário
5. Fazer login no sistema
6. Criar staff através do sistema
7. Criar pacientes através do sistema
8. Fazer upload de exames e relatórios

## 🆘 Problemas Comuns

### "new row violates row-level security policy"
- Certifique-se de que o usuário tem a role correta em `user_roles`
- Verifique se está logado ao tentar inserir dados

### "permission denied for table auth.users"
- Normal! Use as edge functions ou o dashboard do Supabase para criar usuários

### Edge functions não funcionam
- Verifique se os secrets estão configurados
- Confira os logs das edge functions no dashboard do Supabase
