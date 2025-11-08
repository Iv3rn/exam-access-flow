#!/bin/bash
set -e

echo "💾 Iniciando backup..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment
source .env

# Create backup directory
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Fazendo backup do PostgreSQL...${NC}"
docker compose exec -T postgres pg_dump -U postgres postgres | gzip > "$BACKUP_DIR/postgres.sql.gz"

echo -e "${YELLOW}📦 Fazendo backup do MinIO...${NC}"
docker compose exec -T minio mc mirror local/${MINIO_BUCKET_NAME} /tmp/minio-backup
docker compose cp minio:/tmp/minio-backup "$BACKUP_DIR/minio"

echo -e "${GREEN}✅ Backup concluído: $BACKUP_DIR${NC}"
echo ""
echo "📊 Tamanho do backup:"
du -sh "$BACKUP_DIR"

# Keep only last 7 backups
echo -e "${YELLOW}🧹 Limpando backups antigos...${NC}"
ls -t ./backups | tail -n +8 | xargs -I {} rm -rf ./backups/{}

echo -e "${GREEN}✅ Backup finalizado!${NC}"
