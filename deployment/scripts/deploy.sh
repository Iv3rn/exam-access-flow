#!/bin/bash
set -e

echo "🚀 Iniciando deploy do Sistema de Gestão de Exames Médicos..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "Copie .env.example para .env e configure as variáveis:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Load environment variables
source .env

echo -e "${YELLOW}📋 Verificando dependências...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado!${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependências OK${NC}"

# Stop existing containers
echo -e "${YELLOW}🛑 Parando containers existentes...${NC}"
docker compose down

# Pull latest images
echo -e "${YELLOW}📥 Baixando imagens Docker...${NC}"
docker compose pull

# Start services
echo -e "${YELLOW}🐳 Iniciando containers...${NC}"
docker compose up -d

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Aguardando PostgreSQL ficar pronto...${NC}"
sleep 10

# Check if database is ready
until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "Aguardando PostgreSQL..."
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL pronto${NC}"

# Initialize database
echo -e "${YELLOW}🗄️ Inicializando banco de dados...${NC}"
./scripts/init-db.sh

# Wait for MinIO to be ready
echo -e "${YELLOW}⏳ Aguardando MinIO ficar pronto...${NC}"
sleep 5

# Create MinIO bucket
echo -e "${YELLOW}📦 Criando bucket no MinIO...${NC}"
docker compose exec -T minio mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} || true
docker compose exec -T minio mc mb local/${MINIO_BUCKET_NAME} || true
docker compose exec -T minio mc anonymous set public local/${MINIO_BUCKET_NAME} || true

echo -e "${GREEN}✅ Bucket criado${NC}"

# Build frontend
echo -e "${YELLOW}🔨 Fazendo build do frontend...${NC}"
cd ..
npm install
npm run build

echo -e "${GREEN}✅ Frontend pronto${NC}"

# Setup SSL (if certbot is available)
if command -v certbot &> /dev/null; then
    echo -e "${YELLOW}🔒 Configurando SSL...${NC}"
    echo "Execute manualmente:"
    echo "  sudo certbot certonly --webroot -w /var/www/certbot -d yourdomain.com -d www.yourdomain.com"
else
    echo -e "${YELLOW}⚠️  Certbot não encontrado. Configure SSL manualmente.${NC}"
fi

# Show status
echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "📊 Status dos serviços:"
docker compose ps

echo ""
echo "🌐 URLs de acesso:"
echo "  Frontend: http://localhost"
echo "  API: http://localhost:8000"
echo "  MinIO Console: http://localhost:9001"
echo ""
echo "📝 Próximos passos:"
echo "  1. Configure seu domínio para apontar para o IP desta VPS"
echo "  2. Configure SSL com: sudo certbot certonly --webroot"
echo "  3. Crie o primeiro usuário admin: ./scripts/create-admin.sh"
echo "  4. Atualize as URLs no .env para usar seu domínio"
echo ""
echo "📚 Ver logs: docker compose logs -f"
echo "🔄 Reiniciar: docker compose restart"
echo "🛑 Parar: docker compose down"
