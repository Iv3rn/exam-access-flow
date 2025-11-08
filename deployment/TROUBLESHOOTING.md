# 🆘 Guia de Solução de Problemas

Este guia cobre os problemas mais comuns e suas soluções.

## 🔍 Diagnóstico Inicial

Sempre comece verificando:

```bash
# 1. Status dos containers
docker compose ps

# 2. Logs recentes
docker compose logs --tail=100

# 3. Uso de recursos
docker stats

# 4. Espaço em disco
df -h

# 5. Memória disponível
free -h
```

---

## ❌ Containers não iniciam

### Sintomas
- `docker compose up -d` falha
- Containers em estado `Exited` ou `Restarting`

### Diagnóstico

```bash
docker compose ps
docker compose logs
```

### Soluções

**1. Portas já em uso**

```bash
# Verificar portas
sudo netstat -tulpn | grep -E '80|443|5432|9000'

# Parar serviços conflitantes
sudo systemctl stop apache2  # ou nginx, etc
```

**2. Memória insuficiente**

```bash
# Verificar memória
free -h

# Limpar cache
sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'

# Considerar upgrade da VPS
```

**3. Permissões incorretas**

```bash
sudo chown -R $USER:$USER /opt/medical-system
chmod +x scripts/*.sh
```

**4. Variáveis de ambiente faltando**

```bash
# Verificar .env
cat .env | grep -v '^#' | grep -v '^$'

# Comparar com .env.example
diff .env .env.example
```

---

## 🗄️ Erro de Conexão com PostgreSQL

### Sintomas
- "could not connect to database"
- "connection refused"
- Backend não responde

### Diagnóstico

```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Testar conexão
docker compose exec postgres pg_isready -U postgres

# Ver logs
docker compose logs postgres --tail=50
```

### Soluções

**1. PostgreSQL não está pronto**

```bash
# Aguardar mais tempo
sleep 10
docker compose exec postgres pg_isready -U postgres
```

**2. Senha incorreta no .env**

```bash
# Verificar POSTGRES_PASSWORD
grep POSTGRES_PASSWORD .env

# Recriar container com nova senha
docker compose down -v
docker compose up -d
```

**3. Volume corrompido**

```bash
# ATENÇÃO: Isso apaga todos os dados!
docker compose down -v
docker volume rm medical-system_postgres-data
docker compose up -d
./scripts/init-db.sh
```

---

## 🚫 Erro 502 Bad Gateway (Nginx)

### Sintomas
- Página mostra "502 Bad Gateway"
- Nginx rodando mas backend não responde

### Diagnóstico

```bash
# Testar config Nginx
docker compose exec nginx nginx -t

# Ver logs Nginx
docker compose logs nginx --tail=50

# Ver logs Kong
docker compose logs kong --tail=50
```

### Soluções

**1. Kong não está rodando**

```bash
docker compose restart kong
docker compose logs kong -f
```

**2. Configuração Nginx incorreta**

```bash
# Verificar proxy_pass nas configurações
nano nginx/conf.d/app.conf

# Testar sintaxe
docker compose exec nginx nginx -t

# Recarregar
docker compose restart nginx
```

**3. Rede Docker com problemas**

```bash
docker compose down
docker network prune
docker compose up -d
```

---

## 🔒 SSL/HTTPS não funciona

### Sintomas
- "Your connection is not private"
- Certificado inválido ou expirado
- Redirecionamento HTTP → HTTPS falha

### Diagnóstico

```bash
# Verificar certificados
ls -la nginx/ssl/

# Testar porta 443
sudo netstat -tulpn | grep 443

# Verificar config SSL no Nginx
grep ssl nginx/conf.d/app.conf
```

### Soluções

**1. Certificado não existe**

```bash
# Obter com Certbot
sudo certbot --nginx \
  -d seudominio.com \
  -d www.seudominio.com

# Reiniciar Nginx
docker compose restart nginx
```

**2. Certificado expirado**

```bash
# Renovar manualmente
sudo certbot renew

# Verificar auto-renovação
sudo systemctl status certbot.timer
```

**3. Porta 443 bloqueada**

```bash
# Verificar firewall
sudo ufw status

# Permitir HTTPS
sudo ufw allow 443/tcp
```

---

## 📁 Upload de arquivos falha

### Sintomas
- Erro ao fazer upload de exames/laudos
- "Network error" no frontend
- Upload trava em 0%

### Diagnóstico

```bash
# Verificar MinIO
docker compose logs minio --tail=50

# Verificar presigner
docker compose logs minio-presigner --tail=50

# Testar MinIO Health
curl http://localhost:9000/minio/health/live
```

### Soluções

**1. MinIO não está rodando**

```bash
docker compose restart minio
docker compose logs minio -f
```

**2. Bucket não foi criado**

```bash
# Criar bucket manualmente
docker compose exec minio mc alias set local \
  http://localhost:9000 \
  $MINIO_ROOT_USER \
  $MINIO_ROOT_PASSWORD

docker compose exec minio mc mb local/exam-files
```

**3. Credenciais MinIO incorretas**

```bash
# Verificar .env
grep MINIO_ .env

# Atualizar e reiniciar
nano .env
docker compose restart minio minio-presigner
```

**4. Tamanho de arquivo excedido**

```bash
# Aumentar client_max_body_size no Nginx
nano nginx/conf.d/app.conf

# Adicionar/modificar:
client_max_body_size 100M;

# Reiniciar
docker compose restart nginx
```

---

## 🔐 Autenticação falha

