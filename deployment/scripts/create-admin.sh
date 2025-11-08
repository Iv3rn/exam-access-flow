#!/bin/bash
set -e

echo "👤 Criar Usuário Administrador"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment
source .env

# Prompt for admin details
read -p "Email do administrador: " ADMIN_EMAIL
read -sp "Senha: " ADMIN_PASSWORD
echo ""
read -p "Nome completo: " ADMIN_NAME

echo -e "${YELLOW}📝 Criando usuário administrador...${NC}"

# Create user in Supabase Auth
USER_ID=$(docker compose exec -T postgres psql -U postgres -d postgres -t -c "
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '$ADMIN_EMAIL',
    crypt('$ADMIN_PASSWORD', gen_salt('bf')),
    NOW(),
    '{\"full_name\": \"$ADMIN_NAME\"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) RETURNING id;
" | tr -d ' ')

if [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ Erro ao criar usuário${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Usuário criado: $USER_ID${NC}"

# Create profile
echo -e "${YELLOW}📝 Criando perfil...${NC}"
docker compose exec -T postgres psql -U postgres -d postgres << EOF
INSERT INTO public.profiles (id, email, full_name)
VALUES ('$USER_ID', '$ADMIN_EMAIL', '$ADMIN_NAME');
EOF

echo -e "${GREEN}✅ Perfil criado${NC}"

# Assign admin role
echo -e "${YELLOW}📝 Atribuindo role de administrador...${NC}"
docker compose exec -T postgres psql -U postgres -d postgres << EOF
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('$USER_ID', 'admin', true);
EOF

echo -e "${GREEN}✅ Role de admin atribuída${NC}"

echo ""
echo -e "${GREEN}🎉 Usuário administrador criado com sucesso!${NC}"
echo ""
echo "📧 Email: $ADMIN_EMAIL"
echo "👤 Nome: $ADMIN_NAME"
echo "🆔 ID: $USER_ID"
echo ""
echo "Você pode fazer login agora em: ${SITE_URL}/auth"
