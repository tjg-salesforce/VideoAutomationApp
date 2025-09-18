# Video Automation Platform (Code Name: "Vibe-Code")

## Current Project Status (Updated)

### ✅ COMPLETED (Month 1 - Backend Foundation)
- **Backend Infrastructure**: Node.js/Express.js backend deployed on Heroku
- **Database**: PostgreSQL database with Heroku addon (switched from Firebase due to corporate restrictions)
- **API Endpoints**: Full CRUD operations for projects, templates, and components
- **Database Schema**: Complete with projects, templates, and components tables
- **Sample Data**: Database seeded with sample templates and components
- **Authentication**: Git configured with tjg-salesforce user
- **Deployment**: Backend successfully deployed to Heroku at `video-automation-backend-7178f3c7577d.herokuapp.com`

### 🔄 IN PROGRESS
- **Frontend Development**: Next.js frontend setup (next task)

### ⏳ PENDING (Month 1)
- **Job Queue**: Amazon SQS integration for video rendering
- **Rendering Service**: Basic FFmpeg microservice

### 📋 UPCOMING (Month 2-3)
- **Frontend UI**: Project dashboard, timeline, preview canvas
- **Collaboration**: Project locking and shared viewing
- **Error Handling**: Dead-letter queue for failed jobs

## Technical Implementation Details

### Current Architecture
- **Backend**: Node.js/Express.js on Heroku
- **Database**: PostgreSQL (Heroku Postgres Essential-0)
- **API**: RESTful endpoints for CRUD operations
- **Deployment**: Heroku with automatic Git integration
- **Version Control**: Git with tjg-salesforce user

### Database Schema (PostgreSQL)
```sql
-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES templates(id),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    metadata JSONB
);

-- Templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Components table
CREATE TABLE components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    file_path VARCHAR(500),
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
```

### API Endpoints (Currently Working)
- `GET /health` - Health check
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get specific template
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `GET /api/components` - List all components
- `GET /api/components/:id` - Get specific component
- `POST /api/components` - Create new component
- `PUT /api/components/:id` - Update component
- `DELETE /api/components/:id` - Delete component
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Sample Data (Seeded)
- **Templates**: 2 sample templates (Sales Demo, Training Video)
- **Components**: 4 sample components (Logo, Sound Effect, Transition, Background)

## Project Context & Business Case

### Problem Statement
The current video creation workflow for Solutions Engineers at Salesforce is a fragile, time-consuming, and manual process. It is based on a brittle, desktop-centric pipeline (Google Forms, App Script, Python, Adobe After Effects) that suffers from a "cascading failure paradox." This process is inefficient, not collaborative, and requires specialized skills, leading to significant time waste (~80 hours per video).

### Vision
To build a robust, scalable, and user-friendly web platform that replaces the current system. This platform will enable Solutions Engineers (SEs) to create professional, branded, and customizable demo videos in minutes, not days or weeks. The platform will serve as a central hub for collaborative editing and a library of modular, reusable video components.

### Key Value Proposition
- **Drastically Reduced Time**: Reduce video creation time from weeks to minutes
- **Lowered Skill Barrier**: Enable SEs without video editing expertise to produce high-quality videos
- **Enhanced Collaboration**: Provide a central, online platform for team members to collaboratively create and manage video projects
- **Proactive Campaigns**: The system should support automated video creation based on pre-defined templates for sales campaigns

## Architectural Blueprint: The Hybrid Microservices Model

The most viable architecture for this project is a hybrid, API-first, asynchronous microservices model. This decouples the resource-intensive rendering process from the user interface, ensuring a resilient and scalable system.

### Frontend (The Editor)
A dynamic, responsive web application built with React (likely within a Next.js framework). This will provide a real-time, low-latency editing experience. It will be the user's primary interface for selecting templates, filling in "merge fields," and arranging modular components on a timeline.

### Backend (The API & Orchestrator)
A lightweight microservice built with Node.js or Python. This service will handle all API requests for project management (saving, loading, etc.) and will act as the "producer" for rendering jobs. It will be deployed on a Platform as a Service (PaaS) like Heroku for simplified management.

### Job Queue (The Backbone)
A managed message queue is critical for resilience. Amazon SQS is the primary recommendation due to its reliability, scalability, and "pay-as-you-go" model, which is ideal for a solo developer. The job queue will hold all video render requests.