### Sintomas
- Login não funciona
- "Invalid credentials"
- Redirecionamento para localhost

### Diagnóstico

```bash
# Ver logs Auth
docker compose logs auth --tail=50

# Verificar variáveis
grep -E 'SITE_URL|JWT_SECRET' .env
```

### Soluções

**1. SITE_URL incorreto**

```bash
# Corrigir no .env
nano .env

# Mudar:
SITE_URL=https://seudominio.com
API_EXTERNAL_URL=https://seudominio.com

# Reiniciar
docker compose restart auth
```

**2. JWT_SECRET inválido**

```bash
# Gerar novo
./scripts/generate-keys.sh

# Atualizar .env
nano .env

# ATENÇÃO: Todos os tokens existentes serão invalidados!
docker compose restart auth kong
```

**3. Callback URL incorreta**

```bash
# Verificar ADDITIONAL_REDIRECT_URLS
grep ADDITIONAL_REDIRECT_URLS .env

# Deve incluir seu domínio:
ADDITIONAL_REDIRECT_URLS=https://seudominio.com/**
```

---

## 🔄 Edge Functions não respondem

### Sintomas
- Criação de pacientes falha
- Login via CPF não funciona
- Erro 500 ao chamar functions

### Diagnóstico

```bash
# Ver logs das functions
docker compose logs functions --tail=100

# Verificar se está rodando
docker compose ps functions
```

### Soluções

**1. Functions não iniciaram**

```bash
docker compose restart functions
docker compose logs functions -f
```

**2. Variáveis de ambiente faltando**

```bash
# Verificar secrets das functions
docker compose exec functions env | grep -E 'SUPABASE|MINIO'

# Se faltando, adicionar no docker-compose.yml
nano docker-compose.yml
docker compose up -d
```

**3. Timeout nas functions**

```bash
# Aumentar timeout no Kong
nano kong.yml

# Adicionar config de timeout
# Reiniciar
docker compose restart kong
```

---

## 💾 Backup falha

### Sintomas
- Script backup.sh retorna erro
- Backup incompleto
- Espaço insuficiente

### Diagnóstico

```bash
# Espaço em disco
df -h

# Testar backup manualmente
./scripts/backup.sh
```

### Soluções

**1. Espaço insuficiente**

```bash
# Limpar backups antigos
rm -rf backups/20240101_*

# Limpar Docker
docker system prune -a --volumes
```

**2. Permissões**

```bash
chmod +x scripts/backup.sh
sudo chown -R $USER:$USER backups/
```

**3. PostgreSQL não responde**

```bash
docker compose restart postgres
sleep 10
./scripts/backup.sh
```

---

## 🌐 DNS não resolve

### Sintomas
- Domínio não carrega
- "DNS_PROBE_FINISHED_NXDOMAIN"
- Só funciona via IP

### Diagnóstico

```bash
# Testar DNS
nslookup seudominio.com
dig seudominio.com

# Verificar propagação
# https://dnschecker.org
```

### Soluções

**1. Registros DNS incorretos**

Verificar no painel do registrador:
```
Tipo    Nome    Valor               TTL
A       @       SEU_IP_VPS          3600
A       www     SEU_IP_VPS          3600
```

**2. Aguardar propagação**

Pode levar até 48 horas. Testar com:
```bash
curl -I http://SEU_IP_VPS
```

---

## 🔥 Sistema lento

### Sintomas
- Páginas carregam devagar
- Upload/download lento
- Timeouts frequentes

### Diagnóstico

```bash
# Uso de CPU/RAM
docker stats

# Processos no host
htop

# I/O de disco
iostat -x 1
```

### Soluções

**1. Memória insuficiente**

```bash
# Ver uso
free -h

# Considerar upgrade VPS
# Adicionar swap temporário:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**2. Limpar logs antigos**

```bash
# Truncar logs Docker
sudo sh -c "truncate -s 0 /var/lib/docker/containers/*/*-json.log"

# Configurar rotação de logs
nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

**3. Otimizar PostgreSQL**

```bash
# Editar config
docker compose exec postgres psql -U postgres

# Executar:
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

# Reiniciar
docker compose restart postgres
```

---

## 📊 Logs gigantes

### Sintomas
- Disco cheio
- `/var/lib/docker` ocupa muito espaço

### Solução

```bash
# Ver tamanho
du -sh /var/lib/docker

# Limpar logs
sudo sh -c "truncate -s 0 /var/lib/docker/containers/*/*-json.log"

# Configurar limite (ver solução acima em "Sistema lento")
```

---

## 🔧 Comandos Úteis de Diagnóstico

```bash
# Reiniciar tudo
docker compose restart

# Recriar containers
docker compose down
docker compose up -d

# Ver todas as redes
docker network ls

# Inspecionar container
docker inspect <container_name>

# Entrar em container
docker compose exec postgres bash
docker compose exec nginx sh

# Ver processos em container
docker compose top postgres

# Exportar logs
docker compose logs > logs.txt
```

---

## 📞 Ainda com problemas?

1. **Verifique logs detalhados:**
   ```bash
   docker compose logs --tail=500 > full-logs.txt
   ```

2. **Documente o erro:**
   - Mensagem de erro completa
   - Comando que causou o erro
   - Logs relevantes

3. **Verifique configurações:**
   - `.env` correto
   - DNS configurado
   - Firewall aberto
   - SSL ativo

4. **Consulte documentação:**
   - [README.md](./README.md)
   - [DEPLOYMENT.md](./DEPLOYMENT.md)
