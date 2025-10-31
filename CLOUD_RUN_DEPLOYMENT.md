# 🚀 Google Cloud Run Deployment Guide

## 📋 Overview
Panduan lengkap untuk deploy Personal Finance API ke Google Cloud Run menggunakan Docker container.

## 🏗️ Architecture Overview
```
[Frontend] -> [Cloud Run] -> [Cloud SQL MySQL] -> [Cloud Storage (optional)]
```

## 🔧 Prerequisites

### 1. Google Cloud Setup
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable Required APIs
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  container.googleapis.com
```

---

## 🗄️ Step 1: Setup Cloud SQL Database

### 1.1 Create Cloud SQL Instance
```bash
# Create MySQL 8.0 instance
gcloud sql instances create personal-finance-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=asia-southeast2 \
  --root-password=YOUR_STRONG_ROOT_PASSWORD \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=02:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=03 \
  --maintenance-release-channel=production
```

### 1.2 Create Database and User
```bash
# Connect to Cloud SQL
gcloud sql connect personal-finance-db --user=root

# Run SQL commands:
```
```sql
-- Create database
CREATE DATABASE personal_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user
CREATE USER 'finance_app'@'%' IDENTIFIED BY 'YOUR_APP_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_finance.* TO 'finance_app'@'%';

-- Use database and run setup
USE personal_finance;

-- Copy and paste content from production_database_setup.sql
-- (Create tables, indexes, sample data, etc.)
```

### 1.3 Import Database Schema
```bash
# Upload and import schema (alternative method)
gcloud sql import sql personal-finance-db gs://YOUR_BUCKET/production_database_setup.sql \
  --database=personal_finance
```

---

## 🐳 Step 2: Prepare Docker Container

### 2.1 Update Environment Configuration
Edit `.env.cloudrun` with your actual values:
```env
# Database (Cloud SQL Unix Socket)
DB_HOST=/cloudsql/YOUR_PROJECT_ID:asia-southeast2:personal-finance-db
DB_USER=finance_app
DB_PASSWORD=YOUR_APP_PASSWORD
DB_NAME=personal_finance

# Security
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_64_CHARS_MINIMUM
ALLOWED_ORIGINS=https://your-frontend.com

# Admin
ADMIN_EMAILS=admin@your-domain.com
```

### 2.2 Update Dockerfile (if needed)
The Dockerfile is already optimized for Cloud Run:
- Uses Node.js 18 slim image
- Non-root user for security
- Port 8080 (Cloud Run standard)
- Health check endpoint
- Production optimizations

---

## 🚀 Step 3: Deploy with Cloud Build

### 3.1 Manual Build and Deploy
```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/personal-finance-api

# Deploy to Cloud Run
gcloud run deploy personal-finance-api \
  --image gcr.io/YOUR_PROJECT_ID/personal-finance-api \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 100 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --set-cloudsql-instances YOUR_PROJECT_ID:asia-southeast2:personal-finance-db
```

### 3.2 Automated Deploy with Cloud Build
```bash
# Deploy using cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml
```

### 3.3 Setup Environment Variables
```bash
# Set environment variables for Cloud Run service
gcloud run services update personal-finance-api \
  --region=asia-southeast2 \
  --set-env-vars="$(cat .env.cloudrun | grep -v '^#' | grep -v '^$' | tr '\n' ',')"
```

---

## 🔐 Step 4: Security Configuration

### 4.1 IAM Permissions
```bash
# Create service account for Cloud Run
gcloud iam service-accounts create personal-finance-sa \
  --display-name="Personal Finance API Service Account"

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:personal-finance-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Update Cloud Run service to use service account
gcloud run services update personal-finance-api \
  --region=asia-southeast2 \
  --service-account=personal-finance-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 4.2 Configure HTTPS and Custom Domain (Optional)
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service personal-finance-api \
  --domain api.your-domain.com \
  --region asia-southeast2
```

---

## 📊 Step 5: Monitoring and Logging

### 5.1 Enable Monitoring
```bash
# Cloud Run automatically provides monitoring
# View metrics in Google Cloud Console > Cloud Run > personal-finance-api
```

### 5.2 Setup Alerts
```bash
# Create alert policy for high error rate
gcloud alpha monitoring policies create --policy-from-file=alert-policy.yaml
```

Example `alert-policy.yaml`:
```yaml
displayName: "High Error Rate - Personal Finance API"
conditions:
  - displayName: "Error rate > 5%"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" resource.labels.service_name="personal-finance-api"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.05
      duration: 300s
notificationChannels:
  - projects/YOUR_PROJECT_ID/notificationChannels/YOUR_NOTIFICATION_CHANNEL
