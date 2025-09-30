const express = require('express');
const router = express.Router();
const Project = require('../models/ProjectPG');
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

// GET /api/projects - Get all projects for a user (lightweight list)
router.get('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const { ownerId, lightweight } = req.query;
    const userId = ownerId || 'default-user'; // Default user for MVP

    console.log(`Loading projects for user ${userId} (lightweight: ${lightweight})...`);

    if (lightweight === 'true') {
      // Lightweight query - only get basic project info, not heavy JSONB fields
      const { query } = require('../config/postgres');
      const queryStartTime = Date.now();
      const result = await query(`
        SELECT id, name, description, status, created_at, updated_at 
        FROM projects 
        WHERE owner_id = $1 
        ORDER BY updated_at DESC
      `, [userId]);
      const queryTime = Date.now() - queryStartTime;
      
      const totalTime = Date.now() - startTime;
      console.log(`Projects loaded: ${result.rows.length} projects in ${queryTime}ms (query) + ${totalTime - queryTime}ms (processing) = ${totalTime}ms total`);
      
      res.json({
        success: true,
        data: result.rows
      });
    } else {
      // Full query with all data
      const projects = await Project.getByOwner(userId);
      const totalTime = Date.now() - startTime;
      console.log(`Full projects loaded: ${projects.length} projects in ${totalTime}ms`);
      
      res.json({
        success: true,
        data: projects.map(project => project.toJSON())
      });
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Error getting projects after ${totalTime}ms:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get projects' 
    });
  }
});

// GET /api/projects/:id - Get a specific project
router.get('/:id', async (req, res) => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    console.log(`Loading project ${id}...`);
    
    // Use direct SQL query for better performance with specific columns
    const { query } = require('../config/postgres');
    const result = await query(`
      SELECT 
        id, name, description, template_id, status, owner_id, locked_by,
        merge_fields, timeline, settings, render_settings, output_url,
        created_at, updated_at, last_rendered_at
      FROM projects 
      WHERE id = $1
    `, [id]);
    
    const loadTime = Date.now() - startTime;
    
    if (result.rows.length === 0) {
      console.log(`Project ${id} not found (${loadTime}ms)`);
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    const row = result.rows[0];
    const projectData = {
      id: row.id,
      name: row.name,
      description: row.description,
      template_id: row.template_id,
      status: row.status,
      owner_id: row.owner_id,
      locked_by: row.locked_by,
      merge_fields: row.merge_fields,
      timeline: row.timeline,
      settings: row.settings,
      render_settings: row.render_settings,
      output_url: row.output_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_rendered_at: row.last_rendered_at
    };
    
    const totalTime = Date.now() - startTime;
    console.log(`Project ${id} loaded successfully: ${loadTime}ms (query) + ${Date.now() - startTime - loadTime}ms (processing) = ${totalTime}ms total`);

    res.json({
      success: true,
      data: projectData
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Error getting project ${req.params.id} after ${totalTime}ms:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get project' 
    });
  }
});

// POST /api/projects - Create a new project
router.post('/', async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      owner_id: req.body.ownerId || req.body.owner_id || 'default-user' // Map ownerId to owner_id
    };

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      data: project.toJSON()
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create project' 
    });
  }
});

// PUT /api/projects/:id - Update a project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.getById(id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // Check if project is locked by another user
    if (project.lockedBy && project.lockedBy !== req.body.userId) {
      return res.status(423).json({ 
        success: false,
        error: 'Project is locked by another user' 
      });
    }

    await project.update(req.body);

    res.json({
      success: true,
      data: project.toJSON()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update project' 
    });
  }
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.getById(id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    await project.delete();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete project' 
    });
  }
});

// POST /api/projects/:id/lock - Lock project for editing
router.post('/:id/lock', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId is required' 
      });
    }

    const project = await Project.getById(id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    if (project.lockedBy && project.lockedBy !== userId) {
      return res.status(423).json({ 
        success: false,
        error: 'Project is already locked by another user' 
      });
    }

    await project.lock(userId);

    res.json({
      success: true,
      data: project.toJSON()
    });
  } catch (error) {
    console.error('Error locking project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to lock project' 
    });
  }
});

// POST /api/projects/:id/unlock - Unlock project
router.post('/:id/unlock', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.getById(id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    await project.unlock();

    res.json({
      success: true,
      data: project.toJSON()
    });
  } catch (error) {
    console.error('Error unlocking project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to unlock project' 
    });
  }
});

// POST /api/projects/:id/render - Start rendering process
router.post('/:id/render', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.getById(id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // Update project status to rendering
    await project.updateRenderStatus('rendering');

    // TODO: Send job to SQS queue for rendering
    // For now, just return success
    res.json({
      success: true,
      message: 'Render job started',
      data: project.toJSON()
    });
  } catch (error) {
    console.error('Error starting render:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start render' 
    });
  }
});

module.exports = router;
