# Video Automation Platform - Development Context

## ✅ CURRENT WORKING STATE (RESOLVED)
- **Status**: Both frontend and backend are running locally and working perfectly
- **Frontend**: Running on `http://localhost:3000` (Next.js with Turbopack)
- **Backend**: Running on `http://localhost:3001` (Node.js/Express with PostgreSQL)
- **Database**: Connected to Heroku PostgreSQL database with SSL
- **Configuration**: Frontend configured to use local backend via `.env.local`
- **Timeline Features**: Advanced timeline editor with professional-grade features implemented

## 🔧 ISSUE RESOLUTION SUMMARY

### Initial Backend Issues (RESOLVED)
**Problem**: Heroku backend was showing "Application Error" and frontend couldn't connect
**Root Cause**: Heroku deployment issues with SSL configuration and missing environment variables
**Solution**: Switched to local development with Heroku database:
1. Created `.env` file in backend with Heroku DATABASE_URL
2. Fixed SSL configuration in postgres.js for Heroku database
3. Created `.env.local` in frontend to point to local backend
4. Both services now running locally with full database connectivity

### Timeline Editor Issues (RESOLVED)
**Problem**: Missing advanced timeline features after Lottie removal
**Root Cause**: Git restore operations reverted timeline features during Lottie cleanup
**Solution**: Re-implemented all advanced timeline features:
1. **Cross-Layer Drag/Drop**: Fixed layer detection logic with proper Y position calculation
2. **Smart Snapping**: Implemented snap targets for clip boundaries, 0s mark, and scrubber position
3. **Text Stretching**: Fixed zoom scaling to only affect timeline content, not container
4. **Layer Management**: Added editable names, eye toggles, and layer reordering
5. **Visual Feedback**: Added drag preview with snap target information and layer indicators

### Lottie Cleanup Issues (RESOLVED)
**Problem**: Lottie dependency conflicts with CSS-based animation approach
**Root Cause**: Multiple animation systems (Lottie, CSS, Canvas) causing conflicts
**Solution**: Complete removal of Lottie system:
1. Removed `lottie-web` dependency from package.json
2. Deleted LottieRenderer component
3. Updated component registry to remove Lottie references
4. Consolidated all animation logic to CSS-based approach
5. Updated video rendering to use CSS animations with Canvas export

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
5. **Frontend Development**: Complete Next.js frontend with advanced timeline editor
6. **Timeline Editor Features**: Professional-grade video editing interface implemented

### 🔄 NEXT TASK
**Video Rendering**: Implement CSS-based video rendering and export functionality

### ⏳ REMAINING (Month 1)
- Amazon SQS job queue integration
- Basic FFmpeg rendering microservice
- Advanced timeline features (completed in this session)

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

## 🎬 TIMELINE EDITOR FEATURES (COMPLETED)

### Advanced Timeline Interface
- **Zoom Slider**: 25% to 400% zoom with visual feedback
- **Time Markers**: Dynamic time markers that adjust based on zoom level
- **Vertical Scrubber**: Red indicator line showing current playback position
- **Drag/Drop Preview**: Blue preview line with snap target information
- **Layer Management**: Multiple media layers with individual controls
- **Tabbed Timeline System**: Main timeline + group sub-timelines (NEW)

### Smart Snapping System
- **Snap Targets**: 
  - Clip boundaries (start/end of timeline items)
  - 0s mark (beginning of timeline)
  - Current scrubber position
  - Other media item boundaries
- **Snap Threshold**: 0.1 second sensitivity
- **Visual Feedback**: Shows which snap target is being used
- **Grid Fallback**: Falls back to 0.25s grid snapping if no targets found

### Cross-Layer Drag/Drop
- **Media Items**: Can be dragged between different layers
- **Same-Layer Moves**: Repositioning within the same layer
- **Layer Creation**: Automatically creates new layers when needed
- **Component Support**: Components can be dropped on any layer
- **Proper Layer Detection**: Accounts for main component layer offset

### Layer Management
- **Editable Names**: Double-click to edit layer names
- **Eye Icon Toggle**: Show/hide layers in preview
- **Layer Reordering**: Drag horizontal lines (≡) to reorder layers
- **Visual Indicators**: Color-coded layer indicators
- **Layer Visibility**: Hidden layers don't render in preview

### Visual Feedback System
- **Drag Preview**: Blue line with time tooltip and snap target info
- **Layer Indicator**: Horizontal line showing target layer
- **Snap Target Labels**: Shows what you're snapping to
- **Time Tooltips**: Precise time positioning information

### Technical Implementation
- **CSS-Only Animations**: Removed Lottie dependency, using CSS for all motion
- **Canvas Rendering**: For video export with CSS animations
- **Proper Scaling**: Text doesn't stretch when zoomed (scaleX only)
- **State Management**: Comprehensive drag/drop state handling
- **Error Handling**: Robust error handling for edge cases

## 📱 IPHONE SMS COMPONENT (COMPLETED)

### Enhanced User Experience
- **Customer Text Colors**: Fixed white text on blue background for customer messages
- **Placeholder System**: Removed confusing default messages, added helpful placeholder
- **Properties Panel**: Fixed scrolling issues, moved "Add Message" button to bottom
- **Auto-Alternating Senders**: New messages automatically alternate between customer/agent
- **Pixel-Perfect Scaling**: All elements scale proportionally with component scale

