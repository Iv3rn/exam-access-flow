#!/bin/bash

# Script de deploy simplificado para VPS
# Este script faz deploy apenas do frontend React, usando Lovable Cloud como backend

set -e

echo "🚀 Iniciando deploy do sistema de exames médicos..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor, execute como root (sudo ./deploy.sh)${NC}"
    exit 1
fi

# 1. Instalar dependências
echo -e "${BLUE}📦 Instalando dependências do sistema...${NC}"
apt update
apt install -y nginx nodejs npm git curl

# Instalar versão LTS do Node.js (se necessário)
if ! command -v node &> /dev/null || [ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 18 ]; then
    echo -e "${BLUE}📦 Instalando Node.js 20 LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# 2. Clonar ou atualizar repositório
APP_DIR="/var/www/medical-system"

# Verificar se REPO_URL foi passado como argumento
if [ -z "$1" ]; then
    echo -e "${RED}❌ URL do repositório não fornecida!${NC}"
    echo -e "${BLUE}Uso: ./deploy.sh https://github.com/seu-usuario/seu-repo.git${NC}"
    exit 1
fi

REPO_URL="$1"

if [ -d "$APP_DIR" ]; then
    echo -e "${BLUE}🔄 Atualizando código existente...${NC}"
    cd $APP_DIR
    git pull origin main
else
    echo -e "${BLUE}📥 Clonando repositório de: $REPO_URL${NC}"
    mkdir -p /var/www
    cd /var/www
    git clone $REPO_URL medical-system
    cd medical-system
fi

# 3. Configurar variáveis de ambiente
echo -e "${BLUE}⚙️  Configurando variáveis de ambiente...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Arquivo .env.production não encontrado!${NC}"
    echo -e "${RED}   Copie o arquivo .env.production.example e configure as variáveis${NC}"
    exit 1
fi

# 4. Instalar dependências do projeto
echo -e "${BLUE}📦 Instalando dependências do projeto...${NC}"
npm install

# 5. Build do frontend
echo -e "${BLUE}🏗️  Fazendo build do frontend...${NC}"
npm run build

# 6. Configurar Nginx
echo -e "${BLUE}🌐 Configurando Nginx...${NC}"
cp vps-deploy/nginx.conf /etc/nginx/sites-available/medical-system

# Criar link simbólico se não existir
if [ ! -L /etc/nginx/sites-enabled/medical-system ]; then
    ln -s /etc/nginx/sites-available/medical-system /etc/nginx/sites-enabled/
fi

# Remover configuração padrão
rm -f /etc/nginx/sites-enabled/default

# 7. Copiar arquivos build para diretório web
echo -e "${BLUE}📂 Copiando arquivos para diretório web...${NC}"
rm -rf /var/www/medical-system-dist
cp -r dist /var/www/medical-system-dist
chown -R www-data:www-data /var/www/medical-system-dist

# 8. Testar configuração do Nginx
echo -e "${BLUE}🔍 Testando configuração do Nginx...${NC}"
nginx -t

# 9. Reiniciar Nginx
echo -e "${BLUE}🔄 Reiniciando Nginx...${NC}"
systemctl restart nginx
systemctl enable nginx

# 10. Configurar firewall (se UFW estiver instalado)
if command -v ufw &> /dev/null; then
    echo -e "${BLUE}🔥 Configurando firewall...${NC}"
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
fi

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}🌐 Acesse seu sistema em: http://SEU_DOMINIO_OU_IP${NC}"
echo ""
echo -e "${BLUE}📝 Próximos passos:${NC}"
echo "1. Configure SSL/HTTPS com certbot (recomendado):"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d seu-dominio.com"
echo ""
echo "2. Para atualizar o sistema no futuro, execute:"
echo "   cd /var/www/medical-system && sudo ./vps-deploy/deploy.sh"
