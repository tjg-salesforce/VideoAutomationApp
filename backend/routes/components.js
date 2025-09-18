const express = require('express');
const router = express.Router();
const Component = require('../models/ComponentPG');
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

// GET /api/components - Get all active components
router.get('/', async (req, res) => {
  try {
    const { type, category, tags } = req.query;
    
    let components;
    
    if (type) {
      components = await Component.getByType(type);
    } else if (category) {
      components = await Component.getByCategory(category);
    } else if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      components = await Component.searchByTags(tagArray);
    } else {
      components = await Component.getAllActive();
    }

    res.json({
      success: true,
      data: components.map(component => component.toJSON())
    });
  } catch (error) {
    console.error('Error getting components:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get components' 
    });
  }
});

// GET /api/components/:id - Get a specific component
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await Component.getById(id);
    
    if (!component) {
      return res.status(404).json({ 
        success: false,
        error: 'Component not found' 
      });
    }

    res.json({
      success: true,
      data: component.toJSON()
    });
  } catch (error) {
    console.error('Error getting component:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get component' 
    });
  }
});

// POST /api/components - Create a new component
router.post('/', async (req, res) => {
  try {
    const componentData = {
      ...req.body,
      createdBy: req.body.createdBy || 'default-user' // TODO: Get from auth
    };

    const component = new Component(componentData);
    await component.save();

    res.status(201).json({
      success: true,
      data: component.toJSON()
    });
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create component' 
    });
  }
});

// PUT /api/components/:id - Update a component
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await Component.getById(id);
    
    if (!component) {
      return res.status(404).json({ 
        success: false,
        error: 'Component not found' 
      });
    }

    await component.update(req.body);

    res.json({
      success: true,
      data: component.toJSON()
    });
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update component' 
    });
  }
});

// DELETE /api/components/:id - Delete a component (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await Component.getById(id);
    
    if (!component) {
      return res.status(404).json({ 
        success: false,
        error: 'Component not found' 
      });
    }

    await component.delete();

    res.json({
      success: true,
      message: 'Component deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete component' 
    });
  }
});

module.exports = router;
