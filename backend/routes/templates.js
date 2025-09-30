const express = require('express');
const router = express.Router();
const Template = require('../models/TemplatePG');
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
          duration, resolution, frame_rate, is_active, created_by,
          created_at, updated_at, version
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
  try {
    console.log('Creating template with data:', JSON.stringify(req.body, null, 2));
    
    const templateData = {
      ...req.body,
      createdBy: req.body.createdBy || 'default-user' // TODO: Get from auth
    };

    const template = new Template(templateData);
    await template.save();

    res.status(201).json({
      success: true,
      data: template.toJSON()
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create template' 
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
