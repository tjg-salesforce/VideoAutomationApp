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

// GET /api/projects - Get all projects for a user
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query;
    const userId = ownerId || 'default-user'; // Default user for MVP

    const projects = await Project.getByOwner(userId);
    res.json({
      success: true,
      data: projects.map(project => project.toJSON())
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get projects' 
    });
  }
});

// GET /api/projects/:id - Get a specific project
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.getById(id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    res.json({
      success: true,
      data: project.toJSON()
    });
  } catch (error) {
    console.error('Error getting project:', error);
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
