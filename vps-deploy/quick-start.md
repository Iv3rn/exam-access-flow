# ⚡ Quick Start - Deploy em 5 minutos

## 📦 O que você precisa

- [ ] VPS com Ubuntu (IP: `_______________`)
- [ ] Domínio (opcional): `_______________`
- [ ] Acesso SSH configurado

## 🚀 Comandos

### 1. Na sua máquina local:

```bash
# Fazer upload do projeto para a VPS
scp -r ./* root@SEU_IP:/root/medical-system/
```

### 2. Na VPS (via SSH):

```bash
# Conectar via SSH
ssh root@SEU_IP

# Mover para /var/www
mv /root/medical-system /var/www/

# Configurar domínio/IP no Nginx
cd /var/www/medical-system
nano vps-deploy/nginx.conf
# Altere: server_name seu-dominio.com;
# Para:   server_name SEU_DOMINIO_OU_IP;

# Copiar arquivo de ambiente
cp vps-deploy/.env.production.example .env.production

# Executar deploy
chmod +x vps-deploy/deploy.sh
./vps-deploy/deploy.sh
```

### 3. Acessar:

```
http://SEU_IP ou http://SEU_DOMINIO
```

## 🔒 Adicionar HTTPS (Recomendado):

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d seu-dominio.com
```

## ✅ Pronto!

O sistema está rodando com:
- ✅ Frontend na VPS
- ✅ Backend no Lovable Cloud
- ✅ Banco de dados gerenciado
- ✅ Storage gerenciado
- ✅ Autenticação gerenciada

---

**Tempo total**: ~5 minutos  
**Custo VPS**: ~$5/mês (DigitalOcean, Vultr, etc)  
**Backend**: Grátis (Lovable Cloud)