### Visual Improvements
- **Agent Text Proportions**: 20% size reduction, removed bold styling for better balance
- **Header Spacing**: Reduced whitespace by 50% for cleaner appearance
- **Message Styling**: Proper iOS-style message bubbles with correct colors
- **Component Scaling**: All elements (text, icons, spacing) scale together perfectly

### Technical Features
- **Component Registry**: iPhone SMS component registered with CSS renderer
- **Property Schemas**: Complete schema for customer/agent names and messages
- **Message Management**: Add/edit/delete messages with proper validation
- **Timeline Integration**: Ready for sub-clip animation system

## 🔧 TIMELINE TAB SYSTEM (IN PROGRESS)

### Foundation Implemented
- **TimelineTab Interface**: Support for main timeline and group sub-timelines
- **TimelineGroup Interface**: Group management with collapsed/expanded states
- **TimelineTabBar Component**: Tab bar with rename, close, and navigation
- **useTimelineTabs Hook**: State management for tabs and groups
- **Project Integration**: Updated Project interface to support tabbed timeline

### Planned Features
- **Group Creation**: Select multiple items and group them together
- **Group Navigation**: Double-click groups to open in new timeline tab
- **SMS Sub-clips**: Auto-generate message animation sub-clips
- **Tab Management**: Rename tabs, close group tabs, switch between timelines

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
└── frontend/                   # Next.js frontend (COMPLETED)
    ├── package.json           # Frontend dependencies
    ├── next.config.ts         # Next.js configuration
    ├── src/
    │   ├── app/               # Next.js app router
    │   │   ├── projects/[id]/edit/page.tsx  # Main timeline editor
    │   │   └── globals.css    # Global styles with timeline CSS
    │   ├── components/        # React components
    │   │   ├── renderers/     # Component renderers
    │   │   │   ├── CanvasRenderer.tsx
    │   │   │   ├── CSSAnimationRenderer.tsx
    │   │   │   ├── HTMLRenderer.tsx
    │   │   │   └── HybridRenderer.tsx
    │   │   ├── animations/    # Animation components
    │   │   │   ├── iPhoneSMSCSS.tsx
    │   │   │   ├── iPhoneSMSCSS.css
    │   │   │   ├── SimplePhone.tsx
    │   │   │   └── LogoSplitCSS.tsx
    │   │   ├── ProjectEditorModal.tsx
    │   │   ├── NewProjectModal.tsx
    │   │   ├── ComponentRenderer.tsx
    │   │   ├── ComponentCreator.tsx
    │   │   ├── ComponentPropertiesPanel.tsx
    │   │   ├── TimelineTabBar.tsx
    │   │   └── iPhoneSMSComponent.tsx
    │   ├── lib/
    │   │   ├── api.ts         # API client
    │   │   ├── componentRegistry.ts  # Component registry
    │   │   ├── componentSchemas.ts   # Component property schemas
    │   │   └── assetRegistry.ts      # Asset management
    │   ├── hooks/
    │   │   └── useTimelineTabs.ts    # Timeline tab state management
    │   └── types/
    │       ├── index.ts       # TypeScript types
    │       └── timeline.ts    # Timeline-specific types
    └── public/                # Static assets
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

## Current Development Setup (WORKING)

### Local Development Commands
```bash
# Start both services (run in separate terminals)
cd /Users/tgrossman/Documents/Cursor/VideoAutomation/backend
npm start                     # Backend on port 3001

cd /Users/tgrossman/Documents/Cursor/VideoAutomation/frontend  
npm run dev                   # Frontend on port 3000

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/templates
curl http://localhost:3001/api/projects
```

### Environment Files (CRITICAL)
- **Backend**: `backend/.env` - Contains `DATABASE_URL` for Heroku PostgreSQL
- **Frontend**: `frontend/.env.local` - Contains `NEXT_PUBLIC_API_URL=http://localhost:3001`

### Database Configuration
- **Local Backend**: Connects to Heroku PostgreSQL database with SSL
- **SSL Config**: Fixed in `backend/config/postgres.js` to enable SSL for Heroku database
- **Migration Script**: Updated to load environment variables with `require('dotenv').config()`

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
1. **Immediate**: Integrate timeline tab bar into main timeline UI
2. **Then**: Implement grouping functionality (select items, create groups)
3. **Then**: Add SMS sub-clip animation system (message appear, typing, dictation)
4. **Then**: Implement video export functionality with CSS animations
5. **Then**: Add more component types and animations
6. **Then**: Implement SQS job queue for video rendering
7. **Then**: Create basic FFmpeg rendering service
8. **Then**: Add collaborative features (real-time editing, comments)

## Important Notes
- Backend is fully functional and deployed
- Database is seeded with sample data
- All API endpoints are working and tested
- Git is configured with correct user (`tjg-salesforce`)
- Heroku app is live and accessible
- Frontend is complete with advanced timeline editor
- Timeline editor has professional-grade features matching video editing software
- All drag/drop, snapping, and layer management features are working
- CSS-based animation system is implemented and ready for video export

## Troubleshooting
- If backend won't start: Check `DATABASE_URL` environment variable
- If API returns errors: Check Heroku logs with `heroku logs --tail`
- If database issues: Run migrations again with `node scripts/migrations.js`
- If Git issues: Verify user with `git config user.name` and `git config user.email`

---
*This context file should be read at the start of each new development session to understand current progress and next steps.*
