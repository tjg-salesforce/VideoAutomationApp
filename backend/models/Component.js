const { getFirestore } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Component {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.type = data.type || 'video'; // video, image, text, audio, transition
    this.category = data.category || 'general';
    this.description = data.description || '';
    this.thumbnailUrl = data.thumbnailUrl || '';
    this.previewUrl = data.previewUrl || '';
    this.assetUrl = data.assetUrl || '';
    this.duration = data.duration || 0; // in seconds
    this.resolution = data.resolution || '1920x1080';
    this.fileSize = data.fileSize || 0; // in bytes
    this.mimeType = data.mimeType || '';
    this.tags = data.tags || [];
    this.properties = data.properties || {}; // Component-specific properties
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdBy = data.createdBy || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Save component to Firestore
  async save() {
    const db = getFirestore();
    const componentData = {
      ...this,
      updatedAt: new Date()
    };

    try {
      await db.collection('components').doc(this.id).set(componentData);
      return this;
    } catch (error) {
      console.error('Error saving component:', error);
      throw error;
    }
  }

  // Get component by ID
  static async getById(id) {
    const db = getFirestore();
    try {
      const doc = await db.collection('components').doc(id).get();
      if (doc.exists) {
        return new Component({ id: doc.id, ...doc.data() });
      }
      return null;
    } catch (error) {
      console.error('Error getting component:', error);
      throw error;
    }
  }

  // Get all active components
  static async getAllActive() {
    const db = getFirestore();
    try {
      const snapshot = await db.collection('components')
        .where('isActive', '==', true)
        .orderBy('name')
        .get();
      
      return snapshot.docs.map(doc => new Component({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting active components:', error);
      throw error;
    }
  }

  // Get components by type
  static async getByType(type) {
    const db = getFirestore();
    try {
      const snapshot = await db.collection('components')
        .where('type', '==', type)
        .where('isActive', '==', true)
        .orderBy('name')
        .get();
      
      return snapshot.docs.map(doc => new Component({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting components by type:', error);
      throw error;
    }
  }

  // Get components by category
  static async getByCategory(category) {
    const db = getFirestore();
    try {
      const snapshot = await db.collection('components')
        .where('category', '==', category)
        .where('isActive', '==', true)
        .orderBy('name')
        .get();
      
      return snapshot.docs.map(doc => new Component({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting components by category:', error);
      throw error;
    }
  }

  // Search components by tags
  static async searchByTags(tags) {
    const db = getFirestore();
    try {
      const snapshot = await db.collection('components')
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs
        .map(doc => new Component({ id: doc.id, ...doc.data() }))
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
    const db = getFirestore();
    try {
      const componentData = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await db.collection('components').doc(this.id).update(componentData);
      
      // Update local instance
      Object.assign(this, componentData);
      return this;
    } catch (error) {
      console.error('Error updating component:', error);
      throw error;
    }
  }

  // Delete component (soft delete)
  async delete() {
    return this.update({ isActive: false });
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      description: this.description,
      thumbnailUrl: this.thumbnailUrl,
      previewUrl: this.previewUrl,
      assetUrl: this.assetUrl,
      duration: this.duration,
      resolution: this.resolution,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      tags: this.tags,
      properties: this.properties,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Component;
