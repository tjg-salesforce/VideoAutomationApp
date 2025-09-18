# Database Setup Guide

This guide explains how to set up and configure Cloud Firestore for the Video Automation Platform.

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud project with Firestore enabled
2. **Service Account**: Create a service account with Firestore permissions
3. **Environment Variables**: Configure the required environment variables

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Firestore API
4. Create a Firestore database (choose "Native mode")

### 2. Create Service Account

1. Go to IAM & Admin > Service Accounts
2. Click "Create Service Account"
3. Name: `video-automation-service`
4. Description: `Service account for Video Automation Platform`
5. Click "Create and Continue"
6. Grant the following roles:
   - `Cloud Datastore User`
   - `Firebase Admin`
7. Click "Done"

### 3. Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file

### 4. Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

**Important**: 
- Replace `\n` with actual newlines in the private key
- The private key should be wrapped in quotes
- Get these values from the downloaded JSON key file

### 5. Deploy to Heroku

Set the environment variables in Heroku:

```bash
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set FIREBASE_PRIVATE_KEY_ID=your-private-key-id
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
heroku config:set FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
heroku config:set FIREBASE_CLIENT_ID=your-client-id
```

## Database Schema

### Collections

#### 1. `projects`
Stores video projects created by users.

**Fields:**
- `id` (string): Unique project identifier
- `name` (string): Project name
- `description` (string): Project description
- `templateId` (string): Reference to template used
- `status` (string): Project status (draft, rendering, completed, failed)
- `ownerId` (string): User who owns the project
- `lockedBy` (string): User currently editing (for collaboration)
- `mergeFields` (object): Key-value pairs for template variables
- `timeline` (array): Project timeline components
- `settings` (object): Project settings (resolution, frameRate, duration)
- `renderSettings` (object): Render settings (quality, format, codec)
- `outputUrl` (string): URL to rendered video
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last update timestamp
- `lastRenderedAt` (timestamp): Last render timestamp

#### 2. `templates`
Stores reusable video templates.

**Fields:**
- `id` (string): Unique template identifier
- `name` (string): Template name
- `description` (string): Template description
- `category` (string): Template category (general, sales, demo, training)
- `thumbnailUrl` (string): Template thumbnail image URL
- `previewUrl` (string): Template preview video URL
- `duration` (number): Template duration in seconds
- `resolution` (string): Template resolution
- `frameRate` (number): Template frame rate
- `mergeFields` (array): Template variable definitions
- `timeline` (array): Template timeline structure
- `assets` (array): Required assets
- `isActive` (boolean): Whether template is active
- `createdBy` (string): User who created template
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last update timestamp
- `version` (string): Template version

#### 3. `components`
Stores reusable video components (videos, images, audio, etc.).

**Fields:**
- `id` (string): Unique component identifier
- `name` (string): Component name
- `type` (string): Component type (video, image, text, audio, transition)
- `category` (string): Component category
- `description` (string): Component description
- `thumbnailUrl` (string): Component thumbnail URL
- `previewUrl` (string): Component preview URL
- `assetUrl` (string): Component asset URL
- `duration` (number): Component duration in seconds
- `resolution` (string): Component resolution
- `fileSize` (number): File size in bytes
- `mimeType` (string): MIME type
- `tags` (array): Search tags
- `properties` (object): Component-specific properties
- `isActive` (boolean): Whether component is active
- `createdBy` (string): User who created component
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last update timestamp

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects for a user
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/lock` - Lock project for editing
- `POST /api/projects/:id/unlock` - Unlock project
- `POST /api/projects/:id/render` - Start render process

### Templates
- `GET /api/templates` - Get all active templates
- `GET /api/templates/:id` - Get specific template
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Components
- `GET /api/components` - Get all active components
- `GET /api/components/:id` - Get specific component
- `POST /api/components` - Create new component
- `PUT /api/components/:id` - Update component
- `DELETE /api/components/:id` - Delete component

## Seeding Data

To populate the database with sample data:

```bash
# Local development
node scripts/seedData.js

# Or programmatically
const { seedData } = require('./scripts/seedData');
await seedData();
```

## Security Rules

For production, configure Firestore security rules to restrict access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Projects: Users can only access their own projects
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         request.auth.uid == resource.data.lockedBy);
    }
    
    // Templates: Read-only for authenticated users
    match /templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Components: Read-only for authenticated users
    match /components/{componentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

## Monitoring

Monitor your Firestore usage in the Google Cloud Console:
- Go to Firestore > Usage
- Monitor read/write operations
- Set up billing alerts
- Review query performance
