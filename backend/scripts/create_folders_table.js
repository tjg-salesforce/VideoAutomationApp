const { query, initializePostgres } = require('../config/postgres');

async function createFoldersTable() {
  try {
    initializePostgres();
    
    console.log('Creating folders table...');
    
    // Create folders table
    await query(`
      CREATE TABLE IF NOT EXISTS folders (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id UUID REFERENCES folders(id) ON DELETE SET NULL,
        owner_id VARCHAR(255) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Folders table created');
    
    // Create indexes
    console.log('Creating indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_folders_owner_id ON folders(owner_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id)
    `);
    
    console.log('✅ Indexes created');
    
    // Add folder_id to projects table if it doesn't exist
    console.log('Adding folder_id to projects table...');
    try {
      await query(`
        ALTER TABLE projects 
        ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL
      `);
      console.log('✅ folder_id column added to projects');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  folder_id column already exists');
      } else {
        throw error;
      }
    }
    
    // Create index on projects.folder_id
    await query(`
      CREATE INDEX IF NOT EXISTS idx_projects_folder_id ON projects(folder_id)
    `);
    
    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

createFoldersTable();