### Rendering Microservice (The Engine)
A separate, independent microservice that acts as the "consumer" for the job queue. It will pull render jobs from the queue and perform the heavy lifting. This service will use a powerful, open-source library like FFmpeg to execute the video manipulation tasks.

### Database (The Project State)
A NoSQL database is the ideal choice for its flexible, schemaless document model. Cloud Firestore is the recommended solution. It will store project data, customizable fields, component libraries, and render history. This flexibility is crucial for supporting a wide range of modular templates without complex database migrations.

### File Storage (The Assets)
All video, image, and motion graphics assets will be stored in a cloud storage solution like Amazon S3 or Google Cloud Storage. This centralizes assets, eliminates the need for local file storage on SEs' machines, and provides a single source of truth for all projects.

## MVP Roadmap (3-Month Phased Plan)

This roadmap is designed to build a stable, functional MVP that proves the core concept and provides immediate value, while laying the groundwork for future features.

### Month 1: The Core Backend & Data Foundation

**Goal**: Establish a robust, asynchronous architecture that can reliably process render jobs and store project data.

**Key Milestones**:
- Set up a Node.js/Python backend on Heroku
- Integrate and configure Amazon SQS as the job queue
- Model and implement the Cloud Firestore schema for projects, templates, and components
- Develop a basic rendering microservice that can accept a simple render job and execute an FFmpeg command to combine a video and a text overlay

### Month 2: The Single-User Editor

**Goal**: Build a user-facing web application that can create and manage a single project.

**Key Milestones**:
- Set up the frontend with Next.js and React
- Build the core UI: a project dashboard, a timeline component, and a real-time preview canvas
- Connect the frontend to the backend API to save and load projects from Firestore
- Implement the "Render" button, which sends a job to the SQS queue and updates the project's status in Firestore
- Integrate a video player for preview and a basic asset library viewer

### Month 3: Asynchronous Collaboration & MVP Launch

**Goal**: Introduce the first level of collaboration by enabling shared project viewing and providing a solid user experience.

**Key Milestones**:
- Implement the "project lock" feature in Firestore. When a user opens a project for editing, a lockedBy field is updated. Other users can view the project but cannot edit it until the lock is released
- Build the dashboard to show a user's projects and their current render status
- Implement error handling and a "dead-letter queue" for failed jobs
- Deploy a working MVP that can perform the end-to-end process: create a project, fill out a template, render a video, and share a link to the final output

## Technology Stack

### Frontend
- **Framework**: Next.js with React
- **UI Components**: Modern, responsive design
- **State Management**: React Context or Redux
- **Video Player**: Custom or library-based video player component

### Backend
- **Runtime**: Node.js or Python
- **Framework**: Express.js (Node.js) or FastAPI (Python)
- **Deployment**: Heroku (PaaS)

### Infrastructure
- **Job Queue**: Amazon SQS
- **Database**: Cloud Firestore (NoSQL)
- **File Storage**: Amazon S3 or Google Cloud Storage
- **Video Processing**: FFmpeg

### Development Tools
- **Version Control**: Git
- **Package Management**: npm/yarn (Node.js) or pip (Python)
- **Environment Management**: Environment variables for configuration

## Success Metrics

### Technical Metrics
- Video rendering time < 5 minutes for standard templates
- System uptime > 99.5%
- API response time < 200ms for standard operations
- Concurrent user support: 50+ users

### Business Metrics
- Video creation time reduction: 80+ hours → < 1 hour
- User adoption rate among SEs
- Template reusability rate
- Collaboration frequency (shared projects)

## Risk Mitigation

### Technical Risks
- **Rendering Performance**: Mitigated by using FFmpeg and cloud-based rendering
- **Scalability**: Addressed through microservices architecture and managed services
- **Data Loss**: Prevented through Firestore's built-in redundancy and backup

### Business Risks
- **User Adoption**: Addressed through intuitive UI and gradual feature rollout
- **Resource Constraints**: Mitigated by using managed services and pay-as-you-go pricing

## Future Enhancements (Post-MVP)

### Phase 2: Advanced Collaboration
- Real-time collaborative editing
- Comment and feedback system
- Version control and branching

### Phase 3: AI Integration
- Automated video generation from scripts
- Smart template recommendations
- Voice-over generation

### Phase 4: Enterprise Features
- Advanced analytics and reporting
- Custom branding and white-labeling
- Integration with Salesforce CRM

---

*This document serves as the comprehensive blueprint for building the Video Automation Platform. It is optimized for AI-assisted development and provides all necessary context for implementation.*
