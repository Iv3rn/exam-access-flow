# 📋 Guia Completo de Implantação

Este guia detalha o processo completo de implantação do sistema na sua VPS.

## 🎯 Pré-requisitos

### 1. Servidor VPS

- **Sistema Operacional:** Ubuntu 22.04 LTS (recomendado)
- **RAM:** 4GB mínimo, 8GB recomendado
- **CPU:** 2 vCPUs mínimo
- **Disco:** 40GB SSD mínimo
- **Conexão:** IPv4 público
- **Acesso:** SSH com sudo

### 2. Domínio

- Domínio registrado e configurado
- Acesso ao painel DNS do registrador
- Registros A apontando para IP da VPS

### 3. Conhecimentos Necessários

- Básico de Linux/Ubuntu
- Básico de Docker
- Básico de Nginx
- Conceitos de DNS

## 📦 Passo 1: Preparar o Servidor

### 1.1 Conectar via SSH

```bash
ssh root@SEU_IP_VPS
# ou
ssh usuario@SEU_IP_VPS
```

### 1.2 Atualizar sistema

```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

### 1.3 Instalar dependências básicas

```bash
sudo apt install -y \
  curl \
  wget \
  git \
  vim \
  htop \
  ufw
```

### 1.4 Configurar firewall

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

### 1.5 Instalar Docker

```bash
# Remover versões antigas
sudo apt remove docker docker-engine docker.io containerd runc

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker (opcional)
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
```

### 1.6 Instalar Docker Compose

```bash
# Instalar plugin do Docker Compose
sudo apt install docker-compose-plugin -y