```

---

## 🧪 Step 6: Testing Deployment

### 6.1 Get Service URL
```bash
# Get the deployed service URL
gcloud run services describe personal-finance-api \
  --platform managed \
  --region asia-southeast2 \
  --format 'value(status.url)'
```

### 6.2 Test API Endpoints
```bash
# Health check
curl https://YOUR_CLOUD_RUN_URL/api/health

# Register user
curl -X POST https://YOUR_CLOUD_RUN_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST https://YOUR_CLOUD_RUN_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 6.3 Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Simple load test
ab -n 1000 -c 10 https://YOUR_CLOUD_RUN_URL/api/health
```

---

## 🔄 Step 7: CI/CD Pipeline (Optional)

### 7.1 Setup GitHub Actions (if using GitHub)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - id: 'auth'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GCP_SA_KEY }}'
    
    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v1'
    
    - name: 'Build and Deploy'
      run: |
        gcloud builds submit --config cloudbuild.yaml
```

### 7.2 Setup Cloud Build Triggers
```bash
# Create trigger for automatic deployment on git push
gcloud builds triggers create github \
  --repo-name=AMAT_API_BACKEND \
  --repo-owner=ramaaryoprambudi \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

---

## 📝 Step 8: Environment Variables Management

### 8.1 Using Secret Manager (Recommended)
```bash
# Create secrets
echo -n "YOUR_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create db-password --data-file=-

# Update Cloud Run to use secrets
gcloud run services update personal-finance-api \
  --region=asia-southeast2 \
  --set-secrets="JWT_SECRET=jwt-secret:latest,DB_PASSWORD=db-password:latest"
```

### 8.2 Update Application to Use Secrets
Add to your app.js if using Secret Manager:
```javascript
// At the top of app.js
if (process.env.NODE_ENV === 'production') {
  // JWT_SECRET and DB_PASSWORD will be automatically injected by Cloud Run
  // from Secret Manager
}
```

---

## 💰 Step 9: Cost Optimization

### 9.1 Optimize Cloud Run Settings
```bash
# Update with cost-optimized settings
gcloud run services update personal-finance-api \
  --region=asia-southeast2 \
  --memory=256Mi \
  --cpu=0.5 \
  --concurrency=80 \
  --max-instances=5 \
  --min-instances=0
```

### 9.2 Setup Budget Alerts
```bash
# Create budget alert
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Personal Finance API Budget" \
  --budget-amount=50USD \
  --threshold-rules-percent=50,90,100
```

---

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Database Connection Issues
```bash
# Check Cloud SQL status
gcloud sql instances describe personal-finance-db

# Test connection from Cloud Shell
gcloud sql connect personal-finance-db --user=finance_app
```

#### 2. Container Startup Issues
```bash
# Check Cloud Run logs
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=personal-finance-api" --limit=50
```

#### 3. Environment Variables Not Loading
```bash
# Check current environment variables
gcloud run services describe personal-finance-api \
  --region=asia-southeast2 \
  --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)"
```

---

## 📋 Deployment Checklist

### ✅ Pre-deployment:
- [ ] Cloud SQL instance created
- [ ] Database schema imported
- [ ] Environment variables configured
- [ ] Docker image builds successfully
- [ ] APIs enabled

### ✅ Post-deployment:
- [ ] Service responds to health checks
- [ ] Database connection working
- [ ] Authentication endpoints functional
- [ ] CORS configured for frontend
- [ ] Monitoring and alerts setup
- [ ] Domain mapping (if applicable)

---

## 🔧 Useful Commands

```bash
# View service details
gcloud run services describe personal-finance-api --region=asia-southeast2

# Update service with new image
gcloud run services update personal-finance-api \
  --region=asia-southeast2 \
  --image=gcr.io/YOUR_PROJECT_ID/personal-finance-api:latest

# View logs
gcloud logs tail "resource.type=cloud_run_revision" --limit=100

# Delete service (cleanup)
gcloud run services delete personal-finance-api --region=asia-southeast2
```

---

## 🎉 Success!

Your Personal Finance API is now running on Google Cloud Run with:
- ⚡ Automatic scaling (0 to 10 instances)
- 🔒 Secure database connection via Cloud SQL
- 📊 Built-in monitoring and logging
- 💰 Pay-per-use pricing
- 🌐 Global CDN and HTTPS out of the box

**Service URL:** `https://personal-finance-api-RANDOM-HASH-an.a.run.app`

---

## 📞 Support

For issues:
1. Check Cloud Run logs
2. Verify Cloud SQL connectivity
3. Confirm environment variables
4. Test locally with same environment