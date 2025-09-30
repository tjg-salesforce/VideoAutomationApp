const { query } = require('../config/postgres');
const { v4: uuidv4 } = require('uuid');

class Project {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.description = data.description || '';
    this.template_id = data.template_id || null;
    this.status = data.status || 'draft'; // draft, rendering, completed, failed
    this.owner_id = data.owner_id || null;
    this.locked_by = data.locked_by || null; // For collaboration
    this.merge_fields = data.merge_fields || {}; // JSON object for template variables
    this.timeline = data.timeline || []; // JSON array of timeline components
    this.settings = data.settings || {
      resolution: '1920x1080',
      frame_rate: 30,
      duration: 0
    };
    this.render_settings = data.render_settings || {
      quality: 'high',
      format: 'mp4',
      codec: 'h264'
    };
    this.output_url = data.output_url || null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.last_rendered_at = data.last_rendered_at || null;
  }

  // Save project to PostgreSQL
  async save() {
    const sql = `
      INSERT INTO projects (
        id, name, description, template_id, status, owner_id, locked_by,
        merge_fields, timeline, settings, render_settings, output_url,
        created_at, updated_at, last_rendered_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        template_id = EXCLUDED.template_id,
        status = EXCLUDED.status,
        owner_id = EXCLUDED.owner_id,
        locked_by = EXCLUDED.locked_by,
        merge_fields = EXCLUDED.merge_fields,
        timeline = EXCLUDED.timeline,
        settings = EXCLUDED.settings,
        render_settings = EXCLUDED.render_settings,
        output_url = EXCLUDED.output_url,
        updated_at = EXCLUDED.updated_at,
        last_rendered_at = EXCLUDED.last_rendered_at
    `;

    const values = [
      this.id, this.name, this.description, this.template_id, this.status,
      this.owner_id, this.locked_by, JSON.stringify(this.merge_fields),
      JSON.stringify(this.timeline), JSON.stringify(this.settings),
      JSON.stringify(this.render_settings), this.output_url,
      this.created_at, this.updated_at, this.last_rendered_at
    ];

    try {
      await query(sql, values);
      return this;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  // Get project by ID
  static async getById(id) {
    const sql = 'SELECT * FROM projects WHERE id = $1';
    try {
      const result = await query(sql, [id]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return new Project({
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
        });
      }
      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  // Get all projects for a user
  static async getByOwner(ownerId) {
    const sql = 'SELECT * FROM projects WHERE owner_id = $1 ORDER BY updated_at DESC';
    try {
      const result = await query(sql, [ownerId]);
      return result.rows.map(row => new Project({
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
      }));
    } catch (error) {
      console.error('Error getting projects by owner:', error);
      throw error;
    }
  }

  // Update project
  async update(updateData) {
    console.log(`Project.update called with data:`, JSON.stringify(updateData, null, 2));
    
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        if (key === 'merge_fields' || key === 'timeline' || key === 'settings' || key === 'render_settings') {
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

    const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount + 1}`;
    console.log(`Executing SQL: ${sql}`);
    console.log(`With values:`, values);

    try {
      await query(sql, values);
      
      // Update local instance
      Object.assign(this, updateData);
      this.updated_at = new Date();
      return this;
    } catch (error) {
      console.error('Error updating project:', error);
      console.error('SQL that failed:', sql);
      console.error('Values that failed:', values);
      throw error;
    }
  }

  // Lock project for editing
  async lock(userId) {
    return this.update({ locked_by: userId });
  }

  // Unlock project
  async unlock() {
    return this.update({ locked_by: null });
  }

  // Delete project
  async delete() {
    const sql = 'DELETE FROM projects WHERE id = $1';
    try {
      await query(sql, [this.id]);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Update render status
  async updateRenderStatus(status, outputUrl = null) {
    const updateData = {
      status,
      last_rendered_at: new Date()
    };
    
    if (outputUrl) {
      updateData.output_url = outputUrl;
    }
    
    return this.update(updateData);
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      templateId: this.template_id,
      status: this.status,
      ownerId: this.owner_id,
      lockedBy: this.locked_by,
      mergeFields: this.merge_fields,
      timeline: this.timeline,
      settings: this.settings,
      renderSettings: this.render_settings,
      outputUrl: this.output_url,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      lastRenderedAt: this.last_rendered_at
    };
  }
}

module.exports = Project;
