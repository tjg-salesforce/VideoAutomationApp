const express = require('express');
const router = express.Router();
const Project = require('../models/ProjectPG');
const { initializePostgres, query } = require('../config/postgres');

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
    const { ownerId, folderId, lightweight } = req.query;
    const userId = ownerId || 'default-user'; // Default user for MVP
    const isLightweight = lightweight === 'true';

    let projects;
    if (folderId && folderId !== 'null' && folderId !== 'root') {
      // Get projects in specific folder AND all subfolders (recursive)
      // Use recursive CTE to get all descendant folder IDs
      if (isLightweight) {
        // Only select essential fields for list view (much faster)
        const sql = `
          WITH RECURSIVE folder_tree AS (
            -- Base case: the selected folder
            SELECT id FROM folders WHERE id = $2 AND owner_id = $1
            UNION
            -- Recursive case: all children
            SELECT f.id 
            FROM folders f
            INNER JOIN folder_tree ft ON f.parent_id = ft.id
            WHERE f.owner_id = $1
          )
          SELECT p.id, p.name, p.description, p.template_id, p.status, p.owner_id, 
                 p.locked_by, p.folder_id, p.created_at, p.updated_at, 
                 p.last_rendered_at, p.output_url
          FROM projects p
          INNER JOIN folder_tree ft ON p.folder_id = ft.id
          WHERE p.owner_id = $1
          ORDER BY p.updated_at DESC
        `;
        
        const result = await query(sql, [userId, folderId]);
        projects = result.rows.map(row => {
          const project = new Project({
            id: row.id,
            name: row.name,
            description: row.description,
            template_id: row.template_id,
            status: row.status,
            owner_id: row.owner_id,
            locked_by: row.locked_by,
            folder_id: row.folder_id,
            merge_fields: {},
            timeline: [],
            settings: {},
            render_settings: {},
            output_url: row.output_url,
            created_at: row.created_at,
            updated_at: row.updated_at,
            last_rendered_at: row.last_rendered_at
          });
          return project;
        });
      } else {
        // Full project data
        const sql = `
          WITH RECURSIVE folder_tree AS (
            -- Base case: the selected folder
            SELECT id FROM folders WHERE id = $2 AND owner_id = $1
            UNION
            -- Recursive case: all children
            SELECT f.id 
            FROM folders f
            INNER JOIN folder_tree ft ON f.parent_id = ft.id
            WHERE f.owner_id = $1
          )
          SELECT p.*
          FROM projects p
          INNER JOIN folder_tree ft ON p.folder_id = ft.id
          WHERE p.owner_id = $1
          ORDER BY p.updated_at DESC
        `;
        
        const result = await query(sql, [userId, folderId]);
        projects = result.rows.map(row => {
          const project = new Project({
            id: row.id,
            name: row.name,
            description: row.description,
            template_id: row.template_id,
            status: row.status,
            owner_id: row.owner_id,
            locked_by: row.locked_by,
            folder_id: row.folder_id,
            merge_fields: row.merge_fields,
            timeline: row.timeline,
            settings: row.settings,
            render_settings: row.render_settings,
            output_url: row.output_url,
            created_at: row.created_at,
            updated_at: row.updated_at,
            last_rendered_at: row.last_rendered_at
          });
          return project;
        });
      }
    } else {
      if (isLightweight) {
        // Lightweight query for all projects
        const sql = `SELECT id, name, description, template_id, status, owner_id, locked_by, folder_id, 
                           created_at, updated_at, last_rendered_at, output_url
                     FROM projects 
                     WHERE owner_id = $1 
                     ORDER BY updated_at DESC`;
        const result = await query(sql, [userId]);
        projects = result.rows.map(row => {
          const project = new Project({
            id: row.id,
            name: row.name,
            description: row.description,
            template_id: row.template_id,
            status: row.status,
            owner_id: row.owner_id,
            locked_by: row.locked_by,
            folder_id: row.folder_id,
            merge_fields: {},
            timeline: [],
            settings: {},
            render_settings: {},
            output_url: row.output_url,
            created_at: row.created_at,
            updated_at: row.updated_at,
            last_rendered_at: row.last_rendered_at
          });
          return project;
        });
      } else {
        projects = await Project.getByOwner(userId);
      }
    }

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
  const startTime = Date.now();
  try {
    const { id } = req.params;
    console.log(`Loading project ${id}...`);
    
    // Use direct SQL query for better performance with specific columns
    const result = await query(`
      SELECT 
        id, name, description, template_id, status, owner_id, locked_by, folder_id,
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
      folder_id: row.folder_id,
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

    // Don't cache project data (it changes frequently)
    // But enable compression for large JSONB responses
    res.set('Cache-Control', 'no-cache');
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

    // If template_id is provided, fetch template data and copy it to the project
    if (projectData.template_id) {
      console.log(`Creating project from template: ${projectData.template_id}`);
      
      // Import Template model
      const Template = require('../models/TemplatePG');
      
      try {
        const template = await Template.getById(projectData.template_id);
        if (template) {
          console.log('Template found, copying data...');
          
          // Copy template data to project
          projectData.timeline = template.timeline || [];
          projectData.settings = template.settings || {
            resolution: template.resolution || '1920x1080',
            frame_rate: template.frame_rate || 30,
            duration: template.duration || 0
          };
          projectData.merge_fields = template.merge_fields || {};
          
          // Ensure duration is properly set from template
          if (template.duration && template.duration > 0) {
            projectData.settings.duration = template.duration;
          }
          
          console.log(`Template duration: ${template.duration}, Project duration: ${projectData.settings.duration}`);
          
          // Copy render settings if not provided
          if (!projectData.render_settings) {
            projectData.render_settings = {
              quality: 'high',
              format: 'mp4',
              codec: 'h264'
            };
          }
          
          console.log('Template data copied successfully');
        } else {
          console.log('Template not found, creating project without template data');
        }
      } catch (templateError) {
        console.error('Error fetching template:', templateError);
        // Continue with project creation even if template fetch fails
      }
    }

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
    console.log(`Updating project ${id} with data:`, JSON.stringify(req.body, null, 2));
    
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
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update project',
      details: error.message
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

// PATCH /api/projects/:id/move - Move project to folder
router.patch('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body; // null or folder ID

    const project = await Project.getById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Validate folder exists if provided
    if (folderId) {
      const Folder = require('../models/FolderPG');
      const folder = await Folder.getById(folderId);
      if (!folder) {
        return res.status(404).json({
          success: false,
          error: 'Folder not found'
        });
      }
    }

    // Ensure folder_id is properly formatted (null or UUID string)
    const updateFolderId = folderId && folderId !== 'null' && folderId !== 'root' ? folderId : null;
    await project.update({ folder_id: updateFolderId });

    res.json({
      success: true,
      data: project.toJSON()
    });
  } catch (error) {
    console.error('Error moving project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move project',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
