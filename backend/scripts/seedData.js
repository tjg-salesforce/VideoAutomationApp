const { initializeFirebase } = require('../config/firebase');
const Template = require('../models/Template');
const Component = require('../models/Component');

const seedTemplates = async () => {
  console.log('🌱 Seeding templates...');
  
  const templates = [];

  for (const templateData of templates) {
    const template = new Template(templateData);
    await template.save();
    console.log(`✅ Created template: ${template.name}`);
  }
};

const seedComponents = async () => {
  console.log('🌱 Seeding components...');
  
  const components = [
    {
      name: 'Salesforce Logo',
      type: 'image',
      category: 'branding',
      description: 'Official Salesforce logo',
      assetUrl: 'https://example.com/salesforce-logo.png',
      thumbnailUrl: 'https://example.com/salesforce-logo-thumb.png',
      resolution: '512x512',
      mimeType: 'image/png',
      tags: ['logo', 'salesforce', 'branding'],
      properties: {
        aspectRatio: '1:1',
        transparent: true
      },
      createdBy: 'system'
    },
    {
      name: 'Success Sound Effect',
      type: 'audio',
      category: 'effects',
      description: 'Positive completion sound',
      assetUrl: 'https://example.com/success-sound.mp3',
      duration: 2,
      mimeType: 'audio/mpeg',
      tags: ['success', 'completion', 'positive'],
      properties: {
        volume: 0.7,
        loop: false
      },
      createdBy: 'system'
    },
    {
      name: 'Fade In Transition',
      type: 'transition',
      category: 'effects',
      description: 'Smooth fade in effect',
      duration: 1,
      tags: ['fade', 'transition', 'smooth'],
      properties: {
        type: 'fadeIn',
        duration: 1000,
        easing: 'easeInOut'
      },
      createdBy: 'system'
    },
    {
      name: 'Corporate Background',
      type: 'video',
      category: 'backgrounds',
      description: 'Professional office background video',
      assetUrl: 'https://example.com/corporate-bg.mp4',
      thumbnailUrl: 'https://example.com/corporate-bg-thumb.jpg',
      duration: 30,
      resolution: '1920x1080',
      frameRate: 30,
      mimeType: 'video/mp4',
      fileSize: 5000000,
      tags: ['corporate', 'office', 'professional', 'background'],
      properties: {
        loop: true,
        muted: true
      },
      createdBy: 'system'
    }
  ];

  for (const componentData of components) {
    const component = new Component(componentData);
    await component.save();
    console.log(`✅ Created component: ${component.name}`);
  }
};

const seedData = async () => {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Initialize Firebase
    initializeFirebase();
    
    // Seed data
    await seedTemplates();
    await seedComponents();
    
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData, seedTemplates, seedComponents };
