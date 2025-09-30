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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(compression()); // Enable gzip compression
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
