const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Import routes
const projectsRouter = require('./routes/projects');
const templatesRouter = require('./routes/templates');
const componentsRouter = require('./routes/components');
const foldersRouter = require('./routes/folders');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(compression()); // Enable gzip compression
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'video-automation-backend'
  });
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/components', componentsRouter);
app.use('/api/folders', foldersRouter);

// Migration endpoint
app.post('/api/migrate', async (req, res) => {
  try {
    const { query } = require('./config/postgres');
    console.log('Running database migrations...');
    
    // Add settings column to templates table
    await query(`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'
    `);
    
    // Create folders table
    await query(`
      CREATE TABLE IF NOT EXISTS folders (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id UUID REFERENCES folders(id) ON DELETE SET NULL,
        owner_id VARCHAR(255) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes for folders
    await query(`
      CREATE INDEX IF NOT EXISTS idx_folders_owner_id ON folders(owner_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id)
    `);
    
    // Add folder_id to projects table
    await query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL
    `);
    
    // Create index on projects.folder_id
    await query(`
      CREATE INDEX IF NOT EXISTS idx_projects_folder_id ON projects(folder_id)
    `);
    
    console.log('Database migrations completed successfully');
    
    res.json({
      success: true,
      message: 'Database migrations completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Migration failed: ' + error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Video Automation Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for ports: 3000, 3001, 3005`);
});

module.exports = app;