# Verificar instalação
docker compose version
```

## 📂 Passo 2: Preparar Arquivos

### 2.1 Criar estrutura de diretórios

```bash
sudo mkdir -p /opt/medical-system
cd /opt/medical-system
```

### 2.2 Copiar arquivos do pacote

**Opção A: Via SCP (do seu computador)**

```bash
# No seu computador local
scp -r deployment/* root@SEU_IP_VPS:/opt/medical-system/
```

**Opção B: Via Git (se tiver repositório)**

```bash
cd /opt/medical-system
git clone https://github.com/seu-usuario/seu-repo.git .
```

**Opção C: Via FTP/SFTP**

Use um cliente FTP como FileZilla para transferir os arquivos.

### 2.3 Verificar estrutura

```bash
ls -la /opt/medical-system/

# Deve conter:
# ├── docker-compose.yml
# ├── kong.yml
# ├── .env.example
# ├── nginx/
# ├── scripts/
# ├── supabase/
# └── README.md
```

## 🔑 Passo 3: Configurar Variáveis

### 3.1 Gerar chaves JWT

```bash
cd /opt/medical-system
chmod +x scripts/generate-keys.sh
./scripts/generate-keys.sh
```

**Saída esperada:**
```
🔑 Gerando chaves JWT para Supabase
====================================

✅ Chaves geradas com sucesso!

JWT_SECRET=abc123...
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 Criar arquivo .env

```bash
cp .env.example .env
nano .env
```

### 3.3 Configurar variáveis

Edite o arquivo `.env` com os valores gerados:

```bash
# PostgreSQL
POSTGRES_PASSWORD=SUA_SENHA_POSTGRES_FORTE_AQUI

# JWT (copiar do generate-keys.sh)
JWT_SECRET=SEU_JWT_SECRET_AQUI
ANON_KEY=SEU_ANON_KEY_AQUI
SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY_AQUI

# URLs - Substituir com seu domínio
SITE_URL=https://seudominio.com
API_EXTERNAL_URL=https://api.seudominio.com
ADDITIONAL_REDIRECT_URLS=https://seudominio.com/**,http://localhost:8080/**

# MinIO
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=SUA_SENHA_MINIO_FORTE_AQUI
MINIO_BUCKET_NAME=exam-files

# Frontend (.env.production na raiz do projeto)
VITE_SUPABASE_URL=https://api.seudominio.com
VITE_SUPABASE_PUBLISHABLE_KEY=SEU_ANON_KEY_AQUI
VITE_SUPABASE_PROJECT_ID=self-hosted
VITE_MINIO_PRESIGNER_URL=https://seudominio.com/api/presigner
```

**Salvar:** `Ctrl+X`, `Y`, `Enter`

### 3.4 Atualizar configuração Nginx

```bash
nano nginx/conf.d/app.conf
```

Substituir `yourdomain.com` pelo seu domínio em todas as ocorrências.

## 🐳 Passo 4: Deploy dos Containers

### 4.1 Executar script de deploy

```bash
chmod +x scripts/*.sh
sudo ./scripts/deploy.sh
```

O script irá:
1. Verificar dependências
2. Baixar imagens Docker
3. Iniciar todos os containers
4. Aplicar migrações SQL
5. Configurar MinIO
6. Fazer build do frontend

### 4.2 Aguardar conclusão

O processo pode levar 5-10 minutos dependendo da conexão.

### 4.3 Verificar status

```bash
docker compose ps
```

Todos os serviços devem estar **Up (healthy)** ou **Up**:

```
NAME                   STATUS
supabase-db            Up (healthy)
supabase-kong          Up
supabase-auth          Up
supabase-rest          Up
supabase-realtime      Up
supabase-storage       Up
supabase-functions     Up
minio                  Up (healthy)
minio-presigner        Up
nginx                  Up
```

## 🔐 Passo 5: Configurar SSL

### 5.1 Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Obter certificado

```bash
sudo certbot --nginx \
  -d seudominio.com \
  -d www.seudominio.com \
  --email seuemail@exemplo.com \
  --agree-tos \
  --no-eff-email
```

### 5.3 Testar renovação automática

```bash
sudo certbot renew --dry-run
```

### 5.4 Verificar SSL

Acesse `https://seudominio.com` - deve mostrar cadeado verde.

## 👤 Passo 6: Criar Usuário Admin

### 6.1 Executar script

```bash
sudo ./scripts/create-admin.sh
```

### 6.2 Fornecer dados

```
Email do administrador: admin@seudominio.com
Senha: ********
Nome completo: Administrator
```

### 6.3 Testar login

1. Acesse `https://seudominio.com/auth`
2. Faça login com as credenciais criadas
3. Deve acessar o painel de administrador

## ✅ Passo 7: Verificação

### 7.1 Checklist de funcionamento

- [ ] Frontend acessível em `https://seudominio.com`
- [ ] Login funciona
- [ ] API responde (verifique Network no DevTools)
- [ ] Upload de arquivos funciona
- [ ] MinIO responde
- [ ] SSL ativo e válido
- [ ] Sem erros no console do navegador

### 7.2 Testar funcionalidades

1. **Login Admin:** ✅
2. **Criar Staff:** ✅
3. **Criar Paciente:** ✅
4. **Upload Exame:** ✅
5. **Upload Laudo:** ✅
6. **Login Paciente (CPF):** ✅
7. **Visualizar Exames/Laudos:** ✅

### 7.3 Verificar logs

```bash
# Sem erros?
docker compose logs --tail=100

# Verificar serviços específicos
docker compose logs postgres --tail=50
docker compose logs nginx --tail=50
docker compose logs functions --tail=50
```

## 📊 Passo 8: Configurar Backups

### 8.1 Testar backup manual

```bash
sudo ./scripts/backup.sh
```

Verifique em `./backups/`

### 8.2 Configurar backup automático (cron)

```bash
sudo crontab -e
```

Adicionar:

```bash
# Backup diário às 3h da manhã
0 3 * * * /opt/medical-system/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### 8.3 Configurar retenção

Os backups mantêm os últimos 7 dias automaticamente.

## 🔄 Passo 9: Configurar Monitoramento

### 9.1 Ver logs em tempo real

```bash
# Terminal 1: Logs gerais
docker compose logs -f

# Terminal 2: Recursos
docker stats
```

### 9.2 Configurar alertas (opcional)

Considere usar:
- **Uptime Robot** - Monitoramento de disponibilidade
- **Grafana + Prometheus** - Métricas detalhadas
- **Sentry** - Tracking de erros

## 🎉 Conclusão

Seu sistema está totalmente implantado e funcional!

### URLs de acesso:

- **Frontend:** https://seudominio.com
- **API:** https://seudominio.com/auth, /rest, etc.
- **MinIO Console:** http://seudominio.com:9001

### Próximos passos:

1. ✅ Criar usuários staff
2. ✅ Cadastrar pacientes
3. ✅ Configurar políticas de backup
4. ✅ Monitorar logs regularmente
5. ✅ Manter sistema atualizado

## 📞 Suporte

- **Logs:** `docker compose logs -f`
- **Status:** `docker compose ps`
- **Reiniciar:** `docker compose restart`
- **Troubleshooting:** Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
