const { getFirestore } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Template {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.description = data.description || '';
    this.category = data.category || 'general'; // general, sales, demo, training
    this.thumbnailUrl = data.thumbnailUrl || '';
    this.previewUrl = data.previewUrl || '';
    this.duration = data.duration || 0; // in seconds
    this.resolution = data.resolution || '1920x1080';
    this.frameRate = data.frameRate || 30;
    this.mergeFields = data.mergeFields || []; // Array of field definitions
    this.timeline = data.timeline || []; // Template timeline structure
    this.assets = data.assets || []; // Required assets (videos, images, audio)
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdBy = data.createdBy || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.version = data.version || '1.0.0';
  }

  // Save template to Firestore
  async save() {
    const db = getFirestore();
    const templateData = {
      ...this,
      updatedAt: new Date()
    };

    try {
      await db.collection('templates').doc(this.id).set(templateData);
      return this;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  // Get template by ID
  static async getById(id) {
    const db = getFirestore();
    try {
      const doc = await db.collection('templates').doc(id).get();
      if (doc.exists) {
        return new Template({ id: doc.id, ...doc.data() });
      }
      return null;
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }

  // Get all active templates
  static async getAllActive() {
    const db = getFirestore();
    try {
      const snapshot = await db.collection('templates')
        .where('isActive', '==', true)
        .orderBy('name')
        .get();
      
      return snapshot.docs.map(doc => new Template({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting active templates:', error);
      throw error;
    }
  }

  // Get templates by category
  static async getByCategory(category) {
    const db = getFirestore();
    try {
      const snapshot = await db.collection('templates')
        .where('category', '==', category)
        .where('isActive', '==', true)
        .orderBy('name')
        .get();
      
      return snapshot.docs.map(doc => new Template({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting templates by category:', error);
      throw error;
    }
  }

  // Update template
  async update(updateData) {
    const db = getFirestore();
    try {
      const templateData = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await db.collection('templates').doc(this.id).update(templateData);
      
      // Update local instance
      Object.assign(this, templateData);
      return this;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  // Delete template (soft delete)
  async delete() {
    return this.update({ isActive: false });
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      thumbnailUrl: this.thumbnailUrl,
      previewUrl: this.previewUrl,
      duration: this.duration,
      resolution: this.resolution,
      frameRate: this.frameRate,
      mergeFields: this.mergeFields,
      timeline: this.timeline,
      assets: this.assets,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }
}

module.exports = Template;
