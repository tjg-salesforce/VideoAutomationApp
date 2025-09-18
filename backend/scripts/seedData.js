const { initializeFirebase } = require('../config/firebase');
const Template = require('../models/Template');
const Component = require('../models/Component');

const seedTemplates = async () => {
  console.log('🌱 Seeding templates...');
  
  const templates = [
    {
      name: 'Sales Demo - Product Overview',
      description: 'A professional template for showcasing product features and benefits',
      category: 'sales',
      duration: 120,
      resolution: '1920x1080',
      frameRate: 30,
      mergeFields: [
        { key: 'productName', label: 'Product Name', type: 'text', required: true },
        { key: 'customerName', label: 'Customer Name', type: 'text', required: true },
        { key: 'keyBenefit', label: 'Key Benefit', type: 'text', required: true },
        { key: 'ctaText', label: 'Call to Action', type: 'text', required: true }
      ],
      timeline: [
        {
          id: 'intro',
          type: 'text',
          startTime: 0,
          duration: 3,
          content: 'Welcome {{customerName}}, let me show you {{productName}}',
          style: { fontSize: 48, color: '#ffffff', fontFamily: 'Arial' }
        },
        {
          id: 'benefit',
          type: 'text',
          startTime: 3,
          duration: 5,
          content: '{{keyBenefit}}',
          style: { fontSize: 36, color: '#00ff00', fontFamily: 'Arial' }
        },
        {
          id: 'cta',
          type: 'text',
          startTime: 8,
          duration: 4,
          content: '{{ctaText}}',
          style: { fontSize: 32, color: '#ff0000', fontFamily: 'Arial' }
        }
      ],
      assets: [
        { type: 'background', url: 'https://example.com/background.jpg' },
        { type: 'logo', url: 'https://example.com/logo.png' }
      ],
      createdBy: 'system'
    },
    {
      name: 'Training Video - Process Walkthrough',
      description: 'Step-by-step process demonstration template',
      category: 'training',
      duration: 180,
      resolution: '1920x1080',
      frameRate: 30,
      mergeFields: [
        { key: 'processName', label: 'Process Name', type: 'text', required: true },
        { key: 'stepCount', label: 'Number of Steps', type: 'number', required: true },
        { key: 'instructorName', label: 'Instructor Name', type: 'text', required: true }
      ],
      timeline: [
        {
          id: 'title',
          type: 'text',
          startTime: 0,
          duration: 5,
          content: '{{processName}} Training',
          style: { fontSize: 42, color: '#ffffff', fontFamily: 'Arial' }
        },
        {
          id: 'instructor',
          type: 'text',
          startTime: 5,
          duration: 3,
          content: 'Presented by {{instructorName}}',
          style: { fontSize: 24, color: '#cccccc', fontFamily: 'Arial' }
        }
      ],
      assets: [
        { type: 'background', url: 'https://example.com/training-bg.jpg' }
      ],
      createdBy: 'system'
    }
  ];

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
