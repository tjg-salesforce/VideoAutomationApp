require('dotenv').config();
const { query, initializePostgres } = require('../config/postgres');

const cleanupSettingsData = async () => {
  console.log('🧹 Cleaning up settings-data components from existing data...');
  
  try {
    // Initialize database connection
    await initializePostgres();
    
    // Clean up templates
    console.log('Cleaning up templates...');
    const templatesResult = await query(`
      UPDATE templates 
      SET timeline = (
        SELECT jsonb_agg(item)
        FROM jsonb_array_elements(timeline) AS item
        WHERE item->>'id' != 'settings-data'
      )
      WHERE timeline @> '[{"id": "settings-data"}]'::jsonb
    `);
    console.log(`Updated ${templatesResult.rowCount} templates`);
    
    // Clean up projects
    console.log('Cleaning up projects...');
    const projectsResult = await query(`
      UPDATE projects 
      SET timeline = (
        SELECT jsonb_agg(item)
        FROM jsonb_array_elements(timeline) AS item
        WHERE item->>'id' != 'settings-data'
      )
      WHERE timeline @> '[{"id": "settings-data"}]'::jsonb
    `);
    console.log(`Updated ${projectsResult.rowCount} projects`);
    
    // Also clean up timelineLayers in project settings
    console.log('Cleaning up timelineLayers in project settings...');
    const timelineLayersResult = await query(`
      UPDATE projects 
      SET settings = jsonb_set(
        settings,
        '{timelineLayers}',
        (
          SELECT jsonb_agg(
            jsonb_set(
              layer,
              '{items}',
              (
                SELECT jsonb_agg(item)
                FROM jsonb_array_elements(layer->'items') AS item
                WHERE item->>'id' != 'settings-data'
              )
            )
          )
          FROM jsonb_array_elements(settings->'timelineLayers') AS layer
        )
      )
      WHERE settings->'timelineLayers' @> '[{"items": [{"id": "settings-data"}]}]'::jsonb
    `);
    console.log(`Updated ${timelineLayersResult.rowCount} projects with timelineLayers cleanup`);
    
    console.log('✅ Settings data cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
};

cleanupSettingsData();
