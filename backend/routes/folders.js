const express = require('express');
const router = express.Router();
const Folder = require('../models/FolderPG');
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

// GET /api/folders - Get all folders for a user (tree structure)
router.get('/', async (req, res) => {
  try {
    const { ownerId, tree } = req.query;
    const userId = ownerId || 'default-user';

    if (tree === 'true') {
      // Return tree structure
      const folderTree = await Folder.getTree(userId);
      res.json({
        success: true,
        data: folderTree
      });
    } else {
      // Return flat list
      const folders = await Folder.getByOwner(userId);
      res.json({
        success: true,
        data: folders.map(folder => folder.toJSON())
      });
    }
  } catch (error) {
    console.error('Error getting folders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get folders'
    });
  }
});

// GET /api/folders/:id - Get a specific folder
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.getById(id);

    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    res.json({
      success: true,
      data: folder.toJSON()
    });
  } catch (error) {
    console.error('Error getting folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get folder'
    });
  }
});

// GET /api/folders/:id/children - Get children of a folder
router.get('/:id/children', async (req, res) => {
  try {
    const { id } = req.params;
    const children = await Folder.getChildren(id);

    res.json({
      success: true,
      data: children.map(folder => folder.toJSON())
    });
  } catch (error) {
    console.error('Error getting folder children:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get folder children'
    });
  }
});

// POST /api/folders - Create a new folder
router.post('/', async (req, res) => {
  try {
    const { name, parentId, ownerId, metadata } = req.body;
    const userId = ownerId || 'default-user';

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }

    // Check if parent exists (if provided)
    if (parentId) {
      const parent = await Folder.getById(parentId);
      if (!parent) {
        return res.status(404).json({
          success: false,
          error: 'Parent folder not found'
        });
      }
    }

    const folder = new Folder({
      name: name.trim(),
      parent_id: parentId || null,
      owner_id: userId,
      metadata: metadata || {}
    });

    await folder.save();

    res.status(201).json({
      success: true,
      data: folder.toJSON()
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create folder',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/folders/:id - Update a folder
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId, metadata } = req.body;

    const folder = await Folder.getById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (parentId !== undefined) {
      // Check for circular references
      const canMove = await Folder.canMoveTo(id, parentId);
      if (!canMove) {
        return res.status(400).json({
          success: false,
          error: 'Cannot move folder: would create circular reference'
        });
      }
      updateData.parent_id = parentId || null;
    }
    if (metadata !== undefined) updateData.metadata = metadata;

    await folder.update(updateData);

    res.json({
      success: true,
      data: folder.toJSON()
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update folder'
    });
  }
});

// PATCH /api/folders/:id/move - Move folder to new parent
router.patch('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;

    const folder = await Folder.getById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    await folder.moveTo(parentId || null);

    res.json({
      success: true,
      data: folder.toJSON()
    });
  } catch (error) {
    console.error('Error moving folder:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to move folder'
    });
  }
});

// DELETE /api/folders/:id - Delete a folder
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cascadeToParent } = req.query;

    const folder = await Folder.getById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Check if folder has projects
    const projectsResult = await query(
      'SELECT COUNT(*) as count FROM projects WHERE folder_id = $1',
      [id]
    );
    const projectCount = parseInt(projectsResult.rows[0].count);

    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete folder: contains ${projectCount} project(s). Move projects first.`
      });
    }

    await folder.delete(cascadeToParent === 'true');

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete folder'
    });
  }
});

module.exports = router;

