#!/bin/bash

# Lunomi - Railway Deployment Script
# Dit script helpt bij het voorbereiden van de deployment

echo "🚀 Lunomi Railway Deployment Prep"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Lunomi crypto dashboard"
    git branch -M main
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check for .env files
echo ""
echo "🔐 Checking environment files..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating from example..."
    cp backend/.env.example backend/.env
    echo "⚠️  IMPORTANT: Update backend/.env with your actual values before deploying!"
else
    echo "✅ backend/.env exists"
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  frontend/.env not found. Creating from example..."
    cp frontend/.env.example frontend/.env
else
    echo "✅ frontend/.env exists"
fi

# Check if Railway CLI is installed
echo ""
echo "🚂 Checking Railway CLI..."
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI is installed"
    railway --version
else
    echo "⚠️  Railway CLI not found"
    echo " Install it with: npm install -g @railway/cli"
    echo "   Or visit: https://docs.railway.app/guides/cli"
fi

echo ""
echo "📋 Next steps:"
echo "1. Review and update backend/.env with production values"
echo "2. Push to GitHub: git push -u origin main"
echo "3. Go to https://railway.app and create a new project"
echo "4. Deploy from GitHub repository"
echo "5. Add PostgreSQL and Redis services"
echo "6. Configure environment variables in Railway dashboard"
echo "7. Generate domains for backend and frontend"
echo "8. Update CORS_ORIGIN with frontend domain"
echo ""
echo " See DEPLOYMENT.md for detailed instructions"
