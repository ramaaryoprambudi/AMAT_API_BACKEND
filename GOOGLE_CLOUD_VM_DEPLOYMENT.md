# 🚀 Google Cloud VM Deployment Guide - Personal Finance API

## ✅ Pre-Deployment Checklist

### 📋 Code Readiness Status
- ✅ **Environment-based Logging**: Conditional logging implemented
- ✅ **Production Environment**: `.env.production` template ready
- ✅ **Security Features**: All security middleware active
- ✅ **Database Scripts**: Production SQL scripts ready
- ✅ **Error Handling**: Production-safe error responses
- ✅ **Dependencies**: All packages properly defined
- ✅ **Clean Code**: Debugging logs removed

### 🗂️ Files Ready for Production:
```
src/                          - Application source code
├── app.js                   ✅ Production logging
├── config/db.js            ✅ Environment-based config
├── controllers/             ✅ Clean controllers
├── models/                  ✅ Optimized models
├── middleware/              ✅ Security middleware
└── routes/                  ✅ API routes

SQL Files:
├── production_database_setup.sql    ✅ Database setup
├── security_setup.sql              ✅ Security config
├── backup_restore.sql              ✅ Maintenance
└── database_migration.sql          ✅ Migration system

Config Files:
├── package.json            ✅ Production scripts
├── .env.production         ✅ Environment template
├── .gitignore             ✅ Security exclusions
└── PRODUCTION.md          ✅ Deployment docs
```

---

## 🔧 Step 1: Create Google Cloud VM Instance

### 1.1 Create VM Instance
```bash
# Using gcloud CLI
gcloud compute instances create personal-finance-api \
    --zone=asia-southeast2-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-standard \
    --tags=http-server,https-server \
    --metadata=startup-script='#!/bin/bash
    apt-get update
    apt-get install -y curl git'
```

### 1.2 Via Google Cloud Console
1. **Compute Engine** → **VM instances** → **Create Instance**
2. **Configuration:**
   - Name: `personal-finance-api`
   - Region: `asia-southeast2` (Jakarta)
   - Zone: `asia-southeast2-a`
   - Machine type: `e2-medium` (2 vCPUs, 4GB RAM)
   - Boot disk: `Ubuntu 20.04 LTS` (20GB)
   - Firewall: ✅ Allow HTTP, ✅ Allow HTTPS

### 1.3 Reserve Static IP (Optional)
```bash
gcloud compute addresses create personal-finance-api-ip \
    --region=asia-southeast2
```

---

## 🔨 Step 2: Setup VM Environment

### 2.1 Connect to VM
```bash
# Via gcloud
gcloud compute ssh personal-finance-api --zone=asia-southeast2-a

# Or via browser SSH from Console
```

### 2.2 Install Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL 8.0
sudo apt update
sudo apt install -y mysql-server

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Install UFW firewall
sudo ufw enable
```

### 2.3 Configure MySQL
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql -u root -p

# Create database and user (run SQL commands from our scripts)
```

---

## 📦 Step 3: Deploy Application

### 3.1 Clone Repository
```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone your repository
sudo git clone https://github.com/ramaaryoprambudi/AMAT_API_BACKEND.git personal-finance-api
cd personal-finance-api

# Set ownership
sudo chown -R $USER:$USER /var/www/personal-finance-api
```

### 3.2 Install Dependencies
```bash
# Install production dependencies
npm install --production

# Or install all and build
npm install
```

### 3.3 Setup Environment
```bash
# Copy production environment
cp .env.production .env

# Edit with your production values
nano .env
```

**Production .env Example:**
```env
NODE_ENV=production
DB_HOST=localhost
DB_USER=finance_app
DB_PASSWORD=YourStrongPassword123!
DB_NAME=personal_finance
DB_PORT=3306
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

JWT_SECRET=your_super_secure_jwt_secret_production_2024_very_long_random_string
JWT_EXPIRES_IN=7d

ADMIN_EMAILS=admin@yourdomain.com
```

### 3.4 Setup Database
```bash
# Import production database
mysql -u root -p < production_database_setup.sql

# Setup security
mysql -u root -p < security_setup.sql

# Setup migration system
mysql -u root -p personal_finance < database_migration.sql
```

---

## 🔄 Step 4: Configure Process Management

