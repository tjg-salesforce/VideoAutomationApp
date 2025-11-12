const { query } = require('../config/postgres');
const { v4: uuidv4 } = require('uuid');

class Folder {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.parent_id = data.parent_id || null;
    this.owner_id = data.owner_id || null;
    this.metadata = data.metadata || {}; // For account, opportunity, etc.
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Save folder to PostgreSQL
  async save() {
    const sql = `
      INSERT INTO folders (
        id, name, parent_id, owner_id, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        parent_id = EXCLUDED.parent_id,
        owner_id = EXCLUDED.owner_id,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at
    `;

    const values = [
      this.id,
      this.name,
      this.parent_id,
      this.owner_id,
      JSON.stringify(this.metadata),
      this.created_at,
      this.updated_at
    ];

    try {
      await query(sql, values);
      return this;
    } catch (error) {
      console.error('Error saving folder:', error);
      throw error;
    }
  }

  // Get folder by ID
  static async getById(id) {
    const sql = 'SELECT * FROM folders WHERE id = $1';
    try {
      const result = await query(sql, [id]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return new Folder({
          id: row.id,
          name: row.name,
          parent_id: row.parent_id,
          owner_id: row.owner_id,
          metadata: row.metadata,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
      }
      return null;
    } catch (error) {
      console.error('Error getting folder:', error);
      throw error;
    }
  }

  // Get all folders for a user (flat list)
  static async getByOwner(ownerId) {
    const sql = 'SELECT * FROM folders WHERE owner_id = $1 ORDER BY name ASC';
    try {
      const result = await query(sql, [ownerId]);
      return result.rows.map(row => new Folder({
        id: row.id,
        name: row.name,
        parent_id: row.parent_id,
        owner_id: row.owner_id,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting folders by owner:', error);
      throw error;
    }
  }

  // Get folder tree (recursive)
  static async getTree(ownerId) {
    // Get all folders for user
    const allFolders = await this.getByOwner(ownerId);
    
    // Build tree structure
    const folderMap = new Map();
    const rootFolders = [];

    // Create map of all folders (keep as Folder instances)
    allFolders.forEach(folder => {
      folderMap.set(folder.id, { folder, children: [] });
    });

    // Build tree
    allFolders.forEach(folder => {
      const folderNode = folderMap.get(folder.id);
      if (folder.parent_id && folderMap.has(folder.parent_id)) {
        folderMap.get(folder.parent_id).children.push(folderNode);
      } else {
        rootFolders.push(folderNode);
      }
    });

    // Convert to tree structure with toJSON
    const convertToTree = (node) => {
      return {
        ...node.folder.toJSON(),
        children: node.children.map(convertToTree)
      };
    };

    return rootFolders.map(convertToTree);
  }

  // Get children of a folder
  static async getChildren(folderId) {
    const sql = 'SELECT * FROM folders WHERE parent_id = $1 ORDER BY name ASC';
    try {
      const result = await query(sql, [folderId]);
      return result.rows.map(row => new Folder({
        id: row.id,
        name: row.name,
        parent_id: row.parent_id,
        owner_id: row.owner_id,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting folder children:', error);
      throw error;
    }
  }

  // Check if folder can be moved (prevent circular references)
  static async canMoveTo(folderId, newParentId) {
    if (!newParentId || folderId === newParentId) {
      return true; // Moving to root or same folder
    }

    // Check if newParentId is a descendant of folderId
    let currentParentId = newParentId;
    const visited = new Set();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        break; // Prevent infinite loop
      }
      visited.add(currentParentId);

      if (currentParentId === folderId) {
        return false; // Circular reference detected
      }

      const parent = await this.getById(currentParentId);
      if (!parent || !parent.parent_id) {
        break; // Reached root
      }
      currentParentId = parent.parent_id;
    }

    return true;
  }

  // Update folder
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        if (key === 'metadata') {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) return this;

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(this.id);

    const sql = `UPDATE folders SET ${fields.join(', ')} WHERE id = $${paramCount + 1}`;

    try {
      await query(sql, values);
      Object.assign(this, updateData);
      this.updated_at = new Date();
      return this;
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  }

  // Move folder to new parent
  async moveTo(newParentId) {
    // Check for circular references
    const canMove = await Folder.canMoveTo(this.id, newParentId);
    if (!canMove) {
      throw new Error('Cannot move folder: would create circular reference');
    }

    return this.update({ parent_id: newParentId || null });
  }

  // Delete folder (cascade to children - move them to parent or root)
  async delete(cascadeToParent = true) {
    const children = await Folder.getChildren(this.id);
    
    // Move children to this folder's parent (or root if no parent)
    for (const child of children) {
      if (cascadeToParent) {
        await child.moveTo(this.parent_id);
      } else {
        // Or move to root
        await child.moveTo(null);
      }
    }

    // Delete the folder
    const sql = 'DELETE FROM folders WHERE id = $1';
    try {
      await query(sql, [this.id]);
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      parentId: this.parent_id,
      ownerId: this.owner_id,
      metadata: this.metadata,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }

  // Convert to tree node (includes children)
  toTreeNode(children = []) {
    return {
      ...this.toJSON(),
      children: children.map(child => child.toTreeNode ? child.toTreeNode() : child.toJSON())
    };
  }
}

module.exports = Folder;

