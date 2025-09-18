const { getFirestore } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Project {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.description = data.description || '';
    this.templateId = data.templateId || null;
    this.status = data.status || 'draft'; // draft, rendering, completed, failed
    this.ownerId = data.ownerId || null;
    this.lockedBy = data.lockedBy || null; // For collaboration
    this.mergeFields = data.mergeFields || {}; // Key-value pairs for template variables
    this.timeline = data.timeline || []; // Array of timeline components
    this.settings = data.settings || {
      resolution: '1920x1080',
      frameRate: 30,
      duration: 0
    };
    this.renderSettings = data.renderSettings || {
      quality: 'high',
      format: 'mp4',
      codec: 'h264'
    };
    this.outputUrl = data.outputUrl || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastRenderedAt = data.lastRenderedAt || null;
  }

  // Save project to Firestore
  async save() {
    const db = getFirestore();
    const projectData = {
      ...this,
      updatedAt: new Date()
    };

    try {
      await db.collection('projects').doc(this.id).set(projectData);
      return this;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  // Get project by ID
  static async getById(id) {
    const db = getFirestore();
    try {
      const doc = await db.collection('projects').doc(id).get();
      if (doc.exists) {
        return new Project({ id: doc.id, ...doc.data() });
      }
      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  // Get all projects for a user
  static async getByOwner(ownerId) {
    const db = getFirestore();
    try {
      const snapshot = await db.collection('projects')
        .where('ownerId', '==', ownerId)
        .orderBy('updatedAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => new Project({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting projects by owner:', error);
      throw error;
    }
  }

  // Update project
  async update(updateData) {
    const db = getFirestore();
    try {
      const projectData = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await db.collection('projects').doc(this.id).update(projectData);
      
      // Update local instance
      Object.assign(this, projectData);
      return this;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Lock project for editing
  async lock(userId) {
    return this.update({ lockedBy: userId });
  }

  // Unlock project
  async unlock() {
    return this.update({ lockedBy: null });
  }

  // Delete project
  async delete() {
    const db = getFirestore();
    try {
      await db.collection('projects').doc(this.id).delete();
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
      lastRenderedAt: new Date()
    };
    
    if (outputUrl) {
      updateData.outputUrl = outputUrl;
    }
    
    return this.update(updateData);
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      templateId: this.templateId,
      status: this.status,
      ownerId: this.ownerId,
      lockedBy: this.lockedBy,
      mergeFields: this.mergeFields,
      timeline: this.timeline,
      settings: this.settings,
      renderSettings: this.renderSettings,
      outputUrl: this.outputUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastRenderedAt: this.lastRenderedAt
    };
  }
}

module.exports = Project;
