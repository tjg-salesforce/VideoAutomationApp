const { query } = require('../config/postgres');
const { v4: uuidv4 } = require('uuid');

class Component {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.type = data.type || 'video';
    this.category = data.category || 'general';
    this.description = data.description || '';
    this.thumbnail_url = data.thumbnail_url || '';
    this.preview_url = data.preview_url || '';
    this.asset_url = data.asset_url || '';
    this.duration = data.duration || 0;
    this.resolution = data.resolution || '';
    this.file_size = data.file_size || 0;
    this.mime_type = data.mime_type || '';
    this.tags = data.tags || [];
    this.properties = data.properties || {};
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_by = data.created_by || null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Save component to PostgreSQL
  async save() {
    const sql = `
      INSERT INTO components (
        id, name, type, category, description, thumbnail_url, preview_url,
        asset_url, duration, resolution, file_size, mime_type, tags,
        properties, is_active, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        thumbnail_url = EXCLUDED.thumbnail_url,
        preview_url = EXCLUDED.preview_url,
        asset_url = EXCLUDED.asset_url,
        duration = EXCLUDED.duration,
        resolution = EXCLUDED.resolution,
        file_size = EXCLUDED.file_size,
        mime_type = EXCLUDED.mime_type,
        tags = EXCLUDED.tags,
        properties = EXCLUDED.properties,
        is_active = EXCLUDED.is_active,
        created_by = EXCLUDED.created_by,
        updated_at = EXCLUDED.updated_at
    `;

    const values = [
      this.id, this.name, this.type, this.category,
      this.description, this.thumbnail_url, this.preview_url,
      this.asset_url, this.duration, this.resolution,
      this.file_size, this.mime_type, JSON.stringify(this.tags),
      JSON.stringify(this.properties), this.is_active,
      this.created_by, this.created_at, this.updated_at
    ];

    try {
      await query(sql, values);
      return this;
    } catch (error) {
      console.error('Error saving component:', error);
      throw error;
    }
  }

  // Get component by ID
  static async getById(id) {
    const sql = 'SELECT * FROM components WHERE id = $1';
    try {
      const result = await query(sql, [id]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return new Component({
          id: row.id,
          name: row.name,
          type: row.type,
          category: row.category,
          description: row.description,
          thumbnail_url: row.thumbnail_url,
          preview_url: row.preview_url,
          asset_url: row.asset_url,
          duration: row.duration,
          resolution: row.resolution,
          file_size: row.file_size,
          mime_type: row.mime_type,
          tags: row.tags,
          properties: row.properties,
          is_active: row.is_active,
          created_by: row.created_by,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
      }
      return null;
    } catch (error) {
      console.error('Error getting component:', error);
      throw error;
    }
  }

  // Get all active components
  static async getAllActive() {
    const sql = 'SELECT * FROM components WHERE is_active = true ORDER BY name';
    try {
      const result = await query(sql);
      return result.rows.map(row => new Component({
        id: row.id,
        name: row.name,
        type: row.type,
        category: row.category,
        description: row.description,
        thumbnail_url: row.thumbnail_url,
        preview_url: row.preview_url,
        asset_url: row.asset_url,
        duration: row.duration,
        resolution: row.resolution,
        file_size: row.file_size,
        mime_type: row.mime_type,
        tags: row.tags,
        properties: row.properties,
        is_active: row.is_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting active components:', error);
      throw error;
    }
  }

  // Get components by type
  static async getByType(type) {
    const sql = 'SELECT * FROM components WHERE type = $1 AND is_active = true ORDER BY name';
    try {
      const result = await query(sql, [type]);
      return result.rows.map(row => new Component({
        id: row.id,
        name: row.name,
        type: row.type,
        category: row.category,
        description: row.description,
        thumbnail_url: row.thumbnail_url,
        preview_url: row.preview_url,
        asset_url: row.asset_url,
        duration: row.duration,
        resolution: row.resolution,
        file_size: row.file_size,
        mime_type: row.mime_type,
        tags: row.tags,
        properties: row.properties,
        is_active: row.is_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting components by type:', error);
      throw error;
    }
  }

  // Get components by category
  static async getByCategory(category) {
    const sql = 'SELECT * FROM components WHERE category = $1 AND is_active = true ORDER BY name';
    try {
      const result = await query(sql, [category]);
      return result.rows.map(row => new Component({
        id: row.id,
        name: row.name,
        type: row.type,
        category: row.category,
        description: row.description,
        thumbnail_url: row.thumbnail_url,
        preview_url: row.preview_url,
        asset_url: row.asset_url,
        duration: row.duration,
        resolution: row.resolution,
        file_size: row.file_size,
        mime_type: row.mime_type,
        tags: row.tags,
        properties: row.properties,
        is_active: row.is_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting components by category:', error);
      throw error;
    }
  }

  // Search components by tags
  static async searchByTags(tags) {
    const sql = 'SELECT * FROM components WHERE is_active = true';
    try {
      const result = await query(sql);
      return result.rows
        .map(row => new Component({
          id: row.id,
          name: row.name,
          type: row.type,
          category: row.category,
          description: row.description,
          thumbnail_url: row.thumbnail_url,
          preview_url: row.preview_url,
          asset_url: row.asset_url,
          duration: row.duration,
          resolution: row.resolution,
          file_size: row.file_size,
          mime_type: row.mime_type,
          tags: row.tags,
          properties: row.properties,
          is_active: row.is_active,
          created_by: row.created_by,
          created_at: row.created_at,
          updated_at: row.updated_at
        }))
        .filter(component => 
          tags.some(tag => component.tags.includes(tag))
        );
    } catch (error) {
      console.error('Error searching components by tags:', error);
      throw error;
    }
  }

  // Update component
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        if (key === 'tags' || key === 'properties') {
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

    const sql = `UPDATE components SET ${fields.join(', ')} WHERE id = $${paramCount + 1}`;

    try {
      await query(sql, values);
      
      // Update local instance
      Object.assign(this, updateData);
      this.updated_at = new Date();
      return this;
    } catch (error) {
      console.error('Error updating component:', error);
      throw error;
    }
  }

  // Delete component (soft delete)
  async delete() {
    return this.update({ is_active: false });
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      description: this.description,
      thumbnailUrl: this.thumbnail_url,
      previewUrl: this.preview_url,
      assetUrl: this.asset_url,
      duration: this.duration,
      resolution: this.resolution,
      fileSize: this.file_size,
      mimeType: this.mime_type,
      tags: this.tags,
      properties: this.properties,
      isActive: this.is_active,
      createdBy: this.created_by,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }
}

module.exports = Component;
