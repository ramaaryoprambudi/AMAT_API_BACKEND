#!/bin/bash

# Google Cloud Run Deployment Script
# Personal Finance API

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="bara-f786e"
REGION="asia-southeast2"
SERVICE_NAME="personal-finance-api"
DB_INSTANCE_NAME="amat-sql"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All requirements met"
}

# Get project ID
get_project_id() {
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            print_error "No project ID set. Please run: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        fi
    fi
    print_status "Using project: $PROJECT_ID"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required APIs..."
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        sqladmin.googleapis.com \
        container.googleapis.com \
        secretmanager.googleapis.com \
        --quiet
    print_success "APIs enabled"
}

# Create Cloud SQL instance (if doesn't exist)
create_database() {
    print_status "Checking Cloud SQL instance..."
    
    if gcloud sql instances describe $DB_INSTANCE_NAME --quiet &>/dev/null; then
        print_success "Cloud SQL instance already exists"
    else
        print_status "Creating Cloud SQL instance..."
        read -s -p "Enter root password for MySQL: " ROOT_PASSWORD
        echo
        
        gcloud sql instances create $DB_INSTANCE_NAME \
            --database-version=MYSQL_8_0 \
            --tier=db-f1-micro \
            --region=$REGION \
            --root-password=$ROOT_PASSWORD \
            --storage-type=SSD \
            --storage-size=10GB \
            --backup-start-time=02:00 \
            --enable-bin-log \
            --maintenance-window-day=SUN \
            --maintenance-window-hour=03 \
            --maintenance-release-channel=production \
            --quiet
            
        print_success "Cloud SQL instance created"
    fi
}

# Build and deploy the application
build_and_deploy() {
    print_status "Building and deploying application..."
    
    # Copy environment file
    if [ -f ".env.cloudrun" ]; then
        cp .env.cloudrun .env.production
        print_status "Using Cloud Run environment configuration"
    else
        print_warning "No .env.cloudrun file found. Make sure .env.production is configured."
    fi
    
    # Build and deploy using Cloud Build
    gcloud builds submit --config cloudbuild.yaml --substitutions=_REGION=$REGION,_SERVICE_NAME=$SERVICE_NAME,_ARTIFACT_NAME=rest-api-amat-apk
    
    print_success "Application deployed successfully"
}

# Create service account and set permissions
setup_service_account() {
    print_status "Setting up service account..."
    
    SA_NAME="personal-finance-sa"
    SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Create service account if doesn't exist
    if ! gcloud iam service-accounts describe $SA_EMAIL --quiet &>/dev/null; then
        gcloud iam service-accounts create $SA_NAME \
            --display-name="Personal Finance API Service Account" \
            --quiet
    fi
    
    # Grant Cloud SQL Client role
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/cloudsql.client" \
        --quiet
    
    # Update Cloud Run service to use service account
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --service-account=$SA_EMAIL \
        --quiet
    
    print_success "Service account configured"
}

# Test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --format 'value(status.url)')
    
    print_status "Service URL: $SERVICE_URL"
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    if curl -s -f "$SERVICE_URL/api/health" > /dev/null; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        return 1
    fi
    
    print_success "Deployment test completed"
    echo
    echo "🎉 Deployment successful!"
    echo "📍 Service URL: $SERVICE_URL"
    echo "📊 Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
}

# Show logs
show_logs() {
    print_status "Showing recent logs..."
    gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit=20
}

# Main deployment function
deploy() {
    echo "🚀 Starting Google Cloud Run deployment..."
    echo "=================================="
    
    check_requirements
    get_project_id
    enable_apis
    create_database
    build_and_deploy
    setup_service_account
    test_deployment
    
    echo
    echo "✅ Deployment completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Configure your database by connecting to Cloud SQL"
    echo "2. Import your database schema"
    echo "3. Update environment variables if needed"
    echo "4. Test your API endpoints"
}

# Show help
show_help() {
    echo "Personal Finance API - Cloud Run Deployment Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  deploy    Deploy the application to Cloud Run"
    echo "  logs      Show recent application logs"
    echo "  status    Show current deployment status"
    echo "  help      Show this help message"
    echo
    echo "Environment Variables:"
    echo "  PROJECT_ID   Google Cloud Project ID (optional, uses gcloud config)"
    echo
    echo "Examples:"
    echo "  $0 deploy"
    echo "  PROJECT_ID=my-project $0 deploy"
    echo "  $0 logs"
}

# Show status
show_status() {
    print_status "Deployment Status"
    echo "=================="
    
    get_project_id
    
    # Check Cloud SQL
    if gcloud sql instances describe $DB_INSTANCE_NAME --quiet &>/dev/null; then
        print_success "Cloud SQL instance: Running"
    else
        print_warning "Cloud SQL instance: Not found"
    fi
    
    # Check Cloud Run service
    if gcloud run services describe $SERVICE_NAME --region=$REGION --quiet &>/dev/null; then
        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
            --platform managed \
            --region $REGION \
            --format 'value(status.url)')
        print_success "Cloud Run service: Running"
        echo "  URL: $SERVICE_URL"
    else
        print_warning "Cloud Run service: Not found"
    fi
}

# Main script logic
case "${1:-}" in
    "deploy")
        deploy
        ;;
    "logs")
        get_project_id
        show_logs
        ;;
    "status")
        show_status
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac