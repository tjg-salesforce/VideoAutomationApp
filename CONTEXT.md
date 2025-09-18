# Video Automation Platform - Development Context

## Project Overview
**Project Name**: Video Automation Platform (Code Name: "Vibe-Code")  
**Purpose**: Web-based collaborative video automation platform for Salesforce Solutions Engineers  
**Goal**: Reduce video creation time from 80+ hours to < 1 hour through automation and collaboration  

## Current Status (Session Summary)

### ✅ COMPLETED
1. **Project Structure**: Created `/backend` and `/frontend` directories
2. **Backend Infrastructure**: 
   - Node.js/Express.js server deployed on Heroku
   - PostgreSQL database with Heroku addon
   - Full CRUD API endpoints for projects, templates, components
   - Database migrations and seeding completed
3. **Authentication**: Git configured with `tjg-salesforce` user
4. **Deployment**: Backend live at `video-automation-backend-7178f3c7577d.herokuapp.com`

### 🔄 NEXT TASK
**Frontend Development**: Set up Next.js frontend with React

### ⏳ REMAINING (Month 1)
- Amazon SQS job queue integration
- Basic FFmpeg rendering microservice

## Technical Details

### Backend Architecture
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Heroku Postgres Essential-0)
- **Deployment**: Heroku
- **API**: RESTful endpoints with JSON responses

### Database Schema
```sql
-- Three main tables with UUID primary keys
projects (id, name, description, template_id, status, created_at, updated_at, created_by, metadata)
templates (id, name, description, category, duration, created_at, updated_at, metadata)
components (id, name, type, category, file_path, duration, created_at, updated_at, metadata)
```

### Working API Endpoints
- `GET /health` - Health check
- `GET /api/templates` - List templates
- `GET /api/components` - List components  
- `GET /api/projects` - List projects
- Full CRUD operations for all three entities

### Sample Data (Seeded)
- 2 templates: "Sales Demo - Product Overview", "Training Video - Process Walkthrough"
- 4 components: "Salesforce Logo", "Success Sound Effect", "Fade In Transition", "Corporate Background"

## File Structure
```
/Users/tgrossman/Documents/Cursor/VideoAutomation/
├── PROJECT_OVERVIEW.md          # Main project documentation
├── CONTEXT.md                   # This context file
├── backend/                     # Node.js backend
│   ├── server.js               # Main Express server
│   ├── package.json            # Dependencies and scripts
│   ├── Procfile               # Heroku deployment config
│   ├── app.json               # Heroku app manifest
│   ├── config/
│   │   └── postgres.js        # Database connection
│   ├── models/                # PostgreSQL models
│   │   ├── ProjectPG.js
│   │   ├── TemplatePG.js
│   │   └── ComponentPG.js
│   ├── routes/                # API routes
│   │   ├── projects.js
│   │   ├── templates.js
│   │   └── components.js
│   └── scripts/               # Database utilities
│       └── migrations.js      # Create tables and seed data
└── frontend/                   # Next.js frontend (to be created)
```

## Key Decisions Made
1. **Database**: Switched from Firebase to PostgreSQL due to corporate Google account restrictions
2. **Deployment**: Using Heroku due to Salesforce access
3. **Authentication**: Using `tjg-salesforce` Git user
4. **Architecture**: Hybrid microservices with API-first approach

## Environment Variables (Backend)
```bash
PORT=3001
DATABASE_URL=postgres://... (Heroku provides this)
NODE_ENV=production
```

## Common Commands
```bash
# Backend development
cd /Users/tgrossman/Documents/Cursor/VideoAutomation/backend
npm run dev                    # Start development server
npm start                     # Start production server

# Database operations
node scripts/migrations.js    # Run migrations and seed data

# Heroku deployment
git add .
git commit -m "message"
git push heroku main          # Deploy to Heroku

# Test API endpoints
curl https://video-automation-backend-7178f3c7577d.herokuapp.com/health
curl https://video-automation-backend-7178f3c7577d.herokuapp.com/api/templates
```

## Next Steps for New Session
1. **Immediate**: Set up Next.js frontend in `/frontend` directory
2. **Then**: Create basic UI components (dashboard, project list, template selector)
3. **Then**: Connect frontend to backend API
4. **Then**: Implement SQS job queue for video rendering
5. **Then**: Create basic FFmpeg rendering service

## Important Notes
- Backend is fully functional and deployed
- Database is seeded with sample data
- All API endpoints are working and tested
- Git is configured with correct user (`tjg-salesforce`)
- Heroku app is live and accessible
- Ready to start frontend development

## Troubleshooting
- If backend won't start: Check `DATABASE_URL` environment variable
- If API returns errors: Check Heroku logs with `heroku logs --tail`
- If database issues: Run migrations again with `node scripts/migrations.js`
- If Git issues: Verify user with `git config user.name` and `git config user.email`

---
*This context file should be read at the start of each new development session to understand current progress and next steps.*
