# Deployment Guide

This guide will help you deploy the Video Automation Platform to production.

## Architecture

- **Backend**: Node.js/Express API (deploy to Heroku)
- **Frontend**: Next.js app (deploy to Vercel - recommended, or Netlify)
- **Database**: PostgreSQL (Heroku Postgres addon)

## Prerequisites

1. Heroku account (for backend)
2. Vercel account (for frontend) - or Netlify
3. GitHub repository access

## Step 1: Deploy Backend to Heroku

### 1.1 Login to Heroku
```bash
heroku login
```

### 1.2 Create/Check Heroku App
```bash
# Check if app exists
heroku apps:info

# If app doesn't exist, create it
heroku create video-automation-backend
# Or use existing app name
```

### 1.3 Add PostgreSQL Database
```bash
heroku addons:create heroku-postgresql:mini
```

### 1.4 Set Environment Variables
```bash
# Set Node environment
heroku config:set NODE_ENV=production

# Database URL is automatically set by Heroku Postgres addon
# Verify it exists:
heroku config:get DATABASE_URL
```

### 1.5 Run Database Migrations
```bash
# After deployment, run migrations via API endpoint
curl -X POST https://your-app.herokuapp.com/api/migrate
```

### 1.6 Deploy Backend
```bash
# Make sure you're on main branch
git checkout main

# Deploy to Heroku
git push heroku main
```

### 1.7 Verify Backend
```bash
# Check logs
heroku logs --tail

# Test health endpoint
curl https://your-app.herokuapp.com/health
```

## Step 2: Update Backend CORS for Production

Update `backend/server.js` to allow your production frontend URL:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', // Keep for local dev
    'http://localhost:3001',
    'http://localhost:3005',
    'https://your-frontend.vercel.app', // Add your Vercel URL
    // Add any other production domains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Then commit and redeploy:
```bash
git add backend/server.js
git commit -m "Update CORS for production frontend"
git push heroku main
```

## Step 3: Deploy Frontend to Vercel

### 3.1 Install Vercel CLI (if not installed)
```bash
npm i -g vercel
```

### 3.2 Login to Vercel
```bash
vercel login
```

### 3.3 Deploy Frontend
```bash
cd frontend
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No** (first time) or **Yes** (if updating)
- Project name? `video-automation-frontend` (or your choice)
- Directory? `./frontend` (or just `.` if already in frontend)
- Override settings? **No**

### 3.4 Set Environment Variables in Vercel

Go to Vercel dashboard → Your Project → Settings → Environment Variables

Add:
```
NEXT_PUBLIC_API_URL=https://your-backend.herokuapp.com
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key (if using AI features)
```

### 3.5 Redeploy with Environment Variables
```bash
vercel --prod
```

## Step 4: Alternative - Deploy Frontend to Netlify

If you prefer Netlify:

### 4.1 Install Netlify CLI
```bash
npm i -g netlify-cli
```

### 4.2 Login
```bash
netlify login
```

### 4.3 Create netlify.toml in frontend directory
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/projects/:id/watch"
  to = "/projects/:id/edit?view=preview"
  status = 200
```

### 4.4 Deploy
```bash
cd frontend
netlify deploy --prod
```

### 4.5 Set Environment Variables
In Netlify dashboard → Site settings → Environment variables

## Step 5: Update Frontend API URL

After deploying backend, update the frontend to use the production API URL.

The frontend reads from `NEXT_PUBLIC_API_URL` environment variable. Make sure it's set in your deployment platform.

## Step 6: Run Database Migrations

After backend is deployed, run migrations:

```bash
# Via API
curl -X POST https://your-backend.herokuapp.com/api/migrate

# Or via Heroku CLI
heroku run node -e "require('./config/postgres').initializePostgres(); require('./server').app.listen(3001);"
```

## Step 7: Verify Deployment

1. **Backend Health Check**: `https://your-backend.herokuapp.com/health`
2. **Frontend**: `https://your-frontend.vercel.app`
3. **Test API Connection**: Frontend should load projects from backend
4. **Test Database**: Create a project and verify it saves

## Environment Variables Summary

### Backend (Heroku)
- `NODE_ENV=production`
- `DATABASE_URL` (auto-set by Heroku Postgres)
- `PORT` (auto-set by Heroku)

### Frontend (Vercel/Netlify)
- `NEXT_PUBLIC_API_URL=https://your-backend.herokuapp.com`
- `NEXT_PUBLIC_GEMINI_API_KEY=your-key` (optional, for AI features)

## Troubleshooting

### Backend Issues
- Check logs: `heroku logs --tail`
- Check database: `heroku pg:psql`
- Verify migrations ran: Check if `folders` table exists

### Frontend Issues
- Check build logs in Vercel/Netlify dashboard
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check browser console for CORS errors

### CORS Errors
- Make sure frontend URL is in backend CORS allowed origins
- Redeploy backend after CORS changes

## Continuous Deployment

### Option 1: Manual Deployment
- Push to `main` branch
- Manually deploy: `git push heroku main` and `vercel --prod`

### Option 2: Auto-Deploy from GitHub
- **Heroku**: Connect GitHub repo in Heroku dashboard → Enable auto-deploy from `main`
- **Vercel**: Connect GitHub repo in Vercel dashboard → Auto-deploy on push to `main`

## Keeping Dev and Production Separate

- **Local Development**: Use `dev` branch, runs on `localhost:3000` and `localhost:3001`
- **Production**: Use `main` branch, deployed to Heroku and Vercel
- Merge `dev` → `main` when ready to deploy

