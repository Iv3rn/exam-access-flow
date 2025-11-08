# 🚀 Deploy VPS - Sistema de Exames Médicos

Este guia explica como fazer deploy do sistema em uma VPS usando **Lovable Cloud** como backend.

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ ou Debian 11+
- Acesso root (sudo)
- Repositório GitHub conectado no Lovable
- Domínio apontando para o IP da VPS (opcional, mas recomendado)

## ⚡ Deploy Rápido (2 comandos)

### 1️⃣ Conectar ao GitHub (no Lovable)

1. No Lovable, clique em **GitHub → Connect to GitHub**
2. Autorize o Lovable GitHub App
3. Clique em **Create Repository**
4. Copie a URL do repositório (ex: `https://github.com/seu-usuario/medical-system.git`)

### 2️⃣ Deploy na VPS

```bash
# Conecte-se à VPS
ssh root@seu-ip

# Clone e execute o deploy (substitua pela URL do seu repo)
git clone https://github.com/seu-usuario/seu-repo.git /var/www/medical-system
cd /var/www/medical-system

# Configure seu domínio/IP
nano vps-deploy/nginx.conf
# Altere: server_name seu-dominio.com;

# Copie as variáveis de ambiente
cp vps-deploy/.env.production.example .env.production

# Execute o deploy
chmod +x vps-deploy/deploy.sh
./vps-deploy/deploy.sh https://github.com/seu-usuario/seu-repo.git
```

## ✅ Verificar instalação

Após o script terminar, acesse:
- **HTTP**: `http://seu-ip` ou `http://seu-dominio.com`

Você deverá ver a página de login do sistema.

## 🔒 Configurar HTTPS (Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL (gratuito)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática já está configurada!
```

## 🔄 Atualizar o sistema

Sempre que fizer alterações no Lovable (sincroniza automaticamente com GitHub):

```bash
# Na VPS
cd /var/www/medical-system
sudo ./vps-deploy/deploy.sh https://github.com/seu-usuario/seu-repo.git
```

O script automaticamente faz `git pull` e reconstrói o projeto.

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Navegador     │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  VPS (Nginx)    │
│  Frontend React │
└────────┬────────┘
         │ API
         ▼
┌─────────────────┐
│  Lovable Cloud  │
│  - Supabase     │
│  - Storage      │
│  - Auth         │
└─────────────────┘
```

### O que roda onde?

- **VPS**: Apenas o frontend (HTML/CSS/JS) servido pelo Nginx
- **Lovable Cloud**: Backend completo (banco de dados, autenticação, storage, edge functions)

## 📁 Estrutura de arquivos

```
/var/www/medical-system/        # Código fonte
/var/www/medical-system-dist/   # Build do frontend (servido pelo Nginx)
/etc/nginx/sites-available/medical-system  # Configuração Nginx
/var/log/nginx/medical-system-*.log        # Logs
```

## 🐛 Troubleshooting

### Erro 502 Bad Gateway
```bash
# Verificar logs do Nginx
sudo tail -f /var/log/nginx/medical-system-error.log

# Verificar se o Nginx está rodando
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Página em branco
```bash
# Verificar se o build foi copiado corretamente
ls -la /var/www/medical-system-dist/

# Reexecutar deploy
cd /var/www/medical-system
sudo ./vps-deploy/deploy.sh
```

### Erro de conexão com backend
```bash
# Verificar se as variáveis de ambiente estão corretas
cat .env.production

# As URLs devem apontar para Lovable Cloud (cyefnznhonfqvfepfwew.supabase.co)
```

### Problemas de permissão
```bash
# Corrigir permissões
sudo chown -R www-data:www-data /var/www/medical-system-dist
```

## 🔧 Comandos úteis

```bash
# Ver logs em tempo real
sudo tail -f /var/log/nginx/medical-system-access.log

# Testar configuração Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver status do Nginx
sudo systemctl status nginx

# Fazer backup
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/medical-system-dist
```

## 📊 Monitoramento

### Logs importantes:
- **Nginx Access**: `/var/log/nginx/medical-system-access.log`
- **Nginx Error**: `/var/log/nginx/medical-system-error.log`

### Verificar uso de recursos:
```bash
# CPU e memória
htop

# Espaço em disco
df -h

# Conexões ativas
ss -tunlp | grep nginx
```

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Nginx
2. Confirme que as variáveis de ambiente estão corretas
3. Teste a conectividade com o Lovable Cloud: `curl https://cyefnznhonfqvfepfwew.supabase.co`
4. Verifique o firewall: `sudo ufw status`
