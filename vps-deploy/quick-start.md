# ⚡ Quick Start - Deploy em 5 minutos

## 📦 O que você precisa

- [ ] VPS com Ubuntu (IP: `_______________`)
- [ ] Domínio (opcional): `_______________`
- [ ] Acesso SSH configurado
- [ ] Repositório GitHub conectado no Lovable

## 🚀 Comandos

### 1. No Lovable:

1. Clique em **GitHub → Connect to GitHub**
2. Clique em **Create Repository**
3. Copie a URL do repositório (ex: `https://github.com/seu-usuario/medical-system.git`)

### 2. Na VPS (via SSH):

```bash
# Conectar via SSH
ssh root@SEU_IP

# Baixar e executar o script de deploy
curl -o deploy-temp.sh https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/vps-deploy/deploy.sh
chmod +x deploy-temp.sh
./deploy-temp.sh https://github.com/SEU_USUARIO/SEU_REPO.git

# OU clone manualmente e execute:
git clone https://github.com/SEU_USUARIO/SEU_REPO.git /var/www/medical-system
cd /var/www/medical-system

# Configurar domínio/IP no Nginx
nano vps-deploy/nginx.conf
# Altere: server_name seu-dominio.com;

# Copiar arquivo de ambiente
cp vps-deploy/.env.production.example .env.production

# Executar deploy
chmod +x vps-deploy/deploy.sh
./vps-deploy/deploy.sh https://github.com/SEU_USUARIO/SEU_REPO.git
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
