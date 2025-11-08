#!/bin/bash
set -e

echo "🔄 Atualizando frontend..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd ..

echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install

echo -e "${YELLOW}🔨 Fazendo build...${NC}"
npm run build

echo -e "${YELLOW}🚀 Reiniciando Nginx...${NC}"
cd deployment
docker compose restart nginx

echo -e "${GREEN}✅ Frontend atualizado!${NC}"
