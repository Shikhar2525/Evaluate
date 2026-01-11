# Deploy on Vercel (Complete Guide)

## Overview
Deploy your Next.js frontend on **Vercel for free** with automatic deployments from GitHub.

**Cost: $0/month**
**Bandwidth: 100GB/month (free tier)**
**Latency: Global CDN**

---

## Step 1: Create GitHub Repository

### 1.1 Initialize Git
```bash
cd c:\Users\shikh\Desktop\Evaluate\Evaluate

git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial commit: Interview Evaluation System"
git branch -M main
```

### 1.2 Create GitHub Repo
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `evaluate-interview-system`
3. Description: `Interview Evaluation System - NestJS + Next.js`
4. Keep it **Public** (better for free CI/CD)
5. Click **Create repository**

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/evaluate-interview-system.git
git push -u origin main
```

---

## Step 2: Setup Backend (Required for Vercel Frontend)

### Option A: Use Render.com (FREE, Recommended)

#### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### 2.2 Create PostgreSQL Database
1. Click **New +** → **PostgreSQL**
2. Configuration:
   - **Name**: `interview-db`
   - **Database**: `interview_db`
   - **User**: `postgres`
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: 15
3. Click **Create Database**
4. Wait ~2 minutes for setup
5. Copy the **Internal Database URL**

#### 2.3 Create Web Service for Backend
1. Click **New +** → **Web Service**
2. Connect GitHub repository
3. Select your `evaluate-interview-system` repo
4. Configuration:
   - **Name**: `evaluate-backend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```bash
     cd backend && npm install && npm run build
     ```
   - **Start Command**: 
     ```bash
     cd backend && npm run prod
     ```
   - **Instance Type**: `Free`

#### 2.4 Add Environment Variables
In Render Dashboard → Your Service → **Environment**:

```
DB_HOST=your-database-internal-url-host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=interview_db
JWT_SECRET=your-super-secret-random-string-minimum-32-characters
PORT=3001
FRONTEND_URL=https://your-username.github.io/evaluate-interview-system
NODE_ENV=production
```

**Get these values from:**
- Render Dashboard → PostgreSQL instance → **Connection** tab

#### 2.5 Deploy Backend
1. Render auto-deploys when you push to GitHub
2. Your backend URL: `https://evaluate-backend.onrender.com`

---

## Step 3: Update Backend Configuration

### 3.1 Update CORS in Backend
Edit [backend/src/main.ts](backend/src/main.ts):

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for GitHub Pages
  app.enableCors({
    origin: [
      'https://your-username.github.io',
      'https://your-username.github.io/evaluate-interview-system',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  await app.listen(3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
```

**Push this change:**
```bash
git add backend/src/main.ts
git commit -m "Update CORS for GitHub Pages deployment"
git push origin main
```

---

## Step 4: Prepare Frontend for Deployment

### 4.1 Update Frontend Configuration
Edit [frontend/next.config.js](frontend/next.config.js):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // For GitHub Pages deployment
  output: 'export',
  basePath: '/evaluate-interview-system',
  assetPrefix: '/evaluate-interview-system/',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

### 4.2 Update Environment Variables
Edit [frontend/.env.local](frontend/.env.local):

```env
NEXT_PUBLIC_API_URL=https://evaluate-backend.onrender.com
NEXT_PUBLIC_BASE_PATH=/evaluate-interview-system
```

### 4.3 Update API Calls (if needed)
If you have hardcoded API calls, make sure they use the environment variable:

```typescript
// Good ✅
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Bad ❌
const API_URL = 'http://localhost:3001';
```

---

## Step 5: Create GitHub Actions Workflow for Vercel

### 5.1 Create Workflow File
Create [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy to Vercel
        run: |
          cd frontend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 5.2 Add Secrets to GitHub
1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel org ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

**How to get these tokens:**
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a new token and copy it → Add as `VERCEL_TOKEN`
3. Go to Vercel project settings → **General** → Copy IDs

---

## Alternative: Manual Vercel Deployment (Easier)

### 6.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 6.2 Connect to Vercel
```bash
cd frontend
vercel link
```

### 6.3 Set Environment Variables
```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://evaluate-backend.onrender.com
```

### 6.4 Deploy
```bash
vercel --prod
```

Your frontend will be deployed at:
```
https://evaluate-interview-system.vercel.app
```

---

## Step 6: Update Backend CORS Again

Once you have your Vercel URL, update backend CORS:

Edit [backend/src/main.ts](backend/src/main.ts):

```typescript
app.enableCors({
  origin: [
    'https://evaluate-interview-system.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
});
```

Push changes:
```bash
git add backend/src/main.ts
git commit -m "Update CORS for Vercel deployment"
git push origin main
```

Render will auto-redeploy the backend.

---

## Step 7: Test Deployment

### 7.1 Test Frontend
```
https://evaluate-interview-system.vercel.app
```

### 7.2 Test Backend Connection
```bash
# Check backend health
curl https://evaluate-backend.onrender.com

# Or in browser
https://evaluate-backend.onrender.com
```

### 7.3 Verify Features
- [ ] Sign up works
- [ ] Create template works
- [ ] Add questions works
- [ ] Conduct interview works
- [ ] Save feedback works
- [ ] Data persists

---

## Complete Architecture

```
┌─────────────────────────────────────────┐
│         Your GitHub Repository          │
│  (Code + CI/CD Workflows)               │
└─────┬───────────────────────────────┬───┘
      │                               │
      ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│  Vercel (Frontend)   │      │  Render (Backend)    │
│  Next.js App         │      │  NestJS API          │
│  https://your-url.   │      │  https://..          │
│  vercel.app          │      │  onrender.com        │
└──────────┬───────────┘      └────────┬─────────────┘
           │                           │
           └──────────────┬────────────┘
                          ▼
                  ┌──────────────────┐
                  │  Render Database │
                  │  PostgreSQL      │
                  └──────────────────┘
```

---

## Deployment Summary

| Component | Host | Cost | URL |
|-----------|------|------|-----|
| Frontend | Vercel | Free | `your-project.vercel.app` |
| Backend | Render | Free | `your-backend.onrender.com` |
| Database | Render | Free | Managed by Render |
| Repo | GitHub | Free | `github.com/username/repo` |

**Total: $0/month**

---

## Troubleshooting

### Frontend shows 404
- Check `basePath` in `next.config.js`
- Ensure `assetPrefix` is set correctly
- Run `npm run build` locally to test

### Can't connect to backend
- Verify backend URL in `.env.local`
- Check CORS settings in `main.ts`
- Ensure backend is deployed and running
- Check browser console for CORS errors

### Database won't connect
- Verify Render database is running
- Check credentials in environment variables
- Run SQL setup script in Render dashboard

### Vercel deployment fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure `next.config.js` is valid
- Check for Node.js version compatibility

---

## Monitoring

### Vercel Deployments
Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- View deployment history
- Check build logs
- Monitor performance

### Render Service
Dashboard: [render.com/dashboard](https://render.com/dashboard)
- View backend logs
- Check database health
- Monitor resource usage

### GitHub Actions
Go to repo → **Actions** tab
- View workflow runs
- See deployment status
- Access deployment logs

