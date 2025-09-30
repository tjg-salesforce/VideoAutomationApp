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
- 0 templates: Placeholder templates removed
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

## 🔧 TEMPLATE SYSTEM (CURRENT ISSUE)

### Problem Identified
**Template creation works, but "Use Template" creates empty projects**

**Root Cause**: Database schema issue - the `settings` column is missing from the `templates` table in the remote AWS RDS database.

**Current Architecture**:
- **Frontend/Backend**: Running locally on localhost:3000/3001
- **Database**: Remote AWS RDS PostgreSQL (not local)
- **Template Data**: Complex layer-based system stored in `settings` field:
  - `timelineLayers` - Layer structure with items
  - `componentProperties` - Component-specific properties
  - `mediaAssets` - Media file data
  - `timelineTabs` - Tab organization
  - `mediaProperties` - Media-specific properties

**The Issue**: 
- Template creation saves basic data (name, description, timeline) but NOT the `settings` field
- The `settings` field contains all the complex layer data needed for templates
- Database migration to add `settings` column is failing silently
- Without `settings`, templates can't store the layer structure, component properties, and media data

**Attempted Solutions**:
1. ✅ Added migration endpoint to add `settings` column
2. ✅ Updated Template model to handle `settings` field
3. ✅ Added `SaveTemplateModal` for better UX
4. ❌ Database migration not working - `settings` column still missing
5. ❌ Workarounds (storing in `timeline`, `assets`, `merge_fields`) not working

**Next Steps**:
1. **Fix Database Schema**: Get the `settings` column added to the remote database
2. **Test Template Usage**: Verify templates copy all layer data to new projects
3. **Deploy to Heroku**: Get the full webapp running for demos

### Template System Architecture
- **Template Creation**: Save project with all layer data in `settings` field
- **Template Usage**: Copy `settings` data to new project
- **Data Structure**: Complex layer-based system with component properties
- **Database**: Needs `settings JSONB` column in `templates` table

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

## 🏗️ ARCHITECTURAL PRINCIPLES & BEST PRACTICES

### Core Development Philosophy
**"Build for Performance, Scalability, and Agility - Always"**

Every feature, function, and system must be designed with these principles in mind:

#### 1. **Scalability First** 🚀
- **Generic Solutions**: Build generic utilities that handle any number of items/properties
- **Future-Proof Design**: Code should work with features that don't exist yet
- **No Hardcoded Values**: Avoid magic numbers, hardcoded property names, or fixed limits
- **Dynamic Property Handling**: Use deep copying and generic inheritance patterns

#### 2. **State Consistency** 🔄
- **Complete State Capture**: Always save/restore ALL related state together
- **Atomic Operations**: Changes should be all-or-nothing (use history/undo system)
- **Single Source of Truth**: Avoid duplicate state that can get out of sync
- **Comprehensive History**: Include all state variables in undo/redo system

#### 3. **Performance Optimization** ⚡
- **Efficient Updates**: Use React state patterns that minimize re-renders
- **Lazy Loading**: Load data only when needed
- **Memory Management**: Clean up event listeners, timeouts, and references
- **Batch Operations**: Group related state updates together

#### 4. **Agility & Maintainability** 🔧
- **Modular Design**: Break complex features into reusable utilities
- **Clear Separation**: Separate concerns (UI, state, business logic, persistence)
- **Documentation**: Code should be self-documenting with clear naming
- **Error Handling**: Graceful degradation and user-friendly error messages

### Implementation Examples

#### ✅ **Good: Scalable Property Inheritance**
```typescript
// Generic utility that handles ANY properties, current or future
const inheritProperties = (originalItemId: string, newItemIds: string[]) => {
  // Automatically copies ALL media properties (scale, position, opacity, etc.)
  // Automatically copies ALL component properties (any custom settings)
  // Works with any number of new items
  // No hardcoded property names - completely dynamic
}
```

#### ❌ **Bad: Hardcoded Property Copying**
```typescript
// NOT scalable - hardcoded property names
const copyProperties = (original, newItem) => {
  newItem.scale = original.scale;
  newItem.position = original.position;
  // Would need to update this function for every new property
}
```

#### ✅ **Good: Automatic State Management System**
```typescript
// Centralized state configuration - automatically handles ALL state
const stateConfig = {
  timelineLayers: { getter: () => timelineLayers, setter: setTimelineLayers, default: [] },
  timelineTabs: { getter: () => timelineTabs, setter: setTimelineTabs, default: [] },
  mediaProperties: { getter: () => mediaProperties, setter: setMediaProperties, default: {} },
  componentProperties: { getter: () => componentProperties, setter: setComponentProperties, default: {} },
  selectedItems: { getter: () => Array.from(selectedItems), setter: (val: any[]) => setSelectedItems(new Set(val)), default: [] },
  currentTime: { getter: () => currentTime, setter: setCurrentTime, default: 0 },
  // Add new state variables here - they'll be automatically handled
};

// Automatic state capture - no manual intervention needed
const getAllState = () => {
  const state: any = {};
  Object.entries(stateConfig).forEach(([key, config]) => {
    state[key] = JSON.parse(JSON.stringify(config.getter()));
  });
  return state;
};

// Utility for state-changing operations - automatically saves to history
const withHistory = (operation: () => void) => {
  saveToHistory();
  operation();
};
```