### 4.1 Create PM2 Ecosystem
```bash
# Create ecosystem.config.js
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'personal-finance-api',
    script: 'src/app.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '512M',
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
```

### 4.2 Start Application
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the instructions shown

# Monitor
pm2 status
pm2 logs
```

---

## 🌐 Step 5: Configure Nginx Reverse Proxy

### 5.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/personal-finance-api
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/api/health;
    }

    # File upload size
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
}
```

### 5.2 Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/personal-finance-api /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔒 Step 6: Configure Firewall

### 6.1 Setup UFW Rules
```bash
# Allow SSH
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow MySQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 3306

# Block direct access to Node.js port
sudo ufw deny 3000

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### 6.2 Google Cloud Firewall
```bash
# Create firewall rules
gcloud compute firewall-rules create allow-personal-finance-api \
    --allow tcp:80,tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP and HTTPS to Personal Finance API"
```

---

## 🔐 Step 7: SSL Certificate (Let's Encrypt)

### 7.1 Install Certbot
```bash
sudo apt install -y snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 7.2 Obtain Certificate
```bash
# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

---

## 📊 Step 8: Monitoring & Logging

### 8.1 Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/personal-finance-api
```

**Log Rotation Config:**
```
/var/www/personal-finance-api/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nobody nobody
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 8.2 System Monitoring
```bash
# Install htop for monitoring
sudo apt install -y htop

# Setup MySQL monitoring
sudo apt install -y mytop

# Monitor PM2 processes
pm2 monit
```

---

## 🧪 Step 9: Testing Deployment

### 9.1 Health Check
```bash
# Test API health
curl http://your-domain.com/api/health

# Test with SSL
curl https://your-domain.com/api/health
```

### 9.2 Load Testing
```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Simple load test
ab -n 1000 -c 10 http://your-domain.com/api/health
```

---

## 🔄 Step 10: Maintenance Scripts

### 10.1 Backup Script
```bash
# Create backup script
nano ~/backup.sh
```

**backup.sh:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/personal-finance-api"
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u finance_backup -p personal_finance | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Code backup
tar -czf $BACKUP_DIR/code_backup_$DATE.tar.gz -C /var/www personal-finance-api

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 10.2 Update Script
```bash
# Create update script
nano ~/update.sh
```

**update.sh:**
```bash
#!/bin/bash
cd /var/www/personal-finance-api

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Restart application
pm2 restart personal-finance-api

# Show status
pm2 status

echo "Update completed"
```

### 10.3 Setup Cron Jobs
```bash
# Edit crontab
crontab -e

# Add backup job (daily at 2 AM)
0 2 * * * /home/username/backup.sh

# Add log cleanup (weekly)
0 0 * * 0 pm2 flush
```

---

## ✅ Final Checklist

### 🔍 Production Verification:
- [ ] ✅ API responds on port 80/443
- [ ] ✅ Database connection working
- [ ] ✅ JWT authentication functional
- [ ] ✅ SSL certificate installed
- [ ] ✅ Firewall configured
- [ ] ✅ Process management (PM2) running
- [ ] ✅ Nginx reverse proxy working
- [ ] ✅ Logging configured
- [ ] ✅ Backup system ready
- [ ] ✅ Monitoring tools installed

### 📍 Useful Commands:
```bash
# Check API status
pm2 status
curl https://your-domain.com/api/health

# View logs
pm2 logs
tail -f /var/log/nginx/access.log

# Database connection
mysql -u finance_app -p personal_finance

# System resources
htop
df -h
```

---

## 🚨 Troubleshooting

### Common Issues:
1. **Port 3000 blocked**: Check UFW rules
2. **Database connection failed**: Verify MySQL user credentials
3. **SSL certificate issues**: Check domain DNS settings
4. **PM2 not starting**: Check log files in `/var/www/personal-finance-api/logs/`
5. **Nginx 502 error**: Ensure Node.js app is running on port 3000

### Emergency Recovery:
```bash
# Restart all services
sudo systemctl restart nginx
pm2 restart all
sudo systemctl restart mysql

# Check service status
sudo systemctl status nginx
pm2 status
sudo systemctl status mysql
```

---

**🎉 Your Personal Finance API is now production-ready on Google Cloud VM!**

**📧 Support:** For issues, check logs and error messages first, then refer to the troubleshooting section.