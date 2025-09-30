const express = require('express');
const router = express.Router();
const Template = require('../models/TemplatePG');
const { query } = require('../config/postgres');
const { initializePostgres } = require('../config/postgres');

// Initialize PostgreSQL on first request
router.use((req, res, next) => {
  try {
    initializePostgres();
    next();
  } catch (error) {
    console.error('PostgreSQL initialization error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// POST /api/templates/migrate - Run database migrations
router.post('/migrate', async (req, res) => {
  try {
    console.log('Running database migrations...');
    
    // Add settings column to templates table
    await query(`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'
    `);
    
    // Add performance indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_projects_id_hash ON projects USING hash(id);
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

// GET /api/templates - Get all active templates
router.get('/', async (req, res) => {
  try {
    const { category, lightweight } = req.query;
    
    // Use lightweight query for list views
    if (lightweight === 'true') {
      const { query } = require('../config/postgres');
      let sql = `
        SELECT 
          id, name, description, category, thumbnail_url, preview_url,
          duration, resolution, frame_rate, merge_fields, timeline, assets, settings,
          is_active, created_by, created_at, updated_at, version
        FROM templates 
        WHERE is_active = true
      `;
      const params = [];
      
      if (category) {
        sql += ' AND category = $1';
        params.push(category);
      }
      
      sql += ' ORDER BY name';
      
      const result = await query(sql, params);
      const templates = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        thumbnailUrl: row.thumbnail_url,
        previewUrl: row.preview_url,
        duration: row.duration,
        resolution: row.resolution,
        frameRate: row.frame_rate,
        mergeFields: row.merge_fields,
        timeline: row.timeline,
        assets: row.assets,
        settings: row.settings,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version
      }));

      res.json({
        success: true,
        data: templates
      });
    } else {
      // Full data for individual template views
      let templates;
      if (category) {
        templates = await Template.getByCategory(category);
      } else {
        templates = await Template.getAllActive();
      }

      res.json({
        success: true,
        data: templates.map(template => template.toJSON())
      });
    }
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get templates' 
    });
  }
});

// GET /api/templates/:id - Get a specific template
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.getById(id);
    
    if (!template) {
      return res.status(404).json({ 
        success: false,
        error: 'Template not found' 
      });
    }

    res.json({
      success: true,
      data: template.toJSON()
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get template' 
    });
  }
});

// POST /api/templates - Create a new template
router.post('/', async (req, res) => {
  const startTime = Date.now();
  try {
    console.log(`Creating template: ${req.body.name} (timeline items: ${req.body.timeline?.length || 0})`);
    
    // Ensure settings column exists before creating template
    try {
      await query(`
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'
      `);
      console.log('Settings column ensured');
    } catch (migrationError) {
      console.log('Migration error (may be expected):', migrationError.message);
    }
    
    const templateData = {
      ...req.body,
      createdBy: req.body.createdBy || 'default-user' // TODO: Get from auth
    };

    const template = new Template(templateData);
    await template.save();

    const totalTime = Date.now() - startTime;
    console.log(`Template creation completed in ${totalTime}ms: ${req.body.name}`);

    res.status(201).json({
      success: true,
      data: template.toJSON()
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Error creating template after ${totalTime}ms:`, error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create template';
    if (error.message.includes('timeout')) {
      errorMessage = 'Template creation timed out - try reducing the number of timeline items or assets';
    } else if (error.message.includes('too large')) {
      errorMessage = 'Template data is too large - try reducing the number of timeline items or assets';
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

// PUT /api/templates/:id - Update a template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.getById(id);
    
    if (!template) {
      return res.status(404).json({ 
        success: false,
        error: 'Template not found' 
      });
    }

    await template.update(req.body);

    res.json({
      success: true,
      data: template.toJSON()
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update template' 
    });
  }
});

// DELETE /api/templates/:id - Delete a template (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.getById(id);
    
    if (!template) {
      return res.status(404).json({ 
        success: false,
        error: 'Template not found' 
      });
    }

    await template.delete();

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete template' 
    });
  }
});

module.exports = router;
