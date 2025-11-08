# 🏥 Sistema de Gestão de Exames Médicos - Pacote de Auto-Hospedagem

Este pacote contém todos os arquivos necessários para hospedar o sistema completo na sua VPS.

## 📦 O que está incluído

- **Docker Compose** completo com Supabase auto-hospedado + MinIO
- **5 migrações SQL** em ordem correta
- **4 Edge Functions** (Deno)
- **Configuração Nginx** com SSL
- **Scripts de deploy** automatizados
- **Backend MinIO Presigner** (Node.js)
- **Documentação completa**

## 🚀 Quick Start

### 1. Preparar VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y
```

### 2. Copiar arquivos para VPS

```bash
# Criar diretório
sudo mkdir -p /opt/medical-system
cd /opt/medical-system

# Copiar todos os arquivos deste pacote para /opt/medical-system
```

### 3. Configurar variáveis de ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Gerar chaves JWT
./scripts/generate-keys.sh

# Editar .env com as chaves geradas e suas configurações
nano .env
```

**Importante:** Altere estas variáveis no `.env`:
- `POSTGRES_PASSWORD` - Senha forte para PostgreSQL
- `JWT_SECRET` - Gerado pelo script generate-keys.sh
- `ANON_KEY` - Gerado pelo script generate-keys.sh
- `SERVICE_ROLE_KEY` - Gerado pelo script generate-keys.sh
- `SITE_URL` - Seu domínio (ex: https://seudominio.com)
- `API_EXTERNAL_URL` - URL da API (ex: https://api.seudominio.com)
- `MINIO_ROOT_USER` - Usuário admin do MinIO
- `MINIO_ROOT_PASSWORD` - Senha forte para MinIO

### 4. Executar deploy

```bash
# Tornar scripts executáveis
chmod +x scripts/*.sh

# Executar deploy automático
sudo ./scripts/deploy.sh
```

O script irá:
1. ✅ Baixar todas as imagens Docker
2. ✅ Iniciar todos os containers
3. ✅ Aplicar migrações SQL
4. ✅ Configurar MinIO
5. ✅ Fazer build do frontend
6. ✅ Configurar Nginx

### 5. Criar usuário administrador

```bash
sudo ./scripts/create-admin.sh
```

## 🔧 Requisitos do Servidor

- **OS:** Ubuntu 22.04 LTS (recomendado)
- **RAM:** Mínimo 4GB (recomendado 8GB)
- **Disco:** Mínimo 40GB SSD
- **Portas:** 80, 443 (HTTP/HTTPS)
- **Domínio:** Configurado apontando para IP da VPS

## 🌐 Configuração de DNS

Configure estes registros DNS no seu provedor:

```
Tipo    Nome    Valor
A       @       SEU_IP_VPS
A       www     SEU_IP_VPS
A       api     SEU_IP_VPS (opcional)
```

## 🔒 Configurar SSL (HTTPS)

### Opção 1: Certbot (Let's Encrypt) - Recomendado

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Renovação automática já está configurada
```

### Opção 2: Certificado próprio

```bash
# Copiar certificados para
/opt/medical-system/deployment/nginx/ssl/fullchain.pem
/opt/medical-system/deployment/nginx/ssl/privkey.pem

# Reiniciar Nginx
docker compose restart nginx
```

## 📊 Estrutura de Serviços

| Serviço | Porta | Acesso |
|---------|-------|--------|
| Frontend (Nginx) | 80/443 | https://seudominio.com |
| PostgreSQL | 5432 | Interno apenas |
| Kong API Gateway | 8000 | Via Nginx |
| MinIO | 9000 | Via Nginx |
| MinIO Console | 9001 | http://seudominio.com:9001 |
| Presigner Backend | 3001 | Via Nginx |

## 🔄 Comandos Úteis

### Ver logs
```bash
# Todos os serviços
docker compose logs -f

# Serviço específico
docker compose logs -f postgres
docker compose logs -f nginx
docker compose logs -f functions
```

### Reiniciar serviços
```bash
# Todos
docker compose restart

# Específico
docker compose restart nginx
docker compose restart postgres
```

### Parar/Iniciar
```bash
# Parar todos
docker compose down

# Iniciar todos
docker compose up -d
```

### Ver status
```bash
docker compose ps
```

## 💾 Backup e Restauração

### Fazer backup
```bash
sudo ./scripts/backup.sh
```

Backups são salvos em `./backups/YYYYMMDD_HHMMSS/`

### Restaurar backup
```bash
# PostgreSQL
gunzip < backups/20240101_120000/postgres.sql.gz | \
  docker compose exec -T postgres psql -U postgres postgres

# MinIO
docker compose cp backups/20240101_120000/minio minio:/data/
```

## 🔄 Atualizações

### Atualizar frontend
```bash
cd /opt/medical-system
git pull  # ou copiar novos arquivos
sudo ./scripts/update-frontend.sh
```

### Atualizar imagens Docker
```bash
docker compose pull
docker compose up -d
```

### Aplicar novas migrações
```bash
# Adicionar arquivo SQL em supabase/migrations/
# Executar
docker compose exec -T postgres psql -U postgres -d postgres < \
  ./supabase/migrations/06_nova_migracao.sql
```

## 🆘 Troubleshooting

### Containers não iniciam
```bash
# Ver logs detalhados
docker compose logs

# Verificar recursos
docker stats
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está pronto
docker compose exec postgres pg_isready -U postgres

# Ver logs do PostgreSQL
docker compose logs postgres
```

### SSL não funciona
```bash
# Verificar certificados
ls -la nginx/ssl/

# Testar configuração Nginx
docker compose exec nginx nginx -t

# Ver logs Nginx
docker compose logs nginx
```

### Edge Functions não respondem
```bash
# Ver logs das functions
docker compose logs functions

# Reiniciar functions
docker compose restart functions
```

### MinIO não conecta
```bash
# Ver logs MinIO
docker compose logs minio

# Verificar credenciais no .env
grep MINIO_ .env

# Testar acesso
curl http://localhost:9000/minio/health/live
```

## 📚 Documentação Adicional

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia completo de implantação
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solução de problemas detalhada

## 🔐 Segurança

### Checklist de segurança

- ✅ Senhas fortes em todas as variáveis
- ✅ Firewall configurado (apenas 80/443)
- ✅ SSL/TLS habilitado
- ✅ RLS (Row Level Security) ativo
- ✅ Backups automáticos configurados
- ✅ Logs monitorados

### Configurar firewall (UFW)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

## 💰 Custos Estimados

**VPS Recomendados:**
- **DigitalOcean:** $24/mês (4GB RAM, 2 vCPUs)
- **Hetzner:** €5-10/mês (4GB RAM)
- **Contabo:** €5/mês (4GB RAM)

**Vs Lovable Cloud:**
- ✅ Custo fixo previsível
- ✅ Controle total
- ✅ Sem limites de requisições
- ⚠️ Você gerencia atualizações
- ⚠️ Você gerencia backups

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Consulte logs: `docker compose logs`
3. Verifique status: `docker compose ps`

## 📝 Licença

Este projeto está sob a mesma licença do projeto original.
