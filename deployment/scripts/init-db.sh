#!/bin/bash
set -e

echo "🗄️ Inicializando banco de dados..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment
source .env

# Apply migrations in order
MIGRATIONS=(
    "01_initial_schema.sql"
    "02_reports_table.sql"
    "03_user_id_patients.sql"
    "04_exam_id_reports.sql"
    "05_remove_passwords.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo -e "${YELLOW}📝 Aplicando migração: $migration${NC}"
    
    docker compose exec -T postgres psql -U postgres -d postgres < ./supabase/migrations/$migration
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $migration aplicada com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao aplicar $migration${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Todas as migrações aplicadas com sucesso!${NC}"

# Create initial storage bucket
echo -e "${YELLOW}📦 Configurando storage bucket...${NC}"
docker compose exec -T postgres psql -U postgres -d postgres << EOF
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-files', 'exam-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for exam-files bucket
CREATE POLICY IF NOT EXISTS "Staff can upload exam files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-files' AND
  (SELECT has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY IF NOT EXISTS "Staff can view all exam files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-files' AND
  (SELECT has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY IF NOT EXISTS "Patients can view own exam files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-files' AND
  (SELECT EXISTS (
    SELECT 1 FROM patients p
    WHERE p.user_id = auth.uid()
  ))
);

CREATE POLICY IF NOT EXISTS "Staff can delete exam files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-files' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);
EOF

echo -e "${GREEN}✅ Banco de dados inicializado!${NC}"
