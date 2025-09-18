require('dotenv').config();
const { query, initializePostgres } = require('../config/postgres');

const createTables = async () => {
  console.log('🏗️  Creating database tables...');

  // Projects table
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      template_id UUID,
      status VARCHAR(50) DEFAULT 'draft',
      owner_id VARCHAR(255) NOT NULL,
      locked_by VARCHAR(255),
      merge_fields JSONB DEFAULT '{}',
      timeline JSONB DEFAULT '[]',
      settings JSONB DEFAULT '{}',
      render_settings JSONB DEFAULT '{}',
      output_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_rendered_at TIMESTAMP WITH TIME ZONE
    )
  `);

  // Templates table
  await query(`
    CREATE TABLE IF NOT EXISTS templates (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) DEFAULT 'general',
      thumbnail_url TEXT,
      preview_url TEXT,
      duration INTEGER DEFAULT 0,
      resolution VARCHAR(50) DEFAULT '1920x1080',
      frame_rate INTEGER DEFAULT 30,
      merge_fields JSONB DEFAULT '[]',
      timeline JSONB DEFAULT '[]',
      assets JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_by VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      version VARCHAR(20) DEFAULT '1.0.0'
    )
  `);

  // Components table
  await query(`
    CREATE TABLE IF NOT EXISTS components (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      category VARCHAR(100) DEFAULT 'general',
      description TEXT,
      thumbnail_url TEXT,
      preview_url TEXT,
      asset_url TEXT,
      duration INTEGER DEFAULT 0,
      resolution VARCHAR(50),
      file_size BIGINT DEFAULT 0,
      mime_type VARCHAR(100),
      tags JSONB DEFAULT '[]',
      properties JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_by VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create indexes for better performance
  await query(`
    CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
  `);
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  `);
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
  `);
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
  `);
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_components_type ON components(type);
  `);
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
  `);
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_components_is_active ON components(is_active);
  `);

  // Create GIN indexes for JSONB columns
  await query(`
    CREATE INDEX IF NOT EXISTS idx_projects_merge_fields_gin ON projects USING GIN (merge_fields);
  `);
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_components_tags_gin ON components USING GIN (tags);
  `);

  console.log('✅ Database tables created successfully!');
};

const seedData = async () => {
  console.log('🌱 Seeding sample data...');

  // Seed templates
  const templates = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Sales Demo - Product Overview',
      description: 'A professional template for showcasing product features and benefits',
      category: 'sales',
      duration: 120,
      resolution: '1920x1080',
      frame_rate: 30,
      merge_fields: [
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
      created_by: 'system'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Training Video - Process Walkthrough',
      description: 'Step-by-step process demonstration template',
      category: 'training',
      duration: 180,
      resolution: '1920x1080',
      frame_rate: 30,
      merge_fields: [
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
      created_by: 'system'
    }
  ];

  for (const template of templates) {
    await query(`
      INSERT INTO templates (
        id, name, description, category, duration, resolution, frame_rate,
        merge_fields, timeline, assets, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO NOTHING
    `, [
      template.id, template.name, template.description, template.category,
      template.duration, template.resolution, template.frame_rate,
      JSON.stringify(template.merge_fields), JSON.stringify(template.timeline),
      JSON.stringify(template.assets), template.created_by
    ]);
  }

  // Seed components
  const components = [
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Salesforce Logo',
      type: 'image',
      category: 'branding',
      description: 'Official Salesforce logo',
      asset_url: 'https://example.com/salesforce-logo.png',
      thumbnail_url: 'https://example.com/salesforce-logo-thumb.png',
      resolution: '512x512',
      mime_type: 'image/png',
      tags: ['logo', 'salesforce', 'branding'],
      properties: {
        aspectRatio: '1:1',
        transparent: true
      },
      created_by: 'system'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Success Sound Effect',
      type: 'audio',
      category: 'effects',
      description: 'Positive completion sound',
      asset_url: 'https://example.com/success-sound.mp3',
      duration: 2,
      mime_type: 'audio/mpeg',
      tags: ['success', 'completion', 'positive'],
      properties: {
        volume: 0.7,
        loop: false
      },
      created_by: 'system'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
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
      created_by: 'system'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Corporate Background',
      type: 'video',
      category: 'backgrounds',
      description: 'Professional office background video',
      asset_url: 'https://example.com/corporate-bg.mp4',
      thumbnail_url: 'https://example.com/corporate-bg-thumb.jpg',
      duration: 30,
      resolution: '1920x1080',
      frame_rate: 30,
      mime_type: 'video/mp4',
      file_size: 5000000,
      tags: ['corporate', 'office', 'professional', 'background'],
      properties: {
        loop: true,
        muted: true
      },
      created_by: 'system'
    }
  ];

  for (const component of components) {
    await query(`
      INSERT INTO components (
        id, name, type, category, description, asset_url, thumbnail_url,
        duration, resolution, mime_type, file_size, tags, properties, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO NOTHING
    `, [
      component.id, component.name, component.type, component.category,
      component.description, component.asset_url, component.thumbnail_url,
      component.duration, component.resolution, component.mime_type,
      component.file_size, JSON.stringify(component.tags),
      JSON.stringify(component.properties), component.created_by
    ]);
  }

  console.log('✅ Sample data seeded successfully!');
};

const runMigrations = async () => {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Initialize PostgreSQL connection
    initializePostgres();
    
    // Create tables
    await createTables();
    
    // Seed sample data
    await seedData();
    
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { createTables, seedData, runMigrations };
