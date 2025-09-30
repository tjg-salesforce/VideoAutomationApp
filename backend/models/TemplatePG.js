const { query } = require('../config/postgres');
const { v4: uuidv4 } = require('uuid');

class Template {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.description = data.description || '';
    this.category = data.category || 'general';
    this.thumbnail_url = data.thumbnail_url || '';
    this.preview_url = data.preview_url || '';
    this.duration = data.duration || 0;
    this.resolution = data.resolution || '1920x1080';
    this.frame_rate = data.frame_rate || 30;
    this.merge_fields = data.merge_fields || {};
    this.timeline = data.timeline || [];
    this.assets = data.assets || [];
    this.settings = data.settings || {};
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_by = data.created_by || null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.version = data.version || '1.0.0';
    
    // Log duration for debugging
    if (this.duration > 0) {
      console.log(`Template ${this.name} duration: ${this.duration}s`);
    }
    
    // Settings are stored separately and don't need to be in the timeline
  }

  // Save template to PostgreSQL
  async save() {
    console.log(`Saving template: ${this.name} (timeline items: ${this.timeline?.length || 0}, assets: ${this.assets?.length || 0})`);
    
    const sql = `
      INSERT INTO templates (
        id, name, description, category, thumbnail_url, preview_url,
        duration, resolution, frame_rate, merge_fields, timeline, assets, settings,
        is_active, created_by, created_at, updated_at, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        thumbnail_url = EXCLUDED.thumbnail_url,
        preview_url = EXCLUDED.preview_url,
        duration = EXCLUDED.duration,
        resolution = EXCLUDED.resolution,
        frame_rate = EXCLUDED.frame_rate,
        merge_fields = EXCLUDED.merge_fields,
        timeline = EXCLUDED.timeline,
        assets = EXCLUDED.assets,
        settings = EXCLUDED.settings,
        is_active = EXCLUDED.is_active,
        created_by = EXCLUDED.created_by,
        updated_at = EXCLUDED.updated_at,
        version = EXCLUDED.version
    `;

    // Pre-stringify large JSON objects to avoid timeout issues
    const startTime = Date.now();
    const mergeFieldsJson = JSON.stringify(this.merge_fields || {});
    const timelineJson = JSON.stringify(this.timeline || []);
    const assetsJson = JSON.stringify(this.assets || []);
    const settingsJson = JSON.stringify(this.settings || {});
    const jsonTime = Date.now() - startTime;
    
    if (jsonTime > 1000) {
      console.log(`JSON stringify took ${jsonTime}ms for template: ${this.name}`);
    }

    const values = [
      this.id, this.name, this.description, this.category,
      this.thumbnail_url, this.preview_url, this.duration,
      this.resolution, this.frame_rate, mergeFieldsJson,
      timelineJson, assetsJson, settingsJson,
      this.is_active, this.created_by, this.created_at,
      this.updated_at, this.version
    ];

    try {
      const saveStartTime = Date.now();
      await query(sql, values);
      const saveTime = Date.now() - saveStartTime;
      console.log(`Template saved successfully in ${saveTime}ms: ${this.name}`);
      return this;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  // Get template by ID
  static async getById(id) {
    const sql = 'SELECT * FROM templates WHERE id = $1';
    try {
      const result = await query(sql, [id]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return new Template({
          id: row.id,
          name: row.name,
          description: row.description,
          category: row.category,
          thumbnail_url: row.thumbnail_url,
          preview_url: row.preview_url,
          duration: row.duration,
          resolution: row.resolution,
          frame_rate: row.frame_rate,
          merge_fields: row.merge_fields,
          timeline: row.timeline,
          assets: row.assets,
          settings: row.settings || {},
          is_active: row.is_active,
          created_by: row.created_by,
          created_at: row.created_at,
          updated_at: row.updated_at,
          version: row.version
        });
      }
      return null;
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }

  // Get all active templates
  static async getAllActive() {
    const sql = 'SELECT * FROM templates WHERE is_active = true ORDER BY name';
    try {
      const result = await query(sql);
      return result.rows.map(row => new Template({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        thumbnail_url: row.thumbnail_url,
        preview_url: row.preview_url,
        duration: row.duration,
        resolution: row.resolution,
        frame_rate: row.frame_rate,
        merge_fields: row.merge_fields,
        timeline: row.timeline,
        assets: row.assets,
        settings: row.settings,
        is_active: row.is_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        version: row.version
      }));
    } catch (error) {
      console.error('Error getting active templates:', error);
      throw error;
    }
  }

  // Get templates by category
  static async getByCategory(category) {
    const sql = 'SELECT * FROM templates WHERE category = $1 AND is_active = true ORDER BY name';
    try {
      const result = await query(sql, [category]);
      return result.rows.map(row => new Template({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        thumbnail_url: row.thumbnail_url,
        preview_url: row.preview_url,
        duration: row.duration,
        resolution: row.resolution,
        frame_rate: row.frame_rate,
        merge_fields: row.merge_fields,
        timeline: row.timeline,
        assets: row.assets,
        settings: row.settings,
        is_active: row.is_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        version: row.version
      }));
    } catch (error) {
      console.error('Error getting templates by category:', error);
      throw error;
    }
  }

  // Update template
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        if (key === 'merge_fields' || key === 'timeline' || key === 'assets' || key === 'settings') {
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

    const sql = `UPDATE templates SET ${fields.join(', ')} WHERE id = $${paramCount + 1}`;

    try {
      await query(sql, values);
      
      // Update local instance
      Object.assign(this, updateData);
      this.updated_at = new Date();
      return this;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  // Delete template (soft delete)
  async delete() {
    return this.update({ is_active: false });
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      thumbnailUrl: this.thumbnail_url,
      previewUrl: this.preview_url,
      duration: this.duration,
      resolution: this.resolution,
      frameRate: this.frame_rate,
      mergeFields: this.merge_fields,
      timeline: this.timeline,
      assets: this.assets,
      settings: this.settings,
      isActive: this.is_active,
      createdBy: this.created_by,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      version: this.version
    };
  }
}

module.exports = Template;
