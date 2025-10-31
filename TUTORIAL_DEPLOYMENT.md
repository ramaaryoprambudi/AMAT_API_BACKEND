# Tutorial Deploy Personal Finance API ke Google Cloud Run

## 📋 Persiapan Awal

### 1. Install Dependencies
Pastikan tools berikut sudah terinstall di sistem Anda:

```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Install Docker
# Untuk macOS: brew install docker
# Untuk Ubuntu: sudo apt-get install docker.io

# Verify installations
gcloud --version
docker --version
```

### 2. Setup Google Cloud Project
```bash
# Login ke Google Cloud
gcloud auth login

# Set project ID (ganti dengan project ID Anda)
gcloud config set project bara-f786e

# Verify current project
gcloud config get-value project
```

## 🚀 Deploy menggunakan Script Otomatis

### 1. Jalankan Deploy Script
```bash
# Berikan permission execute ke script
chmod +x deploy-cloudrun.sh

# Jalankan deployment
./deploy-cloudrun.sh deploy
```

Script akan otomatis:
- ✅ Enable required APIs
- ✅ Create Cloud SQL instance
- ✅ Build dan deploy aplikasi
- ✅ Setup service account
- ✅ Test deployment

### 2. Monitor Status
```bash
# Cek status deployment
./deploy-cloudrun.sh status

# Lihat logs aplikasi
./deploy-cloudrun.sh logs
```

## 🛠️ Deploy Manual (Step by Step)

### Step 1: Enable APIs
```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    container.googleapis.com \
    secretmanager.googleapis.com
```

### Step 2: Create Cloud SQL Instance
```bash
# Create MySQL instance
gcloud sql instances create amat-sql \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=asia-southeast2 \
    --root-password=YOUR_STRONG_PASSWORD \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=02:00
```

### Step 3: Setup Database
```bash
# Connect to Cloud SQL
gcloud sql connect amat-sql --user=root

# Di MySQL shell, jalankan:
CREATE DATABASE personal_finance;
USE personal_finance;

# Import schema (copy paste dari production_database_setup.sql)
```

### Step 4: Create Service Account
```bash
# Create service account
gcloud iam service-accounts create personal-finance-sa \
    --display-name="Personal Finance API Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding bara-f786e \
    --member="serviceAccount:personal-finance-sa@bara-f786e.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"
```

### Step 5: Build dan Deploy
```bash
# Build menggunakan Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Atau manual build dan deploy
gcloud run deploy personal-finance-api \
    --source . \
    --region=asia-southeast2 \
    --allow-unauthenticated \
    --service-account=personal-finance-sa@bara-f786e.iam.gserviceaccount.com \
    --add-cloudsql-instances=bara-f786e:asia-southeast2:amat-sql \
    --set-env-vars="NODE_ENV=production"
```

## 🔧 Konfigurasi Environment Variables

### 1. Cloud Run Environment Variables
Set melalui Google Cloud Console atau CLI:

```bash
gcloud run services update personal-finance-api \
    --region=asia-southeast2 \
    --set-env-vars="
NODE_ENV=production,
PORT=8080,
DB_HOST=/cloudsql/bara-f786e:asia-southeast2:amat-sql,
DB_USER=root,
DB_PASSWORD=YOUR_DB_PASSWORD,
DB_NAME=personal_finance,
JWT_SECRET=your-super-secret-jwt-key,
CORS_ORIGIN=https://yourdomain.com
"
```

### 2. Cloud SQL Connection
Untuk production, gunakan Unix socket:
```
DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

## 📝 Testing Deployment

### 1. Health Check
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe personal-finance-api \
    --region=asia-southeast2 \
    --format='value(status.url)')

# Test health endpoint
curl $SERVICE_URL/api/health
```

### 2. Test API Endpoints
```bash
# Register user
curl -X POST $SERVICE_URL/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }'

# Login
curl -X POST $SERVICE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "password123"
    }'
```

## 🔍 Troubleshooting

### Container Failed to Start
```bash
# Check logs
gcloud logs tail "resource.type=cloud_run_revision" --limit=50

# Common fixes:
# 1. Pastikan app.listen menggunakan port dari environment
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

# 2. Database connection tidak boleh blocking startup
```

### Database Connection Issues
```bash
# Verify Cloud SQL instance
gcloud sql instances describe amat-sql

# Check connection string
# Production: /cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
# Local: localhost:3306
```

### Permission Issues
```bash
# Grant Cloud SQL access
gcloud projects add-iam-policy-binding bara-f786e \
    --member="serviceAccount:personal-finance-sa@bara-f786e.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"
```

## 📊 Monitoring & Maintenance

### 1. View Logs
```bash
# Real-time logs
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=personal-finance-api"

# Historical logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=personal-finance-api" --limit=50
```

### 2. Performance Monitoring
- Gunakan Google Cloud Console
- Navigate ke Cloud Run → personal-finance-api → Metrics
- Monitor CPU, Memory, Request latency

### 3. Update Deployment
```bash
# Update code dan redeploy
git push origin main

# Atau manual update
gcloud run deploy personal-finance-api \
    --source . \
    --region=asia-southeast2
```

## 🔐 Security Best Practices

### 1. Environment Variables
- Jangan hardcode secrets di code
- Gunakan Google Secret Manager untuk sensitive data
- Set CORS_ORIGIN sesuai domain production

### 2. Database Security
```sql
-- Create dedicated user untuk aplikasi
CREATE USER 'api_user'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_finance.* TO 'api_user'@'%';
FLUSH PRIVILEGES;
```

### 3. Cloud Run Security
```bash
# Restrict access (jika diperlukan)
gcloud run services remove-iam-policy-binding personal-finance-api \
    --region=asia-southeast2 \
    --member="allUsers" \
    --role="roles/run.invoker"
```

## 💰 Cost Optimization

### 1. Cloud Run Settings
- Min instances: 0 (untuk development)
- Max instances: 10
- CPU: 1 vCPU
- Memory: 512 MiB

### 2. Cloud SQL Settings
- Tier: db-f1-micro (untuk development)
- Storage: 10GB SSD
- Enable automated backups

### 3. Monitoring Costs
```bash
# Check current usage
gcloud billing budgets list
```

## 🎯 Next Steps

1. **Setup Custom Domain**
   ```bash
   gcloud run domain-mappings create \
       --service=personal-finance-api \
       --domain=api.yourdomain.com \
       --region=asia-southeast2
   ```

2. **Enable HTTPS/SSL**
   - Cloud Run automatically provides SSL certificates
   - Update CORS settings untuk custom domain

3. **Setup CI/CD**
   - GitHub Actions sudah dikonfigurasi
   - Setiap push ke main branch akan auto-deploy

4. **Database Migration Strategy**
   - Versioning untuk database schema
   - Backup strategy sebelum migration

## 📞 Support

Jika mengalami masalah:
1. Check logs: `./deploy-cloudrun.sh logs`
2. Verify status: `./deploy-cloudrun.sh status`
3. Restart service: Redeploy dengan script
4. Contact: ramaaryoprambudi@gmail.com

---

**Happy Coding! 🚀**