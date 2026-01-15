# Free Deployment Guide

**Author:** Shikhar Mandloi, Senior Software Engineer

**Live Demo:** [http://evaluate-nine.vercel.app/](http://evaluate-nine.vercel.app/)

## Overview
Deploy your Interview Evaluation System for **free with maximum storage** using the following stack:

| Component | Service | Plan | Cost | Storage |
|-----------|---------|------|------|---------|
| **Frontend (Next.js)** | Vercel or Netlify | Free | $0 | 100GB/month bandwidth |
| **Backend (NestJS)** | Render.com | Free | $0 | Auto-sleep (wake on request) |
| **Database (PostgreSQL)** | Supabase | Free | $0 | 500MB to 8GB (depends on usage) |
| **Repository** | GitHub | Free | $0 | Unlimited |
| **File Storage** | Supabase Storage | Free | $0 | 1GB included |

---

## Step 1: Push Code to GitHub

### 1.1 Create GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Create repository named `evaluate-interview-system`
3. Keep it public (for free CI/CD benefits)

### 1.2 Initialize Git and Push
```bash
cd c:\Users\shikh\Desktop\Evaluate\Evaluate

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: Interview Evaluation System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/evaluate-interview-system.git
git push -u origin main
```

---

## Step 2: Setup Database (Supabase - FREE)

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up (free tier: 500MB-8GB)
2. Create new project
3. Wait for database setup (~2 minutes)

### 2.2 Get Connection Details
1. Go to **Project Settings → Database**
2. Copy connection string or individual details:
   - **Host**: `[project].supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Shown in project setup

### 2.3 Create Tables in Supabase SQL Editor
1. Go to **SQL Editor** in Supabase Dashboard
2. Run the SQL from [DATABASE_SETUP.md](DATABASE_SETUP.md)
3. Tables will be created automatically

### 2.4 Update Backend .env
```env
# Database - Supabase
DB_HOST=your-project.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres

# JWT & API
JWT_SECRET=generate-a-random-long-string-here
PORT=3001
FRONTEND_URL=https://your-frontend-url.vercel.app

# Optional: AI Services
OPENAI_API_KEY=your-key (optional, leave blank for no AI)
HUGGINGFACE_API_KEY=your-key (optional)
```

---

## Step 3: Deploy Backend (Render.com - FREE)

### 3.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for automatic deploys)

### 3.2 Create Web Service
1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `evaluate-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run prod`
   - **Instance Type**: `Free` (auto-sleeps after 15 min inactivity)

### 3.3 Add Environment Variables
1. In Render dashboard, click your service
2. Go to **Environment**
3. Add all variables from your `.env` file:
   ```
   DB_HOST=your-project.supabase.co
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=xxxxx
   DB_NAME=postgres
   JWT_SECRET=your-random-secret
   PORT=3001
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

### 3.4 Deploy
1. Render automatically deploys on git push
2. Your backend URL will be: `https://evaluate-backend.onrender.com`
3. **First request may take 50s** (cold start) - normal on free tier

---

## Step 4: Deploy Frontend (Vercel - FREE)

### 4.1 Deploy with Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **New Project**
4. Select your GitHub repository
5. Configure:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `frontend`

### 4.2 Add Environment Variables
1. In project settings → **Environment Variables**
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://evaluate-backend.onrender.com
   ```

### 4.3 Deploy
1. Click **Deploy**
2. Vercel automatically builds and deploys
3. Your frontend URL: `https://your-project.vercel.app`

---

## Step 5: Update Configuration

### 5.1 Update Frontend Environment
Update [frontend/.env.local](frontend/.env.local):
```env
NEXT_PUBLIC_API_URL=https://evaluate-backend.onrender.com
```

### 5.2 Update Backend CORS (if needed)
In [backend/src/main.ts](backend/src/main.ts), verify CORS is enabled for your Vercel domain:
```typescript
app.enableCors({
  origin: ['https://your-project.vercel.app', 'http://localhost:3000'],
  credentials: true,
});
```

---

## Step 6: Post-Deployment Checklist

### Test Your Deployment
```bash
# Test backend health
curl https://evaluate-backend.onrender.com/health

# Test in browser
https://your-project.vercel.app
```

### Verify Features
- [ ] Sign up works
- [ ] Create template works
- [ ] Add questions works
- [ ] Conduct interview works
- [ ] Save feedback works
- [ ] Database persists data

---

## Cost Summary (All Free!)

| Service | Free Tier Limit | Notes |
|---------|-----------------|-------|
| **Render Backend** | Unlimited requests | Auto-sleeps after 15 min (OK for small projects) |
| **Vercel Frontend** | 100GB bandwidth/month | Plenty for most projects |
| **Supabase Database** | 500MB-8GB | Scales based on usage, generous for free |
| **GitHub** | Unlimited repos/CI | Standard free tier |
| **Supabase Storage** | 1GB | For file uploads (if added later) |

**Total Cost: $0/month**

---

## Upgrade Options (If Needed)

### If Render backend sleeps too much:
- Upgrade to **Render paid** ($7/month) - always on
- Or use **Railway** ($5/month) free credits

### If Database gets full (>8GB):
- Upgrade Supabase (**$25/month**) - 100GB
- Or use **Railway** (**$5/month**) - more resources

### If Frontend needs more bandwidth:
- Vercel is already very generous (100GB)
- Upgrade only if you exceed limits

---

## Monitoring & Logs

### Render Logs
1. Go to Render Dashboard
2. Click your service
3. See real-time logs

### Vercel Logs
1. Go to Vercel Dashboard
2. Select your project
3. **Deployments** → View logs

### Database Health
1. Supabase Dashboard
2. **Database** → **Health** tab

---

## Important Notes

⚠️ **Free Tier Limitations:**
- Render: Auto-sleeps after 15 minutes of inactivity (first request takes ~50s)
- Supabase: Limited to 8GB storage (usually not an issue for text/feedback data)
- Vercel: Limited to 100GB bandwidth (plenty for most users)

✅ **Recommendations:**
- Monitor free tier usage in dashboards
- Set up email alerts for limits
- Keep backups of database

---

## Support & Troubleshooting

### Backend won't start?
1. Check Render logs: `Settings → Logs`
2. Verify DB credentials in environment variables
3. Check if all tables exist in Supabase

### Frontend can't connect to backend?
1. Verify `NEXT_PUBLIC_API_URL` is correct in Vercel
2. Check CORS settings in `backend/src/main.ts`
3. Ensure backend URL is accessible

### Database connection fails?
1. Verify Supabase credentials are correct
2. Check if IP is whitelisted (Supabase auto-allows all IPs on free tier)
3. Test connection with Supabase Studio

