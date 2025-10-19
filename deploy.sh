#!/bin/bash

# DigitalOcean App Platform Deployment Script
# This script helps prepare and deploy your chatbot UI to DigitalOcean App Platform

set -e

echo "🚀 DigitalOcean App Platform Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found. Please ensure deployment files are created."
    exit 1
fi

print_status "Project structure verified"

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_warning "Git repository not initialized. Initializing..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Uncommitted changes detected. Committing them..."
    git add .
    git commit -m "Prepare for deployment - $(date)"
fi

print_status "Git repository is clean"

# Run pre-deployment checks
echo ""
echo "🔍 Running pre-deployment checks..."

# Check TypeScript
if command -v npx &> /dev/null; then
    print_status "Running TypeScript check..."
    npx tsc --noEmit || {
        print_error "TypeScript check failed. Please fix errors before deploying."
        exit 1
    }
else
    print_warning "npx not found. Skipping TypeScript check."
fi

# Check linting
if command -v npm &> /dev/null; then
    print_status "Running linting check..."
    npm run lint || {
        print_warning "Linting issues found. Consider running 'npm run lint:fix'"
    }
else
    print_warning "npm not found. Skipping linting check."
fi

# Test build
print_status "Testing production build..."
if command -v npm &> /dev/null; then
    npm run build || {
        print_error "Build failed. Please fix errors before deploying."
        exit 1
    }
    print_status "Build successful"
else
    print_warning "npm not found. Skipping build test."
fi

# Check environment variables
echo ""
echo "🔧 Environment Variables Check"
echo "=============================="

if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    print_warning "NEXT_PUBLIC_API_URL not set. You'll need to set this in DigitalOcean App Platform."
    echo "  Expected format: https://your-backend-api.com"
else
    print_status "NEXT_PUBLIC_API_URL is set: $NEXT_PUBLIC_API_URL"
fi

# Push to remote
echo ""
echo "📤 Pushing to remote repository..."

# Check if remote exists
if ! git remote | grep -q origin; then
    print_warning "No 'origin' remote found. Please add your GitHub/GitLab repository:"
    echo "  git remote add origin https://github.com/yourusername/your-repo.git"
    echo "  git push -u origin main"
    exit 1
fi

# Push to origin
git push origin main || {
    print_error "Failed to push to remote repository. Please check your git configuration."
    exit 1
}

print_status "Code pushed to remote repository"

# Final instructions
echo ""
echo "🎉 Pre-deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Go to https://cloud.digitalocean.com/apps"
echo "2. Click 'Create App'"
echo "3. Connect your GitHub/GitLab repository"
echo "4. Configure the following settings:"
echo "   - Build Command: npm run build"
echo "   - Run Command: npm start"
echo "   - HTTP Port: 3000"
echo "5. Set environment variables:"
echo "   - NEXT_PUBLIC_API_URL: https://your-backend-api.com"
echo "   - NODE_ENV: production"
echo "6. Choose your plan and deploy!"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
print_status "Deployment preparation complete!"