#### ❌ **Bad: Manual State Management**
```typescript
// NOT scalable - must manually add each new state variable
const saveToHistory = () => {
  const currentState = {
    timelineLayers: JSON.parse(JSON.stringify(timelineLayers)),
    timelineTabs: JSON.parse(JSON.stringify(timelineTabs)),
    // What about new state variables? We'll forget to add them!
    // This causes state inconsistency and bugs
  };
}
```

### Scalable Development Patterns

#### **1. Automatic State Management** 🔄
**Pattern**: Centralized state configuration with automatic capture/restoration
```typescript
// ✅ Add new state variables here - they're automatically handled
const stateConfig = {
  existingState: { getter: () => existingState, setter: setExistingState, default: [] },
  newFeature: { getter: () => newFeature, setter: setNewFeature, default: null },
  // No need to update undo/redo, save/load, or any other state management
};
```

#### **2. Generic Property Inheritance** 🔄
**Pattern**: Deep copy utilities that handle any properties
```typescript
// ✅ Automatically inherits ALL properties, current and future
const inheritProperties = (originalItemId: string, newItemIds: string[]) => {
  // Works with any property type, any number of items
  // No hardcoded property names - completely dynamic
};
```

#### **3. Utility-First Operations** ⚡
**Pattern**: Wrap state-changing operations with utilities
```typescript
// ✅ Single operation with automatic history
const splitClip = (itemId: string, layerId: string, splitTime: number) => {
  withHistory(() => {
    // All the split logic here
    // History is automatically saved before the operation
  });
};

// ✅ Batch operations with single history save
const complexOperation = () => {
  withBatchHistory([
    () => setTimelineLayers(newLayers),
    () => setMediaProperties(newProperties),
    () => setComponentProperties(newComponentProperties)
  ]);
};
```

#### **4. Future-Proof Function Design** 🚀
**Pattern**: Functions that work with data that doesn't exist yet
```typescript
// ✅ Generic function that handles any item type
const processItems = (items: any[], processor: (item: any) => any) => {
  return items.map(processor);
};

// ✅ Property access that works with any item structure
const getItemName = (item: any) => {
  return item.asset?.name || item.component?.name || 'Unknown Item';
};
```

### Code Quality Standards

#### **Function Design**
- **Single Responsibility**: Each function should do one thing well
- **Pure Functions**: Avoid side effects when possible
- **Generic Parameters**: Use generic types and parameters
- **Clear Naming**: Function names should describe what they do
- **Future-Proof**: Design for data that doesn't exist yet

#### **State Management**
- **Immutable Updates**: Always create new objects/arrays, don't mutate
- **Batch Updates**: Group related state changes together
- **Consistent Patterns**: Use the same patterns throughout the codebase
- **Error Boundaries**: Handle errors gracefully
- **Automatic Capture**: Use centralized state management system

#### **Performance Considerations**
- **Memoization**: Use React.memo, useMemo, useCallback appropriately
- **Lazy Loading**: Load data only when needed
- **Efficient Rendering**: Minimize unnecessary re-renders
- **Memory Leaks**: Clean up subscriptions and event listeners
- **Batch Operations**: Use withBatchHistory for multiple state changes

### Testing & Validation

#### **Every Feature Must:**
1. **Work with existing data** (backward compatibility)
2. **Work with future data** (forward compatibility)
3. **Handle edge cases** (empty states, errors, limits)
4. **Maintain state consistency** (undo/redo works correctly)
5. **Perform well** (no unnecessary re-renders or API calls)

#### **Code Review Checklist**
- [ ] Is this solution generic and reusable?
- [ ] Does it handle edge cases gracefully?
- [ ] Is the state management consistent?
- [ ] Are there any hardcoded values that should be dynamic?
- [ ] Does it follow established patterns in the codebase?
- [ ] Is the error handling comprehensive?
- [ ] Will this scale with future features?

## Key Decisions Made
1. **Database**: Switched from Firebase to PostgreSQL due to corporate Google account restrictions
2. **Deployment**: Using Heroku due to Salesforce access
3. **Authentication**: Using `tjg-salesforce` Git user
4. **Architecture**: Hybrid microservices with API-first approach
5. **Development Philosophy**: Build for Performance, Scalability, and Agility - Always

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
1. **IMMEDIATE**: Fix database schema - add `settings` column to `templates` table
2. **Then**: Test template creation and usage with full layer data
3. **Then**: Deploy to Heroku for demos and sharing
4. **Then**: Implement grouping functionality (select items, create groups)
5. **Then**: Add SMS sub-clip animation system (message appear, typing, dictation)
6. **Then**: Implement video export functionality with CSS animations
7. **Then**: Add more component types and animations
8. **Then**: Implement SQS job queue for video rendering
9. **Then**: Create basic FFmpeg rendering service
10. **Then**: Add collaborative features (real-time editing, comments)

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
